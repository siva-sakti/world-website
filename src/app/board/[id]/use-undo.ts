"use client";

import { useCallback, useRef, useState } from "react";
import { createUndoStack, type UndoEntry } from "./undo-stack";

// The React seam over the pure undo stack (board-undo-technical-plan.md §2).
// Owns: the stack's lifetime (one ref = one board visit — BoardSurface never
// remounts without a route change), the render mirror (the stack's version
// counter into state, so buttons/readout re-render on every mutation including
// the flips inside undo()), the terminal-vs-retryable classification, and the
// owner-facing copy for a failed reverse. The acts call record(); stage 5's
// buttons call undo()/redo().

// Terminal = the reverse can NEVER succeed — the target moved on. The known
// shapes: callInBit's liveness guards, the house 0-row asserts, restoreBit's
// not-in-trash assert. Everything else (network, RLS hiccup) is retryable.
const TERMINAL = [
  "TRASHED_BIT",
  "TRASHED_BOARD",
  "no longer exists",
  "no longer in the trash",
  // J7: a reverse pointing at a DELETED row (e.g. a prior source destroyed in the
  // manager) FK-refuses forever — "try again" would be a lie on loop.
  "23503",
  "foreign key",
];

function classify(e: unknown): "retryable" | "terminal" {
  const m = e instanceof Error ? e.message : String(e);
  return TERMINAL.some((t) => m.includes(t)) ? "terminal" : "retryable";
}

/** Honest copy, no raw codes (plan §5: TRASHED_BIT must never reach the owner). */
function friendly(r: { terminal: boolean; label: string }, dir: "undo" | "redo"): string {
  return r.terminal
    ? `Couldn't ${dir} “${r.label}” — that thing has moved on (trashed, restored elsewhere, or gone). Skipping it.`
    : `Couldn't ${dir} “${r.label}” — check your connection and try again.`;
}

type UndoView = {
  undoLabel: string | null;
  redoLabel: string | null;
  devSnapshot: ReturnType<UndoStackT["snapshot"]>;
};
type UndoStackT = ReturnType<typeof createUndoStack>;

export function useUndo(onErr: (msg: string) => void) {
  // THE CLASS FIX for the antagonist's D1 (reproduced: a 399px teleport): any act
  // layer holding an OPEN coalescing window (the nudge burst) must close it before
  // ANY entry is pushed — from any act, any stage — or a later extension mutates a
  // BURIED entry and undo-all lands in the wrong place. Registered callbacks run
  // at the top of every record(); stages 3-4 inherit the guarantee for free.
  const beforeRecord = useRef<Set<() => void>>(new Set());
  const onBeforeRecord = useCallback((cb: () => void) => {
    beforeRecord.current.add(cb);
    return () => {
      beforeRecord.current.delete(cb);
    };
  }, []);
  const stack = useRef<UndoStackT | null>(null);
  if (stack.current === null) stack.current = createUndoStack();
  const s = () => stack.current!;
  // The render-facing MIRROR (never read the ref during render — the house
  // anchorRef lesson): sync() recomputes it after every stack mutation.
  const [view, setView] = useState<UndoView>({
    undoLabel: null,
    redoLabel: null,
    devSnapshot: { undos: [], redos: [] },
  });
  const sync = useCallback(() => {
    setView({
      undoLabel: s().nextUndoLabel(),
      redoLabel: s().nextRedoLabel(),
      devSnapshot: s().snapshot(),
    });
  }, []);

  /** Record a deliberate act. Returns the entry so the act's own .catch can
   *  markFailed it (a rolled-back act must never replay). */
  const record = useCallback(
    (
      label: string,
      bitIds: string[],
      undoFn: () => Promise<void>,
      redoFn: () => Promise<void>,
      settled?: Promise<unknown>,
    ): UndoEntry => {
      for (const cb of beforeRecord.current) cb(); // close open coalescing windows FIRST (D1)
      const e = s().push({ label, bitIds, undo: undoFn, redo: redoFn, settled });
      sync();
      return e;
    },
    [sync],
  );

  const fail = useCallback(
    (e: UndoEntry) => {
      s().markFailed(e);
      sync();
    },
    [sync],
  );

  const undo = useCallback(async () => {
    const r = await s().undo(classify);
    sync();
    if (r && !r.ok) onErr(friendly(r, "undo"));
    return r;
  }, [sync, onErr]);

  const redo = useCallback(async () => {
    const r = await s().redo(classify);
    sync();
    if (r && !r.ok) onErr(friendly(r, "redo"));
    return r;
  }, [sync, onErr]);

  return {
    record,
    onBeforeRecord,
    fail,
    undo,
    redo,
    undoLabel: view.undoLabel, // null → the button disables
    redoLabel: view.redoLabel,
    /** The dev readout's data (stages 2–4's only visible surface). */
    devSnapshot: view.devSnapshot,
  };
}
