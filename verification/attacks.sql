-- ============================================================================
-- attacks.sql — Stage 1c: the constraint attack suite (D-084 → proofs)
-- ============================================================================
-- Run against a database with ONLY 20260721000001_init.sql applied.
-- Every A-block attempts an illegal write and REQUIRES the database to refuse
-- it with the named error class; a successful write raises loudly and aborts.
-- Every C-block asserts cascade/computed behavior. The whole run is one
-- transaction, rolled back at the end — the database is left untouched.
-- Output (the refusal log) is captured to verification/attacks.out (3d).
-- The race probe (I-D1) is NOT here — it needs two sessions: race-probe.sh.
--
-- RUNNER IDENTITY (verifier note, D-084): the A/C blocks run as the DB
-- superuser, which BYPASSES RLS on purpose — we are attacking the table
-- constraints (physics), not the security boundary, so RLS must be out of the
-- way. C9 alone switches `set local role anon` to prove the v1 privacy wall,
-- and it relies on Supabase's default anon grants returning ZERO ROWS via RLS
-- (not a permission-denied error). If C9 ever errors instead of counting zero,
-- that is a STRONGER posture (grant removed) surfacing as a confusing failure —
-- read it as tighter, not broken.
-- ============================================================================

\set ON_ERROR_STOP on
begin;

-- ---------------------------------------------------------------------------
-- fixtures (rolled back with everything else)
-- ---------------------------------------------------------------------------
insert into board (id, title) values
  ('b0000000-0000-0000-0000-000000000001', 'Retreat'),
  ('b0000000-0000-0000-0000-000000000002', 'Practices');
insert into bit (id, type, body) values
  ('a0000000-0000-0000-0000-000000000001', 'text', '<p>fire ceremony section</p>');
insert into bit (id, type, strokes) values
  ('a0000000-0000-0000-0000-000000000002', 'drawing', '{"strokes":[]}'::jsonb);
insert into bit (id, type, url, captured_title) values
  ('a0000000-0000-0000-0000-000000000003', 'bookmark', 'https://drive.google.com/x', 'day-2 video');
insert into tag (id, word) values
  ('c0000000-0000-0000-0000-000000000001', 'retreat');
insert into category (id, name) values
  ('d0000000-0000-0000-0000-000000000001', 'practices');
insert into subtype_word (id, word) values
  ('e0000000-0000-0000-0000-000000000001', 'ritual');
insert into placement (id, board_id, target_bit_id, x, y) values
  ('f0000000-0000-0000-0000-000000000001', 'b0000000-0000-0000-0000-000000000001',
   'a0000000-0000-0000-0000-000000000001', 100, 100),
  ('f0000000-0000-0000-0000-000000000002', 'b0000000-0000-0000-0000-000000000001',
   'a0000000-0000-0000-0000-000000000002', 300, 100);
insert into placement (id, board_id, target_bit_id, x, y) values
  ('f0000000-0000-0000-0000-000000000003', 'b0000000-0000-0000-0000-000000000002',
   'a0000000-0000-0000-0000-000000000003', 50, 50);

-- ---------------------------------------------------------------------------
-- A. the attacks — each must be REFUSED
-- ---------------------------------------------------------------------------

