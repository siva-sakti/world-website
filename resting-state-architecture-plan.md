# Clean architecture for the resting state (trash · archive) — plan

**Status:** designed 2026-08-29. The owner asked for the *best* architecture, not a copy of trash. Grounded in a full investigation of the current trash wiring. Goal + design + staged procedure below; ready to build on the owner's buy-in + the Stage-2 decisions.

## The basic logic (plain — this is the whole thing)
Any one thing (a bit, a note, a board) is always in **exactly one** of three states:
- **live** — in your world.
- **archived** — set aside for clutter (hidden, but fully kept).
- **trashed** — on the way out (hidden, restorable, and can be destroyed forever).

**Moves:** archive ↔ un-archive · trash → restore · destroy (only from trash). States are **mutually exclusive** — one resting place at a time (trashing an archived thing moves it to trash; restore → back to *live*).

**The one rule that makes every case work:** while something is set aside, **nothing about it changes** — its spots on boards, its chips in notes, all kept — and bringing it back restores it **exactly**. So: a thing on many boards returns to all of them; a filled-in hole just means two cards overlap (drag one aside, same as trash-restore); a `[[` chip reappears in place; archiving a board sends its only-there bits back to the loose pile. Every edge case is this one rule — no special-casing.

## The problem (from the investigation)
"Live" (`deleted_at is null`) is **copy-pasted ~20×** — **~9 DB views + ~11 app queries** — with **no single source of truth**. Adding `archived_at` the same way multiplies the smell; a third resting state later repeats it again. *(Related, separate smell — flagged, not fixed here: the app **re-derives** several surfaces against the base tables instead of using the `the_ledger` / `the_inbox` / `the_pull` views that already exist and are otherwise unused. A "consolidate app→views" cleanup for later.)*

## The goal
**One source of truth for the resting-state axis.** "Is this in the world?" is defined ONCE. Trash gets cleaner; archive (and any future resting state) plugs into the one gate. **Visibility** (public/private) stays a **separate** axis that *composes* with it. **Stage 1 changes NO behavior**; Stage 2 adds archive.

