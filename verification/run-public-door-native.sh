#!/bin/bash
# ============================================================================
# run-public-door-native.sh — Public (guest) door proofs on native PG 17 (D-108)
# ============================================================================
# Fresh THROWAWAY database → apply the FULL proven chain (through ownership) →
# apply the public-door migration → run public-door-proofs.sql (fixtures + the
# leak attack, as the anon stand-in). LOCAL ONLY — never the cloud/production DB.
# ============================================================================
set -uo pipefail
cd /Users/gargoodevi/Documents/world-website
export PATH="/opt/homebrew/opt/postgresql@17/bin:$PATH"
DB=publicdoor_proof
CHAIN=(
  supabase/migrations/20260721000001_init.sql
  supabase/migrations/20260723000001_owner_scoped_rls.sql
  supabase/migrations/20260725000001_capture_source_and_inbox.sql
  supabase/migrations/20260725000002_gather_reference.sql
  supabase/migrations/20260726000001_source_first_class.sql
  supabase/migrations/20260728000001_per_row_ownership.sql
)
MIG=supabase/migrations/20260728000002_public_guest_door.sql

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

echo "=== PHASE 4: apply the FULL proven chain + the public-door migration ==="
for f in "${CHAIN[@]}" "$MIG"; do
  OUT=$(psql -d "$DB" -v ON_ERROR_STOP=1 -f "$f" 2>&1) \
    && echo "applied clean ✓  $f" \
    || { echo ">>> APPLY FAILED: $f"; echo "$OUT"; exit 1; }
done

# Supabase's default grants (so the proof tests RLS filtering, not a missing grant).
# The migration itself grants anon SELECT on the 3 guest tables; this covers the rest.
psql -d "$DB" -v ON_ERROR_STOP=1 -c "grant usage on schema public to anon, authenticated;
  grant select on all tables in schema public to anon;
  grant all on all tables in schema public to authenticated;" >/dev/null

echo "=== truth-check: the three guest policies + the definer helpers exist ==="
psql -d "$DB" -qtA -c "
  select 'guest policies = ' || count(*) from pg_policies
    where schemaname='public' and policyname in ('board_guest_read','bit_guest_read','placement_guest_read');
  select 'definer helpers = ' || count(*) from pg_proc p join pg_namespace n on n.oid=p.pronamespace
    where n.nspname='public' and p.proname in ('is_public_board','is_public_bit','bit_on_public_board') and p.prosecdef;
  select 'reference has NO guest policy = ' || (count(*) = 0) from pg_policies
    where schemaname='public' and tablename='reference' and roles::text like '%anon%';"

echo "=== PHASE 5: public-door-proofs.sql — the leak attack suite ==="
psql -d "$DB" -f verification/public-door-proofs.sql > verification/public-door-proofs.out 2>&1
RC=$?
grep -E "NOTICE:|ERROR|PASSED|FAIL|LEAK|exception" verification/public-door-proofs.out | sed 's/^psql.*NOTICE:  //'
echo ""
if [ "$RC" = "0" ]; then
  echo "=== PUBLIC DOOR PROOFS PASSED ✓ — no private/unreachable/unplaced/trashed/departed data reaches a visitor; anon read-only; owner intact ==="
else
  echo ">>> PUBLIC DOOR PROOFS FAILED (exit $RC) — see verification/public-door-proofs.out"; exit 1
fi