do $$
begin
  -- A1 · unknown bit type (the extensible-door CHECK holds the v1 set) — §2a, parked door 2
  begin
    insert into bit (type, body) values ('video', 'x');
    raise exception 'NOT REFUSED: A1 bit_type_allowed';
  exception when check_violation then raise notice 'REFUSED ✓ A1 unknown bit type'; end;

  -- A2 · bit visibility outside the v1 set (door closed until B6) — §2a, I-P1
  begin
    insert into bit (type, body, visibility) values ('text', 'x', 'shared');
    raise exception 'NOT REFUSED: A2 bit_visibility_allowed';
  exception when check_violation then raise notice 'REFUSED ✓ A2 bit visibility ''shared'' (v1)'; end;

  -- A3 · hybrid: text bit carrying a URL — §2a substance
  begin
    insert into bit (type, body, url) values ('text', 'x', 'https://x');
    raise exception 'NOT REFUSED: A3 text+url hybrid';
  exception when check_violation then raise notice 'REFUSED ✓ A3 text bit with a URL'; end;

  -- A4 · drawing without strokes — §2a substance
  begin
    insert into bit (type) values ('drawing');
    raise exception 'NOT REFUSED: A4 strokeless drawing';
  exception when check_violation then raise notice 'REFUSED ✓ A4 drawing without strokes'; end;

  -- A5 · image without its file address — §2a substance, §7B
  begin
    insert into bit (type) values ('image');
    raise exception 'NOT REFUSED: A5 fileless image';
  exception when check_violation then raise notice 'REFUSED ✓ A5 image without storage_path'; end;

  -- A6 · bookmark without a URL — §2a ("a saved URL")
  begin
    insert into bit (type, captured_title) values ('bookmark', 'orphan title');
    raise exception 'NOT REFUSED: A6 urlless bookmark';
  exception when check_violation then raise notice 'REFUSED ✓ A6 bookmark without URL'; end;

  -- A7 · media facts on a fileless bit — §2a plumbing coherence
  begin
    insert into bit (type, body, byte_size) values ('text', 'x', 12345);
    raise exception 'NOT REFUSED: A7 media facts without file';
  exception when check_violation then raise notice 'REFUSED ✓ A7 media facts on a text bit'; end;

  -- A8 · board visibility outside the v1 set — §2a, I-P1
  begin
    insert into board (title, visibility) values ('x', 'shared');
    raise exception 'NOT REFUSED: A8 board_visibility_allowed';
  exception when check_violation then raise notice 'REFUSED ✓ A8 board visibility ''shared'' (v1)'; end;

  -- A9/A10 · tag application: both targets / neither — §3a + §4.1 target pair
  begin
    insert into tag_application (tag_id, target_bit_id, target_board_id) values
      ('c0000000-0000-0000-0000-000000000001',
       'a0000000-0000-0000-0000-000000000001',
       'b0000000-0000-0000-0000-000000000001');
    raise exception 'NOT REFUSED: A9 both targets';
  exception when check_violation then raise notice 'REFUSED ✓ A9 tag on both a bit and a board at once'; end;
  begin
    insert into tag_application (tag_id) values ('c0000000-0000-0000-0000-000000000001');
    raise exception 'NOT REFUSED: A10 no target';
  exception when check_violation then raise notice 'REFUSED ✓ A10 tag on nothing'; end;

  -- A11/A12 · THE line: twice-tagging impossible — I-R7 (merge-dedupe rests here)
  insert into tag_application (tag_id, target_bit_id) values
    ('c0000000-0000-0000-0000-000000000001', 'a0000000-0000-0000-0000-000000000001');
  begin
    insert into tag_application (tag_id, target_bit_id) values
      ('c0000000-0000-0000-0000-000000000001', 'a0000000-0000-0000-0000-000000000001');
    raise exception 'NOT REFUSED: A11 twice-tag a bit';
  exception when unique_violation then raise notice 'REFUSED ✓ A11 same word twice on one bit'; end;
  insert into tag_application (tag_id, target_board_id) values
    ('c0000000-0000-0000-0000-000000000001', 'b0000000-0000-0000-0000-000000000001');
  begin
    insert into tag_application (tag_id, target_board_id) values
      ('c0000000-0000-0000-0000-000000000001', 'b0000000-0000-0000-0000-000000000001');
    raise exception 'NOT REFUSED: A12 twice-tag a board';
  exception when unique_violation then raise notice 'REFUSED ✓ A12 same word twice on one board'; end;

  -- A13–A15 · case-insensitive twins across all three vocabularies — §3e, §5c, I-D6
  begin
    insert into tag (word) values ('Retreat');
    raise exception 'NOT REFUSED: A13 tag twin';
  exception when unique_violation then raise notice 'REFUSED ✓ A13 Retreat/retreat twin (tag)'; end;
  begin
    insert into category (name) values ('PRACTICES');
    raise exception 'NOT REFUSED: A14 category twin';
  exception when unique_violation then raise notice 'REFUSED ✓ A14 category twin (owner-ruled)'; end;
  begin
    insert into subtype_word (word) values ('Ritual');
    raise exception 'NOT REFUSED: A15 subtype twin';
  exception when unique_violation then raise notice 'REFUSED ✓ A15 subtype-word twin'; end;

  -- A16 · placement: both targets — §4.1
  begin
    insert into placement (board_id, target_bit_id, target_board_id) values
      ('b0000000-0000-0000-0000-000000000001',
       'a0000000-0000-0000-0000-000000000001',
       'b0000000-0000-0000-0000-000000000002');
    raise exception 'NOT REFUSED: A16 placement both targets';
  exception when check_violation then raise notice 'REFUSED ✓ A16 placement with two targets'; end;

  -- A17 · a board placed on itself — §5 ("another board")
  begin
    insert into placement (board_id, target_board_id) values
      ('b0000000-0000-0000-0000-000000000001', 'b0000000-0000-0000-0000-000000000001');
    raise exception 'NOT REFUSED: A17 board on itself';
  exception when check_violation then raise notice 'REFUSED ✓ A17 board placed on itself'; end;

  -- A18 · half a coordinate — §2c
  begin
    insert into placement (board_id, target_bit_id, x) values
      ('b0000000-0000-0000-0000-000000000002',
       'a0000000-0000-0000-0000-000000000001', 10);
    raise exception 'NOT REFUSED: A18 half coordinate';
  exception when check_violation then raise notice 'REFUSED ✓ A18 x without y'; end;

  -- A19 · unknown display size — §5b
  begin
    insert into placement (board_id, target_bit_id, display_size) values
      ('b0000000-0000-0000-0000-000000000002',
       'a0000000-0000-0000-0000-000000000001', 'tiny');
    raise exception 'NOT REFUSED: A19 display size';
  exception when check_violation then raise notice 'REFUSED ✓ A19 display_size ''tiny'''; end;

  -- A20 · second membership row for the same (thing, board) — I-L1 (re-place must reuse)
  begin
    insert into placement (board_id, target_bit_id) values
      ('b0000000-0000-0000-0000-000000000001',
       'a0000000-0000-0000-0000-000000000001');
    raise exception 'NOT REFUSED: A20 duplicate membership';
  exception when unique_violation then raise notice 'REFUSED ✓ A20 second row, same bit + board'; end;

  -- A20b · THE travel-memory line: a DEPARTED row still blocks re-insert — I-L1.
  -- This is why delete-and-reinsert is the wrong path (it would erase arrived_at);
  -- re-place must REUSE the row. The unique index ignores left_at, so a left card
  -- still owns its (board, bit) slot. (reset after, to keep fixtures pristine.)
  update placement set left_at = now() where id = 'f0000000-0000-0000-0000-000000000003';
  begin
    insert into placement (board_id, target_bit_id) values
      ('b0000000-0000-0000-0000-000000000002', 'a0000000-0000-0000-0000-000000000003');
    raise exception 'NOT REFUSED: A20b re-insert after departure';
  exception when unique_violation then raise notice 'REFUSED ✓ A20b re-insert refused even after the card LEFT (re-place must reuse)'; end;
  update placement set left_at = null where id = 'f0000000-0000-0000-0000-000000000003';

  -- A21 · arrow from a card to itself — §6a ("two cards")
  begin
    insert into connector (board_id, from_placement_id, to_placement_id) values
      ('b0000000-0000-0000-0000-000000000001',
       'f0000000-0000-0000-0000-000000000001',
       'f0000000-0000-0000-0000-000000000001');
    raise exception 'NOT REFUSED: A21 self-loop arrow';
  exception when check_violation then raise notice 'REFUSED ✓ A21 arrow to itself'; end;

  -- A22 · THE composite FK: a cross-board arrow — I-L9 (unrepresentable)
  begin
    insert into connector (board_id, from_placement_id, to_placement_id) values
      ('b0000000-0000-0000-0000-000000000001',
       'f0000000-0000-0000-0000-000000000001',
       'f0000000-0000-0000-0000-000000000003');  -- endpoint lives on Practices
    raise exception 'NOT REFUSED: A22 cross-board arrow';
  exception when foreign_key_violation then raise notice 'REFUSED ✓ A22 cross-board arrow'; end;

  -- A23 · arrow to a card that does not exist — I-L4
  begin
    insert into connector (board_id, from_placement_id, to_placement_id) values
      ('b0000000-0000-0000-0000-000000000001',
       'f0000000-0000-0000-0000-000000000001',
       'f0000000-0000-0000-0000-0000000000ff');
    raise exception 'NOT REFUSED: A23 phantom endpoint';
  exception when foreign_key_violation then raise notice 'REFUSED ✓ A23 arrow to a phantom card'; end;

  -- A24 · application of a word that does not exist — I-R4
  begin
    insert into tag_application (tag_id, target_bit_id) values
      ('c0000000-0000-0000-0000-0000000000ff',
       'a0000000-0000-0000-0000-000000000001');
    raise exception 'NOT REFUSED: A24 phantom word';
  exception when foreign_key_violation then raise notice 'REFUSED ✓ A24 tagging with a phantom word'; end;
