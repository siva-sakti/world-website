import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getBoard, getBoardCards } from "@/lib/db/boards";
import { getBitContents } from "@/lib/db/bits";
import { normalizeDrawing } from "@/lib/stroke";
import { signedUrl } from "@/lib/storage";
import { logout } from "@/app/login/actions";
import { BoardSurface } from "./board-surface";
import { BoardTitle } from "./board-title";
import { TagBar } from "./tag-bar";
import type { CardVM } from "./card";

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
  const rows = await getBoardCards(supabase, id);

  // The board_cards view exposes the computed face, not raw `content` — the
  // title editor needs the raw column, so fetch it in one indexed query.
  const bitIds = rows.filter((r) => r.target_bit_id).map((r) => r.target_bit_id!);
  const contents = await getBitContents(supabase, bitIds);

  // Map view rows to the client card model; images resolve a signed URL (the
  // 600px thumb where present). Each row's URL is signed concurrently (Promise.all)
  // — a board of photos would otherwise wait on N sequential storage round-trips.
  const cards = (
    await Promise.all(
      rows.map(async (r): Promise<CardVM | null> => {
        if (r.thing !== "bit" || !r.type) return null;
        if (r.type !== "text" && r.type !== "drawing" && r.type !== "image") return null;
        const type = r.type;
        let imageUrl: string | undefined;
        if (type === "image") {
          const path = r.thumb_path ?? r.storage_path;
          if (path) {
            try {
              imageUrl = await signedUrl(supabase, path);
            } catch {
              imageUrl = undefined;
            }
          }
        }
        return {
          placementId: r.placement_id,
          bitId: r.target_bit_id!,
          type,
          x: r.x ?? 40,
          y: r.y ?? 40,
          w: r.width ?? (type === "text" ? 240 : 220),
          h: r.height ?? (type === "text" ? 60 : 220),
          z: r.z ?? 0,
          body: r.body ?? undefined,
          drawing: type === "drawing" ? normalizeDrawing(r.strokes) : undefined,
          imageUrl,
          content: contents.get(r.target_bit_id!) ?? undefined,
          sourceName: r.source_name ?? undefined,
          sourceUrl: r.source_url ?? undefined,
        };
      }),
    )
  ).filter((c): c is CardVM => c !== null);

  return (
    <main className="px-6 py-6">
      <header className="mb-4 flex items-baseline justify-between gap-4">
        <span className="flex shrink-0 items-baseline gap-4 text-sm">
          <Link href="/" className="underline underline-offset-4 hover:no-underline">
            ← boards
          </Link>
          <Link href="/find" className="underline underline-offset-4 hover:no-underline">
            find
          </Link>
          <Link href="/tags" className="text-neutral-500 underline underline-offset-4 hover:no-underline">
            tags
          </Link>
          <Link href="/graph" className="text-neutral-500 underline underline-offset-4 hover:no-underline">
            graph
          </Link>
        </span>
        <BoardTitle boardId={board.id} title={board.title} />
        <form action={logout} className="shrink-0">
          <button className="text-sm text-neutral-500 underline underline-offset-4 hover:no-underline">
            sign out
          </button>
        </form>
      </header>
      <div className="mb-2">
        <TagBar target={{ boardId: board.id }} label="board tags" />
      </div>
      <BoardSurface boardId={board.id} initialCards={cards} />
    </main>
  );
}
