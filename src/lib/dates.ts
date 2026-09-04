// One home for the date words (V4 broom — replaces four hand-rolled copies).
//
// I-G5 — EVERY DATE IS SHOWN IN THE READER'S OWN ZONE (owner-ruled 2026-09-03).
// A moment is stored once, in UTC; which DAY it reads as depends on where the person
// looking at it is. So every function here takes the zone as an argument and none of
// them decides it: `components/stamp.tsx` supplies the device's own zone, and
// `lib/reader-zone.ts` supplies the server's best guess for the first paint.
//
// Why a zone must be passed at all: the page is rendered twice — on the server so it
// arrives complete, then in the browser. If the two disagree about the text, React
// throws a hydration mismatch. The old code pinned BOTH sides to UTC to stop that,
// which removed the breakage and made every evening date a day early for anyone west
// of Greenwich: save something at 6pm Pacific and the app filed it under tomorrow.
//
// The zone here is the LAST RESORT only — a server with no hint, or a test.
const LOCALE = "en-US";
export const FALLBACK_ZONE = "UTC";

/** WHICH CALENDAR DAY a moment falls on, in `zone`, as a plain day count.
 *
 *  The one arithmetic both `fmt` and `ago` go through, so they cannot disagree about
 *  what day it is. They used to: `fmt` used calendar days in a fixed zone while `ago`
 *  divided elapsed milliseconds by 24h, which is a *duration*, not a day boundary. A
 *  bit saved at 11pm read "today" on one screen and yesterday's date on another
 *  (S6). Formatting to en-CA gives YYYY-MM-DD, so the parts come back sorted. */
export function dayNumber(d: Date, zone: string): number {
  const [y, m, day] = new Intl.DateTimeFormat("en-CA", {
    timeZone: zone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  })
    .format(d)
    .split("-")
    .map(Number);
  return Date.UTC(y, m - 1, day) / 86400000;
}

/** "Aug 26" (with the year when it isn't this year). Null-safe. */
export function fmt(iso: string | null, zone: string = FALLBACK_ZONE): string {
  if (!iso) return "";
  const d = new Date(iso);
  const year = new Intl.DateTimeFormat(LOCALE, { year: "numeric", timeZone: zone }).format(d);
  const thisYear = new Intl.DateTimeFormat(LOCALE, { year: "numeric", timeZone: zone }).format(
    new Date(),
  );
  const opts: Intl.DateTimeFormatOptions =
    year === thisYear
      ? { month: "short", day: "numeric", timeZone: zone }
      : { year: "numeric", month: "short", day: "numeric", timeZone: zone };
  return d.toLocaleDateString(LOCALE, opts);
}

/** "today" · "yesterday" · "12d ago" · then a date.
 *
 *  Counts CALENDAR days in `zone`, not elapsed hours: 11pm yesterday to 7am today is
 *  eight hours and one day, and "yesterday" is the true answer. `now` is injectable so
 *  the boundaries can be tested without waiting for midnight. */
export function ago(iso: string, zone: string = FALLBACK_ZONE, now: Date = new Date()): string {
  const days = dayNumber(now, zone) - dayNumber(new Date(iso), zone);
  if (days <= 0) return "today"; // a clock-skewed future stamp reads as now, never "-1d"
  if (days === 1) return "yesterday";
  if (days < 30) return `${days}d ago`;
  return fmt(iso, zone);
}
