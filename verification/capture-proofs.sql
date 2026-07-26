-- ============================================================================
-- capture-proofs.sql — Capture Slice 1 proofs (Cap-Checkpoint A)
-- ============================================================================
-- Run against a database with 20260721000001_init.sql THEN
-- 20260725000001_capture_source_and_inbox.sql applied (run-capture-native.sh).
-- Three self-contained transactions, each rolled back — the database is left
-- untouched. Every assertion RAISEs loudly on failure (\set ON_ERROR_STOP →
-- psql exits non-zero); each NOTICE is one green line. Models attacks.sql /
-- scenarios.sql. The constraint-rejection blocks catch the EXPECTED refusal and
-- raise only when a write was WRONGLY accepted (the attacks.sql pattern).
--
-- Proves:
--   1. source round-trip — a captured clip stores + reads back source_url/title;
--      export (a direct `select *` off the table) carries it; and — a proven
--      finding — a view's `select *` is FROZEN at creation, so the_ledger does
--      NOT auto-carry the new columns while the_inbox (created here) does.
--   2. the constraint FLIP — a bookmark WITH a storage_path is now ACCEPTED
--      (this exact row was refused pre-migration); the relax is surgical —
--      text/drawing/image still refuse a stray storage_path/url, and a bookmark
--      still refuses a body.
--   3. the_inbox = EXACTLY the loose set — never-placed (IN), on a live board
--      (OUT), un-placed from its last board (IN), only-board-trashed (IN, the
--      hole the review caught), a trashed bit (OUT); restoring the board pulls
--      its bit back out (the symmetry).
-- ============================================================================
\set ON_ERROR_STOP on


-- ---------------------------------------------------------------------------
-- 1 · SOURCE ROUND-TRIP — a clipped quote remembers where it came from
-- ---------------------------------------------------------------------------
begin;
insert into bit (id, type, body, source_url, source_title) values
  ('c1000000-0000-0000-0000-000000000001', 'text',
   '<blockquote>the near enemy of equanimity is indifference</blockquote>',
   'https://example.com/near-enemies', 'On the Near Enemies');
do $$
declare u text; t text; n int;
begin
  -- (a) round-trip: stored + read back off the bit row
  select source_url, source_title into u, t from bit
    where id = 'c1000000-0000-0000-0000-000000000001';
  if u <> 'https://example.com/near-enemies' then raise exception '1 FAIL: source_url read back as %', u; end if;
  if t <> 'On the Near Enemies'              then raise exception '1 FAIL: source_title read back as %', t; end if;

  -- (b) export is free: /export does a direct `select *` off the TABLE, which
  -- carries every column this migration added.
  select count(*) into n from bit
    where id = 'c1000000-0000-0000-0000-000000000001'
      and source_url   = 'https://example.com/near-enemies'
      and source_title = 'On the Near Enemies';
  if n <> 1 then raise exception '1 FAIL: a direct table select (export) omitted source'; end if;

  -- (c) THE FINDING, proven: a view defined with `select *` FREEZES its column
  -- list at creation. the_ledger (from init.sql) does NOT auto-carry the new
  -- source columns; the_inbox (created by THIS migration) does. Surfaces that
  -- must SHOW source (Slice-4 clip cards, board_cards, any the_ledger-based
  -- list) need those views recreated when that slice lands. Not needed in
  -- Slice 1 — nothing renders source yet — but recorded so it can't surprise.
  select count(*) into n from information_schema.columns
    where table_name='the_ledger' and column_name in ('source_url','source_title');
  if n <> 0 then raise exception '1 FINDING CHANGED: the_ledger now carries source (was frozen) — revisit the note'; end if;
  select count(*) into n from information_schema.columns
    where table_name='the_inbox' and column_name in ('source_url','source_title');
  if n <> 2 then raise exception '1 FAIL: the_inbox does not carry source (it should — created after the columns)'; end if;
  raise notice 'HOLDS ✓ 1 source round-trips off the bit row · export (direct select *) is free · the_inbox carries source, the_ledger''s frozen select * does NOT (Slice-4 view-refresh flagged)';
