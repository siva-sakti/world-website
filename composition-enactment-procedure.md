# The enactment procedure — stage ⓪'s output
*(Renamed from "the enactment procedure" 2026-09-04 — the owner: "I get mixed up when you say on paper, since our whole project is about building note surfaces." Fair. It is a PROCEDURE: the steps for the database change, written before it is run.)*
> **What this is:** the complete procedure for stage ①, written **before** it is needed and improvised nowhere. Paper only — nothing here has run.
> **Read first, in full:** `composition-storage-decisions.md` · `verification/composition-schema-draft.sql` · `verification/composition-draft-proofs.out` · `verification/kind-seam-inventory.txt` · `docs/composition-technical-spec.md` §1.3 · `invariants.md`.
> **The ruling that shapes everything below:** the owner's **fresh start** (`composition-spec.md` §21.7) — her existing pieces are test data and are **deleted**, not carried. There is no data move, no format conversion, no browser act.

## A · What the enactment produces
1. **One migration file** — `supabase/migrations/<date>_composition_split.sql`, built from the proven draft plus the four enactment extras (§B).
2. **A swept app** — the old surface gone, the new one in its place (§D).
3. **A committed proof run** — the attack suite green against the real file, not the draft.

## B · The four enactment extras the draft deliberately omits
1. **`EXPORTED_TABLES` += `composition`, `composition_file`** — in the SAME change (invariant I-G1). The set-equality test goes green with it and red without: that test is the guard, and it is why the draft has been living in `verification/`.
2. **The tie table** — today's `reference` is bit→bit. End state is composition→(bit|board|composition|source). **With no data to preserve** (fresh start), the honest move is **drop and recreate**, not a column-by-column alter. Simpler, and nothing is lost that anyone wanted.
3. **`mergeSources` gains the repoint step** — proven both ways in the draft suite: with it the tie survives a merge; without it the cascade silently eats it.
4. **The `reference2` draft name becomes `reference`** — the draft used a placeholder to coexist with the live table.

## C · The order of operations *(load-bearing — do not reorder)*
0. **The other window's two migrations go first** — `…005` (server-clock `left_at`) then `…006` (drops `display_size`, rebuilds `board_cards`). ⚠ `…006`'s own header forbids applying it standalone; our `board_cards` rebuild is already `display_size`-free and must run **after** it.
1. Create `composition` · `composition_file` · the new `reference`.
2. Add the third target slot to `tag_application` · `placement` · `opening` (+ their CHECKs, partial uniques, indexes).
3. Add `board.hide_compositions`.
4. **Delete the old note rows** (`bit` where `kind='note'`) — **count them first and REPORT the number**; their tags, placements and ties fall away by the existing cascades.
5. Drop `bit.kind` and `bit_kind_allowed`. **The bit table now means one thing: material.**
6. Rebuild the views: `board_cards` (third leg) · `the_pull` · `trash_listing` · `archive_listing`; create `composition_travel`.
7. Grants + RLS on everything new.

## D · The app sweep, in the same change
`/note/[id]` and `/notes` **deleted, not commented out** · `/notes` → the new room · **old note URLs correctly 404** (the things are gone; a redirect would be a lie) · `listNotes()` and every kind-check removed (`verification/kind-seam-inventory.txt` is the checklist) · search's filter becomes all · bits · compositions · the write path births a `composition`.
**The receipt that it is clean:** a repo-wide grep for the retired words returns **only history** (`old/`, the D-log) — nothing live.

## E · The rehearsal *(runs before she is ever asked to say go)*
`verification/run-composition-draft-native.sh`, repointed at the REAL migration file: a throwaway PG17 → every migration in `supabase/migrations/` in order → the attack suite. **Additionally asserted for the real run:** the delete-count matches what was reported · zero orphaned rows anywhere · `EXPORTED_TABLES` set-equality green · a body phrase is findable in search afterwards. **Raw output committed.**

## F · The checkpoint — exactly what the owner sees, and what she says go to
1. **"Your database is backed up"** — where, and when it was taken.
2. **"N test pieces will be deleted"** — the real count from the rehearsal. *(Restorable from the backup; nothing else is touched.)*
3. **"Here is the rehearsal's raw output"** — pasted, not summarized.
4. **"Your bits and boards are untouched"** — asserted by the suite, shown.
5. **She says go.** Then: cloud migration → verify → deploy the app. **Never the app first.**

## G · The back-out procedure *(written now so it is never invented under pressure)*
| if it fails | do this |
|---|---|
| **the migration errors mid-run on cloud** | it is one transaction — Postgres rolls it back whole; **nothing changed.** Fix, re-rehearse, re-present. |
| **the migration succeeded but the app misbehaves after deploy** | **roll back the APP first** (redeploy the previous build) — the schema is additive-plus-deletes and the old app cannot see the new tables anyway. Diagnose with the database intact. |
| **the schema itself is wrong and must go** | restore from the backup taken at F.1. **This is the only path that loses anything** — and what it loses is the test pieces she already ruled expendable. |
| **the sweep left something broken (a dead route, a stale kind-check)** | ordinary fix-forward; the grep receipt (§D) is what catches it before deploy, not after. |
**The rule under all of it:** the app is deployed **after** the database is verified, never before — so there is never a build in the world expecting a shape the database does not have.

## H · What stage ⓪ still owes before ① begins
- The real migration file written out (this procedure is its specification).
- **One final adversary pass** over this procedure + the plan, against the codebase as it actually is.
- *(Riding alongside, not blocking: the merge-check on the three superseded docs; the naming-timing decision — free now, a schema change later.)*
