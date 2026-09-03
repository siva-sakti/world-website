"use client";

import Link from "next/link";
import { emptyMessage } from "@/lib/empty-message";
import { useMemo, useState } from "react";
import type { SearchItem, SearchKind } from "@/lib/db/search";
import type { TagChoice } from "@/lib/db/tags";
import { typeLabel } from "@/lib/labels";
import { useRouter } from "next/navigation";
import { confirm } from "@/components/confirm";
import { makeBoardFromBits } from "@/app/bits/actions";
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
  const router = useRouter();
  const [pending, setPending] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  /** Gather what is on screen onto a new board. Named after the tag when one is active —
   *  a board called "grief" beats a board called "untitled" — and left untitled otherwise,
   *  since a word search is not a name. Not undoable: the reversal is trashing the board. */
  async function makeBoard() {
    if (pending || results.length === 0) return;
    const n = results.length;
    if (
      n > 30 &&
      !(await confirm({
        message: `Make a board from ${n} things? They all land on it at once.`,
        confirmLabel: "Make it",
      }))
    )
      return;
    setPending(true);
    setErr(null);
    try {
      const res = await makeBoardFromBits(results.map((r) => r.id), activeTag?.word ?? null);
      if (res.error) setErr(res.error);
      if (res.boardId) router.push(`/board/${res.boardId}`);
    } catch {
      setErr("Couldn't make that board — try again.");
    } finally {
      setPending(false);
    }
  }
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

      {/* MAKE A BOARD FROM THESE — the pull has no selection, so it acts on what is on
          screen: whatever the tag, the words and the date filters have left. That is the
          least surprising reading of a button that says "these". Offered only when
          something is filtering; on the unfiltered "everything" view it would mean "put my
          entire collection on one board", which is never the ask. */}
      {filtered && results.length > 0 && (
        <div className="mt-6 flex items-baseline gap-3 text-sm">
          <button
            onClick={() => void makeBoard()}
            disabled={pending}
            className="text-neutral-600 underline underline-offset-4 hover:text-neutral-900 disabled:text-neutral-300 disabled:no-underline"
            title="Gather these onto a new board"
          >
            {pending ? "making…" : "make a board from these"}
          </button>
          {err && <span className="text-red-700">{err}</span>}
        </div>
      )}

      <p className="mt-6 mb-3 text-sm text-neutral-500">
        {filtered
          ? `${results.length} ${results.length === 1 ? "result" : "results"}${
              activeTag ? ` tagged “${activeTag.word}”` : ""
            }${hasWords ? ` matching “${q.trim()}”` : ""}`
          : `everything — ${results.length} ${results.length === 1 ? "result" : "results"}, newest first`}
      </p>

      {results.length === 0 ? (
        <p className="text-neutral-500">
          {filtered
            ? emptyMessage({ filtered: true, hint: "try a different word, tag, or date" })
            : emptyMessage({ filtered: false })}
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
