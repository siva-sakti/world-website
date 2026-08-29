"use client";

import Link from "next/link";
import { useState } from "react";
import type { SearchItem, SearchKind } from "@/lib/db/search";
import type { TagChoice } from "@/lib/db/tags";

// Search, filtered IN THE BROWSER: the server loads everything once, this filters it
// live — instant, no per-search round-trip (same trick as the board drawer; server
// search is the ~1000-item scale trigger). Kind tabs + tag chips are client state; a
// click on the active tag clears it (toggle). A board never appears here (no content
// of its own — reach a board by title via jump-to on its list).

const KINDS: { key: SearchKind; label: string }[] = [
  { key: "all", label: "all" },
  { key: "bit", label: "bits" },
  { key: "note", label: "notes" },
];

function badge(item: SearchItem): string {
  if (item.kind === "note") return "note";
  return item.mediaType === "drawing" ? "doodle" : item.mediaType ?? "bit";
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

  const needle = q.trim().toLowerCase();
  const results = items.filter((item) => {
    if (kind !== "all" && item.kind !== kind) return false;
    if (tagId && !item.tags.some((t) => t.id === tagId)) return false;
    if (needle && !item.searchText.includes(needle)) return false;
    return true;
  });

  const activeTag = tags.find((t) => t.id === tagId);
  const filtered = Boolean(needle || tagId || kind !== "all");

  return (
    <>
      <input
        value={q}
        onChange={(e) => setQ(e.target.value)}
        placeholder="search your words…"
        className="w-full border-b border-neutral-300 bg-transparent py-2 text-base outline-none focus:border-neutral-900"
        autoFocus={!initialQ}
      />

      {/* Kind tabs — all · bits · notes (instant). */}
      <div className="loose-scope mt-4">
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

      {tags.length > 0 && (
        <div className="mt-3 flex flex-wrap gap-2">
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
      )}

      <p className="mt-6 mb-3 text-sm text-neutral-500">
        {filtered
          ? `${results.length} ${results.length === 1 ? "result" : "results"}${
              activeTag ? ` tagged “${activeTag.word}”` : ""
            }${needle ? ` matching “${q.trim()}”` : ""}`
          : `everything — ${results.length} ${results.length === 1 ? "result" : "results"}, newest first`}
      </p>

      {results.length === 0 ? (
        <p className="text-neutral-500">
          {filtered ? "Nothing matches — try a different word, tag, or kind." : "Nothing yet."}
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
