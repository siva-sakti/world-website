// Pure landing-spot math for "send to board" (Batch 2 — send-to-board-plan.md). Sending from the
// loose page you're NOT looking at the board, so arrivals land just to the RIGHT of the board's
// existing cluster (never on top of it), cascading gently down-right for several. Kept pure and
// DOM-free so it's unit-testable.
//
// IMPORTANT (independent-check finding #3): placement.width is nullable and every loose-placed card
// stores width = null — the per-type size default lives only in the render layer, not the DB. So we
// must COALESCE a default width when measuring the cluster's right edge; otherwise a real ~240px card
// measures as zero-width and we'd drop newcomers straight on top of it. We only need "outside the
// box", so an approximate default width is fine.

export type Point = { x: number; y: number };
export type PlacedCard = { x: number | null; y: number | null; width: number | null };

const DEFAULT_W = 240; // matches the render-layer text default; only used to measure existing cards
const GAP = 48; // clearance to the right of the cluster
const CASCADE = 40; // per-arrival diagonal offset so several sent at once don't stack

// The anchor for arrivals: just past the cluster's right edge, aligned to its top. An empty board —
// or one whose cards are all pile-mode (null position) — has no cluster, so use a near-origin default.
export function anchorNearContent(cards: PlacedCard[]): Point {
  const placed = cards.filter((c) => c.x != null && c.y != null); // skip pile-mode (position absent)
  if (placed.length === 0) return { x: 40, y: 40 }; // NB: filtered length, not cards.length (Math.max()→-Infinity)
  const right = Math.max(...placed.map((c) => (c.x as number) + (c.width ?? DEFAULT_W)));
  const top = Math.min(...placed.map((c) => c.y as number));
  return { x: right + GAP, y: top };
}

// Where the i-th arrival (0-based) lands — a gentle down-right cascade from the anchor so a batch
// doesn't pile at one point.
export function pointForIndex(anchor: Point, i: number): Point {
  return { x: anchor.x + i * CASCADE, y: anchor.y + i * CASCADE };
}

// A GRID for gathering, as opposed to the cascade above.
//
// The cascade exists for SENDING a few things to a board you are not looking at — it steps
// down-right so two arrivals don't stack. Gathering is a different act: "make a board from
// these" can bring forty things at once, and forty cascaded cards is a 1,600px diagonal
// (three hundred is a 12,000px one). The owner expects to arrange what lands — but a
// diagonal is a worse thing to arrange FROM than a grid.
//
// Square-ish, because there is no reading order to honour here: nothing has a position yet,
// so nothing can be scrambled. Cell size is a plain default — real sizes are only known
// once the cards render, and this is a landing spot, not a layout.

const CELL_W = 280;
const CELL_H = 240;
const ORIGIN = { x: 40, y: 40 };

/** Where the i-th of `total` gathered cards lands. */
export function gridPointForIndex(i: number, total: number): Point {
  const cols = Math.max(1, Math.ceil(Math.sqrt(total)));
  return {
    x: ORIGIN.x + (i % cols) * CELL_W,
    y: ORIGIN.y + Math.floor(i / cols) * CELL_H,
  };
}
