-- ============================================================================
-- gather-proofs.sql — Gather Stage G1 proofs (Gather-Checkpoint A)
-- ============================================================================
-- Run against a database with 20260721000001_init.sql THEN
-- 20260725000002_gather_reference.sql applied (run-gather-native.sh).
-- Self-contained transactions, each rolled back — the database is left
-- untouched. Every assertion RAISEs loudly on failure (\set ON_ERROR_STOP →
-- psql exits non-zero); each NOTICE is one green line. Models attacks.sql /
-- capture-proofs.sql: constraint-rejection blocks catch the EXPECTED refusal
-- and raise only when a write was WRONGLY accepted.
--
-- Runner identity: §§1-5 run as the DB superuser, which BYPASSES RLS on purpose
-- — those attack the TABLE CONSTRAINTS (physics), not the security boundary, so
-- RLS must be out of the way (the attacks.sql convention). §6 alone switches to
-- role `authenticated` under a simulated JWT to prove the owner-scoped wall.
--
-- Proves:
--   1. a reference ROUND-TRIPS off its own row; a direct `select *` (what
--      /export does) carries it; the reverse pair is a distinct directed tie;
--      and — the honest boundary — the DB ACCEPTS a non-text source, because
--      "from must be text" is an app-layer guard, NOT a DB constraint (the NOTE
--      in the migration).
--   2. reference_not_self REFUSES a self-tie.
--   3. reference_once REFUSES a duplicate ordered pair (mention twice = one row).
--   4. FK CASCADE — destroy a bit and its reference rows vanish BOTH ways (as
--      `from` and as `to`); other bits are untouched.
--   5. a reference to (or from) a NON-EXISTENT bit is FK-REJECTED — this is what
--      makes "derive-on-save skips dead ids" safe.
--   6. RLS OWNER-SCOPING — a stranger uid reads zero and cannot write; the owner
--      uid reads all (the D-094 wall, on the new table).
-- ============================================================================
\set ON_ERROR_STOP on


-- ---------------------------------------------------------------------------
-- 1 · ROUND-TRIP — a gathered tie is born, reads back, and is directed
-- ---------------------------------------------------------------------------
begin;
-- a text thought (the source) and a drawing (the target — any kind is gatherable)
insert into bit (id, type, body) values
  ('11110000-0000-0000-0000-000000000001', 'text',
   '<p>equanimity — see <span data-ref="11110000-0000-0000-0000-000000000002">fire doodle</span> for the order</p>');
insert into bit (id, type, strokes) values
  ('11110000-0000-0000-0000-000000000002', 'drawing', '{"strokes":[]}'::jsonb);
insert into reference (id, from_bit_id, to_bit_id) values
  ('efefefef-0000-0000-0000-000000000001',
   '11110000-0000-0000-0000-000000000001', '11110000-0000-0000-0000-000000000002');
do $$
declare fr uuid; t uuid; c timestamptz; n int;
begin
  -- (a) round-trip off the row
  select from_bit_id, to_bit_id, created_at into fr, t, c
    from reference where id = 'efefefef-0000-0000-0000-000000000001';
  if fr <> '11110000-0000-0000-0000-000000000001' then raise exception '1 FAIL: from read back as %', fr; end if;
  if t  <> '11110000-0000-0000-0000-000000000002' then raise exception '1 FAIL: to read back as %', t; end if;
  if c is null then raise exception '1 FAIL: created_at was not stamped'; end if;

  -- (b) export is a direct `select *` off the TABLE — it carries the row
  select count(*) into n from reference
    where from_bit_id = '11110000-0000-0000-0000-000000000001'
      and to_bit_id   = '11110000-0000-0000-0000-000000000002';
  if n <> 1 then raise exception '1 FAIL: a direct table select (export) omitted the reference'; end if;

  -- (c) DIRECTED: the reverse pair (target → source) is a DIFFERENT tie, allowed
  insert into reference (from_bit_id, to_bit_id) values
    ('11110000-0000-0000-0000-000000000002', '11110000-0000-0000-0000-000000000001');
  select count(*) into n from reference;
  if n <> 2 then raise exception '1 FAIL: the reverse directed pair was not accepted as a distinct tie (n=%)', n; end if;

  -- (d) THE HONEST BOUNDARY: "from must be text" is APP-layer, so the DB itself
  -- accepts a NON-TEXT source (here a drawing → a text bit). G2's one write door
  -- refuses this; G1 shows the DB does not, so the boundary is visible not hidden.
  insert into reference (from_bit_id, to_bit_id) values
    ('11110000-0000-0000-0000-000000000002', '11110000-0000-0000-0000-000000000001')
    on conflict do nothing;  -- (already exists from (c); the point is the DB never checked type)
  raise notice 'HOLDS ✓ 1 reference round-trips off its row · export (direct select *) is free · the reverse pair is a distinct directed tie · the DB does NOT enforce "from is text" (app-layer guard, by design)';
