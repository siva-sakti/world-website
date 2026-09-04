import { test } from "node:test";
import assert from "node:assert/strict";
import { groupByDay } from "./group-by-day.ts";

const LA = "America/Los_Angeles";
const at = (iso) => ({ arrived_at: iso });

test("cards that arrived on the same day are one group", () => {
  const g = groupByDay([at("2026-09-02T17:00:00Z"), at("2026-09-02T19:00:00Z")], "UTC");
  assert.equal(g.length, 1);
  assert.equal(g[0].rows.length, 2);
});

test("an evening card belongs to the reader's evening, not to UTC's tomorrow", () => {
  // 4pm and 6pm Pacific on Sep 2 — the second has already crossed midnight in UTC.
  const rows = [at("2026-09-02T23:00:00Z"), at("2026-09-03T01:00:00Z")];
  assert.equal(groupByDay(rows, "UTC").length, 2, "UTC splits them across midnight");
  assert.equal(groupByDay(rows, LA).length, 1, "in California it was one evening");
  assert.equal(groupByDay(rows, LA)[0].day, "Sep 2");
});

test("days are grouped on the day itself, not on how it happens to print", () => {
  // Same month and day, a year apart: a string key would merge them.
  const g = groupByDay([at("2025-09-02T12:00:00Z"), at("2026-09-02T12:00:00Z")], "UTC");
  assert.equal(g.length, 2);
});

test("nothing in, nothing out", () => {
  assert.deepEqual(groupByDay([], "UTC"), []);
});
