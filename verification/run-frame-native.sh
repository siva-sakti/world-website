#!/usr/bin/env bash
# Re-run the frame migration proof (frame-plan.md; 20260903000002_frame.sql).
# Native Postgres 17, same pattern as run-json-search-native.sh (Docker path dead, D-084).
# LOCAL ONLY — a throwaway db, never the cloud/production DB.
set -euo pipefail
export PATH="/opt/homebrew/opt/postgresql@17/bin:$PATH"
DB=frame_scratch
HERE="$(cd "$(dirname "$0")" && pwd)"
ROOT="$(cd "$HERE/.." && pwd)"
pg_isready -q || brew services start postgresql@17
until pg_isready -q; do sleep 1; done
dropdb --if-exists "$DB"; createdb "$DB"
psql -d "$DB" -f "$HERE/frame-attacks.sql" 2>&1 | tee "$HERE/frame-attacks.out"
dropdb "$DB"
echo "done — output in verification/frame-attacks.out (run from repo root: $ROOT)"
