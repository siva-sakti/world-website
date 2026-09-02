# The frame — plan

**Status:** planned → antagonist → the owner's rulings → build. Born from the owner's
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
  (double precision, matching placement's coordinate space), with an all-or-none CHECK and
  `frame_w > 0 AND frame_h > 0` when set. Null = no frame. The migration is tiny, additive,
  throwaway-proven, owner-pasted.
- **One frame per board in v1** (owner question §5). Several frames = artboards = a different
  product; if ever wanted, it's additive (a `frame` table) with zero rework — the door is
  named, not built.
- **Removing the frame touches nothing else** — cards keep their positions; it was only ever
  furniture.
- **Duplicate-board copies the frame** (a second arrangement of the same material includes its
  page — the copy loop must include the new columns; named so it can't be missed).

## 3 · The specs

### Rendering
- Drawn in the WORLD layer, **under every card**: a paper-white rectangle with a hairline
  border and the faintest shadow — a page lying on the canvas ground. (Visual candidates for
  the owner's feel-tune: filled paper vs outline-only.)
- A small **label tab** at its top-left corner (placeholder word "frame" — the owner writes
  the voice, §5).

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
`add frame` · `move frame` · `resize frame` · `remove frame` — all deliberate, all recorded,
all reversible through the existing stack (before-values captured at gesture start, the same
shape as card acts). The first proof of "future acts inherit undo for free."

### Persistence
Frame writes are RARE and SMALL (one rect): write on gesture-end (no debounce machinery —
a plain board-row update through one new db fn `setBoardFrame(supabase, boardId, frame|null)`,
0-row-asserted). No interaction with the placement chains — different table, different row.

### Snap integration (lands with/after the guides)
The frame contributes candidates exactly like a card box: left · centerX · right · top ·
centerY · bottom, through the SAME `snapTo` (its box appended to `others`). Cards snap to the
page; the page itself does NOT snap to cards in v1 (the frame is the reference, not a
follower). Margins as candidates: later, only if the owner wants a margin ruling.

### Fit + camera
`fitView` includes the frame's box in its bounds (an empty board with a frame fits the page —
never a blank void). Camera memory unchanged.

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
5. Browser truth-check each stage; the owner's feel-tune closes it (look · default size · word).

## 7 · Adjacency, restated

Runs NEAR the other window's composition thread (notes as composition surfaces). A framed
board is board-territory: the frame holds nothing, converts nothing, and creates no second
composition model. Flagged so the windows never drift; if the other window's ruling lands a
"page" concept for notes, the WORDS must be reconciled (lexicon, same pass).
