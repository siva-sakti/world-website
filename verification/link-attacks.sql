-- ============================================================================
-- link-attacks.sql — the link bit-type proof (link-bit-plan.md).
-- ============================================================================
-- Run against a database with ALL migrations applied THROUGH
-- 20260901000001_link_type.sql (so 'link' is a real allowed type — a refusal here
-- comes from the SUBSTANCE branch or the media-facts relax, which is the point).
--
-- L-A blocks attempt illegal writes and REQUIRE the named refusal; L-C blocks
-- assert computed behavior (face precedence · search by url + title · the views).
-- One transaction, rolled back — the database is left untouched. Runs as the DB
-- superuser (bypasses RLS on purpose — we attack constraints, not policies).
-- ============================================================================

\set ON_ERROR_STOP on
begin;

insert into board (id, title, visibility) values
  ('b0000000-0000-0000-0000-0000000000e1', 'Links', 'public');

-- ---------------------------------------------------------------------------
-- L-A · the attacks — each must be REFUSED
-- ---------------------------------------------------------------------------
do $$
begin
  -- L-A1 · link carrying a stray body (a hybrid) — substance
  begin
    insert into bit (type, url, body) values
      ('link', 'https://example.com/a', '<p>not allowed</p>');
    raise exception 'NOT REFUSED: L-A1 link+body hybrid';
  exception when check_violation then raise notice 'REFUSED OK L-A1 link bit with a stray body'; end;

  -- L-A2 · link carrying a stored file (a hybrid with image/audio/pdf) — substance
  begin
    insert into bit (type, url, storage_path) values
      ('link', 'https://example.com/b', 'images/x.jpg');
    raise exception 'NOT REFUSED: L-A2 link+storage_path hybrid';
  exception when check_violation then raise notice 'REFUSED OK L-A2 link bit with a storage_path'; end;

  -- L-A3 · a URL-LESS link (no substance at all) — substance
  begin
    insert into bit (type, content) values ('link', 'orphan caption');
    raise exception 'NOT REFUSED: L-A3 url-less link';
  exception when check_violation then raise notice 'REFUSED OK L-A3 link without a url'; end;

  -- L-A4 · media facts on a link — the relax is thumb_path ONLY (mime etc. stay
  --   "describes the file at storage_path")
  begin
    insert into bit (type, url, thumb_path, byte_size) values
      ('link', 'https://example.com/c', 'thumbs/x.jpg', 999);
    raise exception 'NOT REFUSED: L-A4 media facts on a link';
  exception when check_violation then raise notice 'REFUSED OK L-A4 link with byte_size (facts stay file-only)'; end;

  -- L-A5 · the relax leaks NOTHING to other types: an image with a thumb but no
  --   file is still refused (both by substance AND media-facts)
  begin
    insert into bit (type, thumb_path) values ('image', 'thumbs/leak.jpg');
    raise exception 'NOT REFUSED: L-A5 fileless image with a thumb';
  exception when check_violation then raise notice 'REFUSED OK L-A5 media-facts relax leaked nothing to image'; end;

  -- L-A6 · a TEXT bit still cannot carry a url (the dormant columns stay closed
  --   to every other type)
  begin
    insert into bit (type, body, url) values
      ('text', '<p>hi</p>', 'https://example.com/d');
    raise exception 'NOT REFUSED: L-A6 text+url hybrid';
  exception when check_violation then raise notice 'REFUSED OK L-A6 url stays closed to text bits'; end;

  -- L-A7 · the retired bookmark type stays gone
  begin
    insert into bit (type, url) values ('bookmark', 'https://example.com/e');
    raise exception 'NOT REFUSED: L-A7 bookmark still accepted';
  exception when check_violation then raise notice 'REFUSED OK L-A7 bookmark type is still retired'; end;
end $$;

-- ---------------------------------------------------------------------------
-- L-C · computed behavior — face precedence · search · the views
-- ---------------------------------------------------------------------------

