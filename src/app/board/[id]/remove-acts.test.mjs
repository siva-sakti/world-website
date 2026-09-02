import { test } from "node:test";
import assert from "node:assert/strict";
import { removeActs } from "./remove-acts.ts";

// THE FOUR REMOVE GESTURES, driven for real against fake doors.
//
// This is the coverage the D-stage collapse was missing. removeActs has no React
// hooks in it — it is a plain function of its arguments — so once the db calls and the
// confirm dialog are passed IN rather than imported, the whole thing can be driven
// here: un-place / trash, one card / many, each with its rollback, its refused-flush
// carve, and its undo and redo.
//
// Nothing here touches Supabase. The fakes record what WOULD have been written.

function card(bitId, extra = {}) {
  return {
    placementId: `p-${bitId}`, bitId, type: "text", kind: "bit",
    x: 10, y: 20, w: 400, h: 60, z: 1, ...extra,
  };
}

/** A whole fake board. `acts` is the module under test, wired to spies. */
function makeBoard(initial, opts = {}) {
  const log = { unplaced: [], trashed: [], restored: [], calledIn: [], locked: [], forgot: [], errors: [], looseRefreshes: 0, confirms: [] };
  let cards = [...initial];
  const cardsRef = { get current() { return cards; } };
  const tracked = [];
  const entries = [];

  const fail = { on: opts.failOn ?? null }; // a bitId whose db write rejects
  const flushRefusedFor = opts.flushRefusedFor ?? null;

  const acts = removeActs({
    supabase: {},
    boardId: "board-1",
    get cards() { return cards; },
    cardsRef,
    record: (label, bitIds, undo, redo, settled) => {
      const e = { label, bitIds, undo, redo, settled, failed: false };
      entries.push(e);
      return e;
    },
    fail: (e) => { e.failed = true; },
    trackCreate: () => {},
    reconcileId: () => {},
    chain: (_id, fn) => fn(),
    selectedIds: opts.selectedIds ?? new Set(),
    setCards: (fn) => { cards = fn(cards); },
    clearSelection: () => {},
    setEditingId: () => {},
    settled: async (pid) => pid,
    flushNow: async (pid) => !(flushRefusedFor && pid === `p-${flushRefusedFor}`),
    trackRemove: (p) => tracked.push(p),
    forget: (pid) => log.forgot.push(pid),
    setLooseRefresh: () => { log.looseRefreshes++; },
    onErr: (e) => log.errors.push(e),
    doors: {
      unplaceBit: async (_s, pid) => {
        if (fail.on && pid === `p-${fail.on}`) throw new Error("network down");
        log.unplaced.push(pid);
      },
      trashBit: async (_s, bitId) => {
        if (fail.on && bitId === fail.on) throw new Error("network down");
        log.trashed.push(bitId);
      },
      restoreBit: async (_s, bitId) => { log.restored.push(bitId); },
      callInBit: async (_s, args) => { log.calledIn.push(args.bitId); return { id: args.placementId }; },
      setPlacementLock: async (_s, pid, on) => { log.locked.push([pid, on]); },
      getBitBoards: async () => opts.boards ?? [{ id: "board-1", title: "b" }],
      // The trash confirm is now ONE door (app/trash/trash-confirm) shared with /bits,
      // /bit/[id] and /write. This records what was ASKED, not how it was worded — the
      // wording has its own tests in trash-message.test.mjs.
      confirmTrash: async (args) => { log.confirms.push(args); return opts.confirm !== false; },
    },
  });

  const flush = async () => {
    await Promise.allSettled(tracked);
    await Promise.allSettled(tracked); // legs registered by a leg's own continuation
  };
  return { acts, log, entries, flush, bits: () => cards.map((c) => c.bitId).sort() };
}

// ---- un-place, one card ----

test("un-place one: card leaves the screen, the placement is un-placed, loose repaints", async () => {
  const b = makeBoard([card("a"), card("b")]);
  b.acts.unplaceSelected("p-a");
  await b.flush();
  assert.deepEqual(b.bits(), ["b"], "only the chosen card left");
  assert.deepEqual(b.log.unplaced, ["p-a"]);
  assert.deepEqual(b.log.forgot, ["p-a"], "queued writes dropped once the removal landed");
  assert.equal(b.log.looseRefreshes, 1, "it is loose again — the column must hear about it exactly once");
});

