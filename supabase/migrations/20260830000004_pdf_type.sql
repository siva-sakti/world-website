-- ============================================================================
-- pdf — the second FILE-BIT beyond image (upload a PDF → first-page thumbnail on a
-- board → viewer on the bit page). Reuses the shared file-bit foundation the audio
-- migration laid (pdf-plan.md). Additive + version-safe.
-- ============================================================================
-- TWO linked changes, both additive (no data migrated, no column dropped):
--   1. 'pdf' joins the allowed bit types (the extensible-door CHECK — extend the
--      list, never a hard enum).
--   2. the substance rule gains a 'pdf' branch, IDENTICAL in shape to 'image' and
--      'audio' (a file-backed bit: storage_path present, no body/strokes/url/
--      captured_title). Re-declared VERBATIM from the LIVE constraint (as left by
--      20260830000003_audio_type.sql:43-59, which already carries the audio branch)
--      so it is exact on any cloud PG.
--
-- NO search_tsv / view change: the audio migration already appended file_name to
-- search_tsv (20260830000003_audio_type.sql:74-80), so a PDF is findable by its
-- filename for free. bit_face() gets NO pdf branch: a PDF has no text headline —
-- its display headline is its caption (content), and it is searchable by filename.
--
-- Proven on a throwaway PG before it touches cloud (verification/pdf-attacks.sql +
-- run-pdf-native.sh). LOCAL PROOF ONLY — the owner runs the cloud migration,
-- verifies, THEN deploys the app. Never app-before-migration.
-- ============================================================================


-- ----------------------------------------------------------------------------
-- 1. 'pdf' joins the allowed type set (was text · drawing · image · audio).
-- ----------------------------------------------------------------------------
alter table bit drop constraint bit_type_allowed;
alter table bit add  constraint bit_type_allowed check (type in ('text', 'drawing', 'image', 'audio', 'pdf'));


-- ----------------------------------------------------------------------------
-- 2. the substance rule gains the pdf branch (same shape as image/audio). text /
--    drawing / image / audio are copied VERBATIM from the live constraint (the
--    post-audio form in 20260830000003_audio_type.sql:43-59).
-- ----------------------------------------------------------------------------
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
      when 'pdf'      then storage_path is not null
                        and body is null and strokes is null
                        and url is null and captured_title is null
      else true  -- unknown types are gated by bit_type_allowed, not here
    end
  );
