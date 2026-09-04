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