test("un-place one: records ONE entry, labelled singular", async () => {
  const b = makeBoard([card("a")]);
  b.acts.unplaceSelected("p-a");
  await b.flush();
  assert.equal(b.entries.length, 1);
  assert.equal(b.entries[0].label, "remove card from board");
  assert.deepEqual(b.entries[0].bitIds, ["a"]);
});

test("un-place one: UNDO revives it at its old spot, with its size and z", async () => {
  const b = makeBoard([card("a", { x: 77, y: 88, w: 300, h: 120, z: 5 })]);
  b.acts.unplaceSelected("p-a");
  await b.flush();
  await b.entries[0].undo();
  assert.deepEqual(b.bits(), ["a"], "the card is back");
  assert.deepEqual(b.log.calledIn, ["a"], "revived through call-in, not re-created");
});

test("un-place one: REDO removes it again", async () => {
  const b = makeBoard([card("a")]);
  b.acts.unplaceSelected("p-a");
  await b.flush();
  await b.entries[0].undo();
  await b.entries[0].redo();
  assert.deepEqual(b.bits(), [], "gone again");
});

test("un-place one: a LOCKED card comes back still locked", async () => {
  const b = makeBoard([card("a", { locked: true })]);
  b.acts.unplaceSelected("p-a");
  await b.flush();
  await b.entries[0].undo();
  assert.deepEqual(b.log.locked, [["p-a", true]], "un-place clears the lock, so the revive must re-apply it");
});

// ---- un-place, many ----

test("un-place many: every card leaves, one entry, plural label", async () => {
  const b = makeBoard([card("a"), card("b"), card("c")], {
    selectedIds: new Set(["p-a", "p-b", "p-c"]),
  });
  b.acts.bulkUnplace();
  await b.flush();
  assert.deepEqual(b.bits(), []);
  assert.deepEqual(b.log.unplaced.sort(), ["p-a", "p-b", "p-c"]);
  assert.equal(b.entries.length, 1, "ONE entry for the whole gesture, not three");
  assert.equal(b.entries[0].label, "remove 3 cards from board");
});

test("un-place many: undo brings them all back", async () => {
  const b = makeBoard([card("a"), card("b")], { selectedIds: new Set(["p-a", "p-b"]) });
  b.acts.bulkUnplace();
  await b.flush();
  await b.entries[0].undo();
  assert.deepEqual(b.bits(), ["a", "b"]);
});

// ---- trash, one and many ----

test("trash one: asks first, freezes the bit, labels singular", async () => {
  const b = makeBoard([card("a")]);
  await b.acts.trashSelected("p-a", "a");
  await b.flush();
  assert.equal(b.log.confirms.length, 1, "a destructive act always asks");
  assert.deepEqual(b.log.trashed, ["a"]);
  assert.equal(b.entries[0].label, "trash card");
  assert.equal(b.log.looseRefreshes, 0, "a trashed bit is NOT loose — the column must not repaint");
});

test("trash one: declining the confirm does nothing at all", async () => {
  const b = makeBoard([card("a")], { confirm: false });
  await b.acts.trashSelected("p-a", "a");
  await b.flush();
  assert.deepEqual(b.bits(), ["a"], "the card stays");
  assert.deepEqual(b.log.trashed, []);
  assert.equal(b.entries.length, 0, "nothing happened, so nothing is remembered");
});

test("trash one: the confirm is TOLD how many boards the card is on", async () => {
  const b = makeBoard([card("a")], {
    boards: [{ id: "board-1", title: "x" }, { id: "board-2", title: "y" }, { id: "board-3", title: "z" }],
  });
  await b.acts.trashSelected("p-a", "a");
  await b.flush();
  assert.deepEqual(b.log.confirms[0], { noun: "card", onBoards: 3 }, "so the shared door can warn it leaves all of them");
});

test("trash one: UNDO restores the bit globally, then repaints the card", async () => {
  const b = makeBoard([card("a")]);
  await b.acts.trashSelected("p-a", "a");
  await b.flush();
  await b.entries[0].undo();
  assert.deepEqual(b.log.restored, ["a"]);
  assert.deepEqual(b.bits(), ["a"]);
});

