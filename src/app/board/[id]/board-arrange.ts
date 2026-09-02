// PURE arrangement geometry — no React, no DOM, no supabase (undo plan §4; the
// camera-storage/placement-anchor precedent). Lifted OUT of board-surface.tsx so
// the math the undo stack records is unit-testable, and so the a447a95 bug class
// (group-drag keyed by bitId, read by placementId — two disjoint uuid spaces, the
// lookup never matched) is pinned by a permanent regression test instead of luck.

export type ArrangeCard = {
  bitId: string;
  placementId: string;
  x: number;
  y: number;
  z: number;
  locked?: boolean;
};

export type Patch = { bitId: string; placementId: string; x: number; y: number };

/** Group-drag: every follower's new position from the dragged card's delta.
 *  `starts` is keyed by BIT id (placement ids can rename mid-drag — a call-in
 *  reconcile; bit ids never do). The dragged card itself is excluded: react-rnd
 *  owns it until drag-stop. Cards absent from `starts` (locked, unselected)
 *  are untouched. */
export function groupDragPatches(
  cards: ArrangeCard[],
  starts: Map<string, { x: number; y: number }>,
  draggedBitId: string,
  dx: number,
  dy: number,
): Patch[] {
  const out: Patch[] = [];
  for (const c of cards) {
    if (c.bitId === draggedBitId || !starts.has(c.bitId)) continue;
    const p0 = starts.get(c.bitId)!;
    out.push({ bitId: c.bitId, placementId: c.placementId, x: p0.x + dx, y: p0.y + dy });
  }
  return out;
}

/** Tidy-up: arrange the chosen cards in a neat grid at the selection's own
 *  top-left. Reading order = banded rows (raw (y,x) flips visually-level cards):
 *  sort by y, a new row opens past a 40-world-px band, x within a row. Sizes come
 *  from the caller's MEASUREMENTS (text heights are stale in state by design).
 *  Returns only real moves — no-op positions are skipped, so an undo entry built
 *  from these patches reverses exactly what happened and nothing else. */
export function tidyPatches(
  measured: { card: ArrangeCard; w: number; h: number }[],
  opts: { band?: number; gap?: number } = {},
): Patch[] {
  if (measured.length < 2) return [];
  const BAND = opts.band ?? 40;
  const GAP = opts.gap ?? 16;
  const sorted = [...measured].sort((a, b) => a.card.y - b.card.y);
  const bands: (typeof measured)[] = [];
  for (const m of sorted) {
    const last = bands[bands.length - 1];
    if (last && m.card.y <= last[0].card.y + BAND) last.push(m);
    else bands.push([m]);
  }
  const reading = bands.flatMap((b) => [...b].sort((p, q) => p.card.x - q.card.x));
  const cols = Math.ceil(Math.sqrt(reading.length));
  const cellW = Math.max(...measured.map((m) => m.w)) + GAP;
  const cellH = Math.max(...measured.map((m) => m.h)) + GAP;
  const x0 = Math.min(...measured.map((m) => m.card.x));
  const y0 = Math.min(...measured.map((m) => m.card.y));
  const out: Patch[] = [];
  reading.forEach((m, i) => {
    const nx = x0 + (i % cols) * cellW;
    const ny = y0 + Math.floor(i / cols) * cellH;
    if (nx !== m.card.x || ny !== m.card.y)
      out.push({ bitId: m.card.bitId, placementId: m.card.placementId, x: nx, y: ny });
  });
  return out;
}

/** The z the next fronted card takes (one above everything). */
export function nextZ(cards: { z: number }[]): number {
  return cards.reduce((m, c) => Math.max(m, c.z), 0) + 1;
}

/** The z that sits behind everything. */
export function backZ(cards: { z: number }[]): number {
  return cards.reduce((m, c) => Math.min(m, c.z), 0) - 1;
}

export type Box = { x: number; y: number; w: number; h: number };
export type ViewRect = { minX: number; minY: number; maxX: number; maxY: number };

const SPAWN_STEP = 36; // how far down-right each attempt moves
const SPAWN_TRIES = 24; //  ... and how many attempts before giving up
const SPAWN_MARGIN = 12; // breathing room demanded around an existing card

/** LOOK-THEN-PLACE: where a new card should land so it doesn't cover another one.
 *
 *  Step down-right from `start`, and take the first spot that is clear of every box
 *  in `taken` — PREFERRING one that also sits fully inside `view`, because a new
 *  thing appearing off-screen reads as not having appeared at all. A spot that is
 *  clear but off-screen is held as the fallback and returned only if nothing better
 *  turns up.
 *
 *  Returns null when 24 steps found nothing clear at all; the caller then has its own
 *  last-resort cascade. (Before this lived here it sat inside use-create-doors, where
 *  it could only be checked by dropping files onto a board by hand — the rule is the
 *  same, it can now be asserted. The impure parts — the board's rect, the world
 *  transform, the geometry ledger — stay at the call site.) */
