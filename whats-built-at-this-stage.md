# What's built at this stage — the master list, and how solid each piece is

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

## 2 · What counts, and the complete list *(rebuilt from the code, 2026-09-04)*

### What counts *(owner corrected Claude's first definition)*
Claude first said a foundation is *"something features assume rather than provide."* The owner:
*"Shouldn't we be looking at everything — anything we're calculating, any basis we're using to
move forward?"* **Yes.** That definition let small things slip. **The list is every mechanism:
anything the app calculates or relies on**, however small. A minor calculation nobody thinks of
as a foundation can still be the thing that is wrong. The families below exist so the walk
misses nothing — *"if creating families helps you run through things without missing anything,
do it — just make sure the lists are comprehensive."*

**Built from the code**, one entry per mechanism module, so "comprehensive" is checkable: run
`ls src/lib src/lib/db "src/app/board/[id]" src/components` and every non-test file is here.

### The eight families — ~60 mechanisms

**✅ = already solid from this week's board work (written · tested · chosen). Everything else is
walked in this pass.**

**A · SPACE — where things are, and how you see them**
| mechanism | plainly | lives in | status |
|---|---|---|---|
| the coordinate system | a plane with a fixed origin; panning moves your window | `geometry.ts` · `use-camera.ts` | ✅ **walked §6.1** — written · guarded · the one decision ruled |
| the camera | pan · zoom · fit · pinch | `use-camera.ts` | ⚠ tested, unwritten |
| the camera memory | where you were, per board, **per device** (local storage) | `camera-storage.ts` | ⚠ tested, unwritten, implicit choice |
| how things arrive | where you tap · where you're looking · right-of-cluster | `placement-anchor.ts` · `board-arrange.ts` (firstClearSpot) · `use-create-doors.ts` | ⚠ tested, unwritten, three rules |
| measured sizes | a card's real rendered size (text is auto-height) | `use-geometry.ts` | ⚠ |
| default sizes | what size a new card gets, by type | `card-defaults.ts` | ✅ |
| snapping | the magenta guides; nearest wins | `geometry.ts` | ✅ |
| alignment maths | line up · even gaps · tidy · the visual box for tilted cards | `board-arrange.ts` · `geometry.ts` | ✅ |

**B · THINGS — what a bit, a board and a placement are**
| mechanism | plainly | lives in | status |
|---|---|---|---|
| placement | one bit on one board: position · size · tilt · lock · arrival · departure | `placement-fields.ts` · `db/bits.ts` | ✅ |
| identity | bit ids · placement ids · optimistic ids · reconcile | `db/bits.ts` · `write-queue.ts` | ⚠ partly tested, unwritten |
| the type set | six kinds; SQL and TypeScript must agree | `card-vm.ts` · `types.ts` | ✅ |
| the copy rule | inherits what it has, never what points at it | `db/bit-copy-rule.ts` | ✅ |
| files | where a bit's file lives, by type | `storage.ts` | ✅ |
| media intake | image · audio · PDF: validate → decode → downscale | `media.ts` · `media-audio.ts` · `media-pdf.ts` | ⚠ |
| the pen's strokes | a pressure-aware outline | `stroke.ts` | ⚠ |
| a link's substance | fetching a page's title | `page-meta.ts` · `bits/actions.ts` | ⚠ |
| the card view-model | what a card is to the screen | `card-vm.ts` | ✅ |
| labels and faces | what to call a thing that has no name | `labels.ts` · the `face` column | ✅ |
| html | escape · plain-text → paragraphs | `html.ts` | ⚠ |

