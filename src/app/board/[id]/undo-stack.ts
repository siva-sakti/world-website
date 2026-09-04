// The board's undo/redo stack — PURE: no React, no supabase, no DOM
// (board-undo-technical-plan.md §2; the camera-storage/placement-anchor precedent).
//
// An entry is a deliberate act's memory: a label the button can read, the bit ids
// it touched (NEVER placement ids — those rename on reconcile; amendment 3), and a
// closure pair. Entries carry a STATE, not just closures (senior-review amendment 4):
//   live   — truthful, reversible
//   failed — the act's own write failed and its screen was rolled back; the entry
//            is a lie about the world. Never runs, never promotes to redo.
//   dead   — the reverse can never succeed (target trashed/destroyed/gone).
// undo()/redo() discard non-live corpses from the top, then run the first live entry.
//
// The stack is MEMORY, never stored — one board visit, then gone (the three-layer
// save ruling: durable recovery is trash/archive/travel, never a saved undo stack).

export type EntryState = "live" | "failed" | "dead";

export type UndoEntry = {
  label: string; // "move 3 cards" — what the ↶ button names
  bitIds: string[];
  state: EntryState;
  undo: () => Promise<void>;
  redo: () => Promise<void>;
  /** The originating act's own in-flight write (antagonist D6). undo() awaits it
   *  settled-safe BEFORE reversing: pressing ↶ 200ms after "remove" must not
   *  revive a row the un-place hasn't departed yet (the revive would no-op and
   *  the screen would lie). */
  settled?: Promise<unknown>;
};

export type UndoResult =
  | { ok: true; label: string }
  | { ok: false; terminal: boolean; label: string; error: unknown }
  | null; // nothing to run, or another undo/redo is in flight

export type Classify = (e: unknown) => "retryable" | "terminal";

export function createUndoStack(cap = 20) {
  const undos: UndoEntry[] = [];
  const redos: UndoEntry[] = [];
  let busy = false;
  // Bumped on EVERY mutation — including the live→dead flips inside run() — so the
  // React seam can mirror it and the buttons/readout actually re-render (D14).

  /** Record a deliberate act. Returns the entry so the act's own .catch can mark
   *  it failed. Caps at `cap` (oldest drops) and CLEARS redo — a new act forks
   *  history, the standard convention. */
  function push(e: Omit<UndoEntry, "state">): UndoEntry {
    const entry: UndoEntry = { ...e, state: "live" };
    undos.push(entry);
    if (undos.length > cap) undos.shift();
    redos.length = 0;
    return entry;
  }

  /** The act's own optimistic write failed and its screen change was rolled back —
   *  the entry no longer describes anything that happened. */
  function markFailed(entry: UndoEntry): void {
    entry.state = "failed";
  }

  function peekLive(list: UndoEntry[]): UndoEntry | null {
    for (let i = list.length - 1; i >= 0; i--) {
      if (list[i].state === "live") return list[i];
    }
    return null;
  }

  async function run(
    from: UndoEntry[],
    to: UndoEntry[],
    dir: "undo" | "redo",
    classify: Classify,
  ): Promise<UndoResult> {
    if (busy) return null; // ignored, not queued (ruled) — serializes what chains can't
    // Discard corpses from the top: failed entries describe nothing, dead ones
    // can never reverse. Silently — the button's label already skipped them.
    while (from.length && from[from.length - 1].state !== "live") {
      from.pop();
    }
    const e = from[from.length - 1];
    if (!e) return null;
    busy = true;
    try {
      if (e.settled) await e.settled.catch(() => {}); // the act's write is done, either way
      // The act may have FAILED while we waited (its .catch marks the entry before
      // ours resumes — attachment order, deterministic; antagonist D1, reproduced):
      // a failed act un-happened, and its reverse would write against a world it
      // misread — the already-gone carve's zombie would be resurrected. The corpse
      // stays on top; the next press discards it.
      if (e.state !== "live") return null;
      await (dir === "undo" ? e.undo() : e.redo());
      from.pop();
      to.push(e);
      return { ok: true, label: e.label };
    } catch (error) {
      if (classify(error) === "terminal") {
        e.state = "dead"; // the next press discards it and runs the one beneath
        return { ok: false, terminal: true, label: e.label, error };
      }
      // Retryable: the entry STAYS — the button can try again (network came back).
      return { ok: false, terminal: false, label: e.label, error };
    } finally {
      busy = false;
    }
  }

  return {
    push,
    markFailed,
    undo: (classify: Classify) => run(undos, redos, "undo", classify),
    redo: (classify: Classify) => run(redos, undos, "redo", classify),
    /** What the buttons render; null → disabled. Skips corpses without mutating. */
    nextUndoLabel: () => peekLive(undos)?.label ?? null,
    nextRedoLabel: () => peekLive(redos)?.label ?? null,
    /** The dev readout's food (stages 2–4's only visible surface). */
    snapshot: () => ({
      undos: undos.map((e) => ({ label: e.label, state: e.state })),
      redos: redos.map((e) => ({ label: e.label, state: e.state })),
    }),
  };
}

export type UndoStack = ReturnType<typeof createUndoStack>;
