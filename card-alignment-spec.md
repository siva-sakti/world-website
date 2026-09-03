# Card alignment — the spec

**Name: CARD ALIGNMENT** (owner, 2026-09-02: *"maybe call it board bit alignment or something"*).

Sharpened against `lexicon.md`, which is the naming authority: **the thing on a board is a CARD,
not a bit** — *"card — a bit's visual box on a board (draggable, resizable)"*. A bit exists whether
or not any board shows it; a card is the box you actually drag. So what gets lined up is cards.

Rejected along the way, with reasons, so the question is not reopened from scratch:
- **"alignment"** alone — the owner's objection stands: *"alignment can be so many things."*
- **"grid alignment"** — four of the five pieces are not a grid, and the guides were ruled *"a
  whisper, never a grid"*; naming the family after its least-used member deepens the confusion.
- **"bit alignment"** — lexically wrong: bits are not what sits on a board.

**Status: 🟡 SPEC — definition, success criteria and cases. The technical plan is §8, and it is
to be independently checked before any code**, at the owner's instruction: *"write it all out and
then use that to plan, and do the technical plan, check that plan, and then build."*

---

## 1 · What this is, in one line

Everything that helps things sit straight on a board — whether the app does it for you, or your
own hand does it with help.

---

## 2 · The five pieces, defined precisely

### 2.1 · Tidy up — ✅ BUILT, not being changed
Rearranges a selection into a uniform grid, anchored at the selection's own top-left, cells sized
to the largest card, in reading order (rows banded at 40px, left-to-right within a row).
**Owner ruled 2026-09-02: stays exactly as built, not extended** — align buttons cover what she
actually wanted from it, without needing a reading order at all.

### 2.2 · Alignment guides — ✅ BUILT AND SHIPPED (2026-09-02; see §12)
While you drag **one** card, **at most ONE** thin magenta line per axis appears — the nearest
alignment of an edge or centre of it to an edge or centre of another card, within a small
distance. (`SnapResult` carries one guide per axis; "wherever" was wrong in the first draft.) On release the card lands exactly
on that alignment. Lines vanish on release. Each card offers 3 lines per axis: **near edge ·
centre · far edge**. Axes are decided independently. Nearest candidate wins; ties keep the first.

### 2.3 · Align & distribute — ✅ BUILT AND SHIPPED (2026-09-02; see §12)
Buttons acting on a selection of 2+ cards.
**Align:** left · horizontal centre · right · top · vertical middle · bottom.
**Distribute:** horizontally · vertically — equal gaps between adjacent cards.
No dragging, no grid, no reading order. Cards move to match *each other*.

