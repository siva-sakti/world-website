# The enactment procedure — stage ⓪'s output
*(It is a PROCEDURE: the steps for the database change, written before it is run. Nothing here has run.)*

> ## ⚠ REWRITTEN 2026-09-04 after the adversary pass (verdict: RETHINK, 15 findings — all folded here)
> **The old shape — one migration that adds, deletes, and sweeps in a single step — is DEAD.** It would have hard-errored (F1), broken gather and home silently (F2/F4), left the owner without a writing surface (F5), and rested on a back-out that was not real (F6/F7/F15).
> **The new spine: TWO STEPS.**
> - **Stage ①a — ADD ONLY.** New tables beside the old ones. Nothing deleted, nothing dropped, no app sweep. The live app runs unmodified: writing, gather, home, boards all keep working because nothing they use changes.
> - **The interim.** Stages ②a→③ build the new surface against the new tables while the old note surface still works. The owner uses the new surface for real.
> - **Stage ①b — REMOVE.** Gated on the owner saying she has moved (earliest: after stage ③). Only then: the counts and disclosures → delete the note rows → retire the old tie table → drop `bit.kind` (with the view dance) → the app sweep.
>
> **Read first, in full:** `composition-storage-decisions.md` · `verification/composition-schema-draft.sql` · `verification/composition-draft-proofs.out` · `verification/kind-seam-inventory.txt` · `docs/composition-technical-spec.md` §1.3 · `invariants.md`.
> **The ruling that shapes it:** the owner's **fresh start** (`composition-spec.md` §21.7) — her test pieces are deleted, not carried. ⚠ **But §21.7 covers her COMPOSITIONS only.** The `[[` ties authored by her ordinary bits are her real notebook and get their own count + her explicit ruling at the ①b checkpoint (§E.1) — never assumed expendable (F3).

## A · What the enactment produces
1. **Two migration files**, not one: `<date>_composition_add.sql` (stage ①a) and, much later, `<date>_composition_remove.sql` (stage ①b).
2. **A swept app** — at ①b only, once the new surface is real and used.
3. **Committed proof runs for each** — the ①a-suite and ①b-suite, green against the real files (§F).

## B · The enactment extras the draft deliberately omits *(F9/F10 folded)*
1. **`EXPORTED_TABLES` += `composition`, `composition_file`** in the same change as ①a — **and the SECOND hard-coded copy of that list in `scripts/test-port.mjs:208` (`EXPORT_TABLES`)**, which `exported-tables.test.mjs:52-68` asserts matches exactly; miss it and the suite goes red on the drift test (F9). test-port's three `reference` writes (`from_bit_id`, `scripts/test-port.mjs:~252-266`) keep working through the interim (the old table stays live) and are rewritten at ①b.
2. **The tie table keeps the draft name `reference2` FOR THE WHOLE INTERIM.** The old `reference` table stays live and untouched, so today's gather — `[[` on board text-cards, the bit page, quick-write — keeps working unchanged. The rename `reference2` → `reference` happens at ①b, when the old table is retired (F2 by construction).
3. **`mergeSources` gains the repoint step** for `reference2.to_source_id` (verified: `src/lib/db/sources.ts:220-232` today repoints only `bit.source_id`, then deletes — the cascade would silently eat a tie). Ships with ①a, since ties into `reference2` exist from stage ③ onward.
4. **Export bytes, not just rows (F10):** `src/app/api/export/route.ts:43-50` builds signed URLs from `tables.bit` only. When `composition_file` gains rows (stage ④), the loop must extend to it **plus a test asserting every table with a `storage_path` column contributes to `files`** — otherwise "your complete data" (route:55) silently stops being true. Named ④-work; listed here so the export lockstep is honest end-to-end.

