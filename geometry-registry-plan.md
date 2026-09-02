# The geometry registry — plan

**Status:** planned → owner ruled (guides IN, references received) → **antagonist: "build with
changes" (8 defects + 5 missed items folded, 2026-09-01)** → build. Headline catches: the
mount-timing race that would have opened boards mis-fit to phantom 60px cards (fixed by
synchronous seeding), and the honest guides limit — **snap-on-release now, magnetic stick only
with the input engine** (react-draggable ignores `position` mid-drag; traced in its source). The second phase of the D-135
sequence (undo ✅ → **geometry** → own the input → the note panel → links-if-ruled).
**Standing limits:** no schema (client-only) · no deploy without the owner's word.

---

## 1 · High-level: what this is, plainly

The board knows where every card **is** (x, y in the database) but not reliably how **big** it
is: a text card's height is deliberately "auto" — it grows with its words, and only the screen
knows its true size. So every feature that needs true sizes goes and **measures the screen
itself, ad hoc**. The corrected census (antagonist): **four** measurers query by `data-pid`
with fallbacks (tidy · fit · marquee · find-a-clear-spot); auto-widen reads its own `innerRef`
(stays as-is); and a **sixth, the one that WRITES**: `onResizeStop` reads the Rnd root and
persists it as `card.w/h` — the source of every fallback width. Verified: the Rnd root and the
inner `data-pid` div are the same size (inner is `width:100%;height:100%` border-box; the root
adds no padding/border), so observing the inner div keeps all four consumers bit-identical.

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
registry: Map<placementId, { w: number; h: number }>   // measured; x/y stay in card state
sizeOf(placementId): { w: number; h: number } | null   // (a Box needs x/y the registry
                                                       //  deliberately doesn't hold — corrected)
read(cards): { card: CardVM; w: number; h: number }[]  // tidyPatches' EXACT input shape —
                                                       //  the only Box-producer, zips state x/y
