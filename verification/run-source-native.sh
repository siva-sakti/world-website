#!/bin/bash
# ============================================================================
# run-source-native.sh — Source Stage 0 proofs on native Postgres 17 (Source-Cp)
# ============================================================================
# Docker-free, same pattern as run-gather-native.sh. Fresh THROWAWAY database →
# apply the FULL proven migration chain in filename order → SEED the data the new
# migration will convert → apply the new source migration → run source-proofs.sql.
# Constraints, FK cascades, generated columns and RLS are pure Postgres 17,
# identical to the Supabase runtime. LOCAL ONLY — never the cloud/production DB.
#
# The migration chain (723 owner-RLS + 725002 gather + THIS migration's source
# policy) calls auth.uid(), which Supabase provides but native Postgres does not.
# PHASE 3 stands one in — a tiny auth.uid() reading request.jwt.claims — exactly
# as the anon/authenticated login roles are stood in. §7 of the proof sets a JWT
# sub to play owner vs stranger.
# ============================================================================
set -uo pipefail
cd /Users/gargoodevi/Documents/world-website
export PATH="/opt/homebrew/opt/postgresql@17/bin:$PATH"
DB=source_proof
INIT=supabase/migrations/20260721000001_init.sql
RLS=supabase/migrations/20260723000001_owner_scoped_rls.sql
CAP=supabase/migrations/20260725000001_capture_source_and_inbox.sql
GAT=supabase/migrations/20260725000002_gather_reference.sql
MIG=supabase/migrations/20260726000001_source_first_class.sql
OWNER=298fbf29-39c8-4738-96d0-3348f0e59fd0

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

echo "=== PHASE 4a: apply the FULL proven chain in filename order (init → 723 → 725001 → 725002) ==="
for f in "$INIT" "$RLS" "$CAP" "$GAT"; do
  OUT=$(psql -d "$DB" -v ON_ERROR_STOP=1 -f "$f" 2>&1) \
    && echo "applied clean ✓  $f" \
    || { echo ">>> APPLY FAILED: $f"; echo "$OUT"; exit 1; }
done

echo "=== PHASE 4b: SEED the data the new migration will convert ==="
# a BOOKMARK bit (url + captured_title) → must become a text bit + a source
# a CLIP  bit (source_url set, source_title NULL) → must get a url-named source
# a PLAIN text bit (no provenance) → must get NO source
psql -d "$DB" -v ON_ERROR_STOP=1 -c "
insert into bit (id, type, url, captured_title) values
  ('b0000000-0000-0000-0000-000000000001', 'bookmark',
   'https://example.com/article', 'A Good Article');
insert into bit (id, type, body, source_url, source_title) values
  ('c0000000-0000-0000-0000-000000000001', 'text',
   '<blockquote>the near enemy of equanimity is indifference</blockquote>',
   'https://example.com/essay', null);
insert into bit (id, type, body) values
  ('d0000000-0000-0000-0000-000000000001', 'text', '<p>a self-made thought</p>');" \
  && echo "seed inserted ✓ (1 bookmark · 1 null-title clip · 1 self-made bit)" \
  || { echo ">>> SEED FAILED"; exit 1; }

echo "=== PHASE 4c: apply the new source migration ==="
OUT=$(psql -d "$DB" -v ON_ERROR_STOP=1 -f "$MIG" 2>&1) \
  && echo "source migration applied clean ✓" \
  || { echo ">>> SOURCE MIGRATION APPLY FAILED:"; echo "$OUT"; exit 1; }

# mimic Supabase's default grants so §7 tests RLS *filtering* (zero rows), not a
# missing grant (the run-gather-native convention). Applied AFTER the migration
# so the new source table is covered.
psql -d "$DB" -v ON_ERROR_STOP=1 -c "grant usage on schema public to anon, authenticated;
  grant select on all tables in schema public to anon;
  grant all on all tables in schema public to authenticated;" >/dev/null

echo "=== truth-check: the source table, its index/policy, the bit FK, the retired type, and the refreshed views are really there ==="
psql -d "$DB" -qtA -c \
  "select 'source table = '        || exists(select 1 from information_schema.tables where table_schema='public' and table_name='source');
   select 'source_name_ci index = '|| count(*) from pg_indexes where schemaname='public' and tablename='source' and indexname='source_name_ci';
   select 'source rls enabled = '  || relrowsecurity from pg_class where relname='source';
   select 'source owner policy = ' || count(*) from pg_policies where schemaname='public' and tablename='source' and policyname='source_owner_all';
   select 'bit.source_id column = '|| exists(select 1 from information_schema.columns where table_name='bit' and column_name='source_id');
   select 'bit source_url/title dropped = ' || (count(*) = 0) from information_schema.columns where table_name='bit' and column_name in ('source_url','source_title');
   select 'bookmark still allowed = ' || (pg_get_constraintdef(oid) like '%bookmark%') from pg_constraint where conname='bit_type_allowed';
   select 'board_cards exposes source = ' || (count(*) = 2) from information_schema.columns where table_name='board_cards' and column_name in ('source_name','source_url');
   select 'the_ledger exposes source = ' || (count(*) = 2) from information_schema.columns where table_name='the_ledger' and column_name in ('source_name','source_url');
   select 'live bookmark rows = '   || count(*) from bit where type='bookmark';"

echo "=== PHASE 5: source-proofs.sql — conversion · name-fallback · name_ci · FK/set-null · grouping · bookmark-refused · RLS ==="
psql -d "$DB" -f verification/source-proofs.sql > verification/source-proofs.out 2>&1
RC=$?
cat verification/source-proofs.out
echo ""
if [ "$RC" = "0" ]; then
  echo "=== SOURCE STAGE 0 PROOFS PASSED ✓ — zero bookmarks survive · the bookmark converted to a linked note + source · name-fallback clean · name_ci refuses dups · FK set-null on source-delete · grouping exact · type=bookmark refused · owner-scoped RLS holds ==="
  # leave the throwaway db in place for inspection; the next run drops it
else
  echo ">>> SOURCE PROOFS FAILED (exit $RC) — see verification/source-proofs.out"; exit 1
fi
