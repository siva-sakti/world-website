#!/bin/bash
# ============================================================================
# run-opening-native.sh — the `opening` migration's proofs on native Postgres 17
# ============================================================================
# A fresh THROWAWAY db → the Supabase runtime stand-ins → EVERY migration in
# filename order (so 20260903000001_opening.sql lands on the real current schema)
# → opening-proofs.sql. LOCAL ONLY — never the cloud/production DB.
#
# Proofs 3/4/5 are regression tests for the two FATAL, SILENT defects the
# antagonist caught in the plan: a partial unique index (which PostgREST's
# ON CONFLICT can never infer) and an omitted opened_at (which freezes the trail
# in first-visit order forever). Re-run after any change to the opening table.
# ============================================================================
set -uo pipefail
export PATH="/opt/homebrew/opt/postgresql@17/bin:$PATH"
W=$(cd "$(dirname "$0")/.." && pwd)
DB=proof_opening

brew services start postgresql@17 >/dev/null 2>&1 || true
for i in $(seq 1 30); do pg_isready -q 2>/dev/null && break; sleep 1; done
pg_isready || { echo ">>> server not ready"; exit 1; }
echo "postgres up: $(psql -d postgres -qtA -c 'show server_version' 2>/dev/null || echo '?')"

echo "=== a fresh throwaway database ==="
dropdb --if-exists "$DB" 2>/dev/null; createdb "$DB" || { echo ">>> createdb failed"; exit 1; }

echo "=== the Supabase runtime stand-ins (login roles + auth.uid()) ==="
psql -d "$DB" -q -v ON_ERROR_STOP=1 <<'PRE' || { echo ">>> stand-ins failed"; exit 1; }
do $$ begin
  if not exists (select from pg_roles where rolname='anon') then create role anon nologin; end if;
  if not exists (select from pg_roles where rolname='authenticated') then create role authenticated nologin; end if;
end $$;
create schema if not exists auth;
-- reads the JWT like the real thing, so proof 10 exercises RLS for real
create or replace function auth.uid() returns uuid language sql stable as $fn$
  select nullif(current_setting('request.jwt.claims', true)::jsonb ->> 'sub', '')::uuid
$fn$;
grant usage on schema auth to anon, authenticated;
PRE

echo "=== apply every migration in filename order ==="
for m in $(ls "$W"/supabase/migrations/*.sql | sort); do
  if ! psql -d "$DB" -q -v ON_ERROR_STOP=1 -f "$m" >/dev/null 2>/tmp/opening_apply.txt; then
    echo ">>> APPLY FAIL $(basename "$m")"; tail -5 /tmp/opening_apply.txt; exit 1
  fi
done
echo "all $(ls "$W"/supabase/migrations/*.sql | wc -l | tr -d ' ') migrations applied clean OK (incl. 20260903000001_opening.sql)"

# Supabase's default grants, so the proofs test RLS FILTERING, not a missing grant.
psql -d "$DB" -v ON_ERROR_STOP=1 -c "grant usage on schema public to anon, authenticated;
  grant select on all tables in schema public to anon;
  grant all on all tables in schema public to authenticated;" >/dev/null

echo "=== the behavior proofs ==="
psql -d "$DB" -f "$W/verification/opening-proofs.sql" 2>&1 | tee "$W/verification/opening-proofs.out"
grep -q "ALL OPENING PROOFS PASSED" "$W/verification/opening-proofs.out" \
  && echo "=== ✅ GREEN ===" \
  || { echo "=== ❌ NOT GREEN — read verification/opening-proofs.out ==="; dropdb --if-exists "$DB"; exit 1; }

dropdb --if-exists "$DB" 2>/dev/null
echo "done."
