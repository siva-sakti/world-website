-- ============================================================================
-- The archive invariant, restored to the schema (review H1, full-review-fixes-plan).
--
-- "Nothing is both alive-right-now (starred) and put away (archived)" — the ruled
-- invariant whose DB CHECK (`bit_archived_not_alive`) fell out of the migration
-- chain in the resting-state rewrite while the code's comments still cited it, and
-- while one of the two archive doors (the resting-door path) kept the star. The
-- app doors are unified (setResting clears pinned_at on archive, bit AND board);
-- this puts the invariant back where it belongs — the schema (gate 3, lowest layer).
--
-- BACKFILL FIRST: rows archived through the divergent door may be starred today;
-- the CHECK would refuse to exist over them. Nulling their star enacts the ruling
-- retroactively (the star was kept by a bug, not a choice).
-- ============================================================================

update bit   set pinned_at = null where archived_at is not null and pinned_at is not null;
update board set pinned_at = null where archived_at is not null and pinned_at is not null;

alter table bit   add constraint bit_archived_not_alive   check (archived_at is null or pinned_at is null);
alter table board add constraint board_archived_not_alive check (archived_at is null or pinned_at is null);
