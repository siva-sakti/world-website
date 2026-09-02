// Unit tests for the pure arrangement geometry (undo plan §4).
// From the repo root:  pnpm test
import { test } from "node:test";
import assert from "node:assert/strict";
import { groupDragPatches, tidyPatches, nextZ, backZ, firstClearSpot } from "./board-arrange.ts";

const card = (bitId, placementId, x, y, z = 0) => ({ bitId, placementId, x, y, z });

test("group drag: followers move by the dragged card's delta, keyed by BIT id", () => {
  // THE a447a95 REGRESSION: bitIds and placementIds are disjoint uuid spaces; the
  // old readers looked placementIds up in a bitId-keyed map and never matched, so
  // multi-select drag silently moved only the grabbed card.
  const cards = [card("bA", "p1", 0, 0), card("bB", "p2", 100, 50), card("bC", "p3", 500, 500)];
  const starts = new Map([["bA", { x: 0, y: 0 }], ["bB", { x: 100, y: 50 }]]); // bC unselected
  const patches = groupDragPatches(cards, starts, "bA", 30, -10);
  assert.deepEqual(patches, [{ bitId: "bB", placementId: "p2", x: 130, y: 40 }]);
  // the dragged card is excluded (react-rnd owns it until stop); bC untouched
  assert.ok(!patches.some((p) => p.bitId === "bA" || p.bitId === "bC"));
});

test("group drag: a locked card (absent from starts) never moves", () => {
  const cards = [card("bA", "p1", 0, 0), card("bL", "pL", 10, 10)];
  const starts = new Map([["bA", { x: 0, y: 0 }]]); // the lock filter kept bL out
  assert.deepEqual(groupDragPatches(cards, starts, "bA", 5, 5), []);
});

test("tidy: banded reading order — visually-level cards keep left-to-right", () => {
  // b is 30px lower than a (same visual row, inside the 40px band) but further left;
  // raw (y,x) sorting would put b first — banding keeps a,b as one row read left→right.
  const meas = [
    { card: card("a", "pa", 100, 0), w: 50, h: 40 },
    { card: card("b", "pb", 0, 30), w: 50, h: 40 },
    { card: card("c", "pc", 0, 200), w: 50, h: 40 },
  ];
  const patches = tidyPatches(meas);
  const byBit = Object.fromEntries(patches.map((p) => [p.bitId, p]));
  // top-left anchor is (0, 0); cell = 66x56; reading order b, a, c → 2 cols
  assert.equal(byBit.b.x, 0);
  assert.equal(byBit.a.x, 66);
  assert.equal(byBit.a.y, 0);
  assert.equal(byBit.c.y, 56);
});

test("tidy: no-op positions are skipped — an undo entry reverses only real moves", () => {
  const meas = [
    { card: card("a", "pa", 0, 0), w: 50, h: 40 },   // already at its grid spot
    { card: card("b", "pb", 300, 7), w: 50, h: 40 },
  ];
  const patches = tidyPatches(meas);
  assert.ok(!patches.some((p) => p.bitId === "a"), "a didn't move — no patch, no undo noise");
  assert.ok(patches.some((p) => p.bitId === "b"));
});

test("tidy: fewer than two cards is a no-op", () => {
  assert.deepEqual(tidyPatches([{ card: card("a", "pa", 5, 5), w: 10, h: 10 }]), []);
});

test("z helpers: front is above everything, back below everything", () => {
  const cs = [{ z: 3 }, { z: -2 }, { z: 7 }];
  assert.equal(nextZ(cs), 8);
  assert.equal(backZ(cs), -3);
  assert.equal(nextZ([]), 1);
  assert.equal(backZ([]), -1);
});

// ---- firstClearSpot: the look-then-place rule (lifted out of use-create-doors, where
// it could only ever be checked by dropping files onto a board by hand) ----

const WIDE = { minX: -10000, minY: -10000, maxX: 10000, maxY: 10000 }; // everything visible
const box = (x, y, w, h) => ({ x, y, w, h });

test("clear-spot: an empty board places at the start point, untouched", () => {
  const r = firstClearSpot({ w: 100, h: 50 }, { x: 200, y: 300 }, [], WIDE);
  assert.deepEqual(r, { x: 200, y: 300 });
});

test("clear-spot: an occupied start steps DOWN-RIGHT until clear", () => {
  // A 100x50 card at the origin. The 12px margin pushes its exclusion zone to 62 tall,
  // so step 1 (36,36) is STILL inside it and step 2 (72,72) is the first clear one.
  // Written down because "it moves one step" is the intuitive-but-wrong answer, and the
  // margin is exactly the part a future tidy-up would be tempted to drop.
  const r = firstClearSpot({ w: 100, h: 50 }, { x: 0, y: 0 }, [box(0, 0, 100, 50)], WIDE);
  assert.deepEqual(r, { x: 72, y: 72 });
});

test("clear-spot: the 12px margin counts — touching is NOT clear", () => {
  // a card ending at x=100; a spot starting at x=105 is only 5px away, inside the margin
  const r = firstClearSpot({ w: 50, h: 50 }, { x: 105, y: 0 }, [box(0, 0, 100, 50)], WIDE);
  assert.notDeepEqual(r, { x: 105, y: 0 }, "5px of gap is less than the 12px the rule demands");
});

test("clear-spot: PREFERS a visible spot over a clear-but-offscreen one", () => {
  // The first two steps are clear but outside the view; the third is clear AND inside.
  const view = { minX: 72, minY: 72, maxX: 1000, maxY: 1000 };
  const r = firstClearSpot({ w: 10, h: 10 }, { x: 0, y: 0 }, [], view);
  assert.deepEqual(r, { x: 72, y: 72 }, "it skips the offscreen candidates rather than taking the first clear one");
});

test("clear-spot: falls back to a clear-but-offscreen spot when nothing is visible", () => {
  const view = { minX: 5000, minY: 5000, maxX: 6000, maxY: 6000 }; // the view is far away
  const r = firstClearSpot({ w: 10, h: 10 }, { x: 0, y: 0 }, [], view);
  assert.deepEqual(r, { x: 0, y: 0 }, "better to place somewhere clear than nowhere");
});

test("clear-spot: gives up (null) when every one of the 24 steps is blocked", () => {
  // a wall of cards down the diagonal the search walks
  const wall = [];
  for (let i = 0; i < 24; i++) wall.push(box(i * 36, i * 36, 100, 100));
  const r = firstClearSpot({ w: 100, h: 100 }, { x: 0, y: 0 }, wall, WIDE);
  assert.equal(r, null, "the caller's own last-resort cascade takes over");
});

test("clear-spot: a card that does not lie on the search diagonal never blocks it", () => {
  const r = firstClearSpot({ w: 50, h: 50 }, { x: 0, y: 0 }, [box(900, 900, 50, 50)], WIDE);
  assert.deepEqual(r, { x: 0, y: 0 });
});