-- Three legal links: full (title+thumb) · title-less · captioned.
insert into bit (id, type, url, captured_title, thumb_path) values
  ('a0000000-0000-0000-0000-0000000000e1', 'link', 'https://example.com/song', 'Bridge Over Troubled Water', 'thumbs/e1.jpg');
insert into bit (id, type, url) values
  ('a0000000-0000-0000-0000-0000000000e2', 'link', 'https://barewall.example.net/post/77');
insert into bit (id, type, url, captured_title, content) values
  ('a0000000-0000-0000-0000-0000000000e3', 'link', 'https://example.com/essay', 'Some Fetched Headline', 'my own words win');

do $$
declare f text;
begin
  -- L-C1 · face = captured_title when no content
  select face into f from bit where id = 'a0000000-0000-0000-0000-0000000000e1';
  if f = 'Bridge Over Troubled Water' then raise notice 'OK L-C1 face = the read-once title';
  else raise exception 'L-C1 FAILED: face=%', f; end if;

  -- L-C2 · face falls to the URL when there is no title
  select face into f from bit where id = 'a0000000-0000-0000-0000-0000000000e2';
  if f = 'https://barewall.example.net/post/77' then raise notice 'OK L-C2 face = the url (title-less card)';
  else raise exception 'L-C2 FAILED: face=%', f; end if;

  -- L-C3 · the owner's caption beats the fetched title
  select face into f from bit where id = 'a0000000-0000-0000-0000-0000000000e3';
  if f = 'my own words win' then raise notice 'OK L-C3 caption beats title';
  else raise exception 'L-C3 FAILED: face=%', f; end if;

  -- L-C4 · search finds by the TITLE even when a caption hides it from the face
  if exists (select 1 from bit where id = 'a0000000-0000-0000-0000-0000000000e3'
             and search_tsv @@ plainto_tsquery('english', 'fetched headline')) then
    raise notice 'OK L-C4 search finds the captioned link by its title';
  else raise exception 'L-C4 FAILED: title not searchable'; end if;

  -- L-C5 · search finds by the URL (D-088: search is wider than the face). Postgres
  -- tokenizes a URL as HOST tokens ('barewall.example.net' is one token — proven in
  -- the run-1 diagnosis), so the DB contract is host-form matching; WORD-level url
  -- search ("barewall" alone) is the CLIENT search's job (searchItems.searchText
  -- gains url + captured_title in the app build).
  if exists (select 1 from bit where id = 'a0000000-0000-0000-0000-0000000000e2'
             and search_tsv @@ plainto_tsquery('english', 'barewall.example.net')) then
    raise notice 'OK L-C5 search finds a link by its url (host form)';
  else raise exception 'L-C5 FAILED: url not searchable'; end if;
end $$;

-- L-C6 · the surfaces: a loose link sits in the_inbox; placed, it rides board_cards
do $$
declare f text; n int;
begin
  select count(*) into n from the_inbox where id in
    ('a0000000-0000-0000-0000-0000000000e1','a0000000-0000-0000-0000-0000000000e2','a0000000-0000-0000-0000-0000000000e3');
  if n = 3 then raise notice 'OK L-C6a all three links sit loose in the_inbox';
  else raise exception 'L-C6a FAILED: % of 3 in the_inbox', n; end if;

  insert into placement (id, board_id, target_bit_id, x, y) values
    ('c0000000-0000-0000-0000-0000000000e1', 'b0000000-0000-0000-0000-0000000000e1',
     'a0000000-0000-0000-0000-0000000000e1', 40, 40);
  -- board_cards exposes the face AS `label` (and carries the raw url — the card's open-link).
  select label into f from board_cards where placement_id = 'c0000000-0000-0000-0000-0000000000e1';
  if f = 'Bridge Over Troubled Water' then raise notice 'OK L-C6b the placed link rides board_cards, label = its face';
  else raise exception 'L-C6b FAILED: board_cards label=%', f; end if;
end $$;

rollback;
\echo 'link-attacks: ALL PROOFS PASSED (rolled back — database untouched)'
