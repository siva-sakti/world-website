-- ============================================================================
-- pdf-attacks.sql — the pdf bit-type proof (pdf-plan.md).
-- ============================================================================
-- Run against a database with ALL migrations applied THROUGH
-- 20260830000004_pdf_type.sql (so 'pdf' is a real allowed type — a refusal here
-- comes from the SUBSTANCE branch, not from type_allowed; that is the whole point
-- of proving the branch). The attacks.sql suite proves the init schema; this proves
-- the pdf migration on top of the live chain (which already carries the audio one).
--
-- Every PDF-A block attempts an illegal write and REQUIRES a refusal with the named
-- error class; every PDF-C block asserts computed behavior (face + filename search
-- + the recreated views). One transaction, rolled back — the database is left
-- untouched. Runs as the DB superuser (bypasses RLS on purpose — we attack the
-- constraints, not the policies).
-- ============================================================================

\set ON_ERROR_STOP on
begin;

insert into board (id, title, visibility) values
  ('b0000000-0000-0000-0000-0000000000d1', 'PDFs', 'public');

-- ---------------------------------------------------------------------------
-- PDF-A · the attacks — each must be REFUSED by the substance CHECK
-- ---------------------------------------------------------------------------
do $$
begin
  -- PDF-A1 · pdf carrying a stray body (a hybrid) — substance
  begin
    insert into bit (type, storage_path, body) values
      ('pdf', 'pdfs/x1.pdf', '<p>not allowed</p>');
    raise exception 'NOT REFUSED: PDF-A1 pdf+body hybrid';
  exception when check_violation then raise notice 'REFUSED OK PDF-A1 pdf bit with a stray body'; end;

  -- PDF-A2 · pdf carrying a stray url (a hybrid) — substance
  begin
    insert into bit (type, storage_path, url) values
      ('pdf', 'pdfs/x2.pdf', 'https://example.com');
    raise exception 'NOT REFUSED: PDF-A2 pdf+url hybrid';
  exception when check_violation then raise notice 'REFUSED OK PDF-A2 pdf bit with a stray url'; end;

  -- PDF-A3 · a FILE-LESS pdf (no storage_path) — substance, §7B
  begin
    insert into bit (type, content) values ('pdf', 'orphan caption');
    raise exception 'NOT REFUSED: PDF-A3 fileless pdf';
  exception when check_violation then raise notice 'REFUSED OK PDF-A3 pdf without storage_path'; end;

  -- PDF-A4 · media facts on a fileless pdf — plumbing coherence
  --   (a file-less row can carry no file_name/mime/byte_size — bit_media_facts_only_with_file)
  begin
    insert into bit (type, byte_size) values ('pdf', 999);
    raise exception 'NOT REFUSED: PDF-A4 media facts without a file';
  exception when check_violation then raise notice 'REFUSED OK PDF-A4 media facts on a file-less pdf'; end;

  -- PDF-A5 · the retired bookmark type stays gone (the type set is closed to it)
  begin
    insert into bit (type, url) values ('bookmark', 'https://example.com');
    raise exception 'NOT REFUSED: PDF-A5 bookmark still accepted';
  exception when check_violation then raise notice 'REFUSED OK PDF-A5 bookmark type is still retired'; end;
end $$;

