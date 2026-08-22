#!/bin/bash
# ============================================================================
# run-shelf-native.sh — the shelf migration's proofs on native Postgres 17 (O1)
# ============================================================================
# Same pattern as run-ownership-native.sh: fresh THROWAWAY db → auth stand-ins →
# the FULL proven chain in filename order → the shelf migration → grants →
# shelf-proofs.sql. LOCAL ONLY — never the cloud/production DB.
# NOTE: repo-root–relative (cd "$(dirname)/.."), so it runs from any checkout —
# including the GitHub working copy used when macOS locks the Documents folder.
# ============================================================================
set -uo pipefail
cd "$(dirname "$0")/.."
export PATH="/opt/homebrew/opt/postgresql@17/bin:$PATH"
DB=shelf_proof
CHAIN=(
  supabase/migrations/20260721000001_init.sql
  supabase/migrations/20260723000001_owner_scoped_rls.sql
  supabase/migrations/20260725000001_capture_source_and_inbox.sql
  supabase/migrations/20260725000002_gather_reference.sql
  supabase/migrations/20260726000001_source_first_class.sql
  supabase/migrations/20260728000001_per_row_ownership.sql
  supabase/migrations/20260728000002_public_guest_door.sql
)
MIG=supabase/migrations/20260822000001_shelf.sql

echo "=== PHASE 1: start the local Postgres server ==="
brew services start postgresql@17 >/dev/null 2>&1 || true
for i in $(seq 1 30); do pg_isready -q 2>/dev/null && break; sleep 1; done
pg_isready || { echo ">>> server not ready"; exit 1; }

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

echo "=== PHASE 4: apply the FULL proven chain, then the shelf migration ==="
for f in "${CHAIN[@]}" "$MIG"; do
  OUT=$(psql -d "$DB" -v ON_ERROR_STOP=1 -f "$f" 2>&1) \
    && echo "applied clean ✓  $f" \
    || { echo ">>> APPLY FAILED: $f"; echo "$OUT"; exit 1; }
done

# Supabase's default grants, so the proofs test RLS FILTERING (zero rows), not a
# missing grant (same convention as the other runners).
psql -d "$DB" -v ON_ERROR_STOP=1 -c "grant usage on schema public to anon, authenticated;
  grant select on all tables in schema public to anon;
  grant all on all tables in schema public to authenticated;" >/dev/null

echo "=== PHASE 5: the behavior proofs ==="
psql -d "$DB" -v ON_ERROR_STOP=1 -f verification/shelf-proofs.sql 2>&1 | tee verification/shelf-proofs.out \
  | grep -E "PROOF|FAIL|PASSED|ERROR" || true
grep -q "ALL SHELF PROOFS PASSED" verification/shelf-proofs.out \
  && echo "=== ✅ GREEN ===" \
  || { echo "=== ❌ NOT GREEN — read verification/shelf-proofs.out ==="; exit 1; }

echo "=== PHASE 6: throwaway teardown ==="
dropdb "$DB" 2>/dev/null || true
echo "done."
