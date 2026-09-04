import { test } from "node:test";
import assert from "node:assert/strict";
import { ago, fmt, dayNumber } from "./dates.ts";

// THE DATE WORDS. Pinned because two screens disagreed about what day it was.
//
// I-G5: a moment is stored once in UTC; which DAY it reads as depends on where the
// reader is. `fmt` ("Sep 2") and `ago` ("yesterday") must therefore answer that
// question the same way — they used to not: fmt counted calendar days, ago divided
// elapsed milliseconds by 24 hours, which is a duration and not a day boundary.

const LA = "America/Los_Angeles";
const TOKYO = "Asia/Tokyo";

test("the same moment is a different DAY depending on where you are", () => {
  // 2026-09-03 01:00 UTC — still Sep 2 in California, already Sep 3 in Tokyo.
  const m = new Date("2026-09-03T01:00:00Z");
  assert.equal(dayNumber(m, "UTC"), dayNumber(m, TOKYO), "UTC and Tokyo are the same day here");
  assert.equal(dayNumber(m, LA) + 1, dayNumber(m, "UTC"), "California is a day behind");
});

test("S6 — an evening save reads as the SAME day in both wordings", () => {
  // 6pm Pacific on Sep 2 is already Sep 3 in UTC. Reading it the next Pacific morning,
  // "yesterday" and "Sep 2" must agree. Under the old code ago() said "today" (only 13
  // hours elapsed) while fmt() said "Sep 3" — two answers, two screens, same bit.
  const saved = "2026-09-03T01:00:00Z"; // = Sep 2, 6pm in California
  const nextMorning = new Date("2026-09-03T15:00:00Z"); // = Sep 3, 8am in California

  assert.equal(ago(saved, LA, nextMorning), "yesterday");
  assert.equal(fmt(saved, LA), "Sep 2");
});

test("the day boundary is the reader's midnight, not 24 elapsed hours", () => {
  const lateLastNight = "2026-09-03T06:30:00Z"; // 11:30pm Sep 2 in California
  const thisMorning = new Date("2026-09-03T14:00:00Z"); // 7am Sep 3 in California
  assert.equal(
    ago(lateLastNight, LA, thisMorning),
    "yesterday",
    "eight hours ago, but a day has turned over",
  );
});

test("today, yesterday, days, then a date", () => {
  const now = new Date("2026-09-03T12:00:00Z");
  const back = (n) => new Date(Date.UTC(2026, 8, 3 - n, 12)).toISOString();
  assert.equal(ago(back(0), "UTC", now), "today");
  assert.equal(ago(back(1), "UTC", now), "yesterday");
  assert.equal(ago(back(12), "UTC", now), "12d ago");
  assert.equal(ago(back(29), "UTC", now), "29d ago");
  assert.equal(ago(back(30), "UTC", now), fmt(back(30), "UTC"), "past a month it becomes a date");
});

test("a stamp from the future reads as today, never a negative count", () => {
  // A device with a slow clock can write a timestamp ahead of the reader's now.
  const now = new Date("2026-09-03T12:00:00Z");
  assert.equal(ago("2026-09-04T12:00:00Z", "UTC", now), "today");
});

test("the year appears only when it isn't this one", () => {
  const thisYear = new Date().getUTCFullYear();
  assert.equal(fmt(`${thisYear}-08-26T12:00:00Z`, "UTC"), "Aug 26");
  assert.match(fmt("2019-08-26T12:00:00Z", "UTC"), /2019/);
});

test("no date is empty, not the word Invalid", () => {
  assert.equal(fmt(null), "");
});
