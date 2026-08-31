-- ============================================================================
-- audio — the first FILE-BIT beyond image (voice memos), + the shared file-bit
-- foundation the PDF plan reuses (voice-memo-plan.md). Additive + version-safe.
-- ============================================================================
-- Three linked changes, all additive (no data migrated, no column dropped except
-- the generated search_tsv which is immediately re-added):
--   1. 'audio' joins the allowed bit types (the extensible-door CHECK, parked
--      door 2 — extend the list, never a hard enum).
--   2. the substance rule gains an 'audio' branch, IDENTICAL in shape to 'image'
--      (a file-backed bit: storage_path present, no body/strokes/url/captured
--      title). Re-declared from the LIVE constraint (20260726000001_source_
--      first_class.sql:161-174, post-bookmark) so it is exact on any cloud PG.
--   3. search_tsv now also indexes file_name — so every media bit is findable by
--      its filename (the owner's ask: "find it by filename"). A STORED generated
--      column can't be edited in place on every PG version, so the version-safe
--      shape is drop-the-two-dependent-views → drop-the-column (its index falls
--      with it) → re-add the generated column with file_name appended → recreate
--      the index → recreate the two views VERBATIM from the live definition
--      (20260830000001_resting_state.sql:34-56, security_invoker kept).
--
-- bit_face() gets NO audio branch: a recording has no text headline. Its display
-- headline is the caption (content), and it is now searchable by its filename.
--
-- Proven on a throwaway PG before it touches cloud (verification/audio-attacks.sql
-- + run-audio-native.sh). LOCAL PROOF ONLY — the owner runs the cloud migration,
-- verifies, THEN deploys the app. Never app-before-migration.
-- ============================================================================


-- ----------------------------------------------------------------------------
-- 1. 'audio' joins the allowed type set (was text · drawing · image).
-- ----------------------------------------------------------------------------
alter table bit drop constraint bit_type_allowed;
alter table bit add  constraint bit_type_allowed check (type in ('text', 'drawing', 'image', 'audio'));


-- ----------------------------------------------------------------------------
-- 2. the substance rule gains the audio branch (same shape as image). text /
--    drawing / image are copied VERBATIM from the live constraint (the post-
--    bookmark form in 20260726000001_source_first_class.sql:161-174).
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
      else true  -- unknown types are gated by bit_type_allowed, not here
    end
  );


-- ----------------------------------------------------------------------------
-- 3. search_tsv also indexes file_name (findable by filename). Version-safe
--    rebuild: the_ledger + the_inbox are `select b.*` (they carry search_tsv, so
--    they block the column drop) → drop them → drop the generated column (its
--    index bit_search falls with it) → re-add it, file_name appended → recreate
--    the index → recreate the two views VERBATIM from resting_state.sql:34-56.
--    (board_cards, home, the_pull, trash_listing, bit_travel, archive_listing do
--    NOT select search_tsv, so they are untouched.)
-- ----------------------------------------------------------------------------
drop view the_inbox;
drop view the_ledger;

alter table bit drop column search_tsv;

alter table bit add column search_tsv tsvector generated always as
  (to_tsvector('english',
    bit_search_text(content, body, url, captured_title) || ' ' || coalesce(file_name, ''))) stored;

create index bit_search on bit using gin (search_tsv);

-- the_ledger — VERBATIM from 20260830000001_resting_state.sql:34-41.
create view the_ledger with (security_invoker = true) as
  select b.*,
         s.name as source_name,
         s.url  as source_url
  from bit b
  left join source s on s.id = b.source_id
  where b.state = 'live'
  order by b.created_at desc;

-- the_inbox — VERBATIM from 20260830000001_resting_state.sql:44-56.
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
