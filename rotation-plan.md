# Rotation — plan v3 (the executable one)

**Status:** v1 planned → antagonist killed its mechanism → v2 built and **shipped broken in
the hand** → **v3: this document, written 2026-09-03 after diagnosing v2 by reading the
libraries.** This is the plan to EXECUTE. v1/v2 history is §7, kept because the mistakes are
instructive, not because anything should be built from them.

**The feature itself is unchanged and already ruled** (owner, `organize-phase-plan.md` §4g):
a card on a board can be tilted; the tilt is per-board; editing straightens it. **The model,
the storage and the migration are DONE, applied to cloud, and correct — do not touch them.**
What was wrong was the *interaction*, and that is all v3 changes.

---

## 1 · What is broken, exactly (all four diagnosed by reading source, not guessing)

**D1 · The handle also starts a card drag.** The handle calls `stopPropagation` on a React
**`pointerdown`**. `react-draggable` binds **`mousedown`/`touchstart`** and never uses pointer
events — verified in its source: 80 × `onMouseDown`, 0 × `pointerdown`. Separate event
streams, so stopping one does nothing to the other. Pressing the handle therefore rotates AND
drags simultaneously; and because the drag *moves the card*, the rotation maths is measuring
from a centre that is sliding out from under it. This is the owner's *"it feels like the thing
is not working."*

**D2 · The angle is absolute where it must be relative.** v2 sets the card's angle to the
pointer's direction from the centre. With the handle pinned above the upright box, grabbing a
45° card and moving one pixel snaps it to ≈0°.

**D3 · A rotated rectangle needs more room than an upright one** — the owner named this
herself. Its corners rise *above* the upright box, exactly where v2's fixed `-26px` handle
lives (*"I'm hitting the height of that button with the card"*), and the selection ring —
anchored to the upright box — **stops containing the card at all**.

**D4 · No way back to upright.** v2 cut reset "to keep the gesture surface small". Wrong:
un-rotating is the first thing wanted after rotating, and undo is per-visit and gets consumed
by later acts.

## 2 · The fixes, one per defect

### 2.1 The drag can never start from the handle (D1)
- Add **`cancel=".compose-rotate-handle"`** to the `<Rnd>` in `card.tsx`. Verified present and
  forwarded: `react-rnd/lib/index.es5.js:434` destructures `cancel`, `:457` passes it to
  `Draggable`. `react-draggable` refuses to begin a drag from a node matching that selector.
- Belt and braces: the handle also stops `onMouseDown` and `onTouchStart` (the streams that
  actually matter), keeping `onPointerDown` for the gesture itself.
- Recompute the card's centre **every frame** rather than trusting a grab-time capture.

### 2.2 Rotation continues from where you grabbed (D2)
A **pure function**, so it can be tested without a DOM. Add to `src/app/board/[id]/geometry.ts`
(already the home for pure board maths):

```ts
/** The angle a rotate-drag should produce. All degrees.
 *  startAngle    — the card's angle when the handle was grabbed
 *  grabPointer   — atan2 angle of the pointer at grab, about the card's centre
 *  nowPointer    — atan2 angle of the pointer now
 *  snap          — hold Shift → 15° steps
 *  Returns a value normalised to (-180, 180].  */
export function rotateAngle(startAngle: number, grabPointer: number, nowPointer: number, snap: boolean): number
```
Rules it must obey: the **delta is normalised to (-180, 180] before being applied**, so
crossing the ±180 seam never produces a ~359° jump; snapping applies to the RESULT, not the
delta; and `rotateAngle(a, p, p, false) === a` exactly (grabbing without moving changes
nothing — the no-jump guarantee).

### 2.3 The handle orbits with the card (D3)
Wrap the handle in a **zero-cost anchor that is the card's own box, carrying the same
rotation** — then the handle rides the card's rotated top edge with no per-frame JS:

```jsx
{showHandle && (
  <div className="compose-rotate-anchor" style={tilt ? { transform: `rotate(${tilt}deg)` } : undefined}>
    <div className="compose-rotate-handle" … />
  </div>
)}
```
```css
.compose-rotate-anchor { position: absolute; inset: 0; pointer-events: none; z-index: 2; }
.compose-rotate-handle { position: absolute; left: 50%; top: -26px; margin-left: -11px; pointer-events: auto; }
```
`inset: 0` makes the anchor exactly the card box, so rotating it turns the handle about the
card's **centre** — the same origin the content uses. `pointer-events: none` on the anchor is
load-bearing: it covers the whole card, and without it every click on the card would hit the
anchor instead.

### 2.4 The selection ring tilts, so it contains the card (D3)
**Delete v2's ring override entirely** (the `.compose-card.is-rotated.is-selected` pair in
`globals.css`). The ring is drawn on `.compose-card-inner`, which is the node being rotated,
so removing the override makes it tilt *automatically*. Less code than v2, and correct.

