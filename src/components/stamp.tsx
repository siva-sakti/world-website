"use client";

import { ago, fmt } from "@/lib/dates";
import { useReaderZone } from "./zone";

// A DATE ON SCREEN. Every one of them goes through here (I-G5), so "which day is this"
// is asked once, of the reader's own device.
//
// suppressHydrationWarning because the server's first paint may use a different zone
// (its guess) or a different `now` — that difference is expected and corrects itself,
// and it is not a bug React should shout about.

/** "Sep 2" — or "yesterday" / "3d ago" with `relative`. Renders nothing for no date. */
export function Stamp({
  iso,
  relative = false,
  className,
}: {
  iso: string | null | undefined;
  relative?: boolean;
  className?: string;
}) {
  const zone = useReaderZone();
  if (!iso) return null;
  return (
    <span className={className} suppressHydrationWarning>
      {relative ? ago(iso, zone) : fmt(iso, zone)}
    </span>
  );
}

/** "Sep 2 · edited Sep 3" — and just "Sep 2" when it hasn't been edited since. The
 *  same-day comparison has to happen in the READER's zone too, which is why it lives
 *  here rather than in the two pages that show it. */
export function MadeAndEdited({ created, updated }: { created: string; updated: string | null }) {
  const zone = useReaderZone();
  const made = fmt(created, zone);
  const edited = updated ? fmt(updated, zone) : made;
  return (
    <span suppressHydrationWarning>
      {made}
      {edited !== made && ` · edited ${edited}`}
    </span>
  );
}
