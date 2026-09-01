# Board undo/redo — the technical plan

**Status:** planned → **antagonist: "build with changes" (14 defects folded, 2026-09-01)** → build.
Headline catch: the lock-bypass gate as first written could NEVER fire (locked cards can't be
dragged/nudged/tidied, so no position entry ever snapshots `locked:true`) — the forced door now
decides against the CURRENT card at reverse time, or every locked-card undo would have shipped
the exact silent divergence §9 claimed to hold. Derived from
`board-actions-technical-audit.md` (Parts 3–5 + the senior review's 11 amendments — this plan
implements the AMENDED design, not the original Part 3). Concept rulings: D-135.
*(Correction on the record: an earlier session claimed a `board-undo-plan.md` existed; it never
did — the rulings were safe in D-135/the audit, and THIS is the one plan doc.)*
**Standing limits:** no schema changes needed (verified — every write uses existing tables) ·
no deploy without the owner's word · stage 5 (the visible UI) lands only after the dark soak.

---

## 0 · What this builds, in one paragraph

A capped (20), per-board-visit, session-only undo/redo of every **deliberate act** on a board —
moves · resizes · nudges · tidy · send-to-back · lock · un-place · trash · tags · source — with
↶ ↷ toolbar buttons (phone-first) + ⌘Z/⌘⇧Z, each button naming its next act. Reflexes
(click-to-front, auto-widen), system repairs, creates, evaporate, and destroy never enter.
Undo of an un-place *revives* (travel preserved); undo of a trash *restores*. The stack is
memory, never stored (the three-layer save ruling).

## 0b · Ideal-alignment (the owner's steer: plan for the IDEAL, not the current state)

Every piece of this plan is sorted into **permanent floor** vs **thin wiring**, so nothing is
built that the six-layer target later throws away:

- **Permanent floor (survives every later phase):** the pure stack + its tests · the reverse
  semantics (revive/restore/by-id source) · `chain()` · `movePlacementForced` · `cardsRef` ·
  `board-arrange.ts` (pure geometry — this IS layer-1 work arriving early) · the act
  vocabulary + labels. When the input engine (target layer 1) lands, it *dispatches into*
  exactly this vocabulary.
- **Thin wiring (absorbed later, deliberately cheap):** the `record()` calls at today's call
  sites (1–3 lines each) and the `onChange` intent tag. When the engine replaces react-rnd,
  these call sites *become* the engine's dispatch — the recording centralizes then, which is
  precisely the reviewer's "revisit the formal layer when it has more clients" condition
  arriving on schedule.
