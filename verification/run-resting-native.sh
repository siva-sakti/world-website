#!/bin/bash
# ============================================================================
# run-resting-native.sh — the resting-state (live/archived/trashed) regression
# proof, on native Postgres 17. Applies EVERY migration to a throwaway, seeds a
# tiny fixture, and asserts the archive/trash/state behavior end-to-end. Re-run
# after ANY change touching state, the world views, archive, or the guest door.
# (D-127.) Expected: every line ends in the value shown in the comment.
# ============================================================================
set -uo pipefail
export PATH="/opt/homebrew/opt/postgresql@17/bin:$PATH"
W=$(cd "$(dirname "$0")/.." && pwd)
DB=proof_resting
brew services start postgresql@17 >/dev/null 2>&1 || true
for i in $(seq 1 30); do pg_isready -q 2>/dev/null && break; sleep 1; done
dropdb --if-exists "$DB" 2>/dev/null; createdb "$DB"
psql -d "$DB" -q -v ON_ERROR_STOP=1 >/dev/null 2>&1 <<PRE
do \$\$ begin
  if not exists (select from pg_roles where rolname='anon') then create role anon nologin; end if;
  if not exists (select from pg_roles where rolname='authenticated') then create role authenticated nologin; end if;
end \$\$;
create schema if not exists auth;
create or replace function auth.uid() returns uuid language sql stable as \$fn\$ select '00000000-0000-0000-0000-000000000009'::uuid \$fn\$;
PRE
for m in $(ls "$W"/supabase/migrations/*.sql | sort); do
  psql -d "$DB" -q -v ON_ERROR_STOP=1 -f "$m" >/dev/null 2>/tmp/re.txt || { echo "APPLY FAIL $(basename "$m")"; tail -3 /tmp/re.txt; exit 2; }
done
psql -d "$DB" -q -v ON_ERROR_STOP=1 >/dev/null <<'SEED'
grant usage on schema public to anon, authenticated;
grant select on all tables in schema public to anon, authenticated;
insert into board (id, title, visibility) values ('b0000000-0000-0000-0000-000000000001','Live','public');
insert into bit (id, type, body, kind, visibility) values ('a0000000-0000-0000-0000-000000000001','text','<p>x</p>','bit','public');
insert into placement (id, board_id, target_bit_id, x, y) values ('c0000000-0000-0000-0000-000000000001','b0000000-0000-0000-0000-000000000001','a0000000-0000-0000-0000-000000000001',10,10);
insert into tag (id, word) values ('d0000000-0000-0000-0000-000000000001','focus');
insert into tag_application (id, tag_id, target_bit_id) values ('e0000000-0000-0000-0000-000000000001','d0000000-0000-0000-0000-000000000001','a0000000-0000-0000-0000-000000000001');
SEED
A=a0000000-0000-0000-0000-000000000001; B=b0000000-0000-0000-0000-000000000001
q(){ psql -d "$DB" -qtA -c "$1"; }
echo "1 archive-bit: state=$(q "update bit set archived_at=now() where id='$A'; select state from bit where id='$A'") ledger=$(q "select exists(select 1 from the_ledger where id='$A')")[f] board_cards=$(q "select exists(select 1 from board_cards where target_bit_id='$A')")[f] pull=$(q "select exists(select 1 from the_pull where thing_id='$A')")[f] archive_listing=$(q "select exists(select 1 from archive_listing where thing_id='$A')")[t] placement=$(q "select exists(select 1 from placement where target_bit_id='$A')")[t]"
echo "2 un-archive: state=$(q "update bit set archived_at=null where id='$A'; select state from bit where id='$A'")[live] ledger=$(q "select exists(select 1 from the_ledger where id='$A')")[t]"
echo "3 archive-board: home=$(q "update board set archived_at=now() where id='$B'; select exists(select 1 from home where id='$B')")[f] bit-loose=$(q "select exists(select 1 from the_inbox where id='$A')")[t] bit-still-live=$(q "select state from bit where id='$A'")[live]; un=$(q "update board set archived_at=null where id='$B'; select exists(select 1 from home where id='$B')")[t]"
echo "4 mutual-excl: arch=$(q "update bit set archived_at=now() where id='$A'; select state from bit where id='$A'")[archived] then-trash=$(q "update bit set deleted_at=now(),archived_at=null where id='$A'; select state from bit where id='$A'")[trashed] in-archive=$(q "select exists(select 1 from archive_listing where thing_id='$A')")[f] restore=$(q "update bit set deleted_at=null where id='$A'; select state from bit where id='$A'")[live]"
echo "5 guest: live=$(psql -d "$DB" -qtA -c "set role anon; select exists(select 1 from bit where id='$A'); reset role;")[t] archived=$(q "update bit set archived_at=now() where id='$A'" >/dev/null; psql -d "$DB" -qtA -c "set role anon; select exists(select 1 from bit where id='$A'); reset role;")[f]"
dropdb --if-exists "$DB" 2>/dev/null
echo "DONE — every value should match its [expected]."
