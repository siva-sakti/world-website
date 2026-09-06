#!/usr/bin/env bash
# Prove the born-private migration on a throwaway built from the FULL stack minus itself.
set -euo pipefail
HERE="$(cd "$(dirname "$0")" && pwd)"; ROOT="$(dirname "$HERE")"; cd "$ROOT"
DB="born_private_proof_$$"
createdb "$DB"; trap 'dropdb "$DB"' EXIT
psql -q -d "$DB" -c "do \$\$ begin
  if not exists (select from pg_roles where rolname='anon') then create role anon nologin; end if;
  if not exists (select from pg_roles where rolname='authenticated') then create role authenticated nologin; end if;
end \$\$;"
psql -q -d "$DB" -c 'create schema if not exists auth;'
psql -q -d "$DB" -c "create or replace function auth.uid() returns uuid language sql stable as \$fn\$ select nullif(current_setting('request.jwt.claim.sub', true), '')::uuid \$fn\$;"
for f in supabase/migrations/*.sql; do
  [ "$(basename "$f")" = "20260906000001_born_private.sql" ] && continue
  psql -q -v ON_ERROR_STOP=1 -d "$DB" -f "$f" > /dev/null
done
psql -v ON_ERROR_STOP=0 -d "$DB" -f "$HERE/born-private-attacks.sql" 2>&1 | tee "$HERE/born-private-attacks.out"
