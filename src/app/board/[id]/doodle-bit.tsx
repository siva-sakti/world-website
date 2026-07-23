"use client";

import { useMemo } from "react";
import { strokeToPath, strokesBounds, INK } from "@/lib/stroke";
import type { Drawing } from "@/lib/types";

// A finished doodle: each stroke drawn as an SVG path at its own pen width. The
// viewBox stays the ink's native size while the <svg> fills the card, so
// resizing the card scales the vector ink — crisp at any size. The stroke → SVG
// work (perfect-freehand) is memoized per drawing, so a re-render (e.g. another
// card moving) doesn't recompute every path.
export function DoodleBit({ drawing }: { drawing: Drawing }) {
  const { w, h, paths } = useMemo(() => {
    const b = strokesBounds(drawing.strokes);
    return {
      w: Math.max(1, b.maxX),
      h: Math.max(1, b.maxY),
      paths: drawing.strokes.map((s, i) => strokeToPath(s, drawing.sizes[i])),
    };
  }, [drawing]);
  return (
    <svg
      className="compose-doodle-svg"
      viewBox={`0 0 ${w} ${h}`}
      preserveAspectRatio="none"
    >
      {paths.map((d, i) => (
        <path key={i} d={d} fill={INK} />
      ))}
    </svg>
  );
}
