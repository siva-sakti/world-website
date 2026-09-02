import { useEffect } from "react";

// The board's keyboard (board-basics-plan, check-corrected): ONE window-level handler
// (the board div takes no focus — the Escape/paste precedent) with an ORDERED guard:
//   ① a real input/textarea owns ALL its keys, Escape included (they Esc-revert themselves)
//   ② the confirm dialog owns all keys (its autofocused button included)
//   ③ editing (tiptap contenteditable) → ESCAPE ONLY: exit edit, KEEP selection (the
//     two-step's first rung; tiptap binds no Escape of its own, so it reaches window)
//   ④ pen mode → nothing
//   ⑤ else: zoom keys · select-all · Escape clears selection · Delete/Backspace removes
//     the selection from THIS board (the ruled meaning — bits live on, loose) · arrows nudge.
// Re-bound on its deps (the paste handler's precedent) so it never acts on a stale board.
export function useBoardKeys(deps: {
  enabled: boolean; // false while the pen overlay owns the surface
  editingId: string | null;
  selectedCount: number;
  setEditingIdNull: () => void;
  clearSelection: () => void;
  selectAll: () => void;
  removeSelected: () => void; // unplace, single or bulk (the ruled Delete)
  nudgeSelected: (dx: number, dy: number) => void;
  zoomBy: (factor: number) => void;
  zoomTo: (target: number) => void;
  onUndo: () => void;
  onRedo: () => void;
}) {
  const {
    enabled, editingId, selectedCount, setEditingIdNull, clearSelection,
    selectAll, removeSelected, nudgeSelected, zoomBy, zoomTo, onUndo, onRedo,
  } = deps;

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      const t = e.target as HTMLElement | null;
      if (t && (t.tagName === "INPUT" || t.tagName === "TEXTAREA")) return; // ①
      if (t && t.closest?.(".confirm-scrim")) return; // ②
      if (editingId || (t && t.isContentEditable)) {
        if (e.key === "Escape") setEditingIdNull(); // ③ — selection kept (two-step rung 1)
        return;
      }
      if (!enabled) return; // ④

      const meta = e.metaKey || e.ctrlKey;
      if (meta && (e.key === "=" || e.key === "+")) { e.preventDefault(); zoomBy(1.2); return; }
      if (meta && (e.key === "-" || e.key === "_")) { e.preventDefault(); zoomBy(1 / 1.2); return; }
      if (meta && e.key === "0") { e.preventDefault(); zoomTo(1); return; }
      if (meta && e.key.toLowerCase() === "a") { e.preventDefault(); selectAll(); return; }
      // ⌘Z/⌘⇧Z — BEFORE the selectedCount guard (undo needs no selection). The
      // guards above already protect every other Z: inputs ①, the text editor's
      // own undo while editing ③, the pen's stroke-undo via drawMode (!enabled ④).
      if (meta && e.key.toLowerCase() === "z") { e.preventDefault(); if (e.shiftKey) onRedo(); else onUndo(); return; }
      if (e.key === "Escape") { clearSelection(); return; } // two-step rung 2
      if (selectedCount === 0) return;
      if (e.key === "Delete" || e.key === "Backspace") { e.preventDefault(); removeSelected(); return; }
      if (e.key === "ArrowLeft") { e.preventDefault(); nudgeSelected(e.shiftKey ? -10 : -1, 0); return; }
      if (e.key === "ArrowRight") { e.preventDefault(); nudgeSelected(e.shiftKey ? 10 : 1, 0); return; }
      if (e.key === "ArrowUp") { e.preventDefault(); nudgeSelected(0, e.shiftKey ? -10 : -1); return; }
      if (e.key === "ArrowDown") { e.preventDefault(); nudgeSelected(0, e.shiftKey ? 10 : 1); return; }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [enabled, editingId, selectedCount, setEditingIdNull, clearSelection, selectAll, removeSelected, nudgeSelected, zoomBy, zoomTo, onUndo, onRedo]);
}
