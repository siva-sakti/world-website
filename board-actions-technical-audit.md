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

## Part 2b · The whole body: how a person's doing travels through the code

*(Added at the owner's ask, 2026-09-01: not the organs — the body. A person walks into a board
and does things. Where does their doing enter, how is it understood, and is the listening one
coherent system?)*

A person's action passes through six stages. Verified door by door:

| stage | what it is | where it lives today | health |
|---|---|---|---|
| **1 · entry** — the touch reaches the code | **seven separate doors:** the board's empty space (pointer handlers: pan·pinch·marquee·tap·double-tap) · each card via **react-rnd, a third-party library** (drag/resize) plus the card's own click handlers (select·edit·open) and ~8 stopPropagation shields where inner controls must not become drags · one window keyboard listener · a native wheel listener (zoom) · a window paste listener (`use-create-doors:460`) · drop on the board div · the toolbar's buttons (+ the pen overlay, which captures everything while on) | grown door-by-door | works; never reviewed as a system |
| **2 · recognition** — *what gesture was that?* | hand-rolled, distributed state machines: `pan.current` + a 4px moved-threshold, `lastTap` timing for double-tap, pinch state in the camera, the marquee hook — and **react-rnd's internal thresholds, a black box** we have already fought twice (the controlled-position stutter workaround; the suspected phone tap-swallowing) | distributed | the app's weakest examined layer |
| **3 · meaning** — view or world? act or reflex? | **view vs world is the code's cleanest boundary**: pan/zoom/fit touch only the camera, per-device, never the world — zooming is *looking*, and the code fully honors it. **act vs reflex is its most implicit** — nowhere written until the undo work names it | half clean, half implicit | being fixed by this track |
| **4 · state** | one `cards` array + selection + editing + camera, in the orchestrator | sound shape, oversized file | B |
| **5 · persistence** | the hardened door: debounce · per-row chains · settled-create gate · two failure policies | four review rounds | A− |
| **6 · the database** | the proven schema: RLS, invariants, travel, the regression suite | proof record | A |

**The body-level verdict.** Every review round to date hardened stages 4–6 — *remembering*.
Stages 1–3 — *listening* — have never been reviewed as a system; each gesture was added where it
was needed, one door at a time. And the open phone problems (the tap-swallowing suspicion, the
board-on-phone breakage batch) live exactly in stages 1–2, the unreviewed half. The weight of
rigor has all gone to the bottom of the pipeline; the person touches the top.

**Honesty about the shape:** distributed, hand-rolled gesture handling is how most canvas apps
are actually built — the shape is not wrong, it is *unexamined*. The one genuine structural
oddity: the app's single most important gesture — the drag — is outsourced to react-rnd, whose
internals we cannot see and have twice had to work around. Mature canvas apps almost all end up
owning their drag. **Named fork, evidence-gated:** if the owner's phone check confirms taps are
being swallowed by the library, the right restructuring is our own pointer-based drag/resize
(stages 1–2 become ours, one recognizer, phone-first) — a real project, entered on evidence,
never speculatively. Until then, the undo track fixes stage 3, and stages 1–2 stay as they are,
now at least *mapped*.

## Part 2c · The seeing machinery: how what's on the board gets rendered

*(Added 2026-09-01 — the display half, read file-by-file: `card.tsx` in full, `text-bit.tsx`,
the render body of `board-surface.tsx`, `lib/storage.ts`.)*

### The pipeline

1. **Server assembles** (`board/[id]/page.tsx`, force-dynamic): the `board_cards` view join →
   one signed storage URL per media card (1-hour TTL, `storage.ts:34`) → `CardVM[]` as props.
2. **The world is DOM, not `<canvas>`**: one div carrying `translate(cam.x,cam.y) scale(cam.scale)`;
   every card an absolutely-positioned `react-rnd` at world coordinates, `zIndex: card.z`
   (monotonic ints, unbounded, fine). Hit-testing is the browser's — elegantly:
   `.compose-world { pointer-events:none }`, `.compose-card { pointer-events:auto }`, so empty
   space falls through to pan and cards catch their own input.
