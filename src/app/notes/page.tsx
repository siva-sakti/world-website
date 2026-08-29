import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import type { Bit } from "@/lib/types";
import { fmt } from "@/lib/dates";
import { BitTrash } from "@/app/bit/[id]/bit-controls";
import { listGroups } from "@/lib/db/shelf";
import { JumpTo, type JumpItem } from "@/components/jump-to";

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
export default async function NotesRoom() {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("bit")
    .select("*")
    .eq("kind", "note")
    .is("deleted_at", null)
    .order("updated_at", { ascending: false });
  if (error) throw error;
  const notes = (data ?? []) as Bit[];
  const groups = await listGroups(supabase);
  const jumpItems: JumpItem[] = notes.map((n) => ({
    id: n.id,
    title: n.content?.trim() || n.face || "untitled",
    href: `/note/${n.id}`,
    folder: groups.find((g) => g.id === n.group_id)?.name ?? null,
  }));

  return (
    <main className="mx-auto max-w-2xl px-6 py-10">
      <header className="mb-6 flex items-baseline justify-between">
        <span className="text-sm font-semibold">notes</span>
        <Link href="/write" className="text-sm underline underline-offset-4 hover:no-underline">✎ write</Link>
      </header>

      <p className="mb-8 text-sm text-neutral-500">
        Your written pieces — the things you&rsquo;re making, beside your boards.
      </p>

      <JumpTo items={jumpItems} placeholder="Jump to a note…" emptyMatch="No notes match">
      {notes.length === 0 ? (
        <p className="text-neutral-500">
          Nothing written yet —{" "}
          <Link href="/write" className="underline underline-offset-4 hover:no-underline">
            ✎ write your first
          </Link>
          .
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
      </JumpTo>
    </main>
  );
}
