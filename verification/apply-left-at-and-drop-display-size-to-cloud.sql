-- ============================================================================
-- APPLY TO THE CLOUD — paste into Supabase → SQL Editor → Run.
--
-- ⚠ ORDER MATTERS FOR PART 2. Deploy the app FIRST, then run this.
--    Part 2 removes `display_size` from the `board_cards` view. The app version
--    currently live still ASKS for that column when you duplicate a board, so
--    running this before deploying would break duplicate-a-board until the
--    deploy lands. The other way round is safe: the new app never asks for it,
--    and an unused column sitting there harms nothing.
--
--    Part 1 (left_at) is safe in EITHER order — no app change goes with it.
--
-- All-or-nothing: everything is inside one transaction, so any error rolls the
-- whole thing back and the database is exactly as it was.
--
-- Proven first on a throwaway Postgres through the full migration chain:
--   verification/run-left-at-native.sh → left-at-and-display-size-proof.out
-- ============================================================================
begin;

-- ---------------------------------------------------------------- PART 1 ----
-- S6b — a card cannot leave a board before it arrived.
-- (full reasoning: supabase/migrations/20260903000005_left_at_server_clock.sql)

update placement
   set left_at = arrived_at
 where left_at is not null
   and left_at < arrived_at;

create or replace function placement_left_at_server_clock() returns trigger
language plpgsql as $$
begin
  if new.left_at is not null
     and (old.left_at is null or new.left_at is distinct from old.left_at) then
    new.left_at := now();
  end if;
  return new;
end $$;

drop trigger if exists placement_left_at_server_clock on placement;
create trigger placement_left_at_server_clock
  before update on placement
  for each row execute function placement_left_at_server_clock();

alter table placement drop constraint if exists placement_left_after_arrived;
alter table placement
  add constraint placement_left_after_arrived
  check (left_at is null or left_at >= arrived_at);

-- ---------------------------------------------------------------- PART 2 ----
-- Drop `placement.display_size` — a column nothing has ever read.
-- ⚠ Requires the new app to be deployed first (see the header).
-- (full reasoning: supabase/migrations/20260903000006_drop_display_size.sql)

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

-- ---- a last look before it sticks -------------------------------------------
-- These print BEFORE the commit. If anything looks wrong, run `rollback;`
-- instead of letting it finish.
select count(*) as rows_that_still_leave_before_arriving
  from placement where left_at is not null and left_at < arrived_at;   -- expect 0
select count(*) as live_cards_still_rendering from board_cards;         -- expect > 0

commit;
