"use client";

import type { useUndo } from "./use-undo";

// The DARK stage's only visible surface (undo plan §7, dev builds only): the
// stack's labels + states in a corner, so ~15 real gestures can be checked for
// TRUTHFUL entries before any button can act on them. Never ships to production —
// the caller gates on NODE_ENV.
export function UndoDevReadout({ snapshot }: { snapshot: ReturnType<typeof useUndo>["devSnapshot"] }) {
  return (
    <div
      style={{
        position: "fixed", right: 8, bottom: 8, zIndex: 90, maxWidth: 260,
        background: "rgba(20,18,14,0.85)", color: "#eee", borderRadius: 8,
        font: "11px/1.5 monospace", padding: "6px 9px", pointerEvents: "none",
      }}
    >
      <div style={{ opacity: 0.6 }}>undo stack (dev)</div>
      {snapshot.undos.length === 0 && <div style={{ opacity: 0.4 }}>— empty —</div>}
      {snapshot.undos.map((e, i) => (
        <div key={i} style={{ opacity: e.state === "live" ? 1 : 0.45 }}>
          ↶ {e.label}
          {e.state !== "live" && ` [${e.state}]`}
        </div>
      ))}
      {snapshot.redos.map((e, i) => (
        <div key={`r${i}`} style={{ opacity: 0.7 }}>
          ↷ {e.label}
          {e.state !== "live" && ` [${e.state}]`}
        </div>
      ))}
    </div>
  );
}
