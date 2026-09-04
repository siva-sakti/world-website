import { tidyPatches, alignPatches, distributePatches, type AlignEdge, type Axis } from "./board-arrange";
import type { CardVM } from "./card-vm";

// LINING CARDS UP — nudge · tidy · align · distribute.
//
// Lifted out of board-surface.tsx (S1, 2026-09-03). One job: take the selection, ask a
// pure function where each card should go, and apply the answer as ONE undoable act. The
// maths is all in board-arrange.ts and tested there; what lives here is which cards take
// part, their REAL measured sizes, and the wording of the undo entry.
//
// The rule that repeats through all of them: a LOCKED card opts out. That is all.
//
// A ROTATED card used to opt out too, on the grounds that its stored rectangle is not what
// the eye sees. The observation was right and the conclusion was wrong (owner, 2026-09-04:
// *"once a bit is rotated, if you try to bring it into alignment you're not able to — to me
// that's a bug"*). Alignment now measures the box you SEE (`visualBox` in geometry.ts), so a
// tilted card lines up by its visible edges. Upright cards are untouched: at angle 0 the
// visual box IS the card's box, asserted in geometry.test.mjs.
//
// A pure move: no behaviour changed in the extraction.

type Patch = { placementId: string; bitId: string; x: number; y: number };
type Move = { bitId: string; before: { x: number; y: number }; after: { x: number; y: number } };

export type AlignmentDeps = {
  cards: CardVM[];
  /** Reverse-time truth — never a snapshot (the house rule). */
  cardsRef: React.RefObject<CardVM[]>;
  selectedIds: Set<string>;
  patchCard: (placementId: string, bitId: string, patch: Partial<CardVM>) => void;
  /** Real rendered sizes from the geometry ledger — a text card's stored height is stale by design. */
  read: (cards: CardVM[]) => { card: CardVM; w: number; h: number }[];
  /** The transient receipt line, including the "already lined up" no-op notice. */
  flashNote: (msg: string) => void;
  arrange: {
    noteNudge: (moves: Move[]) => void;
    recordTidy: (patches: Patch[], befores: Map<string, { x: number; y: number }>) => void;
    recordPlacements: (label: string, patches: Patch[], befores: Map<string, { x: number; y: number }>) => void;
  };
};

export function useAlignmentActs({
  cards,
  cardsRef,
  selectedIds,
  patchCard,
  read,
  flashNote,
  arrange,
}: AlignmentDeps) {
  function nudgeSelected(dx: number, dy: number) {
    const moves: { bitId: string; before: { x: number; y: number }; after: { x: number; y: number } }[] = [];
    for (const c of cards) {
      if (!selectedIds.has(c.placementId) || c.locked) continue; // locked = position frozen
      patchCard(c.placementId, c.bitId, { x: c.x + dx, y: c.y + dy });
      moves.push({ bitId: c.bitId, before: { x: c.x, y: c.y }, after: { x: c.x + dx, y: c.y + dy } });
    }
    arrange.noteNudge(moves); // one entry per BURST (800ms window keyed on the selection)
  }

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

  return { nudgeSelected, tidySelected, alignSelected, distributeSelected };
}
