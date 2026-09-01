# Board actions — technical audit (current state · the ideal · the gap)

**Status: 🔵 Claude's assessment → ✅ SENIOR-REVIEWED (2026-09-01): "proceed with amendments."**
An independent staff-engineer review verified every Part-2 claim against the code, found a live
bug (group drag broken since R1 — fixed, own commit `a447a95`), corrected three factual errors in
this doc (marked ⚠ CORRECTED inline), and trimmed Part 3's design (see §Review outcome). The
technical plan derives from the AMENDED design, not the original Part 3. The ground-up
question — *how do we think about actions in this app?* — asked by the owner before building
undo/redo. Current state read from the code file-by-file this session, not from memory. The
technical plan for undo + the board rewrite derives from this doc once the owner blesses the
direction. Words per `lexicon.md`; the model's own acts framing (agreements §5) is the seed:
*"placing and tagging are acts I take; their records are the memory of the acts."*

---

## Part 1 · The ground floor: what a person does here

Five kinds of doing, each earned by a scene (not invented as taxonomy):

| kind | scenes | its nature |
|---|---|---|
| **looking** | open a board, pan, search, pull a tag | changes nothing; at most the app *remembers you looked* (an opening, D-134) |
| **making** | jot, paste a link, drop a photo, new board | something exists that didn't |
| **authoring** | typing words, drawing strokes | *flow*, not clicks — hundreds of micro-changes; "one action" is meaningless mid-sentence; gets flow-undo inside the editor/pen |
| **arranging** | move, resize, tidy, stack, lock | discrete deliberate gestures; **local** — this board's opinion |
| **keeping / letting go** | place, un-place, trash, restore, archive, destroy | a thing's presence in the world; **global** — about the thing everywhere |

Plus tags and sources — **meaning acts**: discrete like arranging, global like keeping.

**The promises each kind needs** (from the person's fears):
- *"did it save?"* → never a question — everything saves itself. **The present.**
- *"oops, just now"* → undo — the last few deliberate gestures, this surface, this sitting. **Session memory, never stored.**
- *"I need that back from last week"* → durable doors — trash restores, archive returns, travel remembers, export backs up. **The past.**
- *"gone forever"* → exactly one act (destroy), double-confirmed, from one room. **Irreversibility as a choice.**

**The boundary: whose hand moved?** Yours (an act) · the room's (a reflex: click-lift,
auto-grow) · the system's (a repair: rollback after a failed save). **Only acts are actions.**
Only actions enter undo. This is the ruled deliberate-vs-reflex carve (owner, 2026-09-01).

## Part 2 · The current state, honestly

### Where every act lives today (the complete scatter, verified)

| act | where its logic lives | how it writes |
|---|---|---|
| single drag / resize | `card.tsx` (react-rnd onDragStop/onResizeStop) | → `patchCard` (the debounced door) |
| group drag | `board-surface.tsx` onCardDragStart/Move/End | → `patchCard` per card |
| nudge (arrows) | `board-surface.tsx` nudgeSelected | → `patchCard` |
| tidy-up | `board-surface.tsx` tidySelected (the banded-grid math) | → `patchCard` per card |
| send-to-back | `board-surface.tsx` sendToBack | → `patchCard` |
| **click-to-front (reflex)** | inside `board-surface.tsx` `select()` — embedded in *selection* | → `patchCard` — indistinguishable from a deliberate z act |
| **auto-widen (reflex)** | `card.tsx` (~:151) | → the same `onChange({w})` as a hand resize |
| lock / unlock | `board-surface.tsx` toggleLock | direct db call, **own inline optimistic+rollback** |
| un-place / trash (single+bulk) | `use-board-acts.ts` | direct db calls, **own hardened rollback + evaporate contract** |
| tag / untag | `tag-bar.tsx` | **its own supabase client**, own optimistic+revert, own error copy |
| set / clear source | `source-picker.tsx` | **its own supabase client**, own error handling; card patches VM only |
| creates (8+ doors) | `use-create-doors.ts` (566 lines) | own orchestration + trackCreate |
| duplicate board | `board-surface.tsx` duplicateThis | flushAll → db |
| looking (open/pan/zoom/jump) | camera + pages | no world writes (view memory is per-device; openings are records *of* looking) |

### The grades

**What is genuinely strong — and must not be casually rewritten:**
- **The save substrate (`use-persistence`, 199 lines): A−.** One door, debounced, per-row write
  chains (no reorder on the wire), capture-at-fire with restore-on-failure, flushAll over
  timers ∪ pending ∪ in-flight, the settled-create gate. Hardened by four review rounds; each
  round found real bugs now fixed and comment-documented.
