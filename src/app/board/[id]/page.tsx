import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getBoard, getPlacedBits } from "@/lib/db/boards";
import { BoardSurface } from "./board-surface";

export const dynamic = "force-dynamic";

export default async function BoardPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();
  const board = await getBoard(supabase, id);
  if (!board) notFound();
  const placed = await getPlacedBits(supabase, id);

  return (
    <main className="px-6 py-8">
      <header className="mx-auto mb-6 flex max-w-5xl items-baseline justify-between">
        <Link
          href="/"
          className="text-sm underline underline-offset-4 hover:no-underline"
        >
          ← all boards
        </Link>
        <span className="text-sm text-neutral-500">
          {board.title || "untitled board"}
        </span>
      </header>
      <BoardSurface board={board} placed={placed} />
    </main>
  );
}