### 2.4 · The background grid — NOT BUILT (the owner's addition)
**A toggle** (owner-ruled 2026-09-02: *"background grid should be a toggle… I was just thinking
it comes with the set of this type of work"*). When on, a faint lattice is drawn on the board's
ground, and a dragged card can settle onto it. **Off by default.** Visible ⇒ it snaps; hidden ⇒
it does not (a visible grid that ignores you is decoration; an invisible one that pulls is spooky).

⚠ **It cannot be drawn on the world layer.** `.compose-world` (`globals.css:54-59`) is
`position:absolute` with **no width or height** — every card inside is absolutely positioned — so
it is a 0×0 box and a background on it paints nothing. The grid goes on `.compose-board` in SCREEN
space: spacing × `cam.scale`, phase from `cam.x`/`cam.y`.

### 2.5 · Ruler guides — NOT PROPOSED
Lines you drag out and place yourself, persisting until removed. Named only so the family is
complete and nobody re-discovers the gap as an oversight. **Not in scope.**

---

## 3 · SUCCESS CRITERIA — how we know each piece works

Each is a statement that is either true or false on a real board. "It feels nice" is not here;
feel is §7.

**Guides — drawing (step 1)**
- G1 Dragging a card whose left edge comes within ~6 screen px of another card's left edge shows
  ONE vertical magenta line at that position.
- G2 The line extends past **both** cards (24 world px each end), so what it aligns to is visible.
- G3 Dragging with nothing in range shows no line.
- G4 The line disappears on release, always — including a release outside the window.
- G5 Both a vertical and a horizontal line can show at once, from **different** neighbours.
- G6 Lines pan and zoom with the board; they never float over the screen.
- G7 Dragging at 0.2× and at 3× zoom triggers a line at the same *apparent* distance.
- G8 A single-card drag still causes **zero React re-renders** (it does today; it must stay so).

**Guides — snapping (step 2)**
- S1 On release, the card's RENDERED edge lands exactly on the neighbour's — not within a pixel.
  Checked by comparing rendered edges, NOT stored numbers: only a near-edge snap stores the
  neighbour's own value (a centre snap stores `edge - w/2`, a far edge `edge - w`), and a text
  card's snapped y derives from a measured auto-height that is never stored at all.
- S2 Holding Alt through the release: no line shown, raw drop position stored.
- S3 The drag records **one** undo entry; undo returns the card to where it was **before the
  drag** (not to the un-snapped drop).
- S4 Nothing snaps that was not hand-dragged: arrow nudges, tidy, align, file drops, call-in,
  undo/redo all place exactly where they intend.
- S5 A locked card can be snapped **to**, and never snapped **by** (it cannot be dragged at all).

**Guides — group drags (step 3)**
- P1 The card under the hand generates the candidates; **every** selected card moves by that same
  delta, so relative positions are preserved exactly.
- P2 One undo entry for the whole gesture; undo restores every card.
- P3 A locked card inside the selection does not move (it is excluded from group drags today).

**Align & distribute (step 4)**
- A1 After "align left" on 3 cards, all three report an identical x.
- A2 "Align horizontal centre" matches centres, so differently-sized cards are centred on each
  other — not left-matched.
- A3 Distribute makes the **gaps** equal, not the positions; the outermost two cards do not move.
- A4 One undo entry restores every card the button moved.
- A5 Buttons are unavailable with fewer than 2 selected (distribute: fewer than 3).
- A6 Locked cards are excluded, and the buttons still work on the rest.

**The grid (step 5, only if built)**
- R1 Off by default; the toggle persists across a reload.
- R2 With the grid ON and no card in range, a dropped card's position is an exact multiple of the
  spacing from the board's origin.
- R3 With the grid ON and a card in range, **the card wins** (§4) — the grid does not claim that axis.
- R4 With the grid OFF, behaviour is bit-for-bit what it was before the grid existed.
- R5 Below the hide-threshold zoom, the grid is neither drawn nor snapped to.

---

## 4 · Precedence — what wins when two things claim the same drop

**The obvious answer is wrong.** "Nearest wins" fails: at any sane spacing a grid line is
*always* within threshold, so the grid would swallow card-to-card alignment and the guides would
never be seen again.

**The rule: cards beat the grid, per axis, independently.**
1. Horizontal: a card alignment in range takes it. Else, grid if on. Else, the hand's position.
2. Vertical: decided separately, the same way.

So card-aligned left + grid-aligned top is a normal outcome. The grid fills in where the cards
are silent; it never replaces them.

---

## 4b · The three rules the review forced (each would have shipped a bug)

- **A CLICK IS NOT A DRAG.** react-draggable has no movement threshold — it fires drag-stop on
  every mouseup, which is exactly why `use-arrange-acts.ts:79` already carries *"a click, not a
  move"*. Without a guard, merely SELECTING a card that sits 4px off a neighbour would teleport it
  and push a real undo entry. **The snap is gated on a moved-flag set in the drag-move handler.**
  It would have shipped as "cards jump when I click them".
- **The candidate list excludes the dragged card AND every other selected card.** The dragged card
  would otherwise align to itself (delta 0, guide always drawn). Worse: in a GROUP drag the
  followers hold a *constant* offset to the dragged card for the whole gesture, so if one sits
  within threshold it snaps on every frame and the group acquires a permanent 1–6px shift —
  breaking P1's "relative positions preserved exactly".
- **The candidate list is built ONCE at drag start, and culled to what is on screen.** Nothing else
  moves during a single-card drag, so rebuilding it per frame is wasted work — and an unculled
  neighbour 8000px away can win and draw a guide to nothing.

## 5 · The cases

| Situation | What happens |
|---|---|
| drag, nothing near | no line, no snap |
| drag near one card's left edge | vertical line; edge-matched on release |
| drag near one card horizontally, another vertically | two lines, two neighbours, both snap |
| drag with Alt held | no line, no snap |
| drag a group | hand's card finds it; whole selection moves by that delta |
| drag near a locked card | snaps to it |
| drag a captioned image | aligns the **picture**, not the caption below it — flagged for feel-tune |
| grid on, nothing near | grid claims the axis |
| grid on, a card near | card wins; grid silent on that axis |
| grid on, zoomed far out | grid hidden and inert |
| grid off | exactly today's behaviour |
| arrow-key nudge | never snaps |
| tidy / align buttons | never snap |
| align with 1 card selected | buttons unavailable |
| distribute with 2 cards | unavailable (nothing to distribute between) |
| align a selection containing a locked card | the locked one holds still; the rest align |
| undo after a snap | back to the pre-drag position, one step |

---

## 6 · The honest limits — said before building

- **The card will not stick to a line while you drag.** The line shows live; the card settles on
  release. react-rnd ignores position changes mid-drag (traced through its source). Magnetic pull
  requires the ruled input-engine work; this is not it.
- **No live equal-gap guides** (the "spacing hints" some tools show). Distribute is a button.
- **Rotation is a separate feature, not this one.** This spec's alignment/guides work does not
  rotate a card — that's `rotation-plan.md`. The two are linked by one ruling
  (`organize-phase-plan.md` §4g, 2026-09-02): **a rotated card opts OUT of alignment**, the same
  rule locked cards already follow, so `snapTo` never has to reason about rotated boxes and the
  two features can land in either order without either being reworked.
- **No ruler guides** (§2.5).

---

## 7 · Feel — the owner's, at the end, on a live board

Not decidable in advance, and not Claude's: the exact magenta against the paper ground · how
strong the pull is (~6 screen px is a starting guess) · the grid's spacing and faintness · whether
the caption rule in §5 reads right.

---

## 8 · THE TECHNICAL PLAN — ⚠️ HISTORICAL. Written before the build and left as written, so the plan can be compared with what shipped. **§12 is the live status; this section is not.**

**8.1 · What existed AT PLANNING TIME.** `snapTo(dragged, others, threshold)` in `geometry.ts` — pure, 7 tests, **no caller**. *(It has callers now — `board-surface.tsx` computes it per drag frame and at the drop.)* The size ledger (`use-geometry`) gives live true sizes. `card.tsx:184` reports live
drag coords; `card.tsx:185-188` reports the drop.

**8.2 · The ordering constraint.** `card.tsx:186` writes the RAW drop (`onChange({x,y},"move")`)
and only then calls `onDragEnd`. A snap must land **before both**, or the saved position and the
undo entry record the un-snapped truth. → Card gains one prop, `snapDrop?: (x,y) => {x,y}`,
supplied by the board (which owns the ledger, the card list and the camera). Card stays dumb.

**8.3 · Steps, each gated and committed alone.**
1. **Draw only.** A ref'd overlay in the world layer. On each `onDragMove`, the board computes
   `snapTo` and mutates the overlay **imperatively** — G8 forbids a re-render per frame.
2. **Snap on release.** `snapDrop` in `onDragStop`; threshold = screen px ÷ `cam.scale`; Alt refuses.
3. **Group drags.** Candidates from the dragged card; whole selection moves by the delta.
4. **Align & distribute.** Pure functions in `board-arrange.ts` + tests; one undo entry, the shape
   `recordTidy` already uses; controls on the multi-select toolbar.
5. **The grid.** Repeating CSS gradient on the world layer; toggle persisted via `writeLocal`;
   precedence per §4.

**8.4 · What Claude verifies rather than assumes.** That a CSS gradient grid scales correctly
under the existing world transform · the zoom at which the grid stops being legible · that the
imperative overlay really does avoid re-renders · where the align controls fit in the toolbar ·
that `recordMove`'s `after` is the snapped value (so undo is honest).

**8.5 · Risks.** Guides are additive and off the persistence path — low. The snap writes a
position, so it touches the same door every move already uses — medium, covered by S1–S5. The
grid is a new stored preference — low. **Nothing here changes the schema.**

---

## 9 · The plan review (independent, 2026-09-02)

The plan went to an adversarial reviewer BEFORE any code, per the owner's sequence. **The maths
and the drag-ordering claim in §8.2 came back sound.** Everything below was wrong or missing.
The three that would have produced wrong stored data are folded into §2.4 and §4b; two of them
were verified by hand before being accepted.

**Verified, and would have shipped as bugs:**
1. **A click would move a card** ✓ verified against `use-arrange-acts.ts:79`.
2. **Group drags would acquire a permanent drift** — followers hold a constant offset.
3. **The grid step was a no-op** ✓ verified against `globals.css:54-59` — a 0×0 box.

**Corrections folded in without ceremony:** `snapDrop` must receive the event to read Alt — and a
touch release carries no Alt at all, so **S2 is mouse-only** · `EXTEND` is a hardcoded WORLD
constant, so the guide's overshoot shrinks to ~5 screen px at 0.2× zoom, exactly where it is most
needed → parameterise it, default preserved so the committed test still passes · use `camRef`, not
`cam`, on the per-frame path (board-surface deliberately does not re-render during a drag — that
is G8 — so the state value is stale) · `touchcancel` fires no drag-stop, so the overlay must be
hidden explicitly rather than trusted (G4's "always" had a hole) · the overlay must be permanently
mounted and toggled via `el.style`/`el.hidden`, because deriving its visibility from React state
kills G8 · the align controls belong in `board-toolbar.tsx`'s `selectedCount > 1` cluster, not
`SelectedBar`, which only renders for a SINGLE selection · resize does not snap — now stated in §6
rather than left unsaid.

**THE SEQUENCING WAS WRONG, and is changed.** Align & distribute moves to **FIRST**: pure
functions, ledger-only, reusing `recordTidy`'s proven shape, touching nothing in the drag path —
and §2.1 records the owner saying it is what she actually wanted from tidy. The two guide steps
**merge**: "draw only" is a fine commit boundary but a bad release boundary, because a line that
promises an alignment and then drops the card somewhere else is worse than no line at all.

**Revised order:** ① align & distribute → ② guides (draw + snap together) → ③ group drags → ④ the grid.

## 10 · The review's open questions — RULED by the owner (2026-09-02)

- **10.1 Locked cards and align — RULED: a card must be unlocked to align.**
  *"I guess the card with the anchor — but if not too complicated we just say that cards have to be
  unlocked to align. I feel like that's not super annoying to a user."* Taken as: a locked card is
  **excluded entirely** — it does not move, and it is not part of the target calculation; the
  unlocked cards align among themselves. **This matches TIDY exactly**, which already filters
  `!c.locked` before doing anything (`board-surface.tsx` tidySelected), so it is the app's existing
  precedent rather than a new rule to learn. Distribute: same — locked cards are not endpoints.
- **10.2 The grid toggle's scope — RULED: per board.**
- **10.3 The grid's first paint** — still open, but only reachable once the grid is built (step ④).
- **10.4 The selection-chrome problem — RULED: align the RESTING box. ⚠ NOT YET IMPLEMENTED.**
  Step ② ships using the MEASURED box, and this is stated rather than glossed. The ledger
  observes one element per card (`.compose-card-inner`), and the selection controls live inside
  it, so a resting measurement needs either a second observed element or a chrome-height read —
  a real change to the geometry registry, which four other consumers depend on. Deliberately not
  bundled into the guides.
  **What it means in practice:** only the dragged card is inflated, only VERTICALLY (the controls
  are full-width, so widths are unaffected), and only its middle and bottom lines — its top edge
  is the anchor and is exact. So left/right/centre alignment is already correct; bottom alignment
  of a dragged card can sit a few tens of px out and settles differently once deselected.
  **Deliberately left for the owner to feel before it is engineered** — the honest reason being
  that nobody has yet seen how much it matters, and building the correction first would be
  guessing at its size.
  The ruling and the reasoning, kept:
  *"The resting box, I guess that's actually what you see."* Exactly the reason. "Chrome" was
  Claude's jargon for the controls that appear AROUND a card's content when you select it — a title
  field above, the "from …" source picker below (`card.tsx`: both are gated on `selected`). Neither
  is content; both add height. So a selected card is genuinely taller than the same card at rest,
  and the dragged card is always selected while its neighbours usually are not. Aligning the
  inflated box would look right during the drag and visibly break the moment you clicked away.

## 11 · Build order, gates unchanged

**① align & distribute → ② guides (draw + snap together) → ③ group drags → ④ the grid.**

Nothing now blocks ①: it is pure functions over the ledger, locked cards are excluded exactly as
tidy already excludes them, and it never touches the drag path.

---

## 12 · WHERE IT STANDS (2026-09-02, owner-verified)

**Shipped and confirmed working by the owner:**
- ✅ **Align & distribute** — "line up" (left · centre · right · top · middle · bottom) and
  "even gaps" (across · down). *Two bugs found by the owner and fixed: the buttons read a stale
  snapshot of card positions, so a second press calculated from where cards used to be ("have to
  click first" was the tell); and a legitimate no-op was silent, which is indistinguishable from
  broken — it now says "already lined up".*
- ✅ **The guides** — magenta lines during a drag, card lands aligned on release.
  *Owner: "the lines are coming up!"* Two of my own wiring bugs first: mounted OUTSIDE the world
  layer while positioned in world coordinates (drawn off in the void, and my own comment claimed
  otherwise), and a z-index below the cards, which paint over anything low on a used board.

**Owner's verdict: *"they are not perfect… but I wonder if we get to the other things and refine
this later? It seems functional enough for right now."* → REFINEMENT DEFERRED, deliberately.**
What "not perfect" means is not yet specified — worth capturing the next time she uses it, because
in two weeks neither of us will remember.

**Outstanding, in the order it would be picked up:**
1. **The feel-tune** (§7) — the exact magenta against the paper ground, and how strong the pull is
   (~6 screen px was a starting guess, never tuned). Both are one-line changes.
2. **The resting-box refinement** (§10.4) — ruled by the owner, NOT implemented. Predicted symptom:
   *bottom* alignment of the dragged card sits a little out and settles differently once deselected;
   left/right/centre are already exact. **If that is what "not perfect" means, this is the fix** —
   worth checking before it is engineered.
3. **Step ③ group drags** — the guides currently serve single-card drags; a group drag does not yet
   snap. Nothing is broken, it simply does not participate.
4. **Step ④ the background grid** — the owner's toggle, per board, off by default. Not started.
   §2.4 already records that it must be drawn in SCREEN space; the world layer is a 0×0 box.

**The limit that is not a bug and will not change here:** the card does not stick to the line while
you drag — the line shows live, the card settles on release. That waits for the ruled input engine.
