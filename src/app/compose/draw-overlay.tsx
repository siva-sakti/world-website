"use client";

import { useEffect, useRef } from "react";
import { strokeToPath } from "./stroke";
import type { Stroke } from "./types";

const INK = "#1c1813";

// Pen-mode draw surface. Live drawing happens on a <canvas> — we just paint the
// ink onto a bitmap, throttled to one repaint per animation frame. The earlier
// version rebuilt the whole drawing as an SVG on EVERY pointer sample, which was
// too heavy for the tablet's browser and crashed it mid-stroke. Strokes are
// still kept as vector data and handed to onDone; the finished doodle bit is
// rendered as crisp, scalable SVG once (cheap). Palm rejection: pen/mouse only,
// one pointer at a time.
export function DrawOverlay({
  onDone,
  onCancel,
}: {
  onDone: (strokes: Stroke[]) => void;
  onCancel: () => void;
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const dprRef = useRef(1);
  const strokes = useRef<Stroke[]>([]);
  const current = useRef<Stroke | null>(null);
  const activeId = useRef<number | null>(null);
  const rafRef = useRef<number | null>(null);

  // Size the canvas bitmap to its box × device-pixel-ratio (crisp ink).
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const dpr = window.devicePixelRatio || 1;
    dprRef.current = dpr;
    canvas.width = Math.max(1, Math.round(rect.width * dpr));
    canvas.height = Math.max(1, Math.round(rect.height * dpr));
    const ctx = canvas.getContext("2d");
    if (ctx) ctx.scale(dpr, dpr);
  }, []);

  function redraw() {
    rafRef.current = null;
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");
    if (!canvas || !ctx) return;
    const dpr = dprRef.current;
    ctx.clearRect(0, 0, canvas.width / dpr, canvas.height / dpr);
    ctx.fillStyle = INK;
    for (const s of strokes.current) paint(ctx, s);
    if (current.current) paint(ctx, current.current);
  }
  function schedule() {
    if (rafRef.current == null) rafRef.current = requestAnimationFrame(redraw);
  }

  function toPoint(e: React.PointerEvent): number[] | null {
    const r = canvasRef.current!.getBoundingClientRect();
    const x = e.clientX - r.left;
    const y = e.clientY - r.top;
    if (!Number.isFinite(x) || !Number.isFinite(y)) return null;
    return [x, y, e.pressure || 0.5];
  }
  function down(e: React.PointerEvent) {
    if (e.pointerType === "touch") return; // reject palm / finger — pen or mouse only
    if (activeId.current !== null) return; // one pointer at a time
    const p = toPoint(e);
    if (!p) return;
    activeId.current = e.pointerId;
    try {
      e.currentTarget.setPointerCapture(e.pointerId);
    } catch {
      // some pointers can't be captured — fine, we still gate by id
    }
    current.current = [p];
    schedule();
  }
  function move(e: React.PointerEvent) {
    if (e.pointerId !== activeId.current || !current.current) return;
    const p = toPoint(e);
    if (!p) return;
    current.current.push(p);
    schedule();
  }
  function end(e: React.PointerEvent) {
    if (e.pointerId !== activeId.current) return;
    activeId.current = null;
    if (current.current) {
      strokes.current = [...strokes.current, current.current];
      current.current = null;
    }
    schedule();
  }

  function done() {
    const all = current.current
      ? [...strokes.current, current.current]
      : strokes.current;
    onDone(all);
  }

  return (
    <>
      <canvas
        ref={canvasRef}
        className="compose-draw-surface"
        onPointerDown={down}
        onPointerMove={move}
        onPointerUp={end}
        onPointerCancel={end}
      />
      <div className="compose-draw-actions">
        <button className="compose-btn" onClick={onCancel}>
          ✕ cancel
        </button>
        <button className="compose-btn is-primary" onClick={done}>
          ✓ done
        </button>
      </div>
    </>
  );
}

// Paint one stroke as a single filled outline (same perfect-freehand path the
// saved SVG bit uses, so live ink and the final doodle look identical).
function paint(ctx: CanvasRenderingContext2D, stroke: Stroke) {
  const d = strokeToPath(stroke);
  if (d) ctx.fill(new Path2D(d));
}
