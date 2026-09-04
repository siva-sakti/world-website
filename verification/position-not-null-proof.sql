\set ON_ERROR_STOP off
\echo '=== a positionless placement is now impossible ==='
insert into board (id, title) values ('bbbbbbbb-0000-0000-0000-000000000009', 'p');
insert into bit (id, type, body) values ('cccccccc-0000-0000-0000-000000000009', 'text', 'hi');
\echo '--- EXPECT: ERROR, not-null violation'
insert into placement (board_id, target_bit_id) values
  ('bbbbbbbb-0000-0000-0000-000000000009', 'cccccccc-0000-0000-0000-000000000009');
\echo '--- EXPECT: ERROR — half a point is also refused'
insert into placement (board_id, target_bit_id, x) values
  ('bbbbbbbb-0000-0000-0000-000000000009', 'cccccccc-0000-0000-0000-000000000009', 10);
\echo '--- EXPECT: 1 row — a whole point still works'
insert into placement (board_id, target_bit_id, x, y) values
  ('bbbbbbbb-0000-0000-0000-000000000009', 'cccccccc-0000-0000-0000-000000000009', 10, 20);
select count(*) as placed from placement where board_id = 'bbbbbbbb-0000-0000-0000-000000000009';
