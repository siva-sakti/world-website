// The shared "placer" for floating UI (pickers, peeks, suggestion boxes). Given
// where a box attaches (its anchor), how big the box is, and the screen, it returns
// a screen position that is ALWAYS fully in view:
//   • flip   — prefer below the anchor; open ABOVE when there's more room there;
//   • slide  — nudge left/right so no side is cut off;
//   • cap     — limit the height to the room on the chosen side (the box scrolls
//               inside itself) instead of spilling past the edge.
// Coordinates are viewport (screen) space, so the box MUST be position:fixed and
// portaled to <body> — then the board's pan/zoom transform can never carry it away.
// This is the one place edge-awareness lives; every popup reuses it, so a new box
// can't reintroduce the "half off-screen, have to zoom out" trap.

export type AnchorRect = { left: number; top: number; right: number; bottom: number };
export type Size = { width: number; height: number };
export type Placement = { left: number; top: number; maxHeight: number };

export function computePlacement(
  anchor: AnchorRect,
  size: Size,
  opts: { gap?: number; margin?: number; viewportW?: number; viewportH?: number } = {},
): Placement {
  const gap = opts.gap ?? 4; // space between the anchor and the box
  const margin = opts.margin ?? 8; // keep-clear from the screen edges
  const vw = opts.viewportW ?? window.innerWidth;
  const vh = opts.viewportH ?? window.innerHeight;

  // Vertical — flip to whichever side has room; cap to that room.
  const roomBelow = vh - anchor.bottom - gap - margin;
  const roomAbove = anchor.top - gap - margin;
  const placeAbove = size.height > roomBelow && roomAbove > roomBelow;
  const room = Math.max(0, placeAbove ? roomAbove : roomBelow);
  const maxHeight = Math.max(48, Math.min(size.height, room));
  const top = placeAbove
    ? Math.max(margin, anchor.top - gap - maxHeight)
    : anchor.bottom + gap;

  // Horizontal — align to the anchor's left, then slide fully into view.
  let left = anchor.left;
  left = Math.min(left, vw - size.width - margin);
  left = Math.max(margin, left);

  return { left, top, maxHeight };
}
