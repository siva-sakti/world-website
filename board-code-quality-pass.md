# The board code-quality pass — the record

**What this was (owner's framing, 2026-09-03):** *"essentially my pass with you where we finished
board"* — the sitting that took the board from working-but-messy to a sound floor, before the
feature wave. Named for the board because that is where the weight fell (the remove acts, the card,
the create doors, the surface itself), though the doors it produced are app-wide.

**What it is NOT:** the top-to-bottom senior review that comes next. That one asks *what could be
built better* across the whole app; this one fixed what was already known to be wrong.

**Status: 🟢 in progress.** Written 2026-09-02. Feeds the two file-size splits queued in
`PROGRESS.md` (D-140) and clears the ground for the frame build + geometry stage 4.

**Why now (the owner, 2026-09-02):** *"I have a good number of small features I'm wanting to bring
in plus the frame build and the snapping grid stuff — so now is a good time to make sure we have
clean code for the basis for these fine tunes."* This is a foundation job, not a feature. Success
criterion: **every gate still green, and no behaviour changed except where this document names the
change and the owner rules it.**

---

## 1. The baseline (measured before anything was touched)

| Gate | Result |
|---|---|
| `pnpm typecheck` | clean |
| `pnpm lint` | 0 errors, 4 warnings (pre-existing `<img>`, untouched) |
| `pnpm test` | 48/48 pass |
| `pnpm build` | passes |

Every stage re-runs all four. A stage that reddens a gate is reverted, not patched forward.

**The coverage picture governs this whole plan.** `pnpm test` runs `node --test 'src/**/*.test.mjs'`.
Only **pure** modules have tests. In the board directory: 4 files of 21 (`board-arrange`,
`camera-storage`, `geometry`, `undo-stack`). In `src/lib/`: **one** (`recent.ts`). Every `.tsx`,
every `use-*.ts` hook, and all of `src/lib/db/*` are verified by eye only. The four tested board
files are also the only four under the 150-line ceiling — not a coincidence, and the lesson this
plan acts on.

---

## 2. What the audit found

Three read-only audits (board directory · shared `lib/` + `components/` · the other app surfaces)
plus my own reading. ✓ = I re-verified the claim by hand before acting on it.

### 2a. The named files

- **`board-surface.tsx` — 670 lines, ~8 jobs.** Not duplicated; overloaded. Card state, selection,
  edit mode, the undo-receipt timer, duplicate-board orchestration, open-selected navigation, the
  group-drag handlers, nudge/tidy/lock/send-to-back, the pan-pinch-tap pointer machine, and the JSX.
- **`use-board-acts.ts` — 385 lines.** The four remove acts are one act written four times. ✓ I
  diffed them: the trash legs in `trashSelected` and `bulkTrash` are character-identical apart from
  variable names; the un-place legs differ only in loose-column bookkeeping. **Singular is bulk with
  one card** ✓ — and the DB enforces one placement per (board, bit) (`placement_bit_once`, migration
  line 360), which makes that equivalence safe rather than assumed. ✓
- **`use-create-doors.ts` — 511 lines** (larger than the file the plan named; same neighbourhood).
  The three `onPick*` handlers are the same 8 lines three times, differing in two tokens each. ✓
- **`lib/db/bits.ts` — 506 lines, five jobs** (creates · placement geometry/lock · resting wrappers ·
  destroy+storage · five reads). The single biggest ceiling violation in the codebase.

### 2b. Twins that have already drifted

| # | The twin | Verified |
|---|---|---|
| **T1** | The card default-size ladder, twice, **disagreeing**: `page.tsx:86-87` vs `use-create-doors.ts:437-438`. Heights match in all six branches; **widths differ in two** — text `240` vs `400`, audio `260` vs `300`. `createTextCard` hardcodes `400`, so `page.tsx`'s `240` matches nothing the app creates. | ✓ |
| **T2/13** | The signed-media branch table, 5 copies (`board/page.tsx:46-75`, `use-create-doors.ts:449-463` — identical ✓; `bit/[id]/page.tsx:54-77` deliberately different; `storage.ts:79` + `drawer.tsx:158` narrower). | ✓ |
| **L2** | `card.tsx` renders the same blocks twice, **byte-identically**: the "from …" source line (`:277-291` / `:402-416`) and `<SourcePicker>` (`:296-303` / `:387-394`). | ✓ diff |
| **L5** | The survivor rule written twice — `use-board-acts.ts:131-138` (`allLegs`) and `use-arrange-acts.ts:69-81` (`applyAll`). Both comments credit the same ruling; the second says "reused here" and then copies the code. | ✓ |
| **T3/T4** | `MIN_ZOOM`/`MAX_ZOOM` declared twice and the clamp re-inlined 5×; `centerOn` re-implements `anchorToCamera`, whose own comment says it is "the same math centerOn uses". The duplication sits *outside* the tests that already cover `camera-storage.ts`. | |
| **T7** | `"that card no longer exists on this board"` — thrown 5×, substring-matched 2× where the match drives undo's dead-vs-retryable classification. `lib/db/bits.ts` throws *different* wording the same check catches by luck. | |
| **9** | `attachTags` byte-identical in `db/search.ts:87-109` and `db/inbox.ts:70-91` (24 lines, two variable names differ). This is the chunk/paging logic two prior reviews had to fix once — two copies means fixing it twice next time. | |
| **11** | `listTrash` (`db/boards.ts:189`) and `listArchive` (`db/resting.ts:41`) differ only in view name, column and output key. The trash listing also lives in a *boards* module. | |
| **12** | `pinGroup`/`pinBoard`/`pinBit` — three identical bodies differing by table name. `setResting` already proves the `thing: "bit"\|"board"` pattern; `pinned_at` never got it. | |
| **3** | `boardLabel()` exists and is used in 6 places; 7 other sites inline `\|\| "untitled board"`. Six are drop-in identical (`boardLabel` additionally trims, a strict improvement). | |
| **HTML strip** | The tag-stripping regex, 6 copies, in **three different variants** — two normalise whitespace, two don't, and `quick-write.tsx:68` replaces with `""` not `" "`, joining words across tags. A naive merge changes behaviour. | ✓ |

### 2c. Dead code (each verified by whole-`src/` grep ✓)

- `BitArchive` — `bit/[id]/bit-controls.tsx:166-214`, 49 lines, zero importers ✓
- `archiveBit` in `lib/db/bits.ts:370-377` — reachable only from `BitArchive` ✓
- `listInbox` + `InboxItem` — `lib/db/inbox.ts:12,103-106` ✓ (`PanelBit` there is live — don't touch)
- `SearchablePicker` props `onCreate`, `resetOnPick`, `className` — no call site passes any ✓;
  `onCreate` gates a "Create '…'" row that can never render
- `card.tsx:42` `handleStyles(size, hit = size)` — both call sites pass `hit`
- Over-exported (compiler-verifiable): `searchBits`, `escapeHtml`, `PRIVATE_BUCKET`, `UploadArgs`
- Dead type fields, zero reads: `Bit.subtype_word_id`, `BoardCard.subtype_word_id`,
  `BoardCard.target_visibility`, `Bit.visibility`, `Placement.display_size`, `BoardCard.display_size`
- `uploadObject`'s return value — discarded by all 11 call sites

**Verified NOT dead, don't chase:** all 226 CSS classes in `globals.css` are referenced.

### 2d. NOT dead — deliberately staged. Do not delete.

`geometry.ts:29-97` (`snapTo`, `SnapResult`, `Guide`, `lines1D`, ~69 lines) has no app consumer,
only tests. **An audit flagged it as dead code. It is not** — it is the maths for geometry stage 4,
the magenta snap guides, which `PROGRESS.md` lists as the owner's very next build. Deleting it would
throw away finished, tested work days before its consumer lands.

### 2e. Changes the user would SEE — quarantined for an owner ruling

1. **Four divergent search haystacks.** `/search` omits `face`; `/bits` omits `file_name`; **the
   drawer omits `content`, `body`, `captured_title` and url-words entirely** — you cannot find a bit
   in the drawer by anything it says. All four share the same matcher; only the haystack differs.
2. **Seven tables for the six type nouns.** `drawing` reads as sketch / sketches / drawings / doodle
   depending on the room. `outline-row.tsx:10` has no `audio` branch, so an audio bit's badge says
   `audio` in `/outline` and `recording` on `/bits`. `search-live.tsx:18` says "doodle", which
   `lexicon.md` governs as a *subtype* word — a live terminology collision.
3. **`archiveBit` is two different functions.** `db/bits.ts` asserts the row count and throws;
   `db/resting.ts` does not. Archiving from the note page surfaces a stale-row failure; **archiving
   from the home row silently does nothing.** Same family: `trashBit`/`destroyBit` assert,
   `trashBoard`/`destroyBoard` don't.
4. **T1 widths** — unifying changes the rendered size of legacy null-width rows. Heights-only is safe.
5. **Five links hardcode `/bit/[id]` for things that may be notes**, relying on a server redirect.

---

## 3. Scope

**Tier 1 + Tier 2 are this pass. Tier 3 is a separate sitting** — it changes what the owner sees,
and each item deserves a ruling rather than being smuggled in under "cleanup".

### Tier 1 — the named files

| # | Step | Payoff | Risk |
|---|---|---|---|
| 1.1 | **Safety net first.** Lift the pure decision logic into tested functions: the survivor rule (L5), the label builder, the confirm-message builder, `findClearSpot`'s maths. Tests before any merge. | makes 1.2 provable | none (additive) |
| 1.2 | **`use-board-acts.ts` → one gesture runner.** Four forward paths → one parameterised path; `trashOne`/`restoreOne` as the missing siblings of the existing `unplaceOne`/`reviveOne`. | 385 → ~200 | **highest here** |
| 1.3 | **`board-surface.tsx` splits, verbatim moves only.** `use-board-pan.ts` (pointer machine) · `selected-bar.tsx` · `use-card-drag.ts` (group drag + nudge) · `applyLock`/`toggleLock` home to `use-arrange-acts.ts` (which already owns `recordLock`) · `duplicateThis` to the acts layer. | 670 → ~330 | low |
| 1.4 | **`use-create-doors.ts`**: three pick-handlers → one `pick(dims, importer)`; `findClearSpot` maths → `board-arrange.ts`. | ~25 lines + a tested rule | low |
| 1.5 | **`lib/db/bits.ts` → three modules** (bit rows · placement acts · reads). Pure move; named imports, so the compiler catches a miss. | 506 → 3 files | low |

**On 1.2 — where I disagree with one of my own auditors.** It recommended leaving this code alone:
densest bug-fix comments in the directory, zero tests, ~40 lines of payoff. Sound for an
extraction-only nibble; wrong for the full collapse. The payoff is ~185 lines, not 40, because
singular collapses into bulk. And the real point: **the reason this code is dangerous is that it is
untested, and "don't touch it" leaves it untested forever** — right before a feature wave lands on
top of it. `CLAUDE.md` already rules on this: *"Hard to test is a signal about the design, not
permission to skip."* Hence 1.1 before 1.2. If the owner prefers caution, 1.2 drops and the rest stands.

### Tier 2 — the free wins (byte-identical or compiler-verified; no behaviour surface)

- `card.tsx`: twin `SourceLine` + twin `SourcePicker` → one each (~30 lines) ✓ diffed
- Delete the verified dead code in §2c (~90 lines), which also removes the `archiveBit` name collision
- `resolveCardMedia()` shared by `board/page.tsx` and `bringIn` (~30 lines)
- `defaultCardSize()` — **heights only**; widths held for the owner's ruling
- Export `clampScale` + the zoom constants from the tested `camera-storage.ts`; route `centerOn`
  through `anchorToCamera` (preserving its null-ref guard)
- One `stripHtml` in `lib/html.ts` — **keeping `quick-write.tsx`'s empty-string variant separate**
- A `CARD_GONE` constant for the magic string; **wording unchanged** (the match is load-bearing)
- `CardVM` out of the 500-line `card.tsx` into `card-vm.ts` — 9 modules import a component file for a type
- `tagsByBitId()` in `db/tags.ts` replacing both copies of `attachTags`
- `setPin(thing, id, on)` mirroring `setResting`; `listTrash` → beside `listArchive`
- `boardLabel()` at the 6 drop-in sites (not `board-title.tsx:75`, which appends "— name it")
- Storage path builders in `lib/storage.ts`, which also make the audio orphan sweep exact

### Tier 3 — its own sitting, needs rulings

Everything in §2e, plus the large structural merges: the busy/failed action-button scaffold (9
copies, ~100 lines — but two variants deliberately keep `busy` sticky while navigating, which a
shared hook must preserve as an option); `tag-manager` + `source-manager` being the same screen
twice (~120 lines); `BitTitle` + `BoardDescription` (~50 lines, and the comments there record real
past data-loss bugs); the drawer's four jobs (358 lines); the loose-vs-board upload ladder — where
the loose audio door's orphan sweep **misses a partially-landed upload** that the board's blunter
version catches.

---

## 4. How each stage is proved

1. All four gates green after **every** stage, not just at the end.
2. Every "these two are the same" merge shows its diff before merging, or it doesn't happen.
3. For 1.2, the owner's hands on the real board: **four gestures × undo × redo** — remove one card,
   remove several, trash one, trash several, each reversed and re-applied. The tests cover the
   decision logic, not the Supabase round-trip; no automation substitutes for this.
4. Anything that can't be proved is reported unproven, not done.

---

## 5. Owner rulings (2026-09-02)

1. **Card widths — RULED: standardize to one table**, using the values the app actually creates
   (`400` text, `300` audio). *"I think we have a design and UI pass coming later where I'll be a
   lot more specific about card size and auto size and different options for backgrounds."* So this
   is a consolidation, not a design choice — the real sizing decision is a later pass.
2. **The silent resting acts — RULED: fix, pulled forward.** ✅ Done (stage B1). See §6.
3. **Search consistency — RULED: DEFERRED, with a reason.** *"I think we need to realign on search
   after we've decided what composition surfaces are — the fact that they're not bits, they're their
   own thing. Maybe we do that after building the composition surface."* Fixing search before that
   ruling would mean doing it twice. **Re-entry: after composition surfaces are built.**
4. **The type words — RULED: SPLIT IN TWO.** The owner's correction, which changes the finding:
   *"a drawing can be a doodle — I'm doing something cute. It can be a drawing like I'm sketching the
   way a cell looks. It can be a drawing like I'm drawing out the form of a fashion piece. These are
   all valid."*
   - **(a) The file kind** (audio vs recording, pdf vs PDF) — meaningless inconsistency. **Fix.**
   - **(b) What the owner CALLS it** (doodle · sketch · drawing) — a real vocabulary, not drift.
     **Do not flatten. Do not touch.** The schema already has the mechanism: `bit.subtype_word_id`,
     unused so far — and one of the two things this pass REFUSED to delete when an audit called it
     dead code. The feature the owner just described already has its field waiting.
5. **Structural duplication — RULED: in scope.** *"I don't want to have duplicates of things."*
   Sequenced last (it touches the save paths, where the comments record real past data-loss bugs).
6. **Bit/note links — RULED: just fix it.** Verified the owner's intuition is correct: a note IS a
   bit row with `kind = 'note'` (one column, `20260825000002_kind_and_folder_stars.sql:11`). Same
   table, same row. So this is not a design question — the links simply forgot to check the column.
   Three of the five sites already have `kind` in hand; the other two need it added to one query
   (`references.ts:146` selects `id, face, type, state` — no `kind`).

7. **Put-away should reach EVERY bit — RULED (2026-09-02), queued as a feature, not this pass.**
   *"Every bit should be able to be put away — and by put away we mean archiving and/or trash. They
   should all be treated the same way. It should be simple, moving throughout the whole app, for it
   to be the same way."* Today only boards and notes carry the control; a photo, recording or PDF
   has no put-away door at all. **This is a feature ask** (new UI in several rooms), so it does not
   ride inside a no-behaviour-change refactor. Queued behind the composition-surface work per §5.8.
8. **Sequence — RULED:** *"I want a sequence — the cleanup you're doing now, and then all of this
   composition surface stuff."* Cleanup finishes first. Composition surfaces follow. Search
   consistency (§5.3) sits after those, as ruled.

9. **The 150-line ceiling — RELAXED by the owner (2026-09-02):** *"I think it's OK if they're like
   big files… let's see what makes sense."* **This changes the split rationale, and shrinks it.**
   Chasing a line count invents seams that aren't real and spends risk on nothing. The test becomes:
   *does this file hold jobs that change for different reasons?* Revised verdicts:
   - **`use-board-acts.ts` — still collapse.** The problem was never length; one act is written four
     times. Worth it if the file stayed 385 lines. ~200 is a side effect, not a target.
   - **`use-create-doors.ts` — still split.** "Make a new thing" and "call an existing thing onto
     this board" are genuinely different jobs. Real seam, plus the three near-identical importers.
   - **`board-surface.tsx` — split LESS than planned.** Extract only the pan/pinch/tap machine (a
     self-contained gesture state machine) and the selected-card bar (pure presentation). **Drop the
     card-drag extraction**: those handlers are entangled with board state deliberately, and moving
     them buys a smaller number and nothing else. Lands ~450-500, not ~330 — and that is the RIGHT
     answer: an orchestrator wiring a dozen hooks is legitimately a long file.

## 5c. Honest confidence + the compromises (stated 2026-09-02, owner asked directly)

**All four gates are STATIC** — types, lint, unit tests over pure functions, and a build. None of
them opens the app. Green gates mean internally consistent, not "works".

| Change | Confidence | Why |
|---|---|---|
| Stage A dead code | High | Nothing referenced it; grep + compiler both agree |
| CardVM move | High | Type-only; the compiler proves it |
| card.tsx / media merges | Medium-high | Copies read and confirmed identical; failure mode is loud + instant |
| **Archive fix (B1)** | **Medium — the real gap** | Verified by reading + the RLS policy + reasoning. **Never executed.** No test can cover it here |
| **Card widths (B2)** | **Medium — visible, unseen** | Owner-ruled, correctly implemented, but never looked at on screen |

**The four compromises, named:**
1. **The archive fix has no test.** The suite only covers pure functions; anything touching the DB
   has none. Building that infrastructure = new tooling + a new pattern = needs the owner's approval.
2. **User-facing words were written by Claude** (three error sentences) — the owner's job by her own
   norms. Parked on the §5b checklist.
3. **The card-width change is visible and unverified visually.**
4. **Concurrent session** committing docs onto this branch (harmless so far, but real).

## 5b. The wording checklist (owed — one copy pass, in the owner's voice, later)

Approved to proceed with placeholders now and sweep them together later: *"as long as you write down
the wording and you have a checklist and we can move through it later, I'm happy with that."* Every
user-facing sentence this pass wrote or changed, so none is lost:

| Where | Sentence now | Note |
|---|---|---|
| put away / trash a vanished thing | "that no longer exists — reload" | **Changed.** Was "that *note* no longer exists — reload"; the noun was dropped because one sentence now serves bits AND boards, and "note" was wrong for a board. |
| restore from trash | "that's no longer in the trash — it may have been destroyed" | Unchanged, kept verbatim. |
| take back out of the archive | "that's no longer in the archive — it may have been taken back out" | **New.** No sentence existed — this path failed silently before. |

Not in scope for that sweep but noted by the audit: **five different spellings of "nothing matches"**
across home, the drawer, `/bits`, `/outline` and `/search`.

## 5d. The drawer's "where" filter — owner's question, 2026-09-02 (answered, not yet acted on)

**Nothing is broken and nothing needs building** — but the default is narrower than the
owner's mental model, and the owner spotted it.

Today's four scopes (`drawer.tsx:106-107, 226-231`): **unplaced** (default; `boards.length === 0`
— on NO board anywhere) · **this board** · **other boards** · **anywhere**.

The owner's model: *"the active display is stuff that's not placed anywhere on THIS board, while
we're on the board."* That set is **unplaced ∪ other boards** — and no single option produces it.
Seeing everything you could bring in currently means flipping between two settings.

**The owner's logic check is sound, and worth writing down:** a bit lives on many boards (one
placement each) but on any given board only once — so "can I bring this in?" is exactly "is it not
already here?". Every bit is in one of three buckets: loose · already on this board · on other
boards but not this one. First and third are fair game; only the middle isn't. The
one-placement-per-board rule doesn't complicate the question — it is what makes it answerable. The
excluded case is already handled: an already-here row is marked "on this board" and clicking it
glides the camera to it (`onJumpTo`) instead of placing a duplicate.

