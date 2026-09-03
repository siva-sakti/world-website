-- Frame migration proof (frame-plan.md; 20260903000002_frame.sql).
-- Re-verifies the CHECK constraints on the ACTUAL migration file, not a
-- transcription of it. Run via verification/run-frame-native.sh.
\set ON_ERROR_STOP off

-- Minimal board table carrying just what the migration touches.
create table board (id uuid primary key default gen_random_uuid());
\i supabase/migrations/20260903000002_frame.sql

\echo '--- 1. no frame at all: all four null — MUST SUCCEED ---'
insert into board (id) values (gen_random_uuid());

\echo '--- 2. a valid frame: all four set, positive — MUST SUCCEED ---'
insert into board (id, frame_x, frame_y, frame_w, frame_h)
  values (gen_random_uuid(), -100, 50, 800, 600);

\echo '--- 3. partial frame (only x set) — MUST BE REFUSED ---'
insert into board (id, frame_x) values (gen_random_uuid(), 0);

\echo '--- 4. partial frame (w and h only, x/y missing) — MUST BE REFUSED ---'
insert into board (id, frame_w, frame_h) values (gen_random_uuid(), 800, 600);

\echo '--- 5. zero width — MUST BE REFUSED ---'
insert into board (id, frame_x, frame_y, frame_w, frame_h)
  values (gen_random_uuid(), 0, 0, 0, 600);

\echo '--- 6. negative height — MUST BE REFUSED ---'
insert into board (id, frame_x, frame_y, frame_w, frame_h)
  values (gen_random_uuid(), 0, 0, 800, -1);

\echo '--- 7. NaN width (the antagonist catch: NaN > 0 is true in Postgres) — MUST BE REFUSED ---'
insert into board (id, frame_x, frame_y, frame_w, frame_h)
  values (gen_random_uuid(), 0, 0, 'NaN', 600);

\echo '--- 8. Infinity height — MUST BE REFUSED ---'
insert into board (id, frame_x, frame_y, frame_w, frame_h)
  values (gen_random_uuid(), 0, 0, 800, 'Infinity');

\echo '--- 9. negative x/y (signed world coords) — MUST SUCCEED ---'
insert into board (id, frame_x, frame_y, frame_w, frame_h)
  values (gen_random_uuid(), -5000, -5000, 200, 200);

\echo '--- final: rows that made it in (expect exactly 3: the empty one, the -100/50 one, the -5000/-5000 one) ---'
select id, frame_x, frame_y, frame_w, frame_h from board order by frame_x nulls first;
