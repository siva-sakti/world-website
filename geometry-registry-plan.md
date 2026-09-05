# The geometry registry — plan

**Status:** ✅ **stages 1–3 SHIPPED (2026-09-01; stage 2's gate passed by the OWNER'S hand — ledger vs real matched on every card incl. a 377px grown text card); stage 4 (the guides) next.**
Planned → owner ruled (guides IN, references received) → **antagonist: "build with
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
| `tidySelected`'s querySelector loop | ✅ `read(chosen)` |
| `fitView`'s measure loop | ✅ `sizeOf` per card + `boundsOf` for the union |
| marquee hit-testing's per-card query | ✅ `sizeOf()` |
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
default yes):** the live W×H readout during a resize. **SUPERSEDED — rotation is now RULED
IN (`build-queue.md` §4g item 2, 2026-09-02):** what this section called "not
proposed" was the re-entry condition being named, not a permanent no. The owner's call landed
the next day: *"I do think rotation matters now that we're getting more visual spatial… if we
do alignment, I think we should just let alignment happen… if they've done certain things with
the cards then it can no longer align."* **The ruling that dissolves the conflict with THIS
plan: a rotated card opts OUT of alignment**, the same rule locked cards already follow — so
`snapTo` never has to reason about rotated boxes, and rotation can be built before or after
stage 4 without either being reworked. Rotation itself is not scheduled into a build order yet
(a separate question from whether it's ruled in) — see `build-queue.md` §4g.

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

---

## 6 · STAGE 4 — THE BUILD (written 2026-09-02, before touching code)

The maths shipped with stages 1–3 and has **no consumer**: `snapTo` in `geometry.ts` is pure
and covered by 7 tests, and nothing calls it. This section is the WIRING plan — the part that
was never written.

### What existed vs what was missing — ⚠️ AS OF THE PLANNING MOMENT (2026-09-02).
**Stage 4 has since SHIPPED**: the overlay exists (`board-surface.tsx`), `snapTo` has callers, and
the guides draw and snap. Live status lives in `card-alignment-spec.md` §12. The table below is
kept as the plan's starting picture, not as a description of today.

| Piece | State |
|---|---|
| `snapTo(dragged, others, threshold)` → snapped x/y + vGuide/hGuide | ✅ built, 7 tests, **no caller** |
| the size ledger (`use-geometry`) — live true sizes | ✅ built, 4 consumers |
| live drag coords | ✅ `card.tsx:184` `onDrag → onDragMove(d.x, d.y)` |
| the drop | ✅ `card.tsx:185-188` `onDragStop → onChange("move") → onDragEnd` |
| **an overlay to draw guides into** | ❌ missing |
| **anything that calls snapTo** | ❌ missing |

### The ordering constraint that shapes the build

`card.tsx:186` writes the RAW drop coords (`onChange({x: d.x, y: d.y}, "move")`) and only then
calls `onDragEnd`. The snap must land **before both**, or the undo entry and the saved position
record the un-snapped truth (§2: "the snap applies in onDragStop BEFORE onChange and onDragEnd").
→ Card gains one prop, `snapDrop?: (x, y) => {x, y}`, supplied by the board (which owns the
ledger, the card list and the camera). Card stays dumb; the board decides.

### Steps, each gated and committed alone

- **4a · The overlay + live guides, NO snapping.** A ref'd `<svg>`/div in the world layer; the
  board computes `snapTo` on each `onDragMove` and mutates the overlay's style **imperatively**
  (D8: a single-card drag causes zero React re-renders today and must stay that way). Nothing
  moves yet — you just SEE the magenta lines appear and vanish. Cheapest possible proof the
  maths is wired to reality.
- **4b · Snap on release, single card.** `snapDrop` applied in `onDragStop`. Threshold ~6
  **screen** px ÷ `cam.scale` (D7 — a world threshold would be 1.2px at 0.2× and 18px at 3×).
  **Alt/Option refuses the snap** (⌘ is taken by additive select — D6).
- **4c · Group drags.** The dragged card generates the candidates; the WHOLE selection
  translates by the snapped delta (D5). Both undo entries record the snapped position.
- **4d · (optional, owner offered) the live W×H readout during a resize.**

**Never snaps:** nudges, tidy, call-in, revive. Only a hand-drag.

### THE HONEST LIMIT — say it before building, not after

**The card will NOT stick to the line while you drag.** The guide appears live, and the card
settles into alignment **on release**. Magnetic pull mid-drag is structurally impossible with
react-rnd (it ignores the `position` prop mid-drag and exposes no setter — traced through its
source in the antagonist round) and only becomes possible with the ruled input engine. This was
ruled and recorded on 2026-09-01; it is restated here so it is not re-discovered as a surprise.

### What the owner is needed for

- **Nothing to start.** The design is settled (§4b): magenta, gesture-only, thin, extends past
  both frames, edges + centers, whisper-not-grid.
- **At the end — the feel-tune sitting**, which §5 already names as stage 4's gate: the exact
  magenta against the paper ground, and the threshold (~6 screen px is a starting guess, not a
  ruling). That needs the owner's eyes on a real board; Claude must not settle either alone
  ("no aesthetic decisions for the owner").
- **One scheduling call:** 4d (the resize readout) in this sitting, or after the guides land?

---

## 4c · The references, re-read DIRECTLY (2026-09-02) — one earlier reading corrected

The owner re-shared the six screenshots; this is from looking at them, not from notes.

**THE DIAGONAL X — TWO READINGS, NOT SETTLED. Do not treat either as fact.**

Claude first guessed (from a verbal description, before seeing the images) "an empty picture
frame waiting for content." **That is definitively wrong** — the X appears on images that
plainly HAVE content: the glyph (1), the ballet-shoe photo (4), the handwritten note (6). The
two TEXT boxes (2, 3) are selected and show NO X.

Claude then read it as "marks a placed image, shown on selection" (Illustrator's linked-image
affordance). **The owner reads it as an ACTIVE-MANIPULATION cue** — *"she's basically dragging
that image on the board when I took the screenshot… it means actively you're picking it up and
moving it."*

**The owner's reading is better supported by the frames**, and this is the honest verdict: in
EVERY X instance something is being manipulated — image 1 shows the W/H readout (which only
appears mid-resize) plus a resize cursor · image 4 has the cursor on the photo · image 5 shows
the ROTATE cursor at a corner · image 6 has the move cursor on the note. The two X-less frames
show a text I-beam: being typed in, not moved. Claude's reading rests on tool-family knowledge;
the owner's rests on what is visible.

**What would settle it:** one frame with an image SELECTED BUT IDLE — cursor elsewhere, nothing
transforming. None of the six shows that.

**Why it does not matter for the build:** we are not building the X under either reading. Our
cards already read as different by type, and an extra selection decoration is an aesthetics-phase
option, not a mechanism. Recorded so the question is not silently re-answered later from a guess.

**Confirmed directly, all previously noted second-hand:** the live magenta guide (image 5 — a
thin horizontal line across the blue-wall photo, extending well past it) · the W/H readout
(image 1: "W: 187.82 px H: 159.28 px") · corner AND edge handles · the rotate cursor at a corner
(image 5).

## 4d · Owner ruling on TIDY vs ALIGN (2026-09-02)

**The owner:** *"I think it's better to just have the PowerPoint button… I still don't know
exactly what reading order means, it feels like a complication, but feel free to push back."*

**No pushback owed — the owner is right, and the reasoning is sharper than Claude's.** Reading
order (the 40px banding in `tidyPatches`) exists ONLY because tidy builds a GRID, and a grid has
ordered slots, so something must decide which card lands first. **Align buttons need no ordering
at all**: "align left" makes every left edge match, and which card is "first" is meaningless.

So the align/distribute set (`build-queue.md` §4e) is both **simpler to understand AND
simpler to build** than extending tidy: no banding, no reading order, no square-root grid — just
min/max/mean of the measured edges.

**Ruled:** tidy stays as built (the owner likes what it does); it is NOT extended. Align/distribute
is the one to build next. Stage 4's guides are unaffected — they are hand-guided, not button-driven.
