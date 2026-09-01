-- ============================================================================
-- OPENING PROOFS — "where you were" (migration 20260903000001_opening.sql)
-- ============================================================================
-- Runs against the FULL migration chain on a throwaway PG17 (run-opening-native.sh).
--
-- Proofs 3, 4 and 5 are REGRESSION TESTS FOR TWO FATAL DEFECTS the antagonist
-- caught in the plan before it was built, both of which would have been SILENT:
--   · the plan specified PARTIAL unique indexes — PostgREST cannot emit an index
--     predicate, so ON CONFLICT could never infer them and every open would have
--     thrown 42P10 into a .catch(() => {}). The trail would have stayed empty
--     forever with no error anywhere.
--   · `default now()` fires on INSERT only, so a payload without opened_at would
--     have left the timestamp frozen at the first-ever visit — the trail could
--     never reorder, which is the entire feature.
-- Proof 3 runs the EXACT statement shape PostgREST emits (bare column names, no
-- predicate). Proof 4 proves the timestamp moves when carried; proof 5 proves it
-- does NOT when omitted — the reason lib/db/openings.ts must always send it.
--
-- NOTE ON CLOCKS: opened_at is sent by the CLIENT (lib/db/openings.ts passes its
-- own new Date()), never defaulted on re-open. These proofs use clock_timestamp()
-- to model that — now() is transaction_timestamp() and is FROZEN for the whole
-- proof transaction, so a now()-based payload can never appear to move.
--
-- OWNER = 298fbf29-… · STRANGER = 0000…00ff (the house convention).
-- ============================================================================

\set ON_ERROR_STOP on
\echo '=== OPENING PROOFS ==='

begin;

-- Fixtures, as superuser (RLS bypassed): a board, a note, and a plain bit.
-- kind is ('bit'|'note') only — kind_and_folder_stars:12.
insert into board (id, title, owner_id)
  values ('0b000000-0000-0000-0000-000000000001', 'a board',
          '298fbf29-39c8-4738-96d0-3348f0e59fd0');
-- a text bit needs a body (bit_substance_matches_type, source_first_class:163)
insert into bit (id, kind, type, content, body, owner_id)
  values ('0b100000-0000-0000-0000-000000000001', 'note', 'text', 'a note', 'the writing',
          '298fbf29-39c8-4738-96d0-3348f0e59fd0');
insert into bit (id, kind, type, content, body, owner_id)
  values ('0b100000-0000-0000-0000-000000000002', 'bit', 'text', 'a fragment', 'some words',
          '298fbf29-39c8-4738-96d0-3348f0e59fd0');

-- ---------------------------------------------------------------------------
-- 1. the exactly-one-target CHECK: both set, and neither set, are both refused
do $$
begin
  begin
    insert into opening (owner_id, board_id, bit_id)
      values ('298fbf29-39c8-4738-96d0-3348f0e59fd0',
              '0b000000-0000-0000-0000-000000000001',
              '0b100000-0000-0000-0000-000000000001');
    raise exception 'FAIL 1a: an opening with BOTH targets was accepted';
  exception when check_violation then null; end;

  begin
    insert into opening (owner_id) values ('298fbf29-39c8-4738-96d0-3348f0e59fd0');
    raise exception 'FAIL 1b: an opening with NEITHER target was accepted';
  exception when check_violation then null; end;

  raise notice 'PASS 1 — exactly one target: both-set and neither-set are refused';
end $$;

-- ---------------------------------------------------------------------------
-- 2. dedupe is STRUCTURAL: a second plain insert for the same (owner, board) fails
do $$
begin
  insert into opening (owner_id, board_id)
    values ('298fbf29-39c8-4738-96d0-3348f0e59fd0', '0b000000-0000-0000-0000-000000000001');
  begin
    insert into opening (owner_id, board_id)
      values ('298fbf29-39c8-4738-96d0-3348f0e59fd0', '0b000000-0000-0000-0000-000000000001');
    raise exception 'FAIL 2: a second opening row for the same board was accepted';
  exception when unique_violation then null; end;
  raise notice 'PASS 2 — one row per (owner, board): the second insert is refused';
end $$;

