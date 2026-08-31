"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { listAllBits, type PanelBit } from "@/lib/db/inbox";
import { signedUrl } from "@/lib/storage";
import { haystack, matches } from "@/lib/search";

// THE DRAWER — a browser of all your bits, split by kind (bits · notes · all) and
// filterable by type/tag/source, reachable from a tab. It has TWO HOMES and the
// same clothes in both; only the act at the end differs (N4b):
//
//   board — "where" scope (unplaced first), click PLACES the bit on this board;
//           a bit placed on a second board lives on both (multi-board).
//   note  — click GATHERS the bit into the writing at your caret; the note itself
//           is excluded, and rows already gathered say so.
//
// The two modes are a discriminated union, so each declares exactly what it needs
// and TypeScript refuses the wrong combination. Position/wheel/scope differ between
// them but are CORRELATED facts about two homes, not independent knobs — hence one
// `variant`, not four booleans. Filtering is in-memory over the loaded set (snappy
// at this scale; server-side search + paging is the named scale trigger).

type TypeFilter = "all" | "text" | "image" | "drawing";
type Scope = "loose" | "this" | "other" | "all";
type Kind = "all" | "bit" | "note"; // the drawer's primary split (owner: bits · notes · all)

function faceOf(it: PanelBit): string {
  if (it.face) return it.face;
  if (it.type === "image") return it.file_name ?? "image";
  return it.type === "drawing" ? "drawing" : "";
}

/** On a board: place what you pick onto this board. */
type BoardMode = {
  variant: "board";
  boardId: string;
  onBringIn: (bit: PanelBit) => Promise<void>;
  refreshSignal: number;
};
/** On a note: gather what you pick into the writing. */
type NoteMode = {
  variant: "note";
  excludeId: string; // the note being written — never offer it to itself
  gatheredIds: Set<string>; // already in the writing → the row says "gathered"
  onGather: (bit: PanelBit) => void;
};

