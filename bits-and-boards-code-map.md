# Bits and boards — every file, and how much I actually trust it

**What this is:** the source-file map for bits and boards (compositions deliberately
excluded), with an honest confidence rating per group. Written 2026-09-03 at the owner's
ask: *"what are all the files there and what is your confidence interval on the cleanliness
and the record and the logic of these files?"*

**Not the same as `data-map.md`** — that one maps *actions to stored data*. This one maps
*code to health*.

---

## 1 · First, the honest thing about "confidence"

You asked for a confidence interval. Here is the part that makes the numbers mean anything:

> **Confidence comes from the KIND of evidence, not from how carefully I looked.**

Three kinds, and they are not close to equal:

| Evidence | What it actually proves | Ceiling on my confidence |
|---|---|---|
| **A test that runs** | the behaviour is correct *and stays correct tomorrow* | **~95%** |
| **I read the file closely** | I found the bugs I was capable of noticing | **~70%** |
| **An audit agent read it** | same, one step further from me | **~60%** |
| **Nobody looked this pass** | nothing | **~40%** — not "bad", *unknown* |

The trap is that careful reading *feels* like proof. It isn't. Every bug found this week
was in code I had already read and believed. `use-persistence.ts` is the sharpest example:
I read it, shipped a fix, and the audit then found that same fix was **half-wired one
function below** — reading it twice didn't catch what one test would have.

**That is why 12% is the number that matters** (see §2). It caps everything else.

## 2 · The measured facts — no judgement in this section

Run today against the tree:

| | |
|---|---|
| source files (bits + boards + lib) | **96** |
| lines | **13,254** |
| lines with a test behind them | **1,549 = 12%** |
| **lines with no test** | **11,705 = 88%** |
| files over the project's own ~150-line ceiling | **31** |
| **database calls outside `lib/db`** | **0** ✅ |

That last row is the one genuinely excellent structural fact in the codebase. The house
rule *"never call Supabase from a component"* is held **everywhere, without exception** —
96 files, zero violations. It's why the data layer can be fixed without touching the UI,
and why this whole review is tractable at all.

## 3 · The dimensions — your three, sharpened into five

You named *cleanliness · the record · the logic*. Those are the right instincts; here they
are as things that can actually be checked:

| | Dimension | The question | How it's checked |
|---|---|---|---|
| 1 | **Shape** | Is this file one size and one job? | line count, and naming the jobs |
| 2 | **Logic** | Is it right in the awkward cases, not just the normal one? | reading, then testing |
| 3 | **One door** | Is each fact decided in exactly one place? | grep for second definitions |
| 4 | **Proof** | Can I *show* it works, or only say so? | does a test exist |
| 5 | **Honest record** | Do the comments describe what the code does? | read both, compare |

**#5 is your "record", and it isn't cosmetic.** Three comments in the board were found
asserting things that are false — one claimed react-rnd suppresses a click after a drag
(verified: it does not, 0 occurrences), one claimed a default matched the renderer (240 vs
the real 400), one of *mine* claimed the snap guides were mounted in the world layer when
they were not — which is exactly why they were invisible on your screen. A wrong comment is
worse than no comment: it stops the next reader from checking.

---

## 4 · THE MAP — by job, not by folder

### Group A · The board's brain — pure logic, no React, no database
**~730 lines · 7 files · ALL TESTED**

`geometry.ts` 158 · `board-arrange.ts` 211 · `undo-stack.ts` 136 · `act-rules.ts` 45 ·
`camera-storage.ts` 78 · `placement-anchor.ts` 58 · `jot-draft.ts` 96

| Shape | Logic | One door | Proof | Record |
|---|---|---|---|---|
| ✅ | ✅ | ✅ | ✅ **tested** | ✅ |

**Confidence: ~90%.** The best part of the codebase and the model for the rest. Snapping,
alignment, the undo stack's survivor rule, the camera — all decidable by a test because
none of them know what React or Postgres are. Nothing outstanding.

### Group B · Saving — whether your typing survives
**250 lines · 1 file · NO TEST**

`use-persistence.ts` 250

| Shape | Logic | One door | Proof | Record |
|---|---|---|---|---|
| ⚠ | 🔴 **2 real bugs** | ✅ | 🔴 **none** | ⚠ |

**Confidence: ~35% — the lowest in the codebase, and the highest stakes.** A failed title is
dropped; a failed save can overwrite a save that worked. Both invisible to the build, both
only findable by running the timing. It is also currently *impossible* to test, because the
logic is welded to React. Plan: `board-logic-plan.md` Part B.

### Group C · The data layer — what's actually stored
**~2,140 lines · 12 files · 1 tested**

`bits.ts` **631** · `sources.ts` 237 · `boards.ts` 207 · `references.ts` 190 ·
`search.ts` 168 · `tags.ts` 160 · `shelf.ts` 117 · `inbox.ts` 97 · `resting.ts` 83 ·
`openings.ts` 59 · `graph.ts` 57 · `paged.ts` 29

| Shape | Logic | One door | Proof | Record |
|---|---|---|---|---|
| 🔴 `bits.ts` is 4× the ceiling | ⚠ 3 known bugs | ⚠ one leak | 🔴 essentially none | ✅ good |

**Confidence: ~60%.** Read closely by me, and the reading *found things* — which is evidence
the layer is reviewable, and also evidence there is more I didn't find.