**Ruled 2026-09-03 (Claude's call, owner delegated; flagged for veto at feel-tune):** the
resize dots **stay upright**. They cannot tilt — `re-resizable` computes resize in unrotated
screen space, so a tilted dot would stretch along the wrong axis (proven in the v1 antagonist
round). Keeping them upright preserves resize at every angle; the cost is that at strong tilts
they sit off the card's corners, which is cosmetic. Losing resize on tilted cards would have
been functional. **Containment beats agreement.** If the owner dislikes it, the alternative is
one change — hide the dots while rotated (`enableResizing` gains `&& !card.angle`).

### 2.5 Two ways back to upright (D4)
- **Double-click the handle → 0°**, recorded as one undo act (skip when already upright).
- **A "straighten" button in the selected-card bar**, shown only when that card is rotated.
  `SelectedBar` already receives the whole `card`, so it needs one new prop (`onStraighten`)
  and a `card.angle ?` guard. Wire it in `board-surface.tsx` beside the existing acts, using
  the same `recordRotate(bitId, current, 0)` path — no new act type.

## 3 · Files to touch (and nothing else)

| file | change |
|---|---|
| `src/app/board/[id]/geometry.ts` | **new** pure `rotateAngle` (§2.2) |
| `src/app/board/[id]/geometry.test.mjs` | tests for it (§5) |
| `src/app/board/[id]/card.tsx` | `cancel` prop · mouse/touch stoppers · grab-delta via `rotateAngle` · per-frame centre · the anchor wrapper · double-click reset |
| `src/app/globals.css` | the anchor rule · handle becomes `pointer-events: auto` · **delete** the two `.is-rotated` ring overrides |
| `src/app/board/[id]/selected-bar.tsx` | the conditional "straighten" button + `onStraighten` prop |
| `src/app/board/[id]/board-surface.tsx` | pass `onStraighten` |

**Do NOT touch:** the migration, `use-persistence.ts`, `use-arrange-acts.ts`'s `recordRotate`,
`types.ts`, `card-vm.ts`, `page.tsx`, `boards.ts`, or the snap/align exclusions. Those are v2
work that is correct and proven.

## 4 · Cases to hold (regressions v3 must not cause)

| case | expected |
|---|---|
| grab the handle | the card does **not** move, at any angle |
| grab and release without moving | angle unchanged, **no undo entry** |
| rotate past ±180 | continuous; no jump at the seam |
| Shift while rotating | 15° steps |
| double-click the handle | back to upright, one undo entry |
| straighten button | same, and the button disappears once upright |
| rotate at 45° / 135° | the handle stays reachable, never under the card's corner |
| click into a tilted card | content presents straight for editing (v2 behaviour, keep) |
| tilted card | still excluded from snap guides and align/distribute (v2, keep) |
| locked card | no handle, no straighten button |
| reload | the tilt persists (v2 storage, already proven) |

## 5 · Proof — and the gap that let a broken feature ship

**v2 passed typecheck, 141 tests, lint and build, and was unusable.** Every one of those gates
is blind to gesture behaviour, and no test drove the handle. So v3 is not "done" on gates
alone. It owes:

1. **Unit tests for `rotateAngle`** — no-move-no-change · a plain delta · the ±180 seam ·
   Shift snapping · that snapping lands on exact multiples of 15.
2. **All four gates**: `pnpm exec tsc --noEmit`, `pnpm test`, `pnpm exec eslint src`,
   `pnpm build`. ⚠️ **Run the build in a separate git worktree, never in the shared working
   directory** — a production build against a live dev server's folder is what caused the
   stale-CSS incident earlier today (`PROGRESS.md`, the Turbopack note).
3. **A hand-check by the owner** of the four things that actually broke: grab doesn't drag ·
   grab doesn't jump · the handle is reachable at 45° and 135° · straighten works.

## 6 · What v2 got right — keep all of it

Per-board storage (`placement.angle`) · the tilt on the inner content, never the Rnd root ·
**editing straightens** (the owner's ruling, works today) · exclusion from snap guides and
align/distribute · one undo act per gesture · duplicate-board carrying the tilt · the geometry
ledger being unaffected (CSS transforms don't change `offsetWidth`/`ResizeObserver`).

## 7 · How we got here (the record)

- **v1** proposed rotating the Rnd root. `react-draggable` overwrites that node's `transform`
  every frame, so it would have rendered *nothing*. It also never listed the persistence or
  read-back wiring, so the angle would neither have saved nor loaded. Killed by antagonist
  review before any code.
- **v2** fixed the mechanism (rotate the inner content) and all the wiring — that half is
  sound and shipped. It got the *interaction* wrong in four ways (§1), and the four green
  gates could not see it. The owner found all of it in about a minute of use.
- **The lesson worth keeping:** gates prove a build; only a hand proves a gesture.

---

# §V4 — STOP. The structural miss, found by the owner 2026-09-03

**Symptom:** *"I have a card previously rotated… I'm not able to rotate it back, and I'm also
not even really able to click out to click onto any other card. I'm kind of stuck."*

**Immediate unstick for the owner:** press **Escape** (twice if the card is in edit mode) —
`use-board-keys` clears the selection. A selected tilted card also shows a **straighten**
button in its bar. Neither of these is the fix; they are the way out.

## 1 · The miss, stated plainly

Every version of this plan — v1, v2, v3 — modelled **where the tilt is DRAWN** and never
**where the card is CLICKABLE.** Those are different rectangles, and rotation is precisely the
feature that pulls them apart.

Rotating `.compose-card-inner` does not change the Rnd root's box, the geometry ledger, the
marquee maths, or z-order. But the rotated content **overflows its own box and stays fully
hit-testable**. So a tilted card's corners now sit over its neighbours and over empty board,
and clicks that *look* like they land on another card — or on blank space to deselect — land
on the tilted card instead and re-select it. **That is the "stuck": near a tilted card, every
click is that card.** The bigger the card and the stronger the tilt, the larger the dead zone.

v3's §8 named "hit-testing stays axis-aligned" as a *cosmetic* limit ("a few pixels at light
tilts"). That was wrong in kind, not degree: it is not a rounding error at the edges, it is a
**growing region where the board stops responding to what the eye sees**.

## 2 · What is reachable, per state (the matrix the owner asked for)

`○` reachable · `△` reachable but wrong-feeling · `✗` blocked · **bold = the failures**

| you want to… | card upright | card tilted, unselected | tilted, selected | tilted, editing |
|---|---|---|---|---|
| select this card by clicking it | ○ | ○ | ○ | ○ |
| **click a neighbour under the tilt's overflow** | ○ | **✗ hits this card** | **✗** | **✗** |
| **click empty board to deselect** | ○ | **✗ if inside the overflow** | **✗** | **✗** |
| Escape to deselect | ○ | ○ | ○ | ○ (twice) |
| find the rotate handle | ○ | n/a (hidden) | △ **orbits — at 150° it is below the card, where nothing suggests looking** | ✗ hidden |
| straighten | n/a | ✗ (bar needs selection) | ○ button | ✗ |
| resize | ○ | n/a | △ dots upright, off the visual corners | ✗ |
| marquee-select across it | ○ | △ tests the upright box, not the tilt | △ | △ |
| read it while editing | ○ | n/a | n/a | ○ (straightens — this part works) |

**Three failures, one cause.** The first two are the overflow. The third is that an orbiting
handle is findable at 20° and unfindable at 150°.

## 3 · Why this cannot be patched at this layer

The hit area is the Rnd root's rectangle. To make clicks match the picture, one of these must
be true, and only the last is honest:

- **(a) Shrink what's clickable to the tilted shape** — impossible in CSS on an unrotated
  box; would need per-card hit polygons the board doesn't have.
- **(b) Grow the root to the tilted bounding box** — the root's size IS the card's stored
  `w/h`, read by the ledger, tidy, fit, marquee, resize and persistence. Changing it to a
  rotation-derived box corrupts every one of them. Rejected outright.
- **(c) Rotate the root instead** — react-draggable overwrites its transform every frame
  (v1's proven death).
- **(d) Own the input layer** — hit-test against real geometry we control, which is exactly
  what the committed next phase (`board-actions-technical-audit.md`, D-135: *own the input*)
  exists to do. Rotation is the first feature that genuinely **requires** it.

## 4 · What it needs to be a functional product (the owner's second question)

Four properties. Today's build has one.

1. **What you see is what you click.** ✗ — the overflow breaks it.
2. **You can always get out.** ○ — Escape + straighten (added in v3).
3. **The control is findable at any angle.** ✗ — orbiting hides it at large angles.
4. **Neighbours stay reachable.** ✗ — same overflow.

## 5 · The fork — the owner's call, and Claude will not build until she rules

- **(A) Ship a deliberately SMALL rotation now.** Cap the angle at ±20°, which is the tilt the
  reference mood-boards actually use. At 20° a 400×300 card overflows its box by ~50px at the
  corners — real but small, and the handle stays near the top where it is findable. Property 1
  becomes "true enough at the only angles allowed". Honest, shippable today, and it forecloses
  nothing.
- **(B) Park rotation until the input engine.** Keep the column, the storage and the straighten
  button; hide the handle. Nothing is lost, nothing is half-true, and rotation returns as a
  first-class feature the moment we own hit-testing. This is what an engineer with no schedule
  pressure would do.
- **(C) Ship it as-is and live with the dead zones.** Not recommended, recorded for completeness.

**Claude's recommendation: (B), with (A) as the compromise if the owner wants the feeling now.**
The reasoning: property 1 is not a polish item, it is what makes a canvas trustworthy, and
three failed plans in a row is the signal that the layer is wrong rather than the details.
The input engine was already the committed next phase; rotation is now its clearest
justification rather than a detour from it.

## 6 · The process lesson (worth more than the feature)

v1 died on a rendering assumption. v2 shipped on four green gates and failed in the hand. v3
fixed four real defects and still failed, because all three plans modelled the same layer — how
it LOOKS — and never modelled how it is REACHED. **The owner found in a minute what three
adversarial reviews missed, because she was the only one clicking.** The gates, the antagonist,
and the unit tests all had a blind spot with the same shape: none of them touch the board.
