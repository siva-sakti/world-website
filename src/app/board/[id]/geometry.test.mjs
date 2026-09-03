// Unit tests for the pure board geometry (geometry-registry-plan.md §5 stage 1).
// From the repo root:  pnpm test
import { test } from "node:test";
import assert from "node:assert/strict";
import { boundsOf, snapTo } from "./geometry.ts";

const box = (x, y, w, h) => ({ x, y, w, h });

test("boundsOf: the union frames everything; empty board → null", () => {
  assert.equal(boundsOf([]), null);
  assert.deepEqual(boundsOf([box(10, 20, 100, 50)]), box(10, 20, 100, 50));
  assert.deepEqual(
    boundsOf([box(0, 0, 100, 100), box(300, -50, 60, 40)]),
    box(0, -50, 360, 150),
  );
});

test("snap: a left edge within threshold pulls onto the neighbour's left edge", () => {
  const r = snapTo(box(104, 300, 100, 80), [box(100, 0, 200, 100)], 6);
  assert.equal(r.x, 100, "snapped the 4px gap");
  assert.equal(r.y, 300, "y untouched — axes independent");
  assert.ok(r.vGuide, "a vertical guide appears");
  assert.equal(r.vGuide.at, 100);
  assert.equal(r.hGuide, null);
});

test("snap: centers align too (the reference's center-of-frame behaviour)", () => {
  // dragged center x = 150+50=200; other center x = 100+100=200 exactly? make it 3px off
  const r = snapTo(box(153, 300, 100, 80), [box(100, 0, 200, 100)], 6);
  assert.equal(r.x + 50, 200, "dragged center pulled onto the other's center");
});

test("snap: outside the threshold nothing moves and no guide draws", () => {
  const r = snapTo(box(110, 300, 100, 80), [box(100, 0, 200, 100)], 6);
  assert.equal(r.x, 110);
  assert.equal(r.vGuide, null);
});

test("snap: the NEAREST candidate wins", () => {
  // right edge (x+100) is 2px from other's left (200); left edge is 5px from other's left? craft:
  // dragged at x=198: left→200 is 2 away; right(298)→300 (other right) is 2 away — tie keeps first.
  // Simpler: two others, one 5px off, one 1px off — the 1px one wins.
  const r = snapTo(box(105, 300, 100, 80), [box(100, 0, 50, 50), box(106, 200, 50, 50)], 6);
  assert.equal(r.x, 106, "the 1px candidate beat the 5px one");
});

test("snap: both axes can snap at once, to different neighbours", () => {
  const r = snapTo(box(103, 202, 100, 80), [box(100, 0, 50, 50), box(0, 200, 50, 50)], 6);
  assert.equal(r.x, 100, "x to the first neighbour");
  assert.equal(r.y, 200, "y to the second");
  assert.ok(r.vGuide && r.hGuide);
});

test("snap: the guide extends past BOTH boxes (the reference's long magenta line)", () => {
  const r = snapTo(box(104, 300, 100, 80), [box(100, 0, 200, 100)], 6);
  assert.ok(r.vGuide.from < 0, "starts above the neighbour's top");
  assert.ok(r.vGuide.to > 380, "ends below the dragged card's bottom");
});

test("snap: no neighbours → identity", () => {
  const r = snapTo(box(104, 300, 100, 80), [], 6);
  assert.deepEqual([r.x, r.y, r.vGuide, r.hGuide], [104, 300, null, null]);
});

// PROXIMITY beats tidiness (owner, 2026-09-02: it should snap "to the closest things it
// is to when you drag it"). Everything within the threshold already looks aligned once
// snapped, so a slightly-better delta must not drag a guide across the board.

test("snap: the NEAR card wins over a better-aligned FAR one", () => {
  const dragged = box(100, 100, 50, 50);
  const near = box(104, 160, 50, 50); // 4px off, sitting right below
  const far = box(101, 3000, 50, 50); // 1px off — tidier, but miles away
  const r = snapTo(dragged, [far, near], 6);
  assert.equal(r.x, 104, "it lines up with the neighbour you are actually beside");
  assert.ok(r.vGuide.to < 1000, "and the guide does not stretch off to the distant card");
});

test("snap: at equal distance, the tighter alignment breaks the tie", () => {
  const dragged = box(100, 100, 50, 50);
  // both centres are exactly 200 away, one on each side
  const left = box(97, -100, 50, 50);
  const right = box(101, 300, 50, 50);
  const r = snapTo(dragged, [left, right], 6);
  assert.equal(r.x, 101, "1px off beats 3px off when neither is nearer");
});
