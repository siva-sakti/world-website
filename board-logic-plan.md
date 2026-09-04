# The board's logic — the plan before any edit

**Status: a PLAN. Nothing in here is built yet.** Written 2026-09-03 in answer to:
*"I need everything planned please… there's logic flaws I need to think about how to
address each of these things… especially about copying and duplicating, to be really
careful, because we're gonna have a composition surface… we definitely need tests."*

Its input is `board-completeness-review.md` §4a (the nine substantive findings, S1–S9)
plus a fresh line-by-line audit of `use-persistence.ts`, which you asked for by name.

Read Part A first. It is the one you flagged, and **you were right in a more specific way
than I first credited** — see A.1.

> **Correction, same session.** My first draft of Part A read
> `docs/composition-technical-spec.md` (Sep 2). The owner caught it: *"I wanna make sure
> you're reading the right file… you're probably thinking about the old composition stuff
> like how we had notes."* Correct. The live document is **`docs/composition-spec.md`**
> (85KB, updated 15:31 today), which says of the older file: *"This supersedes
> `composition-technical-spec.md`."* `docs/INDEX.md` still names the old one as "THE LIVE
> SPEC" — **the index is stale and should be fixed.** Part A below is rebuilt from the
> live spec. Note it is banner-marked **draft, "DO NOT BUILD FROM THIS"** — so it is read
> here for the *contract duplicate must honour*, never as a build instruction.

---

## Part 0 · THE LEDGER — everything found, and where it stands

**One list, so nothing gets lost.** Every item found in this pass, including the small ones.
Update the status column in the same session anything moves. *(Findings live in
`board-completeness-review.md`; approaches live in Parts B–C below.)*

**✅ done · ⏳ in flight · ⬜ queued · ⚪ owner's call · 📋 decision, not a defect**

### The logic findings

| | What | Status |
|---|---|---|
| **P3** | the save queue can't be tested — welded to React | ✅ **done** — `write-queue.ts`, 9 tests, 149 → 158 |
| **P2** | a failed save can overwrite one that succeeded | ✅ **FIXED** — proven failing first (`[1,2,1]`), now green |
| **P1** | a failed title/caption is dropped — **⚠ narrower than Claude described**, see below | ✅ **FIXED** — proven failing first, now green |
| **P5** | 🆕 **`trackCreate` deletes by key with no identity guard** — a second create for the same card (un-place → undo revives the id) lets the first one's cleanup evict the second; `settled()` then returns early and the write hits a row that doesn't exist → **act silently lost**. `chains` was hardened against this exact shape in two places; `creates` was not. | ✅ **FIXED** + its own test |
| **P6** | 🆕 `flush()` drops its debounce timer from the map but never `clearTimeout`s it, so a stray timer re-fires a restored patch — contradicting `restorePending`'s own stated policy of never re-arming | ✅ **FIXED** + its own test |
| **S4/P4** | placement fields in 3 hand-kept lists — a new field silently doesn't save | ✅ **FIXED** — one table (`lib/placement-fields.ts`) + a guard test |
| **S7** | `editingId` strands on an undo/redo reverse — keyboard goes dead | ✅ **FIXED** + 2 tests |
| **S3** | `restore()` guards by a different key than its 5 siblings — can show 2 cards for 1 bit | ✅ **FIXED** — guards by bit, like its siblings + test |
| **S5** | 3 definitions of "which boards is this bit on"; the trash confirm can lie | ✅ **FIXED** — one door (`lib/db/board-membership`), 3 callers, 5 tests |
| **S6** | `ago()` and `fmt()` disagree about what day it is | ✅ **FIXED** — one day-rule, 7 tests, proven by reverting |
| **S6b** | `left_at` uses the browser clock, `arrived_at` the server's — can leave before arriving | ⚪ **needs a migration you run** |
| **S8** | `placement.height` stored and permanently false for text + audio | ✅ **FIXED** — one door `isFlexSized`, no height stored for text/audio, 4 tests |
| **S2** | the optimistic seam has no stated rule | ✅ **WRITTEN as I-G7**, drawn from the six real cases; parts 2·3·4 already have tests, part 1 is named as the one that doesn't |
| **S1** | `board-surface.tsx` does 7 jobs | ⬜ step 10 *(ruled: after tests)* |
| **S9** | 88% of lines have no test | ⬜ the whole plan |