3. **Per-type rendering** (`card.tsx`): text = a tiptap editor; note = a computed doorway
   (title + body-plaintext preview, never editable on canvas — N3/D-121); image/pdf/link =
   `<img>` + a degrade ladder; audio = the native element (with a stopPropagation shield so the
   scrubber doesn't start a drag); drawing = `DoodleBit` SVG from strokes.
4. **Two coordinate spaces already exist, cleanly**: the camera-transformed WORLD (cards,
   marquee math) vs the SCREEN band (toolbar · selected-bar · drawer · pen overlay · notices) —
   the exact split a future panel system needs, already proven by the drawer.

### Senior findings — what bends under the coming load

- **F1 · Every text card mounts a FULL tiptap instance, always.** `text-bit.tsx:67` calls
  `useEditor` unconditionally; "editable only while editing" is implemented as
  `setEditable(false)`, not as not-mounting. N text cards = N live ProseMirror docs. Invisible
  at dozens; the first perf cliff at hundreds — *before* raw DOM count. Fix when felt: render
  static HTML at rest, mount the editor only for `editingId`. Named, not built.
- **F2 · The dragged card is uncontrolled mid-drag** (deliberate — the controlled-position
  stutter workaround). Consequence: **nothing else can visually track a card while it is being
  dragged.** The moment bit-to-bit ARROWS exist, their endpoints freeze mid-drag and snap on
  drop. So owning the drag is load-bearing for connectors — a second, independent reason beyond
  the phone (the group-drag path already mirrors positions through state per-move, proving live
  mirroring is feasible; react-rnd is the obstacle, not React).
- **F3 · Card geometry is not fully in state.** Text/audio cards store `height:auto`; the real
  height lives only in the DOM (tidy already has to query `[data-pid]`). Anything that anchors
  to a card's EDGES — arrows, snap guides, a minimap — needs real boxes. The unifying fix is a
  small **geometry registry** (each card reports its measured world-box via ResizeObserver; one
  ref-map, cheap): arrows, tidy, fit, and placement-anchor all read one truth instead of four
  ad-hoc measurements.
- **F4 · No viewport culling** — every card renders regardless of visibility. Correct at
  one-writer scale; the second cliff after F1. Trigger: a board that feels heavy, or ~150+ cards.
- **F5 · Signed URLs expire at 1 hour** — a board left open past TTL shows broken media on the
  next re-render. Minor (already-painted `<img>`s keep their pixels); worth a refresh-on-error
  someday.

### The ideal, sized for what's coming

The two named loads: **notes as composition surfaces within a board** (brought in · composed on ·
shown/hidden in a side or floating panel) and **bit-to-bit links**.

- **Name the two spaces as the architecture.** WORLD (cards · a future arrows layer · the
  camera) and SCREEN (toolbar · drawer · panels). Everything below follows from it.
- **The note panel is a SCREEN-space thing, and the drawer is its proven ancestor.** Generalize
  the drawer into the panel: dock-right or float, hosting the *same* note workspace the `/note`
  page uses. **No new model**: the placed note stays a placement rendering as a doorway; the
  panel is a *view* of the note. Panel-open state is view-state (per-device, like the camera),
  never world-state.
- **Composing ON the canvas is already proven feasible** — `text-bit` runs editable rich text
  under the camera transform today. If a note ever composes in place, it is the same machinery
  behind a kind='note' guard (D-121 holds: born a note, never converted; the doorway stays its
  resting form).
- **Links need three things, in order**: the geometry registry (F3) → live dragged-position
  (F2, own-drag or a mid-path: keep rnd but mirror the dragged card's `onDrag` into a
  ref-driven overlay) → then the arrows layer itself is small: world-space SVG between world
  and cards, endpoints derived from the registry.
- **The maturity track, each step evidence-gated:** editor-mount-on-demand (F1, when a board
  feels heavy) · geometry registry (F3, when links get ruled in) · own-drag (F2, when links land
  OR the phone check convicts react-rnd) · culling (F4, last).

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

## Part 5 · THE COMMITTED TARGET (2026-09-01 — the owner delegated the call; Claude ruled)

The owner's spec, verbatim in spirit: *"it doesn't need to be cheap … what's important is that
this all goes together right … really good architecture and code to help this vision."* The
ruling, made and owned by Claude under that delegation:

**The board becomes six layers, and we commit to owning the one we rent.**

| layer | the commitment |
|---|---|
| 1 · input | **ours** — one gesture engine (tap · double-tap · drag · resize · pan · pinch · marquee), phone-first, replacing react-rnd. Rationale: three futures converge on it (phone taps · live-tracked drags for arrows · the two workarounds already paid). Pan/pinch/marquee/taps/group-drag are already our code — only single-drag + resize handles are genuinely new. |
| 2 · meaning | the act layer (the amended undo design): every deliberate gesture a named, reversible act |
| 3 · geometry | the registry — every card continuously reports its real world-box; arrows/tidy/fit/snapping read one truth |
| 4 · state | the cards array, as is |
| 5 · persistence | **untouched** — the hardened machinery stays (plus the reviewed `chain()` export) |
| 6 · seeing | DOM world stays; world/screen split formalized; the drawer generalizes into the PANEL hosting a note's workspace (docked/floating) — notes-in-board is a view, not a model change |

**Sequence (each step stands on the last):** undo → geometry registry → own the input layer →
the note panel → links. Editor-on-demand + culling stay evidence-gated (performance, not
architecture).

**The held risk:** input-feel regression. Mitigation: the new engine ships behind a switch,
side-by-side with react-rnd for one sitting; the owner feel-tests desktop + Daylight + phone;
only the owner's hands retire the library. The pending phone tap test informs urgency, not the
decision.

