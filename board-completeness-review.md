# Are boards done? — the review

**Status: 🟡 in progress, 2026-09-03.** The owner's goal, in her words: *"I just wanna be able to
walk out of this and be like, your boards are done, a hundred percent — and that's not just 'it's
clean', we actually checked stuff and we're feeling great about it. So it's the process I want to
end up with today, taking our time to move through it."*

This is **not** the board code-quality pass (`board-code-quality-pass.md`), which fixed what was
already known to be wrong. This asks a harder question: **is anything still missing, half-built, or
merely believed to work?**

---

## 1 · What "done" means — CORRECTED by the owner (2026-09-03)

Claude's first cut weighted this toward feature-completeness. The owner corrected it, and the
correction changes what to look for:

> *"Is it functional, was it BUILT THE RIGHT WAY? This file is the right size. We are using this
> component so we're defining it in just one place and then calling it — or we are doing the same
> approach multiple times, so I'm doing the same code but tweaking it. Storage is working this way,
> data is being stored in this way, dates come up like this. All of these cases are addressed. I
> really wanna think about LOGIC."*

**So this is a DESIGN AND LOGIC review, not a feature audit and not a style pass.** Worth naming the
difference, because "code quality" usually means the shallow thing: formatting, naming, lint. What
the owner is asking for is two layers deeper — **is it built right**, and **is the reasoning sound**.

She also set the right expectation about bugs: *"of course when I'm testing I might come up with
bugs"* — finding one later is normal and is NOT the measure. The measure is whether the thing was
built well enough that a bug is a slip rather than a symptom.

| # | The bar | What it rules out |
|---|---|---|
| **D1 · One definition, called** | Not the same approach retyped with tweaks. | Two functions solving one problem differently; a rule enforced in three places with three slightly different conditions. |
| **D2 · Right size, one job** | Each file holds one job; size judged by cohesion, not a number (the ~150 ceiling is relaxed). | A file you cannot hold in your head, or one that changes for unrelated reasons. |
| **D3 · Storage and data are principled** | One place decides how a thing is stored and read; nothing stored twice; the render rule single-sourced. | A class of bug made possible by the shape of the data rather than by a mistake. |
| **D4 · Dates handled one way** | Written, read, compared and displayed consistently. | A "day" that means different things on different screens. |
| **D5 · THE CASES ARE ADDRESSED** | The logic handles what can actually happen — not just the happy path. | Conditions that can't be true, `else` branches assuming something unproven, async ordering assumed rather than enforced, state that can disagree with the database. |
| **D6 · Every remaining gap is named and chosen** | | An unknown hole. A ruled deferral is done; an accident is not. |

**D5 is the main event** — the owner said so plainly ("I really wanna think about logic"), and it is
also where every bug today actually lived.

**D6 is what makes the word usable.** "Boards are done" will never mean nothing is left. It means
*we know exactly what is left, and each piece is a decision rather than an accident.*

## 1b · The full bar — the owner's five, plus what Claude would add

The owner asked for this directly: *"I'd love if you took my goal and brought what I'm missing, or
how you think about it too — I don't actually know what good code quality is, and good storage, and
whatever all else is, and I'd like to know that actually."* So this section is both the checklist
and the explanation, written to be readable by a non-engineer.

### What the owner already named — and these are the right things

**Structure.** *One definition, called from many places — not the same approach retyped with tweaks.*
And *files the right size*, meaning each file holds one job. The test for "one job" is not a line
count: it is **does this file change for more than one reason?** A file you edit for two unrelated
causes is two files wearing one name.

**Data.** *Storage works one way; dates come up one way.* Good storage has a precise meaning, below.

**Logic.** *All the cases are addressed.* The main event, and the owner was right to name it.

### What Claude would add, and why each earns its place

**1 · WHAT HAPPENS WHEN THINGS GO WRONG.** The single biggest omission from most reviews. Good
code is judged mostly on its failure paths, because the happy path is the easy half. Three rules:
*nothing fails silently* · *a failed act leaves you where you started, not halfway* · *the screen
never claims something happened that didn't.* **Today's example:** putting a thing away from a stale
page did nothing at all, with no error — six of nine paths ignored whether the write landed.

**2 · DOES THE SCREEN AGREE WITH THE DATABASE?** This app paints changes immediately and saves
afterwards, which is what makes it feel fast — and it means the screen can lie. Every optimistic
change needs an answer to "what if the save fails?" **Today's example:** a duplicated card inherited
the original's LOCK, so it looked frozen while the database said it was free — until you reloaded.

**3 · DO THE NAMES TELL THE TRUTH?** A name that lies costs more than a missing name, because
people trust it. **Today's example:** `useBoardActs` was named like React machinery and wasn't —
which also meant the linter applied the wrong rules to it for months.

