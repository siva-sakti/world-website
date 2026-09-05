// THE WALL HAS NO GAPS — every table the migrations create must enable RLS.
// (Item 0, D-149: the queue antagonist found this guard named but unbuilt. A new
// table without RLS is invisible to every existing test and wide open to anon.)
// Boundary-test pattern: read the migrations as the enforcement layer.
import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";

const dir = join(import.meta.dirname, "../../supabase/migrations");
const sql = readdirSync(dir)
  .filter((f) => f.endsWith(".sql"))
  .map((f) => readFileSync(join(dir, f), "utf8"))
  .join("\n");

const created = new Set(
  [...sql.matchAll(/create table (?:if not exists )?([a-z_0-9]+)/g)].map((m) => m[1]),
);
const rls = new Set(
  [...sql.matchAll(/alter table ([a-z_0-9]+) enable row level security/g)].map((m) => m[1]),
);

test("every created table enables row level security", () => {
  const naked = [...created].filter((t) => !rls.has(t));
  assert.deepEqual(naked, [], `tables WITHOUT RLS: ${naked.join(", ")}`);
});

test("the parse actually found the tables (not a vacuous pass)", () => {
  assert.ok(created.size >= 13, `only ${created.size} tables parsed — the regex broke`);
  assert.ok(created.has("bit") && created.has("board") && created.has("placement"));
});
