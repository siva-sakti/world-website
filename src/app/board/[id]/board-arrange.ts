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
