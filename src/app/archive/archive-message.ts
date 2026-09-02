// THE ARCHIVE CONFIRM'S WORDS — pure, so they can be pinned by tests.
//
// Split from the door (archive-confirm.ts) for one reason: that file imports the confirm
// dialog, which is a React component, so a test runner can't load it. The sentence can be
// checked; the dialog can't. Same shape as act-rules.ts on the board side.
//
// These are the owner's existing sentences, MOVED not rewritten. The plural is the only
// new one — there was no bulk archive before 2026-09-02.

/** What archiving asks. `onBoards` applies to the single case only: archiving something
 *  that sits on boards hides it from them, which is worth saying before it happens. */
export function archiveConfirmMessage(args: {
  count?: number;
  noun?: string;
  onBoards?: number;
}): string {
  const count = args.count ?? 1;
  const noun = args.noun ?? "note";
  if (count > 1) {
    return `Archive ${count} ${noun}s? They're set aside in your archive — un-archive anytime.`;
  }
  const n = args.onBoards ?? 0;
  return n > 0
    ? `This is on ${n} board${n === 1 ? "" : "s"} — archiving hides it from ${n === 1 ? "it" : "them"} until you un-archive.`
    : `Archive this ${noun}? It's set aside in your archive — un-archive anytime.`;
}
