#!/usr/bin/env bash
# Re-run the JSON-vs-HTML search proof (D-142, composition-spec §21.5).
# Native Postgres 17, same pattern as run-opening-native.sh (Docker path dead, D-084).
# LOCAL ONLY — a throwaway db, never the cloud/production DB.
# Needs no migrations: the proof is self-contained (it re-creates the shipped
# bit_search_text HTML approach verbatim and compares four JSON approaches).
set -euo pipefail
export PATH="/opt/homebrew/opt/postgresql@17/bin:$PATH"
DB=json_search_scratch
HERE="$(cd "$(dirname "$0")" && pwd)"
pg_isready -q || brew services start postgresql@17
until pg_isready -q; do sleep 1; done
dropdb --if-exists "$DB"; createdb "$DB"
psql -d "$DB" -v ON_ERROR_STOP=1 -f "$HERE/json-search-proof.sql" 2>&1 | tee "$HERE/json-search-proofs.out"
dropdb "$DB"
echo "done — output in verification/json-search-proofs.out"
