import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { listBoards } from "@/lib/db/boards";
import { listGroups } from "@/lib/db/shelf";
import { newBoard } from "@/app/actions";
import { logout } from "@/app/login/actions";
import { Shelf } from "@/app/shelf";

export const dynamic = "force-dynamic";

// ALL BOARDS — the cabinet's complete board list (V3): every board, grouped and
// manageable (the Shelf that used to be home). Home is the desk now; this is
// where the full inventory + its controls live.
export default async function AllBoardsPage() {
  const supabase = await createClient();
  const boards = await listBoards(supabase);
  const groups = await listGroups(supabase);

  return (
    <main className="mx-auto max-w-3xl px-6 py-10">
      <header className="mb-8 flex items-baseline justify-between">
        <div className="flex items-baseline gap-5 text-sm">
          <Link href="/" className="underline underline-offset-4 hover:no-underline">← home</Link>
          <span className="font-semibold">all boards</span>
          <Link href="/notes" className="text-neutral-500 underline underline-offset-4 hover:no-underline">notes</Link>
          <Link href="/bits" className="text-neutral-500 underline underline-offset-4 hover:no-underline">bits</Link>
        </div>
        <div className="flex items-baseline gap-5 text-sm">
          <form action={newBoard}>
            <button className="underline underline-offset-4 hover:no-underline">+ new board</button>
          </form>
          <form action={logout}>
            <button className="text-neutral-500 underline underline-offset-4 hover:no-underline">sign out</button>
          </form>
        </div>
      </header>
      <Shelf boards={boards} groups={groups} />
    </main>
  );
}
