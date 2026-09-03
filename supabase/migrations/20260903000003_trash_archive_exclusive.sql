-- ============================================================================
-- Trash and archive are EXCLUSIVE — the crossfire CHECK (antagonist A1,
-- owner-ruled 2026-09-03: once trashed, archiving refuses).
--
-- The hole: trash clears archived_at in its own patch (one direction guarded),
-- but archive had no symmetric guard and no CHECK forbade both timestamps.
-- Archive-from-a-stale-page after a trash on another device wrote BOTH; the
-- generated `state` said trashed (trash wins), the thing showed nowhere in the
-- archive, and restore-from-trash landed it IN the archive instead of live.
--
-- Repair first (trash wins — the same precedence the app has always applied),
-- then the CHECK. Every legitimate write path already satisfies it: trash sets
-- deleted_at AND clears archived_at in one UPDATE; archive now refuses trashed
-- rows at the app layer too (setResting's .is("deleted_at", null) guard —
-- belt AND suspenders, loud refusal + physical impossibility).
-- ============================================================================

update bit   set archived_at = null where deleted_at is not null and archived_at is not null;
update board set archived_at = null where deleted_at is not null and archived_at is not null;

alter table bit   add constraint bit_trashed_archived_exclusive
  check (deleted_at is null or archived_at is null);
alter table board add constraint board_trashed_archived_exclusive
  check (deleted_at is null or archived_at is null);
