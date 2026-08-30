"use client";

import { useMemo, useState } from "react";
import type { PanelBit } from "@/lib/db/inbox";
import { parseQuery, isEmptyQuery, compileMatcher } from "@/lib/search-query";
import { NoteCard } from "./note-card";
import { NoteRow } from "./note-row";
import type { ShelfGroup } from "@/lib/db/shelf";

// The bit-first view (organize plan O2): tabs loose (default) | all, in-memory
// search + type filters + sorts — the board panel's ruled pattern (A22) on its
// own landing page. The loose tab IS the old page, unchanged.
type View = "loose" | "all";
type Sort = "new" | "old" | "edited";
type Kind = "text" | "image" | "drawing";

export function NotesBrowser({
  items,
  imgs,
  boards,
  groups,
  initialView,
}: {
  items: PanelBit[];
  imgs: Record<string, string>;
  boards: { id: string; title: string | null }[];
  groups: ShelfGroup[];
  initialView: View;
}) {
  const [view, setView] = useState<View>(initialView);
  const [q, setQ] = useState("");
  const [kind, setKind] = useState<Kind | null>(null);
  const [sort, setSort] = useState<Sort>("new");
  const [layout, setLayout] = useState<"cards" | "list">("cards");

  function switchView(v: View) {
    setView(v);
    // Keep the URL linkable without a server round-trip.
    window.history.replaceState(null, "", v === "all" ? "/bits?view=all" : "/bits");
  }

  const shown = useMemo(() => {
    let xs = view === "loose" ? items.filter((b) => b.boards.length === 0) : items;
    if (kind) xs = xs.filter((b) => b.type === kind);
    // Same search language as the global search (search-query.ts): whole word by
    // default · word* starts-with · "phrase" · -exclude — never a partial word.
    const parsed = parseQuery(q);
    if (!isEmptyQuery(parsed)) {
      const matcher = compileMatcher(parsed);
      xs = xs.filter((b) => {
        const hay = [
          b.face ?? "",
          b.content ?? "",
          (b.body ?? "").replace(/<[^>]+>/g, " "),
          b.source?.name ?? "",
          ...b.tags.map((t) => t.word),
        ]
          .join(" ")
          .toLowerCase();
        return matcher(hay);
      });
    }
    const by = {
      new: (a: PanelBit, z: PanelBit) => z.created_at.localeCompare(a.created_at),
      old: (a: PanelBit, z: PanelBit) => a.created_at.localeCompare(z.created_at),
      edited: (a: PanelBit, z: PanelBit) => z.updated_at.localeCompare(a.updated_at),
    }[sort];
    const sorted = [...xs].sort(by);
    // Pinned floats to the top (O1), keeping the chosen sort within each half.
    return [
      ...sorted.filter((b) => b.pinned_at),
      ...sorted.filter((b) => !b.pinned_at),
    ];
  }, [items, view, kind, q, sort]);

  const looseCount = items.filter((b) => b.boards.length === 0).length;

  return (
    <div className="mt-7">
      {/* Tabs + controls */}
      <div className="notes-controls">
        <div className="loose-scope" role="tablist" aria-label="which bits">
          <button
            role="tab"
            aria-selected={view === "loose"}
            className={`loose-scope-tab${view === "loose" ? " is-on" : ""}`}
            onClick={() => switchView("loose")}
          >
            loose · {looseCount}
          </button>
          <button
            role="tab"
            aria-selected={view === "all"}
            className={`loose-scope-tab${view === "all" ? " is-on" : ""}`}
            onClick={() => switchView("all")}
          >
            all · {items.length}
          </button>
        </div>
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="search these…"
          className="notes-search"
          aria-label="search bits"
        />
        <div className="loose-scope" role="group" aria-label="type filter">
          {(["text", "image", "drawing"] as Kind[]).map((k) => (
            <button
              key={k}
              className={`loose-scope-tab${kind === k ? " is-on" : ""}`}
              onClick={() => setKind(kind === k ? null : k)}
            >
              {k === "text" ? "notes" : k === "image" ? "images" : "sketches"}
            </button>
          ))}
        </div>
        <select
          value={sort}
          onChange={(e) => setSort(e.target.value as Sort)}
          className="notes-sort"
          aria-label="sort"
        >
          <option value="new">newest first</option>
          <option value="old">oldest first</option>
          <option value="edited">recently edited</option>
        </select>
        <div className="loose-scope" role="group" aria-label="layout">
          <button
            className={`loose-scope-tab${layout === "cards" ? " is-on" : ""}`}
            onClick={() => setLayout("cards")}
            title="card view"
          >
            ⊞
          </button>
          <button
            className={`loose-scope-tab${layout === "list" ? " is-on" : ""}`}
            onClick={() => setLayout("list")}
            title="list view"
          >
            ☰
          </button>
        </div>
      </div>

      {shown.length === 0 ? (
        <p className="mt-8 text-neutral-500">
          {q || kind
            ? "Nothing matches — clear the search or filters."
            : view === "loose"
              ? "Nothing loose right now. Paste a link or jot a note above, and it lands here."
              : "Nothing here yet — jot a note above, or catch things on a board."}
        </p>
      ) : (
        <>
          <p className="mt-4 mb-3 text-sm text-neutral-500">
            {shown.length} {shown.length === 1 ? "bit" : "bits"}
            {view === "loose" ? " · loose" : " · everything"}
          </p>
          <ul className={layout === "cards" ? "inbox-grid" : "notes-list"}>
            {shown.map((b) =>
              layout === "cards" ? (
                <NoteCard
                  key={b.id}
                  item={b}
                  img={imgs[b.id]}
                  boards={boards}
                  groups={groups}
                  showBoards={view === "all"}
                />
              ) : (
                <NoteRow
                  key={b.id}
                  item={b}
                  img={imgs[b.id]}
                  boards={boards}
                  groups={groups}
                  showBoards={view === "all"}
                />
              ),
            )}
          </ul>
        </>
      )}
    </div>
  );
}