end $$;
rollback;


-- ---------------------------------------------------------------------------
-- 2 · THE CONSTRAINT FLIP — a bookmark may now carry a preview; the relax is
--     surgical (the other three kinds still refuse stray facts)
-- ---------------------------------------------------------------------------
begin;
do $$
declare n int;
begin
  -- THE FLIP: a bookmark WITH a stored preview file is now ACCEPTED.
  -- Pre-migration this exact row was REFUSED by bit_substance_matches_type
  -- (the bookmark branch required `storage_path is null`).
  insert into bit (id, type, url, captured_title, storage_path, thumb_path,
                   mime, byte_size) values
    ('c2000000-0000-0000-0000-000000000001', 'bookmark',
     'https://example.com/article', 'A Good Article',
     'private/preview.jpg', 'private/preview-thumb.jpg', 'image/jpeg', 24680);
  select count(*) into n from bit where id = 'c2000000-0000-0000-0000-000000000001';
  if n <> 1 then raise exception '2 FAIL: a bookmark carrying a preview file was not accepted'; end if;
  raise notice 'HOLDS ✓ 2a THE FLIP: a bookmark carrying a preview file is now ACCEPTED (was refused pre-migration)';

  -- and the relax was SURGICAL — a stray storage_path/url on the other kinds is
  -- still refused (the change touched the bookmark branch only):
  begin
    insert into bit (type, body, storage_path) values ('text', '<p>x</p>', 'private/x.jpg');
    raise exception '2 FAIL: a text bit accepted a stray storage_path';
  exception when check_violation then raise notice 'REFUSED ✓ 2b text still refuses a stray storage_path'; end;

  begin
    insert into bit (type, strokes, storage_path) values ('drawing', '{"v":[]}'::jsonb, 'private/x.jpg');
    raise exception '2 FAIL: a drawing bit accepted a stray storage_path';
  exception when check_violation then raise notice 'REFUSED ✓ 2c drawing still refuses a stray storage_path'; end;

  begin
    insert into bit (type, storage_path, url) values ('image', 'private/i.jpg', 'https://x');
    raise exception '2 FAIL: an image bit accepted a stray url';
  exception when check_violation then raise notice 'REFUSED ✓ 2d image still refuses a stray url'; end;

  -- the bookmark branch relaxed ONLY storage_path — body is still forbidden:
  begin
    insert into bit (type, url, body) values ('bookmark', 'https://x', '<p>x</p>');
    raise exception '2 FAIL: a bookmark accepted a body';
  exception when check_violation then raise notice 'REFUSED ✓ 2e bookmark still refuses a body (only storage_path was relaxed)'; end;
end $$;
rollback;


-- ---------------------------------------------------------------------------
-- 3 · THE INBOX = EXACTLY THE LOOSE SET (fresh db — these are the only bits)
-- ---------------------------------------------------------------------------
begin;
-- two boards: one live, one trashed
insert into board (id, title) values
  ('b3000000-0000-0000-0000-000000000001', 'Live Board');
insert into board (id, title, deleted_at) values
  ('b3000000-0000-0000-0000-000000000002', 'Trashed Board', now());
-- five bits, each a distinct looseness case
insert into bit (id, type, body) values
  ('a3000000-0000-0000-0000-000000000001', 'text', '<p>never placed</p>'),        -- IN
  ('a3000000-0000-0000-0000-000000000002', 'text', '<p>on a live board</p>'),     -- OUT
  ('a3000000-0000-0000-0000-000000000003', 'text', '<p>un-placed</p>'),           -- IN
  ('a3000000-0000-0000-0000-000000000004', 'text', '<p>only board trashed</p>'),  -- IN (the hole)
  ('a3000000-0000-0000-0000-000000000005', 'text', '<p>trashed bit</p>');         -- OUT
