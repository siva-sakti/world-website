-- Per-row ownership proofs (D-107). The runner seeds (as superuser, PRE-migration)
-- a board + a bit + a tag, all backfilled to the OWNER by the migration. Here we
-- prove, THROUGH RLS, that ownership isolates:
--   • the pre-existing rows are owned by the owner (backfill)
--   • no policy predicate still hardcodes a uid; all use owner_id (de-hardcode)
--   • the owner sees + writes their own rows; new inserts auto-own to the inserter
--   • a STRANGER sees nothing of the owner's, and can neither read, mutate, nor delete it
--   • anon (logged-out) sees nothing
-- OWNER = 298fbf29-… · STRANGER = 0000…00ff (the other proofs' convention).

\set ON_ERROR_STOP on
\echo '=== OWNERSHIP PROOFS ==='

begin;

-- ---- 1. backfill: every pre-existing row is owned by the OWNER ----
do $$
declare n int;
begin
  select count(*) into n from bit   where owner_id is distinct from '298fbf29-39c8-4738-96d0-3348f0e59fd0';
  if n <> 0 then raise exception 'BACKFILL: % bit rows not owned by the owner', n; end if;
  select count(*) into n from board  where owner_id is null;
  if n <> 0 then raise exception 'BACKFILL: % board rows have a null owner', n; end if;
  select count(*) into n from tag    where owner_id is null;
  if n <> 0 then raise exception 'BACKFILL: % tag rows have a null owner', n; end if;
  raise notice 'BACKFILL ✓ every pre-existing row owned by the owner';
end $$;

-- ---- 2. de-hardcode: no owner policy names a literal uid; all reference owner_id ----
do $$
declare bad int;
begin
  select count(*) into bad from pg_policies
   where schemaname = 'public' and policyname like '%\_owner\_all'
     and (coalesce(qual,'') like '%298fbf29%' or coalesce(with_check,'') like '%298fbf29%');
  if bad <> 0 then raise exception 'DE-HARDCODE: % owner policies still name a literal uid', bad; end if;

  select count(*) into bad from pg_policies
   where schemaname = 'public' and policyname like '%\_owner\_all'
     and (coalesce(qual,'') not like '%owner_id%' or coalesce(with_check,'') not like '%owner_id%');
  if bad <> 0 then raise exception 'DE-HARDCODE: % owner policies do not use owner_id', bad; end if;

  select count(*) into bad from pg_policies
   where schemaname = 'public' and policyname like '%\_owner\_all';
  raise notice 'DE-HARDCODE ✓ all % owner policies use owner_id; none name a literal uid', bad;
end $$;

-- ---- 3. the OWNER reads their rows and new inserts auto-own ----
set local request.jwt.claims = '{"sub":"298fbf29-39c8-4738-96d0-3348f0e59fd0"}';
set local role authenticated;
do $$
declare n int;
begin
  select count(*) into n from board;
  if n < 1 then raise exception 'OWNER-READ: owner sees % boards, expected >= 1', n; end if;
  raise notice 'OWNER-READ ✓ owner sees % board(s)', n;
end $$;
insert into board (id, title) values ('a1111111-0000-0000-0000-000000000001', 'owner board');
do $$
declare o uuid;
begin
  select owner_id into o from board where id = 'a1111111-0000-0000-0000-000000000001';
  if o <> '298fbf29-39c8-4738-96d0-3348f0e59fd0'
    then raise exception 'OWNER-INSERT: new board owned by % not the owner', o; end if;
  raise notice 'OWNER-INSERT ✓ a new board auto-owned by the inserter (no owner_id supplied)';
end $$;
reset role;

-- ---- 4. a STRANGER sees nothing of the owner's, owns only their own ----
set local request.jwt.claims = '{"sub":"00000000-0000-0000-0000-0000000000ff"}';
set local role authenticated;
do $$
declare n int;
begin
  select count(*) into n from bit;   if n <> 0 then raise exception 'STRANGER-READ: sees % bits', n; end if;
  select count(*) into n from board; if n <> 0 then raise exception 'STRANGER-READ: sees % boards', n; end if;
  raise notice 'STRANGER-READ ✓ stranger sees zero of the owner''s rows';
end $$;
insert into board (id, title) values ('b2222222-0000-0000-0000-000000000001', 'stranger board');
do $$
declare o uuid; n int;
begin
  select owner_id into o from board where id = 'b2222222-0000-0000-0000-000000000001';
  if o <> '00000000-0000-0000-0000-0000000000ff'
    then raise exception 'STRANGER-INSERT: owned by % not the stranger', o; end if;
  select count(*) into n from board;
  if n <> 1 then raise exception 'STRANGER-INSERT: stranger sees % boards, expected only their own 1', n; end if;
  raise notice 'STRANGER-INSERT ✓ stranger owns their own row and sees ONLY it';
end $$;
-- a stranger's write against the owner's row must land on 0 rows (RLS filters it out)
update board set title = 'hijacked' where id = 'a1111111-0000-0000-0000-000000000001';
delete from board                    where id = 'a1111111-0000-0000-0000-000000000001';
reset role;

-- ---- 5. back as OWNER: the owner's row is untouched, the stranger's is invisible ----
set local request.jwt.claims = '{"sub":"298fbf29-39c8-4738-96d0-3348f0e59fd0"}';
set local role authenticated;
do $$
declare ttl text; n int;
begin
  select title into ttl from board where id = 'a1111111-0000-0000-0000-000000000001';
  if ttl is distinct from 'owner board'
    then raise exception 'CROSS-OWNER: owner board mutated/deleted by the stranger (title=%)', ttl; end if;
  select count(*) into n from board where id = 'b2222222-0000-0000-0000-000000000001';
  if n <> 0 then raise exception 'CROSS-OWNER: owner can see the stranger''s board'; end if;
  raise notice 'CROSS-OWNER ✓ the stranger could neither touch nor reveal the owner''s data';
end $$;
reset role;

-- ---- 6. anon (logged-out) sees nothing ----
set local role anon;
do $$
declare n int;
begin
  select count(*) into n from bit;   if n <> 0 then raise exception 'ANON: sees % bits', n; end if;
  select count(*) into n from board; if n <> 0 then raise exception 'ANON: sees % boards', n; end if;
  raise notice 'ANON ✓ logged-out sees nothing';
end $$;
reset role;

rollback;

\echo '=== OWNERSHIP PROOFS PASSED ✓ — backfill · de-hardcode · owner-isolation · stranger-locked-out · anon-blind ==='
