#!/bin/bash
# ============================================================================
# run-1d-native.sh — Stage 1d faithfulness proofs on native Postgres 17 (D-085)
# Fresh db → apply the proven migration → replay the seven scenes as real rows,
# matching model-scenarios.md line-by-line, + export completeness (I-G1) + the
# Checkpoint-A regression guards (re-place identity, orphan-arrow tripwire).
# ============================================================================
set -uo pipefail
cd /Users/gargoodevi/Documents/world-website
export PATH="/opt/homebrew/opt/postgresql@17/bin:$PATH"
DB=world_proof
MIG=supabase/migrations/20260721000001_init.sql

pg_isready -q 2>/dev/null || brew services start postgresql@17 >/dev/null 2>&1
for i in $(seq 1 30); do pg_isready -q 2>/dev/null && break; sleep 1; done

echo "=== fresh db + apply the proven schema ==="
dropdb --if-exists "$DB" 2>/dev/null || true
createdb "$DB"
psql -d "$DB" -v ON_ERROR_STOP=1 -c "do \$\$ begin
  if not exists (select from pg_roles where rolname='anon') then create role anon nologin; end if;
  if not exists (select from pg_roles where rolname='authenticated') then create role authenticated nologin; end if;
end \$\$;" >/dev/null
psql -d "$DB" -v ON_ERROR_STOP=1 -f "$MIG" >/dev/null || { echo ">>> apply failed"; exit 1; }
echo "schema applied ✓"

echo "=== replay the seven scenes ==="
psql -d "$DB" -f verification/scenarios.sql > verification/scenarios.out 2>&1
RC=$?
grep -E "NOTICE:|ERROR|FAIL" verification/scenarios.out | sed 's/^psql.*NOTICE:  //'
echo ""
[ "$RC" = "0" ] && echo "=== 1d COMPLETE — every scene traces as the doc says ===" \
                || { echo ">>> 1d FAILED (exit $RC) — see verification/scenarios.out"; exit 1; }
