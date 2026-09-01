-- ============================================================================
-- archived-not-alive-attacks.sql — the restored archive invariant's proof (H1).
-- Run against a database with ALL migrations through 20260902000002. One
-- transaction, rolled back.
-- ============================================================================

\set ON_ERROR_STOP on
begin;

do $$
begin
  -- AN-A1 · a starred bit cannot be archived-with-star (the divergent-door shape)
  begin
    insert into bit (type, body, pinned_at, archived_at) values
      ('text', '<p>x</p>', now(), now());
    raise exception 'NOT REFUSED: AN-A1 starred+archived bit';
  exception when check_violation then raise notice 'REFUSED OK AN-A1 a bit cannot be starred AND archived'; end;

  -- AN-A2 · same for a board
  begin
    insert into board (title, pinned_at, archived_at) values ('x', now(), now());
    raise exception 'NOT REFUSED: AN-A2 starred+archived board';
  exception when check_violation then raise notice 'REFUSED OK AN-A2 a board cannot be starred AND archived'; end;

  -- AN-C1 · the legal shapes all pass: starred+live · archived+unstarred · trashed+starred
  insert into bit (type, body, pinned_at) values ('text', '<p>a</p>', now());
  insert into bit (type, body, archived_at) values ('text', '<p>b</p>', now());
  insert into bit (type, body, pinned_at, deleted_at) values ('text', '<p>c</p>', now(), now());
  raise notice 'OK AN-C1 starred-live · archived-unstarred · trashed-starred all legal';

  -- AN-C2 · archiving via an UPDATE that keeps the star is refused too
  begin
    update bit set archived_at = now() where pinned_at is not null and deleted_at is null;
    raise exception 'NOT REFUSED: AN-C2 archive-keeping-star update';
  exception when check_violation then raise notice 'REFUSED OK AN-C2 the divergent-door UPDATE shape is refused'; end;
end $$;

rollback;
\echo 'archived-not-alive: ALL PROOFS PASSED (rolled back — database untouched)'