- ✅ **`resting.ts` (83 lines) is the best-designed file in the project.** Nine different
  acts — archive, un-archive, trash, restore, for bits *and* boards — go through one
  function with one guard. That's what "one door" means in practice, and it's why a whole
  class of silent-failure bug simply cannot occur there.
- 🔴 `bits.ts` at 631 lines is the biggest single shape problem outside the board surface.
- ⚠ Known: S5 (`getBitBoards` misses the board-state filter its sibling has — the trash
  confirm can say "on 2 boards" when one is trashed) · S6b (`left_at` uses your laptop's
  clock, `arrived_at` the server's) · S8 (`placement.height` is stored and permanently
  false for text and audio).

### Group D · The board surface — what you see and touch
**~3,400 lines · 12 files · 1 tested**

`board-surface.tsx` **917** · `card.tsx` **574** · `use-create-doors.ts` **503** ·
`remove-acts.ts` 399 ✅tested · `text-bit.tsx` 284 · `use-camera.ts` 255 ·
`bit-ref-view.tsx` 247 · `draw-overlay.tsx` 232 · `gather-picker.tsx` 226 ·
`use-arrange-acts.ts` 214 · `board-toolbar.tsx` 191 · `source-picker.tsx` 192

| Shape | Logic | One door | Proof | Record |
|---|---|---|---|---|
| 🔴 917-line god object | ⚠ | ⚠ | 🔴 one file of twelve | ⚠ false comments found |

**Confidence: ~50%.** It works — you use it daily — but almost nothing here can be *shown*
to work.

- ✅ **`remove-acts.ts` is the counter-example and the proof the rest is fixable.** It was
  four near-identical copies; it's now one function with its dependencies passed in, and
  **19 real tests**. Nothing about the board made that impossible — it just hadn't been done.
- 🔴 `board-surface.tsx` does seven jobs. It is *why* its neighbours need 18- and 19-field
  dependency objects to talk to it.
- 🟡 **`card.tsx` (574) and `use-create-doors.ts` (503) I have not read line-by-line this
  pass** — audited by agents, not by me. Rating them higher than ~50% would be guessing.

### Group E · The bit pages — /bits, a bit's page, intake, write
**~2,900 lines · ~25 files · 2 tested**

`notes-browser.tsx` 416 · `actions.ts` 361 · `intake.tsx` 297 · `bit/[id]/page.tsx` 279 ·
`quick-write.tsx` 256 · `loose-file-intake.tsx` 220 · `bit-controls.tsx` 156 ·
`note-card.tsx` 149 · `text-workspace.tsx` 133 + the archive/trash/write pages

| Shape | Logic | One door | Proof | Record |
|---|---|---|---|---|
| ⚠ five over the ceiling | ❓ | ✅ recently consolidated | 🔴 | ❓ |

**Confidence: ~45%, and I want to be exact about why: this is mostly *unexamined*, not
*suspect*.** The four audits reached it thinly and I have not read the big files myself. It
is the largest genuinely unknown region on this map.

✅ One real improvement landed here: the archive and trash confirmations, and the nine
copies of the same button-with-error-state, were each collapsed to one door with tests.

### Group F · Shared helpers
**~1,300 lines · ~18 files · 5 tested**

`page-meta.ts` 251 · `storage.ts` 173 ✅ · `media.ts` 122 · `media-pdf.ts` 116 ·
`types.ts` 112 · `stroke.ts` 92 · `media-audio.ts` 90 · `search-query.ts` 70 ·
`labels.ts` 53 ✅ · `save-guard.ts` 51 · `dates.ts` 31 · `recent.ts` 35 ✅ ·
`local-storage.ts` 37 ✅ · `empty-message.ts` 24 ✅ + small ones

| Shape | Logic | One door | Proof | Record |
|---|---|---|---|---|
| ✅ | ⚠ one known | ✅ | 🟡 5 of 18 | ✅ |

**Confidence: ~70%.** Small, single-purpose, several tested — the shape the whole codebase
should look like. One known bug: `dates.ts` — `ago()` and `fmt()` answer "what day is
this?" two different ways, so a bit saved late at night reads **"today" on one screen and
yesterday's date on another**.

---

## 5 · The summary you asked for

| Group | Lines | Tested | Confidence | The one sentence |
|---|---|---|---|---|
| **A · the board's brain** | 730 | ✅ all | **~90%** | the model for everything else |
| **F · shared helpers** | 1,300 | 5/18 | **~70%** | right shape; one date bug |
| **C · the data layer** | 2,140 | ~0 | **~60%** | reviewable and reviewed; 3 known bugs; `bits.ts` too big |
| **D · the board surface** | 3,400 | 1/12 | **~50%** | works daily, provable almost nowhere |
| **E · the bit pages** | 2,900 | 2/25 | **~45%** | *unexamined*, not suspect — the real blind spot |
| **B · saving** | 250 | ❌ | **~35%** | lowest confidence, highest stakes |

**The honest headline: nothing here is rotten, and one thing is genuinely excellent (the
boundary rule, held in 96 files out of 96). What's missing is not quality — it's *proof*.**
88% of these lines are believed rather than demonstrated, and every bug this week lived in
the believed part.

**So the answer to "are boards done?" is: they work, and I can only *prove* about an eighth
of it.** Closing that is what `board-logic-plan.md` is for — and Group E is the region
neither of us has looked at properly, which I'd want on the list before either of us says
"done."
