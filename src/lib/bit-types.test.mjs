import { test } from "node:test";
import assert from "node:assert/strict";
import { readdirSync, readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { isCardType } from "../app/board/[id]/card-vm.ts";
import { copyPathsFor } from "./storage.ts";

// WHAT A BIT CAN BE — the one set, asserted across the seam.
//
// The database decides it (`bit_type_allowed`). The app restates it in TypeScript unions,
// and TypeScript CANNOT check itself against SQL — so for six types across four
// type-adding migrations, the two halves have only ever agreed by hand. Nothing failed if
// they stopped agreeing: a type in SQL but not in TS renders as nothing (the board card
// and the bit page both have no default branch); a type in TS but not in SQL is refused by
// Postgres at write time, after the optimistic card is already on screen.
//
// Written BEFORE adding the 'file' and 'table' types rather than after, on an antagonist's
// recommendation — the whole point is that it is in place when the set next changes.
// Same instrument as bit-copy-rule.test.mjs: read the migrations, they are the truth.

const ROOT = fileURLToPath(new URL("../..", import.meta.url));
const MIGRATIONS = `${ROOT}/supabase/migrations`;

/** The set the DATABASE allows, after every migration has had its say. */
function allowedInSchema() {
  let allowed = null;
  for (const f of readdirSync(MIGRATIONS).filter((f) => f.endsWith(".sql")).sort()) {
    const sql = readFileSync(`${MIGRATIONS}/${f}`, "utf8");
    // The last one wins: each type-adding migration drops the constraint and re-adds it.
    for (const m of sql.matchAll(/constraint bit_type_allowed\s+check\s*\(\s*type in \(([^)]*)\)/gi)) {
      allowed = [...m[1].matchAll(/'([a-z_]+)'/g)].map((x) => x[1]);
    }
  }
  return allowed;
}

/** A TypeScript union, read as text — the type itself is erased before a test could see it. */
function unionInSource(relPath, name) {
  const src = readFileSync(`${ROOT}/src/${relPath}`, "utf8");
  const m = src.match(new RegExp(`export type ${name} =([^;]*);`));
  assert.ok(m, `${name} not found in ${relPath} — did it move or get renamed?`);
  return [...m[1].matchAll(/"([a-z_]+)"/g)].map((x) => x[1]);
}

const SCHEMA = allowedInSchema();

test("the schema is actually being read (a silent zero would make this file a no-op)", () => {
  assert.ok(SCHEMA && SCHEMA.length >= 4, `expected the allowed types, found ${SCHEMA}`);
  assert.ok(SCHEMA.includes("text"), "text must always be allowed");
});

test("BitType matches what the database allows", () => {
  assert.deepEqual(unionInSource("lib/types.ts", "BitType").sort(), [...SCHEMA].sort());
});

test("CardType matches what the database allows", () => {
  // A type the board cannot render is worse than one it refuses: card.tsx has no default
  // branch, so an unknown type draws an empty bordered box and says nothing went wrong.
  assert.deepEqual(unionInSource("app/board/[id]/card-vm.ts", "CardType").sort(), [...SCHEMA].sort());
});

test("every allowed type is one the board will accept", () => {
  for (const t of SCHEMA) assert.equal(isCardType(t), true, `${t} is allowed but isCardType says no`);
  assert.equal(isCardType("table"), false, "a type not yet added must still be refused");
});

test("every allowed type has a copy rule — a new type must not silently copy nothing", () => {
  // I-G6: a copy gets its OWN file. copyPathsFor decides where that file goes, per type,
  // and its `default` returns nulls — so a type added without an entry copies the row and
  // silently leaves the copy pointing at no file at all.
  const FILE_BACKED = ["image", "audio", "pdf"];
  for (const t of SCHEMA) {
    const out = copyPathsFor(t, "new-id", { storage_path: "old/path.bin", thumb_path: "old/t.jpg" });
    if (FILE_BACKED.includes(t)) {
      assert.ok(out.storage, `${t} is file-backed but its copy would have no file`);
      assert.ok(out.storage.includes("new-id"), `${t}'s copy must own its path, not inherit one`);
    }
  }
});

/** The substance rule: which column each type keeps its actual content in. */
function substanceBranches() {
  let branches = null;
  for (const f of readdirSync(MIGRATIONS).filter((f) => f.endsWith(".sql")).sort()) {
    const sql = readFileSync(`${MIGRATIONS}/${f}`, "utf8");
    const m = [...sql.matchAll(/constraint bit_substance_matches_type check \(([\s\S]*?)\n\s*\);/gi)].pop();
    if (m) branches = [...m[1].matchAll(/when '([a-z_]+)'/g)].map((x) => x[1]);
  }
  return branches;
}

test("every allowed type says WHERE its content lives — no type falls through to `else true`", () => {
  // bit_substance_matches_type ends with `else true`, so a type added to bit_type_allowed
  // without its own branch is silently unconstrained: a 'table' bit with no cells at all,
  // or a photo bit carrying a URL and no file, would both be legal rows. The constraint is
  // what makes a malformed bit IMPOSSIBLE rather than merely unlikely, and the `else true`
  // quietly opts a new type out of that protection.
  //
  // This is the guard for the owner's ask: "I want to make sure you don't allow users to
  // make errors." The strongest version of that is not a warning in the app — it is a row
  // the database will not accept.
  const branches = substanceBranches();
  assert.ok(branches && branches.length >= 4, `substance branches not found: ${branches}`);
  const unconstrained = SCHEMA.filter((t) => !branches.includes(t));
  assert.deepEqual(
    unconstrained,
    [],
    `these types can hold any content, or none — give each a branch: ${unconstrained}`,
  );
});
