import { useCallback, useEffect, useRef, useState, type RefObject } from "react";
import type { CardVM } from "./card";
import { anchorToCamera, cameraToAnchor, loadAnchor, saveAnchor, type Anchor, type Size } from "./camera-storage";

const MIN_ZOOM = 0.2;
const MAX_ZOOM = 3;

export type Camera = { x: number; y: number; scale: number };

// The board's pan/zoom camera over an infinite world. Owns the camera state, a
// latest-value ref for imperative reads (wheel, pen, screen→world), the native
// wheel-zoom (a non-passive listener so it can preventDefault the page scroll),
// fitView/centerOn, and the touch PINCH — two-finger zoom+pan, the phone's only
// zoom (the wheel is mouse-only; touch-action:none turns the browser's own pinch
// off). The board's pointer handlers dispatch to pinchDown/Move/Up exactly like
// the marquee's start/move/end pattern (board-touch-zoom-plan.md).
export function useCamera(boardRef: RefObject<HTMLDivElement | null>, boardId: string) {
  const [cam, setCam] = useState<Camera>({ x: 0, y: 0, scale: 1 });
  const camRef = useRef(cam);
  // Touch pointers currently down on empty board space (touch pointers get
  // implicit capture, so their moves keep firing here), and the active pinch:
  // starting finger distance + scale, and the WORLD point under the fingers'
  // midpoint — held under the moving midpoint, which yields zoom AND two-finger
  // pan in one gesture. All midpoint math is BOARD-RECT-LOCAL (cam x/y live in
  // that space — the same rect.left/top subtraction the wheel does; raw client
  // coords would jump content by the header height — plan review finding 5).
  const touchPts = useRef(new Map<number, { x: number; y: number }>());
  const pinchRef = useRef<{ d0: number; s0: number; w0: { x: number; y: number } } | null>(null);
  useEffect(() => {
    camRef.current = cam; // latest camera for imperative reads (was assigned in render)
  }, [cam]);

  // --- Per-device view memory (camera-storage). Save only on USER gestures (wheel / pinch
  // / pan), debounced; restore on open; flush a pending save on unmount so a quick leave
  // still captures the last view. Programmatic moves (fitView / centerOn / restore) never
  // call scheduleSave, so the smart fit-all default stands until you deliberately move. We
  // store an anchor (the world-point at the viewport centre + zoom), not raw x/y — see
  // camera-storage.ts. ---
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  // Fit snap-back (session-only, in memory): the view just before the last fit, and whether
  // the current view still IS that fit — so a second fit press returns to it. Any deliberate
  // move (scheduleSave) clears the flag, making the next fit a fresh fit.
  const preFitAnchor = useRef<Anchor | null>(null);
  const justFitted = useRef(false);

  const currentSize = useCallback((): Size | null => {
    const el = boardRef.current;
    if (!el) return null;
    const r = el.getBoundingClientRect();
    return { width: r.width, height: r.height };
  }, [boardRef]);

  const saveNow = useCallback(() => {
    const size = currentSize();
    if (size) saveAnchor(boardId, cameraToAnchor(camRef.current, size));
  }, [boardId, currentSize]);

  const scheduleSave = useCallback(() => {
    justFitted.current = false; // a deliberate move → the next fit is a fresh fit, not a snap-back
    if (saveTimer.current) clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(() => {
      saveTimer.current = null;
      saveNow();
    }, 400);
  }, [saveNow]);

  // Flush a still-pending save when the board unmounts (navigate away inside the debounce).
  useEffect(
    () => () => {
      if (saveTimer.current) {
        clearTimeout(saveTimer.current);
        saveNow();
      }
    },
    [saveNow],
  );

  // Restore this board's saved view; returns true when one was applied (the caller then
  // skips its fit/center default). Falls through (false) when there's nothing valid saved.
  const restoreView = useCallback((): boolean => {
    const size = currentSize();
    if (!size) return false;
    const anchor = loadAnchor(boardId);
    if (!anchor) return false;
    setCam(anchorToCamera(anchor, size));
    return true;
  }, [boardId, currentSize]);

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
      scheduleSave(); // user zoom → remember the new view (debounced)
    }
    el.addEventListener("wheel", onWheel, { passive: false });
    return () => el.removeEventListener("wheel", onWheel);
  }, [boardRef, scheduleSave]);

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
    // Text/audio cards render at height:auto, so their stored h is stale (smaller than the
    // real card) — measure the actual rendered box via data-pid so fit never crops a grown
    // card (the same measure findClearSpot uses; offsetW/H are pre-transform world units).
    let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
    for (const c of cards) {
      const elc = document.querySelector(`[data-pid="${c.placementId}"]`);
      const w = elc instanceof HTMLElement ? elc.offsetWidth : c.w;
      const h = elc instanceof HTMLElement ? elc.offsetHeight : c.h;
      minX = Math.min(minX, c.x);
      minY = Math.min(minY, c.y);
      maxX = Math.max(maxX, c.x + w);
      maxY = Math.max(maxY, c.y + h);
    }
    const bw = Math.max(1, maxX - minX);
    const bh = Math.max(1, maxY - minY);
    const pad = 80;
    const scale = Math.max(MIN_ZOOM, Math.min(1, (r.width - pad) / bw, (r.height - pad) / bh));
    const cx = minX + bw / 2;
    const cy = minY + bh / 2;
    setCam({ x: r.width / 2 - cx * scale, y: r.height / 2 - cy * scale, scale });
  }

  // Open readable on a small screen: center one card at a chosen zoom (the plan's
  // phone open — readable 100% on the last-fronted card instead of fit-all-tiny).
  function centerOn(card: CardVM, scale: number) {
    const el = boardRef.current;
    if (!el) return;
    const r = el.getBoundingClientRect();
    const s = Math.min(MAX_ZOOM, Math.max(MIN_ZOOM, scale));
    setCam({
      scale: s,
      x: r.width / 2 - (card.x + card.w / 2) * s,
      y: r.height / 2 - (card.y + card.h / 2) * s,
    });
  }

  // Deliberate zoom (the + / − buttons and Cmd+=/−/0): the wheel's zoom-toward-point
  // math anchored at the VIEWPORT CENTER, clamped, and saved (a button zoom is a
  // deliberate move — scheduleSave also correctly clears the fit snap-back).
  function zoomAtCenter(next: (s: number) => number) {
    const el = boardRef.current;
    if (!el) return;
    const r = el.getBoundingClientRect();
    const px = r.width / 2;
    const py = r.height / 2;
    setCam((c) => {
      const scale = Math.min(MAX_ZOOM, Math.max(MIN_ZOOM, next(c.scale)));
      const k = scale / c.scale;
      return { scale, x: px - (px - c.x) * k, y: py - (py - c.y) * k };
    });
    scheduleSave();
  }
  const zoomBy = (factor: number) => zoomAtCenter((s) => s * factor);
  const zoomTo = (target: number) => zoomAtCenter(() => target);

  // The fit button. First press frames all cards, remembering where you were; press again
  // (without moving) to snap back to that pre-fit view. scheduleSave clears justFitted on any
  // deliberate move, so after you pan/zoom, fit is a fresh fit again. Session-only (in memory).
  function fitOrToggleBack(cards: CardVM[]) {
    const size = currentSize();
    if (justFitted.current && preFitAnchor.current && size) {
      setCam(anchorToCamera(preFitAnchor.current, size));
      justFitted.current = false;
      return;
    }
    if (size) preFitAnchor.current = cameraToAnchor(camRef.current, size);
    fitView(cards);
    justFitted.current = true;
  }

  /** A touch finger landed on empty board space. Returns true when it makes a
   *  pinch (the second finger) — the caller then cancels pan/tap/marquee state. */
  function pinchDown(e: React.PointerEvent): boolean {
    if (e.pointerType !== "touch") return false;
    touchPts.current.set(e.pointerId, { x: e.clientX, y: e.clientY });
    if (touchPts.current.size !== 2) return false;
    const el = boardRef.current;
    if (!el) return false;
    const [a, b] = [...touchPts.current.values()];
    const r = el.getBoundingClientRect();
    const midX = (a.x + b.x) / 2 - r.left; // rect-local, like the wheel
    const midY = (a.y + b.y) / 2 - r.top;
    const c = camRef.current;
    pinchRef.current = {
      d0: Math.max(1, Math.hypot(a.x - b.x, a.y - b.y)),
      s0: c.scale,
      w0: { x: (midX - c.x) / c.scale, y: (midY - c.y) / c.scale },
    };
    return true;
  }

  /** Returns true while a pinch owns the move (the caller skips marquee/pan). */
  function pinchMove(e: React.PointerEvent): boolean {
    if (e.pointerType === "touch" && touchPts.current.has(e.pointerId)) {
      touchPts.current.set(e.pointerId, { x: e.clientX, y: e.clientY });
    }
    const pz = pinchRef.current;
    if (!pz || touchPts.current.size < 2) return false;
    const el = boardRef.current;
    if (!el) return true;
    const [a, b] = [...touchPts.current.values()];
    const r = el.getBoundingClientRect();
    const midX = (a.x + b.x) / 2 - r.left;
    const midY = (a.y + b.y) / 2 - r.top;
    const d = Math.hypot(a.x - b.x, a.y - b.y);
    const s = Math.min(MAX_ZOOM, Math.max(MIN_ZOOM, pz.s0 * (d / pz.d0)));
    // Keep the recorded world point under the fingers' current midpoint.
    setCam({ scale: s, x: midX - pz.w0.x * s, y: midY - pz.w0.y * s });
    scheduleSave(); // user pinch → remember the new view (debounced)
    return true;
  }

  /** A touch finger lifted (or the gesture was cancelled). Returns true when it
   *  belonged to a pinch — never a tap. Below two fingers the pinch ends; the
   *  remaining finger does NOT resume a pan (no end-of-pinch jump). */
  function pinchUp(e: React.PointerEvent): boolean {
    if (e.pointerType !== "touch") return false;
    const wasPinching = pinchRef.current !== null;
    touchPts.current.delete(e.pointerId);
    if (touchPts.current.size < 2) pinchRef.current = null;
    return wasPinching;
  }

  return { cam, camRef, setCam, screenToWorld, fitView, centerOn, fitOrToggleBack, zoomBy, zoomTo, pinchDown, pinchMove, pinchUp, scheduleSave, restoreView };
}
