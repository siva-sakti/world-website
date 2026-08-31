// Unit test for placement-anchor.ts (Batch 2 — send to board). No dependency; Node's built-in
// runner. Run directly (from the repo root):  node 'src/app/bits/placement-anchor.test.mjs'
import { test } from "node:test";
import assert from "node:assert/strict";
import { anchorNearContent, pointForIndex } from "./placement-anchor.ts";

test("empty board → near-origin default", () => {
  assert.deepEqual(anchorNearContent([]), { x: 40, y: 40 });
});

test("all pile-mode (null position) cards → default, NOT -Infinity", () => {
  const anchor = anchorNearContent([
    { x: null, y: null, width: null },
    { x: null, y: null, width: 200 },
  ]);
  assert.deepEqual(anchor, { x: 40, y: 40 });
  assert.ok(Number.isFinite(anchor.x) && Number.isFinite(anchor.y));
});

test("one card → just right of its right edge, aligned to its top", () => {
  // x 100 + width 200 = right edge 300; + GAP 48 = 348. top = y 50.
  assert.deepEqual(anchorNearContent([{ x: 100, y: 50, width: 200 }]), { x: 348, y: 50 });
});

test("null width is coalesced to the default (the key bug) — not treated as zero", () => {
  // right edge = 100 + 240 (default) = 340; + 48 = 388. If width were read as 0 → 148 (on top).
  assert.deepEqual(anchorNearContent([{ x: 100, y: 50, width: null }]), { x: 388, y: 50 });
});

test("cluster → widest right edge, highest top", () => {
  const anchor = anchorNearContent([
    { x: 0, y: 200, width: 100 }, // right 100
    { x: 300, y: 80, width: 150 }, // right 450 (widest), top 80 (highest)
    { x: 120, y: 500, width: null }, // right 120+240=360
  ]);
  assert.deepEqual(anchor, { x: 450 + 48, y: 80 });
});

test("pointForIndex cascades distinct points down-right; i=0 is the anchor itself", () => {
  const a = { x: 348, y: 50 };
  assert.deepEqual(pointForIndex(a, 0), { x: 348, y: 50 });
  assert.deepEqual(pointForIndex(a, 1), { x: 388, y: 90 });
  assert.deepEqual(pointForIndex(a, 3), { x: 468, y: 170 });
  // no two arrivals share a point
  const pts = [0, 1, 2, 3, 4].map((i) => JSON.stringify(pointForIndex(a, i)));
  assert.equal(new Set(pts).size, pts.length);
});
