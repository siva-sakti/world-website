#!/bin/bash
# ============================================================================
# run-1c.sh — the whole Stage 1c pipeline, unattended (D-084)
# Waits for Docker, boots the local Supabase stack (first-run image pull),
# applies the migration (THE bare-apply proof), then runs attacks.sql and
# race-probe.sh, capturing every output under verification/. Fails loudly at
# the first red phase.
# ============================================================================
set -uo pipefail
cd /Users/gargoodevi/Documents/world-website

echo "=== PHASE 0: wait for the Docker engine ==="
until docker info >/dev/null 2>&1; do sleep 5; done
echo "docker up: $(docker info --format '{{.ServerVersion}}')"

echo "=== PHASE 1: supabase start (pulls ~6-8GB of images on first run) ==="
supabase start || { echo ">>> SUPABASE START FAILED"; exit 1; }

echo "=== PHASE 2: db reset — THE BARE APPLY ==="
echo ">>> the self-computing face/search columns calling a custom function are"
echo ">>> the one construct most likely to fail here; if it does, it fails now."
supabase db reset || { echo ">>> MIGRATION APPLY FAILED (see above)"; exit 1; }
echo "MIGRATION APPLIED CLEAN ✓"

DB=$(docker ps --filter name=supabase_db --format '{{.Names}}' | head -1)
[ -n "$DB" ] || { echo ">>> no supabase_db container"; exit 1; }
echo "db container: $DB"

echo "=== a quick truth-check: the seeds and the nine tables are really there ==="
docker exec -i "$DB" psql -U postgres -d postgres -qtA -c \
  "select 'tables=' || count(*) from information_schema.tables
     where table_schema='public' and table_type='BASE TABLE';
   select 'tags=' || count(*) from tag;
   select 'subtypes=' || count(*) from subtype_word;
   select 'views=' || count(*) from information_schema.views where table_schema='public';"

echo "=== PHASE 3: attacks.sql — every refusal + every assertion ==="
docker exec -i "$DB" psql -U postgres -d postgres < verification/attacks.sql \
  > verification/attacks.out 2>&1
ATT=$?
cat verification/attacks.out
[ "$ATT" = "0" ] && echo "ATTACKS PASSED ✓" || { echo ">>> ATTACKS FAILED (exit $ATT)"; exit 1; }

echo "=== PHASE 4: race probe (I-D1, two live sessions) ==="
bash verification/race-probe.sh > verification/race-probe.out 2>&1
RC=$?
cat verification/race-probe.out
[ "$RC" = "0" ] && echo "RACE PROBE PASSED ✓" || { echo ">>> RACE PROBE FAILED (exit $RC)"; exit 1; }

echo ""
echo "=== 1c COMPLETE — migration applies, every constraint refuses, the race is closed ==="
