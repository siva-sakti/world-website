-- ============================================================================
-- OPENING — where you were (the recent section; plan `recent-section-plan.md`)
-- ============================================================================
-- Home could say what you MADE (touched_at, "recently modified") but never where
-- you WENT: read a board for twenty minutes and move nothing, and nothing
-- remembered you were there. An `opening` is the owner's ruled act — you OPENED
-- a board or a note. Home reads the last few and shows them as "where you were".
--
-- WHY ITS OWN TABLE, and not a `visited_at` column on board/bit:
--   bit and board each carry a BEFORE UPDATE trigger stamping updated_at — and
--   that is deliberately the ONE trigger in this schema (init.sql:77, §4.7). A
--   column written on every open would fire it, so merely OPENING a note would
--   look like EDITING it, corrupting the `home` view's touched_at ordering, the
--   home list's "recently modified" sort and /notes' "recently edited" sort.
--   A separate table is untouched by that trigger and perturbs nothing.
--
-- WHY NOT THE WORD "visit": init.sql:357 already promises "one-row-per-visit"
--   to the visit-by-visit TRAVEL timeline (parked A7 — where a BIT has been).
--   Two unrelated meanings on one word is drift; this is where the OWNER has
--   been, and the owner ruled the word: an **opening**.
--
-- WHY PLAIN UNIQUE CONSTRAINTS, NOT PARTIAL INDEXES (the antagonist's proof):
--   PostgREST's on_conflict takes bare column names and cannot emit an index
--   predicate, so ON CONFLICT can NEVER infer a partial index — the upsert would
--   throw 42P10 on every open, silently, forever. Postgres defaults to NULLS
--   DISTINCT, so every note row (board_id IS NULL) coexists happily under
--   `unique (owner_id, board_id)` — the same semantics, and inferable.
-- ============================================================================

create table opening (
  id         uuid primary key default gen_random_uuid(),
  owner_id   uuid not null default auth.uid(),
  board_id   uuid references board(id) on delete cascade,
  bit_id     uuid references bit(id)   on delete cascade,
  opened_at  timestamptz not null default now(),
      -- the ONLY clock this row has: opened_at IS the row's meaning. No
      -- updated_at, and deliberately NO trigger (see the header).

  constraint opening_exactly_one_target check ((board_id is null) <> (bit_id is null)),
      -- the house exactly-one-target shape (A15 / gather-g1-checkpoint-A §9)

  constraint opening_one_per_board unique (owner_id, board_id),
  constraint opening_one_per_bit   unique (owner_id, bit_id)
      -- DEDUPE IS STRUCTURAL, not app logic: one row per thing per owner, and
      -- what makes the write an inferable upsert. NULLS DISTINCT lets the many
      -- rows of the other kind sit alongside.
);

-- ON DELETE CASCADE above means destroying a board or a bit takes its openings
-- with it — by the database. No orphan sweep, nothing for the app to remember.

create index opening_owner_recent on opening (owner_id, opened_at desc);
    -- the one read: the owner's newest openings

alter table opening enable row level security;
create policy opening_owner_all on opening
  for all to authenticated
  using (auth.uid() = owner_id) with check (auth.uid() = owner_id);
    -- verbatim the shelf_group pattern (20260822000001:30-32) — per-row
    -- ownership, so this is per-PERSON at birth and needs no accounts retrofit.
-- No guest/anon policy, ever: where the owner has been is private, and stays so
-- when the sharing phase lands. A guest on a shared board writes nothing here.

create index opening_board on opening (board_id);
create index opening_bit   on opening (bit_id);
    -- the FK cascade scans these on a destroy