> **⚠ P1 was wrong as I first described it, and the test is what caught me.**
> I reported it as *"a failed title is always dropped."* It isn't. `restorePending`'s first
> branch stores the captured object **whole** — `content` included at runtime, even though
> the parameter type omits it — so a failed title with nothing else queued **is** retried
> today. The drop happens **only in the merge branch**: fail a title write, then nudge the
> card while it's in flight, and `content` is silently discarded. Narrower than I said, but
> real, and the harder one to notice by reading.
>
> **This is the argument for tests-before-fix, made by accident.** Writing the reproduction
> didn't just prove the bug — it corrected my account of it. Had I gone straight to the fix,
> I'd have "fixed" a bug whose shape I had wrong. A ninth test now pins the boundary (with
> nothing else queued the title *is* retried) so nobody can fix it by accident later.

### The small ones — real, easy to forget, that's why they're here

| | What | Status |
|---|---|---|
| m1 | dead exports: `isBusy` / `version` (+ its `bump()` and 8 call sites) | ✅ **REMOVED** — nothing in the app ever read them; `use-undo`'s comment describing `version` as the render mirror was also false and is corrected |
| m1b | `display_size` stored, constrained, copied by duplicate, **never read** | ⚪ **needs a migration you run** — inert meanwhile; queued with the other schema changes |
| m2 | a comment claimed react-rnd suppresses a click after a drag | ✅ **FIXED — and it hid a real bug.** Verified myself: the string "click" appears **0 times** in react-rnd's whole build, so it suppresses nothing. Shift-dragging a selected card therefore dropped it *and deselected it* in one gesture, and dragging a text card could open it for editing. Now guarded with the same 4px slop as pan and marquee |
| m3 | `DEFAULT_W = 240` claimed to match the render default — it is 400 | ✅ **FIXED** — the comment now says what it is: a deliberate approximation, and nothing depends on it matching |
| m4 | an unused `placementId` parameter on two remove doors | ✅ **REMOVED** — worse than unused: it implied trash and archive were card-scoped, when both take the bit off **every** board. Call sites shown before changing the signature (2 app, 12 test) |
| m5 | `looseRefresh` bumped on a path where nothing became loose | ✅ **REMOVED** — a duplicate lands PLACED on the board, so the loose column had nothing new to show; it was a wasted round trip on every duplicate |
| m6 | one unreachable branch | ⚠ **NOT LOCATED** — the audit recorded that it exists but never where. Searched (`tsc --allowUnreachableCode false` finds none). Left open rather than guessed at; re-find it in the Group E pass or drop it |
| m7 | stale line references in `frame-plan.md` | ✅ **FIXED — and doubly stale.** It described "TWO hand-written lists" at line numbers that had both drifted; the second list no longer exists (the insert was changed to spread the row), so the note described work already done. Line numbers deliberately not restored |

### Rules to write down, with the test that enforces each

| | What | Status |
|---|---|---|
| r1 | **I-G5** — every date shows in the reader's own zone | ✅ **BUILT + its boundary test** (a stray formatter anywhere in `src/` fails the suite) |
| r2 | **the copy rule** — a copy inherits what the bit HAS, never what POINTS AT it | ✅ **I-G6 + a schema-reading guard test** (both drift directions proven) |
| r3 | retry when the connection returns | ✅ **DONE** — `online` in `save-guard`, so every surface gets it, + 4 tests |
| r4 | `docs/INDEX.md` named a superseded spec as live | ✅ fixed |

