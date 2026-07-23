"use client";

import { useEffect, useRef, useState } from "react";
import { strokeToPath, PEN_WIDTHS, DEFAULT_PEN } from "@/lib/stroke";
import type { Stroke, Drawing } from "@/lib/types";

const INK = "#1c1813";

// Pen-mode draw surface. Live drawing paints onto a <canvas> (a bitmap),
// throttled to one repaint per animation frame — the earlier per-sample SVG
// rebuild crashed the tablet mid-stroke. Strokes are kept as vector data with a
// pen width recorded per stroke (so one drawing can mix fine + bold), handed to
// onDone. Palm rejection: pen/mouse only, one pointer at a time.
export function DrawOverlay({
  onDone,
  onCancel,
}: {
  onDone: (drawing: Drawing) => void;
  onCancel: () => void;
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const dprRef = useRef(1);
  const strokes = useRef<Stroke[]>([]);
  const sizes = useRef<number[]>([]);
  const current = useRef<Stroke | null>(null);
  const activeId = useRef<number | null>(null);
  const rafRef = useRef<number | null>(null);
  const [pen, setPen] = useState(DEFAULT_PEN);
  const penRef = useRef(DEFAULT_PEN);
  penRef.current = pen; // the size a stroke gets is the one live when it started

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

  const activeSize = useRef(DEFAULT_PEN); // size of the in-progress stroke

  function redraw() {
    rafRef.current = null;
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");
    if (!canvas || !ctx) return;
    const dpr = dprRef.current;
    ctx.clearRect(0, 0, canvas.width / dpr, canvas.height / dpr);
    ctx.fillStyle = INK;
    strokes.current.forEach((s, i) => paint(ctx, s, sizes.current[i]));
    if (current.current) paint(ctx, current.current, activeSize.current);
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
    activeSize.current = penRef.current;
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
      sizes.current = [...sizes.current, activeSize.current];
      current.current = null;
    }
    schedule();
  }

  function done() {
    const s = current.current ? [...strokes.current, current.current] : strokes.current;
    const z = current.current ? [...sizes.current, activeSize.current] : sizes.current;
    onDone({ strokes: s, sizes: z });
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
        <div className="compose-pen-widths">
          {PEN_WIDTHS.map((w) => (
            <button
              key={w.size}
              className={`compose-pen-dot${pen === w.size ? " is-on" : ""}`}
              style={{ ["--dot" as string]: `${Math.max(6, w.size + 3)}px` }}
              title={w.label}
              onClick={() => setPen(w.size)}
              aria-label={`${w.label} pen`}
            />
          ))}
        </div>
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

// Paint one stroke as a single filled outline at its pen width (same
// perfect-freehand path the saved SVG bit uses — live ink matches the result).
function paint(ctx: CanvasRenderingContext2D, stroke: Stroke, size: number) {
  const d = strokeToPath(stroke, size);
  if (d) ctx.fill(new Path2D(d));
}
