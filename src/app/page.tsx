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

  return (
    <main className="mx-auto max-w-3xl px-6 py-14">
      <header className="mb-10 flex items-baseline justify-between">
        <h1 className="text-2xl font-semibold tracking-tight">world</h1>
        <div className="flex items-baseline gap-5 text-sm">
          <Link href="/inbox" className="underline underline-offset-4 hover:no-underline">
            inbox
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
    </main>
  );
}
