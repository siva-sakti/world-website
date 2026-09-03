# Rotation — plan (v3 pending; v2 shipped and is BROKEN in use)

> ## ⚠ v2 SHIPPED AND FAILS IN THE HAND (owner, 2026-09-03: *"after I do my initial
> rotation, I can't un-rotate… it feels like the thing is not working… I think your plan
> actually needs to be accommodating a different set of things"*). She was right that this
> is a PLAN failure, not only an execution slip. **Three defects, all diagnosed by reading
> the libraries, not guessing. Do not patch: re-plan (§V3 at the bottom), owner rules the
> one open design question, then build.**
>
> **D1 — the handle also starts a card DRAG (proven).** The handle stops propagation on
> `pointerdown`. **`react-draggable` binds `mousedown`/`touchstart` and never uses pointer
> events** (80 × `onMouseDown`, 0 × `pointerdown` in its source) — separate event streams,
> so stopping one does nothing to the other. Pressing the handle therefore rotates AND drags
> at once. Worse, the rotation math captures the card's centre at grab-time while the drag
> is *moving that centre*, so the angle runs away from the hand. This is the "not working".
> **Fix: `cancel=".compose-rotate-handle"` on the `<Rnd>` — verified forwarded to Draggable
> (`react-rnd/lib/index.es5.js:457`)**, plus `onMouseDown`/`onTouchStart` stoppers.
>
> **D2 — the angle is ABSOLUTE where it must be RELATIVE.** v2 sets the card's angle to the
> pointer's direction from centre. With the handle pinned at the upright top-centre,
> grabbing a 45° card and moving one pixel snaps it to ~0°. **Fix: grab-delta —
> `new = angleAtGrab + (pointerAngleNow − pointerAngleAtGrab)`.** No jump, ever.
>
> **D3 — the thing v2 never modelled, and the owner named it: a rotated rectangle's
> bounding box is BIGGER than the upright one.** Everything v2 anchored to the upright box
> is wrong once tilted — the card's corners rise *above* the box and sit exactly where the
> fixed `-26px` handle lives (*"I'm hitting the height of that button with the card"*), and
> the selection ring **no longer contains the card at all**.
>
> **D4 — no way back to upright.** v2 explicitly cut reset "to keep the gesture surface
> small". Wrong call: un-rotating is the *first* thing wanted after rotating, and undo is
> per-visit and gets consumed by later acts. A real straighten affordance is required.

# Rotation — plan (v2, rewritten after the antagonist round)

**Status:** v1 scoped → **antagonist returned 4 must-fix defects** → owner ideated the
edit-straightens ruling → v2 rewritten from the CODE, every wiring point verified by reading
it → **✅ BUILT + migration pasted to cloud + owner-confirmed working on localhost
("cool it's functional now", 2026-09-03). Owner's feel-tune still owed** (handle size and
position · does the spin track the hand · Shift-15° · whether the upright selection ring
around a tilted card reads right). Ruled IN 2026-09-02 (`organize-phase-plan.md` §4g).
**Not on `main` yet — pushing there deploys, which is the owner's call.**

**What v1 got wrong, kept on the record:** it proposed rotating the card's OUTER box with
CSS. `react-draggable` writes `transform: translate(...)` onto that same node every frame
(`react-draggable/build/cjs/Draggable.js`, `render()` → `cloneElement` merges its own style
last), so the rotation would have been silently overwritten — **the feature would have
rendered nothing.** v1 also never listed the persistence or read-back wiring, so the angle
would have neither saved nor loaded. All four defects are addressed below.

---

## 1 · The mechanism (the decision everything else follows from)

**Rotate the INNER content node (`.compose-card-inner`), never the Rnd root.**

The card is two layers: the **outer Rnd root** (position, drag, the resize handles — owned by
react-rnd, which overwrites its transform every frame) and the **inner content div** (the
paper, the words/image, the click handlers — ours alone, no library touches it, and it
currently has no `transform`, verified in `globals.css:408`).

Why this is *right* and not merely a workaround: the frame and the resize math both stay in
**unrotated space, so they remain mutually consistent.** v1's defect 4 (resize handles
computing in screen space while the card is visually tilted → dragging the "right" edge grows
the wrong way) **cannot occur**, because the handles are not rotated either. The tilt is
purely presentational; every existing gesture keeps its exact meaning.

**Verified safe for measurement:** CSS transforms do not affect `offsetWidth`/`offsetHeight`
or `ResizeObserver` border-box readings, so the geometry registry — which observes this exact
node — stays correct, and tidy/fit/marquee/find-a-clear-spot are untouched.

## 2 · The model

