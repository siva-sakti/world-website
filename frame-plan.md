# The frame — plan

**Status:** planned → owner ruled → **antagonist: "build with changes" (14 items folded,
2026-09-01 — the CHECK constraint WRITTEN AND PROVEN on a throwaway PG17, including the NaN
hole it found; the schema half survived every attack; the rendering claim corrected)** → build. Born from the owner's
reference screenshots (2026-09-01): the artist composes on a *page*; the owner wants that
available "without forcing everything into one thing." Filed concept: `organize-phase-plan.md`.
**Standing limits:** the migration is owner-pasted · migration before deploy · owner-gated.

---

## 1 · High-level, plainly

A board stays the free, infinite canvas it is. The frame is an **optional fixture you can
summon onto it**: a page-shaped rectangle sitting in the world, giving a composition *edges to
compose against* — the thing the reference artist has and an infinite canvas deliberately
lacks. Cards drift in and out of it freely. Nothing is ever "in" the frame in the model's
sense — no membership, no containment, no second home. It is **pure arrangement furniture**,
the same species as a shelf group ("arrangement, not knowledge" — the ruled precedent), and
its whole meaning is geometric.

What it's FOR, in order of arrival:
1. **Now:** a bounded composition to work toward — the mood-board-as-artifact feeling.
2. **With the guides (same machinery):** the frame's edges and center join the snap
   candidates — cards align to the *page*, not just to each other.
3. **Someday (the sharing phase):** the natural boundary for EXPORTING a board as a finished
   image. Named, not built.

## 2 · The model ruling this plan proposes (for the owner to bless)

