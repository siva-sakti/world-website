import { test } from "node:test";
import assert from "node:assert/strict";
import { readdirSync, readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { COPIED_TO_A_DUPLICATE, NOT_COPIED_TO_A_DUPLICATE } from "./bit-copy-rule.ts";

// THE GUARD ON THE COPY RULE.
//
// Duplicate lost fields twice in one week, the same way both times: the reported field
// was fixed and nobody asked what else was in the same position. This test asks. It
// reads the schema, so a column added to `bit` in any future migration must be given a
// decision — copied, or deliberately not with a reason — before the suite is green.
//
// It also reads duplicateBit's own source, so the two lists cannot drift from what the
// code does. A rule nobody can violate by accident is worth more than a rule written down.

const ROOT = fileURLToPath(new URL("../../..", import.meta.url));
const MIGRATIONS = `${ROOT}/supabase/migrations`;

/** Every column `bit` ends up with: the create table body, plus any later `add column`. */
function bitColumns() {
  const cols = new Set();
  const files = readdirSync(MIGRATIONS).filter((f) => f.endsWith(".sql")).sort();
  for (const f of files) {
    const sql = readFileSync(`${MIGRATIONS}/${f}`, "utf8");
    const created = sql.match(/create table (?:if not exists )?bit \(([\s\S]*?)\n\);/i);
    if (created) {
      for (const line of created[1].split("\n")) {
        const bare = line.replace(/--.*$/, "").trim();
        const m = bare.match(/^([a-z_]+)\s+(uuid|text|int|bigint|jsonb|timestamptz|boolean|tsvector)/);
        if (m) cols.add(m[1]);
      }
    }
    for (const m of sql.matchAll(/alter table bit\s+add column (?:if not exists )?([a-z_]+)/gi)) {
      cols.add(m[1]);
    }
    for (const m of sql.matchAll(/alter table bit\s+drop column (?:if exists )?([a-z_]+)/gi)) {
      cols.delete(m[1]);
    }
  }
  return cols;
}

test("every column of `bit` has a copy decision — copied, or deliberately not", () => {
  const decided = new Set([...COPIED_TO_A_DUPLICATE, ...Object.keys(NOT_COPIED_TO_A_DUPLICATE)]);
  const undecided = [...bitColumns()].filter((c) => !decided.has(c));
  assert.deepEqual(
    undecided,
    [],
    `add these to src/lib/db/bit-copy-rule.ts — does a duplicate inherit them? ${undecided}`,
  );
});

test("the schema is actually being read (a silent zero would make this test a no-op)", () => {
  const cols = bitColumns();
  assert.ok(cols.size > 10, `expected the bit table's columns, found ${cols.size}`);
  assert.ok(cols.has("body") && cols.has("pinned_at"), "known columns must be present");
});

test("what duplicateBit really writes is what the rule says it writes", () => {
  const src = readFileSync(`${ROOT}/src/lib/db/bits.ts`, "utf8");
  const fn = src.slice(src.indexOf("export async function duplicateBit"));
  // The INSERT block specifically — duplicateBit reads the original first, and that
  // read is also a .from("bit"), so anchoring on the insert is what makes this honest.
  const from = fn.indexOf(".insert({");
  const insert = fn.slice(from, fn.indexOf('.select("*")', from));
  assert.ok(insert.length > 100, "the insert block must actually have been found");

  for (const col of COPIED_TO_A_DUPLICATE) {
    assert.match(insert, new RegExp(`\\b${col}\\b`), `duplicateBit must carry ${col}`);
  }
  for (const col of Object.keys(NOT_COPIED_TO_A_DUPLICATE)) {
    if (col === "id") continue; // the copy sets its OWN id — present, and correctly so
    assert.doesNotMatch(insert, new RegExp(`\\b${col}:`), `duplicateBit must NOT set ${col}`);
  }
});

test("nothing that POINTS AT a bit is copied", () => {
  // Placements, references and travel belong to the boards and writing that made them.
  // Copying any of them would materialise a card on a board the owner never put it on.
  const src = readFileSync(`${ROOT}/src/lib/db/bits.ts`, "utf8");
  const fn = src.slice(
    src.indexOf("export async function duplicateBit"),
    src.indexOf("export", src.indexOf("export async function duplicateBit") + 10),
  );
  assert.doesNotMatch(fn, /from\("placement"\)/, "a copy is not placed anywhere");
  assert.doesNotMatch(fn, /from\("reference"\)/, "a copy is mentioned by no writing");
});

test("tags ARE copied — a tag is something the bit HAS, not a pointer at it", () => {
  const src = readFileSync(`${ROOT}/src/lib/db/bits.ts`, "utf8");
  const fn = src.slice(src.indexOf("export async function duplicateBit"));
  assert.match(fn.slice(0, 3000), /tag_application/, "the original's tags come across (ruled)");
});
