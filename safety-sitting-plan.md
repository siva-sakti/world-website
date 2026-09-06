# The safety sitting — item 0 (D-149)

> **Stage marker:** foundations stage · item **0** · item-loop stage: **package built, sitting is
> the owner's.** Goal (ruled): before any restructuring or paste, the recovery path is EXERCISED —
> a real export in hand, a restore rehearsed, a fresh backup, the safe pastes done, the RLS guard
> standing. After this sitting, the worst outcome of any later mistake is an afternoon.

**The check here is against the GOAL, not the artifacts** (owner, 2026-09-05): each step ends with
you *holding the proof*, not with a script having run.

## The sitting, in order (~45 min of your hands; Claude on call throughout)

**1 · Export, and make it real** *(~10 min — do 1a and 1b back-to-back: the links die in ~1 hour)*
- 1a. In the app: your export door (Settings → export / `/api/export`) → a JSON file downloads.
- 1b. In a terminal, from the repo:
  `node scripts/fetch-export-media.mjs ~/Downloads/<the-export>.json export-media`
  → every image/recording/PDF downloads next to the JSON. *(Script smoke-proven 2026-09-05.)*
- **You check:** open the folder — your actual photos are there, openable. Open the JSON — your
  words are in it. If anything fails, that's the fire-drill WORKING: we fix the export, re-run.
- Move both somewhere safe (a second disk or drive is ideal; anywhere outside this repo works).

**2 · Fresh backup** *(~5 min)*
- Supabase dashboard → Database → Backups → download the newest (or trigger one, then download).
- **Name it by its MIGRATION POSITION, not just the date** — rename the file to carry the last
  migration applied at that moment (e.g. `backup-2026-09-06-thru-20260906000001.sql`). *(The
  composition lane's restore rehearsal was bitten by exactly this: a "pre-migration" July backup
  actually preceded two same-day migrations, and a calendar-keyed replay restored a broken hybrid
  until keyed on position.)* If taken mid-sitting: BEFORE the pastes, position = `20260903000002`;
  after them, `20260906000001`.

**3 · Rehearse the restore — on the copy, never the real thing** *(~10 min)*
- `verification/rehearse-restore.sh ~/Downloads/<the-backup>.sql`
  → builds a throwaway database from the backup and prints per-table row counts.
  *(Mechanics proven on a synthetic dump 2026-09-05: dump in → rows out, counted.)*
- **You check:** the counts look like your world (bits ≈ what you'd guess, boards, placements).
- **Claude checks:** the guest policies are PRESENT in the restored copy —
  `select count(*) from pg_policies where policyname like '%public%' or roles::text like '%anon%';`
  (the dump is `--no-privileges` by design, so policy *presence*, not grants, is the assertion —
  the composition lane's §B0 lesson).
  This is the first time the recovery path will have ever been run. Keep or drop the throwaway
  (the script prints both commands).

**4 · The two safe pastes** *(~5 min — AFTER the backup above)*
- SQL editor → paste `supabase/migrations/20260903000005_left_at_server_clock.sql` → run.
- Then paste `supabase/migrations/20260904000001_position_not_null.sql` → run.
- ⚠ Do **NOT** use `verification/apply-left-at-and-drop-display-size-to-cloud.sql` — that combined
  file contains 006 (`drop display_size`), which stays FOLDED into the future kind/size migration.
- **4c · The visibility rider (owner-ruled 2026-09-06 — the sealed model's step ①):** FIRST run
  the count so you see exactly what flips:
  `select visibility, count(*) from bit group by visibility;`
  → then paste `supabase/migrations/20260906000001_born_private.sql` → run the count again:
  everything private, and every new bit born private. Nothing reachable changes — no publish act
  exists; storage just stops lying. *(Proven on the full stack 2026-09-06:
  `verification/run-born-private-native.sh` — 2 public → 0, newborn private, garbage refused.)*
- **You check:** all three say success; the app still loads a board and moves a card.

**5 · The wall guard** — already landed with this package: `rls-every-table.test.mjs`, green on
today's schema and **proven red** against a naked table. Nothing for you to do; it now fails the
suite if any future migration creates a table without RLS.

**6 · Re-run the ENTIRE proof suite — Claude's half** *(owner's catch, 2026-09-05: "when did you
run that test — the previous build, or this going-over?")* The `verification/` SQL suites were
each run the week their feature shipped (July–August) and not since; they are re-runnable by
design. After the pastes, Claude re-runs every `run-*-native.sh` against a throwaway built from
the full migration stack and reports the results raw — the whole schema proven green TOGETHER,
today, not remembered green from August. Any red = a finding, handled before item 0b.

## What this sitting deliberately does NOT do
006 (owner-ruled: folded, never standalone) · originals-keeping (that's item 0b, next, its own
small build) · any schema change beyond the three proven pastes.
