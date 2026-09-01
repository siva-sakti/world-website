-- ============================================================================
-- APPLY THE `opening` MIGRATION TO CLOUD (Supabase SQL Editor). One transaction.
-- This is 20260903000001_opening.sql verbatim, comments trimmed.
--
-- What it adds: one new table, `opening` — where you were. Nothing existing is
-- touched: no column added, no view redefined, no trigger changed, no data
-- rewritten. Purely additive, so there is nothing to back up first.
--
-- Proven on a throwaway PG17 (all 19 migrations + 12 behavior proofs green —
-- verification/run-opening-native.sh · opening-proofs.out), including that
-- recording an opening leaves bit.updated_at and board.updated_at UNTOUCHED.
--
-- Paste ONLY the SQL below. Expect "Success. No rows returned."
-- ============================================================================

begin;

create table opening (
  id         uuid primary key default gen_random_uuid(),
  owner_id   uuid not null default auth.uid(),
  board_id   uuid references board(id) on delete cascade,
  bit_id     uuid references bit(id)   on delete cascade,
  opened_at  timestamptz not null default now(),
  constraint opening_exactly_one_target check ((board_id is null) <> (bit_id is null)),
  constraint opening_one_per_board unique (owner_id, board_id),
  constraint opening_one_per_bit   unique (owner_id, bit_id)
);

create index opening_owner_recent on opening (owner_id, opened_at desc);
create index opening_board on opening (board_id);
create index opening_bit   on opening (bit_id);

alter table opening enable row level security;
create policy opening_owner_all on opening
  for all to authenticated
  using (auth.uid() = owner_id) with check (auth.uid() = owner_id);

commit;
