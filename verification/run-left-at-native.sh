#!/usr/bin/env bash
# Proof for 20260903000005 (left_at on the server clock) + 20260903000006 (drop
# display_size). Applies the FULL migration chain on a throwaway PG17, then attacks both.
# LOCAL ONLY — never the cloud DB.
set -euo pipefail
export PATH="/opt/homebrew/opt/postgresql@17/bin:$PATH"
DB=left_at_scratch
HERE="$(cd "$(dirname "$0")" && pwd)"
ROOT="$(cd "$HERE/.." && pwd)"
pg_isready -q || brew services start postgresql@17
until pg_isready -q; do sleep 1; done
dropdb --if-exists "$DB"; createdb "$DB"
psql -d "$DB" -q -c "create schema if not exists auth;
  create or replace function auth.uid() returns uuid language sql stable
  as \$\$ select '00000000-0000-0000-0000-0000000000aa'::uuid \$\$;"
for f in "$ROOT"/supabase/migrations/*.sql; do
  psql -d "$DB" -q -v ON_ERROR_STOP=1 -f "$f" >/dev/null
done
psql -d "$DB" -f "$HERE/left-at-and-display-size-proof.sql" 2>&1 | tee "$HERE/left-at-and-display-size-proof.out"
dropdb "$DB"
echo "done — output in verification/left-at-and-display-size-proof.out"
