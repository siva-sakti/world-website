"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { listAllBits, type PanelBit } from "@/lib/db/inbox";
import { signedUrl } from "@/lib/storage";

// The board's notes panel — the all-bits browser (loose-notes redesign, D-109).
// Every live bit, LOOSE FIRST, searchable + filterable, so you can drop ANY note
// onto this board; a note dropped on a second board now lives on both (multi-board,
// reference). Filtering is in-memory over the loaded set (snappy at this scale;
// server-side search + paging is the named scale trigger). Reachable from a tab.

type TypeFilter = "all" | "text" | "image" | "drawing";
type Scope = "loose" | "this" | "other" | "all";

function faceOf(it: PanelBit): string {
  if (it.face) return it.face;
  if (it.type === "image") return it.file_name ?? "image";
  return it.type === "drawing" ? "drawing" : "";
}

export function LooseColumn({
  boardId,
  onBringIn,
  refreshSignal,
}: {
  boardId: string;
  onBringIn: (bit: PanelBit) => Promise<void>;
  refreshSignal: number;
}) {
  const [supabase] = useState(() => createClient());
  const [open, setOpen] = useState(false);
  const [bits, setBits] = useState<PanelBit[] | null>(null);
  const [thumbs, setThumbs] = useState<Map<string, string>>(new Map());
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [scope, setScope] = useState<Scope>("loose");
  const [query, setQuery] = useState("");
  const [tagId, setTagId] = useState("");
  const [sourceId, setSourceId] = useState("");
  const [typeFilter, setTypeFilter] = useState<TypeFilter>("all");
  const loadId = useRef(0);
  const colRef = useRef<HTMLElement>(null);

  // Keep wheel events inside the column — the board's native wheel listener (an
  // ancestor) would otherwise zoom the canvas while you scroll.
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
      const items = await listAllBits(supabase);
      if (my !== loadId.current) return;
      setBits(items);
    } catch {
      if (my === loadId.current) setError("Couldn't load your notes.");
    } finally {
      if (my === loadId.current) setLoading(false);
    }
  }

  // Load on first open, and whenever the board signals the set changed.
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- load-on-open sets a loading flag; results arrive async
    if (open) load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, refreshSignal]);

  const isLoose = (n: PanelBit) => n.boards.length === 0;
  const onThis = (n: PanelBit) => n.boards.some((b) => b.id === boardId);

  const allTags = useMemo(() => {
    const m = new Map<string, string>();
    for (const n of bits ?? []) for (const t of n.tags) m.set(t.id, t.word);
    return [...m].map(([id, word]) => ({ id, word })).sort((a, b) => a.word.localeCompare(b.word));
  }, [bits]);
  const allSources = useMemo(() => {
    const m = new Map<string, string>();
    for (const n of bits ?? []) if (n.source) m.set(n.source.id, n.source.name);
    return [...m].map(([id, name]) => ({ id, name })).sort((a, b) => a.name.localeCompare(b.name));
  }, [bits]);

  const q = query.trim().toLowerCase();
  let filtered = (bits ?? []).filter((n) => {
    if (scope === "loose" && !isLoose(n)) return false;
    if (scope === "this" && !onThis(n)) return false;
    if (scope === "other" && (isLoose(n) || onThis(n))) return false;
    if (typeFilter !== "all" && n.type !== typeFilter) return false;
    if (sourceId && n.source?.id !== sourceId) return false;
    if (tagId && !n.tags.some((t) => t.id === tagId)) return false;
    if (q) {
      const hay = `${faceOf(n)} ${n.source?.name ?? ""} ${n.tags.map((t) => t.word).join(" ")}`.toLowerCase();
      if (!hay.includes(q)) return false;
    }
    return true;
  });
  // "all" shows loose first; JS sort is stable, so newest-first holds within groups.
  if (scope === "all") {
    filtered = [...filtered].sort((a, b) => (isLoose(b) ? 1 : 0) - (isLoose(a) ? 1 : 0));
  }

  // Lazy thumbnails: sign only the image bits actually SHOWN, once each (F8) — never
  // every image upfront (would fan out at "all bits" scale).
  const needThumbs = filtered.filter(
    (n) => n.type === "image" && (n.thumb_path || n.storage_path) && !thumbs.has(n.id),
  );
  const needKey = needThumbs.map((n) => n.id).join(",");
  useEffect(() => {
    if (!needKey) return;
    let alive = true;
    Promise.all(
      needThumbs.map(async (n) => {
        try {
          return [n.id, await signedUrl(supabase, (n.thumb_path ?? n.storage_path)!)] as const;
        } catch {
          return null;
        }
      }),
    ).then((pairs) => {
      if (!alive) return;
      const good = pairs.filter(Boolean) as (readonly [string, string])[];
      if (good.length) setThumbs((m) => new Map([...m, ...good]));
    });
    return () => { alive = false; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [needKey]);

  async function bring(bit: PanelBit) {
    if (onThis(bit)) return; // F13: already on this board → no-op (client-side)
    loadId.current++; // invalidate any in-flight load
    // Optimistic: this board joins the bit's memberships (it re-groups + "on N" bumps).
    setBits((ns) =>
      ns ? ns.map((n) => (n.id === bit.id ? { ...n, boards: [...n.boards, { id: boardId, title: null }] } : n)) : ns,
    );
    try {
      await onBringIn(bit);
    } catch {
      setBits((ns) =>
        ns ? ns.map((n) => (n.id === bit.id ? { ...n, boards: n.boards.filter((b) => b.id !== boardId) } : n)) : ns,
      );
    }
  }

  if (!open) {
    return (
      <button className="loose-tab" onClick={() => setOpen(true)} title="Your notes">
        notes
      </button>
    );
  }

  const SCOPES: { key: Scope; label: string }[] = [
    { key: "loose", label: "loose" },
    { key: "this", label: "this board" },
    { key: "other", label: "other" },
    { key: "all", label: "all" },
  ];

  return (
    <aside className="loose-col" ref={colRef}>
      <div className="loose-col-head">
        <span>notes{bits ? ` (${filtered.length})` : ""}</span>
        <button className="loose-col-close" onClick={() => setOpen(false)} title="collapse">
          ×
        </button>
      </div>

      <div className="loose-scope">
        {SCOPES.map((s) => (
          <button
            key={s.key}
            className={`loose-scope-tab${scope === s.key ? " is-on" : ""}`}
            onClick={() => setScope(s.key)}
          >
            {s.label}
          </button>
        ))}
      </div>

      {bits && bits.length > 0 && (
        <div className="loose-filters">
          <input
            className="loose-search"
            value={query}
            placeholder="search all notes…"
            aria-label="Search notes"
            onChange={(e) => setQuery(e.target.value)}
          />
          <div className="loose-selects">
            <select value={typeFilter} onChange={(e) => setTypeFilter(e.target.value as TypeFilter)} aria-label="Filter by type">
              <option value="all">all types</option>
              <option value="text">text</option>
              <option value="image">images</option>
              <option value="drawing">drawings</option>
            </select>
            {allTags.length > 0 && (
              <select value={tagId} onChange={(e) => setTagId(e.target.value)} aria-label="Filter by tag">
                <option value="">any tag</option>
                {allTags.map((t) => (
                  <option key={t.id} value={t.id}>#{t.word}</option>
                ))}
              </select>
            )}
            {allSources.length > 0 && (
              <select value={sourceId} onChange={(e) => setSourceId(e.target.value)} aria-label="Filter by source">
                <option value="">any source</option>
                {allSources.map((s) => (
                  <option key={s.id} value={s.id}>{s.name}</option>
                ))}
              </select>
            )}
          </div>
        </div>
      )}

      {loading && !bits && <p className="loose-col-msg">Loading…</p>}
      {error && (
        <p className="loose-col-msg">
          {error} <button className="underline" onClick={load}>retry</button>
        </p>
      )}
      {bits && bits.length === 0 && <p className="loose-col-msg">No notes yet.</p>}
      {bits && bits.length > 0 && filtered.length === 0 && <p className="loose-col-msg">Nothing matches.</p>}
      {filtered.length > 0 && (
        <ul className="loose-list">
          {filtered.map((it) => {
            const here = onThis(it);
            const n = it.boards.length;
            return (
              <li key={it.id}>
                <button
                  className={`loose-card${here ? " is-here" : ""}`}
                  onClick={() => bring(it)}
                  title={here ? "already on this board" : "place on this board"}
                >
                  {it.type === "image" && thumbs.get(it.id) ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img className="loose-thumb" src={thumbs.get(it.id)} alt="" />
                  ) : (
                    <span className="loose-face">{faceOf(it) || "…"}</span>
                  )}
                  <span className="loose-meta">
                    {it.source && <span className="loose-from">from {it.source.name}</span>}
                    {n > 0 && (
                      <span className="loose-boards">
                        {here ? (n === 1 ? "on this board" : `on this + ${n - 1} more`) : `on ${n} board${n === 1 ? "" : "s"}`}
                      </span>
                    )}
                  </span>
                </button>
              </li>
            );
          })}
        </ul>
      )}
    </aside>
  );
}