**Proposed (owner's call — a behaviour change, not cleanup):** add a fifth scope **"not on this
board"** = `!onThis(n)`, and make it the default. Alternatives: add it without changing the
default; or rename "unplaced", which reads looser than it is.

## 5e. Stage E — the last piece: the two named files (plan, 2026-09-02)

**Rationale reset (owner relaxed the 150-line ceiling, §5.9): split where a file holds jobs that
change for DIFFERENT REASONS, never to hit a number.** Line counts below are consequences, not targets.

### `use-create-doors.ts` (503) — three moves, safest first

| # | Move | Why it is a real seam | Risk |
|---|---|---|---|
| **E1** | three `onPick*` handlers → one `pick(dims, importer)` | the same 8 lines three times, differing in two tokens ✓ diffed | very low — 3 call sites, wired to 3 `<input>`s |
| **E2** | `findClearSpot`'s MATHS → `board-arrange.ts`, pure + tested | it is nearly pure already; the look-then-place rule ("prefer a spot fully IN VIEW", the 24-step cascade, MARGIN 12) is today verified only by dropping files by hand | low — impure parts (getBoundingClientRect, screenToWorld, sizeOf) stay at the call site |
| **E3** | `bringIn` → its own module | **"make a NEW thing" and "call an EXISTING thing onto this board" are different jobs.** bringIn is the only door that reconciles a server-renamed placement id, and the only one that can find a card already rendered under the real id | medium — the id-reconcile + twin-drop logic is subtle |

### `board-surface.tsx` (689) — two moves, and only two

| # | Move | Why | Risk |
|---|---|---|---|
| **E4** | the selected-card action bar → `selected-bar.tsx` | pure presentation; five acts passed in. Zero logic travels | very low |
| **E5** | the pan / pinch / double-tap machine (`:421-479`) → `use-board-pan.ts` | a self-contained gesture state machine over two refs (`pan`, `lastTap`) + `isPanning`. Same shape as `useMarqueeSelect` and useCamera's pinch trio, which already live in their own files | **medium — the riskiest left** |

**NOT doing (dropped deliberately):** the card-drag / move-together handlers. They are entangled
with board state on purpose; extracting them buys a smaller number and nothing else.

**E5's specific hazard, named up front:** the pointer machine encodes ORDERING that is load-bearing
and was bug-fixed before — a second finger must abandon any in-progress marquee (`:429-436`, "its
anchor must not be stomped"); a pinch owns the move; a marquee owns the move before pan does; a
finger lifting out of a pinch is never a tap; the double-tap test is scale-relative (`28 / cam.scale`).
The extraction must move these VERBATIM and preserve their order exactly.

**Expected landing:** `board-surface.tsx` ~500-550, `use-create-doors.ts` ~380. Both still large,
both legitimately so — an orchestrator wiring a dozen hooks is a long file, and that is fine now.

**Proof per step:** the four gates after EVERY move + a named flow trace.

### ⛔ E5 IS CANCELLED — do not extract the pointer machine (2026-09-02)

An independent adversarial review of the planned extraction recommended against it. **I verified
its central reason rather than taking it on trust, and it is correct — in fact stronger than stated.**

**The reason that decides it:** `board-actions-technical-audit.md:355` (layer 1 of the committed
six-layer target, D-135) rules the next board step as *"one gesture engine (tap · double-tap · drag ·
resize · pan · pinch · marquee), phone-first, replacing react-rnd"* — and says outright:
**"Pan/pinch/marquee/taps/group-drag are already our code."** Those four handlers ARE that work's raw
material. `CLAUDE.md` carries the same ruled sequence: undo → geometry → **own the input** → note
panel → links. Extracting them into a pan-only hook now builds scaffolding the input engine deletes.

**The supporting reasons:**
- **The interface would be bigger than the code:** 58 lines out, ~14 arguments in. Every argument
  converts a variable the compiler tracks for free into a prop that must be threaded correctly.
- **It barely moves the number:** 689 → ~631 (8%), and the line ceiling is no longer the motive (§5.9).
- **No safety net.** Nothing in the repo tests these handlers, and the failure modes are invisible to
  `tsc`, to `build`, and to a desktop mouse. Two need a touch device.

**The specific trap it saved me from:** moving handlers into a hook invites wrapping them in
`useCallback`. That would break them PARTIALLY — the ref-reading half (tap position, all pinch
behaviour, the marquee box) keeps working while the state-reading half (`cam`, `selectMode`, `cards`)
silently freezes at mount values. Partial correctness is the hardest kind to diagnose, and neither
TypeScript nor the linter would have caught it.

**Also recorded from that review, for whoever builds the input engine** — the load-bearing ordering
these handlers encode: `pinchMove` must run FIRST and unconditionally (it books-keeps finger
positions even when it returns false; demote it and a second finger landing mid-pan snaps the world);
the `e.target !== boardRef.current` guard belongs in Down ONLY; `marquee.cancel()` not `end()` in the
pinch branch (`end` clears the selection); the 4px dead zone must precede the `moved` flip or
double-tap-to-create dies intermittently; `scheduleSave()` also clears `justFitted`, so the ⊹ button's
snap-back depends on it.

**Stage E therefore ends at E4.** `board-surface.tsx` lands at 651 — a long file, legitimately: an
orchestrator wiring a dozen hooks is what it is, and the ruled input work will reshape it properly.

## 6. Done so far

- **Stage A** (`6d561f1`) — 96 lines of verified dead code deleted, incl. the two-functions-one-name
  `archiveBit` trap. Kept deliberately: `snapTo` (staged for geometry stage 4) and the row-mirror
  type fields.
- **Stage B1** (`862d0f3`) — no resting act can fail silently. `setResting` now throws on a 0-row
  update, so all 9 paths carry the assert instead of 3 of them. RLS verified permissive first, so
  the new throw cannot misfire on a live thing. **Owner hand-test still owed:** put a note away from
  the home screen, take it back out from `/archive`.
- **Stage B2** (`7eb19b8`) — the drifted card tables closed; `CardVM` freed from the 500-line
  component; `card.tsx` twins merged.
- **Stage C** (`eb7d7dd`) — the safety net: `act-rules.ts` + 16 tests. The survivor rule, written
  twice in two files, becomes one tested function.
- **Stage D** (`9e3de3b`) — the four remove acts collapse into one gesture (385 → 295), with the
  equivalence written out first in `collapse-equivalence.md`.
- **Stage D2** (`432918d`) — the collapse gets REAL tests: doors injected, `test-resolve-ts.mjs`
  added (test-only), 19 tests covering all four gestures × undo × redo, the rollbacks, the
  refused-flush carve and the J1 survivor rule. Suite 64 → 83.
  **✅ OWNER-VERIFIED ON THE REAL BOARD (2026-09-02):** *"yes, everything is working. I just took
  the whole test. It all works perfectly."* All six walkthrough steps — remove one / remove several /
  trash one / trash several, each with undo and redo, plus the drawer's loose column and a locked
  card returning still locked. **This is what took the collapse from ~75% to verified**; the tests
  cover the logic, this covered the real database round-trip, real batching and real timing.

**Flagged for the owner, not acted on:** `useBoardActs` is named like a React hook but is not one
(no hooks inside — which is exactly why it became testable); its siblings `useCreateDoors` and
`useArrangeActs` really are hooks. eslint's rules-of-hooks fires on the NAME. Renaming is a
signature change → the owner's call.

---

## 7. THE DOORS (owner ruling, 2026-09-02) — the follow-on phase

**The owner:** *"I would love doors for each of these things — to me that's part of cleanup,
that's part of DRY principles… my guess is it's actually pretty straightforward as long as you
check the codebase and we run through it, and at the end I can run tests for all of these."*

**What a door is** (the app's own word — "the one door", "the settled door", "the create doors"):
*one place that decides one thing, that everywhere else goes through.*

**The test for whether something IS one:** *if I changed it in one place, would I want it changed
everywhere?* Yes → one decision written many times; it will drift; make it a door. No → different
decisions wearing the same clothes; merging destroys real information.

### Built already
- ✅ **The archive question** (`app/archive/archive-confirm.ts`) — was 2 places.
- ✅ **The trash question** (`app/trash/trash-confirm.ts`) — was **5**, in three nouns.

### The queue (counts re-verified 2026-09-02, not taken from the audit)

| # | Door | Copies today | Kind | Risk |
|---|---|---|---|---|
| **D1** | the button that goes busy, then says "failed — try again" | 7 handlers in 4 files, plus `act()` in home-surfaces and `run()` in shelf-controls — the same shape under 3 names | machinery | low |
| **D2** | "save my work before I leave" (`registerSave` + commit-on-unmount) | **10 files** | machinery | **highest — every copy carries a bug-fix comment about phones backgrounding; needs the owner's phone to prove** |
| **D3** | the words for file kinds (`audio` vs `recording`, `pdf` vs `PDF`) | 6+ tables | **WORDS — owner's** | low once ruled |
| **D4** | where uploaded files are stored (`images/${id}.jpg` ...) | 16 sites in 3 files | machinery | low |
| **D5** | remembering a collapsed panel in local storage | 4 (excluding `jot-draft` + `camera-storage`, which are tested and genuinely different) | machinery | low |
| **D6** | the empty-state sentences ("Nothing matches" x5, "Nothing here yet" x2) | 7 across 5 files | **WORDS — owner's** | low once ruled |

**Order:** D1 -> D4 -> D5 -> D3 -> D6 -> **D2 last** (riskiest, and the only one needing a phone).

### Two questions the owner must answer (they are copy, not code)

1. **D3 - which word wins per file kind?** Claude will not choose these. Note the trap: the *badge*
   word (what KIND of file this is) must stay separate from the owner's **doodle / sketch / drawing**
   vocabulary, which is expressive and was ruled untouchable (§5.4b). Proposal, to veto or replace:
   image -> "image" - audio -> "recording" - pdf -> "PDF" - drawing -> "drawing" - link -> "link" -
   text -> "text".
2. **D6 - the empty states.** These are TWO different situations currently blurred together:
   *"you have nothing yet"* vs *"your filter matched nothing."* They should stay two sentences, one
   wording each. The owner writes both.

**Proof:** the four gates after every door, plus a pure test for any door that produces WORDS
(the archive and trash doors set that precedent). The owner runs the app-level pass at the end.
