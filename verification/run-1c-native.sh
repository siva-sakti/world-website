#!/bin/bash
# ============================================================================
# run-1c-native.sh — the whole Stage 1c pipeline on NATIVE Postgres 17
# (Docker-free; chosen after Docker Desktop's engine failed to boot, D-084).
# Fidelity for 1c is full: the migration apply, generated columns, constraints,
# cascades, and the FOR SHARE race are pure Postgres 17 — identical to the
# Supabase runtime. The two Supabase login roles are created as stand-ins so
# the RLS wall (C9) is a real test. The actual Supabase environment is re-proven
# at Stage 2b.
# ============================================================================
set -uo pipefail
cd /Users/gargoodevi/Documents/world-website
export PATH="/opt/homebrew/opt/postgresql@17/bin:$PATH"
DB=world_proof
MIG=supabase/migrations/20260721000001_init.sql

echo "=== PHASE 1: start the local Postgres server ==="
brew services start postgresql@17 >/dev/null 2>&1 || true
for i in $(seq 1 30); do pg_isready -q 2>/dev/null && break; sleep 1; done
pg_isready || { echo ">>> server not ready"; exit 1; }
echo "postgres up: $(psql -d postgres -qtA -c 'show server_version' 2>/dev/null || echo '?')"

echo "=== PHASE 2: a fresh throwaway database ==="
dropdb --if-exists "$DB" 2>/dev/null || true
createdb "$DB" || { echo ">>> createdb failed"; exit 1; }

echo "=== PHASE 3: the two Supabase login-role stand-ins ==="
psql -d "$DB" -v ON_ERROR_STOP=1 -c "do \$\$ begin
  if not exists (select from pg_roles where rolname='anon') then create role anon nologin; end if;
  if not exists (select from pg_roles where rolname='authenticated') then create role authenticated nologin; end if;
end \$\$;" || { echo ">>> role creation failed"; exit 1; }

echo "=== PHASE 4: THE BARE APPLY (the generated face/search columns are the named risk) ==="
if psql -d "$DB" -v ON_ERROR_STOP=1 -f "$MIG" > verification/apply.out 2>&1; then
  echo "MIGRATION APPLIED CLEAN ✓"
else
  echo ">>> MIGRATION APPLY FAILED:"; cat verification/apply.out; exit 1
fi

# mimic Supabase's default grants so C9 tests RLS *filtering* (zero rows), not a missing grant
psql -d "$DB" -v ON_ERROR_STOP=1 -c "grant usage on schema public to anon, authenticated;
  grant select on all tables in schema public to anon;
  grant all on all tables in schema public to authenticated;" >/dev/null

echo "=== truth-check: nine tables, the seeds, the views are really there ==="
psql -d "$DB" -qtA -c \
  "select 'base tables = ' || count(*) from information_schema.tables
     where table_schema='public' and table_type='BASE TABLE';
   select 'views = ' || count(*) from information_schema.views where table_schema='public';
   select 'seeded tags = ' || count(*) from tag;
   select 'seeded subtypes = ' || count(*) from subtype_word;"

echo "=== PHASE 5: attacks.sql — every refusal + every assertion ==="
psql -d "$DB" -f verification/attacks.sql > verification/attacks.out 2>&1
ATT=$?
cat verification/attacks.out
[ "$ATT" = "0" ] && echo "ATTACKS PASSED ✓" || { echo ">>> ATTACKS FAILED (exit $ATT)"; exit 1; }

echo "=== PHASE 6: race probe (I-D1, two live sessions) ==="
bash verification/race-probe-native.sh "$DB" > verification/race-probe.out 2>&1
RC=$?
cat verification/race-probe.out
[ "$RC" = "0" ] && echo "RACE PROBE PASSED ✓" || { echo ">>> RACE PROBE FAILED (exit $RC)"; exit 1; }

echo ""
echo "=== 1c COMPLETE — migration applies, every constraint refuses, the race is closed ==="