### Examined vs unexamined

| | What | Status |
|---|---|---|
| e1 | Group E — the bit pages, ~2,900 lines nobody has read this pass | ⬜ step 11 *(ruled: yes)* |
| e2 | `card.tsx` (574) + `use-create-doors.ts` (503) — audited by agents, not read by me | ⬜ fold into step 10 |

### 📋 Feature gaps — decisions, not defects. Yours, and parked here so they aren't lost
the pen ignores touch entirely · select mode kills panning for a mouse · notes on a board
have no title or source picker · the `[[` picker silently drops audio/pdf/link while the
drawer accepts them · no bulk lock/duplicate/send-to-back/tag · no way to make a note from a
board · no lightbox for an image, no way to read a PDF from its card.

---

## Part A · Copying, and what it means once compositions exist

### A.1 · The thing you were actually right about

**The composition spec ruled, today, that the composition's copy door *is* the
duplicate-a-bit feature I shipped this morning.** §24.5b, in your words:

> *"bring the bit in as a COPY — it would create a new bit; it wouldn't be linked to the
> original."*

and the spec's own note underneath it:

> *"**Machinery exists:** the duplicate-a-bit feature (shipped 2026-09-03, other window) —
> this door = duplicate + gather in one gesture."*

So when you said *"be really careful about copying and duplicating because we're gonna
have a composition surface"* — that wasn't a general instinct. **Duplicate is already
load-bearing outside the board.** Whatever it drops, the composition's copy door will drop
too, and it will drop it inside your writing. That raises the stakes on A.3 from tidiness
to correctness, and it's the reason this part goes first.

It also means the two times duplicate lost fields this week (first `locked` and the signed
URLs, then size, tilt and stacking) were not board-local bugs. They were the copy contract
being wrong, twice, with no written rule to catch it.

### A.2 · The four ways a bit shows up somewhere — only one makes a second bit

| What it is | What's stored | How many bits |
|---|---|---|
| **On a board** | a `placement` row — *this board shows that bit*, at x·y·w·h·z | **one** |
| **A chip in writing** | a `reference` row — *this piece points at that bit* | **one** |
| **A block in writing** | the same tie, shown open. **A block is a WINDOW** (§24.5b) — *"the document stores the tie, never the text"* | **one** |
| **Brought in as a copy** | **duplicate + gather** — a new bit, then a tie to it | **two** |

The first three are **pointers**. Only the fourth copies, and it copies *deliberately*,
because you ruled why: *"if you're bringing a bit in as a block but you're trimming it for
this piece — it would trim everywhere. That's the problem."* The copy exists so an edit
can be local. That's a good reason, and it's the only one.

