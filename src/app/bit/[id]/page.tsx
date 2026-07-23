import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { signedUrl } from "@/lib/storage";
import { normalizeDrawing, strokesBounds } from "@/lib/stroke";
import { logout } from "@/app/login/actions";
import { DoodleBit } from "@/app/board/[id]/doodle-bit";
import type { Bit } from "@/lib/types";

export const dynamic = "force-dynamic";

function fmt(iso: string | null): string {
  if (!iso) return "";
  return new Date(iso).toLocaleDateString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

export default async function BitPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();

  const { data: bit } = await supabase
    .from("bit")
    .select("*")
    .eq("id", id)
    .is("deleted_at", null)
    .maybeSingle();
  if (!bit) notFound();
  const b = bit as Bit;

  const [tagRes, boardRes, travelRes] = await Promise.all([
    supabase.from("tag_application").select("tag:tag(id, word)").eq("target_bit_id", id),
    supabase.from("placement").select("board:board(id, title)").eq("target_bit_id", id).is("left_at", null),
    supabase.from("bit_travel").select("board_id, board_title, arrived_at, left_at").eq("bit_id", id),
  ]);
  const tags = (tagRes.data ?? []).map((r) => r.tag as unknown as { id: string; word: string }).filter(Boolean);
  const boards = (boardRes.data ?? []).map((r) => r.board as unknown as { id: string; title: string | null }).filter(Boolean);
  const travel = (travelRes.data ?? []) as { board_id: string; board_title: string | null; arrived_at: string; left_at: string | null }[];

  let imageUrl: string | undefined;
  if (b.type === "image" && b.storage_path) {
    try {
      imageUrl = await signedUrl(supabase, b.storage_path);
    } catch {
      imageUrl = undefined;
    }
  }
  const drawing = b.type === "drawing" ? normalizeDrawing(b.strokes) : null;
  const dBounds = drawing ? strokesBounds(drawing.strokes) : null;

  const heading = b.face?.trim() || (b.type === "text" ? "untitled note" : `a ${b.type}`);

  return (
    <main className="mx-auto max-w-2xl px-6 py-10">
      <header className="mb-8 flex items-baseline justify-between text-sm">
        <div className="flex items-baseline gap-5">
          <Link href="/find" className="underline underline-offset-4 hover:no-underline">
            ← find
          </Link>
          <Link href="/" className="text-neutral-500 underline underline-offset-4 hover:no-underline">
            boards
          </Link>
        </div>
        <form action={logout}>
          <button className="text-neutral-500 underline underline-offset-4 hover:no-underline">
            sign out
          </button>
        </form>
      </header>

      <p className="text-xs uppercase tracking-wide text-neutral-400">{b.type}</p>
      <h1 className="mt-1 text-2xl font-semibold tracking-tight">{heading}</h1>

      {/* The bit itself */}
      <div className="mt-6">
        {b.type === "text" && b.body && (
          <div
            className="tiptap rounded-md border border-neutral-200 p-4"
            dangerouslySetInnerHTML={{ __html: b.body }}
          />
        )}
        {b.type === "image" && imageUrl && (
          <img src={imageUrl} alt={b.content ?? ""} className="max-h-[60vh] rounded-md border border-neutral-200" />
        )}
        {drawing && dBounds && (
          <div
            className="rounded-md border border-neutral-200 bg-white p-3"
            style={{ width: 320, height: Math.max(60, (320 * Math.max(1, dBounds.maxY)) / Math.max(1, dBounds.maxX)) }}
          >
            <DoodleBit drawing={drawing} />
          </div>
        )}
        {b.type === "bookmark" && b.url && (
          <a href={b.url} target="_blank" rel="noreferrer" className="text-blue-700 underline break-all">
            {b.url}
          </a>
        )}
      </div>

      {/* Tags */}
      <section className="mt-8">
        <h2 className="mb-2 text-xs uppercase tracking-wide text-neutral-400">tags</h2>
        {tags.length === 0 ? (
          <p className="text-sm text-neutral-500">No tags yet.</p>
        ) : (
          <div className="flex flex-wrap gap-2">
            {tags.map((t) => (
              <Link key={t.id} href={`/find?tag=${t.id}`} className="tag-chip">
                {t.word}
              </Link>
            ))}
          </div>
        )}
      </section>

      {/* Boards it's on now */}
      <section className="mt-8">
        <h2 className="mb-2 text-xs uppercase tracking-wide text-neutral-400">on these boards</h2>
        {boards.length === 0 ? (
          <p className="text-sm text-neutral-500">Not on any board right now.</p>
        ) : (
          <ul className="space-y-1 text-sm">
            {boards.map((bd) => (
              <li key={bd.id}>
                <Link href={`/board/${bd.id}`} className="underline underline-offset-4 hover:no-underline">
                  {bd.title || "untitled board"}
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>

      {/* Travel */}
      <section className="mt-8">
        <h2 className="mb-2 text-xs uppercase tracking-wide text-neutral-400">travel</h2>
        <ul className="space-y-1 text-sm text-neutral-600">
          {travel.map((t, i) => (
            <li key={i}>
              <span className="text-neutral-800">{t.board_title || "untitled board"}</span>
              {" · arrived "}
              {fmt(t.arrived_at)}
              {t.left_at ? ` · left ${fmt(t.left_at)}` : " · here now"}
            </li>
          ))}
        </ul>
      </section>
    </main>
  );
}
