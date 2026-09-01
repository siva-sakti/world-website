-- ============================================================================
-- APPLY THE ARCHIVE-INVARIANT MIGRATION TO CLOUD (Supabase SQL Editor). One
-- transaction. This is 20260902000002_archived_not_alive.sql verbatim: backfills
-- (un-stars anything archived through the old divergent door — the star was kept
-- by a bug, not a choice), then adds the CHECKs so "nothing is both starred and
-- put away" lives in the schema again. Proven on a throwaway first (existing
-- suite green + 4 refusal/shape checks). Paste ONLY the SQL; expect "no rows".
-- ============================================================================

begin;

update bit   set pinned_at = null where archived_at is not null and pinned_at is not null;
update board set pinned_at = null where archived_at is not null and pinned_at is not null;

alter table bit   add constraint bit_archived_not_alive   check (archived_at is null or pinned_at is null);
alter table board add constraint board_archived_not_alive check (archived_at is null or pinned_at is null);

commit;
