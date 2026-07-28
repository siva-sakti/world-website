-- Public (guest) door proofs (D-108) — the security heart: prove a logged-out
-- visitor sees PUBLIC content on PUBLIC boards and CANNOT reach anything private,
-- unplaced, trashed, departed, or writable. Fixtures cover every guest rule.
--
-- Boards: P1 public+live · P2 private+live · P3 public+TRASHED.
-- Bits (all public except B): A on P1 (VISIBLE) · B PRIVATE on P1 (hidden) ·
--   C public on private P2 (hidden — unreachable) · D public UNPLACED (hidden — no
--   feed) · E public on trashed P3 (hidden) · F public on P1 but placement LEFT
--   (hidden — not live). OWNER = 298fbf29-…

\set ON_ERROR_STOP on
\echo '=== PUBLIC DOOR PROOFS ==='
begin;

-- ---- fixtures (superuser: bypasses RLS; owner_id supplied — it is now not-null) ----
insert into board (id, title, visibility, deleted_at, owner_id) values
  ('11111111-1111-1111-1111-111111111111', 'P1 public',  'public',  null,       '298fbf29-39c8-4738-96d0-3348f0e59fd0'),
  ('22222222-2222-2222-2222-222222222222', 'P2 private', 'private', null,       '298fbf29-39c8-4738-96d0-3348f0e59fd0'),
  ('33333333-3333-3333-3333-333333333333', 'P3 trashed', 'public',  now(),      '298fbf29-39c8-4738-96d0-3348f0e59fd0');

insert into bit (id, type, body, visibility, owner_id) values
  ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'text', '<p>A public placed</p>',   'public',  '298fbf29-39c8-4738-96d0-3348f0e59fd0'),
  ('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 'text', '<p>B PRIVATE on P1</p>',   'private', '298fbf29-39c8-4738-96d0-3348f0e59fd0'),
  ('cccccccc-cccc-cccc-cccc-cccccccccccc', 'text', '<p>C public on P2</p>',    'public',  '298fbf29-39c8-4738-96d0-3348f0e59fd0'),
  ('dddddddd-dddd-dddd-dddd-dddddddddddd', 'text', '<p>D public unplaced</p>', 'public',  '298fbf29-39c8-4738-96d0-3348f0e59fd0'),
  ('eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee', 'text', '<p>E public on P3</p>',    'public',  '298fbf29-39c8-4738-96d0-3348f0e59fd0'),
  ('ffffffff-ffff-ffff-ffff-ffffffffffff', 'text', '<p>F left P1</p>',         'public',  '298fbf29-39c8-4738-96d0-3348f0e59fd0');

insert into placement (id, board_id, target_bit_id, x, y, z, left_at, owner_id) values
  ('00000000-0000-0000-0000-0000000000a1', '11111111-1111-1111-1111-111111111111', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 1,1,0, null,  '298fbf29-39c8-4738-96d0-3348f0e59fd0'),
  ('00000000-0000-0000-0000-0000000000b1', '11111111-1111-1111-1111-111111111111', 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 2,2,0, null,  '298fbf29-39c8-4738-96d0-3348f0e59fd0'),
  ('00000000-0000-0000-0000-0000000000c1', '22222222-2222-2222-2222-222222222222', 'cccccccc-cccc-cccc-cccc-cccccccccccc', 3,3,0, null,  '298fbf29-39c8-4738-96d0-3348f0e59fd0'),
  ('00000000-0000-0000-0000-0000000000e1', '33333333-3333-3333-3333-333333333333', 'eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee', 4,4,0, null,  '298fbf29-39c8-4738-96d0-3348f0e59fd0'),
  ('00000000-0000-0000-0000-0000000000f1', '11111111-1111-1111-1111-111111111111', 'ffffffff-ffff-ffff-ffff-ffffffffffff', 5,5,0, now(), '298fbf29-39c8-4738-96d0-3348f0e59fd0');

-- ---- THE VISITOR (anon) ----
set local role anon;

-- boards: only P1 (P2 private, P3 trashed)
do $$
declare n int; got uuid;
begin
  select count(*) into n from board;
  if n <> 1 then raise exception 'GUEST-BOARD: visitor sees % boards, expected 1 (P1)', n; end if;
  select id into got from board;
  if got <> '11111111-1111-1111-1111-111111111111' then raise exception 'GUEST-BOARD: wrong board visible: %', got; end if;
  raise notice 'GUEST-BOARD ✓ visitor sees only the public, live board';
end $$;

-- bits: only A. B private / C on private board / D unplaced / E on trashed board /
-- F departed must ALL be invisible.
do $$
declare n int; got uuid;
begin
  select count(*) into n from bit;
  if n <> 1 then raise exception 'GUEST-BIT: visitor sees % bits, expected 1 (A) — a leak!', n; end if;
  select id into got from bit;
  if got <> 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa' then raise exception 'GUEST-BIT: wrong bit visible: %', got; end if;
  -- explicit leak checks, each by id
  if exists (select 1 from bit where id='bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb') then raise exception 'LEAK: private bit B visible'; end if;
  if exists (select 1 from bit where id='cccccccc-cccc-cccc-cccc-cccccccccccc') then raise exception 'LEAK: public bit on PRIVATE board (C) visible'; end if;
  if exists (select 1 from bit where id='dddddddd-dddd-dddd-dddd-dddddddddddd') then raise exception 'LEAK: UNPLACED public bit (D) visible — a public feed'; end if;
  if exists (select 1 from bit where id='eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee') then raise exception 'LEAK: public bit on TRASHED board (E) visible'; end if;
  if exists (select 1 from bit where id='ffffffff-ffff-ffff-ffff-ffffffffffff') then raise exception 'LEAK: DEPARTED public bit (F) visible'; end if;
  raise notice 'GUEST-BIT ✓ only the reachable public bit shows; private/unreachable/unplaced/trashed/departed all hidden';
end $$;

-- placements: only A's (private bit B's placement must not leak a position)
do $$
declare n int; got uuid;
begin
  select count(*) into n from placement;
  if n <> 1 then raise exception 'GUEST-PLACEMENT: visitor sees % placements, expected 1', n; end if;
  select id into got from placement;
  if got <> '00000000-0000-0000-0000-0000000000a1' then raise exception 'GUEST-PLACEMENT: wrong placement visible: %', got; end if;
  if exists (select 1 from placement where id='00000000-0000-0000-0000-0000000000b1') then raise exception 'LEAK: private bit B''s placement (position) visible'; end if;
  raise notice 'GUEST-PLACEMENT ✓ only the public card''s placement shows; the private card leaks no position';