- **The remove acts (`use-board-acts`, 185): A−.** Optimistic with per-failure rollback, the
  already-gone carve, the evaporate contract, the forget() sweep. Same hardening history.
- **The model-side story: A.** Trash/archive/travel/destroy already match Part 1's ideal almost
  exactly. The database has always treated acts as first-class (records of acts).

**What is weak — the honest defects:**
1. **One idea, several hand-made copies — ⚠ CORRECTED by the review.** The original claim
   ("five copies of one idea") was materially wrong in two ways. (a) The persistence door's
   restore path is NOT a copy: `restorePending` deliberately KEEPS the optimistic screen and
   re-queues the write (streamed-position policy), while the discrete acts REVERT the screen and
   report. **Two deliberately different policies, not five copies of one** — the refactor must
   preserve both, named. (b) tag-add and source-pick are *pessimistic* (await-then-paint), only
   their removes are optimistic. What IS true: the discrete revert-on-failure pattern is
   hand-built in `use-board-acts`, `toggleLock`, `tag-bar.remove`, `source-picker.clear`,
   `board-title` — and five MORE times in `use-create-doors` (out of scope, queued). Also: the
   "own supabase clients" jab is cosmetic — `createBrowserClient` returns a singleton.
2. **Intent exists structurally but is recorded nowhere.** Your drag and the click-lift reflex
   converge into the same `patchCard` and become indistinguishable. Worse: the click-to-front
   reflex lives *inside* the selection function — a reflex embedded mid-interaction.
3. **Acts have no names.** The only place an act's name exists is a button's tooltip. Nothing an
   undo button, a log, or a future history could ever read.
4. **The orchestrator does act-logic.** `board-surface.tsx` (538 lines, ceiling ~150) holds tidy's
   geometry, group-drag math, z policy, lock, jump — *logic* living in the *wiring* file.
   `use-create-doors.ts` (566) has the same disease on the making side.
5. **Two write styles with the reason stated nowhere.** Position flows through the debounced door;
   discrete acts (lock/tags/source/removes) write immediately. Both are right (a drag streams, a
   toggle doesn't) — but the rule lives in nobody's head but the code's.

**Verdict: the *behavior* is hardened and trustworthy; the *shape* is five copies of one idea,
scattered across six files, with intent and names missing.** Undo is merely the first feature
that needs what the shape doesn't have.

## Review outcome (2026-09-01) — the AMENDED design

The review's verdict: **the diagnosis is sound, the direction right, and the formal act-object
layer is not earning its weight at ~12 acts** (the door is "discipline with teeth" — a fail-safe
default and a greppable audit — not the structural guarantee Part 3 claims: reverse() is
hand-written either way). The amended design, which the technical plan follows:

- **A pure undo stack** (`undo-stack.ts`, ~70 lines, unit-tested) + a thin React seam
  (`use-undo.ts`). Entries carry a **state — live | failed | dead** — not just closures: undo
  skips non-live; failed never promotes to redo; terminal failures (destroyed-from-trash,
  already-gone) go dead with an honest banner.
- **Closure recording at call sites** — `record(label, bitIds, undo, redo)` — instead of formal
  `{name, do, reverse, guard}` objects. Revisit the formal layer if the create doors ever join.
- **Entries keyed by bitId, placementId resolved at reverse time** (non-negotiable — a
  reconcile rename after capture otherwise splits screen from DB).
- **Two named policies, preserved:** streamed position keeps-and-retries (`restorePending`);
  discrete acts revert-and-report (one small shared `optimistic()` helper collapses the copies).
- **Every position reverse goes through `patchCard`** (coalescing + per-row chains make racing
  reverses safe); `use-persistence` exports **`chain(realId, fn)`** so discrete row writes
  (`setPlacementLock`, `callInBit`, forced moves) join the same per-row chain.
- **Undo-of-unplace:** reuse the captured placementId (the revive is then id-stable), re-apply
  the lock (`unplaceBit` clears it — the review caught that undo would return the card
  UNLOCKED), re-bump the loose column, and **exclude the evaporate/abort path entirely**.
- **Tags/source:** capture the prior source BY ID before the await (new narrow
  `setBitSourceId`); the reverse repaints via a per-bit refresh signal (the bars own their
  state); tag-add undo may strand a zero-count word — accepted, never auto-delete vocabulary.
- **Intent at the one leaky prop:** `onChange(patch, how?: "move"|"resize"|"grow"|"write")` —
  three annotated call sites, no prop explosion; "grow"/"write" route raw.
- **Group acts:** one gesture = one entry built from the patches actually issued (locked +
  no-op skips mirror exactly); per-gesture error coalescing (three failed reverses = one banner).
- **Ship dark:** record from stage 2 with a dev-only readout; ⌘Z + buttons land only after a
  soak. The antagonist's diff-read targets **stage 2** (the riskiest — it owns the group-drag
  ground and the lock bypass), not stage 3.
