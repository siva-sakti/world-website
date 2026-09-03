-- Regression proof: duplicate-board copies only what RENDERS (antagonist A2, 2026-09-03).
-- The old code read the raw placement table filtered on left_at alone, so a bit trashed or
-- archived WHILE PLACED rode along into the copy invisibly. The fix reads board_cards.
-- Runs against the FULL migration chain (run-duplicate-board-native.sh applies it).
\set ON_ERROR_STOP on

\echo '--- setup: one board, three bits placed on it ---'
insert into board (id, title) values ('00000000-0000-0000-0000-0000000000b1', 'source board');
insert into bit (id, type, body) values
  ('00000000-0000-0000-0000-000000000001', 'text', 'stays live'),
  ('00000000-0000-0000-0000-000000000002', 'text', 'gets trashed while placed'),
  ('00000000-0000-0000-0000-000000000003', 'text', 'gets archived while placed');
insert into placement (board_id, target_bit_id, x, y) values
  ('00000000-0000-0000-0000-0000000000b1', '00000000-0000-0000-0000-000000000001', 10, 10),
  ('00000000-0000-0000-0000-0000000000b1', '00000000-0000-0000-0000-000000000002', 20, 20),
  ('00000000-0000-0000-0000-0000000000b1', '00000000-0000-0000-0000-000000000003', 30, 30);

\echo '--- two of them rest, WITHOUT their placements being touched (the real behaviour) ---'
update bit set deleted_at  = now() where id = '00000000-0000-0000-0000-000000000002';
update bit set archived_at = now() where id = '00000000-0000-0000-0000-000000000003';

\echo '--- the board still has THREE placement rows, all present (left_at is null) ---'
select count(*) as raw_placements_still_present
  from placement where board_id = '00000000-0000-0000-0000-0000000000b1' and left_at is null;

\echo '--- but only ONE card renders ---'
select count(*) as cards_that_render
  from board_cards where board_id = '00000000-0000-0000-0000-0000000000b1';

\echo '--- THE OLD (broken) COPY READ: raw table, left_at only → would copy 3 ---'
select count(*) as old_read_would_copy
  from placement where board_id = '00000000-0000-0000-0000-0000000000b1' and left_at is null;

\echo '--- THE FIXED COPY READ: board_cards → copies 1 ---'
select count(*) as fixed_read_copies
  from board_cards where board_id = '00000000-0000-0000-0000-0000000000b1';

\echo '--- replay the real duplicate: insert the fixed read into a new board ---'
insert into board (id, title) values ('00000000-0000-0000-0000-0000000000b2', 'source board copy');
insert into placement (board_id, target_bit_id, target_board_id, x, y, width, height, z, display_size, locked_at)
  select '00000000-0000-0000-0000-0000000000b2', target_bit_id, target_board_id, x, y, width, height, z, display_size, locked_at
    from board_cards where board_id = '00000000-0000-0000-0000-0000000000b1';

\echo '--- the copy holds exactly the one live card ---'
select count(*) as copy_placements from placement where board_id = '00000000-0000-0000-0000-0000000000b2';

\echo '--- THE POINT: restoring the trashed bit must NOT make it appear on the copy ---'
update bit set deleted_at = null where id = '00000000-0000-0000-0000-000000000002';
update bit set archived_at = null where id = '00000000-0000-0000-0000-000000000003';
select count(*) as copy_cards_after_restore
  from board_cards where board_id = '00000000-0000-0000-0000-0000000000b2';
select count(*) as original_cards_after_restore
  from board_cards where board_id = '00000000-0000-0000-0000-0000000000b1';
\echo '--- expected: copy 1 (untouched), original back to 3 (its own history intact) ---'
