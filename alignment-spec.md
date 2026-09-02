# Lining up — the spec

**Working name: "lining up."** ⚪ *Owner's call — `lexicon.md` is the naming authority.* The owner
asked for something more specific than "alignment" (*"alignment can be so many things"*) and
offered "grid alignment"; that is not proposed, because **four of the five pieces are not a grid**
and the guides were explicitly ruled *"a whisper, never a grid."* Naming the family after its
least-used member would deepen the confusion it is meant to fix. Seeds offered: **lining up** ·
straightening · guides & grid.

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

### 2.2 · Alignment guides — maths built + tested, UNWIRED
While you drag **one** card, thin magenta lines appear wherever an edge or centre of it comes
within a small distance of an edge or centre of any other card. On release the card lands exactly
on that alignment. Lines vanish on release. Each card offers 3 lines per axis: **near edge ·
centre · far edge**. Axes are decided independently. Nearest candidate wins; ties keep the first.

### 2.3 · Align & distribute — NOT BUILT
Buttons acting on a selection of 2+ cards.
**Align:** left · horizontal centre · right · top · vertical middle · bottom.
**Distribute:** horizontally · vertically — equal gaps between adjacent cards.
No dragging, no grid, no reading order. Cards move to match *each other*.

### 2.4 · The background grid — NOT BUILT (the owner's addition)
**A toggle** (owner-ruled 2026-09-02: *"background grid should be a toggle… I was just thinking
it comes with the set of this type of work"*). When on, a faint lattice is drawn on the board's
ground, and a dragged card can settle onto it. **Off by default.** Visible ⇒ it snaps; hidden ⇒
it does not (a visible grid that ignores you is decoration; an invisible one that pulls is spooky).

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
- S1 On release, the card's stored position equals the neighbour's exactly — not within a pixel.
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
- **No rotation.** Ruled out of v1; the references show it in use, recorded for the aesthetics phase.
- **No ruler guides** (§2.5).

---

## 7 · Feel — the owner's, at the end, on a live board

Not decidable in advance, and not Claude's: the exact magenta against the paper ground · how
strong the pull is (~6 screen px is a starting guess) · the grid's spacing and faintness · whether
the caption rule in §5 reads right.

---

## 8 · THE TECHNICAL PLAN — to be independently checked before code

**8.1 · What exists.** `snapTo(dragged, others, threshold)` in `geometry.ts` — pure, 7 tests,
**no caller**. The size ledger (`use-geometry`) gives live true sizes. `card.tsx:184` reports live
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
