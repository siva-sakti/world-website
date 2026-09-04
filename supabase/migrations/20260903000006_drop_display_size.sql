-- DROP `placement.display_size` — a column nothing has ever read.
--
-- ⚠⚠ NOT YET APPLIED TO THE CLOUD, AND DELIBERATELY SO (owner call, 2026-09-03).
-- This rebuilds `board_cards`, and the composition migration's step ⑥ ("regenerate
-- views", docs/composition-technical-spec.md) rebuilds the SAME view. Two sessions
-- rewriting one view is how definitions drift apart. **Whoever builds the composition
-- migration: fold this in — while you are rebuilding board_cards anyway, leave
-- display_size out and drop the column + its constraint.** Then this file is already
-- satisfied and needs no separate paste.
--
-- It was added for a "full / small" card presentation that was never built. Today it is
-- written by every insert (via its default), constrained, carried through `board_cards`,
-- copied by duplicate-a-board, and typed in two places in the app — and NO code anywhere
-- reads its value to render or decide anything. Verified 2026-09-03: the only mentions
-- outside the schema are a type alias, two struct fields, and duplicateBoard's select
-- list, all of which move it around without ever asking what it says.
--
-- It is inert, so this is cleanup rather than a fix: an inert column still costs a reader
-- the time to work out that it means nothing, and it still has to be carried correctly by
-- every copy path that touches a placement.
--
-- The view has to be dropped and rebuilt rather than replaced: `create or replace view`
-- cannot REMOVE a column. Everything else about it is unchanged from 20260903000004.

drop view if exists board_cards;

create view board_cards with (security_invoker = true) as
  select p.id as placement_id,
         p.board_id,
         case when p.target_bit_id is not null then 'bit' else 'board' end as thing,
         p.target_bit_id,
         p.target_board_id,
         p.x, p.y, p.width, p.height, p.z,
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

alter table placement drop constraint if exists placement_display_size_allowed;
alter table placement drop column if exists display_size;
