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

test("every debounced save keeps its writes in order", () => {
  // A REGRESSION GUARD, not a proof of correctness — worth being exact about the
  // difference. It cannot show that these files save correctly; only a timing test can do
  // that, and that needs them extracted into pure modules first (deferred by the owner,
  // 2026-09-03). What it CAN do is stop the fix being quietly removed, and make a sixth
  // hand-rolled save loop declare itself.
  //
  // The bug it guards: each save used to fire independently, so typing, blurring, typing
  // and blurring inside the debounce could land the FIRST write LAST — the database keeps
  // the old words, the screen shows the new ones, and the "saved" marker already matches
  // so nothing ever retries. It was live in two files, one of them in a region this pass
  // had already called closed.
  const KNOWN_SAVE_LOOPS = [
    "app/bit/[id]/bit-controls.tsx",
    "app/bit/[id]/text-workspace.tsx",
    "app/board/[id]/board-description.tsx",
    "app/write/quick-write.tsx",
    "app/board/[id]/write-queue.ts",
  ];
  // Matches the MECHANISM, not the word. The first version of this test looked for
  // /chain/ and passed happily against a file whose chain had been deleted — because the
  // comment explaining the chain still said "chain". Caught by reverting the fix and
  // watching the test stay green, which is why fixes get reverted rather than trusted.
  // Two shapes in use: a per-field ref (`chain.current = …`) and the board queue's
  // per-ROW map (`state.chains.set(id, …)`), which needs one chain per card rather than
  // one per surface. Both are the same mechanism — the next write waits on the last.
  const CHAINED = /chain\.current\s*=|chains\.set\(/;
  const missing = KNOWN_SAVE_LOOPS.filter(
    (f) => !CHAINED.test(readFileSync(join(SRC, f), "utf8")),
  );
  assert.deepEqual(missing, [], `these save writes are not kept in order: ${missing}`);

  // And the list is honest: anything else that debounces a save must be added to it.
  const debouncers = sourceFiles()
    .filter((f) => /setTimeout\(\s*(save|flush)\b/.test(readFileSync(f, "utf8")))
    .map((f) => relative(SRC, f));
  const unlisted = debouncers.filter((f) => !KNOWN_SAVE_LOOPS.includes(f));
  assert.deepEqual(unlisted, [], `a new debounced save appeared — does it keep writes in order? ${unlisted}`);
});
