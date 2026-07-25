import { getStroke } from "perfect-freehand";
import type { Stroke, Drawing } from "@/lib/types";

// The validated pen: a pressure-aware filled outline (perfect-freehand → SVG),
// reproducing the feel from the Daylight spike. Vector, so it's tiny + scales
// crisp. Real stylus pressure is used (simulatePressure off); a mouse reports a
// constant pressure, so mouse strokes come out an even width — fine for desktop.
const OPTIONS = {
  thinning: 0.6,
  smoothing: 0.5,
  streamline: 0.5,
  simulatePressure: false,
};

// The pen widths the owner can pick (nib size feeds perfect-freehand's `size`).
export const PEN_WIDTHS: { label: string; size: number }[] = [
  { label: "extra fine", size: 1.8 },
  { label: "fine", size: 3.5 },
  { label: "medium", size: 7 },
  { label: "bold", size: 12 },
  { label: "extra bold", size: 20 },
];

// The one pen/text ink color (mirrored as --ink in globals.css); the default.
export const INK = "#1c1813";
export const DEFAULT_PEN = 7;

// The pen colors — a quiet, natural, ink-like palette (the owner's expression).
export const PEN_COLORS: { label: string; color: string }[] = [
  { label: "ink", color: INK },
  { label: "indigo", color: "#3b3f72" },
  { label: "cerulean", color: "#2b6f8c" },
  { label: "forest", color: "#4e6b4a" },
  { label: "terracotta", color: "#9c5744" },
  { label: "ochre", color: "#b07d2b" },
];

// One stroke → one SVG path string (a single filled outline, not stacked blobs).
export function strokeToPath(points: Stroke, size: number = DEFAULT_PEN): string {
  const outline = getStroke(points, { ...OPTIONS, size });
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

// Read a stored drawing into { strokes, sizes }, tolerating the old shape where
// bit.strokes was a bare Stroke[] (no per-stroke width → all DEFAULT_PEN).
export function normalizeDrawing(raw: unknown): Drawing {
  if (raw && typeof raw === "object" && !Array.isArray(raw)) {
    const r = raw as { strokes?: Stroke[]; sizes?: number[]; colors?: string[] };
    const strokes = Array.isArray(r.strokes) ? r.strokes : [];
    const sizes =
      Array.isArray(r.sizes) && r.sizes.length === strokes.length
        ? r.sizes
        : strokes.map(() => DEFAULT_PEN);
    const colors =
      Array.isArray(r.colors) && r.colors.length === strokes.length
        ? r.colors
        : strokes.map(() => INK);
    return { strokes, sizes, colors };
  }
  if (Array.isArray(raw)) {
    const strokes = raw as Stroke[];
    return { strokes, sizes: strokes.map(() => DEFAULT_PEN), colors: strokes.map(() => INK) };
  }
  return { strokes: [], sizes: [], colors: [] };
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
