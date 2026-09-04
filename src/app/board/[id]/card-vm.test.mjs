import { test } from "node:test";
import assert from "node:assert/strict";
import { isCardType, isFlexSized } from "./card-vm.ts";

// WHAT A CARD CAN BE, and which kinds have a height worth storing.

test("the board renders exactly these six kinds of card", () => {
  for (const t of ["text", "drawing", "image", "audio", "pdf", "link"]) {
    assert.equal(isCardType(t), true, t);
  }
});

test("anything else is dropped rather than guessed at", () => {
  for (const t of ["note", "video", "", null, undefined]) assert.equal(isCardType(t), false);
});

test("S8 — text and audio have no height worth storing", () => {
  // Their card grows to fit: a text card follows its words, an audio card is the
  // player's own height. The renderer sets height:auto and resize writes only the
  // width back, so a stored height for these has never described anything. The
  // storage side and the render side must agree on this list, which is why it is
  // one function and not two matching conditions.
  assert.equal(isFlexSized("text"), true);
  assert.equal(isFlexSized("audio"), true);
});

test("everything else has a real height, and it is stored", () => {
  for (const t of ["image", "drawing", "pdf", "link"]) {
    assert.equal(isFlexSized(t), false, t);
  }
});