**`placement.angle` — degrees, `double precision`, nullable. Null and 0 both mean upright.**
Per-BOARD arrangement data, the same family as `x/y/z/locked_at` (owner-confirmed: *"it's
just for the bit on the board not globally"*). Tilt a photo on board A → board B shows it
straight. No CHECK: any real number is a valid angle (the UI normalises for display; storage
keeps what the drag produced, exactly as x/y do).

## 3 · What the owner sees

- **At rest:** the card is tilted. This is the feature.
- **Selected:** the content stays tilted; the **selection ring moves to the upright outer
  box** so it agrees with the (upright) resize dots. Without this the ring would tilt with
  the content while the dots stayed square — visibly detached corners. *(Found by reading
  `globals.css:420`: the ring is currently drawn on the inner div.)*
- **Editing (the owner's ruling):** the content presents **straight** while you edit, and
  re-tilts when you leave. This is not only comfort — it removes a tilted caret, tilted
  selection highlights and tilted spell-check underlines in one stroke.
- **Rotate handle:** **top-centre, just above the card**, visible on the same condition as
  the resize dots (`selected && !editing && !locked`). Top-centre deliberately: the four
  corners are already resize dots, and this is the Figma/Canva/PowerPoint convention.
- **Shift** while rotating snaps to 15° steps. *(Double-click-to-reset is NOT built — noted
  as available if wanted; keeping the gesture surface small.)*

## 4 · The wiring — all ten points, each verified by reading the file

| # | file | change |
|---|---|---|
| 1 | `supabase/migrations/20260903000004_rotation.sql` | `placement.angle` + **REPLACE `board_cards`** — verbatim from `20260902000001` with `p.angle` appended LAST, repeating `with (security_invoker = true)` (OR REPLACE resets reloptions; dropping it would silently flip the view to definer rights — the lock migration's own warning) |
| 2 | `src/lib/types.ts` | `BoardCard.angle: number \| null` |
| 3 | `src/app/board/[id]/page.tsx` | the row→VM map gains `angle: r.angle ?? undefined` |
| 4 | `src/app/board/[id]/card-vm.ts` | `CardVM.angle?: number` |
| 5 | `src/app/board/[id]/use-persistence.ts` | `PlacementPatch.angle` **and** `schedule()`'s copy list (**defect 2**: it hard-copies a fixed key list and silently drops the rest — the angle would have saved for the session and vanished on reload) |
| 6 | `src/lib/db/bits.ts` | the `Pos` type gains `angle` (shared by `updatePlacement` + `insertPlacement`) |
| 7 | `src/app/board/[id]/use-arrange-acts.ts` | `recordRotate(bitId, before, after)` — one act per finished drag |
| 8 | `src/app/board/[id]/card.tsx` | the handle, the live drag math, the conditional transform |
| 9 | `src/app/board/[id]/board-surface.tsx` | snap + align/distribute exclusions (§5) |
| 10 | `src/lib/db/boards.ts` | `duplicateBoard`'s select+insert lists gain `angle` (a faithful arrangement copy keeps the tilt, exactly as it keeps `locked_at`) |

**Lock:** rotation follows **resize**, not move — the handle is hidden when locked (UI gate),
and `angle` is NOT added to `updatePlacement`'s lock filter, which stays scoped to x/y. This
is the existing precedent (`width` and `z` are legal on locked rows; resize is gated at the
UI). It also means undo of a rotate on a since-locked card just works, with no forced-door
special case. *(v1 was internally inconsistent here — the antagonist's B5.)*

## 5 · Rotation × alignment (the already-ruled interaction)

Owner's ruling (§4g): **a rotated card opts OUT of alignment**, exactly as a locked card
does. Applied in **both directions**, because a rotated box's stored rectangle is no longer
what the eye sees:
- as a **candidate** — filtered out of `dragSnap.others` (`board-surface.tsx:368`);
- as the **dragged** card — `snapFor` returns null when the dragged card is rotated;
- **align & distribute** exclude rotated cards too, and `alignableCount` counts the same way
  — otherwise the toolbar offers a button that silently does nothing (the exact reasoning
  already written there for locked cards).

## 6 · Undo

`recordRotate` mirrors `recordResize`'s shape: recorded on handle-**release** (not per frame),
`patchCard(placementId, bitId, { angle })`, no-op filter when the angle didn't actually
change. No coalescing window needed — one gesture is naturally one act.

## 7 · The cases — walked

| case | behaviour |
|---|---|
| rotate → reload | the tilt persists (wiring 1–6; the defect that would have lost it is named there) |
| rotate → undo → redo | angle reverts / reapplies; one entry per gesture |
| rotate a locked card | handle hidden — same gate as resize |
| rotate → resize | handles upright, math unrotated, correct; content tilts inside the new size |
| rotate → drag | the outer box moves, content tilts along; no snap (§5) |
| rotate → edit | content straightens for editing, re-tilts on exit (owner's ruling) |
| rotate → tidy / fit / marquee | unchanged — the ledger reads layout size, which transforms don't affect |
| duplicate the BOARD | the copy keeps each card's tilt (like `locked_at`) |
| duplicate a BIT | the copy lands **upright** — a new thing, its own arrangement. 🔵 unruled, flagged, trivially changed |
| a card at exactly 0 | `angle` stays null — indistinguishable from "never rotated"; no backfill |
| click a tilted card | the browser hit-tests the ROTATED element, so clicking the visible card works correctly |
| click the empty corner of a tilted card's upright box | still selects it — a small false-positive area (§8) |
| marquee near a tilted card | uses the stored upright box — approximate at strong tilts (§8) |

## 8 · The honest limits — said before building

- **Hit-testing stays axis-aligned.** Clicking the *visible* tilted card is correct (browsers
  hit-test rotated elements properly), but the un-rotated box's empty corners still select,
  and the **marquee** and **fit-view** both reason about the stored upright rectangle. At the
  light tilts the reference mood-boards actually use this is a few pixels; at 45° it is
  felt. True rotated hit-testing belongs to the own-the-input phase.
- **The selection ring and the content disagree in angle while selected** (§3) — deliberate,
  so the ring agrees with the resize dots instead. If it reads badly at feel-tune, the
  fallback is to hide the resize dots on rotated cards and tilt the ring with the content.
- **No rotation on the phone** in this pass (a rotate handle wants a precise pointer); the
  gesture surface is desktop/Daylight. Not a limitation of the model — the angle is stored
  and renders everywhere.

## 9 · Stages

1. Migration + its throwaway proof (columns, view replace, **security_invoker survives**) →
   owner pastes to cloud.
2. Wiring 2–6 (types → VM → persistence → db) — dark, nothing renders yet.
3. `card.tsx`: handle + transform + edit-straightens + the CSS ring move.
4. Undo + the §5 exclusions.
5. Gates + browser proof; the owner's feel-tune (handle look, 15° snap, ring behaviour).

---

# §V3 — the revised design (awaiting the owner's ruling on one question)

## What changes, and why each change exists

| # | change | which defect it answers |
|---|---|---|
| 1 | **`cancel=".compose-rotate-handle"` on the `<Rnd>`**, plus `onMouseDown`/`onTouchStart` stoppers on the handle | D1 — the drag can never start from the handle, on the event stream that actually matters |
| 2 | **Grab-delta math.** Record the card's angle AND the pointer's angle at grab; during the gesture apply the *difference* | D2 — no jump on grab, whatever the current angle |
| 3 | **The handle ORBITS with the card** — it rides off the card's *rotated* top edge instead of a fixed point above the upright box | D3 — it can never be covered by a corner, and it always reads as belonging to this card. Implemented with a zero-size anchor at the card's centre that carries the same rotation, so the handle's position follows the angle in CSS with no per-frame JS |
| 4 | **The selection ring tilts with the content** | D3 — a selection ring must *contain* the thing. Anchored to the upright box it visibly fails to at any real angle |
| 5 | **A straighten affordance, two ways:** double-click the handle → 0°, and a **"straighten"** button that appears in the selected-card bar whenever a card is rotated | D4 — one discoverable, one fast; neither depends on undo |
| 6 | Recentre the live-drag maths on every frame rather than trusting a grab-time centre | D1's second half — belt and braces even once the drag can't start |

**Reversal on the record (v2 → v3):** v2 kept the ring on the upright box so it would agree
with the resize dots. That was the wrong constraint. **Containment beats agreement** — a ring
that doesn't contain its card is simply wrong, whereas dots that sit at the upright corners
are merely plain. Changed deliberately, not drifted.

## The one open question — the owner's call

Resize dots **cannot** rotate: `re-resizable` computes its drag in unrotated screen space, so
a tilted dot would resize along the wrong axis (the v1 antagonist proved this). So once the
ring tilts, there are exactly two coherent options:

- **(A) Keep the dots, upright.** Resize keeps working at every angle. Cost: at strong tilts
  the four dots visibly sit off the tilted card's corners. At the light mood-board tilts the
  references actually use, it reads fine. **← Claude's lean**
- **(C) Hide the dots while rotated.** Always visually coherent — tilt, ring and card agree.
  Cost: to resize a tilted card you press **straighten**, resize, re-tilt. Real friction,
  and it makes rotation feel like a "finishing" move.

Everything else in §V3 is settled and doesn't depend on this answer.

## What stays exactly as it is (v2 got these right, verified in use)

Per-board storage · the tilt on the inner content (never the Rnd root) · **editing
straightens** (the owner's ruling — it works) · rotation excluded from snap guides and
align/distribute · undo recording one act per gesture · duplicate-board carrying the tilt ·
the geometry ledger being untouched by transforms.

## Proof this time — the gap that let a broken feature ship

v2 passed typecheck, 141 tests, lint and build, and was still unusable. **All four gates are
blind to gesture behaviour**, and no test drove the handle. So v3 owes, before it is called
done: a test over the pure grab-delta maths (angle-at-grab + pointer-delta → expected angle,
including the wrap past ±180°), and an explicit **owner hand-check of the four things that
broke**: grab does not drag · grab does not jump · the handle stays reachable at 45° and
135° · straighten returns to upright.
