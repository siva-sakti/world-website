import { test } from "node:test";
import assert from "node:assert/strict";
import { trashConfirmMessage } from "./trash-message.ts";

// ONE trash question, pinned. Before this the same act asked five different ones across
// /write, /bit/[id], the board (single + bulk) and /bits — three nouns, three different
// reassurances. These are the owner's words; a future tidy-up must not reword them by
// accident, and a destructive prompt is the last place drift is acceptable.

test("one thing, not on several boards: the plain sentence", () => {
  assert.equal(
    trashConfirmMessage({ noun: "bit" }),
    "Move this bit to the trash? Hidden everywhere, restorable from Trash.",
  );
});

test("the noun comes from the CALLER — a card, a bit and a note are the same act", () => {
  assert.match(trashConfirmMessage({ noun: "card" }), /^Move this card to the trash\?/);
  assert.match(trashConfirmMessage({ noun: "note" }), /^Move this note to the trash\?/);
});

test("one thing on SEVERAL boards: warns that it leaves all of them", () => {
  assert.equal(
    trashConfirmMessage({ noun: "card", onBoards: 3 }),
    "This card is on 3 boards — trashing removes it from all of them (restorable from Trash). Continue?",
  );
});

test("one board is not 'several' — no warning", () => {
  assert.match(trashConfirmMessage({ noun: "card", onBoards: 1 }), /^Move this card to the trash\?/);
});

test("many things: counts them", () => {
  assert.equal(
    trashConfirmMessage({ count: 4, noun: "bit" }),
    "Trash 4 bits? Hidden everywhere, restorable from Trash.",
  );
});

test("many things, some shared: says how many are shared", () => {
  assert.equal(
    trashConfirmMessage({ count: 4, noun: "card", shared: 2 }),
    "Trash 4 cards? 2 of them also live on other boards — this removes them from all of them (restorable from Trash).",
  );
});

test("a bulk selection of exactly one falls back to the single sentence", () => {
  assert.match(trashConfirmMessage({ count: 1, noun: "bit" }), /^Move this bit to the trash\?/);
});
