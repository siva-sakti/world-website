// One home for the date words (V4 broom — replaces four hand-rolled copies).

// PINNED locale + timezone (review R3.16): the server renders in UTC/en-US and the
// browser in the owner's locale — an unpinned toLocaleDateString made every SSR'd
// list row a hydration mismatch, and the same bit showed different dates on /bits
// vs its own page. UTC is the neutral default; whether stamps should live in the
// owner's own timezone instead is a one-word owner call (needs-owner).
const LOCALE = "en-US";
const TIME_ZONE = "UTC";

/** "Aug 26" (with year when it isn't this year). Null-safe. */
export function fmt(iso: string | null): string {
  if (!iso) return "";
  const d = new Date(iso);
  const thisYear = new Intl.DateTimeFormat(LOCALE, { year: "numeric", timeZone: TIME_ZONE }).format(new Date());
  const year = new Intl.DateTimeFormat(LOCALE, { year: "numeric", timeZone: TIME_ZONE }).format(d);
  const opts: Intl.DateTimeFormatOptions =
    year === thisYear
      ? { month: "short", day: "numeric", timeZone: TIME_ZONE }
      : { year: "numeric", month: "short", day: "numeric", timeZone: TIME_ZONE };
  return d.toLocaleDateString(LOCALE, opts);
}

/** "today" · "yesterday" · "12d ago" · then a date. */
export function ago(iso: string): string {
  const d = Math.floor((Date.now() - new Date(iso).getTime()) / 86400000);
  if (d <= 0) return "today";
  if (d === 1) return "yesterday";
  if (d < 30) return `${d}d ago`;
  return fmt(iso);
}
