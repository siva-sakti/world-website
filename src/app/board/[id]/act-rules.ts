// THE BOARD'S ACT RULES — the decisions its acts make, with the machinery removed.
//
// No React, no Supabase, no DOM: everything here is a plain function of its inputs,
// which is the whole point. The act layers (remove-acts, use-arrange-acts) are the
// densest bug-fix code on the board and had ZERO test coverage, because every rule was
// tangled up with a promise chain or a setState. These are the parts that could be
// untangled, so the rules are now pinned by tests even though the plumbing isn't.
//
// (`act-rules.test.mjs` is the proof. Keep it that way: a rule that moves back into a
// hook goes dark again.)

/** Run every leg; succeed if ANY leg succeeded; throw the first error only when NONE
 *  did.
 *
 *  THE SURVIVOR RULE (antagonist D4). It exists because aborting a multi-card reverse
 *  at the first failure left the board HALF-undone and killed the undo entry: a card
 *  that no longer exists has nothing to reverse and must not block its neighbours.
 *
 *  This was WRITTEN TWICE — `allLegs` in remove-acts and `applyAll` in
 *  use-arrange-acts, the same loop, the same counters, the same final throw. Both
 *  comments credited the same ruling, and the second one even said it was "reused
 *  here" before copying the code. One definition now, under test. */
export async function runLegs(legs: (() => Promise<unknown>)[]): Promise<void> {
  let applied = 0;
  let firstErr: unknown = null;
  for (const leg of legs) {
    try {
      await leg();
      applied++;
    } catch (e) {
      if (firstErr === null) firstErr = e;
    }
  }
  if (applied === 0 && firstErr !== null) throw firstErr;
}

/** An undo entry's label, counted. "move card" · "move 3 cards" · "remove card from
 *  board" · "remove 3 cards from board".
 *
 *  The singular/plural switch was open-coded at four call sites across two files, and
 *  the app has ~10 more hand-rolled `n === 1 ? "" : "s"` spellings elsewhere. */
export function countLabel(verb: string, n: number, suffix?: string): string {
  const thing = n === 1 ? "card" : `${n} cards`;
  return suffix ? `${verb} ${thing} ${suffix}` : `${verb} ${thing}`;
}