**C · ACTS — how things change**
| mechanism | plainly | lives in | status |
|---|---|---|---|
| the save model | optimistic · debounced · chained per row · the queue holds what isn't saved | `write-queue.ts` · `use-persistence.ts` · `save-guard.ts` | ✅ |
| creation | every way a card is born | `use-create-doors.ts` | ⚠ unwritten, 503 lines |
| removal | remove · trash · archive; rollback per leg | `remove-acts.ts` · `db/resting.ts` | ✅ |
| arrangement acts | the recording layer for move/align/tidy | `use-arrange-acts.ts` · `use-alignment-acts.ts` · `act-rules.ts` | ✅ |
| meaning acts | tag · untag, recorded | `use-meaning-acts.ts` · `db/tags.ts` | ⚠ |
| undo | one stack · survivor rule · settled before reverse | `undo-stack.ts` · `use-undo.ts` | ✅ |
| the act door | a button that does something and might fail | `use-act.tsx` | ✅ |
| confirms | trash · archive ask, one door each | `confirm.tsx` · `trash-confirm.ts` · `archive-confirm.ts` | ✅ |
| empty states | what a list says when it has nothing | `empty-message.ts` | ✅ tested |
| the jot draft | the capture box survives a reload (local) | `jot-draft.ts` | ✅ tested |

**D · STATE — what is remembered, and where**
| mechanism | plainly | lives in | status |
|---|---|---|---|
| resting states | live · archived · trashed; trash wins | `db/resting.ts` | ✅ |
| selection | which cards are picked; keyed by bit | `board-surface.tsx` · `use-marquee-select.ts` | ⚠ unwritten |
| local storage | the safe wrapper | `local-storage.ts` | ✅ |
| openings / recent | where you were, across devices (the database) | `db/openings.ts` · `recent.ts` · `record-opening.tsx` | ✅ |
| the shelf | groups and pins — how home is arranged | `db/shelf.ts` · `shelf-controls.tsx` | ⚠ |
| **the mode** *(coming)* | arrange / edit, per visit | — | 🔵 specified, not built |

**E · FINDING — how things are found**
| mechanism | plainly | lives in | status |
|---|---|---|---|
| search | the search language; computed, stored nowhere | `db/search.ts` · `search-query.ts` | ⚠ **flagged inconsistent earlier** |
| jump-to | word-start title matching | `jump-match.ts` | ⚠ |
| the drawer | all your bits, by kind, filtered | `drawer.tsx` (367 lines) | ⚠ **never examined** |
| loose / the inbox | which bits are on no board | `db/inbox.ts` · `db/board-membership.ts` | ✅ |
| the outline | the world inverted for scanning | `outline.ts` | ⚠ |
| the graph | the word web | `db/graph.ts` | ⚠ |
| references / gather | the `[[` chip and its rows | `db/references.ts` · `bitref.ts` | ⚠ **format assumption (HTML regex)** |
| paging | past 1000 rows, PostgREST truncates silently | `db/paged.ts` | ✅ |

**F · TRUST — the boundaries**
| mechanism | plainly | lives in | status |
|---|---|---|---|
| the security boundary | RLS on every table · anon key only · no service key | migrations · `supabase/` | ⚠ **no test that every table has RLS** |
| two devices | last write wins, no versions (I-D5) | the schema | ⚠ ruled for positions, **not for a document** |
| dates and zones | stored UTC, shown in the reader's zone | `dates.ts` · `zone.tsx` · `reader-zone.ts` · `stamp.tsx` | ✅ |
| export completeness | every table the export must carry | `db/exported-tables.ts` | ✅ |
| the boundary tests | dates only in one place; db only in one place; saves keep order | `boundaries.test.mjs` | ✅ |

**G · STRUCTURE — what surfaces exist**
| mechanism | plainly | lives in | status |
|---|---|---|---|
| the render rule | a card shows iff present + bit live + board live | `board_cards` view · `db/boards.ts` | ✅ |
| a board's data | create · rename · describe · duplicate · trash · destroy · empty the trash | `db/boards.ts` | ⚠ unwritten as a whole |
| the board's kinds | canvas vs frame — **ruled today: chosen at creation** | — | ❌ unwritten; frame plan says otherwise |
| surfaces | a board or a note, flattened for home | `surfaces.ts` | ⚠ |
| sources | where a bit came from | `db/sources.ts` | ⚠ |
| the rail | one cabinet, everywhere | `rail.tsx` | ⚠ |
| floating UI | pickers · peeks · menus, placed | `floating.ts` · `picker-menu.tsx` · `searchable-picker.tsx` · `folder-picker.tsx` | ⚠ |

