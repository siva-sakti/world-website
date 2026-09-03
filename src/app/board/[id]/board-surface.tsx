"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import {
  updateBitContent,
  setPlacementLock,
  unplaceBit,
  trashBit,
  restoreBit,
  callInBit,
  getBitBoards,
} from "@/lib/db/bits";
import { archiveBit, unarchiveBit } from "@/lib/db/resting";
import { MediaError } from "@/lib/media";
import { Card } from "./card";
import type { CardVM } from "./card-vm";
import { DrawOverlay } from "./draw-overlay";
import { WordsOffer } from "./words-offer";
import { Drawer } from "@/components/drawer";
import { registerSave } from "@/lib/save-guard";
import { duplicateBoard } from "@/lib/db/boards";
import { confirm } from "@/components/confirm";
import { confirmTrash } from "@/app/trash/trash-confirm";
import { confirmArchive } from "@/app/archive/archive-confirm";
import { duplicateBitAction } from "@/app/bits/actions";
import { usePersistence } from "./use-persistence";
import { useCamera } from "./use-camera";
import { useBoardKeys } from "./use-board-keys";
import { useMarqueeSelect } from "./use-marquee-select";
import { BoardToolbar } from "./board-toolbar";
import { SelectedBar } from "./selected-bar";
import { removeActs } from "./remove-acts";
import { useUndo } from "./use-undo";
import { useArrangeActs } from "./use-arrange-acts";
import { useMeaningActs } from "./use-meaning-acts";
import { useGeometry } from "./use-geometry";
import { UndoDevReadout } from "./undo-dev-readout";
import { tidyPatches, backZ, groupDragPatches, nextZ as zAbove, alignPatches, distributePatches } from "./board-arrange";
import { snapTo, type Box } from "./geometry";
import type { Patch, AlignEdge, Axis } from "./board-arrange";
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
  const [duplicatingBit, setDuplicatingBit] = useState(false); // a card's own copy is in flight

  const boardRef = useRef<HTMLDivElement>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const audioRef = useRef<HTMLInputElement>(null);
  const pdfRef = useRef<HTMLInputElement>(null);
  const lastTap = useRef<{ t: number; x: number; y: number } | null>(null);
  const pan = useRef<{ sx: number; sy: number; cx: number; cy: number; moved: boolean } | null>(null);
  const [supabase] = useState(() => createClient());
  const router = useRouter();

  // The geometry registry (D-135 phase 2): every card's true rendered size, one
  // ledger — dark until the consumers switch (stage 3) and the guides land.
  const { measure, sizeOf, read } = useGeometry();

  // Pan/zoom camera (incl. touch pinch) and rubber-band select.
  const { cam, camRef, setCam, screenToWorld, fitView, centerOn, fitOrToggleBack, zoomBy, zoomTo, pinchDown, pinchMove, pinchUp, scheduleSave, restoreView } =
    useCamera(boardRef, boardId, sizeOf);
  const marquee = useMarqueeSelect(boardRef, screenToWorld, setSelectedIds, clearSelection, sizeOf);

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
  const { patchCard, saveContent, trackCreate, reconcileId, settled, forget, flushNow, flushAll, pendingCreates, chain } =
    usePersistence(supabase, setCards, onErr);

  // THE UNDO SEAM (live — D-137): every deliberate act records; ↶ ↷ + ⌘Z replay.
  // The dev readout below stays as the dev-only truth surface.
  const { record, onBeforeRecord, fail, undo, redo, undoLabel, redoLabel, devSnapshot } = useUndo((msg) => setError(msg));
  // Stage 5 (live): the transient "undid: …" receipt — the ruled substitute for
  // moving the view (undo never pans/zooms; the note says what just reversed).
  const [undoNote, setUndoNote] = useState<string | null>(null);
  const noteTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const flashNote = (msg: string) => {
    if (noteTimer.current) clearTimeout(noteTimer.current);
    setUndoNote(msg);
    noteTimer.current = setTimeout(() => setUndoNote(null), 2500);
  };
  useEffect(() => () => { if (noteTimer.current) clearTimeout(noteTimer.current); }, []); // S5
  const arrange = useArrangeActs({ supabase, cardsRef, record, onBeforeRecord, patchCard, setCards, settled, chain });
  async function doUndo() {
    arrange.closeNudgeWindow(); // never pop an entry a burst is still extending (D12)
    const r = await undo();
    if (r?.ok) flashNote(`undid: ${r.label}`);
  }
  async function doRedo() {
    arrange.closeNudgeWindow();
    const r = await redo();
    if (r?.ok) flashNote(`redid: ${r.label}`);
  }
  // The meaning acts (undo §6 — tags + source, GLOBAL reach, honest labels) + the
  // refresh signal their reverses bump so mounted bars repaint themselves. Scoped
  // PER BIT (antagonist J3): a global counter set every bar loading on any reverse,
  // and the loading carve then swallowed LEGITIMATE records on other cards.
  const [meta, setMeta] = useState<{ bitId: string | null; n: number }>({ bitId: null, n: 0 });
  const metaSignalFor = (bitId: string) => (meta.bitId === bitId ? meta.n : 0);
  const meaning = useMeaningActs({
    supabase, cardsRef, record, setCards,
    bumpMeta: (bitId) => setMeta((m) => ({ bitId, n: m.n + 1 })),
  });
  // Before-captures for the two gestures whose acts finish elsewhere:
  const dragBefore = useRef<{ bitId: string; x: number; y: number } | null>(null);   // single drag
  const resizeBefore = useRef<{ bitId: string; x: number; y: number; w: number; h?: number } | null>(null);

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
    return zAbove(cards); // one definition (board-arrange) — no drifting twin (M1)
  }

  // Create doors — every way a card is born onto the surface. (Evaporate retired,
  // owner ruling D-138: an empty card persists until the owner removes/fills it.)
  const { addNote, createTextCard, finishDoodle, onBoardDrop, onPickImage, onPickAudio, onPickPdf, bringIn } =
    useCreateDoors({
      supabase, boardId, boardRef, screenToWorld, camRef, cards, setCards,
      setSelectedIds, selectOne, setEditingId, setDrawMode, nextZ,
      trackCreate, reconcileId, setConverting, setCapturing, setWordsFor: enqueueWords, onErr, sizeOf,
    });

  // Remove acts (I-W1) — un-place / trash, singular + bulk — through the settled door.
  // In-flight removes registered so duplicateThis can await them (hunt #9): they are
  // neither pending patches nor creates, so flushAll + pendingCreates both miss them.
  const removesInFlight = useRef(new Set<Promise<unknown>>());
  const trackRemove = (p: Promise<unknown>) => {
    removesInFlight.current.add(p);
    void p.finally(() => removesInFlight.current.delete(p));
  };
  // removeActs never reads cardsRef.current during render: every read is inside an async
  // reverse (reviveOne / unplaceOne / trashOne), which is the whole POINT of passing the
  // ref rather than a snapshot — a reverse must resolve the card as it is NOW. The rule
  // fires only because removeActs is no longer named `use*` (2026-09-02 rename — it is
  // not a hook); useArrangeActs and useMeaningActs take the same ref and aren't flagged.
  // eslint-disable-next-line react-hooks/refs -- see above
  const { unplaceSelected, trashSelected, archiveSelected, bulkUnplace, bulkTrash, bulkArchive } = removeActs({
    supabase, boardId, cards, cardsRef, record, fail, trackCreate, reconcileId, chain,
    selectedIds, setCards, clearSelection,
    setEditingId, settled, flushNow, trackRemove, forget, setLooseRefresh, onErr,
    // The db doors + confirm, passed IN (see RemoveDoors): the acts module has no
    // React in it, so injecting these is what lets a test drive all four gestures
    // with fakes. This is the production wiring.
    doors: {
      unplaceBit, trashBit, restoreBit, callInBit, setPlacementLock, getBitBoards,
      confirmTrash, archiveBit, unarchiveBit, confirmArchive,
    },
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

  // ---- CARD ALIGNMENT: the guides (card-alignment-spec.md §2.2) ----
  //
  // Thin magenta lines while you drag, and the card lands on the alignment when you let
  // go. It does NOT stick to the line mid-drag: react-rnd ignores position changes while
  // dragging, so magnetic pull waits for the ruled input engine. Said up front, not
  // discovered later.
  //
  // The overlay is PERMANENTLY MOUNTED and shown/hidden by mutating style — never by
  // React state. A single-card drag causes zero re-renders today and that must hold, or
  // dragging gets slower because of a decoration.
  const vGuideRef = useRef<HTMLDivElement>(null);
  const hGuideRef = useRef<HTMLDivElement>(null);
  const SNAP_PX = 6; // screen px — divided by the zoom, so the feel is the same at 0.2x and 3x
  const OVERSHOOT_PX = 24; // how far the line runs past both cards, also screen px
  // Built ONCE at drag start: nothing else moves during a drag, so rebuilding per frame
  // is wasted work. Excludes the dragged card (it would align to itself) AND the rest of
  // the selection (followers hold a CONSTANT offset, so one within range would snap on
  // every frame and drift the whole group).
  const dragSnap = useRef<{ others: Box[]; moved: boolean; alt: boolean } | null>(null);

  function hideGuides() {
    if (vGuideRef.current) vGuideRef.current.style.display = "none";
    if (hGuideRef.current) hGuideRef.current.style.display = "none";
  }

  /** The live snap for a card at (x, y), or null when nothing should happen.
   *  Null when: no drag is in flight · the pointer has not actually MOVED (react-rnd
   *  fires drag-stop on a plain click, and a click must never relocate a card) · Alt is
   *  held to refuse. */
  function snapFor(c: CardVM, x: number, y: number) {
    const st = dragSnap.current;
    if (!st || !st.moved || st.alt || !st.others.length) return null;
    const scale = camRef.current.scale; // the REF: no re-render happens during a drag
    const m = sizeOf(c.placementId);
    const box: Box = { x, y, w: m?.w ?? c.w, h: m?.h ?? c.h };
    return snapTo(box, st.others, SNAP_PX / scale, OVERSHOOT_PX / scale);
  }

  function drawGuides(r: ReturnType<typeof snapFor>) {
    const scale = camRef.current.scale;
    const thin = 1 / scale; // one screen px, whatever the zoom
    const v = vGuideRef.current;
    const h = hGuideRef.current;
    if (v) {
      if (r?.vGuide) {
        v.style.display = "block";
        v.style.left = `${r.vGuide.at - thin / 2}px`;
        v.style.top = `${r.vGuide.from}px`;
        v.style.width = `${thin}px`;
        v.style.height = `${r.vGuide.to - r.vGuide.from}px`;
      } else v.style.display = "none";
    }
    if (h) {
      if (r?.hGuide) {
        h.style.display = "block";
        h.style.left = `${r.hGuide.from}px`;
        h.style.top = `${r.hGuide.at - thin / 2}px`;
        h.style.width = `${r.hGuide.to - r.hGuide.from}px`;
        h.style.height = `${thin}px`;
      } else h.style.display = "none";
    }
  }

  /** Where the card should actually land. Card calls this in its drag-stop, BEFORE it
   *  reports the move — so the saved position and the undo entry record the same
   *  (snapped) truth rather than disagreeing. */
  function snapDrop(c: CardVM, x: number, y: number, e: MouseEvent | TouchEvent) {
    const st = dragSnap.current;
    if (st) st.alt = "altKey" in e ? e.altKey : false; // a touch release carries no Alt
    const r = snapFor(c, x, y);
    hideGuides();
    return r ? { x: r.x, y: r.y } : { x, y };
  }

  // ---- move-together (multi-select drag) ----
  // Record every selected card's start position, then on drag move ONLY the OTHER
  // selected cards (the dragged card stays entirely with react-rnd until stop, else
  // its controlled position fights the internal drag and it stutters — review). On
  // stop, persist each moved card through the settled-create door (keyed per card).
  function onCardDragStart(placementId: string) {
    // The snap's candidates: every OTHER card that is not part of this gesture, at its
    // measured size, culled to what is roughly on screen (a neighbour 8000px away would
    // otherwise win and draw a guide to nothing).
    const view = boardRef.current?.getBoundingClientRect();
    const tl = view ? screenToWorld(view.left, view.top) : null;
    const br = view ? screenToWorld(view.left + view.width, view.top + view.height) : null;
    const PAD = 400; // world px of slack, so a card just off-screen can still align
    dragSnap.current = {
      moved: false,
      alt: false,
      others: cards
        .filter((c) => c.placementId !== placementId && !selectedIds.has(c.placementId))
        .map((c) => {
          const m = sizeOf(c.placementId);
          return { x: c.x, y: c.y, w: m?.w ?? c.w, h: m?.h ?? c.h };
        })
        .filter(
          (b) =>
            !tl || !br ||
            (b.x + b.w > tl.x - PAD && b.x < br.x + PAD && b.y + b.h > tl.y - PAD && b.y < br.y + PAD),
        ),
    };
    if (selectedIds.size > 1 && selectedIds.has(placementId)) {
      const m = new Map<string, { x: number; y: number }>();
      // locked cards never join a group drag (the one skip point — move/end gate on starts.has()).
      // Keyed by bitId: a call-in reconcile can rename a placementId mid-drag; bitIds never rename
      // (and are unique per board — placement_bit_once).
      for (const c of cards) if (selectedIds.has(c.placementId) && !c.locked) m.set(c.bitId, { x: c.x, y: c.y });
      dragStart.current = m;
    } else {
      dragStart.current = null;
      // Single drag: the act finishes in onChange("move") — capture its BEFORE from
      // state now (state at drag-start IS the pre-drag truth: the dragged card is
      // uncontrolled until stop, and auto-widen requires editing, which disables drags).
      const c = cards.find((x) => x.placementId === placementId);
      dragBefore.current = c ? { bitId: c.bitId, x: c.x, y: c.y } : null;
    }
  }
  // The map above is keyed by BIT id (see the comment there) — so every reader must
  // translate the incoming placementId to its card's bitId first. R1 changed the keys
  // and missed the readers: starts.has(placementId) was always false, and multi-select
  // drag silently moved only the grabbed card (senior review, 2026-09-01).
  function onCardDragMove(placementId: string, x: number, y: number) {
    const me = cards.find((c) => c.placementId === placementId);
    if (dragSnap.current && me) {
      dragSnap.current.moved = true; // a real drag, not a click
      drawGuides(snapFor(me, x, y));
    }
    const starts = dragStart.current;
    const dragged = cards.find((c) => c.placementId === placementId);
    if (!starts || !dragged || !starts.has(dragged.bitId)) return;
    const s = starts.get(dragged.bitId)!;
    const dx = x - s.x;
    const dy = y - s.y;
    setCards((cs) => {
      // THROUGH the tested pure function (antagonist M1: the regression test must
      // guard the code that runs, not a twin nobody calls).
      const byBit = new Map(groupDragPatches(cs, starts, dragged.bitId, dx, dy).map((p) => [p.bitId, p]));
      return cs.map((c) => {
        const p = byBit.get(c.bitId);
        return p ? { ...c, x: p.x, y: p.y } : c;
      });
    });
  }
  function onCardDragEnd(placementId: string, x: number, y: number) {
    hideGuides();
    dragSnap.current = null;
    const starts = dragStart.current;
    dragStart.current = null;
    const dragged = cards.find((c) => c.placementId === placementId);
    if (!starts || !dragged || !starts.has(dragged.bitId)) return; // single drag: the card's own onChange persisted it
    const s = starts.get(dragged.bitId)!;
    const dx = x - s.x;
    const dy = y - s.y;
    const moves: { bitId: string; before: { x: number; y: number }; after: { x: number; y: number } }[] = [];
    for (const p of groupDragPatches(cards, starts, dragged.bitId, dx, dy)) {
      patchCard(p.placementId, p.bitId, { x: p.x, y: p.y }); // per-card independent save
      moves.push({ bitId: p.bitId, before: starts.get(p.bitId)!, after: { x: p.x, y: p.y } });
    }
    // ONE entry for the whole gesture — the dragged card's own onChange("move") was
    // record-suppressed (starts still populated when it fired; see onChange below).
    moves.push({ bitId: dragged.bitId, before: s, after: { x, y } });
    arrange.recordGroupMove(moves);
  }

  // The board's keyboard (use-board-keys — ordered guards, check-corrected): Escape is
  // TWO-step (edit → selected → clear), Delete = remove-from-this-board (the ruled
  // meaning), arrows nudge, Cmd+A selects all, Cmd+=/−/0 zoom.
  function nudgeSelected(dx: number, dy: number) {
    const moves: { bitId: string; before: { x: number; y: number }; after: { x: number; y: number } }[] = [];
    for (const c of cards) {
      if (!selectedIds.has(c.placementId) || c.locked) continue; // locked = position frozen
      patchCard(c.placementId, c.bitId, { x: c.x + dx, y: c.y + dy });
      moves.push({ bitId: c.bitId, before: { x: c.x, y: c.y }, after: { x: c.x + dx, y: c.y + dy } });
    }
    arrange.noteNudge(moves); // one entry per BURST (800ms window keyed on the selection)
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
    // Real rendered sizes from THE LEDGER (registry stage 3 — read() is tidyPatches'
    // exact input shape, state-fallback where unmeasured); the MATH stays pure in
    // board-arrange.ts.
    const patches = tidyPatches(read(chosen));
    const befores = new Map(chosen.map((c) => [c.bitId, { x: c.x, y: c.y }]));
    for (const p of patches) patchCard(p.placementId, p.bitId, { x: p.x, y: p.y });
    arrange.recordTidy(patches, befores); // redo replays THESE patches, never re-runs tidy
  }
  // CARD ALIGNMENT (card-alignment-spec.md §2.3) — the owner's "PowerPoint buttons".
  // Simpler than tidy on purpose: tidy builds a grid and so needs a reading order to decide
  // which card lands in which slot; alignment has no slots, so "make these left edges match"
  // does not care which card came first.
  //
  // Locked cards are excluded, exactly as tidy excludes them (owner ruling 2026-09-02:
  // "cards have to be unlocked to align"). Sizes come from THE LEDGER, never stored w/h.
  // One undo entry per press, replaying the stored patches — never re-running the maths,
  // because a second align would compute a different bounding box.
  function arrangeSelected(
    label: string,
    compute: (measured: ReturnType<typeof read>) => Patch[],
  ) {
    // cardsRef, NOT `cards`: a click handler closes over the render it was made in, and
    // pressing two align buttons in a row must read the positions the FIRST one just
    // wrote. The ref is re-pointed every render, so it cannot be a stale snapshot.
    // (Owner-reported, 2026-09-02: "if I align top and then press bottom, the second one
    // doesn't work — have to click first".)
    const chosen = (cardsRef.current ?? cards).filter(
      (c) => selectedIds.has(c.placementId) && !c.locked,
    );
    const patches = compute(read(chosen));
    if (!patches.length) {
      // A button that does nothing is indistinguishable from a broken one. This is
      // REACHABLE and correct: align three same-height cards to the top and their
      // bottoms are already aligned, so "bottom" has nothing to do. Say so.
      if (chosen.length >= 2) flashNote("already lined up");
      return;
    }
    const befores = new Map(chosen.map((c) => [c.bitId, { x: c.x, y: c.y }]));
    for (const p of patches) patchCard(p.placementId, p.bitId, { x: p.x, y: p.y });
    arrange.recordPlacements(label, patches, befores);
  }
  const alignSelected = (edge: AlignEdge) =>
    arrangeSelected(`align ${edge === "hcenter" ? "centre" : edge === "vmiddle" ? "middle" : edge}`, (mm) =>
      alignPatches(mm, edge),
    );
  const distributeSelected = (axis: Axis) =>
    arrangeSelected(`distribute ${axis === "h" ? "across" : "down"}`, (mm) => distributePatches(mm, axis));

  // Lock / unlock the selected card's POSITION (B+): optimistic, rolled back on failure.
  // `applyLock` is the reversible core — undo replays it with the opposite state.
  async function applyLock(bitId: string, on: boolean): Promise<void> {
    const cur = cardsRef.current.find((x) => x.bitId === bitId);
    if (!cur) throw new Error("that card no longer exists on this board");
    setCards((cs) => cs.map((x) => (x.bitId === bitId ? { ...x, locked: on } : x)));
    try {
      const id = await settled(cur.placementId);
      await setPlacementLock(supabase, id, on);
    } catch (e) {
      // keyed by bitId — a call-in reconcile can rename the placementId mid-flight
      setCards((cs) => cs.map((x) => (x.bitId === bitId ? { ...x, locked: !on } : x)));
      throw e; // the caller decides: banner for the act, classify for a reverse (D3)
    }
  }
  function toggleLock(c: CardVM) {
    const on = !c.locked;
    const entry = arrange.recordLock(c.bitId, on, applyLock);
    // A rolled-back act must never sit LIVE in the stack (antagonist D3) — the
    // screen un-happened, so the entry is marked failed and can never replay.
    applyLock(c.bitId, on).catch((e) => {
      fail(entry);
      onErr(e);
    });
  }

  // DUPLICATE THIS BIT — a real copy (its own id, its own file), landing beside the
  // original so it reads as a second thing rather than a replacement. Server-side, because
  // copying the stored file is: the bytes never travel through the browser.
  // Not undoable, consistently: creating a card is not either — the reversal is trashing it.
  async function duplicateSelected(c: CardVM) {
    if (duplicatingBit) return;
    setDuplicatingBit(true);
    try {
      // FLUSH FIRST. Body keystrokes ride a 350ms debounce, and duplicateBit reads the
      // ROW — so typing a sentence and duplicating inside that window would copy the text
      // as it was BEFORE the sentence, while the screen shows both cards identical. You
      // would only find out on reload. duplicateThis (the board copy) has always done
      // this; this door shipped without it.
      await flushAll();
      await pendingCreates(); // a card made seconds ago must have its row before it is read
      const res = await duplicateBitAction(c.bitId, { boardId, x: c.x + 24, y: c.y + 24 });
      if (res.error || !res.bitId || !res.placementId) {
        onErr(new Error(res.error ?? "Couldn't duplicate that."));
        return;
      }
      // Paint it locally rather than reloading the board — the copy carries the same
      // renderable facts, only its identity and position differ.
      // Spread the original for its RENDERABLE facts, then override everything that
      // belongs to the original rather than to the copy:
      //  · locked — the lock is THIS card's position on THIS board. callInBit does not
      //    lock the new placement, so inheriting it would make the screen disagree with
      //    the database until a reload: a card that looks frozen and isn't.
      //  · imageUrl / fileUrl — the original's signed object. The copy has its OWN file
      //    now (the owner's ruling), so it gets its own urls back from the action.
      const copy: CardVM = {
        ...c,
        bitId: res.bitId,
        placementId: res.placementId,
        x: c.x + 24,
        y: c.y + 24,
        z: nextZ(),
        locked: false,
        imageUrl: res.imageUrl,
        fileUrl: res.fileUrl,
      };
      setCards((cs) => [...cs, copy]);
      selectOne(res.placementId);
      setLooseRefresh((n) => n + 1);
    } catch (e) {
      onErr(e);
    } finally {
      setDuplicatingBit(false);
    }
  }

  // Send the selected card behind everything (the demote valve — click-to-front stays, ruled).
  function sendToBack(placementId: string, bitId: string) {
    const c = cards.find((x) => x.placementId === placementId);
    const toZ = backZ(cards);
    patchCard(placementId, bitId, { z: toZ });
    if (c) arrange.recordSendToBack(bitId, c.z, toZ);
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
    onUndo: () => void doUndo(),
    onRedo: () => void doRedo(),
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
    hideGuides(); // touchcancel fires no drag-stop; the line must not strand on screen
    dragSnap.current = null;
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

  const alignableCount = cards.filter((c) => selectedIds.has(c.placementId) && !c.locked).length;
  const selectedBit = selectedIds.size === 1 ? cards.find((c) => selectedIds.has(c.placementId)) ?? null : null;

  return (
    <div className="compose-stage">
      <BoardToolbar
        onAddNote={addNote}
        onPen={() => setDrawMode(true)}
        selectMode={selectMode}
        onToggleSelect={() => { if (selectMode) clearSelection(); setSelectMode((m) => !m); }}
        selectedCount={selectedIds.size}
        // The align acts EXCLUDE locked cards, so their buttons must count the same way:
        // "2 selected, 1 locked" would otherwise offer a button that silently does nothing,
        // and "3 selected, 1 locked" would offer even-gaps and then say "already lined up",
        // which is a lie — they aren't, there just aren't three free cards to spread.
        alignableCount={alignableCount}
        onBulkUnplace={bulkUnplace}
        onBulkTrash={bulkTrash}
        onBulkArchive={bulkArchive}
        onTidy={tidySelected}
        onAlign={alignSelected}
        onDistribute={distributeSelected}
        onDuplicate={() => void duplicateThis()}
        duplicating={duplicating}
        onZoomIn={() => zoomBy(1.2)}
        onZoomOut={() => zoomBy(1 / 1.2)}
        onFit={() => fitOrToggleBack(cards)}
        zoomPct={cam.scale}
        onUndo={() => void doUndo()}
        onRedo={() => void doRedo()}
        undoLabel={undoLabel}
        redoLabel={redoLabel}
        undoNote={undoNote}
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
        <SelectedBar
          card={selectedBit}
          metaRefresh={metaSignalFor(selectedBit.bitId)}
          onTagAdd={(tag) => meaning.recordTagAdd(selectedBit.bitId, tag)}
          onTagRemove={(tag) => meaning.recordTagRemove(selectedBit.bitId, tag)}
          onOpen={() => openSelected(selectedBit.placementId, selectedBit.bitId)}
          onToggleLock={() => toggleLock(selectedBit)}
          onSendToBack={() => sendToBack(selectedBit.placementId, selectedBit.bitId)}
          onDuplicate={() => void duplicateSelected(selectedBit)}
          duplicating={duplicatingBit}
          onUnplace={() => unplaceSelected(selectedBit.placementId)}
          onTrash={() => trashSelected(selectedBit.placementId, selectedBit.bitId)}
          onArchive={() => archiveSelected(selectedBit.placementId, selectedBit.bitId)}
        />
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
              onChange={(patch, how) => {
                // RECORD-ONLY suppression for a group drag (antagonist D3): the card's
                // own onChange still persists it (onCardDragEnd deliberately skips the
                // dragged card), but the group entry in onCardDragEnd covers the record —
                // dragStart.current is still populated here (nulled only in onCardDragEnd).
                if (how === "move" && !dragStart.current?.has(c.bitId)) {
                  const b = dragBefore.current;
                  if (b && b.bitId === c.bitId && patch.x !== undefined && patch.y !== undefined) {
                    arrange.recordMove({ bitId: c.bitId, before: { x: b.x, y: b.y }, after: { x: patch.x, y: patch.y } });
                  }
                  dragBefore.current = null;
                }
                if (how === "resize") {
                  const b = resizeBefore.current;
                  if (b && b.bitId === c.bitId && patch.x !== undefined && patch.y !== undefined && patch.w !== undefined) {
                    arrange.recordResize(
                      c.bitId,
                      { x: b.x, y: b.y, w: b.w, h: b.h },
                      { x: patch.x, y: patch.y, w: patch.w, h: patch.h },
                    );
                  }
                  resizeBefore.current = null;
                }
                // "grow" (auto-widen) and "write" (body) route RAW — reflexes and flow.
                patchCard(c.placementId, c.bitId, patch);
              }}
              onContentSave={(v) => saveContent(c.placementId, c.bitId, v)}
              onSourceAct={(prev, next) => meaning.recordSourceChange(c.bitId, prev, next)}
              metaRefresh={metaSignalFor(c.bitId)}
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
              measureRef={measure(c.placementId)}
              onDragStart={() => onCardDragStart(c.placementId)}
              onResizeStart={() =>
                (resizeBefore.current = { bitId: c.bitId, x: c.x, y: c.y, w: c.w, h: c.h })
              }
              onDragMove={(x, y) => onCardDragMove(c.placementId, x, y)}
              snapDrop={(x, y, e) => snapDrop(c, x, y, e)}
              onDragEnd={(x, y) => onCardDragEnd(c.placementId, x, y)}
            />
          ))}
          {/* The guides — INSIDE the world layer, which is the whole point: they are
              positioned in WORLD coordinates, so the board's pan/zoom transform carries
              them for free. Mounted outside it first, and they were invisible — placed at
              world coordinates inside a screen-space box, i.e. somewhere off in the void.
              Permanently mounted and driven by style mutation: deriving their visibility
              from React state would re-render the board on every frame of a drag. */}
          <div ref={vGuideRef} className="snap-guide" />
          <div ref={hGuideRef} className="snap-guide" />
        </div>
        {marquee.marqueeBox && (
          <div
            className="marquee-box"
            style={{ left: marquee.marqueeBox.left, top: marquee.marqueeBox.top, width: marquee.marqueeBox.w, height: marquee.marqueeBox.h }}
          />
        )}
        <Drawer variant="board" boardId={boardId} onBringIn={bringIn} onJumpTo={jumpToCard} refreshSignal={looseRefresh} />
        {drawMode && <DrawOverlay onDone={finishDoodle} onCancel={() => setDrawMode(false)} />}
        {process.env.NODE_ENV === "development" && <UndoDevReadout snapshot={devSnapshot} />}
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
