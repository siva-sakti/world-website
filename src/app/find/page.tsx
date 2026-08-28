import { createClient } from "@/lib/supabase/server";
import { findItems, type FindKind } from "@/lib/db/find";
import { listTags } from "@/lib/db/tags";
import { FindLive } from "./find-live";

export const dynamic = "force-dynamic";

// Find (N4): load everything once (server), then filter IN THE BROWSER for an instant
// feel (FindLive). An inbound `?tag=`/`?q=`/`?kind=` still seeds the initial filter so
// links from elsewhere (a tag chip → /find?tag=X) land pre-filtered.
export default async function FindPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const sp = await searchParams;
  const q = typeof sp.q === "string" ? sp.q : "";
  const tagId = typeof sp.tag === "string" ? sp.tag : null;
  const kindParam = typeof sp.kind === "string" ? sp.kind : "all";
  const kind: FindKind =
    kindParam === "bit" || kindParam === "note" || kindParam === "board" ? kindParam : "all";

  const supabase = await createClient();
  const [items, tags] = await Promise.all([
    findItems(supabase, { kind: "all" }),
    listTags(supabase),
  ]);

  return (
    <main className="mx-auto max-w-3xl px-6 py-10">
      <header className="mb-6 flex items-baseline justify-between">
        <span className="text-sm font-semibold">find</span>
      </header>
      <FindLive items={items} tags={tags} initialQ={q} initialTag={tagId} initialKind={kind} />
    </main>
  );
}