export function firstClearSpot(
  size: { w: number; h: number },
  start: { x: number; y: number },
  taken: Box[],
  view: ViewRect,
): { x: number; y: number } | null {
  let clearButOffscreen: { x: number; y: number } | null = null;
  for (let i = 0; i < SPAWN_TRIES; i++) {
    const x = start.x + i * SPAWN_STEP;
    const y = start.y + i * SPAWN_STEP;
    const overlaps = taken.some(
      (q) =>
        x < q.x + q.w + SPAWN_MARGIN &&
        x + size.w + SPAWN_MARGIN > q.x &&
        y < q.y + q.h + SPAWN_MARGIN &&
        y + size.h + SPAWN_MARGIN > q.y,
    );
    if (overlaps) continue;
    const inView = x >= view.minX && y >= view.minY && x + size.w <= view.maxX && y + size.h <= view.maxY;
    if (inView) return { x, y };
    if (!clearButOffscreen) clearButOffscreen = { x, y };
  }
  return clearButOffscreen;
}

// ---- CARD ALIGNMENT: align & distribute (card-alignment-spec.md §2.3) ----
//
// The owner's ask, in her words: *"usually what I see, like for example PowerPoint, they
// have a range vertical, range horizontal, center — you press those buttons so we don't
// have to guess."*
//
// Deliberately simpler than tidy, and that is the point. Tidy builds a GRID, so it needs
// a reading order (the 40px banding above) to decide which card lands in which slot.
// Alignment has no slots: "make these left edges match" does not care which card is
// first. The owner spotted that herself and it is why this exists rather than an
// extension of tidy.
//
// LOCKED CARDS ARE EXCLUDED BY THE CALLER, exactly as they are for tidy (owner ruling,
// 2026-09-02: "cards have to be unlocked to align"). Nothing here checks `locked` — the
// caller passes only what may move, which keeps this a pure function of its input.
//
// Sizes come from the caller's MEASUREMENTS (the geometry ledger), never from stored
// w/h — a text card's stored height is stale by design.

export type AlignEdge = "left" | "hcenter" | "right" | "top" | "vmiddle" | "bottom";
export type Axis = "h" | "v";

type Measured = { card: ArrangeCard; w: number; h: number };

const patchIfMoved = (m: Measured, x: number, y: number): Patch[] =>
  x !== m.card.x || y !== m.card.y
    ? [{ bitId: m.card.bitId, placementId: m.card.placementId, x, y }]
    : [];

/** Make one edge (or the centre line) of every card match.
 *
 *  The target is the SELECTION'S BOUNDING BOX, not an average — so "align left" puts
 *  everything on the leftmost card's edge and that card does not move, which is what a
 *  hand expects. Centre alignment uses the box's midline, so differently-sized cards end
 *  up centred on each other rather than edge-matched. */
export function alignPatches(measured: Measured[], edge: AlignEdge): Patch[] {
  if (measured.length < 2) return [];
  const minX = Math.min(...measured.map((m) => m.card.x));
  const maxX = Math.max(...measured.map((m) => m.card.x + m.w));
  const minY = Math.min(...measured.map((m) => m.card.y));
  const maxY = Math.max(...measured.map((m) => m.card.y + m.h));
  return measured.flatMap((m) => {
    switch (edge) {
      case "left":    return patchIfMoved(m, minX, m.card.y);
      case "right":   return patchIfMoved(m, maxX - m.w, m.card.y);
      case "hcenter": return patchIfMoved(m, (minX + maxX) / 2 - m.w / 2, m.card.y);
      case "top":     return patchIfMoved(m, m.card.x, minY);
      case "bottom":  return patchIfMoved(m, m.card.x, maxY - m.h);
      case "vmiddle": return patchIfMoved(m, m.card.x, (minY + maxY) / 2 - m.h / 2);
    }
  });
}

/** Even out the GAPS between cards along one axis — not their positions.
 *
 *  Equal gaps, not equal spacing of origins: cards of different sizes should LOOK evenly
 *  spread, which is about the air between them. The two outermost cards never move (they
 *  define the span), so this tightens or opens what is already there rather than
 *  relocating the group. Needs 3 — with 2 there is nothing between them to even out.
 *
 *  If the cards already overlap more than the span allows, the gap comes out negative and
 *  they overlap EVENLY. That is the honest answer; refusing would be worse than doing the
 *  arithmetic the owner asked for. */
export function distributePatches(measured: Measured[], axis: Axis): Patch[] {
  if (measured.length < 3) return [];
  const pos = (m: Measured) => (axis === "h" ? m.card.x : m.card.y);
  const size = (m: Measured) => (axis === "h" ? m.w : m.h);
  const sorted = [...measured].sort((a, b) => pos(a) - pos(b));
  const first = sorted[0];
  const last = sorted[sorted.length - 1];
  const span = pos(last) + size(last) - pos(first);
  const occupied = sorted.reduce((sum, m) => sum + size(m), 0);
  const gap = (span - occupied) / (sorted.length - 1);
  const out: Patch[] = [];
  let cursor = pos(first) + size(first) + gap;
  for (let i = 1; i < sorted.length - 1; i++) {
    const m = sorted[i];
    out.push(...(axis === "h" ? patchIfMoved(m, cursor, m.card.y) : patchIfMoved(m, m.card.x, cursor)));
    cursor += size(m) + gap;
  }
  return out;
}