**H · INPUT — how you interact**
| mechanism | plainly | lives in | status |
|---|---|---|---|
| the board's pointer | what a press on empty space means | `use-board-pointer.ts` | ✅ extracted, unwritten |
| card drag | drag · group drag · snap | `use-card-drag.ts` | ✅ extracted |
| marquee | rubber-band select | `use-marquee-select.ts` | ⚠ |
| the keyboard | Escape · arrows · Delete · ⌘A · undo | `use-board-keys.ts` | ⚠ |
| the pen's input | refuses fingers (palm rejection) | `draw-overlay.tsx` | ⚠ **flagged** |

### The count
**63 mechanisms — every non-test module in `src/lib`, `src/lib/db`, the board, `src/components` and `src/app/bits` is named** (checked against `ls`, 2026-09-04; three were missing on the first pass and are in now). **About 25 already ✅.** The pass walks the other ~35, and three of them sit
directly under the modes and frame builds: **the coordinate system · how things arrive · two
devices for a document.** That is why this comes first.

## 2b · THE LAYER MODEL — the board as a stack *(built with the owner 2026-09-05; checked against the code, not memory: every board-directory module and every §2 mechanism has exactly one home below, or sits in the named "outside the board" list. MECE is the rule: one home each, nothing unhomed.)*

**The data model in one line — three memories.** The **database** remembers forever, for every
device (Postgres rows + Storage bytes). **The device** remembers conveniences (localStorage: each
board's camera, the jot draft). **The visit** remembers the working state (React state — gone when
the tab closes, rightly). Every remembered thing on a board lives in exactly one of the three.

**What moves where.** Rows come DOWN once at load (L0); media bytes come down as short-lived
signed URLs at render; changes go UP as acts (L7) through the write queue and server actions (L8).
**The screen never shows the database directly** — it shows the visit's working copy (`cards` in
`board-surface.tsx`), which the database trails by a debounce. That one sentence is why the write
queue's ordering rules exist.

