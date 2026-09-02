import { test } from "node:test";
import assert from "node:assert/strict";
import { emptyMessage } from "./empty-message.ts";

// Owner ruling (2026-09-02): the two empty states stay SEPARATE. An empty room is an
// invitation; a failed filter is a dead end with a way out. These pin that distinction.

test("an empty room is an invitation, not a failure", () => {
  assert.equal(emptyMessage({ filtered: false }), "Nothing here yet.");
});

test("a room may add its own invitation", () => {
  assert.equal(
    emptyMessage({ filtered: false, hint: "jot a note above, or catch things on a board" }),
    "Nothing here yet — jot a note above, or catch things on a board.",
  );
});

test("a failed filter names the way out by default", () => {
  assert.equal(emptyMessage({ filtered: true }), "Nothing matches — clear the search or filters.");
});

test("a room whose controls differ supplies its own way out", () => {
  assert.equal(
    emptyMessage({ filtered: true, hint: "try a different word, tag, or date" }),
    "Nothing matches — try a different word, tag, or date.",
  );
});

test("a cramped room can take the bare sentence", () => {
  assert.equal(emptyMessage({ filtered: true, hint: null }), "Nothing matches.");
});

test("THE distinction: the two situations never read the same", () => {
  assert.notEqual(emptyMessage({ filtered: false }), emptyMessage({ filtered: true }));
});
