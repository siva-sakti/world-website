import { dayNumber, fmt } from "../../../../lib/dates"; // relative so the test runner can load this

// GROUPING THE TIMELINE INTO DAYS. Pure, so it can be tested; and it takes the zone
// rather than choosing one, because which day a card arrived on depends on where the
// reader is (I-G5) — a card that arrived at 6pm Pacific belongs under that evening,
// not under the next morning because UTC had already rolled over.
//
// Grouped on the day NUMBER and only then formatted: grouping on the display string
// would silently merge two days that happen to print the same.

/** Consecutive rows sharing a calendar day, in the order given (callers sort first). */
export function groupByDay<T extends { arrived_at: string }>(
  rows: T[],
  zone: string,
): { key: number; day: string; rows: T[] }[] {
  const out: { key: number; day: string; rows: T[] }[] = [];
  for (const r of rows) {
    const key = dayNumber(new Date(r.arrived_at), zone);
    const last = out[out.length - 1];
    if (last && last.key === key) last.rows.push(r);
    else out.push({ key, day: fmt(r.arrived_at, zone), rows: [r] });
  }
  return out;
}
