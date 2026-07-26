-- ============================================================================
-- capture — source provenance + the inbox (Capture Slice 1, "model on paper")
-- ============================================================================
-- Additive migration on the proven schema (20260721000001_init.sql). Derived
-- from capture-build-plan.md → "The model change" + "Slice 1 — Model on paper".
-- Nothing here is destructive: two nullable columns, one CHECK relaxed by
-- exactly one conjunct, one new computed surface (a view). Proven locally by
-- verification/capture-proofs.sql before it touches any real database (Cap-A).
--
-- Three changes, each cited:
--   1. source_url / source_title — provenance ("this came FROM here"), distinct
--      from a bookmark's url ("this bit IS a link"). Additive; not named by any
--      constraint. Displayed source = source_url ?? url.
--   2. bit_substance_matches_type — the bookmark branch drops `storage_path is
--      null` so a bookmark may carry a preview image. text/drawing/image are
--      copied byte-for-byte from init.sql (the relax is surgical — proven in
--      capture-proofs: the other three kinds still refuse a stray storage_path).
--   3. the_inbox — the loose pile: live bits with no placement that would render
--      them. Mirrors board_cards' render conjunction exactly; security_invoker
--      like every house view (lexicon "views") so owner RLS applies and the
--      posture can't drift. This is the tenth house view.
-- ============================================================================


-- ----------------------------------------------------------------------------
-- 1. PROVENANCE — two optional columns (capture-build-plan.md "The model change")
-- ----------------------------------------------------------------------------
alter table bit add column source_url   text;
  -- where this bit was captured FROM (a clip's home page). null = self-made.
  -- Distinct from `url` (a bookmark's own target); displayed source = source_url ?? url.
  -- Read once at capture, never re-read (same storage test as captured_title, I-R3):
  -- a dead or edited page must never mutate what you filed.
alter table bit add column source_title text;
  -- the source page's title, frozen at capture. Only CLIPS (a quote or image
  -- lifted FROM a page) carry it; a whole-page bookmark stores its title once in
  -- captured_title and leaves source_* null (I-S, kept by the db-module).


-- ----------------------------------------------------------------------------
-- 2. LET A BOOKMARK CARRY A PREVIEW — relax exactly one conjunct on the bookmark
--    branch. The text/drawing/image branches below are copied verbatim from
--    init.sql (lines 208–224); only the bookmark branch changes.
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
      when 'bookmark' then url is not null
                        and body is null and strokes is null
                        -- storage_path NOW PERMITTED (preview image);
                        -- was: `and storage_path is null` (init.sql line 221)
      else true  -- unknown types are gated by bit_type_allowed, not here
    end
  );
  -- bit_media_facts_only_with_file is UNTOUCHED: a preview's own facts
  -- (thumb_path, media_width, …) still require storage_path present. The source
  -- columns need no constraint change (the substance CHECK never mentions them).


-- ----------------------------------------------------------------------------
-- 3. THE INBOX — the loose pile as a computed surface (the tenth house view).
--    A bit is loose ⇔ it is LIVE and has NO placement that would render it:
--    no left_at-null placement on a board that isn't trashed — the exact
--    conjunction board_cards uses (init.sql ~590). Not a stored flag.
--    The board-not-trashed conjunct closes the review's hole: a bit whose only
--    board is trashed keeps a left_at-null placement (trash logs no departure),
--    so a naive "any active placement ⇒ not loose" test would file it NOWHERE —
--    invisible on boards and absent from the inbox. Here it correctly returns.
--    Corollary (pure symmetry): un-placing a bit from its last board, and
--    trashing its last board, both return it here; restoring the board removes it.
-- ----------------------------------------------------------------------------
create view the_inbox with (security_invoker = true) as
  select b.*
  from bit b
  where b.deleted_at is null
    and not exists (
      select 1
      from placement p
      join board bo on bo.id = p.board_id
      where p.target_bit_id = b.id
        and p.left_at is null
        and bo.deleted_at is null
    )
  order by b.created_at desc;
