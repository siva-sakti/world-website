-- ============================================================================
-- shelf-proofs.sql — the shelf migration's behavior proofs (organize plan O1)
-- Run by run-shelf-native.sh on a THROWAWAY db, through the auth stand-ins.
-- Proves: group create/unique · assign · delete-group-strands-nothing ·
-- pins on board+bit · home exposes the new columns · owner isolation · anon blind.
-- ============================================================================

\set ON_ERROR_STOP on

-- ---- as OWNER A -----------------------------------------------------------
set request.jwt.claims = '{"sub":"a0000000-0000-0000-0000-000000000001"}';
set role authenticated;

-- 1 · groups: create two, in my order
insert into shelf_group (name, position) values ('reading', 1), ('life', 2);
do $$ begin
  if (select count(*) from shelf_group) <> 2 then raise exception 'FAIL: expected 2 groups'; end if;
  raise notice 'PROOF 1 ok — two groups created, owner_id defaulted';
end $$;

-- 2 · one section per name (unique per owner)
do $$ begin
  begin
    insert into shelf_group (name, position) values ('reading', 9);
    raise exception 'FAIL: duplicate group name was accepted';
  exception when unique_violation then
    raise notice 'PROOF 2 ok — duplicate name refused';
  end;
end $$;

-- 3 · a board joins a group; home shows the shelf columns
insert into board (id, title) values ('a0000000-0000-0000-0000-00000000b001', 'buddhism');
update board set group_id = (select id from shelf_group where name = 'reading')
  where id = 'a0000000-0000-0000-0000-00000000b001';
do $$ begin
  if (select group_id from home where id = 'a0000000-0000-0000-0000-00000000b001') is null
    then raise exception 'FAIL: home does not expose group_id'; end if;
  raise notice 'PROOF 3 ok — board grouped; home view carries group_id';
end $$;

-- 4 · pins float: board + bit both pinnable
insert into bit (id, type, body) values ('a0000000-0000-0000-0000-00000000c001', 'text', '<p>keep this close</p>');
update board set pinned_at = now() where id = 'a0000000-0000-0000-0000-00000000b001';
update bit   set pinned_at = now() where id = 'a0000000-0000-0000-0000-00000000c001';
do $$ begin
  if (select pinned_at from home where id = 'a0000000-0000-0000-0000-00000000b001') is null
    then raise exception 'FAIL: board pin did not stick / home missing pinned_at'; end if;
  if (select pinned_at from bit where id = 'a0000000-0000-0000-0000-00000000c001') is null
    then raise exception 'FAIL: bit pin did not stick'; end if;
  raise notice 'PROOF 4 ok — board + bit pinned';
end $$;

-- 5 · deleting a section strands nothing (set-null physics)
delete from shelf_group where name = 'reading';
do $$ begin
  if (select count(*) from board where id = 'a0000000-0000-0000-0000-00000000b001') <> 1
    then raise exception 'FAIL: board vanished with its group'; end if;
  if (select group_id from board where id = 'a0000000-0000-0000-0000-00000000b001') is not null
    then raise exception 'FAIL: group_id not cleared on group delete'; end if;
  raise notice 'PROOF 5 ok — group deleted; the board survives, ungrouped';
end $$;

-- 6 · position swap passes (no unique constraint mid-swap)
insert into shelf_group (name, position) values ('projects', 3);
update shelf_group set position = 3 where name = 'life';
update shelf_group set position = 2 where name = 'projects';
do $$ begin raise notice 'PROOF 6 ok — positions reorder freely'; end $$;

reset role;

-- ---- as STRANGER B --------------------------------------------------------
set request.jwt.claims = '{"sub":"b0000000-0000-0000-0000-000000000001"}';
set role authenticated;

do $$ begin
  if (select count(*) from shelf_group) <> 0
    then raise exception 'FAIL: stranger can SEE another shelf''s groups'; end if;
  raise notice 'PROOF 7 ok — stranger sees zero foreign groups';
end $$;

-- stranger cannot re-shelve the owner's board (RLS: 0 rows touched)
update board set group_id = null, pinned_at = now()
  where id = 'a0000000-0000-0000-0000-00000000b001';
do $$ begin
  if (select count(*) from board where pinned_at is not null and id = 'a0000000-0000-0000-0000-00000000b001') <> 0
    then raise exception 'FAIL: stranger pinned the owner''s board'; end if;
  raise notice 'PROOF 8 ok — stranger''s writes land on zero rows';
end $$;

-- stranger cannot plant a group INTO the owner's shelf (with-check)
do $$ begin
  begin
    insert into shelf_group (name, position, owner_id)
      values ('trojan', 1, 'a0000000-0000-0000-0000-000000000001');
    raise exception 'FAIL: cross-owner group insert was accepted';
  exception when insufficient_privilege or check_violation then
    raise notice 'PROOF 9 ok — cross-owner insert refused';
  end;
end $$;

reset role;

-- ---- as ANON --------------------------------------------------------------
set request.jwt.claims = '{}';
set role anon;
do $$ begin
  if (select count(*) from shelf_group) <> 0
    then raise exception 'FAIL: anon can see shelf groups'; end if;
  raise notice 'PROOF 10 ok — anon blind to the shelf';
end $$;
reset role;

\echo ALL SHELF PROOFS PASSED
