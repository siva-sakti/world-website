#!/bin/bash
# ============================================================================
# run-ownership-native.sh — Per-row ownership proofs on native Postgres 17 (D-107)
# ============================================================================
# Docker-free, same pattern as run-source-native.sh. Fresh THROWAWAY database →
# apply the FULL proven chain in filename order → SEED owner data (pre-migration,
# as superuser) → apply the per-row-ownership migration (adds owner_id, backfills
# the seed, swaps the hardcoded-uid predicate for auth.uid()=owner_id) → run
# ownership-proofs.sql through the anon/authenticated stand-ins. LOCAL ONLY —
# never the cloud/production DB.
# ============================================================================
set -uo pipefail
cd /Users/gargoodevi/Documents/world-website
export PATH="/opt/homebrew/opt/postgresql@17/bin:$PATH"
DB=ownership_proof
CHAIN=(
  supabase/migrations/20260721000001_init.sql
  supabase/migrations/20260723000001_owner_scoped_rls.sql
  supabase/migrations/20260725000001_capture_source_and_inbox.sql
  supabase/migrations/20260725000002_gather_reference.sql
  supabase/migrations/20260726000001_source_first_class.sql
)
MIG=supabase/migrations/20260728000001_per_row_ownership.sql

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

echo "=== PHASE 4a: apply the FULL proven chain in filename order ==="
for f in "${CHAIN[@]}"; do
  OUT=$(psql -d "$DB" -v ON_ERROR_STOP=1 -f "$f" 2>&1) \
    && echo "applied clean ✓  $f" \
    || { echo ">>> APPLY FAILED: $f"; echo "$OUT"; exit 1; }
done

echo "=== PHASE 4b: SEED owner data (as superuser, PRE-ownership-migration) ==="
psql -d "$DB" -v ON_ERROR_STOP=1 -c "
insert into board (id, title) values ('e0000000-0000-0000-0000-000000000001', 'a real board');
insert into bit (id, type, body) values ('e0000000-0000-0000-0000-000000000002', 'text', '<p>a real note</p>');
insert into tag (word) values ('astrology');" \
  && echo "seed inserted ✓ (1 board · 1 bit · 1 tag, all pre-owner_id)" \
  || { echo ">>> SEED FAILED"; exit 1; }

echo "=== PHASE 4c: apply the per-row-ownership migration ==="
OUT=$(psql -d "$DB" -v ON_ERROR_STOP=1 -f "$MIG" 2>&1) \
  && echo "ownership migration applied clean ✓" \
  || { echo ">>> OWNERSHIP MIGRATION APPLY FAILED:"; echo "$OUT"; exit 1; }

# Supabase's default grants, so the proof tests RLS *filtering* (zero rows), not a
# missing grant. Applied after the migration (same convention as run-source).
psql -d "$DB" -v ON_ERROR_STOP=1 -c "grant usage on schema public to anon, authenticated;
  grant select on all tables in schema public to anon;
  grant all on all tables in schema public to authenticated;" >/dev/null

echo "=== truth-check: owner_id exists + is not-null + defaults to auth.uid() on every owned table ==="
psql -d "$DB" -qtA -c "
  select 'owned tables with owner_id = ' || count(*) from information_schema.columns
    where table_schema='public' and column_name='owner_id'
      and table_name in ('category','tag','subtype_word','bit','board','tag_application','placement','connector','dormant','source','reference');
  select 'all not-null = ' || (count(*) = 11) from information_schema.columns
    where table_schema='public' and column_name='owner_id' and is_nullable='NO'
      and table_name in ('category','tag','subtype_word','bit','board','tag_application','placement','connector','dormant','source','reference');
  select 'all default auth.uid() = ' || (count(*) = 11) from information_schema.columns
    where table_schema='public' and column_name='owner_id' and column_default like '%auth.uid()%'
      and table_name in ('category','tag','subtype_word','bit','board','tag_application','placement','connector','dormant','source','reference');
  select 'policies naming a literal uid = ' || count(*) from pg_policies
    where schemaname='public' and (coalesce(qual,'') like '%298fbf29%' or coalesce(with_check,'') like '%298fbf29%');"

echo "=== PHASE 5: ownership-proofs.sql — backfill · de-hardcode · isolation · anon ==="
psql -d "$DB" -f verification/ownership-proofs.sql > verification/ownership-proofs.out 2>&1
RC=$?
grep -E "NOTICE:|ERROR|PASSED|FAIL|exception" verification/ownership-proofs.out | sed 's/^psql.*NOTICE:  //'
echo ""
if [ "$RC" = "0" ]; then
  echo "=== OWNERSHIP PROOFS PASSED ✓ — the hardcoded uid is gone; per-row ownership isolates owner/stranger/anon ==="
else
  echo ">>> OWNERSHIP PROOFS FAILED (exit $RC) — see verification/ownership-proofs.out"; exit 1
fi
