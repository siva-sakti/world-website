// THE TRASH CONFIRM'S WORDS — pure, so they can be pinned by tests.
//
// Before this, the SAME act asked FIVE different questions: "Trash this note?" (/write),
// "Move this note to the trash?…" (/bit/[id]), "Move this card to the trash?…" (a board),
// "Trash N cards?…" (a board, bulk), "Trash this bit? You can restore it…" (/bits) —
// three nouns and three different reassurances for one thing. Owner ruling, 2026-09-02:
// *"I'd love one door for anything like this, like for trashing."*
//
// The board's pair became the canonical shape because it was the most informative: it is
// the only one that warned you when the thing sits on several boards. The `noun` comes
// from the CALLER, because storage cannot tell a note from a photo from a card.

/** What trashing asks.
 *  `onBoards` — single case: how many boards this thing sits on (>1 earns the warning).
 *  `shared`   — bulk case: how many of the chosen things also live on other boards. */
export function trashConfirmMessage(args: {
  count?: number;
  noun?: string;
  onBoards?: number;
  shared?: number;
}): string {
  const count = args.count ?? 1;
  const noun = args.noun ?? "bit";
  if (count > 1) {
    const things = `${count} ${noun}s`;
    return (args.shared ?? 0) > 0
      ? `Trash ${things}? ${args.shared} of them also live on other boards — this removes them from all of them (restorable from Trash).`
      : `Trash ${things}? Hidden everywhere, restorable from Trash.`;
  }
  return (args.onBoards ?? 0) > 1
    ? `This ${noun} is on ${args.onBoards} boards — trashing removes it from all of them (restorable from Trash). Continue?`
    : `Move this ${noun} to the trash? Hidden everywhere, restorable from Trash.`;
}
