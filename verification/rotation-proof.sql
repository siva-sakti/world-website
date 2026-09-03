-- Proof for the rotation migration (20260903000004_rotation.sql).
-- Runs against the FULL chain (run-rotation-native.sh applies it in order).
\set ON_ERROR_STOP on

\echo '--- 1. the column exists, nullable, double precision ---'
select column_name, data_type, is_nullable
  from information_schema.columns
 where table_name = 'placement' and column_name = 'angle';

\echo '--- 2. THE RLS TRAP: security_invoker must have SURVIVED the view replace ---'
select relname,
       (select option_value from pg_options_to_table(c.reloptions)
         where option_name = 'security_invoker') as security_invoker
  from pg_class c where relname = 'board_cards';

\echo '--- 2b. and it survived on EVERY view, not just this one ---'
select count(*) filter (where opt = 'true') as views_with_invoker,
       count(*)                             as views_total
  from (select (select option_value from pg_options_to_table(c.reloptions)
                 where option_name = 'security_invoker') as opt
          from pg_class c join pg_namespace n on n.oid = c.relnamespace
         where c.relkind = 'v' and n.nspname = 'public') s;

\echo '--- 3. existing cards are upright by default (no backfill needed) ---'
insert into board (id, title) values ('00000000-0000-0000-0000-0000000000c1', 'rot board');
insert into bit (id, type, body) values ('00000000-0000-0000-0000-0000000000c2', 'text', 'tilt me');
insert into placement (id, board_id, target_bit_id, x, y)
  values ('00000000-0000-0000-0000-0000000000c3', '00000000-0000-0000-0000-0000000000c1',
          '00000000-0000-0000-0000-0000000000c2', 10, 10);
select angle is null as defaults_to_upright from placement where id = '00000000-0000-0000-0000-0000000000c3';

\echo '--- 4. any real angle stores, including negative and fractional ---'
update placement set angle = -12.75 where id = '00000000-0000-0000-0000-0000000000c3';
select angle from placement where id = '00000000-0000-0000-0000-0000000000c3';

\echo '--- 5. the view EXPOSES it (the read-back path the plan calls defect 3) ---'
select angle as angle_via_view from board_cards where placement_id = '00000000-0000-0000-0000-0000000000c3';

\echo '--- 6. PER-BOARD: the same bit on a second board is independent ---'
insert into board (id, title) values ('00000000-0000-0000-0000-0000000000c4', 'other board');
insert into placement (id, board_id, target_bit_id, x, y)
  values ('00000000-0000-0000-0000-0000000000c5', '00000000-0000-0000-0000-0000000000c4',
          '00000000-0000-0000-0000-0000000000c2', 50, 50);
select board_id, angle from board_cards
 where target_bit_id = '00000000-0000-0000-0000-0000000000c2' order by angle nulls last;
\echo '--- expected: one board tilted -12.75, the other null (upright) — same bit ---'

\echo '--- 7. the render rule still holds: trash the bit, neither card renders ---'
update bit set deleted_at = now() where id = '00000000-0000-0000-0000-0000000000c2';
select count(*) as cards_after_trash from board_cards where target_bit_id = '00000000-0000-0000-0000-0000000000c2';
