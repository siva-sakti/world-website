import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { listBoards } from "@/lib/db/boards";
import { listGroups } from "@/lib/db/shelf";
import { newBoard } from "./actions";
import { logout } from "./login/actions";
import { Shelf } from "./shelf";

export const dynamic = "force-dynamic";

// HOME — the three-tier layout (organize plan O1b, finally for real):
//   rooms BIG (boards · notes · ✎ write, each with its act beside it)
//   lenses small (find · graph, top right)
//   housekeeping in a quiet footer (tags · sources · trash · export · sign out)
export default async function Home() {
  const supabase = await createClient();
  const boards = await listBoards(supabase);
  const groups = await listGroups(supabase);
  // The loose-pile count for the notes room — cheap (head-only).
  let looseCount: number | null = null;
  try {
    const { count } = await supabase
      .from("the_inbox")
      .select("id", { count: "exact", head: true });
    looseCount = count;
  } catch {
    /* the line renders without a count */
  }

  return (
    <main className="mx-auto max-w-3xl px-6 py-14">
      <header className="mb-10 flex items-baseline justify-between">
        <h1 className="text-2xl font-semibold tracking-tight">world</h1>
        {/* the lenses — ways to look across everything */}
        <div className="flex items-baseline gap-5 text-sm">
          <Link href="/find" className="text-neutral-500 underline underline-offset-4 hover:no-underline">
            find
          </Link>
          <Link href="/graph" className="text-neutral-500 underline underline-offset-4 hover:no-underline">
            graph
          </Link>
        </div>
      </header>

      {/* ROOM · boards — with its act beside it */}
      <div className="mb-3 flex items-baseline justify-between">
        <h2 className="text-xs uppercase tracking-wide text-neutral-400">boards</h2>
        <form action={newBoard}>
          <button className="text-sm underline underline-offset-4 hover:no-underline">
            + new board
          </button>
        </form>
      </div>
      <Shelf boards={boards} groups={groups} />

      {/* ROOM · notes — with its act beside it */}
      <section className="mt-12">
        <div className="mb-3 flex items-baseline justify-between">
          <h2 className="text-xs uppercase tracking-wide text-neutral-400">notes</h2>
          <Link href="/write" className="text-sm underline underline-offset-4 hover:no-underline" title="Just write — it lands in your notes">
            ✎ write
          </Link>
        </div>
        <p className="text-sm">
          <Link href="/notes" className="underline underline-offset-4 hover:no-underline">
            your notes →
          </Link>
          {looseCount !== null && (
            <span className="ml-2 text-neutral-400">{looseCount} not on any board</span>
          )}
        </p>
      </section>

      {/* housekeeping — the quiet footer */}
      <footer className="mt-16 border-t border-neutral-200 pt-4">
        <div className="flex flex-wrap items-baseline gap-x-5 gap-y-1 text-xs text-neutral-400">
          <Link href="/tags" className="underline underline-offset-4 hover:no-underline">tags</Link>
          <Link href="/sources" className="underline underline-offset-4 hover:no-underline">sources</Link>
          <Link href="/trash" className="underline underline-offset-4 hover:no-underline">trash</Link>
          <a href="/api/export" className="underline underline-offset-4 hover:no-underline" title="Download all your data">export</a>
          <form action={logout} className="inline">
            <button className="underline underline-offset-4 hover:no-underline">sign out</button>
          </form>
        </div>
      </footer>
    </main>
  );
}
