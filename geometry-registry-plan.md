# The geometry registry — plan

**Status:** planned → owner questions → antagonist → build. The second phase of the D-135
sequence (undo ✅ → **geometry** → own the input → the note panel → links-if-ruled).
**Standing limits:** no schema (client-only) · no deploy without the owner's word.

---

## 1 · High-level: what this is, plainly

The board knows where every card **is** (x, y in the database) but not reliably how **big** it
is: a text card's height is deliberately "auto" — it grows with its words, and only the screen
knows its true size. So every feature that needs true sizes goes and **measures the screen
itself, ad hoc**. Verified count today: **five separate measurers** — tidy-up, fit-view, the
marquee select, find-a-clear-spot (the create doors), and the auto-widen check — each querying
the DOM by `data-pid` with its own fallbacks.

The registry replaces the five with **one little ledger**: every card continuously reports its
true rectangle (a `ResizeObserver` per card, one shared handler), and everything reads the
ledger. Nothing on screen changes; the floor under everything gets honest.

**Why it's worth a phase of its own (what it unblocks):**
- **arrows/links** (if the composition ruling admits them): an arrow must anchor to a card's
  EDGE — impossible without true boxes;
- **snap/alignment guides** while dragging (the classic canvas nicety — an owner question below);
- **the input engine** (next phase): our own drag needs live geometry to hit-test against;
- **viewport culling** someday (perf), a **minimap** someday;
- and immediately: tidy/fit/marquee/clear-spot stop having five private measuring codepaths
  that can drift apart.

## 2 · The specs

### The shape

```ts
// use-geometry.ts — the hook; box math pure in geometry.ts (unit-testable)
type Box = { x: number; y: number; w: number; h: number }; // world units
registry: Map<placementId, { w: number; h: number }>  // measured; x/y stay in card state
read(cards): Box[]          // state x/y + measured w/h, state-fallback when unmeasured
boxOf(placementId): Box | null
```

- **Measured w/h only** live in the registry; **x/y stay where they are** (card state — already
  the single truth for position, and mid-drag position is the input engine's problem, not this
  phase's). Derive, don't duplicate: the registry never copies what state already owns.
- **World units come free:** cards are scaled by the camera's CSS transform, so
  `offsetWidth/offsetHeight` are already unscaled world pixels — the exact values the five
  measurers read today. `ResizeObserver`'s `borderBoxSize` matches. No conversion layer.
- **One observer instance**, cards attach/detach via a ref-callback on the existing `data-pid`
  element (no new DOM). Unmount cleans up. A card not yet measured falls back to its state
  `w/h` — exactly today's fallback, now in ONE place.
- **No re-render storm:** the registry is a ref (mutable map). Nothing re-renders on measure;
  consumers read at act time (tidy click, fit click, marquee drag) — same as their DOM reads
  today, just cheaper and single-sourced. (If a future consumer needs reactive geometry —
  live arrows will — a subscribe hook gets added THEN, with that consumer. Not before.)

### The consumers switched in this phase (behavior-identical)

| today | after |
|---|---|
| `tidySelected`'s `document.querySelector` loop (board-surface:339) | `read(chosen)` |
| `fitView`'s measure loop (use-camera:130) | `read(cards)` |
| marquee hit-testing's per-card query (use-marquee-select:46) | `boxOf()` |
| find-a-clear-spot's text-height query (use-create-doors:93) | `boxOf()` |
| auto-widen's `innerRef.offsetHeight` (card.tsx) | **stays** — it reads its OWN element during typing; the registry would add indirection for nothing |

### Optionally in this phase (the owner's call, §4): snap/alignment guides

While dragging a single card: when its edge or center comes within ~6 world px of another
card's edge/center, a thin guide line appears and the drop position snaps. Escape-hatch:
holding ⌘/Ctrl disables snapping (the standard). Guides render in the world layer; the math is
pure (`geometry.ts`: nearest-alignment over the registry's boxes) and unit-testable. Group
drags: v1 snaps the DRAGGED card only (followers keep their offsets — matches how the group
entry already works). Nudges/tidy: never snap (tidy IS the aligner; a nudge is precise intent).
**Undo integration is free:** a snapped drop is still one `move` act at the snapped position.

## 3 · The cases

| case | behavior |
|---|---|
| card mounts | measured on attach; until then, state w/h fallback (today's behavior, centralized) |
| text card grows while typing | observer updates the ledger; nothing re-renders (mid-edit acts already read live) |
| hand resize | observer fires; ledger fresh before the resize act even records |
| card removed / evaporated | ref-callback detaches → entry deleted; no stale boxes |
| revive (undo of remove) | re-mounts → re-attaches → measured anew — no special path |
| reconcile rename (call-in) | keyed by placementId; the keyed `Card` remounts under the new id → old entry detaches, new attaches — self-healing |
| zoom / pan | layout sizes don't change under a CSS transform — the observer stays silent (verified property of transforms) |
| locked cards | measured like any other (geometry ≠ position policy) |
| fit pressed before first paint settles | same as today: fallback then correct on next press — no regression |
| board with 0 cards | empty ledger; consumers already handle empty |
| (if guides) drag near an edge | guide shows, drop snaps; ⌘ held → no snap; the undo entry records the SNAPPED position (truthful) |

## 4 · The owner's ruling (2026-09-01)

**Snap/alignment guides: RULED IN, bundled with the registry** — and with REFERENCE MATERIAL
incoming: the owner is sending screenshots of an artist mood-boarding in Photoshop (dragging
images/text boxes with live guides), with instructions to study the TOP HALF of each image and
take notes on what real artist mood-boarding looks like in action. **The guides' look and feel
(threshold, line style, what aligns to what) get designed FROM those references** — the
design-working-method rule: reference-exact, owner as visual oracle, never invented. The
registry floor (stages 1–3) doesn't depend on the pictures and builds meanwhile; stage 4's
design section gets written when the references arrive.

## 5 · Stages & proof

1. `geometry.ts` (pure: box math, alignment-candidates if guides ruled in) + tests.
2. `use-geometry.ts` + card attach — dark (nothing consumes it yet). Gate: all suites + a
   browser probe comparing ledger vs `getBoundingClientRect` on every card type.
3. The four consumers switch, one commit each, behavior-identical (tidy/fit/marquee/clear-spot);
   each verified against its old output on the same board.
4. (If ruled) the guides: pure math tests + the owner's feel-tune sitting (threshold, look).
5. Antagonist reads the plan before stage 1 and the diff after stage 3.

**Scaffolding ledger note:** this phase DELETES one row (DOM-measured geometry) rather than
adding any — the first demolition, on schedule.