**A confirmation worth noticing.** §23.1 stores how a bit *looks* in a piece — chip or
block, its size, its alignment — **on the tie**, not on the bit. That is precisely what
`placement` does for boards: the same bit on three surfaces has three presences, each on
its own row, none touching the others. You reached it from your own analogy (*"similar to
how a bit can be on multiple boards"*). The model agreeing with itself in two places
nobody coordinated is the strongest evidence in this whole review that the foundation is
sound.

### A.3 · The rule for what a copy inherits — the thing that isn't written down

Nowhere does the repo say what a copy carries. That absence is why the bug happened twice.
The rule:

> **A copy inherits what the bit *has*. It never inherits what *points at* it.**

Every field, no blank cells:

| | Inherited? | Because |
|---|---|---|
| type, body, caption, url, source | ✅ | the bit *has* them — they are what it is |
| tags | ✅ | the bit *has* them *(ruled: "we would copy all the original tags")* |
| its file | ✅ **its own copy** | two bits must never share one file, or trashing one destroys the other's picture |
| size, tilt, stacking, lock | ✅ | you ruled these are how the card *is*; a copy sits beside the original looking the same |
| ★ starred | ❌ | a claim about what you're on *now*, not about the thing |
| archived / trashed | ❌ | a copy is born live |
| **which boards it's on** | ❌ | those are *boards'* rows pointing at it |
| **which writing mentions it** | ❌ | those are *compositions'* rows pointing at it |
| **travel history** | ❌ | that is the original's story |

The bottom three are one reason said three times — which is how you know it's a rule and
not a list.

**This settles "unlinked" precisely.** Your word for the composition copy was *"it wouldn't
be linked to the original."* Under this rule that's exactly what happens: no tie of any
kind joins the two bits. It does **not** mean the copy is born bare — it keeps its tags,
its source, its caption, because those are things it *has*, not links to its parent. Worth
having said out loud before someone builds the door and reads "unlinked" as "empty."

And the *gather* half of "duplicate + gather" is what gives the new copy its one incoming
tie — created by the gather, never inherited by the copy. The rule holds through the
compound gesture.

### A.4 · The rest, checked against the live spec — all already ruled, nothing to build

1. **Duplicate a bit that writing mentions.** The writing still points at the original; the
   copy is mentioned nowhere. Correct by the rule, and **nothing to build**.
2. **Trash it.** §11.3: chips go *"greyed and frozen"*, tapping says *"this is in your trash
   — bring it out to see it"*; restore returns it *whole, references intact*. Ruled.
3. **Destroy it** (empty the trash). §11.4: references drop *"in both directions"*; chips
   *"degrade to plain text."* **I checked whether that can actually work, and it does, by
   construction:** a chip is stored as `<span data-ref="id">label</span>` — the words are in
   your writing; the id is only an attribute. Delete the bit and the words stay on the page.
   *(`bit-ref-view.tsx:23`, `references.ts:21`.)* Nothing to build.
4. **Duplicate a whole board.** Already correct: the copy's placements point at the **same
   bits** — a second *arrangement*, never second material *(`boards.ts:33-49`)*.

### A.5 · Two things to hand forward — not mine to decide, and not in this pass

- **⚪ §24.5b's open follow-on: where does a copy get edited?** Your spec leaves it open with
  a lean toward *(a) every block edits on its bit's page*. I'm not deciding it. I'll only
  note that (a) is the one needing no new machinery — it works the day the door ships.
- **⚠ A format assumption that will break.** `extractRefIds` finds chips by running a regex
  over stored **HTML**. §21.5's storage shape is 🔵 *recommended, not ruled*, and
  `research-tiptap-persistence.md` records that tiptap's own docs advise storing **JSON**.
  **If the writing moves to JSON, that function silently returns zero references** — no
  error, chips just stop registering. Cheap to make format-agnostic later; expensive to
  discover after a migration. Flagged, not fixed here.

**Verdict on Part A: the model is sound and needs no new mechanism.** What it needs is A.3
written into `invariants.md` and enforced by a test — because duplicate now has a second
caller coming, and a rule nobody wrote is a rule that gets broken a third time.

---

## Part B · `use-persistence.ts` — the audit you asked for

250 lines. It is the file that decides whether your typing survives. Four findings; two
of them are real bugs and **one of them I introduced yesterday**.

### B.1 · P1 — a failed title is *still* dropped 🔴

Yesterday I moved the card title/caption into the save queue so a failed write gets
retried like everything else. The queue's retry function, `restorePending` (line 144),
takes `{ bitId, placement, body }` — **`content` is not in it.** So the title joins the
queue, fails, and is dropped at exactly the step that exists to stop that. The fix I
shipped is half-wired.

This is worth saying plainly: I fixed a bug and left the same bug one function away. It's
the same "fix the instance, miss the class" shape as duplicate. It's caught now because
this audit read the file instead of trusting yesterday's commit message.

### B.2 · P2 — a failed save can undo a save that worked 🔴

The one I'd rank highest, because it corrupts silently and only shows up on reload.

Drag a card. The save fires and **stalls** (bad wifi). Drag it again. The second save
fires, queues behind the first, and **lands**. Then the first one finally fails — and its
recovery puts its own *older* values back in the queue. When you leave the board, those
older values are written over the newer ones that already succeeded. Reload: the card
teleports back to where it was two drags ago, and nothing ever showed an error.

The cause is a design choice, not a typo. The queue **removes** your change the moment it
starts writing, then tries to put it back if the write fails. Between the taking-out and
the putting-back, a newer change can come and go, and the put-back doesn't know.

**The fix is to stop taking it out.**

> **Keep the change in the queue until it is confirmed written. On success, remove only
> the fields whose value hasn't changed since. On failure, do nothing — it's still there.**

A newer drag simply overwrites the field in the queue, so a successful old write can't
clear it, and a failed old write has nothing to restore. **`restorePending` is deleted
entirely** — the function and both bugs above go with it. Roughly 20 lines out, and the
rule becomes one sentence you can hold in your head:

*the queue holds what isn't safely saved yet.*

That's what "good storage" looks like in practice, and it's the answer to your question:
not clever recovery code, but a shape where the bad case can't be expressed.

### B.3 · P3 — it can't be tested, and that's structural 🟡

Every finding above is invisible to `pnpm build` and to a human reading the diff. They're
timing bugs; you find them by *running* the timing. Right now you can't, because the
queue's logic is welded to React (`useRef`).

Same move that made the remove acts testable: pull the ~180 lines of queue logic into a
plain function with no React in it, and leave the hook as a ten-line wrapper. Then a test
can hold a fake database, make a write stall, fire a second one, fail the first, and
assert what's in the queue. **P1 and P2 both become tests that fail today and pass after.**

### B.4 · P4 — a new field silently doesn't save 🟡 *(this is S4)*

The file's own comment admits it: the field list and the mapping below it are
*"a HARD-CODED pair — a key absent from both is silently dropped… the act works for the
session, then vanishes on reload, with no error anywhere."* This already happened to
`angle`. Fix: one table both sides are derived from, so a field can't be half-added.

---

### B.5 · The fix, concretely — what actually changes

**The rule the queue will follow, in one line:**

> *The queue holds what is not safely saved yet. Nothing leaves it until the database says so.*

**Today** the queue empties itself the moment a save *starts*, then tries to put things back
if the save fails. **After**, it empties itself only when a save *succeeds*, and removes only
the fields it actually wrote — and only if nothing newer arrived meanwhile:

```
flush(card):
  take a SNAPSHOT of what's queued        ← today: takes it OUT
  write the snapshot
  on success → remove each field whose value is still what we wrote
  on failure → do nothing; it's still queued, so it retries naturally
```

That last comparison is the whole trick. If you dragged again while the save was in the
air, the queued value is now different from the one that landed, so it **stays** queued and
gets written. The stale-overwrite has nowhere to happen.

**What it deletes:** `restorePending` (~20 lines) — the function holding both bugs. P1 (the
dropped title) disappears because there is no longer a hand-written list of fields to forget
one from. P2 (the stale overwrite) disappears because nothing is ever put back.

**Two details I'll get right rather than discover later:**
- The card's id can be renamed mid-save (a call-in reuses a departed row's id). Success must
  clear under **both** the old and new key, or a written value stays queued forever and
  re-writes on every later flush.
