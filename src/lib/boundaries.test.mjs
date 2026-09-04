import { test } from "node:test";
import assert from "node:assert/strict";
import { readdirSync, readFileSync } from "node:fs";
import { join, relative } from "node:path";
import { fileURLToPath } from "node:url";

// THE BOUNDARY TESTS — the rules that have to reach code nobody has written yet.
//
// A rule written in a document reaches whoever reads the document. A rule with a test
// reaches everyone, including a session with no memory of the conversation that set it.
// These two are here because both were broken by ordinary, reasonable-looking edits.

const SRC = join(fileURLToPath(new URL(".", import.meta.url)), "..");

function sourceFiles() {
  const out = [];
  const walk = (dir) => {
    for (const e of readdirSync(dir, { withFileTypes: true })) {
      const p = join(dir, e.name);
      if (e.isDirectory()) walk(p);
      else if (/\.tsx?$/.test(e.name)) out.push(p);
    }
  };
  walk(SRC);
  return out;
}

const offenders = (pattern, allowed) =>
  sourceFiles()
    .filter((f) => !allowed.includes(relative(SRC, f)))
    .filter((f) => pattern.test(readFileSync(f, "utf8")))
    .map((f) => relative(SRC, f));

test("I-G5 — dates are formatted ONLY in lib/dates", () => {
  // Every date must be able to answer "in whose timezone?", and only lib/dates asks
  // that question. A hand-rolled toLocaleDateString somewhere else silently formats in
  // whatever zone the code happens to be running in — which is UTC on the server and
  // the device in the browser, so it also breaks hydration. That is exactly how the app
  // came to show a bit saved at 6pm under the next day.
  const allowed = [
    "lib/dates.ts",
    // Reads the device's zone NAME; it formats nothing.
    "components/zone.tsx",
  ];
  const found = offenders(/toLocaleDateString|toLocaleTimeString|toLocaleString|Intl\.DateTimeFormat/, allowed);
  assert.deepEqual(found, [], `format dates through lib/dates (Stamp), not directly, in: ${found}`);
});

test("the database is reached ONLY through lib/db", () => {
  // Security is the boundary (RLS), not the query layer, and a query written inside a
  // component cannot be reviewed, reused or tested. This rule is currently held in
  // every file in the app — this test is what keeps that true.
  const found = offenders(/\.from\(["'`]/, ["lib/supabase/proxy.ts"]).filter(
    (f) => !f.startsWith("lib/db/"),
  );
  assert.deepEqual(found, [], `move these queries into lib/db: ${found}`);
});
