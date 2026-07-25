"use client";

import { useEffect, useRef, useState } from "react";
import { strokeToPath, PEN_WIDTHS, PEN_COLORS, DEFAULT_PEN, INK } from "@/lib/stroke";
import type { Stroke, Drawing } from "@/lib/types";

// Pen-mode draw surface. Live drawing paints onto a <canvas> (a bitmap),
// throttled to one repaint per animation frame — the earlier per-sample SVG
// rebuild crashed the tablet mid-stroke. Strokes are kept as vector data with a
// pen width AND color recorded per stroke (so one drawing can mix fine + bold,
// ink + indigo), handed to onDone. Erase mode rubs out whole strokes you drag
// over; undo drops the last one. Palm rejection: pen/mouse only, one at a time.
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
  const colors = useRef<string[]>([]);
  const current = useRef<Stroke | null>(null);
  const activeId = useRef<number | null>(null);
  const rafRef = useRef<number | null>(null);

  const [pen, setPen] = useState(DEFAULT_PEN);
  const penRef = useRef(DEFAULT_PEN);
  penRef.current = pen; // the size a stroke gets is the one live when it started
  const [penColor, setPenColor] = useState(INK);
  const colorRef = useRef(INK);
  colorRef.current = penColor;
  const [erasing, setErasing] = useState(false);
  const erasingRef = useRef(false);
  erasingRef.current = erasing;

  const activeSize = useRef(DEFAULT_PEN); // size of the in-progress stroke
  const activeColor = useRef(INK); // color of the in-progress stroke

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
    strokes.current.forEach((s, i) => paint(ctx, s, sizes.current[i], colors.current[i]));
    if (current.current) paint(ctx, current.current, activeSize.current, activeColor.current);
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

  // Rub out every stroke passing under the point (erase mode).
  function eraseAt([px, py]: number[]) {
    const keptS: Stroke[] = [], keptZ: number[] = [], keptC: string[] = [];
    let removed = false;
    strokes.current.forEach((s, i) => {
      const half = (sizes.current[i] ?? DEFAULT_PEN) / 2 + 10;
      const hit = s.some(([x, y]) => Math.hypot(x - px, y - py) <= half);
      if (hit) removed = true;
      else {
        keptS.push(s);
        keptZ.push(sizes.current[i]);
        keptC.push(colors.current[i]);
      }
    });
    if (removed) {
      strokes.current = keptS;
      sizes.current = keptZ;
      colors.current = keptC;
      schedule();
    }
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
    if (erasingRef.current) {
      eraseAt(p);
      return;
    }
    activeSize.current = penRef.current;
    activeColor.current = colorRef.current;
    current.current = [p];
    schedule();
  }
  function move(e: React.PointerEvent) {
    if (e.pointerId !== activeId.current) return;
    const p = toPoint(e);
    if (!p) return;
    if (erasingRef.current) {
      eraseAt(p);
      return;
    }
    if (current.current) {
      current.current.push(p);
      schedule();
    }
  }
  function end(e: React.PointerEvent) {
    if (e.pointerId !== activeId.current) return;
    activeId.current = null;
    if (current.current) {
      strokes.current = [...strokes.current, current.current];
      sizes.current = [...sizes.current, activeSize.current];
      colors.current = [...colors.current, activeColor.current];
      current.current = null;
      schedule();
    }
  }

  function undo() {
    if (!strokes.current.length) return;
    strokes.current = strokes.current.slice(0, -1);
    sizes.current = sizes.current.slice(0, -1);
    colors.current = colors.current.slice(0, -1);
    schedule();
  }

  function done() {
    const s = current.current ? [...strokes.current, current.current] : strokes.current;
    const z = current.current ? [...sizes.current, activeSize.current] : sizes.current;
    const c = current.current ? [...colors.current, activeColor.current] : colors.current;
    onDone({ strokes: s, sizes: z, colors: c });
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
              className={`compose-pen-dot${!erasing && pen === w.size ? " is-on" : ""}`}
              style={{ ["--dot" as string]: `${Math.max(6, w.size + 3)}px` }}
              title={w.label}
              onClick={() => {
                setPen(w.size);
                setErasing(false);
              }}
              aria-label={`${w.label} pen`}
            />
          ))}
        </div>
        <div className="compose-pen-colors">
          {PEN_COLORS.map((c) => (
            <button
              key={c.color}
              className={`compose-pen-swatch${!erasing && penColor === c.color ? " is-on" : ""}`}
              style={{ background: c.color }}
              title={c.label}
              aria-label={`${c.label} ink`}
              onClick={() => {
                setPenColor(c.color);
                setErasing(false);
              }}
            />
          ))}
        </div>
        <button
          className={`compose-btn${erasing ? " is-on" : ""}`}
          onClick={() => setErasing((v) => !v)}
          title="Erase — drag over a stroke to rub it out"
        >
          ⌫ erase
        </button>
        <button className="compose-btn" onClick={undo} title="Undo the last stroke">
          ↶ undo
        </button>
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

// Paint one stroke as a single filled outline at its pen width + color (same
// perfect-freehand path the saved SVG bit uses — live ink matches the result).
function paint(ctx: CanvasRenderingContext2D, stroke: Stroke, size: number, color: string) {
  const d = strokeToPath(stroke, size);
  if (d) {
    ctx.fillStyle = color ?? INK;
    ctx.fill(new Path2D(d));
  }
}
