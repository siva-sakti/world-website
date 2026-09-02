import { test } from "node:test";
import assert from "node:assert/strict";
import { typeLabel, bitLabel, boardLabel } from "./labels.ts";

// THE TYPE BADGE — one word per file kind, pinned. Before this it was written five times
// and they disagreed: a recording read "recording" on /bits but "audio" in /outline, and
// a drawing read "sketch" in three rooms but "doodle" in /search.

test("every file kind has one lowercase word", () => {
  assert.equal(typeLabel("image"), "image");
  assert.equal(typeLabel("audio"), "audio");
  assert.equal(typeLabel("pdf"), "pdf");
  assert.equal(typeLabel("drawing"), "drawing");
  assert.equal(typeLabel("link"), "link");
  assert.equal(typeLabel("text"), "text");
});

test("owner ruling: audio is 'audio', never 'recording'", () => {
  // "to me recording is maybe not the most clear" — 2026-09-02
  assert.equal(typeLabel("audio"), "audio");
});

test("owner ruling: lowercase, so 'pdf' and not 'PDF'", () => {
  // "I like lowercase for aesthetic reasons" — 2026-09-02
  assert.equal(typeLabel("pdf"), "pdf");
});

test("the badge NEVER spends the owner's drawing vocabulary", () => {
  // doodle / sketch / drawing are what a drawing IS to her — all three valid, and a
  // subtype idea (bit.subtype_word_id), not a type name. The badge must stay neutral.
  const badge = typeLabel("drawing");
  assert.equal(badge, "drawing");
  assert.notEqual(badge, "sketch");
  assert.notEqual(badge, "doodle");
});

test("an unknown type shows its stored word, not a guess", () => {
  // A new bit type should look unfamiliar rather than mislabelled.
  assert.equal(typeLabel("video"), "video");
});

test("a missing type degrades to 'bit' rather than blank", () => {
  assert.equal(typeLabel(null), "bit");
  assert.equal(typeLabel(undefined), "bit");
});

// The two labels that were ALREADY single-sourced — pinned so they stay that way.

test("bitLabel prefers the thing's own face, and its fallback is grammatical", () => {
  assert.equal(bitLabel("image", "beach hut"), "beach hut");
  assert.equal(bitLabel("image", "   "), "an image", "whitespace is not a title");
  assert.equal(bitLabel("audio", null), "a recording");
});

test("boardLabel treats a whitespace-only title as untitled", () => {
  assert.equal(boardLabel("  "), "untitled board");
  assert.equal(boardLabel("Sketchbook"), "Sketchbook");
});
