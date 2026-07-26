-- ============================================================================
-- source-proofs.sql — Source Stage 0 proofs (Source-Checkpoint)
-- ============================================================================
-- Run against a database with, in filename order:
--   20260721000001_init.sql
--   20260723000001_owner_scoped_rls.sql
--   20260725000001_capture_source_and_inbox.sql
--   20260725000002_gather_reference.sql
-- then SEEDED (run-source-native.sh PHASE 4b: a bookmark bit + a null-title clip
-- + a plain text bit) and finally 20260726000001_source_first_class.sql applied.
--
-- Self-contained transactions, each rolled back — the database is left as the
-- migration left it. Every assertion RAISEs loudly on failure (\set ON_ERROR_STOP
-- → psql exits non-zero); each NOTICE is one green line. Models attacks.sql /
-- gather-proofs.sql: constraint-rejection blocks catch the EXPECTED refusal and
-- raise only when a write was WRONGLY accepted.
--
-- Runner identity: §§1-6 run as the DB superuser, which BYPASSES RLS on purpose
-- — they attack TABLE CONSTRAINTS + the migration's data conversion (physics),
-- not the security boundary. §7 alone switches to role `authenticated` under a
-- simulated JWT to prove the owner-scoped wall (the gather-proofs convention).
--
-- Proves:
--   1. ZERO bookmark rows survive; the seeded bookmark is now a text bit with a
--      NON-NULL link body + a source (name = its captured title, url kept).
--   2. NAME FALLBACK — a clip whose source_title was NULL got a source named
--      after its URL; a self-made bit (no provenance) got no source.
--   3. source_name_ci REFUSES a case-duplicate name (near-dups die at birth).
--   4. source_id FK REJECTS a phantom source; deleting a source SETS NULL its
--      bits' source_id (the bit survives, loses the stamp).
--   5. GROUPING (where source_id = X) returns EXACTLY that source's bits.
--   6. type='bookmark' is now REFUSED (bit_type_allowed retired it).
--   7. RLS OWNER-SCOPING — a stranger reads zero and cannot write; the owner
--      reads all (the D-094 wall, on the new source table).
-- ============================================================================
\set ON_ERROR_STOP on


