# The bit pages (Group E) — how to review them

**Status: a PLAN.** Written 2026-09-03, after the board pass closed. The region:
~2,900 lines across ~25 files — `/bits`, a bit's page, a note's page, `/write`, intake,
`/trash`, `/archive`. Two files have tests. **Neither of us has read most of it**, which
is why the code map rates it *unexamined*, not *suspect*.

## 1 · Why this pass starts from a different place than the board's

The board review began cold: four audits reading for anything wrong. This one doesn't have
to, because that pass produced **rules that didn't exist before**, and rules make an audit
answerable instead of open-ended:

- **I-G5** — every date shows in the reader's own zone
- **I-G6** — a copy inherits what the bit HAS, never what points AT it
- **I-G7** — the optimistic rule, in four parts
- the one-door pattern, and the five model-safety gates in `CLAUDE.md`

So the question is no longer *"is anything wrong here?"* but *"does this region obey the
rules we now have, and where does it decide something twice?"* That is a question with an
end to it.

## 2 · What we already know — measured, not assumed

| | |
|---|---|
| dates formatted outside `lib/dates` | **0** ✅ *(the boundary test covers this region too)* |
| database reached outside `lib/db` | **0** ✅ |
| unused parameters / locals | **0** ✅ |
| typecheck · lint · build | clean ✅ |
| **files doing optimistic updates** | **9** ⚠ — the exact pattern behind every board bug |
| **hand-rolled debounced saves** | **3**, and **none** use the board's write queue ⚠ |

That last row is the lead this pass should open on.

## 3 · THE LEAD: four save loops, four separate correctness arguments

`bit-controls.tsx` (600ms) · `text-workspace.tsx` (350ms) · `quick-write.tsx` — plus the
board's `write-queue.ts`. Same concern, four implementations, each with its own reasoning
about ordering, retries and what happens when a write fails.

**The board's copy had two real bugs** — a dropped title and a stale write overwriting a
newer one that had landed. Both were invisible to the build and to reading; only running
the timing found them.

**A first look says `text-workspace.tsx` is actually SOUNDER than the board's was** — it
carries the same per-editor write chain, and it writes `latest` rather than restoring a
captured snapshot, which is the shape that made the board's P2 possible. That is worth
saying plainly: this region is not assumed to be the weak one. **Two of the four are still
unread.**

**How to review them:** not by reading each and judging. Write **one** set of timing tests
— stall a write, queue a newer one, fail the first — and run **all four** through it. That
is the only way this class of bug has ever been caught here, and the harness already
exists in `write-queue.test.mjs`.

**The likely outcome, named in advance so it isn't a surprise:** if three of the four are
sound and one is not, fix the one. If they differ in ways that all turn out to be right for
their surface, leave them and write down why. **Do not merge them into one queue on
tidiness grounds** — a shared abstraction across four surfaces with different needs is how
the wrong abstraction gets built, and the board's queue is shaped by the board's problems
(optimistic ids, call-in renames, group drags) that a text editor does not have.

## 4 · The order

1. **The four save loops** (§3) — one harness, four subjects. Highest known risk.
2. **The 9 optimistic surfaces against I-G7.** For each painted change, ask part 1's
   question by hand: *what write makes this true?* That part has no test and is where the
   duplicate-a-bit bugs came from.
3. **Trace the flows, not the files.** Catch a bit → file it → find it → put it away →
   bring it back → destroy it. Every bug this week lived at a seam between two surfaces
   that disagreed, and reading file-by-file is exactly what misses those.
4. **Find what is decided twice.** The board had three answers to "which boards is this
   bit on" and four hand-kept lists of placement fields. Look for the same shape here —
   especially around intake, where a bit gets its type, its size and its source.
5. **Empty and error states.** `loose-file-intake.tsx` has 7 `catch` blocks and 0 empty
   states; `intake.tsx` has 4 and 2. Not damning on its own — some of those files may have
   nothing to be empty — but it is the cheapest thing to check and the house rule is
   explicit: *every list can be empty, every upload can fail.*
6. **Then, and only then, the big files.** `notes-browser.tsx` (416) · `actions.ts` (361) ·
   `intake.tsx` (297). Judge them by the owner's ruling — **does each do ONE job well** —
   not by line count.

## 5 · How to run it

**Delegate the reading, keep the judging.** The board pass used four audit agents and I
verified their findings myself; two of the three things the last agent found were real and
one changed my own account of a bug. Same shape here: agents read and report, I confirm
against the code before anything is called a finding.

**Fix in the same order as the board pass: test first, then fix, then prove by reverting.**
Every fix this pass was demonstrated by removing it again and watching its own test — and
only its own test — go red. That is what "we checked" means, and it should not get weaker
because this region is less familiar.

## 6 · What would make this pass fail

Named up front, since both are easy to walk into:

- **Merging the four save loops** because four looks untidy. That is the Wrong Abstraction
  failure mode by name; §3 says what to do instead.
- **Finding nothing and calling that a result.** The honest outcome of an unexamined region
  is often *"we looked, here is the map, two things need fixing."* The code map's rating for
  Group E should move from *unknown* to a real number either way — that IS the deliverable.
