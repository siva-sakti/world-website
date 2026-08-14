import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { listBoards } from "@/lib/db/boards";
import { boardLabel } from "@/lib/labels";
import { newBoard, trashBoardAction } from "./actions";
import { logout } from "./login/actions";

export const dynamic = "force-dynamic";

export default async function Home() {
  const supabase = await createClient();
  const boards = await listBoards(supabase);
  // The loose-pile count for the notes receptacle line — cheap (head-only).
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
        <div className="flex items-baseline gap-5 text-sm">
          <Link href="/write" className="underline underline-offset-4 hover:no-underline" title="Just write a note — it lands in your notes">
            ✎ write
          </Link>
          <Link href="/notes" className="underline underline-offset-4 hover:no-underline">
            notes
          </Link>
          <Link href="/find" className="text-neutral-500 underline underline-offset-4 hover:no-underline">
            find
          </Link>
          <Link href="/tags" className="text-neutral-500 underline underline-offset-4 hover:no-underline">
            tags
          </Link>
          <Link href="/sources" className="text-neutral-500 underline underline-offset-4 hover:no-underline">
            sources
          </Link>
          <Link href="/graph" className="text-neutral-500 underline underline-offset-4 hover:no-underline">
            graph
          </Link>
          <Link href="/trash" className="text-neutral-500 underline underline-offset-4 hover:no-underline">
            trash
          </Link>
          <a
            href="/api/export"
            className="text-neutral-500 underline underline-offset-4 hover:no-underline"
            title="Download all your data"
          >
            export
          </a>
          <form action={newBoard}>
            <button className="underline underline-offset-4 hover:no-underline">
              new board
            </button>
          </form>
          <form action={logout}>
            <button className="text-neutral-500 underline underline-offset-4 hover:no-underline">
              sign out
            </button>
          </form>
        </div>
      </header>

      <h2 className="mb-3 text-xs uppercase tracking-wide text-neutral-400">boards</h2>
      {boards.length === 0 ? (
        <p className="text-neutral-500">
          Nothing here yet — make your first board.
        </p>
      ) : (
        <ul className="space-y-3">
          {boards.map((c) => (
            <li key={c.id} className="flex items-baseline justify-between gap-4">
              <Link
                href={`/board/${c.id}`}
                className="underline underline-offset-4 hover:no-underline"
              >
                {boardLabel(c.title)}
              </Link>
              <form action={trashBoardAction}>
                <input type="hidden" name="id" value={c.id} />
                <button
                  className="text-xs text-neutral-400 hover:text-neutral-700"
                  title="Trash this board (its bits stay in your collection; restorable)"
                >
                  trash
                </button>
              </form>
            </li>
          ))}
        </ul>
      )}

      {/* Notes — the sibling receptacle (D-113): boards live here, and so do your
          notes. The count is the loose pile (the_inbox view — everything not on
          a board); the page itself is the list. */}
      <section className="mt-10">
        <h2 className="mb-3 text-xs uppercase tracking-wide text-neutral-400">notes</h2>
        <p className="text-sm">
          <Link href="/notes" className="underline underline-offset-4 hover:no-underline">
            your notes →
          </Link>
          {looseCount !== null && (
            <span className="ml-2 text-neutral-400">
              {looseCount} not on any board
            </span>
          )}
          <Link href="/write" className="ml-4 text-neutral-500 underline underline-offset-4 hover:no-underline">
            ✎ write a new one
          </Link>
        </p>
      </section>
    </main>
  );
}
