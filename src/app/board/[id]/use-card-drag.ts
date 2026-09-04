import { useRef } from "react";
import type { Dispatch, SetStateAction } from "react";
import { snapTo, type Box } from "./geometry";
import { groupDragPatches } from "./board-arrange";
import type { CardVM } from "./card-vm";

// DRAGGING A CARD — the snap guides, and moving a whole selection together.
//
// Lifted out of board-surface.tsx (S1, 2026-09-03), which was doing seven jobs in 917
// lines. This is one of them, and a cohesive one: the magenta guides exist only to serve
// a drag, and the group-drag bookkeeping shares the same start/move/end. Its pure maths
// already lives elsewhere and is tested — `snapTo` in geometry.ts, `groupDragPatches` in
// board-arrange.ts — so what is here is the wiring between them and the DOM.
//
// A pure move: no behaviour changed in the extraction.

export type CardDragDeps = {
  cards: CardVM[];
  setCards: Dispatch<SetStateAction<CardVM[]>>;
  selectedIds: Set<string>;
  boardRef: React.RefObject<HTMLDivElement | null>;
  /** The camera as a REF — read during a drag, when no re-render happens. */
  camRef: React.RefObject<{ x: number; y: number; scale: number }>;
  screenToWorld: (x: number, y: number) => { x: number; y: number };
  /** True rendered sizes (use-geometry) — a text card's stored height is not its height. */
  sizeOf: (placementId: string) => { w: number; h: number } | null;
  patchCard: (placementId: string, bitId: string, patch: Partial<CardVM>) => void;
  recordGroupMove: (
    moves: { bitId: string; before: { x: number; y: number }; after: { x: number; y: number } }[],
  ) => void;
};

export function useCardDrag({
  cards,
  setCards,
  selectedIds,
  boardRef,
  camRef,
  screenToWorld,
  sizeOf,
  patchCard,
  recordGroupMove,
}: CardDragDeps) {
  // Every selected card's position at drag start, keyed by BIT id (a call-in reconcile can
  // rename a placementId mid-drag; bit ids never rename, and are unique per board).
  const dragStart = useRef<Map<string, { x: number; y: number }> | null>(null);
  // A SINGLE drag's before-position — the card's own onChange("move") turns it into the
  // undo entry, so board-surface reads this one.
  const dragBefore = useRef<{ bitId: string; x: number; y: number } | null>(null);

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
  const dragSnap = useRef<{ others: Box[]; moved: boolean; alt: boolean; fromX: number; fromY: number } | null>(null);

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
    if (c.angle) return null; // the dragged card is rotated → it opts out too (§5)
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
    const from = cards.find((c) => c.placementId === placementId);
    dragSnap.current = {
      moved: false,
      alt: false,
      fromX: from?.x ?? 0,
      fromY: from?.y ?? 0,
      others: cards
        // `!c.angle`: a rotated card opts OUT of alignment (rotation-plan §5, owner-ruled)
        // — its stored box is not what the eye sees, so it would draw a guide to an edge
        // that isn't there. Both directions: see snapFor for the dragged card.
        .filter((c) => c.placementId !== placementId && !selectedIds.has(c.placementId) && !c.angle)
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
      // A REAL drag, not a twitch. `moved` used to flip on the first drag event with no
      // threshold at all — while the pan handler and the marquee both demand 4px. So a
      // 1px wobble during a click on a card near a neighbour snapped it away AND recorded
      // a "move card" undo entry, for a gesture the owner experienced as a click. Same
      // threshold as its two siblings now.
      const st = dragSnap.current;
      if (!st.moved) {
        if (Math.hypot(x - st.fromX, y - st.fromY) < 4) return;
        st.moved = true;
      }
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
    recordGroupMove(moves);
  }

  /** An interrupted gesture (OS gesture, alert, tab switch) must strand nothing: no line
   *  left on screen, no half-built snap state. The board's pointer-cancel calls this
   *  rather than reaching into the two internals it used to. */
  function cancelDrag() {
    hideGuides();
    dragSnap.current = null;
  }

  return {
    /** Mounted permanently in the world layer; shown by mutating style, never by state. */
    vGuideRef,
    hGuideRef,
    snapDrop,
    onCardDragStart,
    onCardDragMove,
    onCardDragEnd,
    cancelDrag,
    /** Read by the card's onChange to tell a group drag from a single one, and to build
     *  the single drag's undo entry. */
    dragStart,
    dragBefore,
  };
}
