# The foundations pass — built to last, from the ground up

**Status: the process, defined. Not yet run.** Owner's ask, 2026-09-04: *"We need to make sure
it's written down and standardised and tested before we keep building on top of it… define what
that would look like, a process from beginning to end. If we ran it we would feel solid. Do this
first, before the frame and the other builds, as long as we proceed efficiently."*

---

## 1 · What "solid" means — the three questions

A foundation is solid when it has all three, and something catches them drifting apart:

| question | what answers it | why it's not optional |
|---|---|---|
| **Is it written down?** | a paragraph in `SPEC.md` / `model.md` / `invariants.md` saying what it is and *why* | the only place a *decision* lives. Code says what; only a doc says why |
| **Is it tested?** | a test that fails if it silently changes | the only thing that keeps it true tomorrow. Comments promising "keep in sync" failed four times this week; tests did not |
| **Was it chosen?** | an alternative was considered and the current shape was picked, on the record | "it works" is not "it was decided." The coordinate system works, is tested, and nobody chose it |

**Exit condition for the whole pass:** every foundation in §2 has ✅ ✅ ✅ — or a ⚪ where the
owner has *explicitly* deferred the choice. No row is blank. That is checkable by someone other
than Claude.

---

## 2 · The foundations — the things features stand on

Not features. The things features *assume*. Candidates, with where each stands **today** (from
this week's work — several are already solid):

| foundation | what it is, plainly | written | tested | chosen |
|---|---|---|---|---|
| **the coordinate system** | the board is a plane with a fixed origin; panning moves your window, not the world | ❌ | ✅ | ❌ never |
| **the camera memory** | where you were looking, per board, **per device** (local storage, not the database) | ❌ | ✅ | ⚪ implicit |
| **how things arrive** | three paths: where you tap · where you're looking · right-of-cluster when you're not there | ❌ | ✅ | ⚠ partly |
| **placement** | one bit on one board; position, size, tilt, lock, arrival, departure | ✅ | ✅ | ✅ |
| **the render rule** | `board_cards`: a card shows iff present + bit live + board live | ✅ | ✅ | ✅ |
| **selection** | which cards are picked; keyed by *bit* (a placement id can rename) | ❌ | ⚠ partly | ✅ this week |
| **identity** | bit ids · placement ids · optimistic ids · reconcile | ❌ | ⚠ partly | ✅ |
| **the save model** | optimistic + debounced + chained per row; the queue holds what isn't safely saved | ✅ | ✅ this week | ✅ this week |
| **resting states** | live / archived / trashed; trash wins; one door | ✅ | ✅ | ✅ |
| **the type set** | six kinds of bit; SQL and TypeScript must agree | ✅ | ✅ this week | ✅ |
| **the copy rule** | a copy inherits what the bit has, never what points at it | ✅ this week | ✅ this week | ✅ |
| **dates and zones** | stored UTC; shown in the reader's zone | ✅ this week | ✅ this week | ✅ this week |
| **files** | where a bit's file lives, by type; copies get their own | ⚠ partly | ✅ | ✅ |
| **two devices** | last write wins, no versions (I-D5) — ruled for positions, **not re-examined for a document body** | ✅ | ❌ | ⚠ needs re-ruling |
| **undo** | one board-scoped stack; survivor rule; settled before reverse | ✅ | ✅ | ✅ |
| **the security boundary** | RLS on every table; anon key only; no service key in `src/` | ✅ | ❌ **no test that every table has RLS** | ✅ |
| **the board's kinds** | canvas vs frame — **ruled today as a choice at creation**; the frame plan says otherwise | ❌ | ❌ | ✅ today |

**Reading the grid:** eight rows are already solid from this week. The pass is about the other
nine — and three of them (coordinates · arrivals · two devices) sit directly under the modes and
frame builds, which is why this comes first.

---

## 3 · The process — beginning to end

**Step 1 · Confirm the list.** *(owner, 20 minutes)* Read §2. Add what's missing, strike what
isn't a foundation. **This is the only step that can't be delegated** — the list of what the app
stands on is a judgement.

**Step 2 · Read each unsolid foundation.** *(Claude + agents)* For every ❌ or ⚠: what does the
code actually do? Agents read; Claude verifies every claim against the code before it's called a
fact — the discipline that caught two false findings this week. Output: one paragraph per
foundation, in plain words, *"here is what it does today."*

**Step 3 · Ask "was it chosen?" of each.** *(Claude)* Name the alternative that wasn't taken, and
whether the current shape is right or merely first. Where it's merely first: **a decision for the
owner**, with two or three options and a lean — not a rewrite. Output: a short decision list.

**Step 4 · Owner rules.** *(owner)* On the decision list only. Everything else proceeds without
them.

**Step 5 · Write it down.** *(Claude)* Each foundation gets its paragraph in the right home —
`SPEC.md` for how, `invariants.md` for always-true rules, `model.md` if it's conceptual — with the
owner's ruling quoted where there was one. Never a new document per foundation.

**Step 6 · Guard it.** *(Claude)* Each foundation gets a test that fails if it silently changes —
the boundary-test pattern from this week, which reaches code nobody has written yet. **Every guard
is proven by breaking the thing and watching the test go red**, then restored.

**Step 7 · Antagonist.** *(agent)* On the grid, the paragraphs and the guards, with one question:
*is there a foundation missing, and does any guard test the word instead of the mechanism?* (The
second is a mistake made twice this week.)

**Step 8 · Fold, re-run the grid, exit.** Every row ✅ ✅ ✅ or ⚪-deferred. Then modes, then frame,
then bit types — on ground that's been looked at.

---

## 4 · Efficiency — how this stays fast

- **Eight of seventeen are already done.** This week's work *was* this process, run on the board.
  The pass consolidates it and fills nine gaps; it does not start over.
- **Agents read, Claude verifies, the owner decides.** Only step 1 and step 4 need the owner.
- **No rewrites.** A foundation that works and is tested but isn't written down needs a paragraph,
  not a build. Only a foundation that turns out to be *wrong* costs more — and finding that now
  is the entire point.
- **Rough size:** two sittings for steps 2–3 · one owner session for step 4 · one sitting for
  5–7. Then modes.

## 5 · What this pass is NOT
- Not a feature audit — that's `board-what-you-can-do.md`.
- Not the Group E (bit pages) review — that's `bit-pages-review-plan.md`, and it comes after.
- Not a UI or design pass.
- Not a rewrite of anything that's solid. Solid rows are left alone.
