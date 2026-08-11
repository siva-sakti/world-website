"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import {
  createTextBit,
  createDrawingBit,
  createImageBit,
  updateBitContent,
  unplaceBit,
  trashBit,
  callInBit,
  getBitBoards,
} from "@/lib/db/bits";
import { uploadObject, signedUrl } from "@/lib/storage";
import { importImage, isHeic, MediaError } from "@/lib/media";
import { strokesBounds, normalizeDrawing } from "@/lib/stroke";
import type { Drawing } from "@/lib/types";
import type { PanelBit } from "@/lib/db/inbox";
import { Card, type CardVM } from "./card";
import { DrawOverlay } from "./draw-overlay";
import { TagBar } from "./tag-bar";
import { WordsOffer } from "./words-offer";
import { LooseColumn } from "./loose-column";
import { usePersistence } from "./use-persistence";
import { useCamera } from "./use-camera";
import { useMarqueeSelect } from "./use-marquee-select";
import { BoardToolbar } from "./board-toolbar";
import { confirm } from "@/components/confirm";

const MAX_DISP = 320; // an image card's initial on-board width

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
  const [selectedIds, setSelectedIds] = useState<Set<string>>(() => new Set());
  const [selectMode, setSelectMode] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const dragStart = useRef<Map<string, { x: number; y: number }> | null>(null);
  const selectOne = (id: string) => setSelectedIds(new Set([id]));
  const clearSelection = () => setSelectedIds(new Set());
  const [drawMode, setDrawMode] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [converting, setConverting] = useState(false); // HEIC decode is slow — tell the user
  const [wordsFor, setWordsFor] = useState<{ bitId: string; kind: "image" | "drawing" } | null>(null);
  const [looseRefresh, setLooseRefresh] = useState(0); // bump → the loose column reloads
  const [isPanning, setIsPanning] = useState(false); // drives the grabbing cursor

  const boardRef = useRef<HTMLDivElement>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const lastTap = useRef<{ t: number; x: number; y: number } | null>(null);
  const bringInStep = useRef(0); // small cascade so repeated bring-ins don't stack
  const pan = useRef<{ sx: number; sy: number; cx: number; cy: number; moved: boolean } | null>(null);
  const [supabase] = useState(() => createClient());
  const router = useRouter();

  // Pan/zoom camera (incl. touch pinch) and rubber-band select.
  const { cam, camRef, setCam, screenToWorld, fitView, centerOn, pinchDown, pinchMove, pinchUp } =
    useCamera(boardRef);
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
  const { patchCard, saveContent, trackCreate, reconcileId, settled, flushNow } =
    usePersistence(supabase, setCards, onErr);

  // "open" — the focused writing view (writing-experience-plan v1): the bit's own
  // page. Gated: the row must exist (a fresh card's insert may be in flight → the
  // page would 404), and the last keystrokes must be flushed (else the page loads
  // a stale body and its next save overwrites them — plan review finding 4).
  function openSelected(placementId: string, bitId: string) {
    settled(placementId)
      .then(() => flushNow(placementId))
      .then(() => router.push(`/bit/${bitId}`))
      .catch(onErr);
  }

  // On open, frame the board's content so you never land on blank canvas.
  // On a PHONE (the CSS breakpoint, inclusive), fit-all computes a tiny scale —
  // open instead centered on the last-fronted card at 100%, readable; ⊹ fit is
  // one tap away for the overview. z ties (inbox-placed cards are all z=0)
  // resolve to the last in load order — arbitrary but stable (plan finding 8).
  useEffect(() => {
    if (!initialCards.length) return;
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

  function select(placementId: string, bitId: string, additive: boolean) {
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
      for (const c of cards) if (selectedIds.has(c.placementId)) m.set(c.placementId, { x: c.x, y: c.y });
      dragStart.current = m;
    } else {
      dragStart.current = null;
    }
  }
  function onCardDragMove(placementId: string, x: number, y: number) {
    const starts = dragStart.current;
    if (!starts || !starts.has(placementId)) return;
    const s = starts.get(placementId)!;
    const dx = x - s.x;
    const dy = y - s.y;
    setCards((cs) =>
      cs.map((c) => {
        if (c.placementId === placementId || !starts.has(c.placementId)) return c; // dragged card + non-selected: untouched
        const p0 = starts.get(c.placementId)!;
        return { ...c, x: p0.x + dx, y: p0.y + dy };
      }),
    );
  }
  function onCardDragEnd(placementId: string, x: number, y: number) {
    const starts = dragStart.current;
    dragStart.current = null;
    if (!starts || !starts.has(placementId)) return; // single drag: the card's own onChange persisted it
    const s = starts.get(placementId)!;
    const dx = x - s.x;
    const dy = y - s.y;
    for (const c of cards) {
      if (c.placementId === placementId || !starts.has(c.placementId)) continue;
      const p0 = starts.get(c.placementId)!;
      patchCard(c.placementId, c.bitId, { x: p0.x + dx, y: p0.y + dy }); // per-card independent save
    }
  }

  // ---- create ----
  function createNote(x: number, y: number) {
    const bitId = crypto.randomUUID();
    const placementId = crypto.randomUUID();
    const z = nextZ();
    setCards((cs) => [
      ...cs,
      { placementId, bitId, type: "text", x, y, w: 240, h: 60, z, body: "<p></p>" },
    ]);
    selectOne(placementId);
    setEditingId(placementId);
    const p = createTextBit(supabase, { bitId, placementId, boardId, body: "<p></p>", x, y, width: 240, z }).catch(onErr);
    trackCreate(placementId, p);
  }

  // Pen "Done": convert the session's strokes (screen space) into world space,
  // bundle into ONE drawing bit at their bounding box (widths kept). Empty → nothing.
  function finishDoodle(drawing: Drawing) {
    setDrawMode(false);
    if (!drawing.strokes.length) return;
    const c = camRef.current;
    const world = drawing.strokes.map((s) =>
      s.map(([px, py, pr]) => [(px - c.x) / c.scale, (py - c.y) / c.scale, pr]),
    );
    const b = strokesBounds(world);
    const w = Math.max(1, b.w);
    const h = Math.max(1, b.h);
    const rel = world.map((s) => s.map(([px, py, pr]) => [px - b.minX, py - b.minY, pr]));
    const relDrawing: Drawing = { strokes: rel, sizes: drawing.sizes, colors: drawing.colors };
    const bitId = crypto.randomUUID();
    const placementId = crypto.randomUUID();
    const z = nextZ();
    setCards((cs) => [
      ...cs,
      { placementId, bitId, type: "drawing", x: b.minX, y: b.minY, w, h, z, drawing: relDrawing },
    ]);
    selectOne(placementId);
    const p = createDrawingBit(supabase, {
      bitId, placementId, boardId, drawing: relDrawing,
      x: b.minX, y: b.minY, width: w, height: h, z,
    })
      .then(() => setWordsFor({ bitId, kind: "drawing" }))
      .catch(onErr);
    trackCreate(placementId, p);
  }

  function importImageFile(file: File, wx: number, wy: number) {
    const bitId = crypto.randomUUID();
    const placementId = crypto.randomUUID();
    // HEIC decoding takes a few seconds; only then does it show a notice.
    const heic = isHeic(file);
    if (heic) setConverting(true);
    const chain = importImage(file)
      .then(async (img) => {
        const dispScale = Math.min(1, MAX_DISP / img.width);
        const w = Math.max(1, Math.round(img.width * dispScale));
        const h = Math.max(1, Math.round(img.height * dispScale));
        const z = nextZ();
        const localUrl = URL.createObjectURL(img.blob);
        setCards((cs) => [
          ...cs,
          { placementId, bitId, type: "image", x: wx, y: wy, w, h, z, imageUrl: localUrl },
        ]);
        selectOne(placementId);
        const storagePath = `images/${bitId}.jpg`;
        const thumbPath = `thumbs/${bitId}.jpg`;
        // The two uploads are independent — send them together, not one-then-two.
        await Promise.all([
          uploadObject(supabase, { path: storagePath, body: img.blob, contentType: "image/jpeg" }),
          uploadObject(supabase, { path: thumbPath, body: img.thumb, contentType: "image/jpeg" }),
        ]);
        await createImageBit(supabase, {
          bitId, placementId, boardId, storagePath, thumbPath,
          mediaWidth: img.width, mediaHeight: img.height,
          mime: "image/jpeg", byteSize: img.blob.size, fileName: file.name,
          x: wx, y: wy, width: w, height: h, z,
        });
        setWordsFor({ bitId, kind: "image" });
      })
      .catch((e) => {
        setCards((cs) => cs.filter((c) => c.placementId !== placementId));
        onErr(e);
      })
      .finally(() => {
        if (heic) setConverting(false);
      });
    trackCreate(placementId, chain);
  }

  function onBoardDrop(e: React.DragEvent) {
    e.preventDefault();
    const file = e.dataTransfer.files?.[0];
    if (file) {
      const w = screenToWorld(e.clientX, e.clientY);
      importImageFile(file, w.x, w.y);
    }
  }

  function onPickImage(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (file) {
      const r = boardRef.current!.getBoundingClientRect();
      const w = screenToWorld(r.left + 80, r.top + 120);
      importImageFile(file, w.x, w.y);
    }
    e.target.value = "";
  }

  useEffect(() => {
    function onPaste(e: ClipboardEvent) {
      const file = Array.from(e.clipboardData?.files ?? []).find((f) => f.type.startsWith("image/"));
      if (file) {
        const r = boardRef.current!.getBoundingClientRect();
        const w = screenToWorld(r.left + 100, r.top + 140);
        importImageFile(file, w.x, w.y);
      }
    }
    window.addEventListener("paste", onPaste);
    return () => window.removeEventListener("paste", onPaste);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cards.length]);

  // Escape clears the selection (and exits edit).
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") { clearSelection(); setEditingId(null); }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

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
      createNote(w.x, w.y);
    } else {
      lastTap.current = { t: now, x: w.x, y: w.y };
    }
  }

  // ---- remove (I-W1: two distinct, labeled acts) ----
  function clearCard(placementId: string) {
    setCards((cs) => cs.filter((c) => c.placementId !== placementId));
    clearSelection();
    setEditingId(null);
  }
  // Take the card off THIS board only; the bit lives on (its travel keeps the leg).
  // Through the settled-create door: firing while the card's create is still in
  // flight would match 0 rows and silently lose the removal (review finding #1).
  function unplaceSelected(placementId: string) {
    clearCard(placementId);
    settled(placementId)
      .then((id) => unplaceBit(supabase, id))
      .catch(onErr);
    setLooseRefresh((n) => n + 1); // it's loose again — let the column show it
  }
  // Trash the whole bit — hidden everywhere, restorable from /trash. With multi-board,
  // trash is the heavy act (off EVERY board), so the confirm is honest about it (F16).
  // Same door: the bit row must exist before the freeze can land.
  async function trashSelected(placementId: string, bitId: string) {
    let n = 1;
    try { n = (await getBitBoards(supabase, bitId)).length; } catch { /* fall back to the plain confirm */ }
    const msg = n > 1
      ? `This note is on ${n} boards — trashing removes it from all of them (restorable from Trash). Continue?`
      : `Move this note to the trash? Hidden everywhere, restorable from Trash.`;
    if (!(await confirm({ message: msg, confirmLabel: "Trash", danger: true }))) return;
    setCards((cs) => cs.filter((c) => c.bitId !== bitId));
    clearSelection();
    setEditingId(null);
    settled(placementId)
      .then(() => trashBit(supabase, bitId))
      .catch(onErr);
  }

  // ---- bulk acts (multi-select, ②c) — the same I-W1 acts, looped, each through the
  // settled door (per placement); the trash confirm keeps ①'s multi-board honesty.
  function bulkUnplace() {
    const ids = [...selectedIds];
    setCards((cs) => cs.filter((c) => !selectedIds.has(c.placementId)));
    clearSelection();
    setEditingId(null);
    for (const pid of ids) settled(pid).then((id) => unplaceBit(supabase, id)).catch(onErr);
    setLooseRefresh((n) => n + 1);
  }
  async function bulkTrash() {
    const chosen = cards.filter((c) => selectedIds.has(c.placementId));
    const bitIds = [...new Set(chosen.map((c) => c.bitId))];
    let onOtherBoards = 0;
    try {
      const counts = await Promise.all(bitIds.map((bid) => getBitBoards(supabase, bid)));
      onOtherBoards = counts.filter((boards) => boards.length > 1).length;
    } catch { /* fall back to the plain confirm */ }
    const n = bitIds.length;
    const msg =
      onOtherBoards > 0
        ? `Trash ${n} note${n === 1 ? "" : "s"}? ${onOtherBoards} of them also live on other boards — this removes them from all of them (restorable from Trash).`
        : `Trash ${n} note${n === 1 ? "" : "s"}? Hidden everywhere, restorable from Trash.`;
    if (!(await confirm({ message: msg, confirmLabel: "Trash", danger: true }))) return;
    setCards((cs) => cs.filter((c) => !selectedIds.has(c.placementId)));
    clearSelection();
    setEditingId(null);
    for (const c of chosen) settled(c.placementId).then(() => trashBit(supabase, c.bitId)).catch(onErr);
  }

  function addNote() {
    const r = boardRef.current?.getBoundingClientRect();
    const w = r
      ? screenToWorld(r.left + r.width / 2, r.top + Math.min(160, r.height / 2))
      : { x: 40, y: 84 };
    createNote(w.x, w.y);
  }

  // Call-in: bring a loose note onto THIS board, where you're looking. Optimistic like
  // createNote; callInBit inserts-or-revives and returns the TRUE placement, so we
  // reconcile the card's id when the server revived a departed row (plan §5.4, finding 1).
  async function bringIn(bit: PanelBit) {
    const type = bit.type;
    if (type !== "text" && type !== "drawing" && type !== "image") return;
    const step = (bringInStep.current++ % 6) * 24;
    const r = boardRef.current?.getBoundingClientRect();
    const w = r
      ? screenToWorld(r.left + r.width / 2 + step, r.top + Math.min(200, r.height / 2) + step)
      : { x: 40 + step, y: 84 + step };
    const placementId = crypto.randomUUID();
    const z = nextZ();
    const width = type === "text" ? 240 : 220;
    const height = type === "text" ? 60 : 220;
    let imageUrl: string | undefined;
    if (type === "image") {
      const path = bit.thumb_path ?? bit.storage_path;
      if (path) {
        try { imageUrl = await signedUrl(supabase, path); } catch {}
      }
    }
    setCards((cs) => [
      ...cs,
      {
        placementId, bitId: bit.id, type,
        x: w.x, y: w.y, w: width, h: height, z,
        body: bit.body ?? undefined,
        drawing: type === "drawing" ? normalizeDrawing(bit.strokes) : undefined,
        imageUrl,
        content: bit.content ?? undefined,
        sourceName: bit.source?.name ?? undefined,
        sourceUrl: bit.source?.url ?? undefined,
      },
    ]);
    selectOne(placementId);
    const p = callInBit(supabase, { bitId: bit.id, boardId, placementId, x: w.x, y: w.y, width, height, z })
      .then((placement) => {
        if (placement.id !== placementId) {
          reconcileId(placementId, placement.id);
          // If a card already renders under the real id (the bit was ALREADY live
          // here — a stale column), drop the optimistic twin instead of renaming:
          // two cards must never share a placement id.
          setCards((cs) =>
            cs.some((c) => c.placementId === placement.id)
              ? cs.filter((c) => c.placementId !== placementId)
              : cs.map((c) => (c.placementId === placementId ? { ...c, placementId: placement.id } : c)),
          );
          setSelectedIds((prev) => { if (!prev.has(placementId)) return prev; const nx = new Set(prev); nx.delete(placementId); nx.add(placement.id); return nx; });
        }
      })
      .catch((e) => {
        setCards((cs) => cs.filter((c) => c.placementId !== placementId));
        setSelectedIds((prev) => { if (!prev.has(placementId)) return prev; const nx = new Set(prev); nx.delete(placementId); return nx; });
        onErr(e);
        throw e; // let the column restore the note to the pile
      });
    trackCreate(placementId, p);
    return p;
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
        onFit={() => fitView(cards)}
        zoomPct={cam.scale}
        fileRef={fileRef}
        onPickImage={onPickImage}
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
              title="Open this note full-page — comfortable writing"
            >
              open
            </button>
            <button
              className="compose-btn subtle"
              onClick={() => unplaceSelected(selectedBit.placementId)}
              title="Take this card off THIS board — the note lives on (on its other boards, and in your notes)"
            >
              remove from this board
            </button>
            <button
              className="compose-btn subtle"
              onClick={() => trashSelected(selectedBit.placementId, selectedBit.bitId)}
              title="Move this note to the trash — hidden everywhere, restorable"
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
        {cards.length === 0 && !converting && (
          <p className="compose-empty">Tap &ldquo;+ note&rdquo;, or double-tap anywhere, to start.</p>
        )}
        {converting && (
          <div className="compose-converting" role="status">
            Converting your photo…
            <span>HEICs take a few seconds</span>
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
              onChange={(patch) => patchCard(c.placementId, c.bitId, patch)}
              onContentSave={(v) => saveContent(c.placementId, c.bitId, v)}
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
        <LooseColumn boardId={boardId} onBringIn={bringIn} refreshSignal={looseRefresh} />
        {drawMode && <DrawOverlay onDone={finishDoodle} onCancel={() => setDrawMode(false)} />}
        {wordsFor && (
          <WordsOffer
            key={wordsFor.bitId}
            kind={wordsFor.kind}
            onSave={(v) => {
              const card = cards.find((c) => c.bitId === wordsFor.bitId);
              if (card) saveContent(card.placementId, card.bitId, v);
              else updateBitContent(supabase, wordsFor.bitId, v).catch(onErr);
              setWordsFor(null);
            }}
            onSkip={() => setWordsFor(null)}
          />
        )}
      </div>
    </div>
  );
}
