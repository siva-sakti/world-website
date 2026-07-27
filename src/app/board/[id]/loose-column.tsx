"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { listInbox, type InboxItem } from "@/lib/db/inbox";
import { signedUrl } from "@/lib/storage";

// The loose-notes column (call-in plan §6): your inbox, reachable from inside a
// board. Collapsed to a tab by default; open it, search / filter your loose pile,
// click a note, and the board brings it in where you're looking. Filtering is
// in-memory over the loaded set — snappy at a single writer's inbox size.

type TypeFilter = "all" | "text" | "image" | "drawing";

function faceOf(it: InboxItem): string {
  if (it.type === "text")
    return (it.body ?? "").replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim();
  if (it.type === "image") return it.file_name ?? "image";
  return "drawing";
}

export function LooseColumn({
  onBringIn,
  refreshSignal,
}: {
  onBringIn: (bit: InboxItem) => Promise<void>;
  refreshSignal: number;
}) {
  const [supabase] = useState(() => createClient());
  const [open, setOpen] = useState(false);
  const [notes, setNotes] = useState<InboxItem[] | null>(null); // null = not loaded yet
  const [thumbs, setThumbs] = useState<Map<string, string>>(new Map());
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [query, setQuery] = useState("");
  const [tagId, setTagId] = useState("");
  const [sourceId, setSourceId] = useState("");
  const [typeFilter, setTypeFilter] = useState<TypeFilter>("all");
  const loadId = useRef(0);
  const colRef = useRef<HTMLElement>(null);

  // Keep wheel events inside the column — the board's native wheel listener (an
  // ancestor) would otherwise zoom the canvas while you scroll the pile.
  useEffect(() => {
    const el = colRef.current;
    if (!el) return;
    const stop = (e: WheelEvent) => e.stopPropagation();
    el.addEventListener("wheel", stop);
    return () => el.removeEventListener("wheel", stop);
  }, [open]);

  async function load() {
    const my = ++loadId.current;
    setLoading(true);
    setError(null);
    try {
      const items = await listInbox(supabase);
      if (my !== loadId.current) return;
      setNotes(items);
      // Sign image thumbs (fresh ~1h URLs) so the column shows real previews.
      const imgs = items.filter((i) => i.type === "image" && (i.thumb_path || i.storage_path));
      const pairs = await Promise.all(
        imgs.map(async (i) => {
          try {
            return [i.id, await signedUrl(supabase, (i.thumb_path ?? i.storage_path)!)] as const;
          } catch {
            return null;
          }
        }),
      );
      if (my !== loadId.current) return;
      setThumbs(new Map(pairs.filter(Boolean) as (readonly [string, string])[]));
    } catch {
      if (my === loadId.current) setError("Couldn't load your loose notes.");
    } finally {
      if (my === loadId.current) setLoading(false);
    }
  }

  // Load when first opened, and whenever the board signals the loose set changed
  // (a card was removed → it's loose again) while the column is open.
  useEffect(() => {
    if (open) load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, refreshSignal]);

  // Filter options come from the loaded set itself (only tags/sources you actually
  // have loose show up).
  const allTags = useMemo(() => {
    const m = new Map<string, string>();
    for (const n of notes ?? []) for (const t of n.tags) m.set(t.id, t.word);
    return [...m].map(([id, word]) => ({ id, word })).sort((a, b) => a.word.localeCompare(b.word));
  }, [notes]);
  const allSources = useMemo(() => {
    const m = new Map<string, string>();
    for (const n of notes ?? []) if (n.source) m.set(n.source.id, n.source.name);
    return [...m].map(([id, name]) => ({ id, name })).sort((a, b) => a.name.localeCompare(b.name));
  }, [notes]);

  const q = query.trim().toLowerCase();
  const filtered = (notes ?? []).filter((n) => {
    if (typeFilter !== "all" && n.type !== typeFilter) return false;
    if (sourceId && n.source?.id !== sourceId) return false;
    if (tagId && !n.tags.some((t) => t.id === tagId)) return false;
    if (q) {
      const hay = `${faceOf(n)} ${n.source?.name ?? ""} ${n.tags.map((t) => t.word).join(" ")}`.toLowerCase();
      if (!hay.includes(q)) return false;
    }
    return true;
  });

  async function bring(bit: InboxItem) {
    setNotes((ns) => (ns ? ns.filter((n) => n.id !== bit.id) : ns));
    try {
      await onBringIn(bit);
    } catch {
      // Bring-in failed — put it back where it was (newest-first).
      setNotes((ns) =>
        ns ? [bit, ...ns].sort((a, b) => (a.created_at < b.created_at ? 1 : -1)) : ns,
      );
    }
  }

  if (!open) {
    return (
      <button className="loose-tab" onClick={() => setOpen(true)} title="Your loose notes">
        loose notes
      </button>
    );
  }

  return (
    <aside className="loose-col" ref={colRef}>
      <div className="loose-col-head">
        <span>loose notes{notes ? ` (${filtered.length})` : ""}</span>
        <button className="loose-col-close" onClick={() => setOpen(false)} title="collapse">
          ×
        </button>
      </div>

      {notes && notes.length > 0 && (
        <div className="loose-filters">
          <input
            className="loose-search"
            value={query}
            placeholder="search…"
            aria-label="Search loose notes"
            onChange={(e) => setQuery(e.target.value)}
          />
          <div className="loose-selects">
            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value as TypeFilter)}
              aria-label="Filter by type"
            >
              <option value="all">all types</option>
              <option value="text">text</option>
              <option value="image">images</option>
              <option value="drawing">drawings</option>
            </select>
            {allTags.length > 0 && (
              <select value={tagId} onChange={(e) => setTagId(e.target.value)} aria-label="Filter by tag">
                <option value="">any tag</option>
                {allTags.map((t) => (
                  <option key={t.id} value={t.id}>
                    #{t.word}
                  </option>
                ))}
              </select>
            )}
            {allSources.length > 0 && (
              <select value={sourceId} onChange={(e) => setSourceId(e.target.value)} aria-label="Filter by source">
                <option value="">any source</option>
                {allSources.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name}
                  </option>
                ))}
              </select>
            )}
          </div>
        </div>
      )}

      {loading && !notes && <p className="loose-col-msg">Loading…</p>}
      {error && (
        <p className="loose-col-msg">
          {error}{" "}
          <button className="underline" onClick={load}>
            retry
          </button>
        </p>
      )}
      {notes && notes.length === 0 && <p className="loose-col-msg">Nothing loose right now.</p>}
      {notes && notes.length > 0 && filtered.length === 0 && (
        <p className="loose-col-msg">No loose notes match.</p>
      )}
      {filtered.length > 0 && (
        <ul className="loose-list">
          {filtered.map((it) => (
            <li key={it.id}>
              <button className="loose-card" onClick={() => bring(it)} title="place on this board">
                {it.type === "image" && thumbs.get(it.id) ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img className="loose-thumb" src={thumbs.get(it.id)} alt="" />
                ) : (
                  <span className="loose-face">{faceOf(it) || "…"}</span>
                )}
                {it.source && <span className="loose-from">from {it.source.name}</span>}
              </button>
            </li>
          ))}
        </ul>
      )}
    </aside>
  );
}
