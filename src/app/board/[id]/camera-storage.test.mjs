// Unit test for camera-storage.ts (Batch 1 — camera memory). No dependency — uses Node's
// built-in runner. The [id] dir's brackets confuse `node --test`'s glob, so run the file
// directly, quoted (from the repo root):  node 'src/app/board/[id]/camera-storage.test.mjs'
// It's a .mjs so the typecheck/Next build ignore it; the module it imports stays typed.
import { test } from "node:test";
import assert from "node:assert/strict";
import {
  cameraToAnchor,
  anchorToCamera,
  parseAnchor,
  loadAnchor,
  saveAnchor,
} from "./camera-storage.ts";

const size = { width: 800, height: 600 };

test("camera → anchor → camera round-trips exactly (in-range zoom)", () => {
  for (const cam of [
    { x: 0, y: 0, scale: 1 },
    { x: -120, y: 340, scale: 0.5 },
    { x: 55, y: -200, scale: 2.4 },
  ]) {
    const back = anchorToCamera(cameraToAnchor(cam, size), size);
    assert.ok(Math.abs(back.x - cam.x) < 1e-9, `x ${back.x} ≈ ${cam.x}`);
    assert.ok(Math.abs(back.y - cam.y) < 1e-9, `y ${back.y} ≈ ${cam.y}`);
    assert.equal(back.scale, cam.scale);
  }
});

test("anchor keeps the SAME world-point centred after a viewport resize (the whole point)", () => {
  const cam = { x: -120, y: 340, scale: 0.8 };
  const anchor = cameraToAnchor(cam, { width: 800, height: 600 });
  // Reopen on a phone-sized screen: the remembered world-point lands at the new centre.
  const smaller = { width: 375, height: 667 };
  const cam2 = anchorToCamera(anchor, smaller);
  const centreX = (smaller.width / 2 - cam2.x) / cam2.scale;
  const centreY = (smaller.height / 2 - cam2.y) / cam2.scale;
  assert.ok(Math.abs(centreX - anchor.cx) < 1e-9);
  assert.ok(Math.abs(centreY - anchor.cy) < 1e-9);
});

test("anchorToCamera clamps an out-of-range saved zoom", () => {
  assert.equal(anchorToCamera({ cx: 0, cy: 0, scale: 99 }, size).scale, 3);
  assert.equal(anchorToCamera({ cx: 0, cy: 0, scale: 0.001 }, size).scale, 0.2);
});

test("parseAnchor accepts a valid anchor and clamps its scale", () => {
  assert.deepEqual(parseAnchor('{"cx":10,"cy":20,"scale":1.5}'), { cx: 10, cy: 20, scale: 1.5 });
  assert.equal(parseAnchor('{"cx":0,"cy":0,"scale":50}').scale, 3);
});

test("parseAnchor rejects junk, missing fields, and non-finite numbers", () => {
  assert.equal(parseAnchor(null), null);
  assert.equal(parseAnchor(""), null);
  assert.equal(parseAnchor("not json"), null);
  assert.equal(parseAnchor("[1,2,3]"), null);
  assert.equal(parseAnchor('{"cx":0,"cy":0}'), null); // missing scale
  assert.equal(parseAnchor('{"cx":"x","cy":0,"scale":1}'), null); // wrong type
  assert.equal(parseAnchor('{"cx":null,"cy":0,"scale":1}'), null);
});

test("saveAnchor → loadAnchor round-trips through storage", () => {
  const store = new Map();
  globalThis.localStorage = {
    getItem: (k) => (store.has(k) ? store.get(k) : null),
    setItem: (k, v) => void store.set(k, String(v)),
    removeItem: (k) => void store.delete(k),
    clear: () => store.clear(),
    key: () => null,
    length: 0,
  };
  saveAnchor("board-abc", { cx: 12, cy: 34, scale: 1.25 });
  assert.deepEqual(loadAnchor("board-abc"), { cx: 12, cy: 34, scale: 1.25 });
  assert.equal(loadAnchor("nonexistent"), null);
  delete globalThis.localStorage;
});

test("loadAnchor returns null and saveAnchor stays silent when storage throws (privacy mode)", () => {
  globalThis.localStorage = {
    getItem: () => { throw new Error("SecurityError"); },
    setItem: () => { throw new Error("SecurityError"); },
    removeItem: () => {}, clear: () => {}, key: () => null, length: 0,
  };
  assert.equal(loadAnchor("board-x"), null);
  assert.doesNotThrow(() => saveAnchor("board-x", { cx: 0, cy: 0, scale: 1 }));
  delete globalThis.localStorage;
});
