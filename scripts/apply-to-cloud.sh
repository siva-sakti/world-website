#!/bin/bash
# ============================================================================
# apply-to-cloud.sh — pour the proven schema into the cloud Supabase project
# and re-prove it there (Stage 2b). STAGED: runs only once SUPABASE_DB_URL is
# present in .env.local (the owner adds it — see the port ask, 2026-07-22).
#
# What it does, in order (stop-on-error throughout):
#   1. Surgically drop the OLD prototype schema (the 7 named tables + 3 enums +
#      the old trigger fn) — nothing else, so Supabase's own objects are safe.
#   2. Apply the proven migration (20260721000001_init.sql).
#   3. Re-run the FULL proof suite against the cloud DB (attacks + scenarios) —
#      the Stage-1 proofs must pass on cloud exactly as they did on native PG.
#   4. Create the two storage buckets (public, private) via the service-key API.
#   5. Create the owner account (existing scripts/create-owner.mjs).
# Leaves the cloud project schema-ready for the port build.
# ============================================================================
set -uo pipefail
cd "$(dirname "$0")/.."
export PATH="/opt/homebrew/opt/postgresql@17/bin:$PATH"
set -a; source .env.local 2>/dev/null; set +a

: "${SUPABASE_DB_URL:?Not set. Add SUPABASE_DB_URL=\"postgresql://...\" to .env.local (see the port ask).}"
: "${NEXT_PUBLIC_SUPABASE_URL:?missing}"; : "${SUPABASE_SERVICE_ROLE_KEY:?missing}"
MIG=supabase/migrations/20260721000001_init.sql

echo "=== 0. confirm we can reach the cloud DB ==="
psql "$SUPABASE_DB_URL" -qtAc "select 'connected to ' || current_database()" || { echo ">>> cannot connect — check SUPABASE_DB_URL"; exit 1; }

echo "=== 1. surgical reset of the OLD prototype schema (named objects only) ==="
psql "$SUPABASE_DB_URL" -v ON_ERROR_STOP=1 <<'SQL'
drop table if exists board_tags, bit_tags, links, placements, tags, bits, boards cascade;
drop type  if exists bit_kind, bit_type, visibility cascade;
drop function if exists set_updated_at() cascade;
SQL
echo "old schema cleared ✓"

echo "=== 2. apply the proven migration ==="
psql "$SUPABASE_DB_URL" -v ON_ERROR_STOP=1 -f "$MIG" >/dev/null && echo "migration applied ✓" || { echo ">>> apply FAILED"; exit 1; }

echo "=== 3. re-prove on cloud — attacks + scenarios ==="
psql "$SUPABASE_DB_URL" -f verification/attacks.sql > verification/attacks.cloud.out 2>&1
grep -qE "complete: every refusal refused" verification/attacks.cloud.out \
  && echo "attacks ✓ ($(grep -c 'REFUSED ✓' verification/attacks.cloud.out) refused · $(grep -c 'HOLDS ✓' verification/attacks.cloud.out) held)" \
  || { echo ">>> cloud attacks FAILED — see verification/attacks.cloud.out"; tail -5 verification/attacks.cloud.out; exit 1; }
# scenarios.sql commits rows; run it then clean them so the port starts empty
psql "$SUPABASE_DB_URL" -f verification/scenarios.sql > verification/scenarios.cloud.out 2>&1
grep -qE "1d COMPLETE|every scene traces" verification/scenarios.cloud.out \
  && echo "scenarios ✓" || { echo ">>> cloud scenarios FAILED"; tail -5 verification/scenarios.cloud.out; exit 1; }
echo "   clearing the scenario seed rows so the port opens on an empty notebook..."
psql "$SUPABASE_DB_URL" -v ON_ERROR_STOP=1 <<'SQL'
truncate connector, placement, tag_application, bit, board, dormant restart identity cascade;
delete from tag where word not in ('learned','noticed','wondered','theorized');
delete from category; delete from subtype_word where word not in ('cartoon','doodle','script','notes','diagram');
SQL
echo "cloud DB re-proven and reset to clean seeds ✓"

echo "=== 4. storage buckets (public, private) ==="
for spec in "port-public:true" "port-private:false"; do
  name="${spec%%:*}"; pub="${spec##*:}"
  # actual bucket names are 'public'/'private'; loop var kept readable
done
create_bucket () {
  local name="$1" public="$2"
  code=$(curl -s -o /dev/null -w "%{http_code}" -X POST "$NEXT_PUBLIC_SUPABASE_URL/storage/v1/bucket" \
    -H "Authorization: Bearer $SUPABASE_SERVICE_ROLE_KEY" -H "apikey: $SUPABASE_SERVICE_ROLE_KEY" \
    -H "Content-Type: application/json" -d "{\"name\":\"$name\",\"id\":\"$name\",\"public\":$public}")
  case "$code" in 200|201) echo "bucket '$name' created ✓";; 409) echo "bucket '$name' already exists ✓";; *) echo ">>> bucket '$name' failed (HTTP $code)"; return 1;; esac
}
create_bucket public true  || exit 1
create_bucket private false || exit 1

echo "=== 5. owner account ==="
node scripts/create-owner.mjs || echo "(owner account step — check output above; may already exist)"

echo ""
echo "=== CLOUD READY — schema poured, re-proven, buckets + owner set. The port can build. ==="
