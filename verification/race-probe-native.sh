#!/bin/bash
# ============================================================================
# race-probe-native.sh — the I-D1 two-session race probe, NATIVE Postgres
# (Docker-free twin of race-probe.sh; identical mechanism, identical proof.)
# Proves: WITHOUT `FOR SHARE` the soft-delete tombstone race lands a write
# silently; WITH it the delete blocks and the order is legitimate; delete-first
# the check sees the tombstone. Cleans up after itself.
# ============================================================================
set -uo pipefail
export PATH="/opt/homebrew/opt/postgresql@17/bin:$PATH"
DB="${1:-world_proof}"
P() { psql -d "$DB" -v ON_ERROR_STOP=1 -qtA "$@"; }

BIT='ab000000-0000-0000-0000-000000000001'
TAG='cb000000-0000-0000-0000-000000000001'

cleanup() {
  P -c "delete from tag_application where tag_id='$TAG';
        delete from tag where id='$TAG';
        delete from bit where id='$BIT';" >/dev/null 2>&1 || true
}
trap cleanup EXIT
cleanup

P -c "insert into bit (id, type, body) values ('$BIT','text','race target');
      insert into tag (id, word) values ('$TAG','astro');" >/dev/null

echo "=== Part 1: WITHOUT the lock — reproduce the silent land ==="
P <<SQL &
begin;
select 'A: target live at check-time = ' || (deleted_at is null) from bit where id='$BIT';
select pg_sleep(4);
insert into tag_application (tag_id, target_bit_id) values ('$TAG','$BIT');
commit;
SQL
A_PID=$!
sleep 1
P -c "update bit set deleted_at = now() where id='$BIT';" >/dev/null   # B: soft-delete commits inside A's gap
wait "$A_PID"
LANDED=$(P -c "select count(*) from tag_application ta join bit b on b.id = ta.target_bit_id
               where ta.tag_id='$TAG' and b.deleted_at is not null;")
if [ "$LANDED" = "1" ]; then
  echo "REPRODUCED ✓ the write landed silently on a tombstone (this is the bug FOR SHARE kills)"
else
  echo "PROBE INVALID ✗ the race did not reproduce — timing assumptions wrong, rerun"; exit 1
fi

P -c "delete from tag_application where tag_id='$TAG';
      update bit set deleted_at = null where id='$BIT';" >/dev/null

echo "=== Part 2: WITH FOR SHARE — the delete must WAIT ==="
P <<SQL &
begin;
select 'A: FOR SHARE sees live = ' || (deleted_at is null) from bit where id='$BIT' for share;
select pg_sleep(4);
insert into tag_application (tag_id, target_bit_id) values ('$TAG','$BIT');
commit;
SQL
A_PID=$!
sleep 1
T0=$(date +%s)
P -c "update bit set deleted_at = now() where id='$BIT';" >/dev/null   # B: must block on A's FOR SHARE
T1=$(date +%s)
wait "$A_PID"
BLOCKED=$((T1 - T0))
ORDERED=$(P -c "select count(*) from tag_application ta join bit b on b.id = ta.target_bit_id
                where ta.tag_id='$TAG' and ta.created_at < b.deleted_at;")
if [ "$BLOCKED" -ge 2 ] && [ "$ORDERED" = "1" ]; then
  echo "BLOCKED ✓ the soft-delete waited ${BLOCKED}s for the lock; the write landed on a LIVE target first"
  echo "          (legitimate order: the later delete's confirm-count includes this application — §3e)"
else
  echo "FAIL ✗ blocked=${BLOCKED}s ordered=${ORDERED} — the lock did not serialize"; exit 1
fi

P -c "delete from tag_application where tag_id='$TAG';" >/dev/null

echo "=== Part 3: delete-first order — the check must SEE the tombstone ==="
SEEN=$(P -c "begin; select (deleted_at is not null) from bit where id='$BIT' for share; rollback;")
if [ "$SEEN" = "t" ]; then
  echo "SEEN ✓ FOR SHARE read the tombstone (physics); on that result the db-module fires the keep-by-default prompt (discipline); no write lands"
else
  echo "FAIL ✗ the check missed the tombstone"; exit 1
fi

echo "--- race probe complete: bug reproduced without the lock, killed with it ---"