-- ---------------------------------------------------------------------------
-- 3. ★ THE FATAL-DEFECT-1 REGRESSION: the EXACT statement PostgREST emits for
--    .upsert(row, { onConflict: "owner_id,board_id" }) — bare column names, NO
--    index predicate. Against a PARTIAL index this raises 42P10 every time.
do $$
begin
  insert into opening (owner_id, board_id, opened_at)
    values ('298fbf29-39c8-4738-96d0-3348f0e59fd0',
            '0b000000-0000-0000-0000-000000000001', clock_timestamp())
  on conflict (owner_id, board_id)
    do update set board_id = excluded.board_id, opened_at = excluded.opened_at;
  raise notice 'PASS 3 — PostgREST''s predicate-free ON CONFLICT infers the constraint';
exception
  when invalid_column_reference then
    raise exception 'FAIL 3: ON CONFLICT cannot infer the constraint (42P10) — a PARTIAL index has come back';
end $$;

-- and the same for the note side, which uses the other conflict target
do $$
begin
  insert into opening (owner_id, bit_id, opened_at)
    values ('298fbf29-39c8-4738-96d0-3348f0e59fd0',
            '0b100000-0000-0000-0000-000000000001', clock_timestamp())
  on conflict (owner_id, bit_id)
    do update set bit_id = excluded.bit_id, opened_at = excluded.opened_at;
  raise notice 'PASS 3b — the note conflict target infers too';
exception
  when invalid_column_reference then
    raise exception 'FAIL 3b: the note-side ON CONFLICT cannot infer its constraint';
end $$;

-- ---------------------------------------------------------------------------
-- 4. ★ THE FATAL-DEFECT-2 REGRESSION: opened_at MOVES when it is in the payload.
--    Without this the trail freezes in first-visit order and never reorders —
--    which is the whole feature.
do $$
declare t1 timestamptz; t2 timestamptz; n int;
begin
  select opened_at into t1 from opening
    where board_id = '0b000000-0000-0000-0000-000000000001';
  perform pg_sleep(0.05);
  insert into opening (owner_id, board_id, opened_at)
    values ('298fbf29-39c8-4738-96d0-3348f0e59fd0',
            '0b000000-0000-0000-0000-000000000001', clock_timestamp())
  on conflict (owner_id, board_id)
    do update set board_id = excluded.board_id, opened_at = excluded.opened_at;
  select opened_at into t2 from opening
    where board_id = '0b000000-0000-0000-0000-000000000001';
  select count(*) into n from opening
    where board_id = '0b000000-0000-0000-0000-000000000001';

  if n <> 1 then raise exception 'FAIL 4a: the upsert made a second row (% rows)', n; end if;
  if t2 <= t1 then
    raise exception 'FAIL 4b: opened_at did not move (% -> %) — the trail can never reorder', t1, t2;
  end if;
  raise notice 'PASS 4 — re-opening UPDATES the one row and moves opened_at forward';
end $$;

-- ---------------------------------------------------------------------------
-- 5. the other half of the same lesson: OMIT opened_at and it does NOT move.
--    This is why lib/db/openings.ts must always carry the timestamp.
do $$
declare t1 timestamptz; t2 timestamptz;
begin
  select opened_at into t1 from opening
    where board_id = '0b000000-0000-0000-0000-000000000001';
  perform pg_sleep(0.05);
  insert into opening (owner_id, board_id)
    values ('298fbf29-39c8-4738-96d0-3348f0e59fd0', '0b000000-0000-0000-0000-000000000001')
  on conflict (owner_id, board_id) do update set board_id = excluded.board_id;
  select opened_at into t2 from opening
    where board_id = '0b000000-0000-0000-0000-000000000001';
  if t2 <> t1 then raise exception 'FAIL 5: opened_at moved without being in the payload'; end if;
  raise notice 'PASS 5 — omitting opened_at leaves it frozen (the defect, documented)';
end $$;

-- ---------------------------------------------------------------------------
-- 6. NULLS DISTINCT: many note openings coexist under unique (owner_id, board_id)
do $$
declare n int;
begin
  insert into opening (owner_id, bit_id, opened_at)
    values ('298fbf29-39c8-4738-96d0-3348f0e59fd0',
            '0b100000-0000-0000-0000-000000000002', clock_timestamp());
  select count(*) into n from opening where board_id is null;
  if n < 2 then
    raise exception 'FAIL 6: only % note opening(s) — the null board_id rows are colliding', n;
  end if;
  raise notice 'PASS 6 — % note openings coexist (NULLS DISTINCT)', n;
end $$;

