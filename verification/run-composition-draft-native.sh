#!/usr/bin/env bash
# Storage-session Gate C: every real migration + the DRAFT schema + the attack
# suite, on a throwaway local PG17. Never the cloud. (run-opening-native.sh pattern.)
set -uo pipefail
export PATH="/opt/homebrew/opt/postgresql@17/bin:$PATH"
DB=composition_draft_proof
HERE="$(cd "$(dirname "$0")" && pwd)"; ROOT="$(dirname "$HERE")"
pg_isready -q || brew services start postgresql@17
until pg_isready -q; do sleep 1; done
dropdb --if-exists "$DB"; createdb "$DB"
psql -q -d "$DB" -c "
  do \$\$ begin
    if not exists (select from pg_roles where rolname='anon') then create role anon nologin; end if;
    if not exists (select from pg_roles where rolname='authenticated') then create role authenticated nologin; end if;
  end \$\$;
  create schema if not exists auth;
"
psql -q -d "$DB" <<'SQL'
create or replace function auth.uid() returns uuid language sql stable as $fn$
  select nullif(current_setting('request.jwt.claims', true)::jsonb ->> 'sub', '')::uuid
$fn$;
SQL
for m in $(ls "$ROOT"/supabase/migrations/*.sql | sort); do
  case "$m" in *storage_policies*) echo "skipped (supabase-storage-only): $m"; continue;; esac
  psql -q -d "$DB" -v ON_ERROR_STOP=1 -f "$m" >/dev/null || { echo "MIGRATION FAILED: $m"; exit 1; }
done
psql -q -d "$DB" -c "grant usage on schema public to anon, authenticated;
  grant select on all tables in schema public to anon;
  grant all on all tables in schema public to authenticated;
  grant all on all sequences in schema public to authenticated;"
psql -q -d "$DB" -v ON_ERROR_STOP=1 -f "$HERE/composition-schema-draft.sql" >/dev/null || { echo "DRAFT DDL FAILED"; exit 1; }
psql -q -d "$DB" -c "grant all on composition, composition_file, reference2 to authenticated;
  grant select on composition_travel to authenticated;
  grant select on composition, composition_file, reference2, composition_travel to anon;"
psql -d "$DB" -f "$HERE/composition-draft-proofs.sql" 2>&1 | tee "$HERE/composition-draft-proofs.out"
dropdb "$DB"
echo "done — verification/composition-draft-proofs.out"
