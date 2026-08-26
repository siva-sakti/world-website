// One home for the date words (V4 broom — replaces four hand-rolled copies).

/** "Aug 26" (with year when it isn't this year). Null-safe. */
export function fmt(iso: string | null): string {
  if (!iso) return "";
  const d = new Date(iso);
  const opts: Intl.DateTimeFormatOptions =
    d.getFullYear() === new Date().getFullYear()
      ? { month: "short", day: "numeric" }
      : { year: "numeric", month: "short", day: "numeric" };
  return d.toLocaleDateString(undefined, opts);
}

/** "today" · "yesterday" · "12d ago" · then a date. */
export function ago(iso: string): string {
  const d = Math.floor((Date.now() - new Date(iso).getTime()) / 86400000);
  if (d <= 0) return "today";
  if (d === 1) return "yesterday";
  if (d < 30) return `${d}d ago`;
  return fmt(iso);
}
