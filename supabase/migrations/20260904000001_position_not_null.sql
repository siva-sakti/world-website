-- A POSITION IS ALWAYS A WHOLE POINT — owner-ruled 2026-09-04 (foundations pass §6.1).
--
-- ⚠ NOT YET APPLIED TO THE CLOUD. Held with 20260903000005/006 for the same batch; safe
--   standalone at any time (additive constraint, no view touched).
--
-- The original schema allowed a placement with BOTH coordinates null ("collection mode",
-- §2c of the old model — never built). Nothing in the app has ever written one; every create
-- path passes both. But the database permitted it, and the board rendered such a card at
-- (40, 40) — so if a migration or a future feature ever produced one, every positionless card
-- would silently stack in one corner. The owner: "I don't think the database should be
-- allowing that." Now it doesn't.
--
-- Rows are repaired first, or the constraint could not be added. There should be none; the
-- count is printed so that claim is checked, not assumed.

select count(*) as positionless_rows_repaired from placement where x is null or y is null;
update placement set x = coalesce(x, 40), y = coalesce(y, 40) where x is null or y is null;

alter table placement alter column x set not null;
alter table placement alter column y set not null;

-- The both-or-neither CHECK is now redundant (neither can be null) — dropped so the schema
-- says one thing, not two.
alter table placement drop constraint if exists placement_position_whole;
