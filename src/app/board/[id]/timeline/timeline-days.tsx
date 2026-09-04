"use client";

import { useReaderZone } from "@/components/zone";
import { boardLabel, bitLabel, typeLabel } from "@/lib/labels";
import { groupByDay } from "./group-by-day";

// The timeline's day headings, grouped ON THE CLIENT because which day a card arrived
// on depends on where the reader is (I-G5). The server sorts and hands the rows over;
// only the grouping and the wording happen here, so nothing is fetched twice.

export type TimelineRow = {
  placement_id: string;
  arrived_at: string;
  thing: string;
  label: string | null;
  type: string | null;
};

export function TimelineDays({ rows }: { rows: TimelineRow[] }) {
  const zone = useReaderZone();
  const days = groupByDay(rows, zone);

  return (
    <div suppressHydrationWarning>
      <p className="mb-6 text-sm text-neutral-500">
        {rows.length} {rows.length === 1 ? "thing" : "things"}, in the order they arrived
        {days.length > 1 ? ` across ${days.length} days` : ""}.
      </p>
      <ol className="space-y-6">
        {days.map((d) => (
          <li key={d.key}>
            <h2 className="mb-2 text-xs uppercase tracking-wide text-neutral-400">{d.day}</h2>
            <ul className="space-y-1 text-sm">
              {d.rows.map((c) => (
                <li key={c.placement_id} className="flex items-baseline justify-between gap-4">
                  {/* A card can be a bit OR a board placed as a card — both have a label. */}
                  <span className={c.label ? "" : "italic text-neutral-500"}>
                    {c.thing === "board" ? boardLabel(c.label) : bitLabel(c.type ?? "", c.label)}
                  </span>
                  <span className="shrink-0 text-xs text-neutral-400">
                    {c.thing === "board" ? "board" : typeLabel(c.type)}
                  </span>
                </li>
              ))}
            </ul>
          </li>
        ))}
      </ol>
    </div>
  );
}
