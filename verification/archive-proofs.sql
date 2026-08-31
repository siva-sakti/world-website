-- ============================================================================
-- ARCHIVE PROOFS (N5, migration 20260828000001_archive.sql)
--
-- The three states must be real at the DATABASE, not just in the app: live ·
-- archived · trashed, a thing in exactly one, trash outranking archive. Each
-- assertion below either prints PASS or raises — a silent run is a failed run.
--
-- Run against a throwaway (never the cloud):
--   dropdb --if-exists archive_proof && createdb archive_proof
--   psql -d archive_proof -f <auth stub> && for m in supabase/migrations/*.sql
--   psql -d archive_proof -v ON_ERROR_STOP=1 -f verification/archive-proofs.sql
-- ============================================================================

\set ON_ERROR_STOP on
begin;

create temp table t (id uuid);

-- ---------------------------------------------------------------------------
do $$
declare v uuid;
begin
  insert into bit (type, body) values ('text', 'a note') returning id into v;
  insert into t values (v);
  if (select archived_at from bit where id = v) is not null then
    raise exception 'FAIL 1: a new bit was born archived';
  end if;
  raise notice 'PASS 1 — a bit is born NOT archived (archived_at defaults null)';
end $$;

-- ---------------------------------------------------------------------------
do $$
declare v uuid := (select id from t limit 1);
begin
  update bit set archived_at = now() where id = v;
  if (select archived_at from bit where id = v) is null then
    raise exception 'FAIL 2: archiving did not stick';
  end if;
  if (select deleted_at from bit where id = v) is not null then
    raise exception 'FAIL 2: archiving trashed it — archive is NOT trash';
  end if;
  raise notice 'PASS 2 — archiving sets archived_at and does NOT trash the row';
end $$;

-- ---------------------------------------------------------------------------
-- THE INVARIANT: nothing is both "alive right now" (starred) and put away.
do $$
declare v uuid := (select id from t limit 1); ok boolean := false;
begin
  begin
    update bit set pinned_at = now() where id = v; -- still archived
  exception when check_violation then ok := true;
  end;
  if not ok then
    raise exception 'FAIL 3: a bit was allowed to be starred AND archived';
  end if;
  raise notice 'PASS 3 — starring an archived bit is REFUSED (bit_archived_not_alive)';
end $$;

-- ---------------------------------------------------------------------------
do $$
declare v uuid := (select id from t limit 1); ok boolean := false;
begin
  update bit set archived_at = null, pinned_at = now() where id = v; -- now alive
  begin
    update bit set archived_at = now() where id = v; -- archive while starred
  exception when check_violation then ok := true;
  end;
  if not ok then
    raise exception 'FAIL 4: a starred bit was allowed to be archived';
  end if;
  raise notice 'PASS 4 — archiving a starred bit is REFUSED (the app must clear the star)';
end $$;

-- ---------------------------------------------------------------------------
do $$
declare v uuid := (select id from t limit 1);
begin
  update bit set pinned_at = null, archived_at = now() where id = v; -- one statement
  if (select archived_at from bit where id = v) is null
     or (select pinned_at from bit where id = v) is not null then
    raise exception 'FAIL 5: the clear-star-and-archive statement did not land';
  end if;
  raise notice 'PASS 5 — clearing the star AND archiving in ONE statement is allowed';
end $$;

-- ---------------------------------------------------------------------------
-- TRASH OUTRANKS ARCHIVE, and restoring undoes the trashing only.
do $$
declare v uuid := (select id from t limit 1); a timestamptz;
begin
  a := (select archived_at from bit where id = v);
  update bit set deleted_at = now() where id = v;       -- trash it while archived
  if (select archived_at from bit where id = v) is null then
    raise exception 'FAIL 6: trashing silently un-archived it';
  end if;
  update bit set deleted_at = null where id = v;        -- restore
  if (select archived_at from bit where id = v) is distinct from a then
    raise exception 'FAIL 6: restoring changed the archived state';
  end if;
  raise notice 'PASS 6 — archived survives a trash/restore round-trip unchanged';
end $$;

-- ---------------------------------------------------------------------------
-- An archived row is a LIVE row, so find still reaches it (the I-T1 floor).
do $$
declare v uuid := (select id from t limit 1);
begin
  if not exists (select 1 from bit where id = v and deleted_at is null) then
    raise exception 'FAIL 7: an archived bit is not a live row';
  end if;
  raise notice 'PASS 7 — an archived bit stays LIVE, so find still reaches it';
end $$;

-- ---------------------------------------------------------------------------
do $$
begin
  if not exists (
    select 1 from pg_indexes
    where tablename = 'bit' and indexname = 'bit_archived'
  ) then
    raise exception 'FAIL 8: the partial archive index is missing';
  end if;
  raise notice 'PASS 8 — the partial index bit_archived exists';
end $$;

rollback; -- proofs leave nothing behind