**4 · TIME AND ORDERING.** Anything that waits can arrive out of order. Two saves racing, a click
during a save, a debounce that hasn't fired yet. **Today's example:** typing into a card and
duplicating it within 350ms copied the text as it was BEFORE you typed, because the copy read the
saved row while the screen showed the unsaved one.

**5 · BLAST RADIUS.** If I change this, what else breaks? Code where a small change forces edits in
six places is telling you the seams are in the wrong place.

**6 · CAN IT BE TESTED — as a DESIGN signal, not a chore.** When something is hard to test, that is
usually the design saying it is too tangled, not a reason to skip the test. **Today's example:** the
remove acts could not be tested at all until their database calls were passed IN rather than reached
for — one change, and nineteen tests became possible.

**7 · CAN THE PERSON GET BACK?** Every act should be reversible, or say plainly that it isn't.

**8 · WHAT HAPPENS WHEN THERE IS A LOT OF IT.** 500 cards, a slow connection. **Today's example:**
making a board from 200 things fired ~400 database round-trips in sequence and could outlive its own
request, leaving a half-built board.

### What "GOOD STORAGE" actually means — since the owner asked

Five properties, in the order they matter:

1. **One source of truth per fact.** If a thing can be computed, compute it — don't store it and
   hope the copy stays right. *This app does this well:* a bit's `face` is computed from its
   content, never stored; its `state` (live/archived/trashed) is derived from two timestamps rather
   than being a third field that could disagree with them.
2. **The database enforces what must always be true — not the app.** App rules can be bypassed by a
   bug; a database constraint cannot. *This app does this well:* `placement_bit_once` makes "the
   same bit twice on one board" **physically impossible**, which is why duplicating had to mint a
   new bit — the model refused the shortcut.
3. **Bad states should be impossible, not merely avoided.** *Being fixed this week:* a thing could
   be trashed AND archived at once if two devices raced; a database CHECK now makes that state
   unreachable rather than merely unlikely.
4. **Know what is stored vs computed vs measured.** *This app is deliberate here:* a card's position
   is stored; a text card's HEIGHT is not, because the text decides it — so it is measured live.
   Storing it would create a number that is wrong the moment you type.
5. **Every write goes through one door.** So a rule can be enforced in one place. *This app does
   this:* nothing calls the database from a component.

### And "good dates", briefly

Store one way (UTC, ISO), display in the person's own zone, and make sure "what day is this?" is
computed the same way everywhere. Day boundaries are where this bites: something captured at 6pm
Pacific is already "tomorrow" in UTC, so a timeline grouped by UTC files it under the wrong heading.

## 2 · The process

1. **Audit — four parallel reads** *(running)*
   - **DESIGN AND LOGIC** — one-definition vs retyped · file size and shape · storage and data ·
     dates · **case coverage** → the main one, tests D1–D5
   - **What the board can do**, and everything half-built, unreachable, or inconsistent between card
     types → the "cases addressed" question from the user's side
   - **Promises vs reality** — every plan and log against the code
   - **Proven vs believed** — the evidence map
2. **Triage.** Every finding lands in exactly one bucket: **fix now** · **name and defer** (with a
   re-entry condition, so it satisfies D5) · **already fine, no action**. Claude proposes; the owner
   overrules anything.
3. **Fix**, in risk order, each gated and committed alone as usual.
4. **THE WALKTHROUGH.** The owner's hands on a real board, following a written script that covers
   the paths no test can reach. This is the step that earns the word "checked" — everything before
   it is Claude's opinion.
5. **The verdict**, recorded here: what is done, what is deferred and why, and what is known-unproven.

**Claude's own findings are not evidence.** Three separate times today an independent reviewer found
real defects in work Claude had just called finished; and nine bugs shipped in the wiring while the
tests stayed green. Step 4 is not ceremony.

---

## 3 · What we already know going in

Recorded so the audits are measured against it rather than rediscovering it:

**Owner-verified by hand (the strongest evidence we have):**
- The four remove acts, collapsed — full walkthrough, remove/trash × one/many × undo × redo.
  *"Yes, everything is working. I just took the whole test. It all works perfectly."*
- Align & distribute buttons · the snap guides appearing.

**Known-unproven, from the last pass:** duplicate a bit (its file copy has no test and cannot get
one without DB test infrastructure) · archive reaching every bit · the board timeline · make-a-board
from a tag or selection · the drawer's new default scope.

**Deliberately deferred, with reasons already written:**
- **Card alignment is partial by the owner's call** ("functional enough for now"): group drags don't
  snap · no background grid · the resting-box refinement is ruled but unbuilt · the feel-tune
  (magenta shade, pull strength) never done.
- **The pointer machine stays as it is** — the ruled input-engine work would delete any extraction.
- **The "save before you leave" duplication stays** — 10 files, guards unsaved writing, needs a phone.

**The structural fact that shapes all of this:** every bug found today was in the WIRING, not the
logic — and the test suite covers pure functions only, so it caught none of them. Any verdict that
leans on "the tests pass" is leaning on the wrong thing.