-- ---------------------------------------------------------------------------
-- 7. ★ THE §4 TRAP, PROVEN CLOSED: recording an opening must NOT touch the
--    target's updated_at — otherwise merely OPENING a note would look EDITED and
--    corrupt home's touched_at, the "recently modified" sort and /notes' sort.
do $$
declare b1 timestamptz; b2 timestamptz; n1 timestamptz; n2 timestamptz;
begin
  select updated_at into b1 from board where id = '0b000000-0000-0000-0000-000000000001';
  select updated_at into n1 from bit   where id = '0b100000-0000-0000-0000-000000000001';
  perform pg_sleep(0.05);
  insert into opening (owner_id, board_id, opened_at)
    values ('298fbf29-39c8-4738-96d0-3348f0e59fd0',
            '0b000000-0000-0000-0000-000000000001', clock_timestamp())
  on conflict (owner_id, board_id) do update set opened_at = excluded.opened_at;
  insert into opening (owner_id, bit_id, opened_at)
    values ('298fbf29-39c8-4738-96d0-3348f0e59fd0',
            '0b100000-0000-0000-0000-000000000001', clock_timestamp())
  on conflict (owner_id, bit_id) do update set opened_at = excluded.opened_at;
  select updated_at into b2 from board where id = '0b000000-0000-0000-0000-000000000001';
  select updated_at into n2 from bit   where id = '0b100000-0000-0000-0000-000000000001';

  if b2 <> b1 then raise exception 'FAIL 7a: opening a board changed board.updated_at'; end if;
  if n2 <> n1 then raise exception 'FAIL 7b: opening a note changed bit.updated_at'; end if;
  raise notice 'PASS 7 — an opening leaves updated_at untouched on BOTH targets';
end $$;

-- ---------------------------------------------------------------------------
-- 8. the table carries no updated_at trigger of its own (one clock, by design)
do $$
begin
  if exists (
    select 1 from pg_trigger t join pg_class c on c.oid = t.tgrelid
    where c.relname = 'opening' and not t.tgisinternal
  ) then
    raise exception 'FAIL 8: opening has a trigger — it must have exactly one clock';
  end if;
  raise notice 'PASS 8 — opening has no triggers';
end $$;

-- ---------------------------------------------------------------------------
-- 9. FK cascade: destroying a board / a bit takes its openings with it
do $$
declare n int;
begin
  delete from board where id = '0b000000-0000-0000-0000-000000000001';
  select count(*) into n from opening where board_id = '0b000000-0000-0000-0000-000000000001';
  if n <> 0 then raise exception 'FAIL 9a: % opening(s) survived the board''s destroy', n; end if;

  delete from bit where id = '0b100000-0000-0000-0000-000000000001';
  select count(*) into n from opening where bit_id = '0b100000-0000-0000-0000-000000000001';
  if n <> 0 then raise exception 'FAIL 9b: % opening(s) survived the bit''s destroy', n; end if;
  raise notice 'PASS 9 — destroying a target cascades its openings away';
end $$;

-- ---------------------------------------------------------------------------
-- 10. RLS, through the real roles: a stranger sees none of the owner's openings
--     and cannot forge one onto the owner.
insert into opening (owner_id, bit_id, opened_at)
  values ('298fbf29-39c8-4738-96d0-3348f0e59fd0',
          '0b100000-0000-0000-0000-000000000002', clock_timestamp())
  on conflict (owner_id, bit_id) do update set opened_at = excluded.opened_at;

set local request.jwt.claims = '{"sub":"00000000-0000-0000-0000-0000000000ff"}';
set local role authenticated;
do $$
declare n int;
begin
  select count(*) into n from opening;
  if n <> 0 then raise exception 'STRANGER-READ FAIL: sees % opening(s)', n; end if;
  raise notice 'PASS 10a — a stranger sees zero of the owner''s openings';
end $$;
do $$
begin
  begin
    insert into opening (owner_id, bit_id, opened_at)
      values ('298fbf29-39c8-4738-96d0-3348f0e59fd0',
              '0b100000-0000-0000-0000-000000000002', clock_timestamp());
    raise exception 'STRANGER-WRITE FAIL: forged an opening onto the owner';
  exception when insufficient_privilege then null; end;
  raise notice 'PASS 10b — a stranger cannot forge an opening onto the owner';
end $$;

reset role;
set local request.jwt.claims = '{"sub":"298fbf29-39c8-4738-96d0-3348f0e59fd0"}';
set local role authenticated;
do $$
declare n int;
begin
  select count(*) into n from opening;
  if n < 1 then raise exception 'OWNER-READ FAIL: the owner sees % of their own', n; end if;
  raise notice 'PASS 10c — the owner sees their own openings (%)', n;
end $$;
reset role;

\echo 'ALL OPENING PROOFS PASSED'
rollback; -- proofs leave nothing behind
