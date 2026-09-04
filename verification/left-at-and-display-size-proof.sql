\set ON_ERROR_STOP off
\echo '=============================================================='
\echo 'S6b — a card cannot leave before it arrived'
\echo '=============================================================='

insert into board (id, title) values ('bbbbbbbb-0000-0000-0000-000000000001', 'proof board');
insert into bit (id, type, body) values ('cccccccc-0000-0000-0000-000000000001', 'text', 'hi');

-- Arrive an hour ago, so a "slow clock" departure is expressible.
insert into placement (id, board_id, target_bit_id, arrived_at)
values ('dddddddd-0000-0000-0000-000000000001',
        'bbbbbbbb-0000-0000-0000-000000000001',
        'cccccccc-0000-0000-0000-000000000001',
        now() - interval '1 hour');

\echo '--- 1. a browser with a slow clock writes a departure BEFORE the arrival'
\echo '    EXPECT: the trigger overrides it with the server clock; left_at > arrived_at'
update placement set left_at = now() - interval '2 hours'
 where id = 'dddddddd-0000-0000-0000-000000000001';
select left_at > arrived_at as departure_is_after_arrival,
       left_at > now() - interval '10 seconds' as stamped_by_the_server_just_now
  from placement where id = 'dddddddd-0000-0000-0000-000000000001';

\echo '--- 2. a revive clears the departure (the call-in path must still work)'
\echo '    EXPECT: left_at is null'
update placement set left_at = null where id = 'dddddddd-0000-0000-0000-000000000001';
select left_at is null as revived_ok from placement where id = 'dddddddd-0000-0000-0000-000000000001';

\echo '--- 3. moving a DEPARTED card must not re-stamp its departure'
\echo '    EXPECT: unchanged_departure = true'
update placement set left_at = now() where id = 'dddddddd-0000-0000-0000-000000000001';
select left_at as before_move from placement where id = 'dddddddd-0000-0000-0000-000000000001' \gset
-- BOTH coordinates: placement_position_whole demands x and y together, and an update
-- that the DB rejects would make this test prove nothing.
update placement set x = 99, y = 99 where id = 'dddddddd-0000-0000-0000-000000000001';
select left_at = :'before_move'::timestamptz as unchanged_departure
  from placement where id = 'dddddddd-0000-0000-0000-000000000001';

\echo '--- 4. the CHECK forbids the bad state even with the trigger disabled'
\echo '    EXPECT: ERROR placement_left_after_arrived'
alter table placement disable trigger placement_left_at_server_clock;
update placement set left_at = arrived_at - interval '1 second'
 where id = 'dddddddd-0000-0000-0000-000000000001';
alter table placement enable trigger placement_left_at_server_clock;

\echo '=============================================================='
\echo 'display_size — gone, and the board still renders'
\echo '=============================================================='

\echo '--- 5. the column is gone'
\echo '    EXPECT: 0'
select count(*) as display_size_columns_left
  from information_schema.columns
 where table_name = 'placement' and column_name = 'display_size';

\echo '--- 6. board_cards still returns a live card, with every column it had but that one'
\echo '    EXPECT: 1 row, and has_angle / has_locked_at true'
update placement set left_at = null where id = 'dddddddd-0000-0000-0000-000000000001';
select count(*) as live_cards from board_cards
 where board_id = 'bbbbbbbb-0000-0000-0000-000000000001';
select count(*) filter (where column_name = 'angle') = 1 as has_angle,
       count(*) filter (where column_name = 'locked_at') = 1 as has_locked_at,
       count(*) filter (where column_name = 'display_size') = 0 as display_size_gone
  from information_schema.columns where table_name = 'board_cards';

\echo '--- 7. the render rule still holds: trash the bit, the card must vanish'
\echo '    EXPECT: 0'
update bit set deleted_at = now() where id = 'cccccccc-0000-0000-0000-000000000001';
select count(*) as cards_for_a_trashed_bit from board_cards
 where board_id = 'bbbbbbbb-0000-0000-0000-000000000001';
