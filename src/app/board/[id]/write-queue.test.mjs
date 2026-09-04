import { test } from "node:test";
import assert from "node:assert/strict";
import { makeWriteQueue, newQueueState } from "./write-queue.ts";

// THE BOARD'S SAVE QUEUE, driven for real against fake doors.
//
// Cards get dragged, resized and typed into constantly, so every write is debounced,
// coalesced per card, made to wait for the card's create, and chained per row. All of
// that is timing — the one shape reading alone cannot check. Once the five db calls
// are passed IN rather than imported (see write-queue.ts's WriteDoors, the same move
// remove-acts.ts made), the whole queue can be driven here.
//
// Nothing touches Supabase. The fakes record what WOULD have been written, and each
// call can be left hanging so a test can decide when — and whether — it lands.
//
// The tests marked ⚠ were written BEFORE the fix and failed on purpose — they are the
// evidence for four live bugs (P1 P2 P5 P6). They pass as of the queue redesign; each
// one keeps failing forever if the bug is ever reintroduced, which is the point of them.

/** Let every already-queued microtask run. */
const tick = () => new Promise((r) => setImmediate(r));
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

const snap = (v) => (v && typeof v === "object" && !Array.isArray(v) ? { ...v } : v);

/** A whole fake board's persistence. Every door call is recorded; a door named in
 *  `manual` HANGS until the test resolves or rejects it (the set is live, so a test
 *  can hold the first write and let the rest through). */
function harness({ debounceMs } = {}) {
  const calls = [];
  const errors = [];
  const manual = new Set();
  let cards = [];

  const door = (fn) => (...args) => {
    let resolve, reject;
    const promise = new Promise((res, rej) => { resolve = res; reject = rej; });
    const rec = { fn, args: args.map(snap), resolve, reject };
    calls.push(rec);
    if (!manual.has(fn)) resolve();
    return promise;
  };

  const doors = {
    updatePlacement: door("updatePlacement"),
    updateBitBody: door("updateBitBody"),
    updateBitContent: door("updateBitContent"),
    reconcileReferences: door("reconcileReferences"),
    extractRefIds: () => [],
  };

  const q = makeWriteQueue(
    newQueueState(),
    {}, // the fakes never touch supabase
    (fn) => { cards = fn(cards); },
    (e) => errors.push(e),
    doors,
    debounceMs,
  );

  return { q, calls, errors, manual, of: (fn) => calls.filter((c) => c.fn === fn) };
}

// ---- ⚠ THE TWO KNOWN BUGS ----

test("⚠ a failed drag must not overwrite a later drag that saved (the card teleports back on reload)", async () => {
  // flush() captures-at-fire: it deletes the pending entry BEFORE awaiting. On failure
  // it puts the OLD values back — but by then a newer flush may already have landed
  // newer ones, so the put-back re-queues a stale position that flushAll then writes
  // over the good one. No error is ever shown: the newer write succeeded.
  const h = harness();
  h.manual.add("updatePlacement");

  h.q.patchCard("p1", "b1", { x: 1 });
  const first = h.q.flushNow("p1");
  await tick();

  h.q.patchCard("p1", "b1", { x: 2 });
  const second = h.q.flushNow("p1"); // chains behind the first
  await tick();

  h.manual.delete("updatePlacement"); // from here everything lands
  h.calls[0].reject(new Error("network down")); // the FIRST drag fails
  await Promise.allSettled([first, second]);
  await h.q.flushAll();

  const xs = h.of("updatePlacement").map((c) => c.args[2].x);
  assert.equal(xs[xs.length - 1], 2, `the newer position must be the one left in the database — writes were ${JSON.stringify(xs)}`);
  assert.deepEqual(xs.slice(xs.lastIndexOf(2) + 1), [], "nothing may be written after the position that already landed");
});

test("⚠ a failed title, then a nudge to the card, must still be retried (the title vanishes while the banner says it is safe)", async () => {
  // restorePending() is typed { bitId, placement, body } and merges only those two.
  // When something is ALREADY pending for the card, the failed patch's `content` is
  // merged away — the title is dropped with no retry and no second banner.
  const h = harness();
  h.manual.add("updateBitContent");

  h.q.saveContent("p1", "b1", "My title");
  const flushed = h.q.flushNow("p1");
  await tick();

  h.q.patchCard("p1", "b1", { x: 40 }); // the owner nudges the card while the title is in flight

  h.manual.delete("updateBitContent");
  h.calls[0].reject(new Error("network down"));
  await flushed;
  await h.q.flushAll();

  const titles = h.of("updateBitContent").map((c) => c.args[2]);
  assert.deepEqual(titles, ["My title", "My title"], "the title must be written again — a failed title is retried like a failed position");
});

test("the boundary: with nothing else queued, a failed title IS retried (so the drop above is specific to the merge)", async () => {
  const h = harness();
  h.manual.add("updateBitContent");

  h.q.saveContent("p1", "b1", "My title");
  const flushed = h.q.flushNow("p1");
  await tick();

  h.manual.delete("updateBitContent");
  h.calls[0].reject(new Error("network down"));
  await flushed;
  await h.q.flushAll();

  const titles = h.of("updateBitContent").map((c) => c.args[2]);
  assert.deepEqual(titles, ["My title", "My title"], "restorePending's no-current-entry path stores the captured patch whole, content included");
});

// ---- what the queue already gets right ----

