import { createClient } from "@/lib/supabase/server";
import { getWordGraph } from "@/lib/db/graph";
import { WordGraph } from "./word-graph";

export const dynamic = "force-dynamic";

export default async function GraphPage() {
  const supabase = await createClient();
  const graph = await getWordGraph(supabase);

  return (
    <main className="graph-page mx-auto max-w-6xl">
      <header className="flex shrink-0 flex-wrap items-baseline justify-between gap-3 text-sm">
        <span className="font-semibold">graph</span>
      </header>

      <p className="shrink-0 text-sm text-neutral-500">
        Your <b className="font-medium text-neutral-700">word web</b> — every tag and the bits that
        carry it. Bigger dots are used more; hover to trace what connects, click a dot to open it.
      </p>

      {graph.nodes.length === 0 ? (
        <p className="text-neutral-500">
          Nothing to graph yet — tag a few bits and they&rsquo;ll web together here.
        </p>
      ) : (
        <WordGraph nodes={graph.nodes} links={graph.links} />
      )}
    </main>
  );
}
