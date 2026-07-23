-- ============================================================================
-- scenarios.sql — Stage 1d: the seven scenes replayed as real rows (D-085)
-- ============================================================================
-- Seeds model-scenarios.md's seven scenes (named after the owner's real
-- content — the retreat board, the TCM screenshot) and asserts every computed
-- surface returns what the doc's trace says. Each NOTICE is one line of the
-- line-by-line match (guidelines rule 5). Runs on a FRESH db (run-1d resets it);
-- the scenes COMMIT — a real week, left standing for inspection.
-- Closes with export completeness (I-G1) + the named regression guards.
-- ============================================================================
\set ON_ERROR_STOP on

-- ---- boards -------------------------------------------------------------
insert into board (id, title) values
  ('11111111-1111-1111-1111-111111111101', 'Retreat — Vipassana'),  -- S1
  ('11111111-1111-1111-1111-111111111102', 'Practices'),            -- S3
  ('11111111-1111-1111-1111-111111111103', 'Morning Pages'),        -- S4
  ('11111111-1111-1111-1111-111111111104', 'Medicine');             -- S5 call-in target

-- ---- S1 bits: two sections, a diagram, a Drive video --------------------
insert into bit (id, type, body) values
  ('22222222-2222-2222-2222-222222222201', 'text', '<p>Day 2: fire ceremony sequence — offerings then circumambulation</p>'),
  ('22222222-2222-2222-2222-222222222202', 'text', '<p>Metta practice — near enemy is attachment</p>');
insert into bit (id, type, strokes, content, subtype_word_id) values
  ('22222222-2222-2222-2222-222222222203', 'drawing', '{"v":[]}'::jsonb, 'fire ceremony sequence',
   (select id from subtype_word where word='diagram'));
insert into bit (id, type, url) values          -- auth-walled Drive → captured_title stays null
  ('22222222-2222-2222-2222-222222222204', 'bookmark', 'https://drive.google.com/file/d/day2fire');

-- placements: born ON the retreat board (arrived = birth)
insert into placement (id, board_id, target_bit_id, x, y) values
  ('55555555-5555-5555-5555-555555555201', '11111111-1111-1111-1111-111111111101', '22222222-2222-2222-2222-222222222201', 100, 100),
  ('55555555-5555-5555-5555-555555555202', '11111111-1111-1111-1111-111111111101', '22222222-2222-2222-2222-222222222202', 100, 300),
  ('55555555-5555-5555-5555-555555555203', '11111111-1111-1111-1111-111111111101', '22222222-2222-2222-2222-222222222203', 400, 100),
  ('55555555-5555-5555-5555-555555555204', '11111111-1111-1111-1111-111111111101', '22222222-2222-2222-2222-222222222204', 400, 300);