## The design — a generated `state` column
On `bit` **and** `board`, a STORED generated column:
```
state =  'trashed'   when deleted_at  is not null     -- trash wins
         'archived'  when archived_at is not null
         'live'      else
```
- **World surfaces** filter `state = 'live'` (replaces the ~20 `deleted_at is null`).
- **`trash_listing`** = `state = 'trashed'`; **new `archive_listing`** = `state = 'archived'`.
- **Guest door** = `visibility = 'public' AND state = 'live'` (the two axes compose).
- **Acts:** trash/archive = set the timestamp; restore/unarchive = clear it; `state` recomputes. **Precedence + mutual-exclusion are free** (a trashed-and-archived row reads `trashed`; it can't appear in two listings). **No destroy for archive** — it keeps forever.

## The axes, kept clean (the holistic backend view — "what else")
- **Resting state** (live/trashed/archived) → the `state` column. ← this plan.
- **Visibility** (private/public) → the `visibility` column + guest RLS. A *separate* axis; composes as `visibility='public' AND state='live'`. **Not merged** (a different question — owner vs guest).
- **Placement/loose · kind (bit/note)** → computed/filtered, orthogonal. Untouched.
- **Deliberately NOT over-unified** — only the genuinely-repeated concept ("live") is centralized. (Guards against the over-abstraction failure mode.)
- **Separate opportunity flagged:** the unused `the_ledger`/`the_inbox`/`the_pull` views vs the app re-deriving them — a duplication to resolve (delete the dead views, or route the app through them) in its own pass, not bundled here.

## Code architecture (functions/modules) — clean + mirrored, same ethos as the DB
- **DB acts — one shared setter, readable wrappers.** Trash and archive are the *same shape*: set/clear a timestamp on a `bit` OR a `board`. Instead of ~8 near-identical functions, **one helper** — `setResting(supabase, thing, id, column, on)` (`thing`: 'bit'|'board'; `column`: 'deleted_at'|'archived_at') in a small `lib/db/resting.ts` — with **thin named wrappers** over it (`trashBit`/`restoreBit`/`archiveBit`/`unarchiveBit` + board twins) so call sites stay readable and the logic lives once. **Destroy stays its own function** (a genuinely different act — hard delete + `removeObjects`).
- **Listings mirror:** `listTrash`/`listArchive` both read their `_listing` view (share a `listResting(state)` shape if identical).
- **Server actions + UI mirror:** `app/archive/` mirrors `app/trash/` (list + un-archive); share components where identical; trash keeps its **destroy/empty tail**, archive has none.
- **No over-abstraction (the guardrail):** only the genuinely-repeated set/clear is unified. Destroy stays separate; the two axes (**resting state** vs **visibility**) stay distinct. Centralize what's actually one concept, nothing more.

## Procedure — staged, each proven before the next

### Stage 1 — Centralize "live" into `state`. ZERO behavior change (pure refactor).
1. **Migration:** add `archived_at timestamptz` + the generated `state` column to `bit` and `board`; drop/recreate the `bit_ledger` partial index as `where state = 'live'`.
2. **Views** (drop/recreate, latest defs) to filter `state = 'live'`: `the_ledger`, `the_pull` (both arms), `home`, `the_inbox` (top-level **and** the `not exists` board test → a bit whose only board is archived returns to inbox, mirroring the trashed-board symmetry), `board_cards`, `board_connectors`. **Leave `bit_travel`** (history domain). `tag_counts`/`subtype_word_counts`: keep the world/trash split (decision on an archive bucket → §Decisions).
3. **Guest door** (`20260728000002…`): recreate the 5 helper/policy spots as `visibility='public' AND state='live'` (column must exist first — SECURITY DEFINER).
4. **App queries** (~11): `.is("deleted_at", null)` → `.eq("state","live")` — `page.tsx:22`, `search.ts:35`+`:60`, `boards.ts:26 getBoard`, `inbox.ts:25 listAllBits` (+ the `:43` membership test → also `bd.state==='live'`), `references.ts:110`+`:152` (+ `getRefTarget`/`bit-ref-view.tsx:60`), `graph.ts:36`, `bits.ts:289 getBit`. Decide the `bits.ts:138 callInBit` write-guard (keep as a liveness gate → `state='live'`).
5. **PROVE IDENTICAL:** with no archived rows, `state='live'` ≡ `deleted_at is null` exactly. Re-run `verification/` (attack suite + the seven-scene replay) + a **before/after diff of every surface's output** → must be byte-identical. Throwaway-proven → owner's go → cloud (backup → atomic → verify). *Trash is now clean; no user sees a difference.*

### Stage 2 — Archive (the new capability) on the clean base.
1. **`archive_listing`** view (mirror `trash_listing`: `state='archived'`, union bit+board, `order by archived_at desc`).
2. **db acts:** `archiveBit`/`archiveBoard`, `unarchiveBit`/`unarchiveBoard`, `listArchive` (mirror trash/restore; **no destroy**).
3. **`/archive` page + controls** (mirror `/trash`: list + **un-archive**; no empty/destroy). Archive / un-archive controls on a board + a note (their pages + the home rows).
4. **Invariants:** **rewrite I-T4** (four domains: world · trash · archive · history); extend I-L3, I-L8, I-N1, I-T1 with the archive clause; settle the I-L5b/I-T2/I-T3 parallels.
5. **Verify:** throwaway (archive → leaves the world, enters `archive_listing`; unarchive → returns; trash-beats-archive; guest can't see archived) → owner's go → cloud.

## Stage 1 — execution detail + the proof (the careful part)

### The migration (one new file, `supabase/migrations/2026083000000X_resting_state.sql`)
1. `alter table bit add column archived_at timestamptz;` · `alter table board add column archived_at timestamptz;`
2. Generated state column on each: `add column state text generated always as (case when deleted_at is not null then 'trashed' when archived_at is not null then 'archived' else 'live' end) stored;`
3. `drop index bit_ledger; create index bit_ledger on bit (created_at desc) where state = 'live';` *(verify a partial-index predicate may reference a STORED generated column — the checker confirms; fallback: `where deleted_at is null and archived_at is null`.)*
4. **Drop + recreate each world view**, changing ONLY the resting filter `X.deleted_at is null` → `X.state = 'live'` (nothing else), from the LATEST def: `the_ledger`, `the_pull` (both arms), `home`, `the_inbox` (top-level **and** the `not exists` `bo` test → `bo.state='live'`), `board_cards` (**both** the `b` target and `tb` target tests), `board_connectors` (**all four** endpoint-target tests). **`bit_travel` untouched.** `tag_counts`/`subtype_word_counts`: **leave unchanged** (world/trash split stays; archived rows simply fall out of `world_count` and are not counted as trash — acceptable for Stage 1, revisit Stage 2).
5. **Recreate the guest door** (5 spots in `20260728000002…`): `… deleted_at is null` → `… state = 'live'`. Ordering: the columns (steps 1–2) must exist before these SECURITY DEFINER recreations.

### The app edits (exact, ~11 — `.is("deleted_at", null)` → `.eq("state","live")`)
`page.tsx:22` · `search.ts:35` · `search.ts:60` · `boards.ts:26 getBoard` · `inbox.ts:25 listAllBits` · the membership test `inbox.ts:43` (`bd.deleted_at` → `bd.state !== 'live'`) · `references.ts:110` · `references.ts:152` (`gatherer.deleted_at` → `gatherer.state !== 'live'`) · `getRefTarget` + `bit-ref-view.tsx:60` (`target.deleted_at` → `target.state`) · `graph.ts:36` (`bit.deleted_at` → `bit.state`) · `bits.ts:289 getBit`. Keep `callInBit` (`bits.ts:138`) as a liveness gate (`state='live'`). **Do NOT touch the destroy guards** (`deleted_at is not null` in destroyBit/Board/emptyTrash/listTrash — trash-area ops; Stage 1 leaves the trash area exactly as is).

### The proof — byte-identical, ACTUALLY RUN (not claimed)
On a **throwaway Postgres** (the `verification/` harness — the same native-PG path used for the schema proofs):
1. Apply the CURRENT schema (all migrations) → seed the standard fixture (the seven-scene dataset + a few trashed rows) → **snapshot every surface's rows** (`home`, `the_ledger`, `the_inbox`, `the_pull`, `board_cards`, `board_connectors`, `trash_listing`, `tag_counts`).
2. Apply CURRENT **+ the new resting-state migration** → same fixture → snapshot the same surfaces.
3. **DIFF the two snapshots → must be EMPTY (identical).** Rationale: with `archived_at` all-null, `state='live'` ≡ `deleted_at is null` and `state='trashed'` ≡ `deleted_at is not null`; the diff *proves* every surface is unchanged rather than assuming it.
4. Re-run the existing `verification/` **attack suite + seven-scene replay** on the new schema → all green (constraints · RLS wall · FOR-SHARE race probe).
5. Forward check: set `archived_at` on one fixture bit → it leaves `home`/`the_ledger`/`board_cards`, appears in no world surface, and its **placement row still exists** (Stage-2 readiness).
Cloud apply is proposed only when 3 **and** 4 are green — backup → atomic → verify, on the owner's explicit go.

## Decisions to settle (before Stage 2)
1. **Archiving a *placed* thing — RESOLVED (owner, 2026-08-29): it VANISHES from the board** (mirror trash). The **placement row is kept**, so un-archive restores its exact spot — the hole is temporary and chosen, not a broken board. **Refinement:** an *informing confirm* when it's on boards ("on N boards — archiving hides it from them until you un-archive"), mirroring trash's multi-board confirm, so the hole is never a surprise.
2. **`tag_counts` archive bucket** — do archived carriers get counted anywhere? *(Lean: no separate bucket for v1; archived folds out of `world_count`.)*
3. Confirm: **trash-wins** precedence · **archived hidden from guests** · **no destroy-archive**.

## Effort / risk (honest)
Stage 1 touches the **whole world-definition** — real risk — mitigated by the **prove-identical gate**: it's a no-op refactor, so *any* observable difference is a bug caught on the throwaway before cloud. Stage 2 is additive on the clean base. Both are schema changes → throwaway-proven → owner-gated cloud apply (the project's standard).
