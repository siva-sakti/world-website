-- ============================================================================
-- APPLY THE AUDIO-TYPE MIGRATION TO CLOUD (Supabase SQL Editor).
-- Wrapped in ONE transaction — all-or-nothing (if any line errors, nothing changes).
-- This is 20260830000003_audio_type.sql, verbatim, between begin/commit.
--
-- BEFORE running: take a backup (Supabase snapshot / point-in-time restore).
-- Paste ONLY the SQL below (nothing else). After it commits, run the VERIFY block
-- at the very bottom (separately) and send the result back.
-- Migration-before-deploy: run this FIRST, confirm, THEN the app is deployed.
-- ============================================================================

begin;

-- 1. 'audio' joins the allowed type set (was text · drawing · image).
alter table bit drop constraint bit_type_allowed;
alter table bit add  constraint bit_type_allowed check (type in ('text', 'drawing', 'image', 'audio'));

-- 2. the substance rule gains the audio branch (same shape as image); text/drawing/
--    image copied verbatim from the LIVE constraint (post-bookmark).
alter table bit drop constraint bit_substance_matches_type;
alter table bit add  constraint bit_substance_matches_type check (
    case type
      when 'text'     then body is not null
                        and strokes is null and url is null
                        and captured_title is null and storage_path is null
      when 'drawing'  then strokes is not null
                        and body is null and url is null
                        and captured_title is null and storage_path is null
      when 'image'    then storage_path is not null
                        and body is null and strokes is null
                        and url is null and captured_title is null
      when 'audio'    then storage_path is not null
                        and body is null and strokes is null
                        and url is null and captured_title is null
      else true
    end
  );

-- 3. search_tsv also indexes file_name (findable by filename). Version-safe rebuild:
--    drop the two select-b.* views → drop the generated column (its index falls too)
--    → re-add it with file_name appended → recreate the index → recreate the views.
drop view the_inbox;
drop view the_ledger;

alter table bit drop column search_tsv;

alter table bit add column search_tsv tsvector generated always as
  (to_tsvector('english',
    bit_search_text(content, body, url, captured_title) || ' ' || coalesce(file_name, ''))) stored;

create index bit_search on bit using gin (search_tsv);

create view the_ledger with (security_invoker = true) as
  select b.*,
         s.name as source_name,
         s.url  as source_url
  from bit b
  left join source s on s.id = b.source_id
  where b.state = 'live'
  order by b.created_at desc;

create view the_inbox with (security_invoker = true) as
  select b.*
  from bit b
  where b.state = 'live'
    and not exists (
      select 1
      from placement p
      join board bo on bo.id = p.board_id
      where p.target_bit_id = b.id
        and p.left_at is null
        and bo.state = 'live'
    )
  order by b.created_at desc;

commit;

-- ============================================================================
-- VERIFY (run this SEPARATELY, after the commit above succeeds):
--   select pg_get_constraintdef(oid) from pg_constraint where conname = 'bit_type_allowed';
-- Expected: the CHECK now lists 'audio' alongside text/drawing/image.
-- ============================================================================
