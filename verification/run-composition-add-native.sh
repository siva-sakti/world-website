#!/usr/bin/env bash
# Stage ①a rehearsal: every real migration + the ①a file, with (1) the deliberate-
# failure probe proving all-or-nothing (F6) and (2) the untouched-old-world
# assertions, then the full attack suite. Throwaway local PG17 — never cloud.
set -uo pipefail
export PATH="/opt/homebrew/opt/postgresql@17/bin:$PATH"
DB=composition_add_proof
HERE="$(cd "$(dirname "$0")" && pwd)"; ROOT="$(dirname "$HERE")"
pg_isready -q || brew services start postgresql@17
until pg_isready -q; do sleep 1; done
dropdb --if-exists "$DB"; createdb "$DB"
psql -q -d "$DB" -c "
  do \$\$ begin
    if not exists (select from pg_roles where rolname='anon') then create role anon nologin; end if;
    if not exists (select from pg_roles where rolname='authenticated') then create role authenticated nologin; end if;
  end \$\$;
  create schema if not exists auth;"
psql -q -d "$DB" <<'SQL'
create or replace function auth.uid() returns uuid language sql stable as $fn$
  select nullif(current_setting('request.jwt.claims', true)::jsonb ->> 'sub', '')::uuid
$fn$;
SQL
for m in $(ls "$ROOT"/supabase/migrations/*.sql | sort); do
  case "$m" in *storage_policies*) continue;; esac
  psql -q -d "$DB" -v ON_ERROR_STOP=1 -f "$m" >/dev/null || { echo "MIGRATION FAILED: $m"; exit 1; }
done
psql -q -d "$DB" -c "grant usage on schema public to anon, authenticated;
  grant select on all tables in schema public to anon;
  grant all on all tables in schema public to authenticated;
  grant all on all sequences in schema public to authenticated;"

echo "=== PROBE 1 · deliberate failure: a broken copy must leave ZERO new objects (F6) ==="
sed 's/^commit;$/deliberately_broken_statement;\ncommit;/' "$HERE/composition-add.sql" > /tmp/composition-add-broken.sql
psql -d "$DB" -v ON_ERROR_STOP=1 -f /tmp/composition-add-broken.sql >/dev/null 2>&1
psql -d "$DB" -t -c "select 'rollback_left_nothing: ' || (not exists (select 1 from information_schema.tables where table_name in ('composition','composition_file','reference2')));"

echo "=== apply the REAL ①a file ==="
psql -q -d "$DB" -v ON_ERROR_STOP=1 -f "$HERE/composition-add.sql" || { echo "①a FAILED"; exit 1; }
psql -q -d "$DB" -c "grant all on composition, composition_file, reference2 to authenticated;
  grant select on composition, composition_file, reference2, composition_travel to authenticated, anon;"

echo "=== PROBE 2 · the old world is UNTOUCHED (the ①a promise) ==="
psql -d "$DB" -t <<'SQL'
select 'bit.kind still exists:        ' || exists (select 1 from information_schema.columns where table_name='bit' and column_name='kind');
select 'old reference table intact:   ' || exists (select 1 from information_schema.columns where table_name='reference' and column_name='from_bit_id');
select 'the_inbox still exists:       ' || exists (select 1 from information_schema.views where table_name='the_inbox');
select 'the_ledger still exists:      ' || exists (select 1 from information_schema.views where table_name='the_ledger');
select 'new tables all present:       ' || (select count(*)=3 from information_schema.tables where table_name in ('composition','composition_file','reference2'));
SQL

echo "=== the full attack suite against the ①a schema ==="
psql -d "$DB" -f "$HERE/composition-draft-proofs.sql" 2>&1 | tee "$HERE/composition-add-proofs.out" | grep -cE "^ t($| )" | xargs echo "true assertions:"
grep -E "^ f($| )" "$HERE/composition-add-proofs.out" && echo "⚠ FALSE ASSERTIONS ABOVE" || echo "zero false assertions"
dropdb "$DB"
echo "done — verification/composition-add-proofs.out"