- `flushAll` may now fire a save for a card whose save is already in the air. That's a
  duplicate write of identical values, chained behind the first, so it is harmless — and
  keeping it is deliberate, because `flushAll`'s whole job is to guarantee the writes land
  before you leave the board.

**Order — tests first, and I mean literally first:**
1. Lift the queue out of React into a plain function *(no behaviour change)*.
2. Write the D.1 tests against today's code. **P1 and P2 fail. I show you the output.**
3. Make the change above. The same tests pass. I show you that too.

Step 2 is the point. "I fixed it" is worth very little; a test that failed before and passes
after is the thing that makes it real — and it keeps failing forever if someone breaks it
again.

**The test that catches P2** — worth reading, because it's the exact sequence from your
board: queue a move, let its save stall, queue a second move, let *that* one succeed, then
fail the first. Assert the newer position is what survives. Today the older one wins.

---

## Part C · The nine findings — an approach for each

Grouped by what they cost, because they are not equal.

### C.1 · Fix now — real, contained, provable

| # | The fix | Why this shape |
|---|---|---|
| **S4 / P4** | One `PLACEMENT_FIELDS` table; the patch type and the mapping both derive from it. | Makes the failure impossible rather than remembered. |
| **P1 + P2** | The queue redesign in B.2. Deletes `restorePending`. | Removes two bugs and 20 lines together. |
| **S3** | Make all six remove/restore legs guard by the **same key**. `restore()` guards by `placementId` while its five siblings use `bitId`; a call-in renames a placementId, so the odd one out can miss and put **two cards on screen for one bit**. | It's an inconsistency, not a hard problem — but it produces a visibly wrong screen. |
| **S7** | The undo/redo reverses clear `editingId` like the forward acts already do. | Two lines. Redo a trash on a card you were typing in and the keyboard currently goes dead. |
| **S5** | **One door for "which boards is this bit on."** Verified today: `inbox.ts` filters out trashed/archived boards; **`getBitBoards` does not**, and it's what the trash confirm reads — so it can tell you "this is on 2 boards" when one of them is in the trash. `bit_travel` doesn't filter either, so the timeline lists legs on trashed boards. | Same class as the board-duplicate bug already fixed once. Fixing the instance again would be the exact mistake I keep making. |
| **S6** | `ago()` and `fmt()` must answer "what day is this" the **same way**. Verified: `fmt` uses calendar days in a pinned zone; `ago` divides elapsed milliseconds by 24h, so a bit saved at 23:00 reads **"today" on one screen and yesterday's date on another**. One `dayNumber()` both use. | You named dates as part of the bar. Two screens currently disagree. |