end $$;
rollback;


-- ---------------------------------------------------------------------------
-- 2 · reference_not_self — a bit cannot gather itself
-- ---------------------------------------------------------------------------
begin;
insert into bit (id, type, body) values
  ('22220000-0000-0000-0000-000000000001', 'text', '<p>a lone thought</p>');
do $$
begin
  begin
    insert into reference (from_bit_id, to_bit_id) values
      ('22220000-0000-0000-0000-000000000001', '22220000-0000-0000-0000-000000000001');
    raise exception '2 FAIL: a self-reference was accepted';
  exception when check_violation then
    raise notice 'REFUSED ✓ 2 reference_not_self: a bit cannot gather itself';
  end;
end $$;
rollback;


-- ---------------------------------------------------------------------------
-- 3 · reference_once — the same ordered pair twice = ONE row
-- ---------------------------------------------------------------------------
begin;
insert into bit (id, type, body) values
  ('33330000-0000-0000-0000-000000000001', 'text', '<p>the thought</p>'),
  ('33330000-0000-0000-0000-000000000002', 'text', '<p>the gathered bit</p>');
insert into reference (from_bit_id, to_bit_id) values
  ('33330000-0000-0000-0000-000000000001', '33330000-0000-0000-0000-000000000002');  -- first mention → one row
do $$
declare n int;
begin
  begin
    insert into reference (from_bit_id, to_bit_id) values
      ('33330000-0000-0000-0000-000000000001', '33330000-0000-0000-0000-000000000002');  -- mentioned again
    raise exception '3 FAIL: a duplicate (from,to) pair was accepted';
  exception when unique_violation then
    raise notice 'REFUSED ✓ 3 reference_once: the same target mentioned twice reconciles to ONE row';
  end;
  select count(*) into n from reference
    where from_bit_id = '33330000-0000-0000-0000-000000000001';
  if n <> 1 then raise exception '3 FAIL: expected exactly one row for the pair, got %', n; end if;
end $$;
rollback;


-- ---------------------------------------------------------------------------
-- 4 · FK CASCADE — destroy a bit → its references vanish BOTH ways
-- ---------------------------------------------------------------------------
begin;
insert into bit (id, type, body) values
  ('44440000-0000-0000-0000-00000000000a', 'text', '<p>A — the hub</p>'),
  ('44440000-0000-0000-0000-00000000000b', 'text', '<p>B</p>'),
  ('44440000-0000-0000-0000-00000000000c', 'text', '<p>C</p>');
-- A appears as a SOURCE (A→B) and as a TARGET (C→A)
insert into reference (from_bit_id, to_bit_id) values
  ('44440000-0000-0000-0000-00000000000a', '44440000-0000-0000-0000-00000000000b'),
  ('44440000-0000-0000-0000-00000000000c', '44440000-0000-0000-0000-00000000000a');
do $$
declare n int;
begin
  -- destroy A
  delete from bit where id = '44440000-0000-0000-0000-00000000000a';
  -- both its ties are gone — the one where A is `from` AND the one where A is `to`
  select count(*) into n from reference
    where from_bit_id = '44440000-0000-0000-0000-00000000000a'
       or to_bit_id   = '44440000-0000-0000-0000-00000000000a';
  if n <> 0 then raise exception '4 FAIL: % reference rows survived destroying A (cascade missed a direction)', n; end if;
  select count(*) into n from reference;
  if n <> 0 then raise exception '4 FAIL: reference rows remained after cascade (%)', n; end if;
  -- and B and C themselves are untouched — the cascade is scoped to the ties
  select count(*) into n from bit
    where id in ('44440000-0000-0000-0000-00000000000b', '44440000-0000-0000-0000-00000000000c');
  if n <> 2 then raise exception '4 FAIL: destroying A took other bits (% of 2 left)', n; end if;
  raise notice 'HOLDS ✓ 4 destroy a bit → its references vanish BOTH ways (as from and as to); other bits untouched';
