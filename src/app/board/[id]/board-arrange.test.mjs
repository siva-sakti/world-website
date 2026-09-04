// Unit tests for the pure arrangement geometry (undo plan §4).
// From the repo root:  pnpm test
import { test } from "node:test";
import assert from "node:assert/strict";
import { groupDragPatches, tidyPatches, nextZ, backZ, firstClearSpot, alignPatches, distributePatches } from "./board-arrange.ts";
import { visualBox } from "./geometry.ts";

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

// ---- ALIGN & DISTRIBUTE (card-alignment-spec.md §3 A1-A6) ----
// The owner's "PowerPoint buttons". Locked cards never reach these — the caller filters
// them out, exactly as it does for tidy (owner ruling: "cards have to be unlocked to align").

const m = (bitId, x, y, w, h) => ({
  card: { bitId, placementId: "p-" + bitId, x, y, z: 0 },
  w,
  h,
});
const xOf = (patches, bitId) => patches.find((p) => p.bitId === bitId)?.x;
const yOf = (patches, bitId) => patches.find((p) => p.bitId === bitId)?.y;

test("A1 align left: every left edge matches, and the leftmost card does not move", () => {
  const cards = [m("a", 100, 0, 50, 50), m("b", 20, 80, 90, 40), m("c", 300, 160, 30, 30)];
  const out = alignPatches(cards, "left");
  assert.equal(xOf(out, "a"), 20);
  assert.equal(xOf(out, "c"), 20);
  assert.equal(out.find((p) => p.bitId === "b"), undefined, "b was already leftmost — no patch");
});

test("A2 align centre matches CENTRES, so different widths are not edge-matched", () => {
  // box spans x 0..200, so the midline is 100
  const cards = [m("wide", 0, 0, 200, 20), m("narrow", 60, 50, 20, 20)];
  const out = alignPatches(cards, "hcenter");
  assert.equal(xOf(out, "narrow"), 90, "a 20-wide card centred on 100 starts at 90");
  assert.notEqual(xOf(out, "narrow"), 0, "centre alignment is not left alignment");
});

test("align right matches RIGHT edges, not positions", () => {
  const cards = [m("a", 0, 0, 100, 20), m("b", 0, 50, 40, 20)];
  const out = alignPatches(cards, "right");
  assert.equal(xOf(out, "b"), 60, "40-wide card must end at 100, so it starts at 60");
});

test("align top / bottom / middle move y and leave x alone", () => {
  const cards = [m("a", 5, 0, 20, 100), m("b", 77, 70, 20, 20)];
  assert.equal(yOf(alignPatches(cards, "top"), "b"), 0);
  assert.equal(yOf(alignPatches(cards, "bottom"), "b"), 80, "must END at 100");
  assert.equal(yOf(alignPatches(cards, "vmiddle"), "b"), 40, "box midline 50, minus half of 20");
  assert.equal(alignPatches(cards, "top").find((p) => p.bitId === "b").x, 77, "x untouched");
});

test("a card ALREADY on the target produces no patch — so undo reverses only real moves", () => {
  // b spans 40..60 inside a's 0..100: its centre is already the box midline.
  const cards = [m("a", 5, 0, 20, 100), m("b", 77, 40, 20, 20)];
  const out = alignPatches(cards, "vmiddle");
  assert.equal(out.find((p) => p.bitId === "b"), undefined);
});

test("A4/A5 fewer than two cards is a no-op, and only real moves are returned", () => {
  assert.deepEqual(alignPatches([m("solo", 0, 0, 10, 10)], "left"), []);
  assert.deepEqual(alignPatches([], "left"), []);
  const already = [m("a", 30, 0, 10, 10), m("b", 30, 90, 10, 10)];
  assert.deepEqual(alignPatches(already, "left"), [], "already aligned → nothing to undo");
});

test("A3 distribute evens the GAPS, and the outermost two never move", () => {
  // 10-wide cards at 0, 15, 100 → span 0..110, occupied 30, so gap = (110-30)/2 = 40
  const cards = [m("a", 0, 0, 10, 10), m("b", 15, 0, 10, 10), m("c", 100, 0, 10, 10)];
  const out = distributePatches(cards, "h");
  assert.equal(out.length, 1, "only the middle card moves");
  assert.equal(xOf(out, "b"), 50, "0 + 10 + 40");
});

test("distribute equalises AIR, not origins — different widths prove it", () => {
  // widths 10, 60, 10 at 0, 20, 200 → span 210, occupied 80, gap = 65
  const cards = [m("a", 0, 0, 10, 10), m("fat", 20, 0, 60, 10), m("c", 200, 0, 10, 10)];
  const out = distributePatches(cards, "h");
  assert.equal(xOf(out, "fat"), 75, "0 + 10 + 65");
  // the gap after the fat card is 200 - (75 + 60) = 65 — equal
  assert.equal(200 - (75 + 60), 65);
});

