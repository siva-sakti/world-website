import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { findBits, type FindResult } from "@/lib/db/find";
import { listTags } from "@/lib/db/tags";
import { bitLabel } from "@/lib/labels";
import { logout } from "@/app/login/actions";
import { SearchBox } from "./search-box";

export const dynamic = "force-dynamic";

export default async function FindPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const sp = await searchParams;
  const q = typeof sp.q === "string" ? sp.q : "";
  const tagId = typeof sp.tag === "string" ? sp.tag : undefined;

  const supabase = await createClient();
  const [results, tags] = await Promise.all([
    findBits(supabase, { q, tagId }),
    listTags(supabase),
  ]);
  const activeTag = tags.find((t) => t.id === tagId);
  const filtered = Boolean(q || tagId);

  return (
    <main className="mx-auto max-w-3xl px-6 py-10">
      <header className="mb-6 flex items-baseline justify-between">
        <div className="flex items-baseline gap-5 text-sm">
          <Link href="/" className="underline underline-offset-4 hover:no-underline">
            ← boards
          </Link>
          <span className="font-semibold">find</span>
          <Link href="/tags" className="text-neutral-500 underline underline-offset-4 hover:no-underline">
            tags
          </Link>
        </div>
        <form action={logout}>
          <button className="text-sm text-neutral-500 underline underline-offset-4 hover:no-underline">
            sign out
          </button>
        </form>
      </header>

      <SearchBox initial={q} />

      {tags.length > 0 && (
        <div className="mt-4 flex flex-wrap gap-2">
          {tagId && (
            <Link
              href={q ? `/find?q=${encodeURIComponent(q)}` : "/find"}
              className="tag-chip"
              title="clear tag filter"
            >
              × clear
            </Link>
          )}
          {tags.map((t) => {
            const params = new URLSearchParams();
            if (q) params.set("q", q);
            params.set("tag", t.id);
            return (
              <Link
                key={t.id}
                href={`/find?${params}`}
                className={`tag-chip${t.id === tagId ? " is-on" : ""}`}
              >
                {t.word}
                <span className="ml-1 text-neutral-400">{t.count}</span>
              </Link>
            );
          })}
        </div>
      )}

      <p className="mt-6 mb-3 text-sm text-neutral-500">
        {filtered
          ? `${results.length} ${results.length === 1 ? "bit" : "bits"}${
              activeTag ? ` tagged “${activeTag.word}”` : ""
            }${q ? ` matching “${q}”` : ""}`
          : `everything — ${results.length} ${results.length === 1 ? "bit" : "bits"}, newest first`}
      </p>

      {results.length === 0 ? (
        <p className="text-neutral-500">
          {filtered ? "Nothing matches — try a different word or tag." : "No bits yet — make some on a board."}
        </p>
      ) : (
        <ul className="divide-y divide-neutral-100">
          {results.map((b) => (
            <li key={b.id} className="flex items-baseline justify-between gap-4 py-3">
              <Link
                href={`/bit/${b.id}`}
                className={`hover:underline underline-offset-4 ${b.face ? "" : "italic text-neutral-500"}`}
              >
                {bitLabel(b.type, b.face)}
              </Link>
              <span className="flex shrink-0 items-baseline gap-2">
                {b.tags.map((t) => (
                  <Link
                    key={t.id}
                    href={`/find?tag=${t.id}`}
                    className="tag-chip"
                  >
                    {t.word}
                  </Link>
                ))}
                <span className="text-xs text-neutral-400">{b.type}</span>
              </span>
            </li>
          ))}
        </ul>
      )}
    </main>
  );
}
