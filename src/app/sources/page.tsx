import { createClient } from "@/lib/supabase/server";
import { listManagedSources } from "@/lib/db/sources";
import { SourceManager } from "./source-manager";

export const dynamic = "force-dynamic";

export default async function SourcesPage() {
  const supabase = await createClient();
  const sources = await listManagedSources(supabase);

  return (
    <main className="mx-auto max-w-2xl px-6 py-10">
      <header className="mb-6 flex items-baseline justify-between">
        <span className="text-sm font-semibold">sources</span>
      </header>

      <p className="mb-6 text-sm text-neutral-500">
        Your reading list — every source you&rsquo;ve noted from, most-used first. Click a name to
        rename it (every note follows), give it a link, merge two into one, or delete one — its
        notes stay, they just lose the &ldquo;from …&rdquo; stamp. Open a count to see everything
        from that source.
      </p>

      <SourceManager initial={sources} />
    </main>
  );
}
