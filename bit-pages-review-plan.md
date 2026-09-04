# The bit pages (Group E) — how to review them

**Status: a PLAN, v2 — rewritten 2026-09-03 after an antagonist review returned
"VERDICT: No."** The first draft opened on the wrong lead, contained two wrong
measurements, left ~1,270 lines in no group at all, and had no way to tell when it was
finished. What follows is the corrected version; §0 records what was wrong, because the
mistakes are more instructive than the fix.

**The region — settled, and bigger than v1 said:** ~4,200 lines. `/bits` · a bit's page ·
**a note's page (`src/app/note/[id]`, 184 lines)** · `/write` · intake · `/trash` ·
`/archive` · **and `src/components/` (1,087 lines, 11 files)**. The last two were in no
group in `bits-and-boards-code-map.md` and in no review. `src/components/drawer.tsx` alone
is **367 lines — the largest untracked file in the app.**

---

## 0 · What the antagonist found, and what it cost

Four of its findings were verified against the code before this rewrite. They are recorded
because each is a *class* of mistake, not a one-off.

| | The mistake | Why it matters |
|---|---|---|
| **Anchoring** | v1 led on "four hand-rolled save loops" — the bug class I had just spent a week on. | Two worse defects were sitting in the region in plain sight (§1). The lead was familiarity, not evidence. |
| **A number that looked like a signal** | v1's "9 files do optimistic updates" came from a grep including `useState` — which every client component has. It measured *"is a React component"*. | The step built on it would have audited nothing. **A measurement whose criterion you can't state is not a measurement**, and I presented it under a heading reading "measured, not assumed". |
| **A count that was simply wrong** | There are **five** hand-rolled save loops, not four. | The fifth is `board-description.tsx` — **in the board region this pass already declared closed.** |
| **No exit criterion** | v1 said the deliverable was moving Group E's rating "to a real number either way". | A number I set myself, satisfiable by any amount of looking. §5 replaces it. |

**And a rule-conformance audit cannot find a defect for which no rule exists.** v1's premise
— *"the question is no longer 'is anything wrong here'"* — was the anchoring restated as a
virtue. Both defects below are rule **gaps**. The board's rules came from a canvas of
optimistic drags; this region is server actions, forms and navigation.

---

## 1 · THE LEAD: the act table

Not the save loops. Two verified defects, found by reading the region rather than by
importing the board's taxonomy:

**(a) The most destructive act has a door that never asks.** `note-card.tsx:141` and
`note-row.tsx:88` trash a bit through a bare `<form action={trashFromInbox}>`: **one click,
no confirm, no busy state, no failure message, no undo.** The two files have **zero** catch
blocks between them, and `trashFromInbox` (`actions.ts:123`) has no try/catch and returns
nothing, so a failure surfaces as an unhandled server-action error. Meanwhile
`bit-controls.tsx:130` carries a comment calling itself *"THE one trash confirm … shared
with the board, /bits and /write, so the same act asks the same question wherever you meet
it."* **That comment is false on `/bits` — the page it names.**

**(b) The region's save door cannot tell you it wrote nothing.** `updateBitBody`
(`bits.ts:332`) does `.update().eq()` with no `.select()` and no rows-affected check, so a
0-row write — trashed row, RLS refusal, stale id — **resolves as success**. Its sibling
`unplaceBit` asserts, with a comment about exactly this ("the lost-removal class"). Two
client files already hand-compensate for the gap; that is `CLAUDE.md` gate 3 inverted — a
rule enforced twice in app logic instead of once at the lowest layer.

### The instrument

**One table. Every act in the region × five columns:**

> create · edit title/caption · edit body · tag · pin · folder · place · duplicate ·
> archive · trash · restore · destroy · empty-trash
>
> **one door? · does it ask? · busy state? · is failure visible? · does its write assert it happened?**

**No blank cells** — that is `CLAUDE.md` gate 2, applied to a surface instead of a record.
It found both defects above by reading, it terminates, and it answers the owner's actual
question (*was this built the right way*) rather than the one the board taught me to ask.

---

## 2 · What we know — measured, with the criterion stated

| | | criterion |
|---|---|---|
| dates formatted outside `lib/dates` | **0** ✅ | `boundaries.test.mjs` |
| database reached outside `lib/db` | **0** ✅ | `boundaries.test.mjs` |
| unused parameters / locals | **0** ✅ | `tsc --noUnusedParameters` |
| `requireUser` on every server action | **8 of 8** ✅ | read individually |
| service-role key anywhere in `src/` | **0** ✅ | RLS is the boundary, as ruled |
| **hand-rolled debounced saves** | **5** ⚠ | each read |
| **acts with no confirm on a destructive path** | **2** 🔴 | §1(a) |
| **db write doors that don't assert rows** | **≥1** 🔴 | §1(b) |

v1's "9 optimistic surfaces" row is **deleted**. The real ones, named rather than counted:
`notes-browser.tsx:84` · `place-on-board.tsx:32` · `note-workspace.tsx:44` ·
`text-workspace.tsx:81` · `loose-file-intake.tsx:59,146` · `intake.tsx:131`.