- **Why undo still goes FIRST** (litigated once, on the owner's invitation, and settled): the
  engine is the riskiest phase and needs an act vocabulary to dispatch into; undo builds that
  vocabulary while shipping value; the wiring the engine later absorbs costs a few dozen
  lines. Building the engine first would delay undo behind the riskiest work for no
  correctness gain.

## 0c · The scaffolding ledger (the ten-toes contract, 2026-09-01)

The owner asked whether the current machinery is "genuinely well built for these undo/redo
scenarios." The honest answer, on the record: **no — the ~15 compensating mechanisms this plan
needed are the signature of a substrate not shaped for undo.** The staged path is still right
(same destination as a rewrite, without the dark weeks or feel regressions), but every
compensation gets a DEMOLITION DATE. Scaffolding with demolition dates is architecture;
without them it's debt. The full stand — "this is the best way, and this is what we've done" —
is owed to the owner when the input engine ships and this table reads empty.

| compensation | retired by |
|---|---|
| record-only suppression in group drag | the input engine (gestures become entries natively) |
| the `onChange` intent tag | the input engine (intent born in the recognizer) |
| react-rnd's uncontrolled mid-drag hole | the input engine (scheduled, D-135) |
| DOM-measured geometry (tidy, arrows-to-be) | the geometry registry (scheduled, D-135) |
| `cardsRef` + resolve-at-reverse | the store step: state becomes single truth |
| `settled`/`trackCreate` choreography on reverses | the store step: landing states native |
| refresh signals into tag/source bars | the store step (bars read the store) |
| the unmount `record:false` carve | the store step (no orphaned commits) |
| snapshot signed-URL expiry | refresh-on-error (audit F5 class, evidence-gated) |
| **`chain()` per-row ordering** | **survives** — absorbed into the persistence adapter |
| **`movePlacementForced`** | **survives** — a real policy (undo may move locked) |
| **two write policies (streamed/discrete)** | **survives** — a truth about acts, centralized |

*The store step = the small named follow-up AFTER the input engine: persistence becomes a
SUBSCRIBER to the board's state instead of an interleaved partner. It completes the core; it is
the last demolition.*

## 1 · Stage map (each gate: `pnpm test` + tsc + lint + build green)

| stage | ships | visible change |
|---|---|---|
| 0 ✅ | `pnpm test` runs every suite (done, committed) · group-drag fix (done, `a447a95`) | none |
| 1 | `undo-stack.ts` (pure) + `undo-stack.test.mjs` + `use-undo.ts` (seam) + `chain()` export | none |
| 2 | `board-arrange.ts` (pure geometry, tested) + `use-arrange-acts.ts` — arranging acts RECORD, **dark** (dev readout only) · the `onChange` intent tag · group-drag single-entry fix | none on screen |
| 3 | keeping acts record: un-place / trash / bulk (wrapping `use-board-acts` internals) · `movePlacementForced` | none on screen |
| 4 | meaning acts record: tag add/remove · source set/clear (+ `setBitSourceId`) · per-bit refresh signal | none on screen |
| 5 | ↶ ↷ toolbar buttons + ⌘Z/⌘⇧Z + the transient "undid: …" note | **undo/redo exists** |

The antagonist reads THIS PLAN before stage 1 and the **stage-2 diff** (the review's retarget:
stage 2 owns the group-drag ground and the lock bypass — the real risk).

## 2 · The stack (stage 1) — `undo-stack.ts`, pure, no React, no supabase

```ts
type EntryState = "live" | "failed" | "dead";
type Entry = {
  label: string;            // "move 3 cards" — the button reads this
  bitIds: string[];         // NEVER placementIds (amendment 3 — reconcile renames those)
  state: EntryState;
  undo: () => Promise<void>;
  redo: () => Promise<void>;
  settled?: Promise<unknown>; // the originating act's own in-flight write (antagonist D6):
                              // undo() awaits it (settled-safe) BEFORE reversing, so pressing
                              // ↶ 200ms after "remove" can't revive a row the un-place hasn't
                              // departed yet (which would no-op the revive and lie on screen)
};
```

The stack exposes a **`version()` counter bumped on every mutation** — including the
live→dead flips that happen *inside* `undo()` — and the seam mirrors it into React state, so
the dev readout and the buttons actually re-render (antagonist D14). `push()` **returns the
entry** so a discrete act's own `.catch` can mark it `failed`. `undo()/redo()` return a result
object (`ok · terminal · label · error`) the seam maps to banners.

Semantics (each is a test):
- `push(entry)`: caps at 20 (oldest drops) · **clears the redo side** (a new act forks history).
- `undo()`: walk down past non-`live` entries (discard them silently); run the first live
  `entry.undo()`. Success → move it to the redo side. **Retryable failure** → the entry STAYS
  on the undo side (the button can try again) and the error surfaces once. **Terminal failure**
  (`TRASHED_BIT` · `restoreBit`'s not-in-trash assert · already-gone) → mark `dead`, surface an
  honest banner, next press skips it. `redo()` mirrors exactly.
- **One in flight**: a `busy` latch — while an undo/redo's promise is pending, further presses
  are ignored (not queued). Serializes the only interleaving the per-row chains can't.
- `nextUndoLabel()/nextRedoLabel()`: the first LIVE entry's label (skips dead/failed) — what
  the buttons render; null → disabled.
- Retryable vs terminal is decided by the CALLER (the act knows its own errors); the stack just
  honors the classification. `use-undo.ts` maps the known terminal shapes (`TRASHED_BIT` ·
  `TRASHED_BOARD` · "no longer exists" · "no longer in the trash").
- **Scope note (antagonist F7/D13):** the retryable-stays semantics and per-gesture error
  coalescing apply to the DISCRETE reverses (`callInBit` · `restoreBit` · `trashBit` · tag/source
  · forced moves) — the ones `undo()` awaits directly. Position reverses go through `patchCard`,
  which is synchronous and never rejects; their failures surface later via `restorePending` +
  the board's single error banner (one string — collapses by construction).

`use-undo.ts` (the React seam): stack in a ref · `record(label, bitIds, undoFn, redoFn)` ·
`undo()/redo()` wrapping the latch · `canUndo/canRedo/labels` mirrored into state for render ·
**per-gesture error coalescing** (N failed legs of one gesture = ONE banner — the review's §6
catch) · the dev readout: in `NODE_ENV=development` only, a fixed corner list of the stack's
labels+states (stages 2–4's only visible surface).

## 3 · The infrastructure pieces (stage 1, with the stack)

- **`chain(realId, fn)` exported from `use-persistence`** (~8 lines): runs `fn` behind the
  per-row write chain for that placement row, so `setPlacementLock` / `callInBit` /
  `movePlacementForced` can never reorder against an in-flight debounced flush (the review's
  §2c: these co-firing with a flush is the new bug class undo would create — closed here).
- **`movePlacementForced(supabase, placementId, {x,y})` in `lib/db/bits.ts`**: x/y only,
  **bypasses the locked-guard** (undo moves locked cards — owner-ruled), guarded
  `.is("left_at", null)` (antagonist D7 — a departed row must not eat a forced write) and
  **WITH a 0-row assert** (the unforced door's silent no-op stays; a forced 0-row now truly
  means "the card is gone"). **⚠ THE DECIDER (antagonist F1/D1):** forced-vs-normal is chosen
  against the **CURRENT card at reverse time** (`cardsRef.current`, by bitId) — NEVER the
  snapshot. No position act can capture a locked card (drag/resize/nudge/tidy all skip locked),
  so a snapshot-based gate would never fire and every locked-at-undo-time card would hit
  `updatePlacement`'s silent lock-filter no-op. *(Premise corrected on the record: the lock
  lives in the db-module filter, not the DB — the bypass stays at that layer.)*
- **`cardsRef` in `board-surface.tsx`** (antagonist D2 — amendment 3's missing mechanism): the
  latest-value ref pattern already used in `use-create-doors.ts:68`. EVERY reverse resolves its
  placementId (and lock state) from `cardsRef.current` by bitId at reverse time — never from
  the closure's render-time `cards`. This is what makes a post-capture reconcile rename
  (`use-create-doors.ts:550` renames placementIds in state) harmless. `patchCard`'s identity is
  safe to close over (it reaches state via `setCards`, refs underneath) — stated, not assumed.
- **Position reverses go through `patchCard`** (unlocked cards — the overwhelming case):
  coalescing + chains make rapid undo/redo safe, last-value-wins is correct for position, and
  the failure policy is the streamed one (keep-and-retry — the screen already shows the
  reversed position; the write retries on next edit/flushAll). Forced moves are the one
  exception (locked target), routed via `chain()`.

## 4 · Stage 2 — arranging acts, dark

**`board-arrange.ts`** (pure, tested): tidy's banded-grid math and the group-drag delta math
move OUT of `board-surface.tsx`, taking `(cards, selection, measures)` and RETURNING patches.
The `a447a95` bug becomes a permanent regression test (N-card delta, keyed by bitId).

**`use-arrange-acts.ts`** — the acts and their captures:

| act | before captured | after | notes |
|---|---|---|---|
| single move | `{x,y}` at `onDragStart` — from card STATE, captured in `board-surface.onCardDragStart`'s single-drag branch (which today just nulls `dragStart`; it gains the capture). State at drag-start IS the pre-drag truth: the dragged card is uncontrolled until stop, and auto-widen requires `editing`, which disables dragging (antagonist-verified) | drag-stop's `{x,y}` | **the record-only suppression (antagonist D3):** card.tsx's `onDragStop` keeps firing `onChange({x,y}, "move")` — suppressing the CALL would lose the dragged card's own save (`onCardDragEnd` deliberately skips it). Instead, board-surface's `onChange` handler skips the RECORD when `dragStart.current?.has(c.bitId)` (still populated at that moment — `onCardDragEnd` nulls it after); the group entry is built in `onCardDragEnd` |
| group move | every unlocked selected card's `{x,y}` at start | per-card `{x,y}` | one entry, N cards |
| resize | `{x,y,w,h}` from card STATE when `onResizeStart` fires (the rnd callback carries NO position/size — antagonist F3 — and must return undefined, since `false` cancels the resize) | stop's values | flex cards: `{x,y,w}` only (h is auto) |
| nudge | first keypress's `{x,y}` per selected card | last keypress's | **coalesced, fully specified (antagonist D12):** an open window keyed on the selection's bitId-set; a nudge within 800ms extends it; ANY selection change closes it; ⌘Z closes it before popping (never undo a still-extending entry). The timer lives in `use-arrange-acts` |
| tidy | patches actually issued (locked + no-op skips mirror exactly — review §6) | the STORED patches | one entry; **redo REPLAYS the stored patches, never re-runs tidy** (tidy measures live DOM — a re-run computes a different grid; antagonist catch) |
| send-to-back | `{z}` | `{z}` | deliberate z; click-to-front stays raw |
| lock/unlock | the toggle | the toggle | reverse = toggle back |

**The intent tag** (review §5): `onChange(patch, how?: "move" | "resize" | "grow" | "write")` —
FOUR annotated call sites in `card.tsx` (antagonist F2: auto-widen :151 · drag-stop :177 ·
resize-stop :182 · TextBit body :236); `"grow"`/`"write"` route raw, `"move"`/`"resize"` are
acts and carry their label. No prop explosion.

**Reflexes, named and excluded:** `select()`'s z-bump · auto-widen · every rollback/repair path.

## 5 · Stage 3 — keeping acts

**First, the owner-found seam (2026-09-01, verified):** the remove acts never flush a card's
pending typing — type two words and trash within the 350ms debounce and `forget()` drops the
queued body write; restore returns the pre-tail body. Pre-existing loss edge, made visible by
undo (a snapshot would show text the DB never got). **Stage 3 fixes it at the source: every
remove act runs `flushNow(placementId)` BEFORE the removal** (then forget stays exactly as is —
its teleport-guard job is untouched). One line per act; a regression note goes in the act's
comment.

Each remove act snapshots the full `CardVM`(s) before the optimistic removal, then records:

- **un-place** → undo = **re-add the snapshot card to `setCards` FIRST (optimistic — the
  antagonist's D4: the DB write alone brings the card back everywhere except the screen)**,
  then `callInBit` **with the CAPTURED placementId** (the insert 23505s, the revive updates
  that same row → id-stable, `reconcileId` a no-op — review §2e) at the snapshot's
  `{x,y,w,h,z}`, **registered via `trackCreate(placementId, revivePromise)`** (D4: without it,
  dragging the restored card while the revive is in flight lets the revive's position rewrite
  overwrite the drag — `bringIn` already does this, the undo mirrors it), then **re-apply the
  lock if the snapshot was locked** (`unplaceBit` clears `locked_at`), then **bump
  `looseRefresh`**. Redo = remove from `setCards` + `unplaceBit` + bump `looseRefresh` AGAIN
  (the bit is loose once more — D4: the plan originally bumped only on undo). Travel preserved
  by construction (revive, never a new row); failure rolls the re-add back out.
- **trash** → undo = `restoreBit` + re-add the snapshot card(s) to state (other boards' pages
  are `force-dynamic` and re-read on visit — server-verified; the client Router Cache on
  back/forward is the residual, accepted). Redo = remove from state + `trashBit` **without
  re-asking the confirm** (ruled). **Corrected (antagonist F4):** restoring an
  already-restored bit SUCCEEDS silently (`setResting` has no state predicate) — benign; only
  a DESTROYED bit 0-rows and throws → terminal → dead + banner. **Accepted in writing
  (D9):** a snapshot restored >1h into a session carries an expired signed media URL → broken
  image until reload; same class as audit F5, fixed with that class, not here.
- **bulk** versions: one entry, N snapshots, per-leg failures coalesced to one banner.
- **Excluded structurally:** the evaporate/abort path (`isFreshEmpty` → `abortBitCreate`
  DELETES the bit row — un-creating is not undoable, ruled) records nothing. The
  `isGoneError` carve (write failed but the screen is right) → entry marked dead.
- `TRASHED_BIT`/`TRASHED_BOARD` from the revive get owner-facing copy ("that bit is in the
  trash now — restore it from there"), not raw codes.

## 6 · Stage 4 — meaning acts (global — the labels say so)

- **tag add** → undo = `removeTag`. If the add CREATED the word, undo strands a zero-count
  word in suggestions — **accepted** (deleting vocabulary as an undo side effect would violate
  "destroy never"; ruled default).
- **tag remove** → undo = `applyTag(word)` — id-stable while the word survives (the tag row
  outlives its applications); if the word was renamed/merged/deleted in the manager meanwhile,
  the undo mints a fresh word — narrow, named, accepted.
- **source set/clear** → capture the PRIOR **full `Source` object** (not just the id —
  antagonist D5: the card VM carries its own `sourceName/sourceUrl` stamp, synced only through
  the picker's `onChange`; an id alone can't repaint the resting "from …" line). It IS in hand
  at pick/clear time (`current` / `prev` in the picker). Undo = **`setBitSourceId(supabase,
  bitId, priorId)`** — a NEW narrow db fn (one update, no find-or-create, exactly reversible)
  — **plus patching the card VM with the prior name/url** through the same `onSourceChange`
  path. **Never record while the picker is still `loading`** (D10: `initial={null}` on board
  cards means the prior is async — recording early captures null and the undo would CLEAR a
  source that existed). *`setBitSourceId` is a public-signature addition, flagged per house
  rule.*
- **Repaint without owning their state** (review risk 5): the reverse writes the DB, then bumps
  a per-bit **refresh signal** passed into `TagBar`/`SourcePicker` (they already refetch on
  target change; the signal is one more dep). The bars keep their own optimism and copies —
  **stage 4 records; it does NOT convert their write policies** (the pessimistic add/pick stay
  pessimistic — behavior-identical holds; the `optimistic()` helper consolidation is queued as
  its own later cleanliness pass, out of this track).
- **Unmount-commit carve, with its mechanism (antagonist D11):** both bars commit drafts on
  unmount through a ref; the commit path calls `add(w, { record: false })` /
  `pick(nm, { record: false })` — an explicit flag, not an inference.
- **Scope (antagonist D8):** BIT tags only. The board's own TagBar renders in the SERVER
  component outside `BoardSurface` and cannot reach `use-undo` — board-tag acts are out of
  scope, stated. Bit tags render only at single-select, so no bulk tag variant exists.
- **Threading honesty (F6):** the refresh signal is three prop hops (selected-bar TagBar +
  both SourcePicker sites in card.tsx), and the picker's refetch flashes its loading state for
  a beat on undo — accepted (a truthful flash beats a stale stamp).
- **Labels are honest about reach:** "untag ‘essay’ (everywhere)" — a tag/source act changes
  the bit on every board and in search; the stack is per-board, the label says the truth.

## 7 · Stage 5 — the visible feature

- Toolbar: **↶ ↷** beside zoom; disabled when no live entry; `title` = the next label; a
  transient "undid: move 3 cards" text beside them for ~2.5s (the ruled substitute for moving
  the view — undo never pans/zooms).
- Keys in `use-board-keys` at a VERIFIED insertion point: in the meta group (the ⌘=/−/0/A
  block at :42-45), **after** `if (!enabled) return` and **before** the
  `if (selectedCount === 0) return` guard at :47 — undo must not require a selection. The
  existing guard chain already protects everything else: guard ① catches every input/textarea
  on the page (drawer search, title, description, both bars), ③ catches tiptap while editing
  (its own ⌘Z owns the flow), ④ drawMode disables the hook (the pen's ↶ owns strokes).
- Phone = the buttons (no keyboard exists there).
- **The soak gate:** stages 2–4 run dark for real use; stage 5 lands only after (a) all gates
  green, (b) a browser run-through reading the dev readout against ~15 real gestures shows
  every entry truthful, (c) the antagonist's stage-2 diff verdict is in.

## 8 · Model-safety gates (the five, run against this feature)

1. **Invariants:** I-L1 (revive reuses the membership row — held by construction, §5) ·
   travel-is-memory (un-place undo stamps nothing away — revive clears `left_at`, arrival
   survives) · "destroy never enters undo" · the three-layer save ruling (the stack is never
   stored). New always-true rule for `invariants.md` at stage 5: *an undo entry never outlives
   its board visit, and never replays into a different board.*
2. **Trace vs every record:** create (excluded) · edit (text = flow-undo, excluded) · un-place
   (revive) · trash (restore) · restore-elsewhere (benign — the restore simply succeeds;
   corrected per antagonist F4) · destroy (terminal — the 0-row assert throws → entry dead) —
   no blank cells.
3. **Lowest layer:** dedupe/caps in the pure stack · id-stability by bitId keys · write
   ordering by the existing chains + `chain()` · the lock bypass at the db-module layer with
   an assert.
4. **Derive, don't duplicate:** labels derive from the act site; before-values from state at
   gesture start; nothing stores a second copy of card truth beyond the snapshot an undo needs.
5. **Prove the flow:** §7's soak + the browser run-through, not just units.

## 9 · Risks (from the review, owned here)

| risk | held by |
|---|---|
| locked-card silent divergence | the reverse-time lock check against `cardsRef` (NEVER the snapshot — F1/D1) + `movePlacementForced`'s left_at guard + 0-row assert + a unit test locking→undoing→re-reading |
| stale placement ids | bitId keys + resolve-at-reverse (amendment 3) + a reconcile-between-capture-and-undo test |
| reverses racing the debounce | position via `patchCard`; discrete row writes via `chain()` |
| group gestures as N entries | single-entry construction in `onCardDragEnd` / from issued patches |
| tag/source reverse can't repaint | the per-bit refresh signal; unmount carve |
| wrong-thing-reverts (the worst) | dark soak + the truthful-readout run-through before any button exists |

## 9b · Resolved specifics the antagonist demanded

- `chain(realId, fn)`'s `realId` comes from `await settled(placementId)` — every discrete
  reverse resolves through the settled door first, same as every other write.
- The dev readout renders from the stack's `version()` mirror — full label+state list, so the
  live→dead flips inside `undo()` are visible during the soak.
- The 20-cap counts all entries including dead — decided; dead entries are rare and special-
  casing the count buys nothing.
- `BoardSurface` never remounts without a route change (keyed by the page), so the ref-held
  stack's lifetime = the visit, as ruled.

## 10 · Sequence context (so this plan doesn't drift)

After undo: geometry registry → own the input layer (evidence from the owner's phone test sets
urgency) → the note panel. **The links phase is now GATED on the other window's stamped ruling**
(2026-09-01: bit↔bit concluded *no fourth mechanism*, ⚑ awaiting the owner's stamp — if stamped,
board-arrows either die or become board-*arrangement*, a different thing; not this track's
call). The registry and input work stand on their own justifications regardless.
