import { useEffect, useRef, useState, type RefObject } from "react";
import type { CardVM } from "./card";

const MIN_ZOOM = 0.2;
const MAX_ZOOM = 3;

export type Camera = { x: number; y: number; scale: number };

// The board's pan/zoom camera over an infinite world. Owns the camera state, a
// latest-value ref for imperative reads (wheel, pen, screen→world), the native
// wheel-zoom (a non-passive listener so it can preventDefault the page scroll), and
// fitView. Extracted from board-surface unchanged — same math, same behavior.
export function useCamera(boardRef: RefObject<HTMLDivElement | null>) {
  const [cam, setCam] = useState<Camera>({ x: 0, y: 0, scale: 1 });
  const camRef = useRef(cam);
  useEffect(() => {
    camRef.current = cam; // latest camera for imperative reads (was assigned in render)
  }, [cam]);

  function screenToWorld(clientX: number, clientY: number) {
    const r = boardRef.current!.getBoundingClientRect();
    const c = camRef.current;
    return { x: (clientX - r.left - c.x) / c.scale, y: (clientY - r.top - c.y) / c.scale };
  }

  // Zoom toward the cursor (native listener so we can preventDefault the scroll).
  useEffect(() => {
    const el = boardRef.current;
    if (!el) return;
    function onWheel(e: WheelEvent) {
      e.preventDefault();
      const r = el!.getBoundingClientRect();
      const px = e.clientX - r.left;
      const py = e.clientY - r.top;
      setCam((c) => {
        const scale = Math.min(MAX_ZOOM, Math.max(MIN_ZOOM, c.scale * Math.exp(-e.deltaY * 0.0015)));
        const k = scale / c.scale;
        return { scale, x: px - (px - c.x) * k, y: py - (py - c.y) * k };
      });
    }
    el.addEventListener("wheel", onWheel, { passive: false });
    return () => el.removeEventListener("wheel", onWheel);
  }, [boardRef]);

  // Frame every card in view — the "where am I?" rescue on an endless canvas.
  // No cards → home to the origin. Never magnifies past 100%.
  function fitView(cards: CardVM[]) {
    const el = boardRef.current;
    if (!el) return;
    const r = el.getBoundingClientRect();
    if (!cards.length) {
      setCam({ x: 0, y: 0, scale: 1 });
      return;
    }
    let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
    for (const c of cards) {
      minX = Math.min(minX, c.x);
      minY = Math.min(minY, c.y);
      maxX = Math.max(maxX, c.x + c.w);
      maxY = Math.max(maxY, c.y + c.h);
    }
    const bw = Math.max(1, maxX - minX);
    const bh = Math.max(1, maxY - minY);
    const pad = 80;
    const scale = Math.max(MIN_ZOOM, Math.min(1, (r.width - pad) / bw, (r.height - pad) / bh));
    const cx = minX + bw / 2;
    const cy = minY + bh / 2;
    setCam({ x: r.width / 2 - cx * scale, y: r.height / 2 - cy * scale, scale });
  }

  return { cam, camRef, setCam, screenToWorld, fitView };
}
