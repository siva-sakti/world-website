import { test } from "node:test";
import assert from "node:assert/strict";

// THE SAVE GUARD — the one place that decides WHEN a debounced write gets forced out.
//
// Every surface that saves (cards, a note's words, titles, captions) registers its
// flush here, so what this file listens for is what the whole app gets. That makes the
// event list worth pinning: dropping one silently loses work on a whole class of
// departure, and reading the code cannot tell you an event never fires.
//
// There is no DOM in node, so window/document are stubbed BEFORE the module loads —
// it attaches its listeners on the first registerSave().

const handlers = { window: {}, document: {} };
const on = (bag) => (type, fn) => ((bag[type] ??= []).push(fn));
globalThis.window = { addEventListener: on(handlers.window) };
globalThis.document = { visibilityState: "visible", addEventListener: on(handlers.document) };

const { registerSave } = await import("./save-guard.ts");

const fire = (target, type) => (handlers[target][type] ?? []).forEach((f) => f());

test("the connection coming back retries a save that failed offline", () => {
  let saves = 0;
  const stop = registerSave(() => saves++);
  fire("window", "online");
  assert.equal(saves, 1, "an `online` event must run every registered flush");
  stop();
});

test("leaving the page still saves — closing, and switching apps", () => {
  let saves = 0;
  const stop = registerSave(() => saves++);

  fire("window", "pagehide");
  assert.equal(saves, 1, "pagehide: navigating away or closing the tab");

  globalThis.document.visibilityState = "hidden";
  fire("document", "visibilitychange");
  assert.equal(saves, 2, "hidden: switching apps or tabs — the phone case");

  globalThis.document.visibilityState = "visible";
  fire("document", "visibilitychange");
  assert.equal(saves, 2, "coming BACK to the tab must not force a write");
  stop();
});

test("one writer throwing never stops the others from saving", () => {
  const saved = [];
  const stopA = registerSave(() => { throw new Error("this one is broken"); });
  const stopB = registerSave(() => saved.push("b"));
  fire("window", "online");
  assert.deepEqual(saved, ["b"], "the second writer must still run");
  stopA(); stopB();
});

test("unregistering stops the flush — a closed board is not still saving", () => {
  let saves = 0;
  registerSave(() => saves++)();
  fire("window", "online");
  assert.equal(saves, 0);
});
