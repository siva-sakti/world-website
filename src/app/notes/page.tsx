import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import type { Bit } from "@/lib/types";
import { fmt } from "@/lib/dates";
import { BitTrash } from "@/app/bit/[id]/bit-controls";

export const dynamic = "force-dynamic";

function firstLine(body: string | null, face: string | null, content: string | null): string {
  // The whisper under the title: the piece's opening words (minus the title itself).
  const text = (body ?? "").replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
  const title = (content ?? face ?? "").trim();
  const rest = title && text.startsWith(title) ? text.slice(title.length).trim() : text;
  return rest.slice(0, 140);
}

// THE NOTES ROOM (D-118): your written PIECES — first-class, beside boards.
// A notebook index: title · opening words · date. Born a note in ✎ write; a note is
// never converted from a bit (a thing never changes type — D-121).
export default async function NotesRoom({
  searchParams,
}: {
  searchParams: Promise<{ archived?: string }>;
}) {
  const { archived } = await searchParams;
  const showArchived = archived === "1";
  const supabase = await createClient();
  // Archived pieces leave this room but stay LIVE rows — find still reaches them
  // (N5). This is the whole difference between putting away and trashing.
  let q = supabase
    .from("bit")
    .select("*")
    .eq("kind", "note")
    .is("deleted_at", null);
  q = showArchived ? q.not("archived_at", "is", null) : q.is("archived_at", null);
  const { data, error } = await q.order("updated_at", { ascending: false });
  if (error) throw error;
  const notes = (data ?? []) as Bit[];

  return (
    <main className="mx-auto max-w-2xl px-6 py-10">
      <header className="mb-6 flex items-baseline justify-between">
        <span className="text-sm font-semibold">{showArchived ? "put away" : "notes"}</span>
        <span className="flex items-baseline gap-5 text-sm">
          <Link
            href={showArchived ? "/notes" : "/notes?archived=1"}
            className="text-neutral-500 underline underline-offset-4 hover:no-underline"
          >
            {showArchived ? "← your notes" : "put away"}
          </Link>
          <Link href="/write" className="underline underline-offset-4 hover:no-underline">✎ write</Link>
        </span>
      </header>

      <p className="mb-8 text-sm text-neutral-500">
        {showArchived
          ? "Pieces you've put away. Still yours, still findable in find — just not in the way."
          : "Your written pieces — the things you\u2019re making, beside your boards."}
      </p>

      {notes.length === 0 ? (
        <p className="text-neutral-500">
          {showArchived ? (
            "Nothing put away yet."
          ) : (
            <>
              Nothing written yet —{" "}
              <Link href="/write" className="underline underline-offset-4 hover:no-underline">
                ✎ write your first
              </Link>
              .
            </>
          )}
        </p>
      ) : (
        <ul className="space-y-5">
          {notes.map((n) => (
            <li key={n.id} className="flex items-baseline justify-between gap-4">
              <Link href={`/note/${n.id}`} className="group block min-w-0 flex-1">
                <span className="block text-[17px] font-semibold tracking-tight underline-offset-4 group-hover:underline">
                  {n.content?.trim() || n.face || "untitled"}
                </span>
                {firstLine(n.body, n.face, n.content) && (
                  <span className="mt-0.5 block text-sm text-neutral-500">
                    {firstLine(n.body, n.face, n.content)}
                  </span>
                )}
              </Link>
              <span className="flex flex-none items-baseline gap-4 text-xs">
                <span className="tabular-nums text-neutral-400">{fmt(n.updated_at)}</span>
                <BitTrash bitId={n.id} returnTo="/notes" />
              </span>
            </li>
          ))}
        </ul>
      )}
    </main>
  );
}
