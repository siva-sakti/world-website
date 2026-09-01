#!/bin/bash
# ============================================================================
# run-lock-native.sh — the lock bit-type proof, on native Postgres 17.
# Two independent throwaway databases in one run:
#
#   PROOF 1 (existing suite stays green): apply ONLY 20260721000001_init.sql and
#     run the frozen attacks.sql — the init-schema regression suite, unchanged.
#     (attacks.sql seeds a BOOKMARK fixture, so it can only run on the init schema,
#     where bookmark still exists; that is why the lock refusals live in their own
#     file, run against the full chain below, where 'lock' is a real allowed type.)
#
#   PROOF 2 (the lock migration): apply EVERY migration THROUGH
#     20260902000001_lock_and_description.sql and run lock-attacks.sql — the lock refusals
#     (proven against the substance branch, not type_allowed) + the filename search
#     (inherited from the audio migration, no lock-specific index work).
#
# Re-run after any change touching the bit type set or the substance rule.
# Expected: both proofs exit 0.
# ============================================================================
set -uo pipefail
export PATH="/opt/homebrew/opt/postgresql@17/bin:$PATH"
W=$(cd "$(dirname "$0")/.." && pwd)
DB_INIT=proof_lock_init
DB_ALL=proof_lock

brew services start postgresql@17 >/dev/null 2>&1 || true
for i in $(seq 1 30); do pg_isready -q 2>/dev/null && break; sleep 1; done
pg_isready || { echo ">>> server not ready"; exit 1; }
echo "postgres up: $(psql -d postgres -qtA -c 'show server_version' 2>/dev/null || echo '?')"

roles() {  # the two Supabase login-role stand-ins (RLS is a real test)
  psql -d "$1" -q -v ON_ERROR_STOP=1 <<'PRE'
do $$ begin
  if not exists (select from pg_roles where rolname='anon') then create role anon nologin; end if;
  if not exists (select from pg_roles where rolname='authenticated') then create role authenticated nologin; end if;
end $$;
PRE
}

# ============================================================================
echo ""
echo "=== PROOF 1: the existing suite stays green (init schema + attacks.sql) ==="
dropdb --if-exists "$DB_INIT" 2>/dev/null; createdb "$DB_INIT"
roles "$DB_INIT"
if psql -d "$DB_INIT" -v ON_ERROR_STOP=1 -f "$W/supabase/migrations/20260721000001_init.sql" >/tmp/lock_init_apply.txt 2>&1; then
  echo "init migration applied clean OK"
else
  echo ">>> INIT APPLY FAILED:"; tail -5 /tmp/lock_init_apply.txt; exit 1
fi
psql -d "$DB_INIT" -v ON_ERROR_STOP=1 -c "grant usage on schema public to anon, authenticated;
  grant select on all tables in schema public to anon;
  grant all on all tables in schema public to authenticated;" >/dev/null
psql -d "$DB_INIT" -f "$W/verification/attacks.sql" 2>&1
A1=${PIPESTATUS[0]}
[ "$A1" = "0" ] && echo "PROOF 1 PASSED OK — the existing attack suite is still green" \
  || { echo ">>> PROOF 1 FAILED (exit $A1)"; exit 1; }

# ============================================================================
echo ""
echo "=== PROOF 2: the lock migration (full chain + lock-attacks.sql) ==="
dropdb --if-exists "$DB_ALL" 2>/dev/null; createdb "$DB_ALL"
roles "$DB_ALL"
# the later migrations create owner-scoped RLS policies that read auth.uid() — it
# must EXIST at policy-creation time (its value is irrelevant: the proof runs as
# the superuser, which bypasses RLS).
psql -d "$DB_ALL" -q -v ON_ERROR_STOP=1 <<'PRE'
create schema if not exists auth;
create or replace function auth.uid() returns uuid language sql stable as $fn$ select '00000000-0000-0000-0000-000000000009'::uuid $fn$;
PRE
for m in $(ls "$W"/supabase/migrations/*.sql | sort); do
  if ! psql -d "$DB_ALL" -q -v ON_ERROR_STOP=1 -f "$m" >/dev/null 2>/tmp/lock_all_apply.txt; then
    echo ">>> APPLY FAIL $(basename "$m")"; tail -5 /tmp/lock_all_apply.txt; exit 1
  fi
done
echo "all $(ls "$W"/supabase/migrations/*.sql | wc -l | tr -d ' ') migrations applied clean OK (incl. 20260902000001_lock_and_description.sql)"
echo "allowed bit types now: $(psql -d "$DB_ALL" -qtA -c "select pg_get_constraintdef(oid) from pg_constraint where conname='bit_type_allowed'")"
psql -d "$DB_ALL" -v ON_ERROR_STOP=1 -c "grant usage on schema public to anon, authenticated;
  grant select on all tables in schema public to anon;
  grant all on all tables in schema public to authenticated;" >/dev/null
psql -d "$DB_ALL" -f "$W/verification/lock-attacks.sql" 2>&1
A2=${PIPESTATUS[0]}
[ "$A2" = "0" ] && echo "PROOF 2 PASSED OK — the lock migration is proven" \
  || { echo ">>> PROOF 2 FAILED (exit $A2)"; exit 1; }

dropdb --if-exists "$DB_INIT" 2>/dev/null; dropdb --if-exists "$DB_ALL" 2>/dev/null
echo ""
echo "=== lock proof COMPLETE — existing suite green, lock migration proven ==="