test("distribute works vertically and leaves x alone", () => {
  const cards = [m("a", 9, 0, 10, 10), m("b", 9, 5, 10, 10), m("c", 9, 100, 10, 10)];
  const out = distributePatches(cards, "v");
  assert.equal(yOf(out, "b"), 50);
  assert.equal(out.find((p) => p.bitId === "b").x, 9);
});

test("distribute needs three — two cards have nothing between them", () => {
  assert.deepEqual(distributePatches([m("a", 0, 0, 10, 10), m("b", 90, 0, 10, 10)], "h"), []);
});

test("distribute takes them in POSITION order, not the order they were selected", () => {
  const cards = [m("c", 100, 0, 10, 10), m("a", 0, 0, 10, 10), m("b", 15, 0, 10, 10)];
  assert.equal(xOf(distributePatches(cards, "h"), "b"), 50, "same answer as when sorted");
});

// ---- aligning a card you have TURNED (owner-reported 2026-09-04) ----
//
// NOTE ON THESE FIXTURES: the first version of them passed even with the fix reverted,
// because the upright card was leftmost either way — so the tilted card's visible box
// never decided anything. They only test the change if the TILTED card is the one whose
// visible edge sets the line. Found by reverting the fix and watching them stay green.

test("a tilted card's VISIBLE edge sets the line the others align to", () => {
  // The tilted card sits at x=100 but leans out past it, so what you SEE starts left of
  // 100. Align-left must use that visible edge, not the stored corner behind it.
  const tilted = { bitId: "b", placementId: "pb", x: 100, y: 0, z: 2, angle: 30 };
  const upright = { bitId: "a", placementId: "pa", x: 400, y: 0, z: 1 };
  const measured = [
    { card: tilted, w: 200, h: 100 },
    { card: upright, w: 200, h: 100 },
  ];
  const visibleLeft = visualBox({ x: 100, y: 0, w: 200, h: 100 }, 30).x;
  assert.ok(visibleLeft < 100, "the tilted card must actually lean out past its stored x");

  const patch = alignPatches(measured, "left").find((p) => p.bitId === "a");
  assert.ok(patch, "the upright card moves to the line");
  assert.ok(
    Math.abs(patch.x - visibleLeft) < 0.001,
    `upright card should land on the tilted card's visible edge (${visibleLeft}), got ${patch.x}`,
  );
});

test("a tilted card being aligned lands its visible edge on the line", () => {
  const upright = { bitId: "a", placementId: "pa", x: 100, y: 0, z: 1 };
  const tilted = { bitId: "b", placementId: "pb", x: 500, y: 0, z: 2, angle: 30 };
  const measured = [
    { card: upright, w: 200, h: 100 },
    { card: tilted, w: 200, h: 100 },
  ];
  const patch = alignPatches(measured, "left").find((p) => p.bitId === "b");
  assert.ok(patch, "the tilted card must be moved at all — it used to be skipped upstream");
  const after = visualBox({ x: patch.x, y: patch.y, w: 200, h: 100 }, 30);
  assert.ok(Math.abs(after.x - 100) < 0.001, `visible left edge: ${after.x}, expected 100`);
});

test("distribute evens out the gaps you SEE, not the ones behind the tilt", () => {
  const mk = (id, x, angle) => ({
    card: { bitId: id, placementId: `p${id}`, x, y: 0, z: 1, angle },
    w: 100,
    h: 100,
  });
  // The middle card is turned 45°, so it takes up much more visible width than 100.
  const measured = [mk("a", 0), mk("b", 300, 45), mk("c", 700)];
  const patch = distributePatches(measured, "h").find((p) => p.bitId === "b");
  assert.ok(patch, "the middle card moves");

  const seenBox = (p, angle) => visualBox({ x: p, y: 0, w: 100, h: 100 }, angle);
  const gapLeft = seenBox(patch.x, 45).x - 100;                       // a's right edge is 100
  const gapRight = 700 - (seenBox(patch.x, 45).x + seenBox(patch.x, 45).w);
  assert.ok(Math.abs(gapLeft - gapRight) < 0.001, `gaps must match: ${gapLeft} vs ${gapRight}`);
});

test("upright cards align exactly as before — the tilt change touched nothing else", () => {
  const measured = [
    { card: { bitId: "a", placementId: "pa", x: 100, y: 10, z: 1 }, w: 200, h: 100 },
    { card: { bitId: "b", placementId: "pb", x: 340, y: 60, z: 2 }, w: 150, h: 80 },
    { card: { bitId: "c", placementId: "pc", x: 700, y: 20, z: 3 }, w: 120, h: 90 },
  ];
  assert.deepEqual(alignPatches(measured, "left").map((p) => p.x), [100, 100]);
  assert.deepEqual(alignPatches(measured, "top").map((p) => p.y), [10, 10]);
});