| # | layer | plainly | the data — what's held / sent where | in the code | §2 mechanisms homed here |
|---|---|---|---|---|---|
| **L0** | **the reads (load)** | you open `/board/x`: auth, then the server reads one view and the page arrives with its rows; panels read lazily later | `board_cards` rows (only: bit live + board live + placed) down as props; drawer/loose-column/pickers fetch their own lists client-side; media bytes down via signed URLs | `page.tsx` · `db/boards.ts` · `db/inbox.ts` · `storage.ts` (read half) | the render rule · loose/the inbox · paging |
| **L1** | **stored truth** | what Postgres + Storage hold; RLS is the wall | `board` · `placement` (x y w h z angle · arrived · left) · `bit` (type + substance per type: body / storage_path / strokes / url / face) · tag & source rows · reference rows · opening rows | migrations · `verification/` | placement · the type set · the copy rule · files · resting states · the security boundary · export completeness · a link's substance (the stored half) |
| **L2** | **the plane** | one coordinate system: every position is a point in px on an infinite plane, fixed origin | nothing stored beyond L1's numbers; pure arithmetic | `geometry.ts` (screen↔plane in `camera-storage.ts`) | the coordinate system |
| **L3** | **the camera** | which rectangle of the plane your screen shows: pan · zoom · pinch · fit | `{x, y, scale}` per board **per device** — localStorage, never the database | `use-camera.ts` · `camera-storage.ts` · `local-storage.ts` | the camera · the camera memory · local storage |
| **L4** | **rendering** | each placement becomes ONE universal card (position · size · tilt · selection frame — identical for every type) with **per-type content inside**; plus the chrome around the plane; plus the SECOND render path | text → tiptap · image → img · audio → player · pdf → first-page thumb + badge · link → page-card ladder · drawing → strokes as SVG; chrome = toolbar, selected-bar, tag-bar, drawer, loose column, pickers, confirms, snap guides; `/board/x/timeline` renders the SAME rows as days | `card.tsx` · `card-vm.ts` · `text-bit.tsx` · `doodle-bit.tsx` · `bit-ref-view.tsx` · `use-geometry.ts` · `stroke.ts` · panels/pickers · `timeline/` | the card view-model · measured sizes · default sizes · labels and faces · dates SHOWN (`stamp`/`zone`) · empty states · floating UI · the drawer (render half) |
| **L5** | **input** | what a press MEANS: on empty space (pan / marquee / create) · on a card (select, then edit) · keys · pen refuses fingers | gestures in, acts out; nothing stored | `use-board-pointer.ts` · `use-card-drag.ts` · `use-marquee-select.ts` · `use-board-keys.ts` · `draw-overlay.tsx` (input half) | the board's pointer · card drag · marquee · the keyboard · the pen's input |
| **L6** | **client state (the visit)** | what this visit remembers and rightly forgets at tab-close | `cards` (the working copy) · `selectedIds` + `selectMode` · `editingId` · `drawMode` · the undo stack · `error` · `wordsQueue` — all React state in `board-surface.tsx`. **The coming arrange/edit mode is exactly one new value here** (`selectMode` and `drawMode` are its precedents) | `board-surface.tsx` · `undo-stack.ts` · `use-undo.ts` | selection · undo · the mode *(coming)* |
| **L7** | **acts** | the ~40 things you can do; each = change the working copy now, queue the write | optimistic change to L6 + a patch handed to L8; per-type intake on the way in (validate → decode → downscale) | `use-create-doors.ts` · `remove-acts.ts` · `use-arrange-acts.ts` · `use-alignment-acts.ts` · `act-rules.ts` · `board-arrange.ts` · `use-meaning-acts.ts` · `use-act.tsx` · confirm rules · `media*.ts` · `page-meta.ts` · `html.ts` · `words-offer.tsx` · `gather-picker.tsx` | creation · media intake · removal · arrangement acts · meaning acts · undo (the recording half) · the act door · confirms · snapping + alignment maths · the pen's strokes (intake half) · references/gather (the act half) |
| **L8** | **persistence (the writes)** | the queue: debounced, snapshot-not-remove, per-row order kept, optimistic ids reconciled to real ones; server actions for the rest | patches UP to Postgres; the queue holds exactly what is not yet saved | `write-queue.ts` · `use-persistence.ts` · `save-guard.ts` · `bits/actions.ts` · `db/*` (write half) | the save model · identity · two devices |
| **L9** | **the doors** | the board's edges to the rest of the app | in: place-on-a-board (from `/bits`, from a bit's page) · out: a card opens its bit's page · the visit recorded for home's recents | `place-on-board.tsx` · `record-opening.tsx` · `db/openings.ts` · `recent.ts` | openings / recent |

**The type dimension (horizontal, not a layer).** A bit's type — today **text · image · audio ·
pdf · link · drawing**, ruled to grow by **checklist · table · file** — threads THROUGH the
stack: its own substance columns (L1), its own intake (L7), its own content inside the one
universal card (L4). Adding a type = one row across three layers, never a new layer.

**Where the two ruled changes cut** *(the point of the model)*:
- **canvas | frame** cuts **L1** (a `kind` + size on `board`) · **L2** (the plane gains an edge) ·
  **L3** (zoom/fit bounded) · **L4** (the page is drawn). The edge behaviors are ruled (2026-09-05,
  → `frame-spec.md` R5/R10/R11): overhang clipped at the edge · fit = the whole page · 100% = true print size.
- **arrange | edit** cuts **L6** (one new value) · **L4** (card look per mode) · **L5** (gesture
  meaning per mode) and gates **L7**. Stores nothing — mode is per-visit (`board-modes-spec.md`;
  owner may still overturn).

**Outside the board (named so nothing silently vanishes):** search + jump-to · the outline · the
graph · home/the shelf + surfaces · sources pages · the rail · capture/jot (and its draft). Each
is its own, much shorter stack, looked at when a build touches it.

**How this stays true (proposed, not built):** a manifest test — every board module declared with
its layer; the test walks real imports and fails on an unhomed module or a lower layer importing a
higher one (the boundary-test pattern). ⬜ awaiting the owner's go.