### C.2 · Fix now, but needs your hand — a database change

**S6b — a card can record leaving before it arrived.** `arrived_at` is stamped by the
server; `left_at` is stamped by *your laptop* (`bits.ts:366`). A device with a slow clock
places a bit, removes it, and writes a departure earlier than the arrival. The timeline
would draw a leg with negative length.

The right fix is at the lowest layer — a database trigger stamping `left_at` from the
server clock, so no app code can get it wrong — plus a check that refuses a backwards row.
**Migrations are yours to run**, so I'd write and prove it locally and add it to the batch
already queued for you. *(Recommended. The app-side alternative — clamping when reading —
hides the bad row instead of preventing it.)*

### C.3 · The judgement calls — my recommendation, your call

**S1 — `board-surface.tsx` is 905 lines doing seven jobs.** This is the structural root:
it's *why* the remove acts need a 19-field dependency object. Four clean seams exist
(`use-snap-guides` · `use-card-drag` · `use-board-pointer` · `use-alignment-acts`).

> **My recommendation: do the seams AFTER C.1, not before, and only with tests already in
> place.** Splitting a file is the change most likely to break working behaviour while
> looking harmless in a diff, and it is the one class of change `pnpm build` cannot catch.
> Doing it with the tests underneath is a different, much safer activity.

**S8 — `placement.height` for text and audio is stored and permanently false.** Text cards
render at `height: auto`; resize deliberately never writes the height back. The geometry
ledger exists to measure around it. So a stored column has never described the thing it
names — and `duplicateBoard` faithfully copies the wrong number.
Three ways: (a) leave it and document it, (b) stop writing it for auto-height types and
make the reader's fallback explicit, (c) store a real measured height.
> **My recommendation: (b).** It's honest, it's small, and (c) fights the layout for no
> gain you'd ever see.

