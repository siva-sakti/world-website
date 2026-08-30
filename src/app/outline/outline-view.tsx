"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import type { Outline } from "@/lib/outline";
import type { PanelBit } from "@/lib/db/inbox";
import { parseQuery, isEmptyQuery, compileMatcher } from "@/lib/search-query";
import { boardLabel } from "@/lib/labels";
import { OutlineRow } from "./outline-row";

// The outline lens (read-only): boards as collapsible headers with their placed
// bits & notes, plus loose/unplaced. In-memory search + kind/type + tag filters
// (mirrors notes-browser). A board with zero matches under a filter hides; the
// per-section collapse is remembered (home-surfaces' localStorage pattern).

type Cat = "note" | "text" | "image" | "drawing";

// note → composition (rename pending): kind==='note' items read as "notes" HERE
// and only here; the stored value stays kind='note' (lexicon.md is the naming
// authority — this label flips when the rename lands).
const CAT_LABEL: Record<Cat, string> = { note: "notes", text: "text", image: "images", drawing: "sketches" };
const CAT_ORDER: Cat[] = ["note", "text", "image", "drawing"];

function itemCat(b: PanelBit): Cat {
  return b.kind === "note" ? "note" : (b.type as "text" | "image" | "drawing");
}

export function OutlineView({ outline }: { outline: Outline }) {
  const [q, setQ] = useState("");
  const [cat, setCat] = useState<Cat | null>(null);
  const [tag, setTag] = useState("");
  const [collapsed, setCollapsed] = useState<Set<string>>(new Set());

  useEffect(() => {
    try {
      const raw = window.localStorage.getItem("outlineCollapsed");
      // eslint-disable-next-line react-hooks/set-state-in-effect -- one-time client storage read
      if (raw) setCollapsed(new Set(JSON.parse(raw) as string[]));
    } catch {}
  }, []);

  function toggle(id: string) {
    setCollapsed((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      try {
        window.localStorage.setItem("outlineCollapsed", JSON.stringify([...next]));
      } catch {}
      return next;
    });
  }

  // Facets actually present across the world (Set dedupes across boards).
  const { cats, tags } = useMemo(() => {
    const cs = new Set<Cat>();
    const ts = new Set<string>();
    for (const b of [...outline.boards.flatMap((x) => x.items), ...outline.loose]) {
      cs.add(itemCat(b));
      for (const t of b.tags) ts.add(t.word);
    }
    return { cats: CAT_ORDER.filter((c) => cs.has(c)), tags: [...ts].sort() };
  }, [outline]);

  // Same search language as the global + drawer search (search-query.ts): whole word
  // by default · word* starts-with · "phrase" · -exclude — never a partial word.
  const parsed = useMemo(() => parseQuery(q), [q]);
  const matcher = useMemo(() => compileMatcher(parsed), [parsed]);
  const hasWords = !isEmptyQuery(parsed);
  const filterActive = hasWords || cat !== null || tag !== "";

  function matches(b: PanelBit): boolean {
    if (cat && itemCat(b) !== cat) return false;
    if (tag && !b.tags.some((t) => t.word === tag)) return false;
    if (hasWords) {
      const hay = [b.face ?? "", b.content ?? "", (b.body ?? "").replace(/<[^>]+>/g, " "), b.source?.name ?? "", ...b.tags.map((t) => t.word)]
        .join(" ")
        .toLowerCase();
      if (!matcher(hay)) return false;
    }
    return true;
  }

  type Section = { id: string; title: string; href: string | null; items: PanelBit[] };
  let sections: Section[] = [
    ...outline.boards.map((b) => ({ id: b.id, title: boardLabel(b.title), href: `/board/${b.id}`, items: b.items.filter(matches) })),
    { id: "loose", title: "loose / unplaced", href: null, items: outline.loose.filter(matches) },
  ];
  // Under an active filter, a section with zero matches hides.
  if (filterActive) sections = sections.filter((s) => s.items.length > 0);

  return (
    <div className="mt-6">
      <div className="notes-controls">
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="search the outline…"
          className="notes-search"
          aria-label="search the outline"
        />
        {cats.length > 0 && (
          <div className="loose-scope" role="group" aria-label="kind / type filter">
            {cats.map((c) => (
              <button key={c} className={`loose-scope-tab${cat === c ? " is-on" : ""}`} onClick={() => setCat(cat === c ? null : c)}>
                {CAT_LABEL[c]}
              </button>
            ))}
          </div>
        )}
        {tags.length > 0 && (
          <select value={tag} onChange={(e) => setTag(e.target.value)} className="shelf-picker" aria-label="filter by tag">
            <option value="">all tags</option>
            {tags.map((t) => (
              <option key={t} value={t}>
                {t}
              </option>
            ))}
          </select>
        )}
      </div>

      {filterActive && sections.length === 0 ? (
        <p className="mt-8 text-neutral-500">Nothing matches — clear the search or filters.</p>
      ) : (
        <div className="mt-6 space-y-6">
          {sections.map((s) => {
            const isCollapsed = collapsed.has(s.id);
            return (
              <section key={s.id}>
                <h3 className="mb-2 flex items-baseline gap-2 text-sm">
                  <button
                    className="text-neutral-400 hover:text-neutral-700"
                    onClick={() => toggle(s.id)}
                    aria-expanded={!isCollapsed}
                    title={isCollapsed ? "expand" : "collapse"}
                  >
                    {isCollapsed ? "▸" : "▾"}
                  </button>
                  {s.href ? (
                    <Link href={s.href} className="font-medium text-neutral-800 hover:underline underline-offset-4">
                      {s.title}
                    </Link>
                  ) : (
                    <span className="font-medium text-neutral-500">{s.title}</span>
                  )}
                  <span className="text-neutral-400">{s.items.length}</span>
                </h3>
                {!isCollapsed &&
                  (s.items.length === 0 ? (
                    <p className="pl-4 text-xs text-neutral-400">
                      {s.href ? "empty — nothing placed here yet" : "nothing loose right now"}
                    </p>
                  ) : (
                    <ul className="notes-list">
                      {s.items.map((b) => (
                        <OutlineRow key={b.id} item={b} />
                      ))}
                    </ul>
                  ))}
              </section>
            );
          })}
        </div>
      )}
    </div>
  );
}
