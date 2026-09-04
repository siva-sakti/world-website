import type { Camera } from "./use-camera";

// Per-device memory of a board's view (Batch 1 — camera-memory-plan.md). We store an
// ANCHOR — the world-point at the viewport centre plus the zoom — not the raw camera
// x/y, so a restore re-centres correctly after a window resize or phone rotation, and so
// the stored shape is the right foundation if cross-device is ever added. Pure helpers +
// guarded localStorage read/write: private mode throws on access and quota can fail, so a
// missing/corrupt/unavailable value simply means "no memory" and the board falls back to
// fit-all — never an error. No database; this lives on the device only.

export type Anchor = { cx: number; cy: number; scale: number };
export type Size = { width: number; height: number };

const MIN_ZOOM = 0.2;
const MAX_ZOOM = 3;
const KEY_PREFIX = "board-camera:v1:"; // v1 guards against misreading a future format

const clampScale = (s: number) => Math.min(MAX_ZOOM, Math.max(MIN_ZOOM, s));
const keyFor = (boardId: string) => `${KEY_PREFIX}${boardId}`;

// The world-point currently at the centre of the viewport. cam.x/y are board-rect-local
// (the same space the wheel/pinch math uses), so only the rect's size is needed — its
// left/top cancel out of the centre calculation.
export function cameraToAnchor(cam: Camera, size: Size): Anchor {
  return {
    cx: (size.width / 2 - cam.x) / cam.scale,
    cy: (size.height / 2 - cam.y) / cam.scale,
    scale: cam.scale,
  };
}

// Put that world-point back at the viewport centre at the saved (clamped) zoom — the same
// math centerOn uses, so a restored view sits exactly where it was for this screen size.
export function anchorToCamera(anchor: Anchor, size: Size): Camera {
  const scale = clampScale(anchor.scale);
  return {
    scale,
    x: size.width / 2 - anchor.cx * scale,
    y: size.height / 2 - anchor.cy * scale,
  };
}

// Parse + validate a stored string into an Anchor, or null. Kept pure (no storage) so it's
// unit-testable and reusable: rejects non-JSON, missing or non-finite fields; clamps scale.
export function parseAnchor(raw: string | null): Anchor | null {
  if (!raw) return null;
  try {
    const v: unknown = JSON.parse(raw);
    if (typeof v !== "object" || v === null) return null;
    const { cx, cy, scale } = v as Record<string, unknown>;
    if (typeof cx !== "number" || !Number.isFinite(cx)) return null;
    if (typeof cy !== "number" || !Number.isFinite(cy)) return null;
    if (typeof scale !== "number" || !Number.isFinite(scale)) return null;
    return { cx, cy, scale: clampScale(scale) };
  } catch {
    return null;
  }
}

// Read the saved anchor for a board (null when absent/corrupt/unavailable). getItem can
// throw in some privacy modes, so the whole access is guarded.
export function loadAnchor(boardId: string): Anchor | null {
  try {
    return parseAnchor(localStorage.getItem(keyFor(boardId)));
  } catch {
    return null;
  }
}

// Persist the anchor, best-effort. Quota/blocked storage fails silently: remembering a view
// is a convenience, not a promise, so a failed write must never surface as an error.
export function saveAnchor(boardId: string, anchor: Anchor): void {
  try {
    localStorage.setItem(keyFor(boardId), JSON.stringify(anchor));
  } catch {
    /* storage full or blocked — skip */
  }
}

/** SCREEN → PLANE. The one formula every tap, drop and create goes through: where your
 *  finger is on the screen becomes where on the board's plane. `origin` is the board
 *  element's top-left on screen (its bounding rect). Pure, so it can be tested — it lived
 *  inside the camera hook for a year with no direct test, and a wrong sign here would
 *  move every card on every board. Lifted 2026-09-04 (foundations pass, §6.1). */
export function screenToPlane(
  screen: { x: number; y: number },
  origin: { left: number; top: number },
  cam: Camera,
): { x: number; y: number } {
  return { x: (screen.x - origin.left - cam.x) / cam.scale, y: (screen.y - origin.top - cam.y) / cam.scale };
}

/** PLANE → SCREEN — the exact inverse, so the two can be checked against each other. */
export function planeToScreen(
  plane: { x: number; y: number },
  origin: { left: number; top: number },
  cam: Camera,
): { x: number; y: number } {
  return { x: plane.x * cam.scale + cam.x + origin.left, y: plane.y * cam.scale + cam.y + origin.top };
}

