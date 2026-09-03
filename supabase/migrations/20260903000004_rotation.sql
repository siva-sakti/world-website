-- ============================================================================
-- ROTATION (rotation-plan.md v2; owner ruled it in 2026-09-02, organize-phase-plan §4g).
--
-- placement.angle — degrees, nullable. NULL and 0 both mean upright, so there is
-- no backfill: every existing card is already correct.
--
-- PER-BOARD, deliberately (owner: "it's just for the bit on the board not
-- globally"): the same arrangement family as x/y/z/locked_at. A photo tilted on
-- one board is upright on another. No CHECK — any real number is a valid angle,
-- exactly as x/y accept any position; the UI normalises for display.
--
-- The view is REPLACED to expose it. The select is VERBATIM from
-- 20260902000001_lock_and_description.sql with `p.angle` appended at the END
-- (append-only is what CREATE OR REPLACE allows), and the WITH clause REPEATS
-- `security_invoker = true`: OR REPLACE resets unspecified reloptions, and losing
-- that option would silently flip the view to definer rights — an RLS regression.
-- The proof asserts the option survives.
-- ============================================================================

alter table placement add column angle double precision;

create or replace view board_cards with (security_invoker = true) as
  select p.id as placement_id,
         p.board_id,
         case when p.target_bit_id is not null then 'bit' else 'board' end as thing,
         p.target_bit_id,
         p.target_board_id,
         p.x, p.y, p.width, p.height, p.z,
         p.display_size,
         p.arrived_at,
         coalesce(b.face, tb.title) as label,
         b.type,
         b.subtype_word_id,
         b.body, b.strokes, b.url,
         b.storage_path, b.thumb_path,
         b.visibility as target_visibility,
         b.source_id,
         s.name as source_name,
         s.url  as source_url,
         p.locked_at,
         p.angle
  from placement p
  left join bit b      on b.id  = p.target_bit_id
  left join board tb   on tb.id = p.target_board_id
  left join source s   on s.id  = b.source_id
  where p.left_at is null
    and (b.id  is null or b.state  = 'live')
    and (tb.id is null or tb.state = 'live');
