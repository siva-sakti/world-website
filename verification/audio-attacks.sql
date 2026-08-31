-- ============================================================================
-- audio-attacks.sql — the audio bit-type proof (voice-memo-plan.md).
-- ============================================================================
-- Run against a database with ALL migrations applied THROUGH
-- 20260830000003_audio_type.sql (so 'audio' is a real allowed type — a refusal
-- here comes from the SUBSTANCE branch, not from type_allowed; that is the whole
-- point of proving the branch). The attacks.sql suite proves the init schema; this
-- proves the audio migration on top of the live chain.
--
-- Every AUD-A block attempts an illegal write and REQUIRES a refusal with the
-- named error class; every AUD-C block asserts computed behavior (face + the
-- filename search). One transaction, rolled back — the database is left untouched.
-- Runs as the DB superuser (bypasses RLS on purpose — we attack the constraints).
-- ============================================================================

\set ON_ERROR_STOP on
begin;

insert into board (id, title, visibility) values
  ('b0000000-0000-0000-0000-0000000000a1', 'Voice memos', 'public');

-- ---------------------------------------------------------------------------
-- AUD-A · the attacks — each must be REFUSED by the substance CHECK
-- ---------------------------------------------------------------------------
do $$
begin
  -- AUD-A1 · audio carrying a stray body (a hybrid) — substance
  begin
    insert into bit (type, storage_path, body) values
      ('audio', 'audio/x1.m4a', '<p>not allowed</p>');
    raise exception 'NOT REFUSED: AUD-A1 audio+body hybrid';
  exception when check_violation then raise notice 'REFUSED OK AUD-A1 audio bit with a stray body'; end;

  -- AUD-A2 · audio carrying a stray url (a hybrid) — substance
  begin
    insert into bit (type, storage_path, url) values
      ('audio', 'audio/x2.m4a', 'https://example.com');
    raise exception 'NOT REFUSED: AUD-A2 audio+url hybrid';
  exception when check_violation then raise notice 'REFUSED OK AUD-A2 audio bit with a stray url'; end;

  -- AUD-A3 · a FILE-LESS audio (no storage_path) — substance, §7B
  begin
    insert into bit (type, content) values ('audio', 'orphan caption');
    raise exception 'NOT REFUSED: AUD-A3 fileless audio';
  exception when check_violation then raise notice 'REFUSED OK AUD-A3 audio without storage_path'; end;

  -- AUD-A4 · media facts on a fileless audio — plumbing coherence
  --   (a file-less row can carry no file_name/mime/byte_size — bit_media_facts_only_with_file)
  begin
    insert into bit (type, byte_size) values ('audio', 999);
    raise exception 'NOT REFUSED: AUD-A4 media facts without a file';
  exception when check_violation then raise notice 'REFUSED OK AUD-A4 media facts on a file-less audio'; end;

  -- AUD-A5 · the retired bookmark type stays gone (the type set is closed to it)
  begin
    insert into bit (type, url) values ('bookmark', 'https://example.com');
    raise exception 'NOT REFUSED: AUD-A5 bookmark still accepted';
  exception when check_violation then raise notice 'REFUSED OK AUD-A5 bookmark type is still retired'; end;
end $$;