## 3 · The process — beginning to end

**Step 1 · Confirm the list.** *(owner, 20 minutes)* Read §2. Add what's missing, strike what
isn't a foundation. **This is the only step that can't be delegated** — the list of what the app
stands on is a judgement.

**Steps 2 + 3 · Walk each foundation, in this order.** *(owner's shape, 2026-09-04: "what is
happening conceptually, how is it being done, is it written down, how is it written down, what
do we think of how it's done and how it's written down — and then the next step from there.")*

Each foundation gets the same five headings. **Understand, then judge, then act** — the judging
never comes before the understanding, and the acting never comes before the judging.

| | heading | what goes under it | whose |
|---|---|---|---|
| 1 | **Conceptually** | what this thing *is*, in plain words, at the level a person thinks — no code | Claude drafts, owner corrects |
| 2 | **Technically** | how the code actually does it — the mechanism, with file references; every claim verified against the code, not recalled. **Then the probing questions below, every one, every time** | Claude (agents read, Claude verifies) |
| 3 | **Where it's recorded** | is it written down — where, and does the writing match the code? Is it tested — where, and does the test guard the mechanism or just the word? | Claude |
| 4 | **What we think of it** | *of the mechanism:* is this the right way, or merely the first way? What is the alternative, and why is or isn't it better? *of the record:* is it in the right home, at the right level, in plain words? | **both** — Claude brings the engineering view, the owner the product view |
| 5 | **The next step** | one of: **leave it** (solid) · **write it** (works, undocumented) · **guard it** (works, untested) · **decide it** (works, but never chosen — options to the owner) · **change it** (wrong) | Claude proposes, owner rules where it's a decision |

The three questions in §1 are the **exit checklist** — the walkthrough is how each row gets its
answers, and heading 4 is where a ✅ is earned rather than assumed.

### The probing PRINCIPLES — what makes a question find something *(owner's ask: "whatever meta-principles these are, fold them in")*

**P0 · Check against the GOAL, never against the incumbent** *(owner, 2026-09-05: "you don't
have to check in a way that's like — is what we did already good. Check if the goal is met, and if
everything needs to be reshuffled, that's okay.")* The question is "what should this be, and is it
that?" — not "is what exists defensible?". Sunk work carries no weight; a reshuffle verdict is a
legitimate outcome of any walkthrough.

The four questions that found four misses were not special. Each was an instance of a principle
that applies to every mechanism. **The principles are the process; the questions below are just
their current examples, and the examples grow.**

| principle | what it means | the miss it would have caught |
|---|---|---|
| **Enumerate, never sample.** | Whatever you named is a subset. List the whole set before judging any of it. | I named x and y and called it "the coordinate system." z was the third one. |
| **Trace a value to where it is consumed.** | A number is computed somewhere, stored somewhere, rendered somewhere. Check every boundary it crosses, not just where it is born. | Alignment computes fractions → stored as doubles → rendered at fractional pixels. Nobody looked past the first step. |
| **Check the seams with what is COMING, not only what exists.** | A mechanism is examined alone but will live among planned work. Hold it against every planned build. | The frame plan stores a rectangle on the plane; the owner ruled a frame is a kind of board. Two coordinate models, and the walkthrough never looked sideways. |
| **Push every variable to its extremes.** | Zero · absent · negative · huge · "a year of this." See what the code does there, not in the middle. | No bounds on position. A null position rendering at (40, 40). Unbounded z. |
| **Find the second copy.** | Wherever a rule is decided, ask who else decides it. Two copies drift; every "keep in sync" comment this week had failed. | *(The board pass: four placement-field lists, three definitions of "on which boards," two export-table lists.)* |

**How to use them:** under heading 2, after the mechanism is described, run each principle
against it deliberately — *what is the whole set · where does each value travel · which planned
build touches this · what happens at the extremes · who else decides this.* Then the questions
below as a checklist. **When a walkthrough misses something, name which principle would have
caught it — and if none would, that is a new principle, not a new question.**

### The probing questions — the current examples, asked of EVERY mechanism

*(Added 2026-09-04 after the first walkthrough. The owner asked whether a second look with
more guidelines would find more. It found four things in ten minutes. So the guidelines are
now written, and **this list grows every time a walkthrough misses something** — that is how
the pass converges on complete instead of hoping.)*

1. **What are ALL of its dimensions?** Not the obvious ones. *(The coordinate walkthrough said
   x and y, and forgot z — the third coordinate.)*
2. **What are the units, and the precision?** Integers or floats; what rounds; what accumulates.
3. **What are the bounds?** What happens at zero, at the extremes, at "a lot"?
4. **What can be absent?** Every nullable; what the app does when it is.
5. **How does it touch each piece of PLANNED work** — modes · the frame · compositions · the new
   bit types? *(The frame stores a rectangle on the plane; the owner ruled a frame is a kind of
   board. The coordinate walkthrough did not ask, and so did not find the conflict.)*
6. **What happens on two devices?**
7. **What happens at scale** — a thousand cards, a year of use?
8. **What is its inverse?** Undo, reverse, round-trip — does one exist, and does it exactly undo?
9. **Who else decides the same thing?** A second copy of the rule anywhere — the pattern behind
   most of this week's bugs.
10. **What did the last walkthrough miss** that applies here?

**The goal, stated honestly:** not *"find everything"* — that cannot be known. **The goal is: find
everything the list asks, and grow the list every time a miss surfaces.** A walkthrough is done
when every question has an answer; the *pass* is done when the list has stopped growing.

**Worked example first.** 🔵 Run the walkthrough on **the coordinate system** before running it
on anything else — it is the one that surfaced this pass, it sits under both modes and the
frame, and the facts are already in hand. The owner reads that one example and either the
template holds or it gets fixed before sixteen more are written.

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

---

## 5b · THE LEDGER — every action from every walkthrough, and where it stands

*How a finding becomes something done.* Each walkthrough's heading 5 produces actions. **They
are collected here, one row each, with status** — the same instrument as the board pass's
ledger, which worked. A finding that is not in this list is a finding that got lost. The exit
grid in §2 is updated from this list, never directly.

**✅ done · ⏳ in flight · ⬜ queued · ⚪ owner's call · 🧾 migration written + proven, awaiting the owner's paste**

| from | action | kind | status |
|---|---|---|---|
| §6.1 coordinates | one paragraph in `SPEC.md` §2z | write | ✅ |
| §6.1 coordinates | `screenToPlane` lifted into the pure module + 4 tests; a flipped sign proven red | guard | ✅ |
| §6.1 coordinates | **a position is always a whole point** — owner: *"I don't think the database should be allowing that"* | decide → change | 🧾 `20260904000001_position_not_null` proven; held with 005/006 |
| §6.1b coordinates | z is unbounded and never compacted — state it in `SPEC.md` §2z | write | ⬜ |
| §6.1b coordinates | 🔴 **the frame's coordinate model conflicts with today's "kind of board" ruling** | decide | ⚪ **owner** — see the decisions list |
| L4 rendering | **the universal card CONFIRMED by convergence** — a breaker over our code (yes-with-changes, high confidence; per-type spatial ownership "strictly worse") and a researcher over tldraw/Excalidraw/React Flow/Konva (pattern verified from their code, zero counterexamples), independent charges, same answer | verdict | ✅ 2026-09-05 |
| L4 rendering | **the card split, ruled before modes** (owner): shell stays · per-type capability table · one content component per type · union CardVM (forgotten renderer = compile error) · `cancel`/nodrag convention replaces per-element stopPropagation · chrome outside the frame's clip plane (the R5 handle-clipping catch) · click-grammar tests FIRST | decide → build | 🧾 queued as 2b (§4e-2); plan just-in-time at start |
| the queue itself | **antagonist review of the build order (owner-asked)**: 1→2b→3→4→5→6 SURVIVES; flaw found outside the list — no item 0 protecting the data (export links die in an hour, verified `route.ts:55` · originals discarded at intake, verified `media.ts` · restore never rehearsed) | verdict | ✅ 2026-09-05 |
| the queue itself | **item 0 the safety sitting + 0b keep-originals RULED; composition ping stays after six (owner overruled the after-2b recommendation — bandwidth); split step ⑥ → modes; item loop gains 5b adversarial check + full-suite/backup language** | decide | ✅ D-149 |
| L0/L4 finding | **how loading FAILS is unexamined** (owner spot-check 2026-09-05): the happy path is proven (board_cards view, two read paths written) — but what shows when the page fetch fails, a panel fetch fails, or one card's signed media URL dies is untested and partly unknown (the bit page has "couldn't load" fallbacks; on-canvas cards unverified) | flag | ⚪ ride-along or with 2b |
| F finding | **two devices moving the same card concurrently: ruled (last-write-wins) but never exercised** — the race probe covers referential clashes, not concurrent moves | flag | ⚪ with the A11 write-up |
| E finding | **search flagged inconsistent, and NO queue item ever reaches it** (fails silently — a miss just hides things). Ride-along candidate, unscheduled | flag | ⚪ **owner: when?** |

### The decisions list — everything waiting on the owner
*(collected from every walkthrough's ⚪ rows, so they can be ruled in one sitting)*

| from | decision | lean |
|---|---|---|
| §6.1 | ~~the null position~~ | ✅ **ruled**: not null |
| L4 | ~~universal card: keep or restructure?~~ | ✅ **RULED 2026-09-05**: keep the shell; split the insides (2b) BEFORE modes — two-agent convergence, D-148 |
| §6.1b | ~~What is a frame's coordinate space?~~ | ✅ **RULED (a), 2026-09-05.** Owner: *"a frame is a kind of board… fixed sizes, like 8½×11, A4, square, or a pixel size… you can zoom in but not infinitely — like what you can print out and see. No, a frame is not a rectangle drawn on a board. There's either an infinite canvas or a defined size."* → `old/frame-plan.md` must be re-cut before build: no `frame_x/y` on the plane; the frame *is* the plane, bounded. |

## 6 · The walkthroughs

*One per mechanism, five headings each, in the order: understand · judge · act. Every claim
under "Technically" was checked against the code before it was written.*

### 6.1 · The coordinate system *(the worked example — 2026-09-04)*

**1 · Conceptually**

A board is a flat plane with no edges. It has a fixed point of origin that never moves. Every
card has a position on that plane — a pair of numbers saying how far from the origin it sits.
When you pan, **you are moving a window across the plane; the plane and the cards stay still.**
When you zoom, the window gets bigger or smaller. So a card's position is a fact about *where it
is*, not about *where you happen to be looking* — the same number on your phone and your laptop.

There is one more thing the plane allows that nobody talks about: **a card can be on a board
with no position at all.** The rule is *both coordinates or neither* — never half a point.

**2 · Technically** *(verified)*

- The origin is `(0, 0)`. A fresh board's camera starts there at zoom 1 — `use-camera.ts:24`.
- A card's position is stored as absolute plane coordinates: `placement.x`, `placement.y`
  (`placement-fields.ts`). Both nullable; the database enforces *both or neither* —
  `placement_position_whole: (x is null) = (y is null)`, `init.sql:346`.
- The window is the **camera**: `{ x, y, scale }` — an offset and a zoom. Zoom is clamped to
  **0.2×–3×** (`use-camera.ts:6-7`).
- **Screen → plane:** `(clientX − boardLeft − camera.x) / scale` — `use-camera.ts:98`. Every
  tap, drop and create goes through this, so where your finger is becomes where on the plane.
- **The camera is remembered per board, per device**, in the browser's local storage under
  `board-camera:v1:<boardId>` — `camera-storage.ts:16`. **Not the raw offset**: it stores the
  plane point at the *centre* of your view plus the zoom (`Anchor = { cx, cy, scale }`), so the
  same spot stays centred if the window is resized. Never the database; never synced.
- **A card with no position** is rendered at `(40, 40)` — `page.tsx:57`, `r.x ?? 40`. Nothing in
  the app writes a null position today; every create path passes both coordinates.

**3 · Where it's recorded**

*Written down:* **nowhere.** Not `SPEC.md`, not `model.md`, not `invariants.md`. The facts above
exist only as comments in three files. A reader of the technical manual cannot learn that the
board has an origin, that positions are absolute, or that the camera is per-device.

*Tested:* **well, for what is tested.** `geometry.test.mjs` (22 tests) pins snapping and the
visual box; `camera-storage.test.mjs` (7) pins the anchor round-trip, the resize behaviour, the
zoom clamp, and storage failing safely. **Not tested:** `screenToWorld` itself — the one formula
everything else depends on has no direct test — and the null-position fallback.

**4 · What we think of it**

*Of the mechanism:*
- **Absolute origin is the right choice, not merely the first.** The alternative — positions
  relative to the first card, or to the content's bounds — makes every position change when
  that reference moves or is deleted. Every infinite canvas that lasts uses a fixed origin.
  **Chosen, in hindsight, correctly.**
- **Camera per device is right for one resident.** The alternative — syncing it through the
  database — means opening a board on your phone jumps you to wherever your laptop was looking,
  which is almost never what you want. **Chosen correctly; but it was never stated, and the
  share-sheet work will need to know it** (a phone arrival cannot land "where you were looking"
  on another device — the arrivals corner sidesteps this).
- **The centre-anchor for memory is better than it needed to be** — it survives a window resize.
  Good.
- ⚠ **The null position is a state the schema permits and the app never creates.** It was
  designed for an earlier "collection mode" (§2c of the old model) that was never built. Today
  it is a latent path: if anything ever wrote a null position — a migration, a future feature —
  every such card would land at `(40, 40)` and stack there. *Either it is a real future state and
  its rendering rule should be decided, or it is vestigial and the constraint should become
  `not null`.* **A decision, not a bug.**
- ⚠ **`screenToWorld` has no direct test.** It is one line and it is right — but it is the line
  every position passes through, and a wrong sign in it would move every card.

*Of the record:* there is none to judge. The comments are good; they are just not where anyone
would look.

**5 · The next step**

| | |
|---|---|
| **write it** | one paragraph in `SPEC.md` (the plane, the origin, absolute positions, the camera as a window, per-device memory) — the §1 text above, tightened |
| **guard it** | a direct test on `screenToWorld` (round-trip with `worldToScreen`; zoom 0.2, 1, 3; a non-zero offset) |
| **decide it** | ⚪ **the null position** — future state, or vestigial? Owner's call; 🔵 lean vestigial → `not null` |
| leave it | the origin · the camera design · per-device memory — solid |

**Verdict on the mechanism: right. Verdict on the record: absent.** Cost to fix: one paragraph,
one test, one decision.

#### 6.1b · The second look *(after the owner asked "did you find everything?")*

Four more, from the probing questions:

- **z — the third coordinate — was never mentioned.** Stacking order: `nextZ` = highest + 1 on
  every click-to-front, `backZ` = lowest − 1. **Never compacted**: an `int` that grows by one
  per raise, forever. Practically unbounded for one person (2 billion raises), but nothing
  says so, and it is part of "where a card is."
- **Precision.** Alignment produces fractions (`(minX + maxX) / 2`); positions are doubles;
  cards render at fractional pixels. ⚪ Whether that blurs text edges is a browser question —
  worth one look on a real screen, not a decision.
- 🔴 **The frame conflicts with today's ruling, and this walkthrough should have caught it.**
  `old/frame-plan.md` stores a frame as **a rectangle on the plane** (`frame_x/y/w/h` on `board`).
  The owner ruled today that **a frame is a kind of board chosen at creation** — not a rectangle
  on a canvas. Those are different coordinate models: in the plan, a frame has a position on an
  infinite plane; in the ruling, a frame *is* the whole bounded space. **Probing question 5
  exists because of this miss.** → the ledger, as a decision.
- **Bounds.** None. A card can be at x = 10¹⁵ and the plane will hold it; fit-to-view will
  still find it. Irrelevant for one person; now stated rather than unexamined.
