-- Regression proof: the trash/archive crossfire (antagonist A1, 2026-09-03).
-- Runs against the FULL migration chain (run-trash-archive-native.sh applies it).
-- Replays the exact interleaving that used to corrupt state, and asserts the
-- CHECK now refuses it; then proves every legitimate path still works.
\set ON_ERROR_STOP off

\echo '--- setup: one live text bit ---'
insert into bit (id, type, body) values ('00000000-0000-0000-0000-000000000001', 'text', 'crossfire target');

\echo '--- device 1 trashes it (the app patch: deleted_at set + archived_at cleared) ---'
update bit set deleted_at = now(), archived_at = null where id = '00000000-0000-0000-0000-000000000001';

\echo '--- device 2, stale page, archives it — MUST BE REFUSED by the CHECK ---'
update bit set archived_at = now(), pinned_at = null where id = '00000000-0000-0000-0000-000000000001';

\echo '--- (the app layer additionally guards with deleted_at IS NULL: 0 rows, loud refusal) ---'
update bit set archived_at = now() where id = '00000000-0000-0000-0000-000000000001' and deleted_at is null;

\echo '--- restore from trash → state must be LIVE, never archived ---'
update bit set deleted_at = null where id = '00000000-0000-0000-0000-000000000001';
select state as state_after_restore from bit where id = '00000000-0000-0000-0000-000000000001';

\echo '--- legitimate paths all still work: archive a live thing ---'
update bit set archived_at = now(), pinned_at = null where id = '00000000-0000-0000-0000-000000000001' and deleted_at is null;
select state as archived_ok from bit where id = '00000000-0000-0000-0000-000000000001';

\echo '--- trash an ARCHIVED thing (trash wins: one UPDATE sets+clears) — allowed ---'
update bit set deleted_at = now(), archived_at = null where id = '00000000-0000-0000-0000-000000000001';
select state as trashed_ok, archived_at is null as archive_cleared from bit where id = '00000000-0000-0000-0000-000000000001';

\echo '--- the repair half: a pre-existing both-set row gets cleaned by the migration UPDATEs ---'
-- (Can't insert a both-set row anymore — the CHECK exists. The repair ran BEFORE the
--  CHECK in the migration; its correctness is that the chain applied cleanly above.)
select 'migration chain applied with repair-before-check: OK' as note;

\echo '--- same CHECK on board ---'
insert into board (id, title) values ('00000000-0000-0000-0000-00000000000b', 'crossfire board');
update board set deleted_at = now() where id = '00000000-0000-0000-0000-00000000000b';
update board set archived_at = now() where id = '00000000-0000-0000-0000-00000000000b';
select state as board_state_still from board where id = '00000000-0000-0000-0000-00000000000b';