- **Sequenced first, own commits:** the group-drag fix (done, `a447a95`) + a real `test` script
  in package.json (the stage gates otherwise have nothing to run).
- **Honesty on the ceiling:** `board-surface.tsx` goes 538 → ~330 by this work — ~160 lines are
  JSX and ~60 pointer handlers; reaching ~150 needs a later split (`board-canvas` +
  `board-selected-bar`), queued, not smuggled in.

Defaults taken (flagged, reversible): the already-gone remove entry goes **dead** · tag-litter
**accepted** · global tag/source undo stays in scope with honest labels · undo shows a brief
transient "undid: …" note at the button instead of moving the view.

## Part 3 · The original ideal (kept for the reasoning; superseded by the amendments above)

The code speaks the model's own language. An **act** in code = what it already is in the model:
a named, first-class thing.

```
an act = { name (for the button/log) · do() · reverse() · guard (what refuses it) }
```

1. **Two doors, physically distinct.** Acts pass through the act door — passing through IS being
   recorded. Reflexes and repairs use the raw door and *cannot* be recorded. Intent becomes
   structure, not discipline (the lowest-layer-that-enforces-it doctrine, applied to app code).
2. **One engine, zero copies.** The optimistic-write-rollback pattern is promoted to a single
   shared engine every discrete act uses. Five error styles become one. The engine *delegates* to
   the proven substrate — the debounced door for streamed position, direct db calls for discrete
   acts — so the hardening is kept, not re-earned.
3. **Logic lives with the act, wiring stays wiring.** Tidy's geometry, drag math, z policy move
   into act files; `board-surface` becomes thin orchestration. The ceiling is restored as a
   *consequence*, not a chore.
4. **Undo/redo falls out.** A pure, unit-tested stack (cap 20, per board-visit) consumes acts;
   labels come from act names; completeness is by construction — an act that exists is undoable,
   a reflex cannot enter. Redo mirrors; any new act clears redo.
5. **The future inherits it.** Card colors, arrows, anything the aesthetics phase brings: write
   one act (name · do · reverse · guard) and get save, error handling, rollback, AND undo for
   free — forever.

**What the ideal does NOT do:** rewrite the save substrate's chained-write machinery (kept as the
engine's floor) · touch authoring's flow-undo (tiptap/pen own it, correctly) · make creates
undoable (ruled out) · persist the stack (session memory, the three-layer save ruling).

## Part 4 · The gap — staged, each stage verified

| stage | what happens | behavior change? |
|---|---|---|
| 1 | the act engine + the pure undo stack (own files, unit-tested like camera-storage) | none |
| 2 | arranging acts move in: drag · resize · nudge · tidy · z · lock; reflexes re-pointed at the raw door | none (identical on screen) |
| 3 | keeping acts join: un-place/trash wrap the hardened `use-board-acts` internals | none |
| 4 | meaning acts join: tags + source onto the engine (their private copies die) | none |
| 5 | ↶ ↷ ship: toolbar buttons + ⌘Z/⌘⇧Z, labels from act names | **undo/redo exists** |
| — | `use-create-doors` trim: **its own later pass** — creates are outside undo's scope; bundling it here is the kitchen-sink failure | — |

Each stage: tsc · lint · build · suites green before the next; the antagonist reads the plan
before stage 1 and the diff after stage 3 (the riskiest move). The staged shape means the board
is never half-rewired across a session boundary.

## Open cells (for the technical plan, already ruled or defaulted)

- Scope: every deliberate act **in** (owner: "undo any action") · reflexes/repairs out · creates
  out · destroy never · text/pen flow-undo untouched.
- Trash **in** (undo = restore; redo re-trashes without re-asking).
- Lock yields to undo; the lock stays on after (Claude's default, flagged, unobjected).
- Cap ~20 gestures · per board-visit · leave/reload clears · button labels name the next act ·
  view never jumps (owner-ruled).
- Multi-device: boards don't live-sync; undo adds no new staleness class; liveness guards on
  revive already refuse tombstones.
- ⚠ CORRECTED: the lock is enforced at the **db-module layer** (`updatePlacement`'s
  `.is("locked_at", null)` filter), not by the DB itself — no constraint or trigger exists. The
  undo bypass is therefore a second named db-module door (`movePlacementForced`, WITH a 0-row
  assert), which stays within the layering doctrine. Danger the review exposed: the unforced
  door's silent 0-row no-op means an unguarded undo write to a locked card would move the screen
  and not the DB — silent divergence. The forced door's assert closes it.
