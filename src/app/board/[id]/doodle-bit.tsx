"use client";

import { strokeToPath, strokesBounds, INK } from "@/lib/stroke";
import type { Drawing } from "@/lib/types";

// A finished doodle: each stroke drawn as an SVG path at its own pen width. The
// viewBox stays the ink's native size while the <svg> fills the card, so
// resizing the card scales the vector ink — crisp at any size.
export function DoodleBit({ drawing }: { drawing: Drawing }) {
  const b = strokesBounds(drawing.strokes);
  const w = Math.max(1, b.maxX);
  const h = Math.max(1, b.maxY);
  return (
    <svg
      className="compose-doodle-svg"
      viewBox={`0 0 ${w} ${h}`}
      preserveAspectRatio="none"
    >
      {drawing.strokes.map((s, i) => (
        <path key={i} d={strokeToPath(s, drawing.sizes[i])} fill={INK} />
      ))}
    </svg>
  );
}
