// Unit tests for the pure undo stack (board-undo-technical-plan.md §2).
// From the repo root:  pnpm test   (or  node 'src/app/board/[id]/undo-stack.test.mjs')
import { test } from "node:test";
import assert from "node:assert/strict";
import { createUndoStack } from "./undo-stack.ts";

const retryable = () => "retryable";
const terminal = () => "terminal";
const noop = async () => {};
const entry = (label, over = {}) => ({ label, bitIds: ["b1"], undo: noop, redo: noop, ...over });

test("push caps at 20 (oldest drops) and clears the redo side", async () => {
  const s = createUndoStack(20);
  for (let i = 1; i <= 25; i++) s.push(entry(`act ${i}`));
  assert.equal(s.snapshot().undos.length, 20);
  assert.equal(s.snapshot().undos[0].label, "act 6"); // 1–5 fell off
  // build a redo entry, then push — redo must clear (a new act forks history)
  await s.undo(retryable);
  assert.equal(s.nextRedoLabel(), "act 25");
  s.push(entry("a fork"));
  assert.equal(s.nextRedoLabel(), null);
});

test("undo success moves the entry to redo; redo moves it back", async () => {
  const s = createUndoStack();
  const order = [];
  s.push(entry("move A", { undo: async () => order.push("undo"), redo: async () => order.push("redo") }));
  const r1 = await s.undo(retryable);
  assert.deepEqual(r1, { ok: true, label: "move A" });
  assert.equal(s.nextUndoLabel(), null);
  assert.equal(s.nextRedoLabel(), "move A");
  const r2 = await s.redo(retryable);
  assert.deepEqual(r2, { ok: true, label: "move A" });
  assert.equal(s.nextUndoLabel(), "move A");
  assert.deepEqual(order, ["undo", "redo"]);
});

test("retryable failure: the entry STAYS and a second press retries it", async () => {
  const s = createUndoStack();
  let attempts = 0;
  s.push(entry("tag x", {
    undo: async () => { attempts++; if (attempts === 1) throw new Error("offline"); },
  }));
  const r1 = await s.undo(retryable);
  assert.equal(r1.ok, false);
  assert.equal(r1.terminal, false);
  assert.equal(s.nextUndoLabel(), "tag x", "still there — the button can try again");
  const r2 = await s.undo(retryable);
  assert.equal(r2.ok, true);
  assert.equal(attempts, 2);
});

test("terminal failure: dead, and the next press runs the entry beneath", async () => {
  const s = createUndoStack();
  const ran = [];
  s.push(entry("older move", { undo: async () => ran.push("older") }));
  s.push(entry("remove B", { undo: async () => { throw new Error("TRASHED_BIT"); } }));
  const r1 = await s.undo(terminal);
  assert.equal(r1.ok, false);
  assert.equal(r1.terminal, true);
  assert.equal(s.nextUndoLabel(), "older move", "the corpse is skipped in the label");
  const r2 = await s.undo(retryable);
  assert.deepEqual(r2, { ok: true, label: "older move" });
  assert.deepEqual(ran, ["older"]);
});

test("markFailed: a failed act's entry never runs and never promotes", async () => {
  const s = createUndoStack();
  s.push(entry("older", { undo: noop }));
  const e = s.push(entry("failed act", { undo: async () => { throw new Error("must never run"); } }));
  s.markFailed(e);
  assert.equal(s.nextUndoLabel(), "older");
  const r = await s.undo(retryable);
  assert.deepEqual(r, { ok: true, label: "older" }, "the corpse was discarded, the live one ran");
  assert.equal(s.snapshot().redos.length, 1, "only the live entry promoted");
});

test("the busy latch: a second press mid-flight is ignored, not queued", async () => {
  const s = createUndoStack();
  let release;
  const gate = new Promise((res) => { release = res; });
  s.push(entry("slow", { undo: () => gate }));
  const p1 = s.undo(retryable);
  const r2 = await s.undo(retryable); // while the first is in flight
  assert.equal(r2, null);
  assert.equal(s.isBusy(), true);
  release();
  const r1 = await p1;
  assert.equal(r1.ok, true);
  assert.equal(s.isBusy(), false);
});

test("settled is awaited (settled-safe) BEFORE the reverse runs (D6)", async () => {
  const s = createUndoStack();
  const order = [];
  let release;
  const actWrite = new Promise((res) => { release = res; });
  s.push(entry("remove C", {
    settled: actWrite.then(() => order.push("act write landed")),
    undo: async () => order.push("reverse ran"),
  }));
  const p = s.undo(retryable);
  assert.deepEqual(order, [], "the reverse must wait for the act's own write");
  release();
  await p;
  assert.deepEqual(order, ["act write landed", "reverse ran"]);
});

test("a REJECTED settled does not block the reverse (settled-safe)", async () => {
  const s = createUndoStack();
  let ran = false;
  s.push(entry("remove D", {
    settled: Promise.reject(new Error("the act failed elsewhere")),
    undo: async () => { ran = true; },
  }));
  const r = await s.undo(retryable);
  assert.equal(r.ok, true);
  assert.equal(ran, true);
});

test("version() bumps on push, run, and state flips — the render mirror's food", async () => {
  const s = createUndoStack();
  const v0 = s.version();
  const e = s.push(entry("a"));
  assert.ok(s.version() > v0);
  const v1 = s.version();
  s.markFailed(e);
  assert.ok(s.version() > v1);
  const v2 = s.version();
  await s.undo(retryable); // discards the corpse — still a mutation
  assert.ok(s.version() > v2);
});
