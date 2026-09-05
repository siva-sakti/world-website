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

**3 · Rehearse the restore — on the copy, never the real thing** *(~10 min)*
- `verification/rehearse-restore.sh ~/Downloads/<the-backup>.sql`
  → builds a throwaway database from the backup and prints per-table row counts.
  *(Mechanics proven on a synthetic dump 2026-09-05: dump in → rows out, counted.)*
- **You check:** the counts look like your world (bits ≈ what you'd guess, boards, placements).
  This is the first time the recovery path will have ever been run. Keep or drop the throwaway
  (the script prints both commands).

**4 · The two safe pastes** *(~5 min — AFTER the backup above)*
- SQL editor → paste `supabase/migrations/20260903000005_left_at_server_clock.sql` → run.
- Then paste `supabase/migrations/20260904000001_position_not_null.sql` → run.
- ⚠ Do **NOT** use `verification/apply-left-at-and-drop-display-size-to-cloud.sql` — that combined
  file contains 006 (`drop display_size`), which stays FOLDED into the future kind/size migration.
- **You check:** both say success; the app still loads a board and moves a card.

**5 · The wall guard** — already landed with this package: `rls-every-table.test.mjs`, green on
today's schema and **proven red** against a naked table. Nothing for you to do; it now fails the
suite if any future migration creates a table without RLS.

## What this sitting deliberately does NOT do
006 (owner-ruled: folded, never standalone) · originals-keeping (that's item 0b, next, its own
small build) · any schema change beyond the two proven pastes.
