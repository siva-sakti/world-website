# Rotation — plan (v2, rewritten after the antagonist round)

**Status:** v1 scoped → **antagonist returned 4 must-fix defects** → owner ideated the
edit-straightens ruling → **v2 rewritten from the CODE, every wiring point verified by
reading it (2026-09-03)** → building. Ruled IN 2026-09-02 (`organize-phase-plan.md` §4g).

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
