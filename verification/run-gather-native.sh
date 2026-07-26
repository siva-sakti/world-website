#!/bin/bash
# ============================================================================
# run-gather-native.sh — Gather G1 proofs on native Postgres 17 (Gather-Cp-A)
# ============================================================================
# Docker-free, same pattern as run-capture-native.sh. Fresh THROWAWAY database →
# apply the proven init THEN the gather migration → run gather-proofs.sql.
# Constraints, FK cascades and RLS are pure Postgres 17, identical to the
# Supabase runtime. LOCAL ONLY — this never touches the cloud/production database.
#
# One extra stand-in vs the capture runner: the gather migration's RLS policy
# calls auth.uid() (the D-094 owner clause), which Supabase provides but native
# Postgres does not. PHASE 3 creates it as a stand-in — a tiny auth.uid() that
# reads request.jwt.claims — exactly as the anon/authenticated login roles are
# stood in. §6 of the proof sets a JWT sub to play owner vs stranger.
# ============================================================================
set -uo pipefail
cd /Users/gargoodevi/Documents/world-website
export PATH="/opt/homebrew/opt/postgresql@17/bin:$PATH"
DB=gather_proof
INIT=supabase/migrations/20260721000001_init.sql
MIG=supabase/migrations/20260725000002_gather_reference.sql

echo "=== PHASE 1: start the local Postgres server ==="
brew services start postgresql@17 >/dev/null 2>&1 || true
for i in $(seq 1 30); do pg_isready -q 2>/dev/null && break; sleep 1; done
pg_isready || { echo ">>> server not ready"; exit 1; }
echo "postgres up: $(psql -d postgres -qtA -c 'show server_version' 2>/dev/null || echo '?')"

echo "=== PHASE 2: a fresh throwaway database ==="
dropdb --if-exists "$DB" 2>/dev/null || true
createdb "$DB" || { echo ">>> createdb failed"; exit 1; }

echo "=== PHASE 3: the Supabase runtime stand-ins (login roles + auth.uid()) ==="
psql -d "$DB" -v ON_ERROR_STOP=1 -c "do \$\$ begin
  if not exists (select from pg_roles where rolname='anon') then create role anon nologin; end if;
  if not exists (select from pg_roles where rolname='authenticated') then create role authenticated nologin; end if;
end \$\$;
create schema if not exists auth;
create or replace function auth.uid() returns uuid language sql stable as \$fn\$
  select nullif(current_setting('request.jwt.claims', true)::jsonb ->> 'sub', '')::uuid
\$fn\$;
grant usage on schema auth to anon, authenticated;" \
  || { echo ">>> runtime stand-in creation failed"; exit 1; }

echo "=== PHASE 4: apply the proven init, THEN the gather migration ==="
OUT=$(psql -d "$DB" -v ON_ERROR_STOP=1 -f "$INIT" 2>&1) \
  && echo "init applied clean ✓" \
  || { echo ">>> INIT APPLY FAILED:"; echo "$OUT"; exit 1; }
OUT=$(psql -d "$DB" -v ON_ERROR_STOP=1 -f "$MIG" 2>&1) \
  && echo "gather migration applied clean ✓" \
  || { echo ">>> GATHER MIGRATION APPLY FAILED:"; echo "$OUT"; exit 1; }

# mimic Supabase's default grants so §6 tests RLS *filtering* (zero rows), not a
# missing grant (the run-1c-native convention).
psql -d "$DB" -v ON_ERROR_STOP=1 -c "grant usage on schema public to anon, authenticated;
  grant select on all tables in schema public to anon;
  grant all on all tables in schema public to authenticated;" >/dev/null

echo "=== truth-check: the reference table, its indexes, and its owner policy are really there ==="
psql -d "$DB" -qtA -c \
  "select 'reference table = ' || exists(select 1 from information_schema.tables
     where table_schema='public' and table_name='reference');
   select 'reference indexes = ' || count(*) from pg_indexes
     where schemaname='public' and tablename='reference' and indexname in ('reference_from','reference_to');
   select 'rls enabled = ' || relrowsecurity from pg_class where relname='reference';
   select 'owner policy = ' || count(*) from pg_policies
     where schemaname='public' and tablename='reference' and policyname='reference_owner_all';"

echo "=== PHASE 5: gather-proofs.sql — round-trip · constraints · cascade · FK · RLS ==="
psql -d "$DB" -f verification/gather-proofs.sql > verification/gather-proofs.out 2>&1
RC=$?
cat verification/gather-proofs.out
echo ""
if [ "$RC" = "0" ]; then
  echo "=== GATHER G1 PROOFS PASSED ✓ — reference round-trips (directed), constraints refuse, cascade fires both ways, phantom endpoints rejected, owner-scoped RLS holds ==="
  # leave the throwaway db in place for inspection; the next run drops it
else
  echo ">>> GATHER PROOFS FAILED (exit $RC) — see verification/gather-proofs.out"; exit 1
fi
