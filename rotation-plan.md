# Rotation — plan

**Status:** scoped (2026-09-03, owner delegated: "you can probably scope it all") → **awaiting
antagonist review** → build. Ruled IN 2026-09-02 (`organize-phase-plan.md` §4g item 2, re-opening
the old v1 cut): *"I do think rotation matters now that we're getting more visual spatial… if we
do alignment, I think we should just let alignment happen… if they've done certain things with
the cards then it can no longer align."* **The one mechanism that ruling already settled:** a
rotated card opts OUT of the snap-guide system, the same rule locked cards already follow — so
this plan never has to teach `snapTo` about rotated boxes.

---

## 1 · High-level, plainly

Any card can be spun to an angle, the way you'd tilt a photo or a scrap of paper on a real
mood-board — matching what the owner's Photoshop references showed and what she asked for
directly ("I think everything should be able to be rotated"). It's a visual tilt, nothing more:
rotation doesn't change a card's stored width/height, doesn't change what it means, and — per the
existing ruling — a rotated card simply stops being a candidate for the magenta alignment guides
while it's tilted.

## 2 · The model

**One new number, same family as `x`/`y`/`z`/`locked_at`:** `placement.angle` — degrees,
`double precision`, nullable, **null and 0 both mean "unrotated."** Per-board arrangement data
(a photo tilted on THIS board isn't tilted on another) — same reasoning already settled for lock,
so duplicate-board's copy loop picks it up for free once it's added to the same column list.

**No new invariant, one extension of an existing one:** the alignment ruling already covers this
(a rotated card is excluded from `snapTo`'s candidate pool, same as a locked one) — recorded here,
not re-decided.

## 3 · The specs

### Storage
```sql
alter table placement add column angle double precision;
```
That's the whole schema change. No CHECK needed (any real number is a valid angle; the UI
normalizes to 0–360 for display, storage stays whatever the drag produced — simplest, and
matches how x/y are stored as raw drag output today).

### Interaction
A rotate handle, Photoshop-reference style: appears at the selection frame's corners (the same
visual family as today's resize dots) **only when a card is selected-not-editing** — identical
condition to the existing resize handles. Dragging it spins the card live around its own center
(CSS `transform: rotate()` on the card's outer box — the geometry registry's measured w/h are
unaffected, since a CSS transform doesn't change layout size, only paint).

- **Shift-drag snaps to 15° increments** (0/15/30/45…) — a cheap, standard convenience; free
  rotation otherwise. Flagged for the owner's veto, not load-bearing.
- **Double-click the handle resets to 0.** Same reasoning — cheap, standard, easy to cut if unwanted.
- **All card types, uniformly** — implemented once at the universal card wrapper (the same
  component every bit type already renders through), so text/image/doodle/audio/pdf/link cards
  all get it for free, matching "everything should be able to be rotated."

### The one deliberate simplification — said before building
**Hit-testing (click-to-select, marquee-select) keeps using the card's UN-rotated bounding box.**
The geometry registry, marquee, and find-a-clear-spot all continue reading `sizeOf()` exactly as
today; rotation is purely a paint-time transform, invisible to every measurement. Honest
consequence: a heavily-rotated card's corner can poke outside its own axis-aligned box (or a
sliver inside the box can be visually empty), so a marquee or click right at that sliver can feel
very slightly off. Given the owner's own references show LIGHT tilts, not extreme ones, this is
the right trade for now — full rotated-polygon hit-testing is real work for a mismatch nobody's
likely to hit. Named, not hidden.

### Lock
**A locked card's rotate handle is disabled** — the same live-gesture gate resize and drag already
use (lock hides/disables the handles; it doesn't touch how undo *reverses* history against a
now-locked card, which is the existing forced-door mechanism and needs no change here). Consistent
reading of "lock guards position" extended to orientation. *(Owner's call if this feels wrong —
noted as the one real judgment call in this plan, not a certainty.)*

### Undo
`recordRotate(bitId, before: number, after: number)` — same shape as `recordResize` /
`recordSendToBack`: one act per finished drag (recorded on handle-release, not per animation
frame), `patchCard(placementId, bitId, { angle })`. A handle touch with no actual turn is a no-op,
same filter `recordMove`/`recordResize` already use. No coalescing needed (unlike nudges) — one
drag gesture is naturally one act.

### Alignment / snap guides
Already ruled — `snapTo`'s candidate list excludes any card whose `angle` is non-null and
non-zero, exactly like it already excludes locked cards. One filter, reused pattern, no new design.

## 4 · The cases

| case | behavior |
|---|---|
| rotate an unlocked card | handle drag → live spin → release records one undo entry |
| rotate a locked card | handle is disabled — same as resize/drag on a locked card today |
| shift-drag | snaps to 15° steps |
| double-click the handle | resets to 0, recorded as one undo entry (0 counts as a real change if it wasn't already 0) |
| a rotated card near others | excluded from snap guides entirely (source and target) — the existing ruling, applied |
| rotate then undo | angle reverts to its pre-drag value |
| duplicate a rotated card | the copy carries the same angle (per-board arrangement data, same as lock) |
| marquee near a rotated card's corner | may feel very slightly off at extreme angles — named limitation, §3 |
| resize a rotated card | resize handles rotate WITH the card (CSS transform applies to the whole selection frame); width/height stored are still the un-rotated dimensions |
| tidy / align / distribute a rotated card | unaffected by rotation itself, but the card won't be an alignment target while tilted (existing ruling) |
| a card at exactly 0° (never touched) | `angle` stays null — indistinguishable from "never had this feature," no migration backfill needed |

## 5 · Stages & proof

1. Migration (`angle` column) — no CHECK, no backfill, additive. Owner pastes to cloud per standing rule.
2. `card.tsx`: the rotate handle + live CSS transform + drag-to-angle math.
3. `use-arrange-acts.ts`: `recordRotate`, wired to handle-release.
4. `geometry-registry`/`snapTo`: the one-line exclusion filter for rotated cards.
5. `duplicate` (already shipped, D-141-era): confirm `angle` rides along — add to its column list,
   same spot lock was added.
6. Browser-proof: rotate, undo, redo, duplicate-a-rotated-card, lock-blocks-handle, shift-snap.
7. The record stage: `lexicon.md` gains `angle`/rotation as arrangement data (same family as lock);
   `invariants.md` gets the one-line snap-exclusion extension; D-log entry on ship.

## 6 · Open for the owner to veto, not block on

- Shift-snap-to-15° — cheap, cuttable.
- Double-click-resets-to-0 — cheap, cuttable.
- Lock disabling the rotate handle (§3) — the one real judgment call; flagged above.

Everything else in this plan is either already ruled (the alignment exclusion) or a direct
consequence of matching an existing pattern (storage shape, undo shape, handle style).