measure: (placementId: string) => (el: HTMLElement | null) => void  // the ref-callback factory
```

- **Seeded SYNCHRONOUSLY in the ref callback** (`map.set(pid, {w: el.offsetWidth, h: el.offsetHeight})`
  before `observe`) — the antagonist's serious catch: `ResizeObserver`'s first delivery is
  ASYNC, and `fitView` runs in a mount effect; without the seed, board-open would race and
  sometimes frame the board to phantom 60px text cards (state `h` for flex cards is never
  patched — a real fallback lie). The seed makes "measured on attach" true.
- **One `useCallback` ref per card, deps `[card.placementId]`**, merging with `innerRef`,
  returning a cleanup (unobserve + delete — React 19 ref-callback cleanup). An inline callback
  would re-observe every card at 60fps during a group drag (Card isn't memoized; drag frames
  setCards). The shared RO lives in a `useRef`, created once; `observe(el, { box: "border-box" })`
  explicitly (default content-box would miss padding-only changes).
- **Plumbing named:** `Card` gains one prop — `measureRef` — one call site (board-surface),
  shown at build per the house rule.
- **Floats:** `borderBoxSize` is a double where `offsetWidth` is an int; `placement.*` columns
  are `double precision`, so fractional tidy positions store fine — a note, not a hazard.

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
| `tidySelected`'s `document.querySelector` loop (board-surface:339) | `read(chosen)` — its exact input shape |
| `fitView`'s measure loop (use-camera:130) | `read(cards)` |
| marquee hit-testing's per-card query (use-marquee-select:46) | `sizeOf()` |
| find-a-clear-spot's text-height query (use-create-doors:93) | `sizeOf()` — **a named behavior CHANGE, not identical**: today it measures text cards only and trusts state widths; the registry also measures audio cards (state height 56 vs the real player) — an improvement, verified deliberately at stage 3 |
| auto-widen's `innerRef.offsetHeight` (card.tsx) | **stays** — it reads its OWN element during typing |
| `onResizeStop`'s root read (card.tsx) | **stays** — it IS the write side (root ≡ inner, verified) |

**Scope honesty:** this is one ledger for the MOUNTED board. `placement-anchor.ts` (send-to-board
math, board not mounted) stays on stored widths by necessity — named as knowingly outside.
**The fallback is load-bearing, not decorative:** a pre-rename placementId reads null → state
fallback → exactly today's behavior; the undo track's bitId-key rule does NOT apply here
because every registry read is same-tick with the cards array it came from (antagonist-verified).

### Optionally in this phase (the owner's call, §4): snap/alignment guides

**The honest shape (antagonist-traced through react-draggable's source):** guides DRAW live
during the drag (rnd's onDrag gives live world coords + the registry gives live sizes), and the
drop **snaps on RELEASE** — the card settles ≤ threshold px into alignment on the next paint,
the standard design-tool feel. **Live MAGNETIC stick (the card pulling to the line mid-drag,
as in the owner's Photoshop references) is structurally impossible until the input engine** —
react-draggable ignores the `position` prop while dragging and exposes no setter. Promised
accordingly, never oversold.

- Threshold + line thickness in **SCREEN px, divided by cam.scale at use** (a world-px
  threshold would be 1.2px at 0.2× zoom and 18px at 3× — antagonist D7). ~6 screen px.
- **Group drags:** the dragged card's edges generate the snap candidates; the WHOLE group
  translates by the snapped delta (the earlier "dragged card only, offsets kept" was
  self-contradictory — D5). The snap applies in `onDragStop` BEFORE `onChange("move")` and
  `onDragEnd`, so the group entry and the single entry both record the snapped truth.
- **Escape hatch = Alt/Option, not ⌘** — ⌘-click already means additive select (D6 collision).
- **Guides render imperatively** into a ref'd overlay (style mutation per drag frame) — a
  single-card drag causes ZERO React re-renders today and must stay that way (D8).
- **Captioned media cards:** the caption hangs below the measured box (position:absolute) —
  bottom-edge guides on those cards align to the IMAGE bottom, not the caption; noted for the
  owner's feel-tune.
- Nudges/tidy: never snap. **Undo:** a snapped drop records as one `move` act at the snapped
  position (verified: recordMove's `after` is the same patch the snap writes).

## 3 · The cases

| case | behavior |
|---|---|
| card mounts | **seeded synchronously in the ref callback** (offsetWidth/Height), then observed — no async-first-delivery race (the fitView-on-open catch) |
| text card grows while typing | observer updates the ledger; nothing re-renders (mid-edit acts already read live) |
| hand resize | the resize act reads rnd's own ref (unchanged); the observer's delivery lands a tick later — fine, nothing reads the ledger in that window (corrected claim) |
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

## 4b · The guides' design — FROM THE OWNER'S REFERENCES (received 2026-09-01)

Six screenshots of an artist (@GODHEAD) mood-boarding in an InDesign-family tool, studied top
halves per the owner's instruction. **The last frame shows the feature itself live: a thin
MAGENTA guide line during a drag.** Notes:

**Affordances observed:** the guide appears only during the gesture, thin, high-contrast
magenta, extending well past both frames, gone on release · selection frames carry corner AND
edge handles + a center mark · a live "W: 187.82 px / H: 159.28 px" readout floats at the
corner while resizing · a rotate cursor at frame corners (used — one image placed sideways).

**Her practice (shapes the spec):** alignment is available but the composition stays LOOSE —
varied scales, deliberate slight overlaps, some rotation, generous white ground; text typed
directly on canvas at many sizes (display word · quotes with attributions · tiny captions
beside images). **Therefore: snapping is a whisper, never a grid** — small threshold (~6 world
px), easy to drift past, ⌘/Ctrl refuses, edges + centers only.

**Settled by the references:** guide color = magenta (`#e83e8c`-family against the paper
ground; exact value at build) · gesture-only · full-length lines. **Bundled (owner offered,
default yes):** the live W×H readout during a resize. **Observed, NOT proposed:** rotation —
ruled out v1 long ago; recorded as artist-practice evidence for the aesthetics phase's
re-entry question, the owner's call then.

## 5 · Stages & proof

1. `geometry.ts` (pure: box math, alignment-candidates if guides ruled in) + tests.
2. `use-geometry.ts` + card attach — dark (nothing consumes it yet). Gate: all suites + a
   browser probe comparing ledger vs **`offsetWidth/offsetHeight`** on every card type (NOT
   getBoundingClientRect — that one is transform-scaled, the probe would fail by construction;
   antagonist catch).
3. The four consumers switch, one commit each, behavior-identical (tidy/fit/marquee/clear-spot);
   each verified against its old output on the same board.
4. (If ruled) the guides: pure math tests + the owner's feel-tune sitting (threshold, look).
5. Antagonist reads the plan before stage 1 and the diff after stage 3.

**Scaffolding ledger note:** this phase DELETES one row (DOM-measured geometry) rather than
adding any — the first demolition, on schedule.
