// The export's completeness floor, made ENFORCEABLE (I-G1).
//
// The list of exported tables was guarded only by a comment saying "keep in lockstep
// with the schema". That comment failed four times — `source`, `reference`, and then
// `opening`, which shipped incomplete for a day and was found by a code review rather
// than by anything automatic. This test is the enforcement the comment couldn't be:
// it reads the migrations as the source of truth and compares.
import { test } from "node:test";
import assert from "node:assert/strict";
import { readdirSync, readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { EXPORTED_TABLES } from "./exported-tables.ts";

const MIGRATIONS = fileURLToPath(new URL("../../../supabase/migrations", import.meta.url));

/** Every table the schema actually creates. Deliberately a dumb text scan: it reads what
 *  is written, so a table added in any migration is caught without anyone registering it. */
function tablesInSchema() {
  const found = new Set();
  for (const f of readdirSync(MIGRATIONS).filter((f) => f.endsWith(".sql"))) {
    const sql = readFileSync(`${MIGRATIONS}/${f}`, "utf8");
    for (const m of sql.matchAll(/^create table (?:if not exists )?([a-z_]+)/gim)) {
      found.add(m[1]);
    }
  }
  return found;
}

test("the export carries every table the schema creates", () => {
  const schema = tablesInSchema();
  const exported = new Set(EXPORTED_TABLES);
  assert.ok(schema.size > 0, "the scan found no tables at all — the path or the regex is wrong");

  const missing = [...schema].filter((t) => !exported.has(t)).sort();
  assert.deepEqual(
    missing,
    [],
    `these tables exist but are NOT exported — "export everything you own" would be a lie: ${missing.join(", ")}`,
  );
});

test("the export lists nothing that the schema doesn't have", () => {
  const schema = tablesInSchema();
  const stale = EXPORTED_TABLES.filter((t) => !schema.has(t)).sort();
  assert.deepEqual(stale, [], `these are exported but no migration creates them: ${stale.join(", ")}`);
});

test("no duplicates in the list", () => {
  assert.equal(new Set(EXPORTED_TABLES).size, EXPORTED_TABLES.length);
});

test("the cloud check's copy of the table list has not drifted from this one", () => {
  // There is a SECOND hard-coded list, in scripts/test-port.mjs — the live-cloud
  // integration check. It cannot import this module (it runs under plain node, with no
  // TypeScript resolver), so it holds its own copy, and that copy had drifted: 9 entries
  // against the real 13. `source`, `reference`, `opening` and `shelf_group` were never
  // checked on the cloud, and the script printed "all 9 record kinds" as if complete.
  //
  // The comment above it said "keep in lockstep". That is the fourth time in this repo a
  // lockstep comment has failed; this is the enforcement it should have had.
  const script = readFileSync(
    fileURLToPath(new URL("../../../scripts/test-port.mjs", import.meta.url)),
    "utf8",
  );
  const line = script.match(/const EXPORT_TABLES = \[([^\]]*)\]/);
  assert.ok(line, "EXPORT_TABLES not found in scripts/test-port.mjs — did it move?");
  const inScript = [...line[1].matchAll(/"([a-z_]+)"/g)].map((m) => m[1]).sort();
  assert.deepEqual(inScript, [...EXPORTED_TABLES].sort(), "the two export lists disagree");
});
