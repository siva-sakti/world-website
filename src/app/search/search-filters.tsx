"use client";

import { useState } from "react";
import type { SearchKind } from "@/lib/db/search";
import type { TagChoice } from "@/lib/db/tags";

// The ⌗ filter panel — the CATEGORIES (kind · tags · date), collapsed behind a button
// so the search box stays primary. "Filter" = narrowing by category (the ruled word);
// distinct from the search language, which lives in the box. A dot marks it active.

const KINDS: { key: SearchKind; label: string }[] = [
  { key: "all", label: "all" },
  { key: "bit", label: "bits" },
  { key: "note", label: "notes" },
];

export function SearchFilters({
  kind,
  setKind,
  tags,
  tagId,
  setTagId,
  dateFrom,
  setDateFrom,
  dateTo,
  setDateTo,
}: {
  kind: SearchKind;
  setKind: (k: SearchKind) => void;
  tags: TagChoice[];
  tagId: string | null;
  setTagId: (id: string | null) => void;
  dateFrom: string;
  setDateFrom: (d: string) => void;
  dateTo: string;
  setDateTo: (d: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const active = kind !== "all" || !!tagId || !!dateFrom || !!dateTo;

  return (
    <div>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="relative inline-flex items-center gap-1 rounded-md border border-neutral-300 px-2 py-1 text-sm text-neutral-600 hover:border-neutral-500 hover:text-neutral-900"
        aria-expanded={open}
        title="filter by kind, tag, or date"
      >
        ⌗ filter
        {active && (
          <span
            className="absolute -right-1 -top-1 h-2 w-2 rounded-full bg-[#365a8c]"
            aria-label="filters active"
          />
        )}
      </button>

      {open && (
        <div className="mt-3 space-y-4 rounded-md border border-neutral-200 p-4">
          <div>
            <p className="mb-1.5 text-xs uppercase tracking-wide text-neutral-400">kind</p>
            <div className="loose-scope">
              {KINDS.map((k) => (
                <button
                  key={k.key}
                  className={`loose-scope-tab${kind === k.key ? " is-on" : ""}`}
                  onClick={() => setKind(k.key)}
                >
                  {k.label}
                </button>
              ))}
            </div>
          </div>

          <div>
            <p className="mb-1.5 text-xs uppercase tracking-wide text-neutral-400">made between</p>
            <div className="flex flex-wrap items-center gap-2 text-sm">
              <input
                type="date"
                value={dateFrom}
                onChange={(e) => setDateFrom(e.target.value)}
                className="rounded border border-neutral-300 px-2 py-1"
                aria-label="from date"
              />
              <span className="text-neutral-400">→</span>
              <input
                type="date"
                value={dateTo}
                onChange={(e) => setDateTo(e.target.value)}
                className="rounded border border-neutral-300 px-2 py-1"
                aria-label="to date"
              />
              {(dateFrom || dateTo) && (
                <button
                  className="text-xs text-neutral-400 hover:text-neutral-700"
                  onClick={() => {
                    setDateFrom("");
                    setDateTo("");
                  }}
                >
                  clear
                </button>
              )}
            </div>
          </div>

          {tags.length > 0 && (
            <div>
              <p className="mb-1.5 text-xs uppercase tracking-wide text-neutral-400">tags</p>
              <div className="flex flex-wrap gap-2">
                {tags.map((t) => (
                  <button
                    key={t.id}
                    className={`tag-chip${t.id === tagId ? " is-on" : ""}`}
                    onClick={() => setTagId(tagId === t.id ? null : t.id)}
                    title={tagId === t.id ? "clear this tag" : undefined}
                  >
                    {t.word}
                    <span className="ml-1 text-neutral-400">{t.count}</span>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