test("a failed drag is written again when you leave the board (the position is not lost)", async () => {
  const h = harness();
  h.manual.add("updatePlacement");

  h.q.patchCard("p1", "b1", { x: 5, y: 6 });
  const flushed = h.q.flushNow("p1");
  await tick();

  h.manual.delete("updatePlacement");
  h.calls[0].reject(new Error("network down"));
  assert.equal(await flushed, false, "flushNow must say the position did NOT land");
  await h.q.flushAll();

  const writes = h.of("updatePlacement");
  assert.equal(writes.length, 2, "the failed position is put back and retried");
  assert.deepEqual(writes[1].args[2], { x: 5, y: 6 });
  assert.equal(h.errors.length, 1, "and the owner was told, once");
});

test("two saves to the same card land in the order they were made (a stalled save can't revert a later one)", async () => {
  const h = harness();
  h.manual.add("updatePlacement");

  h.q.patchCard("p1", "b1", { x: 1 });
  const first = h.q.flushNow("p1");
  await tick();

  h.q.patchCard("p1", "b1", { x: 2 });
  const second = h.q.flushNow("p1");
  await tick();

  assert.equal(h.of("updatePlacement").length, 1, "the second save must not co-fire on the wire with the first");

  h.calls[0].resolve();
  await tick();
  assert.equal(h.of("updatePlacement").length, 2, "it goes out only once the first has settled");
  h.of("updatePlacement")[1].resolve();
  await Promise.all([first, second]);

  assert.deepEqual(h.of("updatePlacement").map((c) => c.args[2].x), [1, 2], "capture order, on the wire");
});

test("a save waits for the card's row to exist (a drop-then-drag must not write to nothing)", async () => {
  const h = harness();
  let landRow;
  h.q.trackCreate("p1", new Promise((r) => { landRow = r; }));

  h.q.patchCard("p1", "b1", { x: 9 });
  const flushed = h.q.flushNow("p1");
  await tick();
  assert.deepEqual(h.of("updatePlacement"), [], "a placement update to a not-yet-created row matches 0 rows and loses the move");

  landRow();
  assert.equal(await flushed, true);
  assert.equal(h.of("updatePlacement").length, 1, "the drag is written once the row is there");
});

test("removing a card drops its queued save (it can't teleport back after you call it in again)", async () => {
  const h = harness({ debounceMs: 5 });
  h.q.patchCard("p1", "b1", { x: 3 });
  h.q.forget("p1");

  await sleep(25); // the debounce would have fired by now
  await h.q.flushAll();
  assert.deepEqual(h.calls, [], "the queued position is gone — timer cancelled, patch dropped");
});

test("a failed reference index does not lose the words you typed (no banner, no re-write)", async () => {
  const h = harness();
  h.manual.add("reconcileReferences");

  h.q.patchCard("p1", "b1", { body: "<p>hello</p>" });
  const flushed = h.q.flushNow("p1");
  await tick();

  h.of("reconcileReferences")[0].reject(new Error("index down"));
  assert.equal(await flushed, true, "the body IS saved — the gate must not refuse a remove over an index that self-heals");
  assert.deepEqual(h.errors, [], "and no banner, which would lie about words that landed");

  await h.q.flushAll();
  assert.equal(h.of("updateBitBody").length, 1, "the words are not written a second time");
});

test("a save made under the optimistic id lands on the real row after a call-in revive", async () => {
  const h = harness();
  h.q.patchCard("optimistic-1", "b1", { x: 7 });
  h.q.reconcileId("optimistic-1", "real-1");
  await h.q.flushAll();

  const writes = h.of("updatePlacement");
  assert.equal(writes.length, 1);
  assert.equal(writes[0].args[1], "real-1", "the write must find the revived row, not the id the client guessed");
  assert.deepEqual(writes[0].args[2], { x: 7 });
});

test("⚠ P5 — a second create for the same card must not be evicted by the first (un-place, then undo)", async () => {
  const { q, of } = harness();
  let landed1, landed2;
  const create1 = new Promise((r) => (landed1 = r));
  const create2 = new Promise((r) => (landed2 = r));
  q.trackCreate("p1", create1);
  q.trackCreate("p1", create2); // the undo-revive registers a SECOND create under the same id
  landed1();
  await tick();
  await tick(); // the first create's cleanup runs here — it must not remove the second

  q.patchCard("p1", "b1", { x: 5 });
  const writing = q.flushNow("p1");
  await tick();
  await tick();
  assert.equal(
    of("updatePlacement").length,
    0,
    "the write must still be waiting — the row does not exist until the LIVE create lands",
  );

  landed2();
  await writing;
  assert.equal(of("updatePlacement").length, 1, "and it writes once the live create lands");
});

test("⚠ P6 — a failed save is not re-fired by a leftover timer (retry is your next edit, or leaving the board)", async () => {
  const { q, manual, of } = harness({ debounceMs: 5 });
  manual.add("updatePlacement");
  q.patchCard("p1", "b1", { x: 1 }); // arms the debounce timer
  const writing = q.flushNow("p1"); // fires early — and must CANCEL that timer
  await tick();
  of("updatePlacement")[0].reject(new Error("offline"));
  await writing;

  await sleep(25); // well past the debounce
  await tick();
  assert.equal(
    of("updatePlacement").length,
    1,
    "a stray timer must not re-fire the failed write behind the owner's back",
  );
});
