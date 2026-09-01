// Unit test for recent.ts — the openings → "where you were" map.
// From the repo root:  node 'src/lib/recent.test.mjs'
import { test } from "node:test";
import assert from "node:assert/strict";
import { recentSurfaces } from "./recent.ts";

const surface = (kind, id, title) => ({
  kind, id, title,
  href: kind === "board" ? `/board/${id}` : `/note/${id}`,
  group_id: null, pinned_at: null,
  created_at: "2026-01-01T00:00:00Z", modified_at: "2026-01-01T00:00:00Z",
});
const board = (id) => ({ board_id: id, bit_id: null, opened_at: "2026-09-01T10:00:00Z" });
const note  = (id) => ({ board_id: null, bit_id: id, opened_at: "2026-09-01T10:00:00Z" });

const SURFACES = [
  surface("board", "b1", "first board"),
  surface("board", "b2", "second board"),
  surface("note", "n1", "a note"),
];

test("keeps the openings' order and resolves titles from surfaces", () => {
  const out = recentSurfaces([note("n1"), board("b2"), board("b1")], SURFACES);
  assert.deepEqual(out.map((s) => s.title), ["a note", "second board", "first board"]);
  assert.deepEqual(out.map((s) => s.href), ["/note/n1", "/board/b2", "/board/b1"]);
});

test("an opening whose target is gone (trashed/archived) drops out silently", () => {
  // "b9" is not in surfaces — home's lists filter state='live', so a trashed or
  // archived thing simply isn't there. No filtering code of its own.
  const out = recentSurfaces([board("b9"), board("b1")], SURFACES);
  assert.deepEqual(out.map((s) => s.id), ["b1"]);
});

test("every opening dropped → an empty list, not a crash", () => {
  assert.deepEqual(recentSurfaces([board("gone"), note("also-gone")], SURFACES), []);
  assert.deepEqual(recentSurfaces([], SURFACES), []);
  assert.deepEqual(recentSurfaces([board("b1")], []), []);
});

test("caps at `take`, counting only the survivors", () => {
  const many = [board("b1"), board("b9"), note("n1"), board("b2")];
  // b9 is dead; the cap must not be spent on it
  assert.deepEqual(recentSurfaces(many, SURFACES, 2).map((s) => s.id), ["b1", "n1"]);
  assert.equal(recentSurfaces(many, SURFACES).length, 3);
});

test("a board and a note sharing an id do not collide", () => {
  // different id spaces; the key is `kind:id`, not a bare id
  const both = [surface("board", "same", "the board"), surface("note", "same", "the note")];
  assert.deepEqual(recentSurfaces([note("same")], both).map((s) => s.title), ["the note"]);
  assert.deepEqual(recentSurfaces([board("same")], both).map((s) => s.title), ["the board"]);
});
