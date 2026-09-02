import { test } from "node:test";
import assert from "node:assert/strict";
import { runLegs, countLabel, trashOneConfirm, trashManyConfirm } from "./act-rules.ts";

// THE SURVIVOR RULE (antagonist D4) — the rule that used to live twice, untested, in
// the two act layers. These lock the behaviour the reverses depend on.

test("runLegs: every leg runs, even after one throws", async () => {
  const ran = [];
  await runLegs([
    async () => { ran.push("a"); },
    async () => { ran.push("b"); throw new Error("boom"); },
    async () => { ran.push("c"); },
  ]);
  assert.deepEqual(ran, ["a", "b", "c"], "a failing leg must not abort its neighbours");
});

test("runLegs: survives when SOME legs fail — no throw", async () => {
  let landed = 0;
  await runLegs([
    async () => { throw new Error("gone"); },
    async () => { landed++; },
  ]);
  assert.equal(landed, 1, "the surviving leg still ran, and nothing threw");
});

test("runLegs: throws the FIRST error when EVERY leg fails", async () => {
  await assert.rejects(
    () =>
      runLegs([
        async () => { throw new Error("first"); },
        async () => { throw new Error("second"); },
      ]),
    /first/,
    "the first failure is the one reported — not the last",
  );
});

test("runLegs: no legs is a success, not a throw", async () => {
  await runLegs([]); // must not reject
});

test("runLegs: a single failure among several does not throw", async () => {
  let landed = 0;
  await runLegs([
    async () => { landed++; },
    async () => { throw new Error("x"); },
    async () => { landed++; },
  ]);
  assert.equal(landed, 2);
});

test("runLegs: legs run in order, one at a time", async () => {
  const order = [];
  await runLegs([
    async () => { order.push("start-1"); await Promise.resolve(); order.push("end-1"); },
    async () => { order.push("start-2"); await Promise.resolve(); order.push("end-2"); },
  ]);
  assert.deepEqual(order, ["start-1", "end-1", "start-2", "end-2"], "sequential, never interleaved");
});

// LABELS — the singular/plural switch that was open-coded at four call sites.

test("countLabel: singular says 'card', never '1 card'", () => {
  assert.equal(countLabel("move", 1), "move card");
  assert.equal(countLabel("trash", 1), "trash card");
});

test("countLabel: plural counts", () => {
  assert.equal(countLabel("move", 3), "move 3 cards");
  assert.equal(countLabel("trash", 12), "trash 12 cards");
});

test("countLabel: the suffix form matches the un-place wording exactly", () => {
  assert.equal(countLabel("remove", 1, "from board"), "remove card from board");
  assert.equal(countLabel("remove", 4, "from board"), "remove 4 cards from board");
});

test("countLabel: zero reads as plural", () => {
  assert.equal(countLabel("move", 0), "move 0 cards");
});

// THE TRASH CONFIRM — wording pinned verbatim. These tests exist so a future tidy-up
// can't quietly reword a destructive confirm; the owner writes this copy, not Claude.

test("trashConfirm (one card, one board): the plain sentence", () => {
  assert.equal(
    trashOneConfirm(1),
    "Move this card to the trash? Hidden everywhere, restorable from Trash.",
  );
});

test("trashConfirm (one card, several boards): says how many boards", () => {
  assert.equal(
    trashOneConfirm(3),
    "This card is on 3 boards — trashing removes it from all of them (restorable from Trash). Continue?",
  );
});

test("trashConfirm (bulk, none shared): counts the cards", () => {
  assert.equal(
    trashManyConfirm(5, 0),
    "Trash 5 cards? Hidden everywhere, restorable from Trash.",
  );
});

test("trashConfirm (bulk, some shared): names how many are shared", () => {
  assert.equal(
    trashManyConfirm(5, 2),
    "Trash 5 cards? 2 of them also live on other boards — this removes them from all of them (restorable from Trash).",
  );
});

test("trashConfirm (bulk of exactly one) keeps its own singular", () => {
  assert.equal(
    trashManyConfirm(1, 0),
    "Trash 1 card? Hidden everywhere, restorable from Trash.",
  );
});

test("the two doors genuinely differ for one card — a known inconsistency, pinned", () => {
  // Not a bug being introduced: this is what the app does TODAY, preserved through the
  // collapse. Unifying it is a copy decision, logged on the wording checklist.
  assert.notEqual(trashOneConfirm(1), trashManyConfirm(1, 0));
});