-- ---------------------------------------------------------------------------
-- PDF-C · the valid pdf bit + the computed face + the filename search
-- ---------------------------------------------------------------------------
do $$
declare n int; f text;
begin
  -- PDF-C1 · a valid CAPTIONED pdf bit inserts cleanly (file + THUMB + facts +
  --   page-1 dims + caption). Unlike audio, a pdf carries a thumb_path (its first-
  --   page render), exactly like an image — the substance branch allows it.
  insert into bit (id, type, storage_path, thumb_path, media_width, media_height,
                   file_name, mime, byte_size, content) values
    ('a0000000-0000-0000-0000-0000000000d1', 'pdf',
     'pdfs/d1.pdf', 'thumbs/d1.jpg', 464, 600,
     'quarterly summary.pdf', 'application/pdf', 512000, 'the Q3 numbers');
  insert into placement (id, board_id, target_bit_id, x, y) values
    ('f0000000-0000-0000-0000-0000000000d1', 'b0000000-0000-0000-0000-0000000000d1',
     'a0000000-0000-0000-0000-0000000000d1', 30, 30);
  raise notice 'HOLDS OK PDF-C1 a captioned pdf bit (file + thumb + facts + caption) inserts + places cleanly';

  -- PDF-C2 · the face = the caption (no pdf branch in bit_face → content wins).
  select face into f from bit where id = 'a0000000-0000-0000-0000-0000000000d1';
  if f <> 'the Q3 numbers' then raise exception 'PDF-C2 FAIL: pdf face = %', f; end if;
  raise notice 'HOLDS OK PDF-C2 pdf face = its caption (a pdf has no text headline of its own)';

  -- PDF-C3 · findable by its CAPTION (content indexed, as for every bit).
  select count(*) into n from bit where id = 'a0000000-0000-0000-0000-0000000000d1'
    and search_tsv @@ websearch_to_tsquery('english', 'numbers');
  if n <> 1 then raise exception 'PDF-C3 FAIL: pdf not findable by its caption'; end if;
  raise notice 'HOLDS OK PDF-C3 pdf findable by its caption';

  -- PDF-C4 · findable by its FILENAME (the owner''s ask; the audio migration''s
  --   search_tsv change covers pdf for free — no pdf-specific index work). A word
  --   that the text-search parser tokenizes on its own (here the leading word of a
  --   spaced name) proves file_name genuinely reaches a pdf''s search_tsv.
  select count(*) into n from bit where id = 'a0000000-0000-0000-0000-0000000000d1'
    and search_tsv @@ websearch_to_tsquery('english', 'quarterly');
  if n <> 1 then raise exception 'PDF-C4 FAIL: pdf not findable by its FILENAME'; end if;
  raise notice 'HOLDS OK PDF-C4 pdf findable by its FILENAME (search_tsv already indexes file_name)';

  -- PDF-C4b · the DOCUMENTED tokenizer limit (inherited, not pdf-specific): the
  --   text-search parser keeps a filename whose word is GLUED to the extension by a
  --   hyphen/underscore/dot (e.g. `annual-report.pdf`) as ONE token — so a bare-word
  --   query ("annual") does NOT match it via the DB index. The reliable finders are
  --   the CAPTION (indexed as words) and the client-side `\bword` prefix matcher
  --   (drawer / search list, which read the raw file_name). Full-text PDF search is
  --   parked (pdf-plan.md). This block RECORDS the behavior so a future change that
  --   silently alters it trips the suite.
  insert into bit (id, type, storage_path, file_name, mime, byte_size) values
    ('a0000000-0000-0000-0000-0000000000d4', 'pdf',
     'pdfs/d4.pdf', 'annual-report.pdf', 'application/pdf', 128000);
  select count(*) into n from bit where id = 'a0000000-0000-0000-0000-0000000000d4'
    and search_tsv @@ websearch_to_tsquery('english', 'annual');
  if n <> 0 then raise exception 'PDF-C4b CHANGED: a glued `annual-report.pdf` is now split by the parser — revisit the filename-search notes'; end if;
  raise notice 'HOLDS OK PDF-C4b glued `annual-report.pdf` stays one token (bare-word "annual" misses it) — documented, caption is the reliable finder';

  -- PDF-C5 · an UNCAPTIONED pdf: face is null (no headline), still findable by filename.
  --   Also proves the graceful-fallback shape: a thumb-less pdf (unrenderable page 1,
  --   thumb_path null) is still a legal file bit.
  insert into bit (id, type, storage_path, file_name, mime, byte_size) values
    ('a0000000-0000-0000-0000-0000000000d2', 'pdf',
     'pdfs/d2.pdf', 'morning scan.pdf', 'application/pdf', 204800);
  select face into f from bit where id = 'a0000000-0000-0000-0000-0000000000d2';
  if f is not null then raise exception 'PDF-C5 FAIL: uncaptioned pdf face should be null, got %', f; end if;
  select count(*) into n from bit where id = 'a0000000-0000-0000-0000-0000000000d2'
    and search_tsv @@ websearch_to_tsquery('english', 'morning');
  if n <> 1 then raise exception 'PDF-C5 FAIL: uncaptioned pdf not findable by its filename'; end if;
  raise notice 'HOLDS OK PDF-C5 uncaptioned (thumb-less) pdf: face null, still findable by its filename';

  -- PDF-C6 · a NON-media bit (a text note) is unaffected by the pdf branch.
  insert into bit (id, type, body, content) values
    ('a0000000-0000-0000-0000-0000000000d3', 'text',
     '<p>notes on equanimity</p>', 'My retreat title');
  select count(*) into n from bit where id = 'a0000000-0000-0000-0000-0000000000d3'
    and search_tsv @@ websearch_to_tsquery('english', 'equanimity');
  if n <> 1 then raise exception 'PDF-C6 FAIL: text search regressed after the pdf migration'; end if;
  raise notice 'HOLDS OK PDF-C6 a text bit still searches by its words (the pdf migration is inert for text)';

  -- PDF-C7 · the world views carry the pdf bit (the_ledger + the_inbox unchanged).
  select count(*) into n from the_ledger where id = 'a0000000-0000-0000-0000-0000000000d2';
  if n <> 1 then raise exception 'PDF-C7 FAIL: loose pdf missing from the_ledger'; end if;
  select count(*) into n from the_inbox where id = 'a0000000-0000-0000-0000-0000000000d2';
  if n <> 1 then raise exception 'PDF-C7 FAIL: loose pdf missing from the_inbox (should be loose)'; end if;
  select count(*) into n from the_inbox where id = 'a0000000-0000-0000-0000-0000000000d1';
  if n <> 0 then raise exception 'PDF-C7 FAIL: a PLACED pdf still shows as loose in the_inbox'; end if;
  raise notice 'HOLDS OK PDF-C7 the world views work: loose pdf in ledger+inbox, placed pdf not loose';
end $$;

rollback;
\echo '--- pdf-attacks.sql complete: every refusal refused, every assertion held ---'
