# The enactment procedure — stage ⓪'s output
*(It is a PROCEDURE: the steps for the database change, written before it is run. Nothing here has run.)*

> ## ⚠ REWRITTEN 2026-09-04 after the adversary pass (verdict: RETHINK, 15 findings — all folded here)
> **The old shape — one migration that adds, deletes, and sweeps in a single step — is DEAD.** It would have hard-errored (F1), broken gather and home silently (F2/F4), left the owner without a writing surface (F5), and rested on a back-out that was not real (F6/F7/F15).
> **The new spine: TWO STEPS.**
> - **Stage ①a — ADD ONLY.** New tables beside the old ones. Nothing deleted, nothing dropped, no app sweep. The live app runs unmodified: writing, gather, home, boards all keep working because nothing they use changes.
> - **The interim.** Stages ②a→③ build the new surface against the new tables while the old note surface still works. The owner uses the new surface for real.
> - **Stage ①b — REMOVE.** Gated on the owner saying she has moved (earliest: after stage ③). Only then: the counts and disclosures → delete the note rows → retire the old tie table → drop `bit.kind` (with the view dance) → the app sweep.
>
> **Read first, in full:** `composition-storage-decisions.md` · `verification/composition-schema-draft.sql` · `verification/composition-draft-proofs.out` · `verification/kind-seam-inventory.txt` · ~~`docs/composition-technical-spec.md` §1.3~~ ⚠ **STRUCK (antagonist F2): that doc is superseded and its §1.3 is the DEAD one-step enactment** (copy-repoint-delete-drop in one migration — the exact shape the RETHINK killed). **THIS procedure is the enactment order.** Consult that file for nothing here · `invariants.md`.
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

## B0 · ✅ THE REAL-DATA REHEARSAL — RUN 2026-09-04 (the owner's "any other way to check this?")
**The first restore ever performed in this project, plus ①a against her actual data** — the July-28 backup restored to a local throwaway → every later migration replayed → ①a applied. **Results:** the restore works (21 tables, 11 policies; 3 benign `supabase_vault` errors — Supabase-internal, now known) · **①a applied CLEAN over her real rows** · all 24 bits, 11 boards survive · board_cards renders 18, the_inbox 3, the_ledger 21 · kind + the old reference table intact · the 3 guest policies present after replay · new tables present and empty. **Two lessons folded into this procedure:**
1. ⚠ **A backup must record its exact MIGRATION POSITION, not its date.** The July file is named "pre-migration" and genuinely precedes two same-day migrations; a replay keyed on the calendar restored a broken hybrid until keyed on position. → §G.1: the fresh ①b backup states, in its name and its log, the last migration applied before it was taken; the restore-verify replays from exactly there and **asserts the guest-policy count**.
2. ⚠ **The dump is `--no-privileges` (deliberate, per the nightly workflow)** — restored locally it has no grants; on Supabase, defaults re-cover this. The restore-verify checks POLICIES, and treats local permission-denied as harness noise, documented here so it never reads as a failure.
*(The July copy predates her composition/gather activity — 0 notes, 0 ties then — so the ①b count-preview needs the fresh backup; expected.)*

## C0 · ⭐ THE ONE ORDERED CLOUD SEQUENCE *(antagonist F4 — previously written nowhere as one list)*
*(Actors named. Every cloud paste happens on the OWNER'S go; this window prepares each paste and shows it first. The "queue-clear ping" gates the ①a paste and after; steps 0–1 may precede it.)*
0. **Preflight — verify, never assume:** the DEPLOYED build ≥ commit `152c737` (the display_size-free app — check the Vercel deployment SHA, or duplicate a board on the live site) · probe cloud position: `placement.angle` exists (=…004 applied)? live `board_cards` still exposes `display_size` (=…006 NOT applied)? · ⚠ local `main` is ~55 commits ahead of `origin/main` — the ①a lockstep push rides main's whole deploy train; **confirm with the other window that main is deploy-clean before step 3.**
1. **Paste `verification/apply-left-at-and-drop-display-size-to-cloud.sql`** (the other window's prepared 005+006 paste; its deploy-first precondition is satisfied by step 0). Verify per its own footer.
2. **Paste ①a** (`composition-add.sql`). Verify: `select 1 from composition limit 0` succeeds · `select kind from bit limit 0` still succeeds.
3. **THE WRITTEN GATE (antagonist F3e): the full regression sweep** — every `verification/run-*-native.sh` re-run green against the chain WITH the moved file — before any push.
4. **Commit + push the ①a lockstep change** (the manifest in `composition-add.sql`'s header: regex fix → both export lists incl. `reference2` → the mergeSources repoint → the file move). The deploy lands AFTER the database has the tables (§G's rule — the database before the app; F4's citation fix: it lives in §G, not §H).

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
- **The ①a-suite:** the existing runner **rewritten, not repointed**: once `<date>_composition_add.sql` is in `supabase/migrations/`, the runner's draft-apply line (`run-composition-add-native.sh *(F3f correction: THIS is the runner that double-applies once the file moves — its migration loop + its own apply; delete its apply + grant blocks at the move)*:31`) and manual-grant block (`:32-34`) are **deleted** — or it double-applies and dies. Asserts: the draft suite's ADD-side attacks (constraints, RLS, views) **plus** the old app's reads still work (the_ledger · the_inbox · board_cards · old `reference` writes) — the "old app runs unmodified" claim, tested.
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
