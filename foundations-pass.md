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
| the coordinate system | a plane with a fixed origin; panning moves your window | `geometry.ts` · `use-camera.ts` | ❌ unwritten, unchosen |
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
| 2 | **Technically** | how the code actually does it — the mechanism, with file references; every claim verified against the code, not recalled | Claude (agents read, Claude verifies) |
| 3 | **Where it's recorded** | is it written down — where, and does the writing match the code? Is it tested — where, and does the test guard the mechanism or just the word? | Claude |
| 4 | **What we think of it** | *of the mechanism:* is this the right way, or merely the first way? What is the alternative, and why is or isn't it better? *of the record:* is it in the right home, at the right level, in plain words? | **both** — Claude brings the engineering view, the owner the product view |
| 5 | **The next step** | one of: **leave it** (solid) · **write it** (works, undocumented) · **guard it** (works, untested) · **decide it** (works, but never chosen — options to the owner) · **change it** (wrong) | Claude proposes, owner rules where it's a decision |

The three questions in §1 are the **exit checklist** — the walkthrough is how each row gets its
answers, and heading 4 is where a ✅ is earned rather than assumed.

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
