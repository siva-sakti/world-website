import { createClient } from "@/lib/supabase/server";
import { searchItems, type SearchKind } from "@/lib/db/search";
import { listTags } from "@/lib/db/tags";
import { SearchLive } from "./search-live";

export const dynamic = "force-dynamic";

// Search (renamed from find, D-log at build): load everything once (server), then
// filter IN THE BROWSER for an instant feel (SearchLive). An inbound `?tag=`/`?q=`/
// `?kind=` still seeds the initial filter so links from elsewhere (a tag chip →
// /search?tag=X) land pre-filtered. Old `/find` links redirect here (next.config).
export default async function SearchPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const sp = await searchParams;
  const q = typeof sp.q === "string" ? sp.q : "";
  const tagId = typeof sp.tag === "string" ? sp.tag : null;
  const kindParam = typeof sp.kind === "string" ? sp.kind : "all";
  const kind: SearchKind = kindParam === "bit" || kindParam === "note" ? kindParam : "all";

  const supabase = await createClient();
  const [items, tags] = await Promise.all([
    searchItems(supabase, { kind: "all" }),
    listTags(supabase),
  ]);

  return (
    <main className="mx-auto max-w-3xl px-6 py-10">
      <header className="mb-6 flex items-baseline justify-between">
        <span className="text-sm font-semibold">search</span>
      </header>
      <SearchLive items={items} tags={tags} initialQ={q} initialTag={tagId} initialKind={kind} />
    </main>
  );
}
