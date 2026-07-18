"use client";

import { strokeToPath, strokesBounds } from "./stroke";
import type { Stroke } from "./types";

const INK = "#1c1813";

// A finished doodle: its strokes (stored relative to the bit's top-left) drawn
// as SVG paths. The viewBox stays the ink's native size while the <svg> fills
// the card, so resizing the card scales the vector ink — crisp at any size.
export function DoodleBit({ strokes }: { strokes: Stroke[] }) {
  const b = strokesBounds(strokes);
  const w = Math.max(1, b.maxX);
  const h = Math.max(1, b.maxY);
  return (
    <svg
      className="compose-doodle-svg"
      viewBox={`0 0 ${w} ${h}`}
      preserveAspectRatio="none"
    >
      {strokes.map((s, i) => (
        <path key={i} d={strokeToPath(s)} fill={INK} />
      ))}
    </svg>
  );
}
