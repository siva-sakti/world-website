# Code quality pass — the plan

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

## 5. Owner decisions

1. **T1 widths** — unify to the creating values (`400`/`300`), or keep the legacy fallback? Only
   affects rows whose width was never set. *(Proceeding heights-only meanwhile — safe either way.)*
2. **§2e.3 `archiveBit`** — make the silent no-op throw like its twin? House standard says yes.
3. **Confirm Tier 3 is deferred, not dropped.**
