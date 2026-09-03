// PURE board geometry — no React, no DOM (geometry-registry-plan.md §2; the
// board-arrange/camera-storage precedent). Three jobs:
//   1. box unions (what fitView frames),
//   2. the snap-guide math: given the dragged card's live box and everyone
//      else's, find the nearest edge/center alignment within a threshold,
//   3. the rotate-drag math (rotateAngle, at the bottom).
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

const EXTEND = 24; // DEFAULT overshoot, world px — see the `extend` parameter below

function lines1D(lo: number, size: number): number[] {
  return [lo, lo + size / 2, lo + size]; // edge · center · edge
}

/** Nearest edge/center alignment of `dragged` against `others`, within
 *  `threshold` (WORLD px — the caller divides screen px by the camera scale).
 *  Axes are independent: you can snap in x while free in y. The PHYSICALLY
 *  NEAREST card wins (see `better`); a tie is decided by the tighter
 *  alignment, then by array order — stable either way. No candidate →
 *  position unchanged, no guide.
 *
 *  `extend` is how far the guide overshoots both boxes, in WORLD px. The caller passes
 *  a screen-px constant ÷ the camera scale, so the overshoot looks the same at every
 *  zoom — a fixed world value shrinks to a few screen px when zoomed out, exactly where
 *  seeing what you are aligning to matters most. Defaults to the original 24 so the
 *  committed tests still describe the same thing. */
type Best = { delta: number; at: number; other: Box; dist: number };

/** Straight-line distance between two boxes' centres — how the winner is chosen. */
function centreDist(a: Box, b: Box): number {
  return Math.hypot(a.x + a.w / 2 - (b.x + b.w / 2), a.y + a.h / 2 - (b.y + b.h / 2));
}

/** PROXIMITY FIRST, then tidiness. Every candidate here is already within the threshold,
 *  so they are all "aligned" as far as the eye is concerned — once snapped, 1px-off and
 *  5px-off give identical results. Letting a 4px difference in tidiness beat "this card is
 *  right next to you" picks the wrong winner and throws a long guide line across the board
 *  to something you were not thinking about. (Owner, 2026-09-02: it should snap "to the
 *  closest things it is to when you drag it".) Distance decides; delta breaks ties. */
function better(candidate: Best, current: Best | null): boolean {
  if (!current) return true;
  if (candidate.dist !== current.dist) return candidate.dist < current.dist;
  return Math.abs(candidate.delta) < Math.abs(current.delta);
}

export function snapTo(dragged: Box, others: Box[], threshold: number, extend = EXTEND): SnapResult {
  let bestX: Best | null = null;
  let bestY: Best | null = null;

  const dx = lines1D(dragged.x, dragged.w);
  const dy = lines1D(dragged.y, dragged.h);

  for (const o of others) {
    const dist = centreDist(dragged, o); // once per card, not per candidate line
    for (const ox of lines1D(o.x, o.w)) {
      for (const dxl of dx) {
        const delta = ox - dxl;
        const c = { delta, at: ox, other: o, dist };
        if (Math.abs(delta) <= threshold && better(c, bestX)) bestX = c;
      }
    }
    for (const oy of lines1D(o.y, o.h)) {
      for (const dyl of dy) {
        const delta = oy - dyl;
        const c = { delta, at: oy, other: o, dist };
        if (Math.abs(delta) <= threshold && better(c, bestY)) bestY = c;
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
          from: Math.min(y, bestX.other.y) - extend,
          to: Math.max(y + dragged.h, bestX.other.y + bestX.other.h) + extend,
        }
      : null,
    hGuide: bestY
      ? {
          at: bestY.at,
          from: Math.min(x, bestY.other.x) - extend,
          to: Math.max(x + dragged.w, bestY.other.x + bestY.other.w) + extend,
        }
      : null,
  };
}

/** Degrees folded into (-180, 180] — small, signed, 0 = upright.
 *  Deliberately NOT the `((d % 360) + 360) % 360` idiom: adding 360 to a value that
 *  already sits in range rounds it (0.1 comes back as 0.10000000000002274), which
 *  would break rotateAngle's no-move-no-change guarantee for a fractional angle.
 *  A bare `%` is exact, and neither branch fires on an in-range value. */
function normDeg(d: number): number {
  const m = d % 360;
  if (m > 180) return m - 360;
  if (m <= -180) return m + 360;
  return m;
}

/** The angle a rotate-drag should produce (rotation-plan v3 §2.2). All degrees.
 *  startAngle    — the card's angle when the handle was grabbed
 *  grabPointer   — atan2 angle of the pointer at grab, about the card's centre
 *  nowPointer    — atan2 angle of the pointer now
 *  snap          — hold Shift → 15° steps
 *
 *  RELATIVE, not absolute: the card turns by however far the pointer has swept since
 *  the grab, so grabbing a 45° card and twitching one pixel leaves it at ~45° instead
 *  of snapping to the handle's own direction. The sweep is normalised BEFORE it is
 *  applied, so crossing the ±180 seam reads as a 1° step, never a 359° spin.
 *  Snapping is applied to the RESULT, so the card lands on exact multiples of 15
 *  (a 15° grid is closed under ±360, so it does not matter that normalising follows).
 *  Returns a value in (-180, 180]. */
export function rotateAngle(
  startAngle: number,
  grabPointer: number,
  nowPointer: number,
  snap: boolean,
): number {
  const total = startAngle + normDeg(nowPointer - grabPointer);
  return normDeg(snap ? Math.round(total / 15) * 15 : total);
}
