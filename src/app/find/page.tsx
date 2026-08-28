import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { findItems, type FindItem, type FindKind } from "@/lib/db/find";
import { listTags } from "@/lib/db/tags";
import { SearchBox } from "./search-box";

export const dynamic = "force-dynamic";

const KINDS: { key: FindKind; label: string }[] = [
  { key: "all", label: "all" },
  { key: "bit", label: "bits" },
  { key: "note", label: "notes" },
  { key: "board", label: "boards" },
];

// The small "what it is" badge on each result (N4): board · note · a bit's media type.
function badge(item: FindItem): string {
  if (item.kind === "board") return "board";
  if (item.kind === "note") return "note";
  return item.mediaType === "drawing" ? "doodle" : item.mediaType ?? "bit";
}

export default async function FindPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const sp = await searchParams;
  const q = typeof sp.q === "string" ? sp.q : "";
  const tagId = typeof sp.tag === "string" ? sp.tag : undefined;
  const kindParam = typeof sp.kind === "string" ? sp.kind : "all";
  const kind: FindKind =
    kindParam === "bit" || kindParam === "note" || kindParam === "board" ? kindParam : "all";

  const supabase = await createClient();
  const [results, tags] = await Promise.all([
    findItems(supabase, { q, tagId, kind }),
    listTags(supabase),
  ]);
  const activeTag = tags.find((t) => t.id === tagId);
  const filtered = Boolean(q || tagId || kind !== "all");

  // A /find URL preserving the current query + tag, setting one facet (kind or tag).
  function href(next: { kind?: FindKind; tag?: string | null }): string {
    const params = new URLSearchParams();
    if (q) params.set("q", q);
    const t = next.tag !== undefined ? next.tag : tagId;
    if (t) params.set("tag", t);
    const k = next.kind !== undefined ? next.kind : kind;
    if (k && k !== "all") params.set("kind", k);
    const qs = params.toString();
    return qs ? `/find?${qs}` : "/find";
  }

  return (
    <main className="mx-auto max-w-3xl px-6 py-10">
      <header className="mb-6 flex items-baseline justify-between">
        <span className="text-sm font-semibold">find</span>
      </header>

      <SearchBox initial={q} />

      {/* Kind tabs (N4) — all · bits · notes · boards, carried in the URL. */}
      <div className="loose-scope mt-4">
        {KINDS.map((k) => (
          <Link
            key={k.key}
            href={href({ kind: k.key })}
            className={`loose-scope-tab${kind === k.key ? " is-on" : ""}`}
          >
            {k.label}
          </Link>
        ))}
      </div>

      {tags.length > 0 && (
        <div className="mt-3 flex flex-wrap gap-2">
          {tagId && (
            <Link href={href({ tag: null })} className="tag-chip" title="clear tag filter">
              × clear
            </Link>
          )}
          {tags.map((t) => (
            <Link
              key={t.id}
              href={href({ tag: t.id })}
              className={`tag-chip${t.id === tagId ? " is-on" : ""}`}
            >
              {t.word}
              <span className="ml-1 text-neutral-400">{t.count}</span>
            </Link>
          ))}
        </div>
      )}

      <p className="mt-6 mb-3 text-sm text-neutral-500">
        {filtered
          ? `${results.length} ${results.length === 1 ? "result" : "results"}${
              activeTag ? ` tagged “${activeTag.word}”` : ""
            }${q ? ` matching “${q}”` : ""}`
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
                href={item.kind === "board" ? `/board/${item.id}` : `/bit/${item.id}`}
                className={`hover:underline underline-offset-4 ${item.label ? "" : "italic text-neutral-500"}`}
              >
                {item.label || "untitled"}
              </Link>
              <span className="flex shrink-0 items-baseline gap-2">
                {item.tags.map((t) => (
                  <Link key={t.id} href={href({ tag: t.id })} className="tag-chip">
                    {t.word}
                  </Link>
                ))}
                <span className="text-xs text-neutral-400">{badge(item)}</span>
              </span>
            </li>
          ))}
        </ul>
      )}
    </main>
  );
}
