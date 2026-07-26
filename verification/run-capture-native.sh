#!/bin/bash
# ============================================================================
# run-capture-native.sh — Capture Slice 1 proofs on native Postgres 17 (Cap-A)
# ============================================================================
# Docker-free, same pattern as run-1c-native.sh. Fresh THROWAWAY database →
# apply the proven init THEN the capture migration → run capture-proofs.sql.
# Constraints + views are pure Postgres 17, identical to the Supabase runtime.
# LOCAL ONLY — this never touches the cloud/production database.
# ============================================================================
set -uo pipefail
cd /Users/gargoodevi/Documents/world-website
export PATH="/opt/homebrew/opt/postgresql@17/bin:$PATH"
DB=capture_proof
INIT=supabase/migrations/20260721000001_init.sql
MIG=supabase/migrations/20260725000001_capture_source_and_inbox.sql

echo "=== PHASE 1: start the local Postgres server ==="
brew services start postgresql@17 >/dev/null 2>&1 || true
for i in $(seq 1 30); do pg_isready -q 2>/dev/null && break; sleep 1; done
pg_isready || { echo ">>> server not ready"; exit 1; }
echo "postgres up: $(psql -d postgres -qtA -c 'show server_version' 2>/dev/null || echo '?')"

echo "=== PHASE 2: a fresh throwaway database ==="
dropdb --if-exists "$DB" 2>/dev/null || true
createdb "$DB" || { echo ">>> createdb failed"; exit 1; }

echo "=== PHASE 3: the two Supabase login-role stand-ins (init.sql's policies need them) ==="
psql -d "$DB" -v ON_ERROR_STOP=1 -c "do \$\$ begin
  if not exists (select from pg_roles where rolname='anon') then create role anon nologin; end if;
  if not exists (select from pg_roles where rolname='authenticated') then create role authenticated nologin; end if;
end \$\$;" || { echo ">>> role creation failed"; exit 1; }

echo "=== PHASE 4: apply the proven init, THEN the capture migration ==="
OUT=$(psql -d "$DB" -v ON_ERROR_STOP=1 -f "$INIT" 2>&1) \
  && echo "init applied clean ✓" \
  || { echo ">>> INIT APPLY FAILED:"; echo "$OUT"; exit 1; }
OUT=$(psql -d "$DB" -v ON_ERROR_STOP=1 -f "$MIG" 2>&1) \
  && echo "capture migration applied clean ✓" \
  || { echo ">>> CAPTURE MIGRATION APPLY FAILED:"; echo "$OUT"; exit 1; }

echo "=== truth-check: the tenth view (the_inbox) + the two source columns are really there ==="
psql -d "$DB" -qtA -c \
  "select 'views = ' || count(*) from information_schema.views where table_schema='public';
   select 'the_inbox present = ' || exists(select 1 from information_schema.views
     where table_schema='public' and table_name='the_inbox');
   select 'bit source columns = ' || count(*) from information_schema.columns
     where table_name='bit' and column_name in ('source_url','source_title');"

echo "=== PHASE 5: capture-proofs.sql — source · the flip · the inbox ==="
psql -d "$DB" -f verification/capture-proofs.sql > verification/capture-proofs.out 2>&1
RC=$?
cat verification/capture-proofs.out
echo ""
if [ "$RC" = "0" ]; then
  echo "=== CAPTURE SLICE 1 PROOFS PASSED ✓ — source round-trips, the flip is surgical, the inbox is exactly the loose set ==="
  # leave the throwaway db in place for inspection; the next run drops it
else
  echo ">>> CAPTURE PROOFS FAILED (exit $RC) — see verification/capture-proofs.out"; exit 1
fi
