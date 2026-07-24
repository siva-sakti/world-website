import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { getWordGraph } from "@/lib/db/graph";
import { logout } from "@/app/login/actions";
import { WordGraph } from "./word-graph";

export const dynamic = "force-dynamic";

export default async function GraphPage() {
  const supabase = await createClient();
  const graph = await getWordGraph(supabase);

  return (
    <main className="mx-auto max-w-6xl px-6 py-6">
      <header className="mb-3 flex items-baseline justify-between text-sm">
        <div className="flex items-baseline gap-5">
          <Link href="/" className="underline underline-offset-4 hover:no-underline">
            ← boards
          </Link>
          <Link href="/find" className="text-neutral-500 underline underline-offset-4 hover:no-underline">
            find
          </Link>
          <Link href="/tags" className="text-neutral-500 underline underline-offset-4 hover:no-underline">
            tags
          </Link>
          <span className="font-semibold">graph</span>
        </div>
        <form action={logout}>
          <button className="text-neutral-500 underline underline-offset-4 hover:no-underline">
            sign out
          </button>
        </form>
      </header>

      <p className="mb-3 text-sm text-neutral-500">
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
