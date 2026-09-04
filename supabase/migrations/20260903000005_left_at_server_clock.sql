-- S6b — A CARD CANNOT LEAVE A BOARD BEFORE IT ARRIVED.
--
-- `arrived_at` has always been stamped by the SERVER (`default now()`). `left_at` was
-- stamped by the BROWSER (`new Date().toISOString()` in unplaceBit), so the two ends of
-- one row's life were measured by two different clocks. A device a few minutes behind —
-- a laptop back from sleep, a phone that hasn't resynced — could place a bit, remove it,
-- and write a departure EARLIER than the arrival. The timeline would then draw a leg of
-- negative length, and "how long did this sit here" would answer with a negative number.
--
-- Fixed at the lowest layer that can hold it (the house rule): a trigger, so no app code
-- can get it wrong, and a CHECK so the bad row is not merely unlikely but impossible.

-- 1. Repair any row that already got it wrong. left_at is a "when did this leave"
--    record, not something the owner typed, so clamping to the arrival is the honest
--    repair: it says "it left at the earliest moment it could have."
update placement
   set left_at = arrived_at
 where left_at is not null
   and left_at < arrived_at;

-- 2. The stamp comes from the server, always. Fires only when a departure is NEWLY set
--    or actually changed, so re-saving a departed row's position never re-stamps it, and
--    a revive (left_at → null, the call-in path) is untouched.
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

-- 3. And the state itself is forbidden, trigger or no trigger.
alter table placement drop constraint if exists placement_left_after_arrived;
alter table placement
  add constraint placement_left_after_arrived
  check (left_at is null or left_at >= arrived_at);
