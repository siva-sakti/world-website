// Unit tests for the pure arrangement geometry (undo plan §4).
// From the repo root:  pnpm test
import { test } from "node:test";
import assert from "node:assert/strict";
import { groupDragPatches, tidyPatches, nextZ, backZ } from "./board-arrange.ts";

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
