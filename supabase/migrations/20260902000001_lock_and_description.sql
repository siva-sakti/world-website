-- ============================================================================
-- Card lock + board description (board-basics-plan B+, owner-ruled 2026-09-01).
--
--   1. placement.locked_at (timestamptz, null = unlocked — the house pinned_at
--      style): a LOCKED card's position is frozen — drag/resize/nudge/tidy skip
--      it; select/open/tags still work; unplace/trash still allowed (lock guards
--      POSITION, not existence). Placement state, per-board, like x/y/z — so
--      duplicate-board copies it (a faithful copy of the arrangement, ruled).
--   2. board.description (text, null = none): an optional subtitle under the
--      title. NOT searchable — /search excludes boards (D-122); home's name-jump
--      matches titles only. (The frozen `home` view's b.* won't expose it —
--      harmless and deliberate; the board page reads the table.)
--
-- The board_cards view is REPLACED to expose locked_at — the select is VERBATIM
-- from 20260830000001_resting_state.sql with `p.locked_at` appended at the END
-- (append-only is what CREATE OR REPLACE allows), and the WITH clause REPEATS
-- `security_invoker = true`: OR REPLACE resets unspecified reloptions, and
-- dropping that option would silently flip the view to definer rights — an RLS
-- regression with the guest door live (the independent check's catch). The proof
-- asserts the option survives.
-- ============================================================================

alter table placement add column locked_at timestamptz;
alter table board add column description text;

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
         p.locked_at
  from placement p
  left join bit b      on b.id  = p.target_bit_id
  left join board tb   on tb.id = p.target_board_id
  left join source s   on s.id  = b.source_id
  where p.left_at is null
    and (b.id  is null or b.state  = 'live')
    and (tb.id is null or tb.state = 'live');
