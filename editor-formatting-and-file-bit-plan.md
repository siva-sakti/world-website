# Editor formatting (checklist · table) + the file bit — build plan for the code window

**Context, one paragraph:** the composition/note redesign is mid-concept in the other window (see `docs/composition-definition.md` + `docs/composition-base-spec.md` — read the ⭐HANDOFF section). These three builds are **pre-approved by the owner (2026-09-03)** because they are independent of that redesign: two land in the ONE shared editor (`src/app/board/[id]/text-bit.tsx` — rendered by board text-cards, `/note/[id]` via TextWorkspace, and `/write`), so they benefit bits AND the future composition surface simultaneously; the third adds a bit type, and bits are untouched by the coming migration.

## Build 1 · Checklist formatting (S)
- Add `@tiptap/extension-task-list` + `@tiptap/extension-task-item` (official, v3-matching our `^3.28`) to the shared editor's extensions.
- Toolbar: a checklist button beside the existing controls; input rule (`[ ] ` → task item) if cheap.
- Serializes into `bit.body` HTML → search (`search_tsv` over the body) and export pick it up with **zero schema work**. Style checkboxes for both contexts (small canvas card · full page) in `globals.css`.
- **Plus the owner-asked door:** a **"+ checklist"** create-door on the board toolbar — births a text bit whose body starts as an empty task list, first item focused (reuse the existing `+ text` door path; content differs only). *Do NOT stamp a subtype in v1 — the subtype-vocabulary call is the owner's, later.*