test("trash one: REDO re-trashes WITHOUT asking again", async () => {
  const b = makeBoard([card("a")]);
  await b.acts.trashSelected("p-a", "a");
  await b.flush();
  await b.entries[0].undo();
  const asksBefore = b.log.confirms.length;
  await b.entries[0].redo();
  assert.equal(b.log.confirms.length, asksBefore, "redo must not re-ask (ruled)");
  assert.deepEqual(b.bits(), []);
});

test("trash many: one entry, plural label, every bit frozen", async () => {
  const b = makeBoard([card("a"), card("b")], { selectedIds: new Set(["p-a", "p-b"]) });
  await b.acts.bulkTrash();
  await b.flush();
  assert.deepEqual(b.log.confirms[0], { count: 2, noun: "card", shared: 0 }, "asked ONCE, for the whole gesture");
  assert.deepEqual(b.log.trashed.sort(), ["a", "b"]);
  assert.equal(b.entries.length, 1);
  assert.equal(b.entries[0].label, "trash 2 cards");
});

test("trash many: an empty selection asks nothing and records nothing", async () => {
  const b = makeBoard([card("a")], { selectedIds: new Set() });
  await b.acts.bulkTrash();
  await b.flush();
  assert.deepEqual(b.log.confirms, []);
  assert.equal(b.entries.length, 0);
  assert.deepEqual(b.bits(), ["a"]);
});

// ---- failure and rollback: the paths reading alone can't prove ----

test("a failed write PUTS THE CARD BACK and surfaces the error", async () => {
  const b = makeBoard([card("a")], { failOn: "a" });
  b.acts.unplaceSelected("p-a");
  await b.flush();
  assert.deepEqual(b.bits(), ["a"], "the screen must not lie — a reload would show it anyway");
  assert.equal(b.log.errors.length, 1, "and the owner is told");
  assert.equal(b.entries[0].failed, true, "an act that un-happened must never sit live in the undo stack");
});

test("a REFUSED FLUSH cancels the removal with no second banner", async () => {
  // hunt #3: the flush already showed its own banner and re-queued the words. The
  // removal must simply not happen — trashing here would freeze a bit whose typed
  // tail never landed.
  const b = makeBoard([card("a")], { flushRefusedFor: "a" });
  b.acts.unplaceSelected("p-a");
  await b.flush();
  assert.deepEqual(b.bits(), ["a"], "the card stays");
  assert.deepEqual(b.log.unplaced, [], "and nothing was written");
  assert.equal(b.log.errors.length, 0, "no SECOND banner — the flush already spoke");
  assert.equal(b.entries[0].failed, true);
});

test("J1: in a bulk gesture, only the cards that ACTUALLY LEFT come back on undo", async () => {
  const b = makeBoard([card("a"), card("b"), card("c")], {
    selectedIds: new Set(["p-a", "p-b", "p-c"]),
    failOn: "b", // b's write rejects, so b never left
  });
  b.acts.bulkUnplace();
  await b.flush();
  assert.deepEqual(b.bits(), ["b"], "the failed one was put back; the other two left");
  await b.entries[0].undo();
  assert.deepEqual(b.log.calledIn.sort(), ["a", "c"], "undo revives ONLY a and c — never b, which never left");
  assert.deepEqual(b.bits(), ["a", "b", "c"]);
});

test("a bulk gesture where EVERY leg fails is not remembered at all", async () => {
  const b = makeBoard([card("a")], { selectedIds: new Set(["p-a"]), failOn: "a" });
  b.acts.bulkUnplace();
  await b.flush();
  assert.equal(b.entries[0].failed, true, "nothing happened → no memory of it");
  assert.deepEqual(b.bits(), ["a"]);
});

test("undo waits for the gesture's writes to land before reversing (D6)", async () => {
  const b = makeBoard([card("a")]);
  b.acts.unplaceSelected("p-a");
  assert.ok(b.entries[0].settled, "the entry carries the gesture's own promise");
  await b.entries[0].settled;
  assert.deepEqual(b.log.unplaced, ["p-a"], "by the time undo may run, the write has landed");
});
