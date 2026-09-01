-- ============================================================================
-- APPLY THE LINK-TYPE MIGRATION TO CLOUD (Supabase SQL Editor). One transaction.
-- This is 20260901000001_link_type.sql, verbatim: adds 'link' to the allowed
-- types + a link substance branch (url required; the dormant D-102 columns
-- revive for this ONE type) + narrowly relaxes bit_media_facts_only_with_file
-- (a link may carry thumb_path — its stored page-card image — with no
-- storage_path; all other media facts stay file-only) + revives bit_face's
-- dormant branch as 'link' (CREATE OR REPLACE, identical signature — never DROP).
-- NO search change (url + captured_title already indexed).
--
-- Proven on a throwaway PG17 first (run-link-native.sh: existing suite green,
-- 7 refusals + 6 behavior checks). Back up first; paste ONLY the SQL.
-- Migration-before-deploy: run this, confirm, THEN the app deploys.
-- ============================================================================

begin;

alter table bit drop constraint bit_type_allowed;
alter table bit add  constraint bit_type_allowed check (type in ('text', 'drawing', 'image', 'audio', 'pdf', 'link'));

alter table bit drop constraint bit_substance_matches_type;
alter table bit add  constraint bit_substance_matches_type check (
    case type
      when 'text'     then body is not null and strokes is null and url is null and captured_title is null and storage_path is null
      when 'drawing'  then strokes is not null and body is null and url is null and captured_title is null and storage_path is null
      when 'image'    then storage_path is not null and body is null and strokes is null and url is null and captured_title is null
      when 'audio'    then storage_path is not null and body is null and strokes is null and url is null and captured_title is null
      when 'pdf'      then storage_path is not null and body is null and strokes is null and url is null and captured_title is null
      when 'link'     then url is not null and body is null and strokes is null and storage_path is null
      else true
    end
  );

alter table bit drop constraint bit_media_facts_only_with_file;
alter table bit add  constraint bit_media_facts_only_with_file check (
    storage_path is not null
    or (type = 'link' and media_width is null and media_height is null
        and file_name is null and mime is null and byte_size is null)
    or (thumb_path is null and media_width is null and media_height is null
        and file_name is null and mime is null and byte_size is null)
  );

create or replace function bit_face(
  p_type text, p_content text, p_body text, p_url text, p_captured_title text
) returns text
language sql immutable
as $$
  select coalesce(
    nullif(btrim(p_content), ''),
    case p_type
      when 'text' then nullif(btrim(regexp_replace(coalesce(p_body, ''), '<[^>]*>', ' ', 'g')), '')
      when 'link' then coalesce(nullif(btrim(p_captured_title), ''), p_url)
      else null
    end
  )
$$;

commit;

-- VERIFY (run separately after commit):
--   select pg_get_constraintdef(oid) from pg_constraint where conname = 'bit_type_allowed';
-- Expected: the CHECK now lists 'link' alongside text/drawing/image/audio/pdf.