update bit set deleted_at = now() where id = 'a3000000-0000-0000-0000-000000000005';
-- placements
insert into placement (board_id, target_bit_id, x, y) values
  ('b3000000-0000-0000-0000-000000000001', 'a3000000-0000-0000-0000-000000000002', 10, 10);  -- lives on a live board
insert into placement (id, board_id, target_bit_id, x, y) values
  ('f3000000-0000-0000-0000-000000000003', 'b3000000-0000-0000-0000-000000000001',
   'a3000000-0000-0000-0000-000000000003', 20, 20);
update placement set left_at = now() where id = 'f3000000-0000-0000-0000-000000000003';       -- then un-placed
insert into placement (board_id, target_bit_id, x, y) values
  ('b3000000-0000-0000-0000-000000000002', 'a3000000-0000-0000-0000-000000000004', 30, 30);  -- on the TRASHED board only

do $$
declare n int;
begin
  -- each looseness case, individually
  perform 1 from the_inbox where id = 'a3000000-0000-0000-0000-000000000001';
  if not found then raise exception '3 FAIL: a never-placed bit is missing from the inbox'; end if;
  perform 1 from the_inbox where id = 'a3000000-0000-0000-0000-000000000002';
  if found     then raise exception '3 FAIL: a bit on a live board leaked into the inbox'; end if;
  perform 1 from the_inbox where id = 'a3000000-0000-0000-0000-000000000003';
  if not found then raise exception '3 FAIL: an un-placed bit did not return to the inbox'; end if;
  perform 1 from the_inbox where id = 'a3000000-0000-0000-0000-000000000005';
  if found     then raise exception '3 FAIL: a trashed bit leaked into the inbox'; end if;

  -- THE HOLE, made explicit: the only-board-trashed bit STILL has a left_at-null
  -- placement (trash logs no departure) — a naive "any active placement ⇒ not
  -- loose" test would file it NOWHERE. the_inbox's board-not-trashed conjunct
  -- catches it and returns it to the pile.
  select count(*) into n from placement
    where target_bit_id = 'a3000000-0000-0000-0000-000000000004' and left_at is null;
  if n <> 1 then raise exception '3 FAIL: expected the un-departed placement to persist on the trashed board (got %)', n; end if;
  perform 1 from the_inbox where id = 'a3000000-0000-0000-0000-000000000004';
  if not found then raise exception '3 FAIL: the only-board-trashed bit fell through the hole (absent from the inbox)'; end if;

  -- EXACTLY the loose set: three IN, nothing else
  select count(*) into n from the_inbox;
  if n <> 3 then raise exception '3 FAIL: the inbox holds % bits, want exactly 3 (never-placed / un-placed / only-board-trashed)', n; end if;
  raise notice 'HOLDS ✓ 3 the_inbox = EXACTLY the loose set: never-placed IN · live-board OUT · un-placed IN · only-board-trashed IN (the hole) · trashed bit OUT';
end $$;

-- restore the trashed board → its bit LEAVES the inbox again (the symmetry, no state to rebuild)
update board set deleted_at = null where id = 'b3000000-0000-0000-0000-000000000002';
do $$
declare n int;
begin
  perform 1 from the_inbox where id = 'a3000000-0000-0000-0000-000000000004';
  if found then raise exception '3 FAIL: restoring the board did not pull its bit back out of the inbox'; end if;
  select count(*) into n from the_inbox;
  if n <> 2 then raise exception '3 FAIL: after restore the inbox holds %, want 2', n; end if;
  raise notice 'HOLDS ✓ 3b restore the board → its bit leaves the inbox again (pure symmetry, nothing rebuilt)';
end $$;
rollback;

\echo '--- capture-proofs.sql complete: source round-trips · the flip is surgical · the inbox is exactly the loose set ---'
