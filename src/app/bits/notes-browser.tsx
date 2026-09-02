"use client";

import { useEffect, useMemo, useState } from "react";
import { emptyMessage } from "@/lib/empty-message";
import Link from "next/link";
import type { PanelBit } from "@/lib/db/inbox";
import { parseQuery, isEmptyQuery, compileMatcher } from "@/lib/search-query";
import { NoteCard } from "./note-card";
import { NoteRow } from "./note-row";
import { placeBitsOnBoard, trashBits, archiveBits } from "./actions";
import { confirmArchive } from "@/app/archive/archive-confirm";
import { confirmTrash } from "@/app/trash/trash-confirm";
import { SearchablePicker } from "@/components/searchable-picker";
import type { ShelfGroup } from "@/lib/db/shelf";

// The bit-first view (organize plan O2): tabs loose (default) | all, in-memory
// search + type filters + sorts — the board panel's ruled pattern (A22) on its
// own landing page. The loose tab IS the old page, unchanged.
type View = "loose" | "all";
type Sort = "new" | "old" | "edited";
type Kind = "text" | "image" | "drawing" | "audio" | "pdf" | "link";

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
  // The "sent to … ✓ · open it" banner lives HERE, not in the card: sending revalidates /bits, which
  // drops the placed bit and unmounts its card — this browser stays mounted, so the banner survives.
  const [sent, setSent] = useState<{ boardId: string; title: string | null } | null>(null);
  useEffect(() => {
    if (!sent) return;
    const t = setTimeout(() => setSent(null), 6000);
    return () => clearTimeout(t);
  }, [sent]);

  // Loose-page multi-select → send several bits to a board at once. Loose-ONLY: the "all" tab holds
  // placed bits, and selecting one there to send elsewhere is the parked A20 multi-board door — so the
  // select toggle shows only in the loose view, and switching to "all" exits select mode.
  const [selectMode, setSelectMode] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(() => new Set());
  const [bulkPending, setBulkPending] = useState(false);
  const [bulkErr, setBulkErr] = useState<string | null>(null);

  function exitSelect() {
    setSelectMode(false);
    setSelectedIds(new Set());
    setBulkErr(null);
  }
  function toggleSelect(id: string) {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }
  async function bulkSend(boardId: string) {
    if (!boardId || bulkPending || selectedIds.size === 0) return;
    setBulkPending(true);
    setBulkErr(null);
    try {
      const res = await placeBitsOnBoard([...selectedIds], boardId);
      if (res.error) {
        setBulkErr(res.error);
        return;
      }
      setSent({ boardId, title: boards.find((b) => b.id === boardId)?.title ?? null });
      exitSelect(); // the sent bits drop from the loose list; the banner above confirms + links
    } catch {
      setBulkErr("Couldn't send those — try again.");
    } finally {
      setBulkPending(false);
    }
  }
  /** Archive the selection — set aside, hidden but kept, reversible from /archive.
   *  Asks first, through THE one archive confirm (archive-confirm.ts) that the single
   *  ArchiveButton also uses — owner ruling (2026-09-02): the two doors must not be able
   *  to disagree, so "does archiving ask?" is answered in exactly one file. */
  async function bulkArchive() {
    if (bulkPending || selectedIds.size === 0) return;
    if (!(await confirmArchive({ count: selectedIds.size, noun: "bit" }))) return;
    setBulkPending(true);
    setBulkErr(null);
    try {
      const res = await archiveBits([...selectedIds]);
      if (res.error) {
        setBulkErr(res.error);
        return;
      }
      exitSelect(); // the archived bits drop from the live list (revalidate)
    } catch {
      setBulkErr("Couldn't archive those — try again.");
    } finally {
      setBulkPending(false);
    }
  }

  async function bulkTrash() {
    if (bulkPending || selectedIds.size === 0) return;
    const n = selectedIds.size;
    if (!(await confirmTrash({ count: n, noun: "bit" }))) return;
    setBulkPending(true);
    setBulkErr(null);
    try {
      const res = await trashBits([...selectedIds]);
      if (res.error) {
        setBulkErr(res.error);
        return;
      }
      exitSelect(); // the trashed bits drop from the list (revalidate)
    } catch {
      setBulkErr("Couldn't trash those — try again.");
    } finally {
      setBulkPending(false);
    }
  }

  // Escape leaves select mode.
  useEffect(() => {
    if (!selectMode) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") {
        setSelectMode(false);
        setSelectedIds(new Set());
        setBulkErr(null);
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [selectMode]);

  function switchView(v: View) {
    setView(v);
    if (v === "all") exitSelect(); // multi-select is loose-only (parked A20 guard)
    // Keep the URL linkable without a server round-trip.
    window.history.replaceState(null, "", v === "all" ? "/bits?view=all" : "/bits");
  }

  const shown = useMemo(() => {
    let xs = view === "loose" ? items.filter((b) => b.boards.length === 0) : items;
    if (kind) xs = xs.filter((b) => b.type === kind);
    // Same search language as the global search (search-query.ts): starts-with by
    // default · *word contains · "phrase" · -exclude.
    const parsed = parseQuery(q);
    if (!isEmptyQuery(parsed)) {
      const matcher = compileMatcher(parsed);
      xs = xs.filter((b) => {
        const hay = [
          b.face ?? "",
          b.content ?? "",
          (b.body ?? "").replace(/<[^>]+>/g, " "),
          b.captured_title ?? "", // a captioned link's title (the face hides it)
          (b.url ?? "").replace(/[^\p{L}\p{N}]+/gu, " "), // a link's url, as words
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
          {(["text", "image", "drawing", "audio", "pdf", "link"] as Kind[]).map((k) => (
            <button
              key={k}
              className={`loose-scope-tab${kind === k ? " is-on" : ""}`}
              onClick={() => setKind(kind === k ? null : k)}
            >
              {k === "text" ? "notes" : k === "image" ? "images" : k === "drawing" ? "sketches" : k === "audio" ? "recordings" : k === "pdf" ? "PDFs" : "links"}
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
        {view === "loose" && (
          <button
            className={`loose-scope-tab${selectMode ? " is-on" : ""}`}
            onClick={() => (selectMode ? exitSelect() : setSelectMode(true))}
            title="Select several bits to send to a board together"
          >
            ⛶ select
          </button>
        )}
      </div>

      {sent && (
        <div
          className="mt-4 flex items-center gap-3 rounded-md border border-neutral-200 bg-neutral-50 px-3 py-2 text-sm"
          role="status"
        >
          <span>
            sent to <strong>{sent.title || "untitled board"}</strong> ✓
          </span>
          <Link href={`/board/${sent.boardId}`} className="underline underline-offset-2">
            open it →
          </Link>
          <button
            onClick={() => setSent(null)}
            className="ml-auto text-neutral-400 hover:text-neutral-600"
            aria-label="dismiss"
          >
            ×
          </button>
        </div>
      )}

      {selectMode && (
        <div className="mt-4 flex items-center gap-3 rounded-md border border-neutral-300 bg-white px-3 py-2 text-sm">
          <span>{selectedIds.size} selected</span>
          <SearchablePicker
            options={boards.map((b) => ({ id: b.id, label: b.title || "untitled board" }))}
            onPick={bulkSend}
            placeholder={bulkPending ? "sending…" : "send to…"}
            disabled={bulkPending || selectedIds.size === 0}
            title="send the selected bits to a board"
          />
          <button
            onClick={() => void bulkArchive()}
            disabled={bulkPending || selectedIds.size === 0}
            className="text-neutral-500 underline underline-offset-2 hover:text-neutral-800 disabled:text-neutral-300 disabled:no-underline"
            title="Archive the selected bits — set aside in your archive, un-archive anytime"
          >
            archive
          </button>
          <button
            onClick={() => void bulkTrash()}
            disabled={bulkPending || selectedIds.size === 0}
            className="text-neutral-500 underline underline-offset-2 hover:text-red-700 disabled:text-neutral-300 disabled:no-underline"
            title="Trash the selected bits — restorable from the trash"
          >
            trash
          </button>
          {bulkErr && <span className="text-red-700">{bulkErr}</span>}
          <button onClick={exitSelect} className="ml-auto text-neutral-500 underline underline-offset-2">
            clear
          </button>
        </div>
      )}

      {shown.length === 0 ? (
        <p className="mt-8 text-neutral-500">
          {q || kind
            ? emptyMessage({ filtered: true })
            : view === "loose"
              ? "Nothing loose right now. Paste a link or jot a note above, and it lands here."
              : emptyMessage({ filtered: false, hint: "jot a note above, or catch things on a board" })}
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
                  onPlaced={(boardId, title) => setSent({ boardId, title })}
                  selectMode={selectMode}
                  selected={selectedIds.has(b.id)}
                  onToggle={() => toggleSelect(b.id)}
                />
              ) : (
                <NoteRow
                  key={b.id}
                  item={b}
                  img={imgs[b.id]}
                  boards={boards}
                  groups={groups}
                  showBoards={view === "all"}
                  onPlaced={(boardId, title) => setSent({ boardId, title })}
                  selectMode={selectMode}
                  selected={selectedIds.has(b.id)}
                  onToggle={() => toggleSelect(b.id)}
                />
              ),
            )}
          </ul>
        </>
      )}
    </div>
  );
}
