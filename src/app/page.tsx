import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { listBoards } from "@/lib/db/boards";
import { newBoard } from "./actions";
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
            <li key={c.id}>
              <Link
                href={`/board/${c.id}`}
                className="underline underline-offset-4 hover:no-underline"
              >
                {c.title || "untitled board"}
              </Link>
            </li>
          ))}
        </ul>
      )}
    </main>
  );
}
