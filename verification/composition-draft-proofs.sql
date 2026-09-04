-- ============================================================================
-- COMPOSITION DRAFT — the attack suite (Gate C, storage session 2026-09-04).
-- Runs on: every real migration + verification/composition-schema-draft.sql.
-- Pattern: each attack states what must happen; failures print loudly.
-- ============================================================================
\set QUIET on
\pset footer off
\set ON_ERROR_STOP off

select set_config('request.jwt.claims', '{"sub":"11111111-1111-1111-1111-111111111111","role":"authenticated"}', false);
set role authenticated;

\echo '== A1 · birth: born private, live, title null (§4.1.3 / §12.2b) =='
insert into composition (id, doc) values
  ('c0000000-0000-0000-0000-000000000001', '{"type":"doc","content":[{"type":"paragraph","content":[{"type":"text","text":"first char"}]}]}');
select visibility = 'private' as born_private, state = 'live' as born_live, title is null as title_null,
       search_tsv is not null as indexed from composition where id = 'c0000000-0000-0000-0000-000000000001';

\echo '== A2 · the search index moves with it: chip label + FOLDED text findable (J2/§13.7.4) =='
update composition set doc = '{"type":"doc","content":[
  {"type":"heading","attrs":{"level":2,"hid":"h-1"},"content":[{"type":"text","text":"Weekend"}]},
  {"type":"paragraph","content":[{"type":"text","text":"about "},{"type":"bitRef","attrs":{"refId":"b-1","label":"the marmoset quote"}}]},
  {"type":"toggle","attrs":{"open":false},"content":[{"type":"paragraph","content":[{"type":"text","text":"folded spelunking list"}]}]}]}'::jsonb,
  subtitle = 'a standfirst about rivers'
where id = 'c0000000-0000-0000-0000-000000000001';
select search_tsv @@ plainto_tsquery('marmoset')  as finds_chip_label,
       search_tsv @@ plainto_tsquery('spelunking') as finds_folded,
       search_tsv @@ plainto_tsquery('rivers')     as finds_subtitle,
       not (search_tsv @@ plainto_tsquery('bitRef')) as no_nodetype_pollution
from composition where id = 'c0000000-0000-0000-0000-000000000001';

\echo '== A3 · state crossfire: archived⛔starred · trashed⛔archived (house CHECKs) =='
update composition set pinned_at = now(), archived_at = now() where id = 'c0000000-0000-0000-0000-000000000001';
\echo '   (must refuse: archived_not_alive)'
update composition set deleted_at = now(), archived_at = now() where id = 'c0000000-0000-0000-0000-000000000001';
\echo '   (must refuse: trashed_archived_exclusive)'

\echo '== A4 · the tie: flatness is physics — a BIT uuid cannot author (FK) =='
insert into bit (id, type, body) values ('b0000000-0000-0000-0000-00000000000b', 'text', '<p>a bit</p>');
insert into reference2 (from_composition_id, to_bit_id)
  values ('b0000000-0000-0000-0000-00000000000b', 'b0000000-0000-0000-0000-00000000000b');
\echo '   (must refuse: FK — from must be a composition)'

\echo '== A5 · exactly-one target: two targets refused · zero refused =='
insert into reference2 (from_composition_id, to_bit_id, to_composition_id)
  values ('c0000000-0000-0000-0000-000000000001', 'b0000000-0000-0000-0000-00000000000b', 'c0000000-0000-0000-0000-000000000001');
\echo '   (must refuse: two targets)'
insert into reference2 (from_composition_id) values ('c0000000-0000-0000-0000-000000000001');
\echo '   (must refuse: zero targets)'

\echo '== A6 · not-self · dedup per kind · different kinds coexist · mutual allowed =='
insert into composition (id, doc) values ('c0000000-0000-0000-0000-000000000002', '{"type":"doc","content":[{"type":"paragraph","content":[{"type":"text","text":"two"}]}]}');
insert into reference2 (from_composition_id, to_composition_id)
  values ('c0000000-0000-0000-0000-000000000001', 'c0000000-0000-0000-0000-000000000001');
\echo '   (must refuse: self)'
insert into reference2 (from_composition_id, to_bit_id) values ('c0000000-0000-0000-0000-000000000001','b0000000-0000-0000-0000-00000000000b');
insert into reference2 (from_composition_id, to_bit_id) values ('c0000000-0000-0000-0000-000000000001','b0000000-0000-0000-0000-00000000000b');
\echo '   (must refuse: duplicate pair, bit kind)'
insert into reference2 (from_composition_id, to_composition_id) values ('c0000000-0000-0000-0000-000000000001','c0000000-0000-0000-0000-000000000002');
insert into reference2 (from_composition_id, to_composition_id) values ('c0000000-0000-0000-0000-000000000002','c0000000-0000-0000-0000-000000000001');
select count(*) = 3 as three_ties_stand_incl_mutual from reference2;

\echo '== A7 · source as target · MERGE must repoint (the S4 rule) =='
insert into source (id, name) values ('a0000000-0000-0000-0000-00000000000a', 'Marias newsletter'),
                                     ('a0000000-0000-0000-0000-00000000000b', 'marias newsletter TWO');