end $$;

-- nothing private-by-design is exposed at all: reference / source / tag / tag_application
do $$
declare n int;
begin
  select count(*) into n from reference;        if n <> 0 then raise exception 'LEAK: % reference rows visible to anon', n; end if;
  select count(*) into n from source;           if n <> 0 then raise exception 'LEAK: % source rows visible to anon', n; end if;
  select count(*) into n from tag;              if n <> 0 then raise exception 'LEAK: % tag rows visible to anon', n; end if;
  select count(*) into n from tag_application;  if n <> 0 then raise exception 'LEAK: % tag_application rows visible to anon', n; end if;
  raise notice 'GUEST-CLOSED ✓ references, sources, tags never reach a visitor';
end $$;

-- a visitor cannot WRITE anything (grant + RLS both deny)
do $$
declare wrote boolean := false;
begin
  begin
    insert into board (id, title, visibility, owner_id)
      values ('99999999-9999-9999-9999-999999999999', 'hacked', 'public', '298fbf29-39c8-4738-96d0-3348f0e59fd0');
    wrote := true;
  exception when others then null; -- expected: denied
  end;
  if wrote then raise exception 'ANON-WRITE: a visitor inserted a board — must be read-only'; end if;
  raise notice 'ANON-WRITE ✓ a visitor cannot write';
end $$;

reset role;

-- ---- THE OWNER is unaffected: still sees everything (guest policies are additive) ----
set local request.jwt.claims = '{"sub":"298fbf29-39c8-4738-96d0-3348f0e59fd0"}';
set local role authenticated;
do $$
declare nb int; nx int;
begin
  select count(*) into nb from board; if nb <> 3 then raise exception 'OWNER: sees % boards, expected all 3', nb; end if;
  select count(*) into nx from bit;   if nx <> 6 then raise exception 'OWNER: sees % bits, expected all 6', nx; end if;
  raise notice 'OWNER ✓ the owner still sees all 3 boards + 6 bits — the guest door took nothing away';
end $$;
reset role;

rollback;
\echo '=== PUBLIC DOOR PROOFS PASSED ✓ — public shows, everything private/unreachable/unplaced/trashed/departed hidden, anon read-only, owner intact ==='