-- ---------------------------------------------------------------------------
-- 1 · ZERO bookmarks survive · the seeded bookmark converted cleanly
--     (reads the PERSISTED migration result — no transaction needed)
-- ---------------------------------------------------------------------------
do $$
declare n int; b_type text; b_body text; b_src uuid; s_name text; s_url text;
begin
  -- no bookmark rows anywhere (the attack suite's headline claim)
  select count(*) into n from bit where type = 'bookmark';
  if n <> 0 then raise exception '1 FAIL: % bookmark row(s) survived the migration', n; end if;

  -- the seeded bookmark is now a TEXT bit with a non-null link body + a source
  select type, body, source_id into b_type, b_body, b_src
    from bit where id = 'b0000000-0000-0000-0000-000000000001';
  if b_type <> 'text'          then raise exception '1 FAIL: the converted bookmark is type % (want text)', b_type; end if;
  if b_body is null            then raise exception '1 FAIL: the converted bookmark has a NULL body (finding #1)'; end if;
  if b_body not like '%<a href=%' then raise exception '1 FAIL: the converted body is not a link: %', b_body; end if;
  if b_src is null             then raise exception '1 FAIL: the converted bookmark carries no source'; end if;

  -- its source = the captured title as name + the original url
  select name, url into s_name, s_url from source where id = b_src;
  if s_name <> 'A Good Article' then raise exception '1 FAIL: converted-bookmark source name = % (want "A Good Article")', s_name; end if;
  if s_url  <> 'https://example.com/article' then raise exception '1 FAIL: converted-bookmark source url = %', s_url; end if;

  -- and every bookmark-only column is cleared (so the text substance rule passes)
  perform 1 from bit where id = 'b0000000-0000-0000-0000-000000000001'
    and url is null and captured_title is null and storage_path is null
    and thumb_path is null and media_width is null and byte_size is null;
  if not found then raise exception '1 FAIL: the converted bookmark still carries url/captured_title/media columns'; end if;

  raise notice 'HOLDS ✓ 1 zero bookmark rows survive · the seeded bookmark is now a TEXT bit with a non-null link body + a source (name = its captured title, url kept)';
end $$;


-- ---------------------------------------------------------------------------
-- 2 · NAME FALLBACK — a null-title clip's source is named after its URL;
--     a self-made bit got no source
-- ---------------------------------------------------------------------------
do $$
declare src uuid; s_name text; s_url text;
begin
  select source_id into src from bit where id = 'c0000000-0000-0000-0000-000000000001';
  if src is null then raise exception '2 FAIL: the clip (source_title NULL) got no source'; end if;
  select name, url into s_name, s_url from source where id = src;
  if s_name <> 'https://example.com/essay' then raise exception '2 FAIL: null-title source name = % (want the URL — finding #3)', s_name; end if;
  if s_url  <> 'https://example.com/essay' then raise exception '2 FAIL: null-title source url = %', s_url; end if;

  -- a self-made bit (no provenance) must NOT have been given a source
  perform 1 from bit where id = 'd0000000-0000-0000-0000-000000000001' and source_id is null;
  if not found then raise exception '2 FAIL: a self-made bit was wrongly given a source'; end if;

  raise notice 'HOLDS ✓ 2 name-fallback: a clip whose title-fetch failed (source_title NULL) got a source named after its URL · a self-made bit got none';
end $$;


-- ---------------------------------------------------------------------------
-- 3 · source_name_ci — a case-duplicate source name is refused at birth
-- ---------------------------------------------------------------------------
begin;
insert into source (name, url) values ('Deep Work', 'https://calnewport.com/deep-work');
do $$
begin
  begin
    insert into source (name) values ('deep work');   -- a case-variant of the same name
    raise exception '3 FAIL: a case-duplicate source name was accepted';
  exception when unique_violation then
    raise notice 'REFUSED ✓ 3 source_name_ci: a case-duplicate source name is refused at birth (like tags)';
  end;
end $$;
rollback;


-- ---------------------------------------------------------------------------
-- 4 · source_id FK rejects a phantom · delete-source SETS NULL (bit survives)
-- ---------------------------------------------------------------------------
begin;
insert into source (id, name) values ('50000000-0000-0000-0000-000000000001', 'A Book With No Link');
insert into bit (id, type, body, source_id) values
  ('a0000000-0000-0000-0000-000000000009', 'text', '<p>a note from the book</p>',
   '50000000-0000-0000-0000-000000000001');
do $$
declare n int;
begin
  -- FK: a bit cannot point at a source that does not exist
  begin
    insert into bit (type, body, source_id) values
      ('text', '<p>x</p>', 'ffffffff-ffff-ffff-ffff-ffffffffffff');
    raise exception '4 FAIL: a bit pointed at a phantom source was accepted';
  exception when foreign_key_violation then
    raise notice 'REFUSED ✓ 4a source_id FK: a bit cannot point at a non-existent source';
  end;

  -- SET NULL: delete the source → the bit survives, loses the stamp
  delete from source where id = '50000000-0000-0000-0000-000000000001';
  select count(*) into n from bit where id = 'a0000000-0000-0000-0000-000000000009';
  if n <> 1 then raise exception '4 FAIL: deleting a source destroyed its bit (n=%)', n; end if;
  perform 1 from bit where id = 'a0000000-0000-0000-0000-000000000009' and source_id is null;
  if not found then raise exception '4 FAIL: deleting a source did not null the bit''s source_id'; end if;

  raise notice 'HOLDS ✓ 4 source_id FK rejects a phantom · deleting a source sets its bits'' source_id NULL (the bit survives, loses the stamp)';
end $$;
rollback;


-- ---------------------------------------------------------------------------
-- 5 · GROUPING — "everything from this source" is exactly its bits
-- ---------------------------------------------------------------------------
begin;
insert into source (id, name) values ('51000000-0000-0000-0000-000000000001', 'The Interviews');
insert into bit (id, type, body, source_id) values
  ('a5000000-0000-0000-0000-000000000001', 'text', '<p>from the interviews 1</p>', '51000000-0000-0000-0000-000000000001'),
  ('a5000000-0000-0000-0000-000000000002', 'text', '<p>from the interviews 2</p>', '51000000-0000-0000-0000-000000000001'),
  ('a5000000-0000-0000-0000-000000000003', 'text', '<p>from somewhere else</p>',    null);
do $$
declare n int;
begin
  select count(*) into n from bit where source_id = '51000000-0000-0000-0000-000000000001';
  if n <> 2 then raise exception '5 FAIL: grouping by source_id returned % bits (want exactly 2)', n; end if;
  raise notice 'HOLDS ✓ 5 grouping (where source_id = X) returns exactly that source''s bits — "everything from this source" assembles itself';
end $$;
rollback;


-- ---------------------------------------------------------------------------
-- 6 · type='bookmark' is now REFUSED (the type is retired)
-- ---------------------------------------------------------------------------
begin;
do $$
begin
  begin
    insert into bit (type, url) values ('bookmark', 'https://example.com/x');
    raise exception '6 FAIL: a bookmark bit was accepted (the type should be retired)';
  exception when check_violation then
    raise notice 'REFUSED ✓ 6 type=''bookmark'' is now refused (bit_type_allowed retired it)';
  end;
end $$;
rollback;


-- ---------------------------------------------------------------------------
-- 7 · RLS OWNER-SCOPING — the D-094 wall on the new source table
--     (auth.uid() vs a JWT sub; the harness stands in Supabase's auth.uid())
-- ---------------------------------------------------------------------------
begin;
-- seed as superuser (RLS bypassed): one owner source
insert into source (id, name) values ('60000000-0000-0000-0000-000000000001', 'Owner Source');

-- OWNER (jwt sub = the owner uid) reads sources
set local request.jwt.claims = '{"sub":"298fbf29-39c8-4738-96d0-3348f0e59fd0"}';
set local role authenticated;
do $$
declare n int;
begin
  select count(*) into n from source;
  if n < 1 then raise exception '7 FAIL: the owner cannot read source rows (saw %)', n; end if;
  raise notice 'HOLDS ✓ 7 owner (jwt sub = owner uid) reads source rows';
end $$;
reset role;

-- STRANGER (a different signed-up uid) reads zero and cannot write
set local request.jwt.claims = '{"sub":"00000000-0000-0000-0000-0000000000ff"}';
set local role authenticated;
do $$
declare n int;
begin
  select count(*) into n from source;
  if n <> 0 then raise exception '7 FAIL: a stranger read % source rows (want 0)', n; end if;
  begin
    insert into source (name) values ('stranger source');
    raise exception '7 FAIL: a stranger was allowed to write a source';
  exception when insufficient_privilege then
    raise notice 'REFUSED ✓ 7b a stranger cannot write a source (WITH CHECK owner clause)';
  end;
  raise notice 'HOLDS ✓ 7 a stranger reads zero source rows (owner-scoped wall)';
end $$;
reset role;
rollback;


\echo '--- source-proofs.sql complete: zero bookmarks survive · conversion + name-fallback clean · name_ci refuses dups · FK set-null · grouping exact · bookmark refused · owner-scoped RLS holds ---'
