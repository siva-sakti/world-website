"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import type { SearchItem, SearchKind } from "@/lib/db/search";
import type { TagChoice } from "@/lib/db/tags";
import { typeLabel } from "@/lib/labels";
import { parseQuery, isEmptyQuery, compileMatcher } from "@/lib/search-query";
import { SearchTips } from "./search-tips";
import { SearchFilters } from "./search-filters";

// Search, filtered IN THE BROWSER (instant, exact). The box speaks the search language
// (search-query.ts — whole word · word* · "phrase" · -exclude); the ⌗ panel holds the
// categories (kind · tags · date, on when a thing was made). A board never appears here
// (no content of its own — reach a board by title via jump-to on its list).

function badge(item: SearchItem): string {
  if (item.kind === "note") return "note";
  return typeLabel(item.mediaType);
}

export function SearchLive({
  items,
  tags,
  initialQ,
  initialTag,
  initialKind,
}: {
  items: SearchItem[];
  tags: TagChoice[];
  initialQ: string;
  initialTag: string | null;
  initialKind: SearchKind;
}) {
  const [q, setQ] = useState(initialQ);
  const [kind, setKind] = useState<SearchKind>(initialKind);
  const [tagId, setTagId] = useState<string | null>(initialTag);
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");

  const parsed = useMemo(() => parseQuery(q), [q]);
  const matcher = useMemo(() => compileMatcher(parsed), [parsed]);
  const hasWords = !isEmptyQuery(parsed);

  const results = items.filter((item) => {
    if (kind !== "all" && item.kind !== kind) return false;
    if (tagId && !item.tags.some((t) => t.id === tagId)) return false;
    const made = item.created_at.slice(0, 10); // YYYY-MM-DD
    if (dateFrom && made < dateFrom) return false;
    if (dateTo && made > dateTo) return false;
    if (hasWords && !matcher(item.searchText)) return false;
    return true;
  });

  const activeTag = tags.find((t) => t.id === tagId);
  const filtered = hasWords || !!tagId || kind !== "all" || !!dateFrom || !!dateTo;

  return (
    <>
      <div className="flex items-center gap-2">
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="search your words…"
          className="flex-1 border-b border-neutral-300 bg-transparent py-2 text-base outline-none focus:border-neutral-900"
          autoFocus={!initialQ}
        />
        <SearchTips />
      </div>

      <div className="mt-3">
        <SearchFilters
          kind={kind}
          setKind={setKind}
          tags={tags}
          tagId={tagId}
          setTagId={setTagId}
          dateFrom={dateFrom}
          setDateFrom={setDateFrom}
          dateTo={dateTo}
          setDateTo={setDateTo}
        />
      </div>

      <p className="mt-6 mb-3 text-sm text-neutral-500">
        {filtered
          ? `${results.length} ${results.length === 1 ? "result" : "results"}${
              activeTag ? ` tagged “${activeTag.word}”` : ""
            }${hasWords ? ` matching “${q.trim()}”` : ""}`
          : `everything — ${results.length} ${results.length === 1 ? "result" : "results"}, newest first`}
      </p>

      {results.length === 0 ? (
        <p className="text-neutral-500">
          {filtered ? "Nothing matches — try a different word, tag, or date." : "Nothing yet."}
        </p>
      ) : (
        <ul className="divide-y divide-neutral-100">
          {results.map((item) => (
            <li
              key={`${item.kind}-${item.id}`}
              className="flex items-baseline justify-between gap-4 py-3"
            >
              <Link
                href={`/bit/${item.id}`}
                className={`hover:underline underline-offset-4 ${item.label ? "" : "italic text-neutral-500"}`}
              >
                {item.label || "untitled"}
              </Link>
              <span className="flex shrink-0 items-baseline gap-2">
                {item.tags.map((t) => (
                  <button key={t.id} className="tag-chip" onClick={() => setTagId(t.id)}>
                    {t.word}
                  </button>
                ))}
                <span className="text-xs text-neutral-400">{badge(item)}</span>
              </span>
            </li>
          ))}
        </ul>
      )}
    </>
  );
}
