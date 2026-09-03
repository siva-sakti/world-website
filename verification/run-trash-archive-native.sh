#!/usr/bin/env bash
# Regression: the trash/archive crossfire (A1). Applies the FULL migration chain
# in filename order on a throwaway PG17, then replays the interleaving.
# LOCAL ONLY — never the cloud DB.
set -euo pipefail
export PATH="/opt/homebrew/opt/postgresql@17/bin:$PATH"
DB=crossfire_scratch
HERE="$(cd "$(dirname "$0")" && pwd)"
ROOT="$(cd "$HERE/.." && pwd)"
pg_isready -q || brew services start postgresql@17
until pg_isready -q; do sleep 1; done
dropdb --if-exists "$DB"; createdb "$DB"
# auth.uid() shim: the real chain references it in defaults/policies; a throwaway
# has no GoTrue, so provide a stable stand-in (the antagonist-review pattern).
psql -d "$DB" -q -c "create schema if not exists auth;
  create or replace function auth.uid() returns uuid language sql stable
  as \$\$ select '00000000-0000-0000-0000-0000000000aa'::uuid \$\$;"
for f in "$ROOT"/supabase/migrations/*.sql; do
  psql -d "$DB" -q -v ON_ERROR_STOP=1 -f "$f" >/dev/null
done
psql -d "$DB" -f "$HERE/trash-archive-crossfire.sql" 2>&1 | tee "$HERE/trash-archive-crossfire.out"
dropdb "$DB"
echo "done — output in verification/trash-archive-crossfire.out"