-- ---------------------------------------------------------------------------
-- AUD-C · the valid audio bit + the computed face + the filename search
-- ---------------------------------------------------------------------------
do $$
declare n int; f text;
begin
  -- AUD-C1 · a valid CAPTIONED audio bit inserts cleanly (file + facts + caption).
  insert into bit (id, type, storage_path, file_name, mime, byte_size, content) values
    ('a0000000-0000-0000-0000-0000000000a1', 'audio',
     'audio/a1.m4a', 'seaside-memo.m4a', 'audio/mp4', 204800, 'a walk by the water');
  insert into placement (id, board_id, target_bit_id, x, y) values
    ('f0000000-0000-0000-0000-0000000000a1', 'b0000000-0000-0000-0000-0000000000a1',
     'a0000000-0000-0000-0000-0000000000a1', 20, 20);
  raise notice 'HOLDS OK AUD-C1 a captioned audio bit (file + facts + caption) inserts + places cleanly';

  -- AUD-C2 · the face = the caption (no audio branch in bit_face → content wins).
  select face into f from bit where id = 'a0000000-0000-0000-0000-0000000000a1';
  if f <> 'a walk by the water' then raise exception 'AUD-C2 FAIL: audio face = %', f; end if;
  raise notice 'HOLDS OK AUD-C2 audio face = its caption (a recording has no text headline of its own)';

  -- AUD-C3 · findable by its CAPTION (content indexed, as for every bit).
  select count(*) into n from bit where id = 'a0000000-0000-0000-0000-0000000000a1'
    and search_tsv @@ websearch_to_tsquery('english', 'water');
  if n <> 1 then raise exception 'AUD-C3 FAIL: audio not findable by its caption'; end if;
  raise notice 'HOLDS OK AUD-C3 audio findable by its caption';

  -- AUD-C4 · findable by its FILENAME (the owner''s ask; the search_tsv change).
  select count(*) into n from bit where id = 'a0000000-0000-0000-0000-0000000000a1'
    and search_tsv @@ websearch_to_tsquery('english', 'seaside');
  if n <> 1 then raise exception 'AUD-C4 FAIL: audio not findable by its FILENAME (the search_tsv hole)'; end if;
  raise notice 'HOLDS OK AUD-C4 audio findable by its FILENAME (search_tsv now indexes file_name)';

  -- AUD-C5 · an UNCAPTIONED audio: face is null (no headline), still findable by filename.
  insert into bit (id, type, storage_path, file_name, mime, byte_size) values
    ('a0000000-0000-0000-0000-0000000000a2', 'audio',
     'audio/a2.m4a', 'morning-thoughts.m4a', 'audio/x-m4a', 102400);
  select face into f from bit where id = 'a0000000-0000-0000-0000-0000000000a2';
  if f is not null then raise exception 'AUD-C5 FAIL: uncaptioned audio face should be null, got %', f; end if;
  select count(*) into n from bit where id = 'a0000000-0000-0000-0000-0000000000a2'
    and search_tsv @@ websearch_to_tsquery('english', 'thoughts');
  if n <> 1 then raise exception 'AUD-C5 FAIL: uncaptioned audio not findable by its filename'; end if;
  raise notice 'HOLDS OK AUD-C5 uncaptioned audio: face null, still findable by its filename';

  -- AUD-C6 · a NON-media bit (a text note) is unaffected by the file_name append
  --   (its file_name is null → coalesce('') → search over its words, unchanged).
  insert into bit (id, type, body, content) values
    ('a0000000-0000-0000-0000-0000000000a3', 'text',
     '<p>notes on equanimity</p>', 'My retreat title');
  select count(*) into n from bit where id = 'a0000000-0000-0000-0000-0000000000a3'
    and search_tsv @@ websearch_to_tsquery('english', 'equanimity');
  if n <> 1 then raise exception 'AUD-C6 FAIL: text search regressed after the file_name append'; end if;
  raise notice 'HOLDS OK AUD-C6 a text bit still searches by its words (file_name append is null-safe)';

  -- AUD-C7 · the world views carry the audio bit (the_ledger + the_inbox recreated).
  select count(*) into n from the_ledger where id = 'a0000000-0000-0000-0000-0000000000a2';
  if n <> 1 then raise exception 'AUD-C7 FAIL: loose audio missing from the_ledger'; end if;
  select count(*) into n from the_inbox where id = 'a0000000-0000-0000-0000-0000000000a2';
  if n <> 1 then raise exception 'AUD-C7 FAIL: loose audio missing from the_inbox (should be loose)'; end if;
  select count(*) into n from the_inbox where id = 'a0000000-0000-0000-0000-0000000000a1';
  if n <> 0 then raise exception 'AUD-C7 FAIL: a PLACED audio still shows as loose in the_inbox'; end if;
  raise notice 'HOLDS OK AUD-C7 the recreated views work: loose audio in ledger+inbox, placed audio not loose';
end $$;

rollback;
\echo '--- audio-attacks.sql complete: every refusal refused, every assertion held ---'
