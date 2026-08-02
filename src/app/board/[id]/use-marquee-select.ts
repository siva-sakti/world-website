import { useRef, useState, type RefObject } from "react";
import type { CardVM } from "./card";

type MarqueeBox = { left: number; top: number; w: number; h: number };

// Rubber-band multi-select (select-mode only): drag empty space to draw a box and
// select every card whose world-space bounds intersect it. Extracted from
// board-surface unchanged; the board's pointer handlers dispatch here when a marquee
// is active (start/move/end each report whether they handled the event, so the
// caller falls through to pan otherwise).
export function useMarqueeSelect(
  boardRef: RefObject<HTMLDivElement | null>,
  screenToWorld: (clientX: number, clientY: number) => { x: number; y: number },
  setSelectedIds: (ids: Set<string>) => void,
  clearSelection: () => void,
) {
  const marquee = useRef<{ sx: number; sy: number; moved: boolean } | null>(null);
  const [marqueeBox, setMarqueeBox] = useState<MarqueeBox | null>(null);

  function start(e: React.PointerEvent) {
    marquee.current = { sx: e.clientX, sy: e.clientY, moved: false };
    setMarqueeBox(null);
  }

  // Returns true when a marquee is active (so the caller skips pan handling).
  function move(e: React.PointerEvent, cards: CardVM[]): boolean {
    const mq = marquee.current;
    if (!mq) return false;
    const dx = e.clientX - mq.sx;
    const dy = e.clientY - mq.sy;
    if (!mq.moved && Math.hypot(dx, dy) < 4) return true; // a tap, not yet a drag
    mq.moved = true;
    const r = boardRef.current!.getBoundingClientRect();
    setMarqueeBox({
      left: Math.min(mq.sx, e.clientX) - r.left,
      top: Math.min(mq.sy, e.clientY) - r.top,
      w: Math.abs(e.clientX - mq.sx),
      h: Math.abs(e.clientY - mq.sy),
    });
    // hit-test in world space: any card whose bounds intersect the box is selected
    const a = screenToWorld(mq.sx, mq.sy);
    const b = screenToWorld(e.clientX, e.clientY);
    const x0 = Math.min(a.x, b.x), y0 = Math.min(a.y, b.y);
    const x1 = Math.max(a.x, b.x), y1 = Math.max(a.y, b.y);
    const inside = new Set<string>();
    for (const c of cards) {
      if (c.x < x1 && c.x + c.w > x0 && c.y < y1 && c.y + c.h > y0) inside.add(c.placementId);
    }
    setSelectedIds(inside);
    return true;
  }

  // Returns true when a marquee was active (a tap in select-mode clears; a drag
  // leaves the marquee selection standing).
  function end(): boolean {
    const mq = marquee.current;
    if (!mq) return false;
    marquee.current = null;
    setMarqueeBox(null);
    if (!mq.moved) clearSelection();
    return true;
  }

  return { marqueeBox, start, move, end };
}
