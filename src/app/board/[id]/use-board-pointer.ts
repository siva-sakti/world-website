import { useRef, useState } from "react";
import type { CardVM } from "./card-vm";

// THE BOARD'S OWN POINTER — what a press on EMPTY SPACE means.
//
// Lifted out of board-surface.tsx (S1, 2026-09-03). One job, and a genuinely tricky one:
// the same gesture has to resolve into a pan, a pinch, a marquee, a tap that clears the
// selection, or a double-tap that makes a new card — and it must strand nothing when the
// OS interrupts it mid-way. Reading it beside the other six jobs was the problem.
//
// Order is the whole design here: a pinch outranks everything (a second finger is never a
// pan), a marquee owns the gesture once select-mode starts one, and a tap is only a tap
// if the pointer never travelled 4px. Each guard returns rather than falling through.
//
// A pure move: no behaviour changed in the extraction.

export type BoardPointerDeps = {
  cards: CardVM[];
  boardRef: React.RefObject<HTMLDivElement | null>;
  cam: { x: number; y: number; scale: number };
  setCam: (fn: (c: { x: number; y: number; scale: number }) => { x: number; y: number; scale: number }) => void;
  screenToWorld: (x: number, y: number) => { x: number; y: number };
  scheduleSave: () => void;
  /** The pinch trio — each returns true when it OWNED the event. */
  pinchDown: (e: React.PointerEvent) => boolean;
  pinchMove: (e: React.PointerEvent) => boolean;
  pinchUp: (e: React.PointerEvent) => boolean;
  marquee: {
    start: (e: React.PointerEvent) => void;
    move: (e: React.PointerEvent, cards: CardVM[]) => boolean;
    end: () => boolean;
    cancel: () => void;
  };
  selectMode: boolean;
  setEditingId: (v: string | null) => void;
  clearSelection: () => void;
  /** Double-tap on empty space makes a text card there. */
  createTextCard: (x: number, y: number) => void;
  /** Ends any card drag in flight — an interrupted gesture must leave no guide on screen. */
  cancelDrag: () => void;
};

export function useBoardPointer({
  cards,
  boardRef,
  cam,
  setCam,
  screenToWorld,
  scheduleSave,
  pinchDown,
  pinchMove,
  pinchUp,
  marquee,
  selectMode,
  setEditingId,
  clearSelection,
  createTextCard,
  cancelDrag,
}: BoardPointerDeps) {
  /** Drives the grabbing cursor. The only state here — everything else is refs, because
   *  a pan must not re-render the board on every frame. */
  const [isPanning, setIsPanning] = useState(false);
  const pan = useRef<{ sx: number; sy: number; cx: number; cy: number; moved: boolean } | null>(null);
  const lastTap = useRef<{ t: number; x: number; y: number } | null>(null);

  // ---- pan + pinch + tap on empty space ----
  function onBoardPointerDown(e: React.PointerEvent) {
    if (e.target !== boardRef.current) return; // empty space only (cards handle their own)
    setEditingId(null);
    if (pinchDown(e)) {
      // A second finger = a pinch: never a pan, marquee, or tap. Abandon any
      // in-progress marquee (its anchor must not be stomped — plan finding 7).
      marquee.cancel();
      pan.current = null;
      lastTap.current = null;
      setIsPanning(false);
      return;
    }
    if (selectMode) {
      marquee.start(e); // select-mode: empty-space drag draws a marquee (not a pan)
      return;
    }
    pan.current = { sx: e.clientX, sy: e.clientY, cx: cam.x, cy: cam.y, moved: false };
    clearSelection();
  }

  function onBoardPointerMove(e: React.PointerEvent) {
    if (pinchMove(e)) return; // an active pinch owns the move
    if (marquee.move(e, cards)) return; // a marquee is active — it handled the move
    const p = pan.current;
    if (!p) return;
    const dx = e.clientX - p.sx;
    const dy = e.clientY - p.sy;
    if (!p.moved && Math.hypot(dx, dy) < 4) return;
    if (!p.moved) { p.moved = true; setIsPanning(true); }
    setCam((c) => ({ ...c, x: p.cx + dx, y: p.cy + dy }));
    scheduleSave(); // user pan → remember the new view (debounced)
  }

  // An interrupted gesture (OS gesture, alert, tab switch) must strand no state.
  function onBoardPointerCancel(e: React.PointerEvent) {
    cancelDrag(); // touchcancel fires no drag-stop; no line may strand, no snap state survive
    pinchUp(e);
    marquee.cancel();
    pan.current = null;
    setIsPanning(false);
  }

  function onBoardPointerUp(e: React.PointerEvent) {
    if (pinchUp(e)) return; // a finger lifting out of a pinch is never a tap
    if (marquee.end()) return; // a marquee was active — it handled the up
    const p = pan.current;
    pan.current = null;
    setIsPanning(false);
    if (!p || p.moved) return; // a pan, not a tap
    const w = screenToWorld(e.clientX, e.clientY);
    const now = performance.now();
    const prev = lastTap.current;
    if (prev && now - prev.t < 340 && Math.hypot(w.x - prev.x, w.y - prev.y) < 28 / cam.scale) {
      lastTap.current = null;
      createTextCard(w.x, w.y);
    } else {
      lastTap.current = { t: now, x: w.x, y: w.y };
    }
  }

  return { isPanning, onBoardPointerDown, onBoardPointerMove, onBoardPointerCancel, onBoardPointerUp };
}
