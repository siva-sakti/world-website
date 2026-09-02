// THE EMPTY STATES — two situations, one sentence each.
//
// Owner ruling, 2026-09-02: keep them SEPARATE, because they are different moments:
//   · nothing here YET      — an invitation. Nothing is wrong.
//   · nothing MATCHED       — a dead end, and there is something you can do about it.
// Collapsing them would have made an empty room and a failed filter read identically.
//
// These are the owner's own words, chosen from the seven spellings that existed across
// home, the drawer, /bits, /outline and /search — not newly written. What each room may
// still supply is the NEXT STEP, because it genuinely differs: /search offers "a different
// word, tag, or date" while /bits offers "clear the search or filters". The sentence is
// shared; the way out of a particular room is that room's to know.

/** `filtered` — is a search or filter narrowing this room right now?
 *  `hint` — the way out, appended after a dash. Pass null for the bare sentence. */
export function emptyMessage(args: { filtered: boolean; hint?: string | null }): string {
  if (args.filtered) {
    // The commonest way out, so rooms don't restate it; override or silence per room.
    const hint = args.hint === undefined ? "clear the search or filters" : args.hint;
    return hint ? `Nothing matches — ${hint}.` : "Nothing matches.";
  }
  const hint = args.hint ?? null;
  return hint ? `Nothing here yet — ${hint}.` : "Nothing here yet.";
}
