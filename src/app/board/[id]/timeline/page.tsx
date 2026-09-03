import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getBoard, getBoardCards } from "@/lib/db/boards";
import { boardLabel, bitLabel, typeLabel } from "@/lib/labels";
import { fmt } from "@/lib/dates";

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

  // Grouped by DAY. `fmt` is the app's one date wording, so the headings match every
  // other date on the site rather than inventing a format here.
  const days: { day: string; cards: typeof inOrder }[] = [];
  for (const c of inOrder) {
    const day = fmt(c.arrived_at);
    const last = days[days.length - 1];
    if (last && last.day === day) last.cards.push(c);
    else days.push({ day, cards: [c] });
  }

  return (
    <main className="mx-auto max-w-2xl px-6 py-10">
      <header className="mb-6 flex items-baseline justify-between">
        <span className="text-sm font-semibold">{boardLabel(board.title)} · timeline</span>
        <Link href={`/board/${id}`} className="text-sm underline underline-offset-4 hover:no-underline">
          back to the board
        </Link>
      </header>

      {days.length === 0 ? (
        <p className="text-sm text-neutral-500">
          Nothing on this board yet — put something on it and its arrival shows up here.
        </p>
      ) : (
        <>
          <p className="mb-6 text-sm text-neutral-500">
            {inOrder.length} {inOrder.length === 1 ? "thing" : "things"}, in the order they arrived
            {days.length > 1 ? ` across ${days.length} days` : ""}.
          </p>
          <ol className="space-y-6">
            {days.map((d) => (
              <li key={d.day}>
                <h2 className="mb-2 text-xs uppercase tracking-wide text-neutral-400">{d.day}</h2>
                <ul className="space-y-1 text-sm">
                  {d.cards.map((c) => (
                    <li key={c.placement_id} className="flex items-baseline justify-between gap-4">
                      {/* A card can be a bit OR a board placed as a card — both have a label. */}
                      <span className={c.label ? "" : "italic text-neutral-500"}>
                        {c.thing === "board"
                          ? boardLabel(c.label)
                          : bitLabel(c.type ?? "", c.label)}
                      </span>
                      <span className="shrink-0 text-xs text-neutral-400">
                        {c.thing === "board" ? "board" : typeLabel(c.type)}
                      </span>
                    </li>
                  ))}
                </ul>
              </li>
            ))}
          </ol>
        </>
      )}
    </main>
  );
}