end $$;

-- ---------------------------------------------------------------------------
-- C. cascade + computed assertions (physics observed, not believed)
-- ---------------------------------------------------------------------------

do $$
declare n int; f text;
begin
  -- C6 · the face computes itself — §2b, I-R2, §4.4
  select face into f from bit where id = 'a0000000-0000-0000-0000-000000000001';
  if f <> 'fire ceremony section' then raise exception 'C6 FAIL: text face = %', f; end if;
  update bit set content = 'the sequence diagram section'
    where id = 'a0000000-0000-0000-0000-000000000001';
  select face into f from bit where id = 'a0000000-0000-0000-0000-000000000001';
  if f <> 'the sequence diagram section' then raise exception 'C6 FAIL: content did not take the face'; end if;
  update bit set content = '' where id = 'a0000000-0000-0000-0000-000000000001';
  select face into f from bit where id = 'a0000000-0000-0000-0000-000000000001';
  if f <> 'fire ceremony section' then raise exception 'C6 FAIL: cleared content did not revert'; end if;
  update bit set content = null where id = 'a0000000-0000-0000-0000-000000000001';
  select face into f from bit where id = 'a0000000-0000-0000-0000-000000000003';
  if f <> 'day-2 video' then raise exception 'C6 FAIL: bookmark face <> captured title'; end if;
  raise notice 'HOLDS ✓ C6 face: body-words · content overrides · clear reverts · captured title';

  -- C6b · bookmark URL fallback when no title was captured — §2b floor, scene S1
  -- (the auth-walled Drive/Instagram URL: fetch yields nothing → show the URL).
  insert into bit (id, type, url) values
    ('a0000000-0000-0000-0000-0000000000fb', 'bookmark', 'https://drive.google.com/authwalled');
  select face into f from bit where id = 'a0000000-0000-0000-0000-0000000000fb';
  if f <> 'https://drive.google.com/authwalled' then raise exception 'C6b FAIL: null-title bookmark face = %', f; end if;
  delete from bit where id = 'a0000000-0000-0000-0000-0000000000fb';  -- keep the bit count clean for C1/C2
  raise notice 'HOLDS ✓ C6b bookmark with no captured title falls back to its URL (auth-walled Drive, S1)';

  -- C6c · SEARCH indexes ALL words, not just the face (the D-087 search hole, D-088 fix):
  -- a TITLED note stays findable by BOTH its title and its body; face stays the headline.
  insert into bit (id, type, body, content) values
    ('a0000000-0000-0000-0000-0000000000f5', 'text',
     '<p>notes on equanimity and the near enemy</p>', 'My retreat title');
  select count(*) into n from bit where id='a0000000-0000-0000-0000-0000000000f5'
    and search_tsv @@ websearch_to_tsquery('english', 'retreat title');
  if n <> 1 then raise exception 'C6c FAIL: titled note not findable by its title'; end if;
  select count(*) into n from bit where id='a0000000-0000-0000-0000-0000000000f5'
    and search_tsv @@ websearch_to_tsquery('english', 'equanimity');
  if n <> 1 then raise exception 'C6c FAIL: titled note not findable by its BODY (the D-087 search hole)'; end if;
  if (select face from bit where id='a0000000-0000-0000-0000-0000000000f5') <> 'My retreat title'
    then raise exception 'C6c FAIL: face should still be the title (display unchanged)'; end if;
  delete from bit where id = 'a0000000-0000-0000-0000-0000000000f5';
  -- and the bookmark mirror: a captioned bookmark stays findable by BOTH caption and captured title
  insert into bit (id, type, url, captured_title, content) values
    ('a0000000-0000-0000-0000-0000000000f6', 'bookmark',
     'https://example.com/p', 'Original Page Title', 'my own caption');
  select count(*) into n from bit where id='a0000000-0000-0000-0000-0000000000f6'
    and search_tsv @@ websearch_to_tsquery('english', 'original page title');
  if n <> 1 then raise exception 'C6c FAIL: captioned bookmark lost its captured title from search'; end if;
  select count(*) into n from bit where id='a0000000-0000-0000-0000-0000000000f6'
    and search_tsv @@ websearch_to_tsquery('english', 'caption');
  if n <> 1 then raise exception 'C6c FAIL: captioned bookmark not findable by its caption'; end if;
  delete from bit where id = 'a0000000-0000-0000-0000-0000000000f6';
  raise notice 'HOLDS ✓ C6c search indexes ALL words (title + body + captured-title + URL); face stays the headline';

  -- C7 · the counts never lie (physics half) — I-T2, tag_counts
  -- retreat carries a bit (a...001, A11) AND a board (b...001, A12). Trash the
  -- bit only → the confirm must read "1 in world (the board) + 1 in trash".
  update bit set deleted_at = now() where id = 'a0000000-0000-0000-0000-000000000001';
  select world_count into n from tag_counts where word = 'retreat';
  if n <> 1 then raise exception 'C7 FAIL: world_count = % (the live board still carries it)', n; end if;
  select trash_count into n from tag_counts where word = 'retreat';
  if n <> 1 then raise exception 'C7 FAIL: trash_count = % (the trashed bit)', n; end if;
  raise notice 'HOLDS ✓ C7 tag_counts split: 1 in world + 1 in trash — "3 things + 2 in trash" made real';

  -- C8 · world surfaces exclude trash; history is indifferent — I-L3/L8, I-T4/T5
  select count(*) into n from the_ledger where id = 'a0000000-0000-0000-0000-000000000001';
  if n <> 0 then raise exception 'C8 FAIL: trashed bit in the ledger'; end if;
  select count(*) into n from the_pull where thing_id = 'a0000000-0000-0000-0000-000000000001';
  if n <> 0 then raise exception 'C8 FAIL: trashed bit in the pull'; end if;
  select count(*) into n from board_cards where target_bit_id = 'a0000000-0000-0000-0000-000000000001';
  if n <> 0 then raise exception 'C8 FAIL: trashed bit rendered on a board'; end if;
  select count(*) into n from trash_listing where thing_id = 'a0000000-0000-0000-0000-000000000001';
  if n <> 1 then raise exception 'C8 FAIL: trashed bit missing from trash listing'; end if;
  select count(*) into n from bit_travel where bit_id = 'a0000000-0000-0000-0000-000000000001';
  if n <> 1 then raise exception 'C8 FAIL: travel forgot a frozen bit''s membership'; end if;
  update bit set deleted_at = null where id = 'a0000000-0000-0000-0000-000000000001';
  select count(*) into n from the_pull where thing_id = 'a0000000-0000-0000-0000-000000000001';
  if n <> 1 then raise exception 'C8 FAIL: restore did not re-include instantly'; end if;
  raise notice 'HOLDS ✓ C8 world hides trash · trash listing shows it · travel indifferent · restore instant';

  -- Cc · connectors HIDE on endpoint-trash, survive it, REVIVE on restore — I-L5b, D-071 #1
  -- (distinct from C1's destroy-cascade: trash is a freeze, not an erase, for arrows too.)
  insert into connector (id, board_id, from_placement_id, to_placement_id) values
    ('fc000000-0000-0000-0000-0000000000c1', 'b0000000-0000-0000-0000-000000000001',
     'f0000000-0000-0000-0000-000000000001', 'f0000000-0000-0000-0000-000000000002');
  select count(*) into n from board_connectors where id = 'fc000000-0000-0000-0000-0000000000c1';
  if n <> 1 then raise exception 'Cc FAIL: arrow not rendered while both endpoints live'; end if;
  update bit set deleted_at = now() where id = 'a0000000-0000-0000-0000-000000000002';   -- trash an endpoint bit
  select count(*) into n from board_connectors where id = 'fc000000-0000-0000-0000-0000000000c1';
  if n <> 0 then raise exception 'Cc FAIL: arrow still rendered after its endpoint was trashed (should hide)'; end if;
  select count(*) into n from connector where id = 'fc000000-0000-0000-0000-0000000000c1';
  if n <> 1 then raise exception 'Cc FAIL: trash DESTROYED the arrow (should only hide it)'; end if;
  update bit set deleted_at = null where id = 'a0000000-0000-0000-0000-000000000002';    -- restore
  select count(*) into n from board_connectors where id = 'fc000000-0000-0000-0000-0000000000c1';
  if n <> 1 then raise exception 'Cc FAIL: arrow did not revive on restore'; end if;
  delete from connector where id = 'fc000000-0000-0000-0000-0000000000c1';  -- tap-delete; clean state for C1
  raise notice 'HOLDS ✓ Cc arrow hides when an endpoint is trashed, is not destroyed, revives on restore';

  -- C1 · bit-destroy is total and self-contained — I-L10, §2g
  insert into connector (board_id, from_placement_id, to_placement_id) values
    ('b0000000-0000-0000-0000-000000000001',
     'f0000000-0000-0000-0000-000000000001',
     'f0000000-0000-0000-0000-000000000002');
  delete from bit where id = 'a0000000-0000-0000-0000-000000000001';
  select count(*) into n from placement where target_bit_id = 'a0000000-0000-0000-0000-000000000001';
  if n <> 0 then raise exception 'C1 FAIL: placements survived bit-destroy'; end if;
  select count(*) into n from connector;
  if n <> 0 then raise exception 'C1 FAIL: connector survived its endpoint''s destroy'; end if;
  select count(*) into n from tag_application where target_bit_id = 'a0000000-0000-0000-0000-000000000001';
  if n <> 0 then raise exception 'C1 FAIL: applications survived bit-destroy'; end if;
  select count(*) into n from bit;
  if n <> 2 then raise exception 'C1 FAIL: destroy touched other bits (% left)', n; end if;
  raise notice 'HOLDS ✓ C1 bit-destroy: placements + arrows + applications gone, nothing else touched';

  -- C2 · board-destroy: arrangement dies, bits never — I-L6, I-L7
  insert into placement (board_id, target_board_id) values
    ('b0000000-0000-0000-0000-000000000002', 'b0000000-0000-0000-0000-000000000001');
  delete from board where id = 'b0000000-0000-0000-0000-000000000001';
  select count(*) into n from placement where board_id = 'b0000000-0000-0000-0000-000000000001';
  if n <> 0 then raise exception 'C2 FAIL: placements ON the board survived'; end if;
  select count(*) into n from placement where target_board_id = 'b0000000-0000-0000-0000-000000000001';
  if n <> 0 then raise exception 'C2 FAIL: board-cards OF the board survived'; end if;
  select count(*) into n from tag_application where target_board_id = 'b0000000-0000-0000-0000-000000000001';
  if n <> 0 then raise exception 'C2 FAIL: the board''s applications survived'; end if;
  select count(*) into n from bit;
  if n <> 2 then raise exception 'C2 FAIL: board-destroy deleted a bit'; end if;
  raise notice 'HOLDS ✓ C2 board-destroy: its arrangement gone, every bit untouched';

  -- C3 · word-delete sweeps applications, trash included — §3e, I-T3
  update bit set deleted_at = now() where id = 'a0000000-0000-0000-0000-000000000002';
  insert into tag_application (tag_id, target_bit_id) values
    ('c0000000-0000-0000-0000-000000000001', 'a0000000-0000-0000-0000-000000000002');
  delete from tag where id = 'c0000000-0000-0000-0000-000000000001';
  select count(*) into n from tag_application;
  if n <> 0 then raise exception 'C3 FAIL: an application survived word-delete (trash-blind sweep broken)'; end if;
  select count(*) into n from bit;
  if n <> 2 then raise exception 'C3 FAIL: word-delete touched a bit'; end if;
  raise notice 'HOLDS ✓ C3 word-delete sweeps in-world AND frozen; things survive';

  -- C4 · dissolving a category frees its words — §3b/§3e
  insert into tag (id, word, category_id) values
    ('c0000000-0000-0000-0000-000000000002', 'astrology', 'd0000000-0000-0000-0000-000000000001');
  delete from category where id = 'd0000000-0000-0000-0000-000000000001';
  select count(*) into n from tag where id = 'c0000000-0000-0000-0000-000000000002' and category_id is null;
  if n <> 1 then raise exception 'C4 FAIL: dissolve did not free the word'; end if;
  raise notice 'HOLDS ✓ C4 dissolve frees words (the DB blanks the slot itself)';

  -- C5 · subtype-word delete: bits survive, lose the word (frozen bit included) — §5c
  update bit set subtype_word_id = 'e0000000-0000-0000-0000-000000000001'
    where id = 'a0000000-0000-0000-0000-000000000002';  -- this bit is in trash right now
  delete from subtype_word where id = 'e0000000-0000-0000-0000-000000000001';
  select count(*) into n from bit where id = 'a0000000-0000-0000-0000-000000000002' and subtype_word_id is null;
  if n <> 1 then raise exception 'C5 FAIL: frozen bit kept a deleted subtype word'; end if;
  raise notice 'HOLDS ✓ C5 subtype delete: SET NULL reaches the frozen bit';
end $$;

-- C9 · v1 privacy wall: anon sees NOTHING, even public bits — §2a v1 safety
set local role anon;
do $$
declare n int;
begin
  begin
    select count(*) into n from bit;
    if n <> 0 then raise exception 'C9 FAIL: anon can see % bits', n; end if;
    select count(*) into n from board;
    if n <> 0 then raise exception 'C9 FAIL: anon can see % boards', n; end if;
    raise notice 'HOLDS ✓ C9 logged-out sees zero rows via RLS (public bits included — v1 wall)';
  exception when insufficient_privilege then
    -- anon lacks even the SELECT grant → RLS never even consulted. STRONGER than
    -- zero-rows-via-RLS, not a failure (verifier note #4). Pass, loudly labeled.
    raise notice 'HOLDS ✓✓ C9 anon lacks even a SELECT grant — tighter than the zero-rows wall';
  end;
end $$;
reset role;

rollback;
\echo '--- attacks.sql complete: every refusal refused, every assertion held ---'