---

## 3 · The order

1. **The act table** (§1). Fix what it exposes — starting with the unconfirmed trash.
2. **Words lost before a write is ever attempted.** A category v1 missed entirely:
   - `/write` and both text workspaces have **no crash guard**, while the *intake box* does
     (`jot-draft.ts`). `quick-write.tsx`'s banner says *"Your words are still here"* — true
     until the tab is reloaded or evicted, which on a phone is the ordinary case.
   - `loose-file-intake.tsx:146` clears a caption **before** awaiting its write, so a failed
     caption is destroyed; `intake.tsx:130` restores on every failure path. Same decision,
     two answers, and the destructive one is uncommented.
   - `loose-file-intake` sweeps uploaded files on **any** throw, where `actions.ts:105`
     refuses to until a row abort is *confirmed* (R2.11). A throw with the row landed leaves
     a live bit pointing at deleted files.
3. **The five save loops** — moved down from the lead, and it already has two subjects:
   **`BitTitle` (`bit-controls.tsx:36`) has no write chain** — type, blur, type, blur inside
   600ms and the first request landing last leaves the database on the old title while the
   screen shows the new one, with nothing to retry. **`board-description.tsx:20` is a
   verbatim clone**, in the board region this pass called closed. *(`text-workspace.tsx` is
   **sounder** than the board's queue was — the write chain is real and it writes `latest`
   rather than a restored snapshot, so P2's shape can't occur. **Sounder, not sound:** it
   marks a body clean before reconciling references, and has no retry timer at all.)*
4. **Server actions** (`actions.ts`, 361 lines). Authorization checked out (see §2). The
   gaps: `trashFromInbox` does **no input validation**; `makeBoardFromBits` has **no
   try/catch** while every sibling returns `{error}` — three error contracts in one file.
5. **Comments that assert false things** — the code map's own dimension #5, dropped from v1.
   `actions.ts:131` is a doc-block for a function that has moved; `actions.ts:308` is
   attached to the wrong one. §1(a)'s false comment is the costly kind.
6. **The six scenes** (§4) — the seam-level check, as fixtures rather than a heading.
7. **Then the big files**, judged by the owner's ruling — *does each do ONE job well* — not
   by line count.

---

## 4 · The scenes — a procedure, not a heading

v1 said "trace the flows", which a session with no memory cannot execute. `model-scenarios.md`
already establishes the pattern: **each scene names its starting row state, the exact click
path, and the expected rows after every step.**

1. Catch a link on a phone → it lands loose → find it in `/bits`
2. Write a note in `/write` → close the tab mid-sentence → reopen
3. Caption a photo → the write fails → what is on screen, what is in the database
4. Trash from the inbox → restore it → is it where it was
5. Duplicate a bit → trash the copy → the original's files must survive
6. Two tabs open on one note → type in both

**Scene 6 is a ruling question, not a bug.** The schema is explicit: *"no version column,
last-arrival-wins (I-D5)"*. For a card's x/y that is fine. For a rich-text **body** it means
whole-document loss with no error. **Ask the owner whether I-D5 still holds now that a bit
body is a document** — do not fix it silently.

---

## 5 · Done means

v1 had no answer. This one is checkable by someone other than me:

1. **Every file in the region** × the code map's five dimensions — **no blank cells**.
2. **Every act** traced through create · edit · un-place · archive · trash · restore ·
   destroy — **no blank cells** (`CLAUDE.md` gate 2, already the house rule).
3. **Every finding** either fixed *with a test that goes red when the fix is reverted*, or
   written into `parked.md` with its re-entry condition. Nothing sits in a chat log.

---

## 6 · The real failure modes

v1 named two comfortable ones. These are the ones that would actually sink it:

- **Reviewing only what the board taught me to look for.** Already happened once — it is
  what §0 is about. The act table exists to look at the region on its own terms.
- **Accepting agent reports as findings.** The code map caps agent reading at ~60% for a
  reason, and most of this region cannot be run. Every finding gets confirmed against the
  code before it is called one — as the four in §0 were.
- **Declaring Group E done while `/note/[id]` and `src/components/` were never in anyone's
  region.** 1,271 lines, including the app's largest untracked file.

**One honest constraint, stated rather than promised around:** "prove by reverting" is the
standard this pass has held, and **most of this region cannot meet it.** There are 2 test
files and no React test runner. Reaching it for the save loops means extracting three of the
region's most delicate files into pure modules — **a new pattern, needing the owner's
sign-off before it starts** (`CLAUDE.md`: ask before adding patterns). Only the *technique*
from `write-queue.test.mjs` is reusable, not the harness. Where that standard can't be met,
the finding says so instead of borrowing confidence it hasn't earned.

## 7 · Carried in from elsewhere
- **`m6`** — the unlocated unreachable branch from the board pass; the ledger assigns it here.
- **`/bits` loads every live bit and signs every thumbnail** on each load. Correct at
  one-writer scale and commented as such — a named scaling cliff, not work.
- **`notes-browser.tsx:190`** filters in memory over a client-held array. Correct today
  because of `pagedRows`; worth one line, not a step.
