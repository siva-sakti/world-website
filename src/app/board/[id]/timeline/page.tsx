import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getBoard, getBoardCards } from "@/lib/db/boards";
import { boardLabel } from "@/lib/labels";
import { TimelineDays } from "./timeline-days";

export const dynamic = "force-dynamic";

// THE BOARD'S TIMELINE — the same board, told as when things arrived.
//
// The owner's ask: *"when you're making a board you pull things in on different dates,
// so there's a fun view — here's your board in a timeline view."*
//
// No new data and no new query: every placement has always stamped `arrived_at`, and the
// board's own read (`board_cards`) already returns it. This is that column, sorted.
//
// A LIST for now, by instruction — *"right now just make it a list view and I'll give you
// better UI later."* So: no rail, no dots, no scale. Days as headings, oldest first,
// because the interesting thing is the order a composition was assembled in.
//
// HONEST LIMIT, worth knowing before opening it: a board built in one sitting is one
// heading with everything under it. The view only says something when a board grew over
// time — which is exactly the kind it was asked for.

export default async function BoardTimelinePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();
  const board = await getBoard(supabase, id);
  if (!board) notFound();
  const cards = await getBoardCards(supabase, id);

  // Oldest first — the story of how the board was built, not a feed.
  const inOrder = [...cards].sort((a, b) => a.arrived_at.localeCompare(b.arrived_at));

  return (
    <main className="mx-auto max-w-2xl px-6 py-10">
      <header className="mb-6 flex items-baseline justify-between">
        <span className="text-sm font-semibold">{boardLabel(board.title)} · timeline</span>
        <Link href={`/board/${id}`} className="text-sm underline underline-offset-4 hover:no-underline">
          back to the board
        </Link>
      </header>

      {inOrder.length === 0 ? (
        <p className="text-sm text-neutral-500">
          Nothing on this board yet — put something on it and its arrival shows up here.
        </p>
      ) : (
        // Grouped by day IN THE READER'S ZONE, so a card added at 6pm sits under that
        // evening rather than under the next morning (I-G5) — which means the grouping
        // happens on the client, in ./timeline-days.
        <TimelineDays rows={inOrder} />
      )}
    </main>
  );
}
