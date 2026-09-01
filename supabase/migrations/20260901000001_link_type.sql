-- ============================================================================
-- link — the link bit returns as a first-class type (link-bit-plan.md; owner-ruled
-- 2026-08-31, partially superseding D-102: the source model stands untouched — a
-- URL with your words is still a note-with-source — what returns is the saved-page
-- OBJECT: a bare URL pasted deliberately becomes a bit, shown as a card with its
-- read-once title + a stored copy of its page image).
--
-- Three DDL changes (the third is what makes this more than the audio/pdf pattern):
--   1. 'link' joins bit_type_allowed.
--   2. A 'link' substance branch: url REQUIRED (the substance), body/strokes/
--      storage_path forbidden; captured_title free (the dormant D-102 columns
--      revive — every other branch still forces them null, verbatim unchanged).
--   3. bit_media_facts_only_with_file relaxes NARROWLY: a link may carry thumb_path
--      (its stored page-card image) with NO storage_path — but its other media
--      facts (dims/file_name/mime/byte_size) stay null, so "media facts describe
--      the file at storage_path" keeps its meaning for every type.
-- Plus: bit_face's dormant 'bookmark' branch becomes 'link' (same rule — the
-- read-once captured title, else the URL). CREATE OR REPLACE with the IDENTICAL
-- signature and parameter names — never DROP (the face generated column and every
-- select-b.* view hang off it). Safe in place: all live rows force url/captured_title
-- null and zero bookmark rows exist, so no stored face changes value.
-- NO search change: search_tsv already indexes url + captured_title (20260830000003).
-- ============================================================================

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
