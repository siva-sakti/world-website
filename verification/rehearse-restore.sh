#!/usr/bin/env bash
# Rehearse a RESTORE from a real backup (item 0, D-149) — the recovery path,
# exercised for the first time. Usage: verification/rehearse-restore.sh <dump-file>
# Accepts plain SQL (.sql, Supabase dashboard default) or custom format (pg_restore).
# Creates a throwaway DB, restores into it, prints per-table row counts.
# The throwaway is KEPT so you can look around; the drop command is printed.
set -euo pipefail
DUMP="${1:?usage: rehearse-restore.sh <dump-file>}"
[ -f "$DUMP" ] || { echo "no such file: $DUMP"; exit 1; }
DB="restore_rehearsal_$(date +%s)"
createdb "$DB"
# The Supabase shape a vanilla Postgres lacks (found by the first real rehearsal,
# 2026-09-06: every table's owner_id defaults to auth.uid(); without this shim the
# whole restore cascades — 159 errors from one missing schema).
psql -q -d "$DB" -c "do \$\$ begin
  if not exists (select from pg_roles where rolname='anon') then create role anon nologin; end if;
  if not exists (select from pg_roles where rolname='authenticated') then create role authenticated nologin; end if;
end \$\$;"
psql -q -d "$DB" -c 'create schema if not exists auth;'
psql -q -d "$DB" -c "create or replace function auth.uid() returns uuid language sql stable as \$fn\$ select nullif(current_setting('request.jwt.claim.sub', true), '')::uuid \$fn\$;"
echo "-- restoring '$DUMP' into throwaway '$DB'..."
case "$DUMP" in
  *.sql) psql -v ON_ERROR_STOP=0 -q -d "$DB" -f "$DUMP" > /dev/null 2>"$DB.err" || true ;;
  *)     pg_restore -d "$DB" --no-owner --no-privileges "$DUMP" 2>"$DB.err" || true ;;
esac
ERRS=$(grep -c 'ERROR' "$DB.err" 2>/dev/null || true)
echo "-- restore errors logged: ${ERRS:-0} (see $DB.err; Supabase dumps normally error on missing roles/extensions — data errors are the ones that matter)"
echo "-- per-table row counts in the restored copy:"
psql -d "$DB" -Atc "
  select relname || ': ' || n_live_tup
  from pg_stat_user_tables order by relname;"
echo
echo "-- REHEARSAL DONE. Inspect: psql -d $DB   ·   discard: dropdb $DB && rm $DB.err"
