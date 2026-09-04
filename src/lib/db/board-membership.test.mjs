import { test } from "node:test";
import assert from "node:assert/strict";
import { liveBoardOf, MEMBERSHIP_SELECT } from "./board-membership.ts";

// "WHICH BOARDS IS THIS BIT ON?" — pinned, because it was answered three different ways
// and the one the TRASH CONFIRM used was the wrong one. It could say "this is on 2
// boards" with one of them in the trash: a destructive act's dialog stating something
// false. Now one function answers it for the inbox, a bit's page and the confirm alike.

const row = (state) => ({ board: { id: "b1", title: "Reading", state } });

test("a bit is on a LIVE board", () => {
  assert.deepEqual(liveBoardOf(row("live")), { id: "b1", title: "Reading" });
});

test("a bit is NOT on a trashed board — the trash confirm must not count it", () => {
  assert.equal(liveBoardOf(row("trashed")), null);
});

test("a bit is NOT on an archived board — it renders nowhere, so it is not a membership", () => {
  assert.equal(liveBoardOf(row("archived")), null);
});

test("a placement whose board did not come back is not a membership", () => {
  assert.equal(liveBoardOf({ board: null }), null);
  assert.equal(liveBoardOf({}), null);
});

test("the embed names its foreign key — a placement links to board two ways", () => {
  // board_id = the board it sits on; target_board_id = a board placed AS a card.
  // An unnamed embed is ambiguous and Postgrest rejects it; the wrong one would
  // silently answer a different question.
  assert.match(MEMBERSHIP_SELECT, /placement_board_id_fkey/);
  assert.match(MEMBERSHIP_SELECT, /\bstate\b/, "state must be selected or the filter cannot run");
});