**A frame is not a thing (bit), not meaning (tag), not membership (placement).** It is a
property of one board's arrangement — four numbers. Therefore:
- **No new table.** Four nullable columns on `board`: `frame_x/frame_y/frame_w/frame_h`
  (double precision — they map 1:1 onto geometry.ts's `Box`, so the snap spread is literal).
  **The CHECKs, antagonist-written and PROVEN on a throwaway PG17** (all-or-none via
  `num_nulls` — integer result, no NULL-comparison pitfall; positivity with the NaN/Infinity
  guard, since Postgres orders NaN above everything and `'NaN' > 0` is TRUE):
  ```sql
  constraint board_frame_all_or_none check (num_nulls(frame_x, frame_y, frame_w, frame_h) in (0, 4)),
  constraint board_frame_positive    check (
    (frame_w is null or (frame_w > 0 and frame_w < 'Infinity'::float8)) and
    (frame_h is null or (frame_h > 0 and frame_h < 'Infinity'::float8)))
  ```
  x/y stay signed (world coords). Null = no frame. Additive, no backfill, instant.
- **The `home` view stays frozen, deliberately** (the lock/description precedent, stated in the
  migration comment): the board page reads the TABLE (`getBoard` select *), so the frame reaches
  its surface; `home` doesn't need it. **Type honesty:** the frame fields stay OFF `HomeBoard`
  (Omit or a separate type at build) — the standing `description` type-lie is not extended.
- **Export · RLS · search · marquee · graph · trash/archive: ZERO edits** — all verified riders
  (export selects *, policies are row-level, search_tsv is title-only generated).
- **One frame per board in v1** (owner question §5). Several frames = artboards = a different
  product; if ever wanted, it's additive (a `frame` table) with zero rework — the door is
  named, not built.
- **Removing the frame touches nothing else** — cards keep their positions; it was only ever
  furniture.
- **Duplicate-board copies the frame** (a second arrangement of the same material includes its
  page — the copy loop must include the new columns; named so it can't be missed).

## 3 · The specs

### Rendering — TWO layers (the antagonist's F1: one layer cannot be both under the cards and clickable)
- **The paper**: first child of the world layer at an explicit FLOOR z (below `backZ`'s
  reachable range — send-to-back mints negative z's, and inside the transformed world's
  stacking context a z-auto div would paint ABOVE them). `#fffdfa` + hairline + faint shadow —
  the cards' own paper against the `#faf8f3` ground (the "paper-white on paper" contrast is
  carried by the border+shadow, same as every card; feel-tune confirms).
- **The chrome**: the label tab + resize handles render AFTER the cards at a z above
  `nextZ(cards)` — the honest claim replacing the false one: *only the tab and handle rects —
  a few hundred px² — sit above cards*; the paper steals nothing.

### Interaction — the one decision everything hangs on
**The frame's body is pointer-transparent.** Panning, marquee, double-tap-create, card drags —
all pass straight through it as if it weren't there. Only its **label tab and edges** are
grabbable:
- click the label → the frame selects (its own resize handles appear, the same enlarged-hit
  handle style cards use);
- drag the label → move the frame; drag a handle → resize;
- Escape / click elsewhere → deselect.
This keeps every existing gesture untouched — the frame can never steal a click a card or the
canvas owns today.

### Acts (undo — the layer built for exactly this)
`add frame` · `move frame` · `resize frame` · `remove frame` — recorded with the exact shape
`record("move frame", [], () => applyFrame(before), () => applyFrame(after), inFlightWrite)`:
- **`bitIds: []` is verified-safe** (stored, read by nothing — stated so nobody "fixes" it);
- **the `settled` 5th argument is REQUIRED** (↶ 200ms after "remove frame" must wait for the
  write — the stack's D6 machinery, reused);
- `applyFrame`'s 0-row assert says **"that board no longer exists"** (classifies terminal —
  a destroyed board must not loop "try again");
- **keyboard parity:** a selected frame joins the Escape rung (deselect) and Delete
  (= remove frame, recorded) — the keys hook gains a frame-selection guard before the
  selectedCount return.

### Persistence
Frame writes are RARE and SMALL (one rect): write on gesture-end via one new db fn
`setBoardFrame(supabase, boardId, frame|null)`, 0-row-asserted ("that board no longer
exists"). No placement-chain interaction. **Two named consequences (antagonist):**
- a frame write registers in the duplicate-await set (the hunt-#9 shape) — ⧉ mid-frame-drag
  must not copy the pre-drag rect;
- **every frame move bumps the board's `updated_at` → home's touched_at re-sorts. RULED
  ACCEPTED:** moving furniture IS an edit — exactly as card moves already bump it. Consistent,
  chosen, not accidental.
**duplicateBoard: TWO hand-written lists** (the select at boards.ts:44 AND the insert at :52)
each gain the four columns — there is no column loop; the frame is silently dropped today.
Proof of the copy = the stage browser truth-check (the SQL harness can't run TypeScript).

### Snap integration (lands with/after the guides)
The frame contributes candidates exactly like a card box: left · centerX · right · top ·
centerY · bottom, through the SAME `snapTo` (its box appended to `others`). Cards snap to the
page; the page itself does NOT snap to cards in v1 (the frame is the reference, not a
follower). Margins as candidates: later, only if the owner wants a margin ruling.

### Fit + camera
`fitView(cards, extra?: Box | null)` — the frame unions in; **three guards change, not one**
(fitView's empty-return, board-surface's mount early-return, and the phone branch's
`initialCards[0]` — each becomes `…&& !frame`). **Sequencing rule: registry stage 3 rewires
fitView FIRST** (both plans touch it — ordered, no merge fight). Camera memory unchanged.
**Summon size**: derived from the VIEWPORT (a portrait rect ~70% of the visible height at the
current zoom, centered) — a fixed page at 100% zoom could summon mostly off-screen.
**The toolbar door is a toggle**: "+ frame" ⇄ "remove frame" (one per board — a second press
must never silently overwrite the rect).
**findClearSpot ignores the frame** — new cards may land on the page. Consistent with "cards
drift freely"; stated, not discovered.

## 4 · The cases

| case | behavior |
|---|---|
| summon on a board with cards | appears centered in the CURRENT view at the default size, under the cards |
| summon on an empty board | same; fit now frames the page |
| move/resize the frame | by its label/handles only; records in undo; snap candidates update (it's just a box) |
| remove the frame | cards untouched; records in undo (undo restores the exact rect) |
| cards half-in / half-out | fine — in/out is only geometry; nothing is stored about it |
| double-tap ON the frame | creates a card there (body is pointer-transparent) |
| marquee across the frame | selects cards as today (transparent body) |
| duplicate the board | the frame copies with it |
| trash/archive/restore the board | the frame rides the board row — nothing extra |
| board on a phone | the label tab is a normal touch target |
| zoom | the frame is world geometry — scales like everything |
| two tabs | last-writer-wins on the board row, like every board field today |
| undo add-frame after moving it | entries reverse in order: move reverses, then add reverses (frame leaves) |
| guides off (pre-stage-4) | the frame still works — it's furniture first, snap-source second |

## 5 · The owner's rulings (2026-09-01)

1. **ONE frame per board** — ruled. Several = additive later, door named.
2. **Size: sensible default + freeform** (Claude's default after the owner's clarifying
   question, overridable at the feel-tune; presets join later only if wanted).
3. **The word: "frame"** — ruled.
4. **The look: paper-white fill** — ruled now, sight-unseen.

**The understanding the owner confirmed before ruling (recorded because it's load-bearing):**
there are NOT two canvases or modes. One canvas; the snap guides work everywhere card-to-card
with no frame; the frame is optional furniture whose edges merely JOIN the snap candidates.
A true GRID (repeating mesh, snap-to-grid) is a separate, unspecced feature — the owner
mentioned the word; filed as an open offer, not built, not implied by this plan.

## 6 · Stages & proof

0. Antagonist reads THIS plan.
1. The migration (columns + CHECK), throwaway-proven (`run-frame-native.sh` pattern: all
   migrations + refusal proofs: partial-null refused · non-positive refused · duplicate-board
   copies the frame) → **owner pastes to cloud** → then app code (migration-before-deploy).
2. `setBoardFrame` db fn + the frame render (paper under cards, label tab) + summon/remove —
   behind the toolbar door; acts recorded.
3. Move/resize by label/handles + undo entries + fitView inclusion.
4. Snap candidates join `snapTo` (one line once the guides exist).
5. Browser truth-check each stage (incl. duplicate-copies-the-frame and send-to-back-stays-
   above-the-paper); the owner's feel-tune closes it (look · default size).
6. **The record stage (CLAUDE.md step 9):** lexicon gains **frame** (noting the two internal
   code uses of the word — the selection outline and fitView's "frame in view" verb — renamed
   or disambiguated in comments at build) · invariants gains the two CHECKs · model.md gains
   the furniture line · the D-entry ships with the feature.

## 7 · Adjacency, restated

Runs NEAR the other window's composition thread (notes as composition surfaces). A framed
board is board-territory: the frame holds nothing, converts nothing, and creates no second
composition model. Flagged so the windows never drift; if the other window's ruling lands a
"page" concept for notes, the WORDS must be reconciled (lexicon, same pass).
