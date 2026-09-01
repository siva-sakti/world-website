"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { updateBitContent, setPlacementLock } from "@/lib/db/bits";
import { MediaError } from "@/lib/media";
import { Card, type CardVM } from "./card";
import { DrawOverlay } from "./draw-overlay";
import { TagBar } from "./tag-bar";
import { WordsOffer } from "./words-offer";
import { Drawer } from "@/components/drawer";
import { registerSave } from "@/lib/save-guard";
import { duplicateBoard } from "@/lib/db/boards";
import { confirm } from "@/components/confirm";
import { usePersistence } from "./use-persistence";
import { useCamera } from "./use-camera";
import { useBoardKeys } from "./use-board-keys";
import { useMarqueeSelect } from "./use-marquee-select";
import { BoardToolbar } from "./board-toolbar";
import { useBoardActs } from "./use-board-acts";
import { useCreateDoors } from "./use-create-doors";

// The board's compose surface, on real data, on an infinite canvas. Local state
// drives the canvas for a snappy feel; every change mirrors to the database
// (debounced) through the one door. A camera (pan + zoom, useCamera) sits over an
// endless world of cards — drag empty space to pan, scroll to zoom. Card coordinates
// are world-space; creation/pen map screen → world so things land where you point.
export function BoardSurface({
  boardId,
  initialCards,
}: {
  boardId: string;
  initialCards: CardVM[];
}) {
  const [cards, setCards] = useState<CardVM[]>(initialCards);
  // The LIVE truth for undo's reverses (undo plan §3 / review amendment 3): closures
  // captured at gesture time must resolve placementId + lock state from the CURRENT
  // cards at reverse time — a call-in reconcile renames placement ids in state.
  const cardsRef = useRef<CardVM[]>(initialCards);
  // eslint-disable-next-line react-hooks/refs -- latest-value ref, same pattern as leaveBoard below
  cardsRef.current = cards;
  const [selectedIds, setSelectedIds] = useState<Set<string>>(() => new Set());
  const [selectMode, setSelectMode] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const dragStart = useRef<Map<string, { x: number; y: number }> | null>(null);
  const selectOne = (id: string) => setSelectedIds(new Set([id]));
  const clearSelection = () => setSelectedIds(new Set());
  const [drawMode, setDrawMode] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [converting, setConverting] = useState(0); // COUNT of HEICs mid-decode (a counter — the first of three finishing must not hide the notice)
  const [capturing, setCapturing] = useState(false); // a pasted link's server capture is slow — tell the user
  // The words-offer QUEUE (hunt #4): a multi-photo drop fires N imports; each offer
  // waits its turn — the prompt the owner is typing in is never replaced (it used to
  // remount blank on the next upload landing, and keep typing saved to the WRONG bit).
  const [wordsQueue, setWordsQueue] = useState<{ bitId: string; kind: "image" | "drawing" | "audio" | "pdf" | "link" }[]>([]);
  const wordsFor = wordsQueue[0] ?? null;
  const enqueueWords = (v: { bitId: string; kind: "image" | "drawing" | "audio" | "pdf" | "link" }) =>
    setWordsQueue((q) => (q.some((x) => x.bitId === v.bitId) ? q : [...q, v]));
  const [looseRefresh, setLooseRefresh] = useState(0); // bump → the loose column reloads
  const [isPanning, setIsPanning] = useState(false); // drives the grabbing cursor
  const [duplicating, setDuplicating] = useState(false); // the ⧉ act is in flight

  const boardRef = useRef<HTMLDivElement>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const audioRef = useRef<HTMLInputElement>(null);
  const pdfRef = useRef<HTMLInputElement>(null);
  const lastTap = useRef<{ t: number; x: number; y: number } | null>(null);
  const pan = useRef<{ sx: number; sy: number; cx: number; cy: number; moved: boolean } | null>(null);
  const [supabase] = useState(() => createClient());
  const router = useRouter();

  // Pan/zoom camera (incl. touch pinch) and rubber-band select.
  const { cam, camRef, setCam, screenToWorld, fitView, centerOn, fitOrToggleBack, zoomBy, zoomTo, pinchDown, pinchMove, pinchUp, scheduleSave, restoreView } =
    useCamera(boardRef, boardId);
  const marquee = useMarqueeSelect(boardRef, screenToWorld, setSelectedIds, clearSelection);

  function onErr(e: unknown) {
    console.error("board save failed:", e);
    setError(
      e instanceof MediaError
        ? e.message
        : "Couldn't save that — check your connection. Your work is still here.",
    );
  }

  // Debounced persistence through the one door (moves/edits coalesced; a move
  // waits for its card's create to land before writing).
  const { patchCard, saveContent, trackCreate, reconcileId, settled, forget, flushNow, flushAll, pendingCreates } =
    usePersistence(supabase, setCards, onErr);

  // Don't lose a move or a keystroke to the 350ms debounce. One stable door to
  // flushAll, fired when you leave the board and when the page goes away (a hidden
  // tab, a switched app, a closed window — lib/save-guard).
  const leaveBoard = useRef(flushAll);
  // eslint-disable-next-line react-hooks/refs -- latest-callback ref: registered once
  leaveBoard.current = flushAll;
  useEffect(() => registerSave(() => leaveBoard.current()), []);
  useEffect(() => () => { void leaveBoard.current(); }, []);

  // Duplicate this board (organize-phase-plan §4b): flush in-flight moves/edits FIRST so the
  // copy never misses your last drag, then copy (same bits, second arrangement), then the
  // dialog offers open-the-copy or stay-here — the owner's ruled flow.
  async function duplicateThis() {
    if (duplicating) return;
    setDuplicating(true);
    try {
      await flushAll();
      await pendingCreates(); // a just-dropped card's row must exist before the copy reads the board
      await Promise.allSettled([...removesInFlight.current]); // a just-removed card must be GONE before it (hunt #9)
      const copy = await duplicateBoard(supabase, boardId);
      const go = await confirm({
        message: `Duplicated — “${copy.title || "untitled board"}” now sits on your shelf, arranging these same bits.`,
        confirmLabel: "open the copy",
        cancelLabel: "stay here",
      });
      if (go) router.push(`/board/${copy.id}`);
    } catch (e) {
      onErr(e);
    } finally {
      setDuplicating(false);
    }
  }

  // "open" — the focused writing view (writing-experience-plan v1): the bit's own
  // page. Gated: the row must exist (a fresh card's insert may be in flight → the
  // page would 404), and the last keystrokes must be flushed (else the page loads
  // a stale body and its next save overwrites them — plan review finding 4).
  function openSelected(placementId: string, bitId: string) {
    settled(placementId)
      .then((id) => flushNow(id)) // the pending entry lives under the POST-reconcile key
      .then((ok) => {
        // Hunt #3: a failed save must not navigate — the destination would render the
        // STALE body and its next save would overwrite the words the flush re-queued.
        // The banner is already up (flush's onErr); staying here keeps the words safe.
        if (ok) router.push(`/bit/${bitId}`);
      })
      .catch(onErr);
  }

  // On open, frame the board's content so you never land on blank canvas.
  // On a PHONE (the CSS breakpoint, inclusive), fit-all computes a tiny scale —
  // open instead centered on the last-fronted card at 100%, readable; ⊹ fit is
  // one tap away for the overview. z ties (inbox-placed cards are all z=0)
  // resolve to the last in load order — arbitrary but stable (plan finding 8).
  useEffect(() => {
    if (restoreView()) return; // a remembered view wins — restores exactly where you left off
    if (!initialCards.length) return; // no memory + empty board → origin default
    if (window.matchMedia("(max-width: 640px)").matches) {
      let top = initialCards[0];
      for (const c of initialCards) if (c.z >= top.z) top = c;
      centerOn(top, 1);
    } else {
      fitView(initialCards);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function nextZ() {
    return cards.reduce((m, c) => Math.max(m, c.z), 0) + 1;
  }

  // Create doors — every way a card is born onto the surface, plus the board-born
  // bit's evaporate-if-empty lifecycle and the editor's markContentIfReal. Constructed
  // BEFORE the remove acts (R1.3a): the acts consult isFreshEmpty/clearFresh so a
  // remove on a never-had-content bit ABORTS it instead of minting blank litter.
  const { addNote, createTextCard, finishDoodle, onBoardDrop, onPickImage, onPickAudio, onPickPdf, bringIn, markContentIfReal, isFreshEmpty, clearFresh } =
    useCreateDoors({
      supabase, boardId, boardRef, screenToWorld, camRef, cards, setCards,
      setSelectedIds, selectOne, setEditingId, editingId, setDrawMode, nextZ,
      trackCreate, settled, reconcileId, setConverting, setCapturing, setWordsFor: enqueueWords, onErr,
    });

  // Remove acts (I-W1) — un-place / trash, singular + bulk — through the settled door.
  // In-flight removes registered so duplicateThis can await them (hunt #9): they are
  // neither pending patches nor creates, so flushAll + pendingCreates both miss them.
  const removesInFlight = useRef(new Set<Promise<unknown>>());
  const trackRemove = (p: Promise<unknown>) => {
    removesInFlight.current.add(p);
    void p.finally(() => removesInFlight.current.delete(p));
  };
  const { unplaceSelected, trashSelected, bulkUnplace, bulkTrash } = useBoardActs({
    supabase, cards, selectedIds, setCards, clearSelection,
    setEditingId, settled, flushNow, trackRemove, forget, setLooseRefresh, onErr, isFreshEmpty, clearFresh,
  });

  function select(placementId: string, bitId: string, additive: boolean) {
    // Selection moving off the editing card must also END the edit — otherwise editingId
    // strands (keyboard dead, two cards in contradictory states — review R1.2). Guarded:
    // re-clicking the editing card itself keeps the edit.
    if (editingId && editingId !== placementId) setEditingId(null);
    patchCard(placementId, bitId, { z: nextZ() }); // the clicked card comes to front
    setSelectedIds((prev) => {
      if (!additive) return new Set([placementId]);
      const next = new Set(prev);
      if (next.has(placementId)) next.delete(placementId);
      else next.add(placementId);
      return next;
    });
  }

  // ---- move-together (multi-select drag) ----
  // Record every selected card's start position, then on drag move ONLY the OTHER
  // selected cards (the dragged card stays entirely with react-rnd until stop, else
  // its controlled position fights the internal drag and it stutters — review). On
  // stop, persist each moved card through the settled-create door (keyed per card).
  function onCardDragStart(placementId: string) {
    if (selectedIds.size > 1 && selectedIds.has(placementId)) {
      const m = new Map<string, { x: number; y: number }>();
      // locked cards never join a group drag (the one skip point — move/end gate on starts.has()).
      // Keyed by bitId: a call-in reconcile can rename a placementId mid-drag; bitIds never rename
      // (and are unique per board — placement_bit_once).
      for (const c of cards) if (selectedIds.has(c.placementId) && !c.locked) m.set(c.bitId, { x: c.x, y: c.y });
      dragStart.current = m;
    } else {
      dragStart.current = null;
    }
  }
  // The map above is keyed by BIT id (see the comment there) — so every reader must
  // translate the incoming placementId to its card's bitId first. R1 changed the keys
  // and missed the readers: starts.has(placementId) was always false, and multi-select
  // drag silently moved only the grabbed card (senior review, 2026-09-01).
  function onCardDragMove(placementId: string, x: number, y: number) {
    const starts = dragStart.current;
    const dragged = cards.find((c) => c.placementId === placementId);
    if (!starts || !dragged || !starts.has(dragged.bitId)) return;
    const s = starts.get(dragged.bitId)!;
    const dx = x - s.x;
    const dy = y - s.y;
    setCards((cs) =>
      cs.map((c) => {
        if (c.placementId === placementId || !starts.has(c.bitId)) return c; // dragged card + non-selected: untouched
        const p0 = starts.get(c.bitId)!;
        return { ...c, x: p0.x + dx, y: p0.y + dy };
      }),
    );
  }
  function onCardDragEnd(placementId: string, x: number, y: number) {
    const starts = dragStart.current;
    dragStart.current = null;
    const dragged = cards.find((c) => c.placementId === placementId);
    if (!starts || !dragged || !starts.has(dragged.bitId)) return; // single drag: the card's own onChange persisted it
    const s = starts.get(dragged.bitId)!;
    const dx = x - s.x;
    const dy = y - s.y;
    for (const c of cards) {
      if (c.placementId === placementId || !starts.has(c.bitId)) continue;
      const p0 = starts.get(c.bitId)!;
      patchCard(c.placementId, c.bitId, { x: p0.x + dx, y: p0.y + dy }); // per-card independent save
    }
  }

  // The board's keyboard (use-board-keys — ordered guards, check-corrected): Escape is
  // TWO-step (edit → selected → clear), Delete = remove-from-this-board (the ruled
  // meaning), arrows nudge, Cmd+A selects all, Cmd+=/−/0 zoom.
  function nudgeSelected(dx: number, dy: number) {
    for (const c of cards) {
      if (!selectedIds.has(c.placementId) || c.locked) continue; // locked = position frozen
      patchCard(c.placementId, c.bitId, { x: c.x + dx, y: c.y + dy });
    }
  }
  function removeSelectedByKey() {
    if (selectedIds.size > 1) {
      bulkUnplace();
    } else {
      const pid = [...selectedIds][0];
      if (pid) unplaceSelected(pid);
    }
  }
  // Tidy up (owner-approved): arrange the selection in a neat grid at its own top-left.
  // Reading order = banded rows (raw (y,x) flips visually-level cards — the check's rule):
  // sort by y, a new row opens past a 40-world-px band, x within a row. Real rendered
  // sizes via data-pid (text heights are stale by design). One patchCard per card — the
  // normal save path.
  function tidySelected() {
    const chosen = cards.filter((c) => selectedIds.has(c.placementId) && !c.locked); // locked cards stay put
    if (chosen.length < 2) return;
    const meas = chosen.map((c) => {
      const el = document.querySelector(`[data-pid="${c.placementId}"]`);
      return {
        c,
        w: el instanceof HTMLElement ? el.offsetWidth : c.w,
        h: el instanceof HTMLElement ? el.offsetHeight : c.h,
      };
    });
    const BAND = 40;
    const GAP = 16;
    const sorted = [...meas].sort((a, b) => a.c.y - b.c.y);
    const bands: (typeof meas)[] = [];
    for (const m of sorted) {
      const last = bands[bands.length - 1];
      if (last && m.c.y <= last[0].c.y + BAND) last.push(m);
      else bands.push([m]);
    }
    const reading = bands.flatMap((b) => [...b].sort((p, q) => p.c.x - q.c.x));
    const cols = Math.ceil(Math.sqrt(reading.length));
    const cellW = Math.max(...meas.map((m) => m.w)) + GAP;
    const cellH = Math.max(...meas.map((m) => m.h)) + GAP;
    const x0 = Math.min(...chosen.map((c) => c.x));
    const y0 = Math.min(...chosen.map((c) => c.y));
    reading.forEach((m, i) => {
      const nx = x0 + (i % cols) * cellW;
      const ny = y0 + Math.floor(i / cols) * cellH;
      if (nx !== m.c.x || ny !== m.c.y) patchCard(m.c.placementId, m.c.bitId, { x: nx, y: ny });
    });
  }
  // Lock / unlock the selected card's POSITION (B+): optimistic, rolled back on failure.
  function toggleLock(c: CardVM) {
    const on = !c.locked;
    setCards((cs) => cs.map((x) => (x.bitId === c.bitId ? { ...x, locked: on } : x)));
    settled(c.placementId)
      .then((id) => setPlacementLock(supabase, id, on))
      .catch((e) => {
        // keyed by bitId — a call-in reconcile can rename the placementId mid-flight
        setCards((cs) => cs.map((x) => (x.bitId === c.bitId ? { ...x, locked: !on } : x)));
        onErr(e);
      });
  }

  // Send the selected card behind everything (the demote valve — click-to-front stays, ruled).
  function sendToBack(placementId: string, bitId: string) {
    const minZ = cards.reduce((m, c) => Math.min(m, c.z), 0);
    patchCard(placementId, bitId, { z: minZ - 1 });
  }
  // Jump-to (the drawer's this-board rows stop being dead ends): glide to the card, readable.
  function jumpToCard(bitId: string) {
    const c = cards.find((x) => x.bitId === bitId);
    if (!c) return;
    centerOn(c, Math.min(1, Math.max(camRef.current.scale, 0.75)));
    selectOne(c.placementId);
  }
  useBoardKeys({
    enabled: !drawMode,
    editingId,
    selectedCount: selectedIds.size,
    setEditingIdNull: () => setEditingId(null),
    clearSelection,
    selectAll: () => setSelectedIds(new Set(cards.map((c) => c.placementId))),
    removeSelected: removeSelectedByKey,
    nudgeSelected,
    zoomBy,
    zoomTo,
  });

  // ---- pan + pinch + tap on empty space ----
  function onBoardPointerDown(e: React.PointerEvent) {
    if (e.target !== boardRef.current) return; // empty space only (cards handle their own)
    setEditingId(null);
    if (pinchDown(e)) {
      // A second finger = a pinch: never a pan, marquee, or tap. Abandon any
      // in-progress marquee (its anchor must not be stomped — plan finding 7).
      marquee.cancel();
      pan.current = null;
      lastTap.current = null;
      setIsPanning(false);
      return;
    }
    if (selectMode) {
      marquee.start(e); // select-mode: empty-space drag draws a marquee (not a pan)
      return;
    }
    pan.current = { sx: e.clientX, sy: e.clientY, cx: cam.x, cy: cam.y, moved: false };
    clearSelection();
  }

  function onBoardPointerMove(e: React.PointerEvent) {
    if (pinchMove(e)) return; // an active pinch owns the move
    if (marquee.move(e, cards)) return; // a marquee is active — it handled the move
    const p = pan.current;
    if (!p) return;
    const dx = e.clientX - p.sx;
    const dy = e.clientY - p.sy;
    if (!p.moved && Math.hypot(dx, dy) < 4) return;
    if (!p.moved) { p.moved = true; setIsPanning(true); }
    setCam((c) => ({ ...c, x: p.cx + dx, y: p.cy + dy }));
    scheduleSave(); // user pan → remember the new view (debounced)
  }

  // An interrupted gesture (OS gesture, alert, tab switch) must strand no state.
  function onBoardPointerCancel(e: React.PointerEvent) {
    pinchUp(e);
    marquee.cancel();
    pan.current = null;
    setIsPanning(false);
  }

  function onBoardPointerUp(e: React.PointerEvent) {
    if (pinchUp(e)) return; // a finger lifting out of a pinch is never a tap
    if (marquee.end()) return; // a marquee was active — it handled the up
    const p = pan.current;
    pan.current = null;
    setIsPanning(false);
    if (!p || p.moved) return; // a pan, not a tap
    const w = screenToWorld(e.clientX, e.clientY);
    const now = performance.now();
    const prev = lastTap.current;
    if (prev && now - prev.t < 340 && Math.hypot(w.x - prev.x, w.y - prev.y) < 28 / cam.scale) {
      lastTap.current = null;
      createTextCard(w.x, w.y);
    } else {
      lastTap.current = { t: now, x: w.x, y: w.y };
    }
  }

  const selectedBit = selectedIds.size === 1 ? cards.find((c) => selectedIds.has(c.placementId)) ?? null : null;

  return (
    <div className="compose-stage">
      <BoardToolbar
        onAddNote={addNote}
        onPen={() => setDrawMode(true)}
        selectMode={selectMode}
        onToggleSelect={() => { if (selectMode) clearSelection(); setSelectMode((m) => !m); }}
        selectedCount={selectedIds.size}
        onBulkUnplace={bulkUnplace}
        onBulkTrash={bulkTrash}
        onTidy={tidySelected}
        onDuplicate={() => void duplicateThis()}
        duplicating={duplicating}
        onZoomIn={() => zoomBy(1.2)}
        onZoomOut={() => zoomBy(1 / 1.2)}
        onFit={() => fitOrToggleBack(cards)}
        zoomPct={cam.scale}
        fileRef={fileRef}
        onPickImage={onPickImage}
        audioRef={audioRef}
        onPickAudio={onPickAudio}
        pdfRef={pdfRef}
        onPickPdf={onPickPdf}
        error={error}
        onDismissError={() => setError(null)}
      />
      {selectedBit && (
        <div className="selected-bar">
          <TagBar key={selectedBit.bitId} target={{ bitId: selectedBit.bitId }} />
          <div className="selected-actions">
            <button
              className="compose-btn subtle"
              onClick={() => openSelected(selectedBit.placementId, selectedBit.bitId)}
              title="Open this card full-page — comfortable writing"
            >
              open
            </button>
            <button
              className="compose-btn subtle"
              onClick={() => toggleLock(selectedBit)}
              title={selectedBit.locked ? "Unlock — this card can move again" : "Lock this card in place — a stray drag can't move it (removing it still works)"}
            >
              {selectedBit.locked ? "🔓 unlock" : "🔒 lock"}
            </button>
            <button
              className="compose-btn subtle"
              onClick={() => sendToBack(selectedBit.placementId, selectedBit.bitId)}
              title="Send this card behind everything else"
            >
              send to back
            </button>
            <button
              className="compose-btn subtle"
              onClick={() => unplaceSelected(selectedBit.placementId)}
              title="Take this card off THIS board — it lives on (its other boards, and loose in your bits)"
            >
              remove from this board
            </button>
            <button
              className="compose-btn subtle"
              onClick={() => trashSelected(selectedBit.placementId, selectedBit.bitId)}
              title="Move this card to the trash — hidden everywhere, restorable"
            >
              trash
            </button>
          </div>
        </div>
      )}
      <div
        ref={boardRef}
        className={`compose-board${isPanning ? " is-panning" : ""}`}
        onPointerDown={onBoardPointerDown}
        onPointerMove={onBoardPointerMove}
        onPointerUp={onBoardPointerUp}
        onPointerCancel={onBoardPointerCancel}
        onDragOver={(e) => e.preventDefault()}
        onDrop={onBoardDrop}
      >
        {cards.length === 0 && converting === 0 && (
          <p className="compose-empty">Tap &ldquo;+ text&rdquo;, or double-tap anywhere, to start.</p>
        )}
        {converting > 0 && (
          <div className="compose-converting" role="status">
            Converting your photo{converting > 1 ? "s" : ""}…
            <span>HEICs take a few seconds</span>
          </div>
        )}
        {capturing && (
          <div className="compose-converting" role="status">
            Capturing the page…
            <span>fetching its title and image</span>
          </div>
        )}
        <div
          className="compose-world"
          style={{
            transform: `translate(${cam.x}px, ${cam.y}px) scale(${cam.scale})`,
            transformOrigin: "0 0",
          }}
        >
          {cards.map((c) => (
            <Card
              key={c.placementId}
              card={c}
              selected={selectedIds.has(c.placementId)}
              editing={editingId === c.placementId}
              selectMode={selectMode}
              scale={cam.scale}
              offeringWords={wordsFor?.bitId === c.bitId}
              onSelect={(additive) => select(c.placementId, c.bitId, additive)}
              onEdit={() => {
                selectOne(c.placementId);
                setEditingId(c.placementId);
              }}
              onOpen={() => openSelected(c.placementId, c.bitId)}
              onChange={(patch) => {
                markContentIfReal(c.placementId, patch.body); // first real content → no longer evaporates
                patchCard(c.placementId, c.bitId, patch);
              }}
              onContentSave={(v) => saveContent(c.placementId, c.bitId, v)}
              onSourceChange={(src) =>
                // The source was already persisted (bit.source_id) by the picker;
                // patch ONLY this card's VM so its resting "from …" stamp updates
                // without a reload. No DB write here.
                setCards((cs) =>
                  cs.map((x) =>
                    x.placementId === c.placementId
                      ? { ...x, sourceName: src?.name, sourceUrl: src?.url ?? undefined }
                      : x,
                  ),
                )
              }
              onDragStart={() => onCardDragStart(c.placementId)}
              onDragMove={(x, y) => onCardDragMove(c.placementId, x, y)}
              onDragEnd={(x, y) => onCardDragEnd(c.placementId, x, y)}
            />
          ))}
        </div>
        {marquee.marqueeBox && (
          <div
            className="marquee-box"
            style={{ left: marquee.marqueeBox.left, top: marquee.marqueeBox.top, width: marquee.marqueeBox.w, height: marquee.marqueeBox.h }}
          />
        )}
        <Drawer variant="board" boardId={boardId} onBringIn={bringIn} onJumpTo={jumpToCard} refreshSignal={looseRefresh} />
        {drawMode && <DrawOverlay onDone={finishDoodle} onCancel={() => setDrawMode(false)} />}
        {wordsFor && (
          <WordsOffer
            key={wordsFor.bitId}
            kind={wordsFor.kind}
            initial={cards.find((c) => c.bitId === wordsFor.bitId)?.content ?? ""}
            onSave={(v) => {
              const card = cards.find((c) => c.bitId === wordsFor.bitId);
              if (card) saveContent(card.placementId, card.bitId, v);
              else updateBitContent(supabase, wordsFor.bitId, v).catch(onErr);
              setWordsQueue((q) => q.slice(1)); // the next waiting offer steps up
            }}
            onSkip={() => setWordsQueue((q) => q.slice(1))}
          />
        )}
      </div>
    </div>
  );
}
