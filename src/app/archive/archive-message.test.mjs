import { test } from "node:test";
import assert from "node:assert/strict";
import { archiveConfirmMessage } from "./archive-message.ts";

// The wording of a confirm is pinned so a future tidy-up can't quietly reword what the
// owner is being asked. These are her sentences; Claude only moved them.

test("one thing, on no board: the plain sentence", () => {
  assert.equal(
    archiveConfirmMessage({ noun: "note" }),
    "Archive this note? It's set aside in your archive — un-archive anytime.",
  );
});

test("the noun comes from the CALLER — a photo is not a note", () => {
  // The storage layer can't tell them apart (bit rows hold both), so the page supplies it.
  assert.equal(
    archiveConfirmMessage({ noun: "bit" }),
    "Archive this bit? It's set aside in your archive — un-archive anytime.",
  );
  assert.match(archiveConfirmMessage({ noun: "board" }), /^Archive this board\?/);
});

test("one thing on ONE board: singular 'it', not 'them'", () => {
  assert.equal(
    archiveConfirmMessage({ noun: "bit", onBoards: 1 }),
    "This is on 1 board — archiving hides it from it until you un-archive.",
  );
});

test("one thing on SEVERAL boards: says how many, and 'them'", () => {
  assert.equal(
    archiveConfirmMessage({ noun: "bit", onBoards: 3 }),
    "This is on 3 boards — archiving hides it from them until you un-archive.",
  );
});

test("many things: counts them", () => {
  assert.equal(
    archiveConfirmMessage({ count: 4, noun: "bit" }),
    "Archive 4 bits? They're set aside in your archive — un-archive anytime.",
  );
});

test("a bulk selection of exactly one falls back to the single sentence", () => {
  assert.equal(
    archiveConfirmMessage({ count: 1, noun: "bit" }),
    "Archive this bit? It's set aside in your archive — un-archive anytime.",
  );
});