-- two arrows: the diagram → the section it illustrates, and the diagram → the
-- video that shows it (the second one survives S7's un-place — it touches neither sec1).
insert into connector (id, board_id, from_placement_id, to_placement_id) values
  ('66666666-6666-6666-6666-666666666201', '11111111-1111-1111-1111-111111111101',
   '55555555-5555-5555-5555-555555555203', '55555555-5555-5555-5555-555555555201'),
  ('66666666-6666-6666-6666-666666666202', '11111111-1111-1111-1111-111111111101',
   '55555555-5555-5555-5555-555555555203', '55555555-5555-5555-5555-555555555204');

-- tag the board #retreat; sec1 CONFIRMS the pre-lit chip; sec2 FLICKS IT OFF
insert into tag (id, word) values ('33333333-3333-3333-3333-333333333301', 'retreat');
insert into tag_application (tag_id, target_board_id) values
  ('33333333-3333-3333-3333-333333333301', '11111111-1111-1111-1111-111111111101');
insert into tag_application (tag_id, target_bit_id) values
  ('33333333-3333-3333-3333-333333333301', '22222222-2222-2222-2222-222222222201');  -- sec1 only

do $$
declare n int; f text;
begin
  -- S1: board is private by default; face rules; the pull returns bits AND board
  perform 1 from board where id='11111111-1111-1111-1111-111111111101' and visibility='private';
  if not found then raise exception 'S1 FAIL: retreat board not private by default'; end if;
  select face into f from bit where id='22222222-2222-2222-2222-222222222201';
  if f <> 'Day 2: fire ceremony sequence — offerings then circumambulation' then raise exception 'S1 FAIL: text face = %', f; end if;
  select face into f from bit where id='22222222-2222-2222-2222-222222222203';
  if f <> 'fire ceremony sequence' then raise exception 'S1 FAIL: diagram face (content line) = %', f; end if;
  select face into f from bit where id='22222222-2222-2222-2222-222222222204';
  if f <> 'https://drive.google.com/file/d/day2fire' then raise exception 'S1 FAIL: auth-walled video face = %', f; end if;
  select count(*) into n from the_pull where tag_id='33333333-3333-3333-3333-333333333301';
  if n <> 2 then raise exception 'S1 FAIL: the pull returned % (want board + sec1 = 2)', n; end if;
  perform 1 from the_pull where tag_id='33333333-3333-3333-3333-333333333301' and thing='board';
  if not found then raise exception 'S1 FAIL: the pull is missing the board itself'; end if;
  perform 1 from the_pull where thing_id='22222222-2222-2222-2222-222222222202';
  if found then raise exception 'S1 FAIL: sec2 (chip flicked off) leaked into the pull — silent inheritance'; end if;
  raise notice 'S1 ✓ private board · face = body/content/URL-fallback · pull = tagged bit + the board · flicked-off chip stays out';
end $$;

-- ---- S3 the virtuous-action thought -------------------------------------
insert into bit (id, type, body) values
  ('22222222-2222-2222-2222-222222222205', 'text', '<p>on acting well toward a friend — quiet, not performed</p>');
insert into placement (board_id, target_bit_id, x, y) values
  ('11111111-1111-1111-1111-111111111102', '22222222-2222-2222-2222-222222222205', 120, 120);
do $$
begin
  -- born public (flat default), on a private board; owner one-taps it private
  perform 1 from bit where id='22222222-2222-2222-2222-222222222205' and visibility='public';
  if not found then raise exception 'S3 FAIL: thought not born public (flat default)'; end if;
  update bit set visibility='private' where id='22222222-2222-2222-2222-222222222205';
  perform 1 from bit where id='22222222-2222-2222-2222-222222222205' and visibility='private';
  if not found then raise exception 'S3 FAIL: one-tap-to-private did not take'; end if;
  perform 1 from board where id='11111111-1111-1111-1111-111111111102' and visibility='private';
  if not found then raise exception 'S3 FAIL: the practices board (the locked room) is not private'; end if;
  raise notice 'S3 ✓ thought born PUBLIC by default → one-tap PRIVATE takes · the room stays locked either way';
end $$;

-- ---- S4 morning pages: a wordless drawing -------------------------------
insert into bit (id, type, strokes) values          -- content skipped mid-flow → face null
  ('22222222-2222-2222-2222-222222222206', 'drawing', '{"v":[]}'::jsonb);
insert into placement (board_id, target_bit_id, x, y) values
  ('11111111-1111-1111-1111-111111111103', '22222222-2222-2222-2222-222222222206', 40, 40);
do $$
declare n int;
begin
  perform 1 from bit where id='22222222-2222-2222-2222-222222222206' and face is null;
  if not found then raise exception 'S4 FAIL: wordless drawing has a non-null face'; end if;
  select count(*) into n from bit where id='22222222-2222-2222-2222-222222222206'
    and search_tsv @@ websearch_to_tsquery('english', 'morning');
  if n <> 0 then raise exception 'S4 FAIL: a wordless drawing answered a text search'; end if;
  -- but it IS reachable by date — the ledger floor
  perform 1 from the_ledger where id='22222222-2222-2222-2222-222222222206';
  if not found then raise exception 'S4 FAIL: the drawing is not on the ledger (unreachable by date)'; end if;
  raise notice 'S4 ✓ wordless ink: no face, invisible to text search, STILL on the ledger (reachable by date)';
end $$;

-- ---- S5 the TCM screenshot: bare image → find, then call-in -------------
insert into bit (id, type, storage_path) values
  ('22222222-2222-2222-2222-222222222207', 'image', 'private/tcm-spleen.jpg');
insert into placement (board_id, target_bit_id, x, y) values
  ('11111111-1111-1111-1111-111111111102', '22222222-2222-2222-2222-222222222207', 300, 300);
do $$
declare n int;
begin
  -- untold: invisible to text search, but found BY TYPE (all images, free)
  select count(*) into n from bit where id='22222222-2222-2222-2222-222222222207'
    and search_tsv @@ websearch_to_tsquery('english', 'spleen');
  if n <> 0 then raise exception 'S5 FAIL: untold image answered a text search'; end if;
  select count(*) into n from the_ledger where type='image';
  if n < 1 then raise exception 'S5 FAIL: find-by-type found no image'; end if;
  -- the owner tells it words → findable forever by them
  update bit set content='TCM — spleen & worry' where id='22222222-2222-2222-2222-222222222207';
  select count(*) into n from bit where id='22222222-2222-2222-2222-222222222207'
    and search_tsv @@ websearch_to_tsquery('english', 'spleen');
  if n <> 1 then raise exception 'S5 FAIL: told image is not findable by its words'; end if;
  -- call in on the Medicine board → a SECOND placement; one bit, two boards
  insert into placement (board_id, target_bit_id, x, y) values
    ('11111111-1111-1111-1111-111111111104', '22222222-2222-2222-2222-222222222207', 50, 50);
  select count(*) into n from placement where target_bit_id='22222222-2222-2222-2222-222222222207' and left_at is null;
  if n <> 2 then raise exception 'S5 FAIL: call-in did not make a second placement (got %)', n; end if;
  -- edit-once-everywhere: the face the board renders is the same computed value on both
  select count(distinct label) into n from board_cards where target_bit_id='22222222-2222-2222-2222-222222222207';
  if n <> 1 then raise exception 'S5 FAIL: the two cards show different faces (not one live bit)'; end if;
  raise notice 'S5 ✓ bare image invisible to text / found by type → told → searchable · call-in = 2nd placement, one live bit';
end $$;

-- ---- S6 two-device: last-arrival wins, WHOLE record ---------------------
do $$
declare v text;
begin
  -- desktop overwrites the whole bit the Daylight last touched — no field merge
  update bit set body='<p>Metta — near enemy attachment; far enemy ill-will</p>', content='desktop revision'
    where id='22222222-2222-2222-2222-222222222202';
  select content into v from bit where id='22222222-2222-2222-2222-222222222202';
  if v <> 'desktop revision' then raise exception 'S6 FAIL: whole-record overwrite did not land'; end if;
  raise notice 'S6 ✓ last-arrival wins whole-record (no per-field merge) · the tombstone race = 1c''s FOR SHARE probe';
end $$;

-- ---- S7 cleaning up: trash/restore, un-place, export --------------------
-- a duplicate photo on the retreat board, carrying an arrow
insert into bit (id, type, storage_path) values
  ('22222222-2222-2222-2222-222222222208', 'image', 'private/dup-photo.jpg');
insert into placement (id, board_id, target_bit_id, x, y) values
  ('55555555-5555-5555-5555-555555555208', '11111111-1111-1111-1111-111111111101', '22222222-2222-2222-2222-222222222208', 700, 100);
insert into connector (id, board_id, from_placement_id, to_placement_id) values
  ('66666666-6666-6666-6666-666666666208', '11111111-1111-1111-1111-111111111101',
   '55555555-5555-5555-5555-555555555208', '55555555-5555-5555-5555-555555555201');
do $$
declare n int;
begin
  -- TRASH the photo → gone from every world surface; its arrow HIDDEN not destroyed
  update bit set deleted_at=now() where id='22222222-2222-2222-2222-222222222208';
  select count(*) into n from board_cards where target_bit_id='22222222-2222-2222-2222-222222222208';
  if n <> 0 then raise exception 'S7 FAIL: trashed photo still renders on the board'; end if;
  select count(*) into n from board_connectors where id='66666666-6666-6666-6666-666666666208';
  if n <> 0 then raise exception 'S7 FAIL: the photo''s arrow still renders after trash'; end if;
  select count(*) into n from connector where id='66666666-6666-6666-6666-666666666208';
  if n <> 1 then raise exception 'S7 FAIL: trash DESTROYED the arrow (should only hide)'; end if;
  -- RESTORE → all of it back, exactly
  update bit set deleted_at=null where id='22222222-2222-2222-2222-222222222208';
  select count(*) into n from board_cards where target_bit_id='22222222-2222-2222-2222-222222222208';
  if n <> 1 then raise exception 'S7 FAIL: restore did not bring the card back'; end if;
  select count(*) into n from board_connectors where id='66666666-6666-6666-6666-666666666208';
  if n <> 1 then raise exception 'S7 FAIL: restore did not bring the arrow back'; end if;
  raise notice 'S7a ✓ trash hides the photo AND its arrow (not destroyed) · restore brings both back exactly';

  -- UN-PLACE the misplaced section (sec1) from Retreat: the db-module deletes
  -- EVERY connector anchored to that card — where the placement is the from OR
  -- the to endpoint (kill-with-confirm) — THEN stamps the departure. (sec1's
  -- card is an endpoint of two arrows here: diagram→sec1 and dup-photo→sec1.)
  delete from connector
    where from_placement_id='55555555-5555-5555-5555-555555555201'
       or to_placement_id  ='55555555-5555-5555-5555-555555555201';
  update placement set left_at=now() where id='55555555-5555-5555-5555-555555555201';
  -- the membership ROW is kept (travel), the card goes absent
  select count(*) into n from placement where id='55555555-5555-5555-5555-555555555201';
  if n <> 1 then raise exception 'S7 FAIL: un-place erased the placement row (travel lost)'; end if;
  select count(*) into n from board_cards where placement_id='55555555-5555-5555-5555-555555555201';
  if n <> 0 then raise exception 'S7 FAIL: un-placed card still renders'; end if;
  perform 1 from bit_travel where bit_id='22222222-2222-2222-2222-222222222201'
    and board_id='11111111-1111-1111-1111-111111111101' and left_at is not null;
  if not found then raise exception 'S7 FAIL: travel does not show sec1 left Retreat'; end if;
  -- CALL IN on Practices → a new placement; sec1 now lives there
  insert into placement (board_id, target_bit_id, x, y) values
    ('11111111-1111-1111-1111-111111111102', '22222222-2222-2222-2222-222222222201', 200, 200);
  raise notice 'S7b ✓ un-place: arrow killed, ROW KEPT (travel shows the leg), card absent · call-in re-homes on Practices';
end $$;

-- ---- export completeness (I-G1): every stored record kind appears --------
-- (seed a category + categorized tag so the vocabulary family is fully covered)
insert into category (id, name) values ('44444444-4444-4444-4444-444444444401', 'aliveness');
insert into tag (word, category_id) values ('so-alive', '44444444-4444-4444-4444-444444444401');
do $$
declare missing text := '';
begin
  if (select count(*) from bit)             = 0 then missing := missing||' bit';             end if;
  if (select count(*) from board)           = 0 then missing := missing||' board';           end if;
  if (select count(*) from tag_application) = 0 then missing := missing||' tag_application'; end if;
  if (select count(*) from placement)       = 0 then missing := missing||' placement';       end if;
  if (select count(*) from connector)       = 0 then missing := missing||' connector';       end if;
  if (select count(*) from tag)             = 0 then missing := missing||' tag';             end if;
  if (select count(*) from category)        = 0 then missing := missing||' category';        end if;
  if (select count(*) from subtype_word)    = 0 then missing := missing||' subtype_word';    end if;
  if missing <> '' then raise exception 'I-G1 FAIL: export would omit kinds:%', missing; end if;
  -- the dormant ninth is present and EMPTY by design
  if (select count(*) from dormant) <> 0 then raise exception 'I-G1 FAIL: dormant table is not empty in v1'; end if;
  raise notice 'I-G1 ✓ all eight record kinds present for export (+ the dormant ninth, empty by design)';
end $$;

-- ---- regression guards named at Checkpoint A (D-084) --------------------
do $$
declare pid uuid; born timestamptz; born2 timestamptz; n int;
begin
  -- (1) RE-PLACE keeps row identity + original arrived_at (guards delete-and-reinsert)
  select id, arrived_at into pid, born from placement
    where id='55555555-5555-5555-5555-555555555202';           -- sec2, a bare card on Retreat
  update placement set left_at=now() where id=pid;              -- un-place
  update placement set left_at=null  where id=pid;              -- re-place = REUSE the row
  select arrived_at into born2 from placement where id=pid;
  if born2 <> born then raise exception 'REGRESSION FAIL: re-place changed arrived_at (% -> %)', born, born2; end if;
  -- and the wrong path (a second row) stays physically refused even mid-departure
  update placement set left_at=now() where id=pid;
  begin
    insert into placement (board_id, target_bit_id) values
      ('11111111-1111-1111-1111-111111111101', '22222222-2222-2222-2222-222222222202');
    raise exception 'REGRESSION FAIL: a duplicate placement was allowed';
  exception when unique_violation then null; end;
  update placement set left_at=null where id=pid;              -- leave it home
  raise notice 'REGRESSION ✓ re-place reuses the row (arrived_at preserved); delete-and-reinsert stays refused';

  -- (2) ORPHAN-ARROW TRIPWIRE: no live connector may join a departed placement
  select count(*) into n from connector c
    join placement p on p.id in (c.from_placement_id, c.to_placement_id)
    where p.left_at is not null;
  if n <> 0 then raise exception 'TRIPWIRE FAIL: % connector(s) join a departed card', n; end if;
  -- prove it has teeth: create a bad state in a savepoint, watch it fire, roll back
  begin
    update placement set left_at=now() where id='55555555-5555-5555-5555-555555555203';  -- depart the diagram card...
    insert into connector (board_id, from_placement_id, to_placement_id) values          -- ...leaving an arrow on it
      ('11111111-1111-1111-1111-111111111101','55555555-5555-5555-5555-555555555203','55555555-5555-5555-5555-555555555204');
    select count(*) into n from connector c
      join placement p on p.id in (c.from_placement_id, c.to_placement_id)
      where p.left_at is not null;
    if n = 0 then raise exception 'TRIPWIRE FAIL: it did not catch a planted orphan'; end if;
    raise exception 'rollback-planted-orphan';   -- unwind the bad state
  exception when others then
    if sqlerrm <> 'rollback-planted-orphan' then raise; end if;
  end;
  raise notice 'TRIPWIRE ✓ zero orphans in the real state · proven to catch a planted one';
end $$;
