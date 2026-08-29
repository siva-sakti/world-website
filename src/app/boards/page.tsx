import { createClient } from "@/lib/supabase/server";
import { listBoards } from "@/lib/db/boards";
import { listGroups } from "@/lib/db/shelf";
import { newBoard } from "@/app/actions";
import { Shelf } from "@/app/shelf";
import { JumpTo, type JumpItem } from "@/components/jump-to";
import { boardLabel } from "@/lib/labels";

export const dynamic = "force-dynamic";

// ALL BOARDS — the cabinet's complete board list (V3): every board, grouped and
// manageable (the Shelf that used to be home). Home is the desk now; this is
// where the full inventory + its controls live.
export default async function AllBoardsPage() {
  const supabase = await createClient();
  const boards = await listBoards(supabase);
  const groups = await listGroups(supabase);

  const jumpItems: JumpItem[] = boards.map((b) => ({
    id: b.id,
    title: boardLabel(b.title),
    href: `/board/${b.id}`,
    folder: groups.find((g) => g.id === b.group_id)?.name ?? null,
  }));

  return (
    <main className="mx-auto max-w-3xl px-6 py-10">
      <header className="mb-6 flex items-baseline justify-between">
        <span className="text-sm font-semibold">all boards</span>
        <form action={newBoard}>
          <button className="text-sm underline underline-offset-4 hover:no-underline">+ new board</button>
        </form>
      </header>
      <JumpTo items={jumpItems} placeholder="Jump to a board…" emptyMatch="No boards match">
        <Shelf boards={boards} groups={groups} />
      </JumpTo>
    </main>
  );
}
