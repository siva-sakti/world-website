-- ============================================================================
-- APPLY THE PDF-TYPE MIGRATION TO CLOUD (Supabase SQL Editor). One transaction.
-- This is 20260830000004_pdf_type.sql, verbatim. SMALL + additive — it only adds
-- 'pdf' to the allowed types and a 'pdf' substance branch (same shape as image /
-- audio). No search_tsv / view changes (file_name is already indexed).
--
-- Runs AFTER the audio migration (it re-declares the substance CHECK from the
-- post-audio form + adds the pdf branch). Back up first; paste ONLY the SQL.
-- Migration-before-deploy: run this, confirm, THEN the app is deployed.
-- ============================================================================

begin;

alter table bit drop constraint bit_type_allowed;
alter table bit add  constraint bit_type_allowed check (type in ('text', 'drawing', 'image', 'audio', 'pdf'));

alter table bit drop constraint bit_substance_matches_type;
alter table bit add  constraint bit_substance_matches_type check (
    case type
      when 'text'     then body is not null and strokes is null and url is null and captured_title is null and storage_path is null
      when 'drawing'  then strokes is not null and body is null and url is null and captured_title is null and storage_path is null
      when 'image'    then storage_path is not null and body is null and strokes is null and url is null and captured_title is null
      when 'audio'    then storage_path is not null and body is null and strokes is null and url is null and captured_title is null
      when 'pdf'      then storage_path is not null and body is null and strokes is null and url is null and captured_title is null
      else true
    end
  );

commit;

-- VERIFY (run separately after commit):
--   select pg_get_constraintdef(oid) from pg_constraint where conname = 'bit_type_allowed';
-- Expected: the CHECK now lists 'pdf' alongside text/drawing/image/audio.