end $$;
rollback;


-- ---------------------------------------------------------------------------
-- 5 · FK REJECTS a phantom endpoint — the safety behind "skip dead ids"
-- ---------------------------------------------------------------------------
begin;
insert into bit (id, type, body) values
  ('55550000-0000-0000-0000-000000000001', 'text', '<p>a real bit</p>');
do $$
begin
  -- a tie to a target that does not exist
  begin
    insert into reference (from_bit_id, to_bit_id) values
      ('55550000-0000-0000-0000-000000000001', 'ffffffff-ffff-ffff-ffff-ffffffffffff');
    raise exception '5 FAIL: a reference to a non-existent TARGET was accepted';
  exception when foreign_key_violation then
    raise notice 'REFUSED ✓ 5 a reference to a phantom TARGET is FK-rejected (derive-on-save can skip dead ids safely)';
  end;
  -- a tie from a source that does not exist
  begin
    insert into reference (from_bit_id, to_bit_id) values
      ('ffffffff-ffff-ffff-ffff-ffffffffffff', '55550000-0000-0000-0000-000000000001');
    raise exception '5 FAIL: a reference from a non-existent SOURCE was accepted';
  exception when foreign_key_violation then
    raise notice 'REFUSED ✓ 5b a reference from a phantom SOURCE is FK-rejected';
  end;
end $$;
rollback;


-- ---------------------------------------------------------------------------
-- 6 · RLS OWNER-SCOPING — the D-094 wall on the new table
--     (proven the way the D-094 policy is written: auth.uid() vs a JWT sub;
--     the harness stands in the Supabase auth.uid() reading request.jwt.claims)
-- ---------------------------------------------------------------------------
begin;
-- seed as superuser (RLS bypassed): two bits + a tie between them
insert into bit (id, type, body) values
  ('66660000-0000-0000-0000-00000000000a', 'text', '<p>owner source</p>'),
  ('66660000-0000-0000-0000-00000000000b', 'text', '<p>owner target</p>');
insert into reference (from_bit_id, to_bit_id) values
  ('66660000-0000-0000-0000-00000000000a', '66660000-0000-0000-0000-00000000000b');

-- OWNER (jwt sub = the owner uid) reads all
set local request.jwt.claims = '{"sub":"298fbf29-39c8-4738-96d0-3348f0e59fd0"}';
set local role authenticated;
do $$
declare n int;
begin
  select count(*) into n from reference;
  if n <> 1 then raise exception '6 FAIL: the owner cannot read its own reference (saw %, want 1)', n; end if;
  raise notice 'HOLDS ✓ 6 owner (jwt sub = owner uid) reads all reference rows';
end $$;
reset role;

-- STRANGER (a different signed-up uid) reads zero and cannot write
set local request.jwt.claims = '{"sub":"00000000-0000-0000-0000-0000000000ff"}';
set local role authenticated;
do $$
declare n int;
begin
  select count(*) into n from reference;
  if n <> 0 then raise exception '6 FAIL: a stranger uid read % reference rows (want 0)', n; end if;
  begin
    insert into reference (from_bit_id, to_bit_id) values
      ('66660000-0000-0000-0000-00000000000b', '66660000-0000-0000-0000-00000000000a');
    raise exception '6 FAIL: a stranger uid was allowed to write a reference';
  exception when insufficient_privilege then
    raise notice 'REFUSED ✓ 6b a stranger uid cannot write a reference (WITH CHECK owner clause)';
  end;
  raise notice 'HOLDS ✓ 6 a stranger uid reads zero reference rows (owner-scoped wall)';
end $$;
reset role;
rollback;


\echo '--- gather-proofs.sql complete: reference round-trips (directed) · not-self + once refused · cascade both ways · phantom endpoints rejected · owner-scoped RLS holds ---'
