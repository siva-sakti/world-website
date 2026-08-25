import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { logout } from "@/app/login/actions";
import type { Bit } from "@/lib/types";

export const dynamic = "force-dynamic";

function fmt(iso: string): string {
  return new Date(iso).toLocaleDateString(undefined, { month: "short", day: "numeric" });
}

function firstLine(body: string | null, face: string | null, content: string | null): string {
  // The whisper under the title: the piece's opening words (minus the title itself).
  const text = (body ?? "").replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
  const title = (content ?? face ?? "").trim();
  const rest = title && text.startsWith(title) ? text.slice(title.length).trim() : text;
  return rest.slice(0, 140);
}

// THE NOTES ROOM (V2, D-118): your written PIECES — first-class, beside boards.
// A notebook index: title · opening words · date. Born in ✎ write; a bit can be
// promoted from its page ("make a note").
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

  return (
    <main className="mx-auto max-w-2xl px-6 py-10">
      <header className="mb-6 flex items-baseline justify-between">
        <div className="flex items-baseline gap-5 text-sm">
          <Link href="/" className="underline underline-offset-4 hover:no-underline">← home</Link>
          <span className="font-semibold">notes</span>
          <Link href="/bits" className="text-neutral-500 underline underline-offset-4 hover:no-underline">bits</Link>
        </div>
        <div className="flex items-baseline gap-5 text-sm">
          <Link href="/write" className="underline underline-offset-4 hover:no-underline">✎ write</Link>
          <form action={logout}>
            <button className="text-neutral-500 underline underline-offset-4 hover:no-underline">sign out</button>
          </form>
        </div>
      </header>

      <p className="mb-8 text-sm text-neutral-500">
        Your written pieces — the things you&rsquo;re making, beside your boards.
      </p>

      {notes.length === 0 ? (
        <p className="text-neutral-500">
          Nothing written yet —{" "}
          <Link href="/write" className="underline underline-offset-4 hover:no-underline">
            ✎ write your first
          </Link>
          . (An existing bit can also grow up: open it and tap &ldquo;make a note.&rdquo;)
        </p>
      ) : (
        <ul className="space-y-5">
          {notes.map((n) => (
            <li key={n.id}>
              <Link href={`/bit/${n.id}`} className="group block">
                <span className="flex items-baseline justify-between gap-4">
                  <span className="text-[17px] font-semibold tracking-tight underline-offset-4 group-hover:underline">
                    {n.content?.trim() || n.face || "untitled"}
                  </span>
                  <span className="flex-none text-xs tabular-nums text-neutral-400">{fmt(n.updated_at)}</span>
                </span>
                {firstLine(n.body, n.face, n.content) && (
                  <span className="mt-0.5 block text-sm text-neutral-500">
                    {firstLine(n.body, n.face, n.content)}
                  </span>
                )}
              </Link>
            </li>
          ))}
        </ul>
      )}
    </main>
  );
}