insert into reference2 (from_composition_id, to_source_id)
  values ('c0000000-0000-0000-0000-000000000001', 'a0000000-0000-0000-0000-00000000000a');
-- the merge, WITH the new repoint step (what mergeSources must gain):
update reference2 set to_source_id = 'a0000000-0000-0000-0000-00000000000b'
  where to_source_id = 'a0000000-0000-0000-0000-00000000000a';
update bit set source_id = 'a0000000-0000-0000-0000-00000000000b' where source_id = 'a0000000-0000-0000-0000-00000000000a';
delete from source where id = 'a0000000-0000-0000-0000-00000000000a';
select count(*) = 1 as tie_survived_merge from reference2 where to_source_id = 'a0000000-0000-0000-0000-00000000000b';
-- and WITHOUT the repoint, the cascade eats the tie (the bug S4 prevents):
insert into source (id, name) values ('a0000000-0000-0000-0000-00000000000c', 'doomed source');
insert into reference2 (from_composition_id, to_source_id)
  values ('c0000000-0000-0000-0000-000000000002', 'a0000000-0000-0000-0000-00000000000c');
delete from source where id = 'a0000000-0000-0000-0000-00000000000c';
select count(*) = 0 as tie_eaten_without_repoint from reference2 where from_composition_id = 'c0000000-0000-0000-0000-000000000002' and to_source_id is not null;

\echo '== A8 · placement: composition on a board · I-L1 unique · revive keeps arrived_at · I-L2 durable =='
insert into board (id, title) values ('d0000000-0000-0000-0000-00000000000d', 'the desk board');
insert into placement (id, board_id, target_composition_id, x, y, arrived_at)
  values ('e0000000-0000-0000-0000-00000000000e', 'd0000000-0000-0000-0000-00000000000d', 'c0000000-0000-0000-0000-000000000001', 10, 10, '2026-01-01T00:00:00Z');
insert into placement (board_id, target_composition_id, x, y)
  values ('d0000000-0000-0000-0000-00000000000d', 'c0000000-0000-0000-0000-000000000001', 99, 99);
\echo '   (must refuse: I-L1 one placement per pair)'
update placement set left_at = now() where id = 'e0000000-0000-0000-0000-00000000000e';   -- un-place
update placement set left_at = null  where id = 'e0000000-0000-0000-0000-00000000000e';   -- revive
select arrived_at = '2026-01-01T00:00:00Z' as arrived_survives_revive from placement where id = 'e0000000-0000-0000-0000-00000000000e';

\echo '== A9 · board_cards third leg: label+preview · trash vanishes · restore returns (same row) =='
select thing = 'composition' as leg_ok, label = 'x' or label is null as _, comp_preview is not null as preview_ok
from board_cards where placement_id = 'e0000000-0000-0000-0000-00000000000e';
update composition set deleted_at = now() where id = 'c0000000-0000-0000-0000-000000000001';
select count(*) = 0 as card_vanishes_on_trash from board_cards where placement_id = 'e0000000-0000-0000-0000-00000000000e';
update composition set deleted_at = null where id = 'c0000000-0000-0000-0000-000000000001';
select count(*) = 1 as card_returns_whole from board_cards where placement_id = 'e0000000-0000-0000-0000-00000000000e';

\echo '== A10 · destroy per target kind: cascades both directions =='
select (select count(*) from reference2) as ties_before;
delete from bit where id = 'b0000000-0000-0000-0000-00000000000b';          -- target bit destroyed
select count(*) = 0 as bit_ties_gone from reference2 where to_bit_id is not null;
delete from composition where id = 'c0000000-0000-0000-0000-000000000002';  -- an AUTHOR destroyed
select count(*) = 0 as authored_ties_gone from reference2 where from_composition_id = 'c0000000-0000-0000-0000-000000000002';

\echo '== A11 · composition_travel: the journey, one record two views (§30b) =='
update placement set left_at = now() where id = 'e0000000-0000-0000-0000-00000000000e';
select board_title = 'the desk board' as journey_board, arrived_at is not null as has_arrival, left_at is not null as has_departure
from composition_travel where composition_id = 'c0000000-0000-0000-0000-000000000001';

\echo '== A12 · files: registry rows cascade at destroy =='
insert into composition_file (composition_id, storage_path)
  values ('c0000000-0000-0000-0000-000000000001', 'compositions/c1/img.webp');
delete from composition where id = 'c0000000-0000-0000-0000-000000000001';
select count(*) = 0 as file_rows_swept from composition_file;

\echo '== A13 · RLS: another user sees NOTHING; anon sees NOTHING (born-private world) =='
select set_config('request.jwt.claims', '{"sub":"22222222-2222-2222-2222-222222222222","role":"authenticated"}', false);
insert into composition (id, doc, visibility) values ('c0000000-0000-0000-0000-000000000003','{"type":"doc","content":[{"type":"paragraph","content":[{"type":"text","text":"mine"}]}]}','public');
select set_config('request.jwt.claims', '{"sub":"11111111-1111-1111-1111-111111111111","role":"authenticated"}', false);
select count(*) = 0 as other_owner_sees_nothing from composition where id = 'c0000000-0000-0000-0000-000000000003';
reset role; set role anon;
select count(*) = 0 as anon_sees_nothing_even_public from composition;
reset role;
\echo '== done =='