## C · Stage ①a — ADD ONLY, the order
0. **The other window's `…005` and `…006` go first.** ⚠ *Corrected reasoning (F8):* `…006`'s header does NOT forbid folding — it *asks* for it (*"fold this in… then this file needs no separate paste"*). The real constraint: `…006` (or its folded equivalent) must run **before** our `board_cards` rebuild because `create or replace view` cannot drop a column — replacing the `…004` view that still carries `p.display_size` with one that lacks it fails unless the view is dropped/rebuilt the way `…006` does it. The prepared cloud paste already exists: `verification/apply-left-at-and-drop-display-size-to-cloud.sql` — ⚠ whose header documents the one legitimate **app-first** case (deploy the display_size-free app before removing the column it stopped asking for). So "database before app" (§H) is the rule for *this* enactment, not an absolute for all time.
1. Create `composition` · `composition_file` · `reference2` (keeping that name — §B.2).
2. Add the third target slot to `tag_application` · `placement` · `opening` (+ CHECKs, uniques, indexes) — additive; existing rows untouched.
3. Add `board.hide_compositions`.
4. Rebuild views additively: `board_cards` (third leg) · `the_pull` (third arm) · `trash_listing` / `archive_listing` (third arms) · create `composition_travel`. **No view loses a column** (that is ①b's business, with the dance).
5. Grants + RLS on everything new.
6. `EXPORTED_TABLES` + test-port's list (§B.1), same change.
**The whole file wrapped in `begin; … commit;` (F6).**
⛔ **NOT in ①a:** no deletes · no drops · no renames · no app sweep · no route changes. The old app must run unmodified against the post-①a schema — that claim is asserted by the ①a-suite (§F).

## D · The interim — what is true while the new surface is built *(F2/F5/F13, disclosed not discovered)*
- **Writing:** `/write` keeps producing what it produces today (a `kind:'note'` bit, `quick-write.tsx:72`) **until stage ②a ships the composition page** — the composition write path arrives WITH ②a, not with ①a. There is never a moment without a working writing surface.
- **Gather:** `[[` on bits/boards keeps working unchanged (the old `reference` table is untouched).
- **The old note surface** (`/note/[id]`, home's list) keeps working until ①b.
- **"Where you were":** `recordOpening` (`src/lib/db/openings.ts:29-36`) has no composition branch; it arrives with ②a's page. Compositions are absent from the recent trail until then — deliberate, disclosed (F13).
- **Search (F12):** covering compositions is **real rework, not a filter change** — a second paged query + merge + a second tag join + a new result type (`search.ts` pages a single `bit` query; the pull joins only `target_bit_id`). Homed in **stage ②a/③ app work**, not in either migration. *(Consequence: the "body phrase findable in search" assertion belongs to ②a's acceptance, not the ①a rehearsal.)*

## E · Stage ①b — REMOVE, gated on the owner having moved
**Runs only after she says the new surface is her writing home (earliest: post-③).**
1. **THE COUNTS, before anything runs (F3):** count and REPORT to her, as numbers: (a) her note rows (the test pieces §21.7 rules expendable) · (b) **`reference` rows authored by her ordinary bits** (`from_bit_id` → a `kind='bit'` row) · (c) rows from note-rows targeting live bits. **Her explicit ruling at the checkpoint: carry (b) into `reference2`, or discard — never assumed.** Disclosure: chips inside her real bits that point at deleted notes **degrade to plain-word chips** (the built degrade — `bit-ref-view.tsx:50-56` returns the dead-target form on a failed read).
2. Delete the note rows (their tags/placements/ties fall by the proven cascades).
3. Retire the old tie table per her (b)-ruling: carry-then-drop, or drop. Rename `reference2` → `reference`; test-port's reference writes rewritten in the same change.
4. **Drop `bit.kind` — with the view dance (F1):** `drop view the_inbox; drop view the_ledger;` → `alter table bit drop column kind;` → recreate both views **VERBATIM from `supabase/migrations/20260830000003_audio_type.sql:83-91` (`the_ledger`) and `:92-105` (`the_inbox`)** — the repo has already hit exactly this (`select b.*` views block the column drop; the fix is documented at `audio_type.sql:62-71`). *The column drop takes `bit_kind_allowed` and the partial index with it — no separate drops (adversary's minor note).*
5. **The app sweep — the REAL surface list (F4):** the list room is **home** — `src/app/page.tsx` (via `listNotes`, `src/lib/db/bits.ts:482`) · `src/lib/surfaces.ts` (`Surface.kind`, `/note/${id}` hrefs) · `src/app/home-surfaces.tsx` · `src/app/desk-alive.tsx` · `src/app/where-you-were.tsx` · `src/lib/recent.ts` · `src/app/bits/page.tsx:31` (`kind === "bit"` filter) · the `/notes → /` redirect in `next.config.ts:29` · `/note/[id]` deleted. *(There is no `/notes` room to delete — the old claim was false.)* Full checklist: `verification/kind-seam-inventory.txt` (regenerated 2026-09-04).
6. The grep receipt: retired words return only history — nothing live.
**This file too: `begin; … commit;` (F6).**

## F · The rehearsals *(F14 — honest about what must change)*
- **The ①a-suite:** the existing runner **rewritten, not repointed**: once `<date>_composition_add.sql` is in `supabase/migrations/`, the runner's draft-apply line (`run-composition-draft-native.sh:31`) and manual-grant block (`:32-34`) are **deleted** — or it double-applies and dies. Asserts: the draft suite's ADD-side attacks (constraints, RLS, views) **plus** the old app's reads still work (the_ledger · the_inbox · board_cards · old `reference` writes) — the "old app runs unmodified" claim, tested.
- **The ①b-suite:** written at ①b-time from the draft suite **with `reference2` renamed** (17 occurrences in `composition-draft-proofs.sql`) + the F1 assertion (**`kind` is gone AND `the_ledger`/`the_inbox` still return rows**) + the delete-counts matching what was reported.
- **The deliberate-failure test (F6):** each suite injects one failing statement mid-file and asserts the transaction left **zero new objects** — the atomicity claim, proven rather than assumed.

## G · The checkpoints — what the owner sees *(F15)*
**①a checkpoint (light):** "this only adds; nothing is deleted or changed" · the ①a-suite raw output · the old-app-unmodified assertion shown → she says go → cloud → *(no app deploy needed — the old app is untouched)*.
**①b checkpoint (the real one):**
1. **A FRESH backup, taken immediately before, with the exact command shown and its output** — ⚠ the current `backups/` holds only July 28 files, **five weeks stale**, and no backup script exists in `scripts/`.
2. **A REHEARSED RESTORE:** that fresh backup restored onto a throwaway local Postgres, row-counts compared, **before she is asked to say go** — a restore has never been performed in this project; it may not be the back-out plan's last resort *and* untested.
3. **The counts (E.1):** "N test pieces deleted · M of your bits' `[[` connections — carry or discard? · chips pointing at deleted pieces degrade to plain text."
4. **The honest scope line:** "bits and boards keep every column except `kind`; gather-from-bits ends **here, deliberately** — the flatness law's door closing (disclosed, not silent)."
5. The ①b-suite raw output, pasted.
6. **She says go.** Cloud migration → verify → deploy the swept app. Database before app (the §C.0 carve noted).

## H · The back-out *(F6/F7 — rewritten for the split)*
| stage | if it fails | do this |
|---|---|---|
| ①a | migration errors mid-run | `begin/commit` rolls it back whole — **proven by the deliberate-failure test**, not assumed. Nothing changed. |
| ①a | applied, but something is off | **nothing depends on the new tables yet** — they sit empty and inert; fix forward at leisure. The old app never noticed. |
| ①b | migration errors mid-run | same atomicity — nothing changed; the old surface still works. |
| ①b | applied, app misbehaves after deploy | ⚠ **"redeploy the old app" is NOT available** — the old build reads `bit.kind` on home, every board load, search, duplicate (F7: `bits.ts:486,502,562` · `search.ts:51` · `drawer.tsx:139` · both page redirects). **Forward-fix is the real answer**; the restore (below) is the only backward path. |
| ①b | the schema change itself must be undone | **restore from the F15 backup — fresh and restore-rehearsed, or no go was given.** Loses only what she ruled expendable + her (b)-ruling's choice. |

## I · What stage ⓪ still owes before ①a begins
- The real `<date>_composition_add.sql` written out (this procedure is its specification) + the rewritten ①a runner.
- *(At enactment, owner-gated: the fresh backup + restore rehearsal — cloud access.)*
- *(Riding alongside, not blocking: the merge-check leftovers; the naming-timing decision.)*