**S2 — the optimistic seam has no stated rule.** Every bug in this whole pass was one
shape: the screen believing something the database doesn't. That's not fixable
finding-by-finding; it wants one written rule about what the screen may assume, of the
same kind as A.2. **I'd write it after the C.1 fixes**, so it's drawn from six real cases
instead of guessed at.

**S9 — 84% of the board has no automated test.** That's Part D; it isn't optional if the
sentence at the end is going to be *"we checked."*

---

## Part D · The tests

Not coverage for its own sake. Each of these is a bug that has actually happened here, or
one the audit says is one edit away.

**D.1 · The save queue** *(new — requires B.3's extraction)*
- a stalled save then a newer one: the newer value **survives** ← fails today (P2)
- a failed title is retried, not dropped ← fails today (P1)
- a failed position is retried on the next edit and on leaving the board
- two saves for one card can never land out of order
- a card removed mid-save doesn't get resurrected by a late write
- `flushAll` waits for writes already in the air, not just queued ones

**D.2 · The copy rule** *(new — A.3 made executable; this is the composition's contract too)*
- duplicating carries type · body · caption · url · source · tags · size · tilt · lock
- it does **not** carry ★, archived/trashed, placements, or travel
- the copy gets **its own file** — trashing one leaves the other's picture intact
- **a guard test that fails when a column is added to `bit` without a copy decision** —
  this is the one that stops the third instance of the bug, and the first instance of it
  happening *inside your writing* once the composition's copy door calls the same code

**D.3 · One answer per question**
- "which boards is this bit on" excludes trashed and archived boards, from every caller
- `ago()` and `fmt()` never disagree about which day a moment falls on
- a placement field added to the table is written and read back (S4 can't recur)

**D.4 · The removes** — already 19 passing tests; extend to cover S3's key mismatch.

Run with the existing `node --test` setup — no new dependency.

---

## Part E-0 · The owner's rulings, 2026-09-03 — fold these into everything above

1. **The ~150-line ceiling is guidance, not a rule.** *"I hope maybe it's OK to have over
   150 line ceiling, but I wanna make sure each file is constructed very intentionally and
   intelligently."* → **A file is judged by whether it does ONE job well, not by its line
   count.** This changes the argument for splitting `board-surface.tsx`: not "917 > 150" but
   "it does seven jobs, which is why its neighbours need 18- and 19-field dependency objects
   to reach it." `bits.ts` at 631 gets re-judged the same way — by its job count, not its
   size. `remove-acts.ts` is 399 lines and is the *best* file on the board; that is the proof
   the ceiling was never the point.
2. **Retry when the connection returns — yes.** Standard, and cheap: listen for the
   browser's `online` event and flush once. It is not a timer, so it cannot become the
   request storm the current design deliberately avoids.
3. **The split happens after the tests.** Confirmed.
4. **Group E — the bit pages — gets examined too.** *"as long as we're moving methodically,
   logically, slowly and comprehensively."* Added to the order below as its own step, after
   the board work, because it is ~2,900 lines nobody has read this pass.
5. **Dates: see §E-1.** Settings are wanted eventually, but the timezone fix must not wait
   for a settings page.

## Part E-1 · Dates — RULED: the date follows the device *(owner, 2026-09-03)*

**The owner overruled Claude's first recommendation, correctly.** Claude proposed pinning the
app to one fixed zone (`America/Los_Angeles`). The owner: *"we would be going to the server
whatever time zone that people are in, like their phone or their website — it would be
whatever time zone you were in, doesn't [that] make the most sense?"* **Yes. A pinned
constant is wrong the moment you open the app on a phone in another city, and it makes a
travel-shaped bug that nobody would think to look for.**

### The bug being fixed
It is 6pm Tuesday, you save a bit, and the app files it under **Wednesday**. The machine is
on Pacific (−7); the app formats in **UTC**, already tomorrow after 5pm local.

### Why UTC was pinned — the failure the new design must still avoid
Every page renders twice: on the server so it arrives complete, then again in the browser.
Both must produce **the same text** or React throws a hydration mismatch. The server runs in
UTC and the visitor's device does not, so naive "use local time" gives two answers for one
moment. Pinning both sides to UTC removed the breakage and made every evening date wrong.

### The ruled design — four small pieces

1. **One day-rule.** `dates.ts` gains a single "which calendar day is this moment, in this
   zone" function. `fmt()` ("Sep 2") and `ago()` ("today" / "yesterday" / "12d ago") both
   call it, so they **cannot disagree** — that is S6 fixed, not worked around.
2. **The device is the truth.** A small `<Stamp>` client component formats using
   `Intl.DateTimeFormat().resolvedOptions().timeZone` — the real zone of the real device,
   phone or laptop, wherever it is — with `suppressHydrationWarning` so React permits the
   server's first paint to differ. **This is the owner's answer, built.**
3. **The server's first paint uses a good guess.** ✅ **Verified 2026-09-03 against Vercel's
   own docs:** every deployment receives `x-vercel-ip-timezone`, the visitor's zone as an
   IANA name (`America/Chicago`), **on by default, all plans, no configuration**. Absent
   locally → fall back to UTC.
4. **A preference later is an OVERRIDE, not a mechanism.** When a profile page exists, a
   stored zone simply takes priority over step 2. Nothing else changes — every call site is
   already asking one function the same question.

### Why this can't fail — the property worth naming
**The guess in step 3 can be wrong at no cost.** IP geolocation is defeated by a VPN, and
Vercel's docs note the header does not work behind a proxy. None of that matters: the guess
only decides the *first paint*, and the device always wins on hydration. **A design where
being wrong costs nothing is a different kind of safe from a design that tries not to be
wrong** — and it is the direct answer to *"built so we won't have any failures or issues."*

The fragile version — the one to avoid — is each page fetching a zone for itself and
rendering before it arrives. One door makes that impossible to write.

**Only 5 call sites** exist (`bit/[id]/page.tsx` · `note/[id]/page.tsx` ·
`board/[id]/timeline/page.tsx` · `desk-alive.tsx` server-side, `bits/note-row.tsx` client),
so this is a contained change, not a sweep.

**Note:** `America/Los_Angeles` is now only the **dev fallback**, never the app's answer.

## Part E-2 · Order, and what I need from you

| | | Needs you? |
|---|---|---|
| 1 | ✅ **Lift the save queue out of React + write the failing tests** — done, 149 → 158 | no |
| 2 | ✅ **Fix P1 P2 P5 P6; the tests went green** — 160/160, each fix proven by reverting it | no |
| 3 | ✅ Retry on reconnect — one listener in `save-guard`, covers every saving surface | no |
| 4 | ✅ S4 field table · S7 `editingId` · S3 one guard key — all three proven by reverting | no |
| 5 | ✅ S5 one door · S6 one day-rule · **E-1 dates now follow the device** (`Stamp` · `ZoneProvider` · `readerZone`) | no |
| 6 | ✅ The copy rule → **I-G6** + `lib/db/bit-copy-rule.ts` + its guard test | no |
| 7 | ✅ Fixed `docs/INDEX.md` — it named the superseded composition spec as live | no |
| 8 | S6b migration (`left_at` on the server clock) — written and proven locally | **you run it** |
| 9 | ✅ S8 — no height stored for text + audio | no |
| 10 | S1 — split `board-surface.tsx` by its seven jobs, on top of the tests | no *(ruled: after tests)* |
| 11 | **Examine Group E** — the bit pages, ~2,900 unread lines | no *(ruled: yes)* |

Steps 1–7 are reversible, tested, and on the branch.

**Open for you:** S8's height (a/b/c in Part C) · and step 8's migration
when you're ready to run it.

### What this does not cover
The feature gaps in review §4c (touch pen · notes on a board · the `[[` picker dropping
audio/pdf/link · bulk acts · lightbox) are decisions, not defects, and stay yours.
