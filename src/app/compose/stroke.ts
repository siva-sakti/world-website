import { getStroke } from "perfect-freehand";
import type { Stroke } from "./types";

// The validated pen: a pressure-aware filled outline (perfect-freehand → SVG),
// reproducing the feel from the Daylight spike. Vector, so it's tiny + scales
// crisp. Real stylus pressure is used (simulatePressure off); a mouse reports a
// constant pressure, so mouse strokes come out an even width — fine for desktop.
const OPTIONS = {
  size: 7,
  thinning: 0.6,
  smoothing: 0.5,
  streamline: 0.5,
  simulatePressure: false,
};

// One stroke → one SVG path string (a single filled outline, not stacked blobs).
export function strokeToPath(points: Stroke): string {
  const outline = getStroke(points, OPTIONS);
  if (!outline.length) return "";
  const d = outline.reduce(
    (acc: (string | number)[], [x0, y0], i, arr) => {
      const [x1, y1] = arr[(i + 1) % arr.length];
      acc.push(x0, y0, (x0 + x1) / 2, (y0 + y1) / 2);
      return acc;
    },
    ["M", ...outline[0], "Q"] as (string | number)[],
  );
  d.push("Z");
  return d.join(" ");
}

// Bounding box of all points across strokes (in their own coord space).
export function strokesBounds(strokes: Stroke[]) {
  let minX = Infinity;
  let minY = Infinity;
  let maxX = -Infinity;
  let maxY = -Infinity;
  for (const s of strokes) {
    for (const [x, y] of s) {
      if (x < minX) minX = x;
      if (y < minY) minY = y;
      if (x > maxX) maxX = x;
      if (y > maxY) maxY = y;
    }
  }
  return { minX, minY, maxX, maxY, w: maxX - minX, h: maxY - minY };
}
