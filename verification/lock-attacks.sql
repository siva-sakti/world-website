-- ============================================================================
-- lock-attacks.sql — the lock+description migration proof (board-basics-plan B+).
-- Run against a database with ALL migrations applied through
-- 20260902000001_lock_and_description.sql. One transaction, rolled back.
-- ============================================================================

\set ON_ERROR_STOP on
begin;

do $$
declare opt text[]; v timestamptz; d text;
begin
  -- LK-C1 · both columns exist with the right types
  perform 1 from information_schema.columns
    where table_name = 'placement' and column_name = 'locked_at' and data_type = 'timestamp with time zone';
  if not found then raise exception 'LK-C1 FAILED: placement.locked_at missing/wrong type'; end if;
  perform 1 from information_schema.columns
    where table_name = 'board' and column_name = 'description' and data_type = 'text';
  if not found then raise exception 'LK-C1 FAILED: board.description missing/wrong type'; end if;
  raise notice 'OK LK-C1 both columns exist (locked_at timestamptz · description text)';

  -- LK-C2 · board_cards exposes locked_at
  perform 1 from information_schema.columns
    where table_name = 'board_cards' and column_name = 'locked_at';
  if not found then raise exception 'LK-C2 FAILED: board_cards does not expose locked_at'; end if;
  raise notice 'OK LK-C2 board_cards exposes locked_at';

  -- LK-C3 · THE RLS GUARD: the replaced view KEPT security_invoker (OR REPLACE resets
  -- unspecified reloptions — dropping it would be a silent definer-rights regression)
  select reloptions into opt from pg_class where relname = 'board_cards';
  if opt is null or not ('security_invoker=true' = any(opt) or 'security_invoker=on' = any(opt)) then
    raise exception 'LK-C3 FAILED: board_cards lost security_invoker (reloptions=%)', opt;
  end if;
  raise notice 'OK LK-C3 board_cards still runs with security_invoker (RLS intact)';

  -- LK-C4 · a locked placement flows through the view; an unlocked one reads null
  insert into board (id, title, description) values
    ('b0000000-0000-0000-0000-0000000000f1', 'Locks', 'a quiet description');
  insert into bit (id, type, body) values
    ('a0000000-0000-0000-0000-0000000000f1', 'text', '<p>pinned down</p>');
  insert into placement (id, board_id, target_bit_id, x, y, locked_at) values
    ('c0000000-0000-0000-0000-0000000000f1', 'b0000000-0000-0000-0000-0000000000f1',
     'a0000000-0000-0000-0000-0000000000f1', 10, 10, now());
  select locked_at into v from board_cards where placement_id = 'c0000000-0000-0000-0000-0000000000f1';
  if v is null then raise exception 'LK-C4 FAILED: locked_at did not flow through board_cards'; end if;
  select description into d from board where id = 'b0000000-0000-0000-0000-0000000000f1';
  if d <> 'a quiet description' then raise exception 'LK-C4 FAILED: description round-trip'; end if;
  raise notice 'OK LK-C4 lock + description round-trip through view and table';
end $$;

rollback;
\echo 'lock-attacks: ALL PROOFS PASSED (rolled back — database untouched)'