export function Drawer(props: BoardMode | NoteMode) {
  const onBoard = props.variant === "board";
  const boardId = onBoard ? props.boardId : null;
  const refreshSignal = onBoard ? props.refreshSignal : 0;
  const [supabase] = useState(() => createClient());
  const [open, setOpen] = useState(false);
  const [bits, setBits] = useState<PanelBit[] | null>(null);
  const [thumbs, setThumbs] = useState<Map<string, string>>(new Map());
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [scope, setScope] = useState<Scope>("loose");
  const [kind, setKind] = useState<Kind>("all");
  const [query, setQuery] = useState("");
  const [tagId, setTagId] = useState("");
  const [sourceId, setSourceId] = useState("");
  const [typeFilter, setTypeFilter] = useState<TypeFilter>("all");
  const loadId = useRef(0);
  const colRef = useRef<HTMLElement>(null);

  // Keep wheel events inside the column — the BOARD's native wheel listener (an
  // ancestor) would otherwise zoom the canvas while you scroll. Meaningless on a
  // note page, so it doesn't run there.
  useEffect(() => {
    const el = colRef.current;
    if (!el || !onBoard) return;
    const stop = (e: WheelEvent) => e.stopPropagation();
    el.addEventListener("wheel", stop);
    return () => el.removeEventListener("wheel", stop);
  }, [open, onBoard]);

  async function load() {
    const my = ++loadId.current;
    setLoading(true);
    setError(null);
    try {
      const items = await listAllBits(supabase);
      if (my !== loadId.current) return;
      setBits(items);
    } catch {
      if (my === loadId.current) setError("Couldn't load your drawer.");
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
  const onThis = (n: PanelBit) => Boolean(boardId) && n.boards.some((b) => b.id === boardId);
  // The row's status word — "on this board" on a board, "gathered" on a note.
  const marked = (n: PanelBit) =>
    onBoard ? onThis(n) : props.gatheredIds.has(n.id);

  // On a note page the editor must NOT blur when you tap a row, or the chip loses
  // the caret it should land at (N4b §6.6 — the same trick the rich-text toolbar
  // uses). Unused on a board.
  const keepCaret = (e: React.MouseEvent) => e.preventDefault();

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

  // Each bit's searchable words, built ONCE per load through the one builder
  // (lib/search) — not per keystroke. `faceOf` is fed in so today's reach is
  // preserved exactly (a faceless doodle still answers to "drawing"); `body` is
  // the addition — the owner's full-text ruling, 2026-08-28.
  const hays = useMemo(() => {
    const m = new Map<string, string>();
    for (const n of bits ?? []) {
      m.set(
        n.id,
        haystack({
          face: faceOf(n),
          content: n.content,
          body: n.body,
          sourceName: n.source?.name,
          tagWords: n.tags.map((t) => t.word),
        }),
      );
    }
    return m;
  }, [bits]);

  let filtered = (bits ?? []).filter((n) => {
    // A note never offers itself for gathering (the db refuses it too — this
    // keeps it off the screen). N4b §6.1.
    if (!onBoard && n.id === props.excludeId) return false;
    if (kind !== "all" && n.kind !== kind) return false;
    if (onBoard && scope === "loose" && !isLoose(n)) return false;
    if (onBoard && scope === "this" && !onThis(n)) return false;
    if (onBoard && scope === "other" && (isLoose(n) || onThis(n))) return false;
    if (typeFilter !== "all" && n.type !== typeFilter) return false;
    if (sourceId && n.source?.id !== sourceId) return false;
    if (tagId && !n.tags.some((t) => t.id === tagId)) return false;
    if (!matches(hays.get(n.id) ?? "", query)) return false; // the one rule
    return true;
  });
  // "all" shows loose first; JS sort is stable, so newest-first holds within groups.
  if (onBoard && scope === "all") {
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

  /** What a row click does — the one difference between the two homes. */
  async function pick(bit: PanelBit) {
    if (props.variant === "note") return props.onGather(bit);
    const { boardId: bid, onBringIn } = props;
    if (onThis(bit)) return; // F13: already on this board → no-op (client-side)
    loadId.current++; // invalidate any in-flight load
    // Optimistic: this board joins the bit's memberships (it re-groups + "on N" bumps).
    setBits((ns) =>
      ns ? ns.map((n) => (n.id === bit.id ? { ...n, boards: [...n.boards, { id: bid, title: null }] } : n)) : ns,
    );
    try {
      await onBringIn(bit);
    } catch {
      setBits((ns) =>
        ns ? ns.map((n) => (n.id === bit.id ? { ...n, boards: n.boards.filter((b) => b.id !== bid) } : n)) : ns,
      );
    }
  }

  if (!open) {
    return (
      <button
        className={`loose-tab${onBoard ? "" : " is-fixed"}`}
        onClick={() => setOpen(true)}
        title={onBoard ? "Your drawer — things to place on this board" : "Your drawer — things to gather into your writing"}
      >
        drawer
      </button>
    );
  }

  // Primary split (owner's picture: bits · notes · all).
  const KINDS: { key: Kind; label: string }[] = [
    { key: "bit", label: "bits" },
    { key: "note", label: "notes" },
    { key: "all", label: "all" },
  ];
  // "Where" — the placement filter, default unplaced (mostly you see not-yet-placed).
  const SCOPES: { key: Scope; label: string }[] = [
    { key: "loose", label: "unplaced" },
    { key: "this", label: "this board" },
    { key: "other", label: "other boards" },
    { key: "all", label: "anywhere" },
  ];

  return (
    <aside className={`loose-col${onBoard ? "" : " is-fixed"}`} ref={colRef}>
      <div className="loose-col-head">
        <span>drawer{bits ? ` (${filtered.length})` : ""}</span>
        <button className="loose-col-close" onClick={() => setOpen(false)} title="collapse">
          ×
        </button>
      </div>

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

      {bits && bits.length > 0 && (
        <div className="loose-filters">
          <input
            className="loose-search"
            value={query}
            placeholder="search…"
            aria-label="Search the drawer"
            onChange={(e) => setQuery(e.target.value)}
          />
          <div className="loose-selects">
            {onBoard && (
              <select value={scope} onChange={(e) => setScope(e.target.value as Scope)} aria-label="Filter by placement">
                {SCOPES.map((s) => (
                  <option key={s.key} value={s.key}>{s.label}</option>
                ))}
              </select>
            )}
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
      {bits && bits.length === 0 && <p className="loose-col-msg">Nothing here yet.</p>}
      {bits && bits.length > 0 && filtered.length === 0 && <p className="loose-col-msg">Nothing matches.</p>}
      {filtered.length > 0 && (
        <ul className="loose-list">
          {filtered.map((it) => {
            const isMarked = marked(it);
            const n = it.boards.length;
            return (
              <li key={it.id}>
                <button
                  className={`loose-card${isMarked ? " is-here" : ""}`}
                  onClick={() => pick(it)}
                  onMouseDown={onBoard ? undefined : keepCaret}
                  title={
                    onBoard
                      ? isMarked
                        ? "already on this board"
                        : "place on this board"
                      : isMarked
                        ? "already gathered into this writing"
                        : "gather into your writing"
                  }
                >
                  {it.type === "image" && thumbs.get(it.id) ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img className="loose-thumb" src={thumbs.get(it.id)} alt="" />
                  ) : (
                    <span className="loose-face">{faceOf(it) || "…"}</span>
                  )}
                  <span className="loose-meta">
                    {it.source && <span className="loose-from">from {it.source.name}</span>}
                    {!onBoard && isMarked && <span className="loose-boards">gathered</span>}
                    {n > 0 && (
                      <span className="loose-boards">
                        {onBoard && isMarked
                          ? n === 1
                            ? "on this board"
                            : `on this + ${n - 1} more`
                          : `on ${n} board${n === 1 ? "" : "s"}`}
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
