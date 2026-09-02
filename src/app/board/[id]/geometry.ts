// PURE board geometry — no React, no DOM (geometry-registry-plan.md §2; the
// board-arrange/camera-storage precedent). Two jobs:
//   1. box unions (what fitView frames),
//   2. the snap-guide math: given the dragged card's live box and everyone
//      else's, find the nearest edge/center alignment within a threshold.
//
// DESIGN FROM THE OWNER'S REFERENCES (plan §4b): snapping is a WHISPER — one
// small threshold, nearest candidate wins, both axes independent, and the
// caller converts the threshold from SCREEN px (÷ camera scale) so the feel is
// identical at every zoom (antagonist D7). Guides draw past both boxes the way
// the reference tool's magenta lines do.

export type Size = { w: number; h: number };
export type Box = { x: number; y: number; w: number; h: number };

/** The union of boxes — what fit-view frames. Null for an empty board. */
export function boundsOf(boxes: Box[]): Box | null {
  if (!boxes.length) return null;
  let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
  for (const b of boxes) {
    if (b.x < minX) minX = b.x;
    if (b.y < minY) minY = b.y;
    if (b.x + b.w > maxX) maxX = b.x + b.w;
    if (b.y + b.h > maxY) maxY = b.y + b.h;
  }
  return { x: minX, y: minY, w: maxX - minX, h: maxY - minY };
}

/** A guide to draw: a vertical line at x (or horizontal at y), spanning from..to
 *  on the other axis — extended past both boxes, reference-style. */
export type Guide = { at: number; from: number; to: number };

export type SnapResult = {
  x: number; // the dragged box's snapped position (unchanged axis = input)
  y: number;
  vGuide: Guide | null; // vertical line (an x alignment)
  hGuide: Guide | null; // horizontal line (a y alignment)
};

const EXTEND = 24; // world px the guide overshoots both boxes — the reference look

function lines1D(lo: number, size: number): number[] {
  return [lo, lo + size / 2, lo + size]; // edge · center · edge
}

/** Nearest edge/center alignment of `dragged` against `others`, within
 *  `threshold` (WORLD px — the caller divides screen px by the camera scale).
 *  Axes are independent: you can snap in x while free in y. Nearest candidate
 *  wins; a tie keeps the first (stable). No candidate → position unchanged,
 *  no guide. */
export function snapTo(dragged: Box, others: Box[], threshold: number): SnapResult {
  let bestX: { delta: number; at: number; other: Box } | null = null;
  let bestY: { delta: number; at: number; other: Box } | null = null;

  const dx = lines1D(dragged.x, dragged.w);
  const dy = lines1D(dragged.y, dragged.h);

  for (const o of others) {
    for (const ox of lines1D(o.x, o.w)) {
      for (const dxl of dx) {
        const delta = ox - dxl;
        if (Math.abs(delta) <= threshold && (!bestX || Math.abs(delta) < Math.abs(bestX.delta))) {
          bestX = { delta, at: ox, other: o };
        }
      }
    }
    for (const oy of lines1D(o.y, o.h)) {
      for (const dyl of dy) {
        const delta = oy - dyl;
        if (Math.abs(delta) <= threshold && (!bestY || Math.abs(delta) < Math.abs(bestY.delta))) {
          bestY = { delta, at: oy, other: o };
        }
      }
    }
  }

  const x = dragged.x + (bestX?.delta ?? 0);
  const y = dragged.y + (bestY?.delta ?? 0);
  return {
    x,
    y,
    vGuide: bestX
      ? {
          at: bestX.at,
          from: Math.min(y, bestX.other.y) - EXTEND,
          to: Math.max(y + dragged.h, bestX.other.y + bestX.other.h) + EXTEND,
        }
      : null,
    hGuide: bestY
      ? {
          at: bestY.at,
          from: Math.min(x, bestY.other.x) - EXTEND,
          to: Math.max(x + dragged.w, bestY.other.x + bestY.other.w) + EXTEND,
        }
      : null,
  };
}