## Build 2 · Table formatting (S–M)
- `@tiptap/extension-table` + row/cell/header, same shared editor.
- Insert via toolbar (page/write contexts at minimum; render everywhere). Minimal ops UI: add/remove row/column (tiptap commands; a small menu on table selection). Keep it plain — **no typed columns, no sorting, no formulas** (that's the parked engine, `docs/tables-and-structured-data.md`).
- Small-card rendering: allow horizontal scroll within the card rather than squeezing.

> **⚑ GAP FOUND 2026-09-03 — this build covers only HALF of what was ruled.** Cross-feature
> ruling **X4** (owner, 2026-09-02: *"a table should be its own bit… in the boards a bit that can
> be a table"*) says a table is **both** formatting inside writing **and its own bit type on a
> board**. Build 2 above does the formatting half only; there is no `'table'` in `bit.type`
> anywhere in this plan. Either the second half is a separate build (a migration + a renderer +
> an intake, like Build 3) or X4 has been narrowed — **the owner's call, and it should be made
> before Build 2 ships**, because a table typed as writing today is awkward to promote to a bit
> later. Raised when the owner asked about "three new bit types" and only one of the three
> turned out to need a type at all.

## Build 3 · The generic FILE bit (M)
- Migration: add `'file'` to the `bit.type` CHECK — follow the exact pattern of `20260830000003_audio_type.sql` / `...04_pdf_type.sql`. Throwaway-proven first; **cloud apply stays owner-gated**, as always.
- Intake: generalize the existing file-bit foundation (`createFileBit`, the audio/pdf machinery) — accept any mime that isn't already image/audio/pdf; store via the same bucket + `storage_path`; keep `file_name`, `mime`, `byte_size`.
- Card + page: filename · size · type icon · download via signed URL. No preview attempt in v1.
- Search by filename (as audio/pdf already do) · export inherits (bit rows already lockstep).
- Extend `scripts/test-port.mjs`: file-bit round trip + a body-with-checklist round trip.

## Verification (house standard)
`tsc --noEmit` · lint · `pnpm build` green · test-port extended and green · migration proven on a throwaway before any cloud talk.

## ⛔ Explicitly OUT of this handoff
- Anything touching **note/composition behavior**: the floater, side panel, note-page block UX, drag handles, slash menu — all land AFTER the storage migration (sequenced in `docs/composition-base-spec.md`).
- Any **renames** — the naming session is pending; current words stay.
- The **typed-fields/tracker engine** — parked.
- Subtype stamping on the checklist door — owner's vocabulary call, later.

---

## What is needed before any of this is built *(added 2026-09-03)*

### Only ONE of the three is a new bit type
Worth stating plainly, because the owner remembered these as *"three new bit types"*:
**checklist and table are editor features** — tiptap extensions in the one shared editor,
**zero schema work**, and they land in board text-cards, `/note/[id]` and `/write` at once.
**Only the generic file bit needs a migration.** That makes the set much smaller than it sounds.

### ✅ RULED (owner, 2026-09-03): a table is ITS OWN BIT TYPE — and in-text tables are now in question

*"Yes, the table should be its own type of bit is what I thought. I don't even know if it
makes sense to be able to bring it into a text bit. I thought it should be something, but it
doesn't have to be."*

**This inverts the plan above and overrides Claude's lean.** X4 stands in full: a table is a
**thing on a board**, not primarily a formatting mode inside writing. And the owner is
questioning whether the in-text half should exist at all — *"it doesn't have to be."*

**What this changes:**
- **Build 2 as written (table = tiptap formatting) is NO LONGER the first table build**, and may
  not be a build at all. It is now ⚪ open, not planned.
- The real table build is a **new bit type**: a `'table'` in the `bit.type` CHECK (a migration,
  the same shape as Build 3's), its own editor, its own card renderer, its own intake.
- **That makes it the LARGEST of the three, not the middle one** — it needs everything the file
  bit needs *plus* a real editor. The build order below is re-cut accordingly.
- ⚪ **Still genuinely open, and the owner's:** does a table inside writing exist too? Not needed
  for the bit-type build, and deciding it late costs nothing now that the bit type leads.

*(Superseded below: the old "⚑ decision needed" block and Claude's lean toward formatting-first.
Kept visible rather than deleted, because the lean was wrong and the reason is instructive —
Claude ranked by implementation size, the owner ranked by what the thing IS.)*

### ~~⚑ One decision needed from the owner — before Build 2 ships~~ *(SETTLED above)*
**Is a table also its own BIT TYPE?** Ruling X4 says yes (*"a table should be its own bit… in
the boards a bit that can be a table"*); Build 2 delivers only the formatting half. It matters
*before* rather than after, because **a table typed as writing is awkward to promote to a bit
later** — the same class of problem as everything this pass has been fixing. Three ways:
(a) formatting only, and narrow X4 · (b) formatting now, a `'table'` bit type as its own build
later · (c) both together. *(Claude's lean: **(b)** — formatting is small and useful on its own,
and the bit-type half is a real build with a migration, a renderer and an intake.)*

### ✅ Clear of the composition split — verified, not assumed
The composition build drops `bit.kind` and sweeps ~30 kind-checking files
(`verification/kind-seam-inventory.txt`). **None of these three builds deepen that seam:**
`createFileBit` never writes `kind` (it takes the column default), and the two editor builds
touch no columns at all. `'file'` goes into the `bit.type` CHECK, which the split does not
touch. **So these can be built while the composition work is in design, and the migration
follows the exact shape of `20260830000003_audio_type.sql`.**

### The order, and what each costs
| | | needs the owner |
|---|---|---|
| 1 | **Checklist** — smallest, no schema, immediately useful | no |
| 2 | **Generic file bit** — a migration + intake + card *(pattern exists: `20260830000003_audio_type.sql`)* | the cloud paste |
| 3 | **Table as a bit type** — a migration + **its own editor** + card + intake. The biggest of the three. | the cloud paste |
| — | ~~table formatting inside writing~~ | ⚪ open — may not happen at all |

**Build order is deliberately by size, not by want:** checklist proves the shared-editor path
end-to-end at the smallest cost, so if anything about the extension approach is wrong we learn
it there rather than inside the table work.

---

## ⚠ WHAT A NEW BIT TYPE ACTUALLY COSTS *(antagonist review, 2026-09-03 — verdict: No)*

The plan above said a new type is *"a migration + a renderer + an intake."* **That is wrong by
about an order of magnitude.** An antagonist swept the codebase: **~35 files, ~60 sites.** The
important part is not the number but WHY, and the why is a real finding:

### Six unnamed type families, spelled out ~25 times

Nowhere in the codebase are these named. Each site decides membership independently, so a new
type must be classified **at every one of them**, and every site that forgets fails **silently**:

| the family | who's in it | where it's re-decided |
|---|---|---|
| **thumbnailed** | image · pdf · link | `drawer.tsx` · `note-card.tsx` · `note-row.tsx` · `card.tsx` |
| **file-backed** | image · audio · pdf | `bits.ts` · `card-defaults.ts` · `storage.ts` |
| **flex-sized** (height follows content) | text · audio | `card-vm.ts` → 5 sites in `card.tsx` |
| **visual** (offered by `[[`) | image · drawing | `gather-picker.tsx` · `bit-ref-view.tsx` · `text-bit.tsx` |
| **wordless** (gets the "add a few words?" offer) | everything but text | `words-offer.tsx` · `board-surface.tsx` |
| **carries no file** | text · drawing | `storage.ts` |

**Only `flex-sized` has a name and a door** (`isFlexSized`, made one this pass). The other five
are conditions retyped at each site. *That* is the cost, and naming them is the fix.

### Three silent failures a new type hits today
- **`card.tsx` and `bit/[id]/page.tsx` have NO default branch.** An unrendered type draws an
  **empty bordered box** and an empty page body. No error, at any layer.
- **`note-card.tsx` labels an unknown type "empty note"** — actively wrong, not merely blank.
- 🔴 **`board_cards` selects substance columns by ALLOW-LIST** (`b.body, b.strokes, b.url, …`).
  **A table whose cells live in a new column renders blank on every board**, because the view
  never carries it. This is the single most important finding for the table build: **decide
  where a table's cells live before anything else, and remember the view must be taught.**

### Also found, and already acted on
- ✅ **The type seam is now guarded** — `src/lib/bit-types.test.mjs` reads `bit_type_allowed`
  out of the migrations and asserts `BitType`, `CardType`, `isCardType` and `copyPathsFor` all
  agree with it. Proven both directions: adding a type to SQL alone fails 3 tests, to TS alone
  fails 1. **Written before the new types, deliberately.**
- ✅ **A live bug, unrelated to this plan:** `scripts/test-port.mjs` carried a second export-table
  list that had drifted to 9 against the real 13 — `source`, `reference`, `opening` and
  `shelf_group` were never checked on the cloud, while the script printed *"all 9 record kinds"*.
  Fixed and guarded.
- ⚑ **A pre-existing hole worth the owner knowing:** the `[[` picker offers only text, image and
  drawing. **Audio, PDF and link have been invisible to it since they were added** — three type
  additions, none noticed. A new type would be the fourth.

### What must change in this plan before building
1. **Decide where a table's cells live** — and that `board_cards` carries them. Nothing else about
   the table build matters until this is answered.
2. **Name the six families as doors**, the way `isFlexSized` was, so the new types are classified
   once each instead of ~25 times.
3. **Give `card.tsx`, `bit/[id]/page.tsx` and `note-card.tsx` a real default branch** — an unknown
   type should say so, not draw an empty box.
4. **Add the missing per-type pieces the sweep found:** an attack suite in `verification/`, a
   `files/` prefix in `scripts/find-orphan-files.mjs`, and the `[[` picker's list.

