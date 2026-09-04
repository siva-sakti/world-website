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

echo "=== PROBE 3 · the old world BEHAVES (antagonist F3a — reads and writes, not existence) ==="
psql -d "$DB" -t <<'SQL'
select set_config('request.jwt.claims', '{"sub":"11111111-1111-1111-1111-111111111111","role":"authenticated"}', false) \g /dev/null
set role authenticated;
insert into bit (id, type, body) values ('beefbeef-0000-0000-0000-000000000001','text','<p>old world</p>');
insert into bit (id, type, body, kind) values ('beefbeef-0000-0000-0000-000000000002','text','<p>a note</p>','note');
insert into reference (from_bit_id, to_bit_id) values ('beefbeef-0000-0000-0000-000000000002','beefbeef-0000-0000-0000-000000000001');
select 'old-style reference write works:  ' || (count(*)=1) from reference where from_bit_id='beefbeef-0000-0000-0000-000000000002';
select 'the_inbox still serves reads:     ' || (count(*)>=1) from the_inbox where id='beefbeef-0000-0000-0000-000000000001';
select 'the_ledger still serves reads:    ' || (count(*)>=2) from the_ledger;
insert into board (id, title) values ('beefbeef-0000-0000-0000-00000000000b','old board');
insert into placement (board_id, target_bit_id, x, y) values ('beefbeef-0000-0000-0000-00000000000b','beefbeef-0000-0000-0000-000000000001',1,1);
select 'board_cards still serves reads:   ' || (count(*)=1) from board_cards where board_id='beefbeef-0000-0000-0000-00000000000b';
reset role;
SQL

echo "=== the full attack suite against the ①a schema ==="
psql -d "$DB" -f "$HERE/composition-draft-proofs.sql" > "$HERE/composition-add-proofs.out" 2>&1
T=$(grep -cE "^ t($| )" "$HERE/composition-add-proofs.out")
E=$(grep -c "^psql:.*ERROR" "$HERE/composition-add-proofs.out")
echo "true assertions: $T (want 15) · refusals fired: $E (want 8)"
[ "$T" = "15" ] || { echo "⚠ TRUE-COUNT WRONG"; exit 1; }
[ "$E" = "8" ]  || { echo "⚠ REFUSAL-COUNT WRONG (antagonist F3c: a lost CHECK would land silently)"; exit 1; }
grep -E " f( |$)" "$HERE/composition-add-proofs.out" | grep -vE "^\s*$" && { echo "⚠ FALSE VALUE SOMEWHERE IN A ROW (F3b: any-column check)"; exit 1; } || echo "no false value in any result column"
if [ -f "$HERE/composition-add-proofs.golden.out" ]; then
  diff -q "$HERE/composition-add-proofs.out" "$HERE/composition-add-proofs.golden.out" >/dev/null && echo "matches the committed golden output" || { echo "⚠ DIFFERS FROM GOLDEN — investigate before trusting"; diff "$HERE/composition-add-proofs.out" "$HERE/composition-add-proofs.golden.out" | head -20; exit 1; }
fi
dropdb "$DB"
echo "done — verification/composition-add-proofs.out"
