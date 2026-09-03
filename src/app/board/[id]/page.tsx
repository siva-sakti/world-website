import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getBoard, getBoardCards } from "@/lib/db/boards";
import { getBitMeta } from "@/lib/db/bits";
import { normalizeDrawing } from "@/lib/stroke";
import { defaultCardSize, resolveCardMedia } from "./card-defaults";
import { isCardType } from "./card-vm";
import { BoardSurface } from "./board-surface";
import { BoardTitle } from "./board-title";
import { BoardDescription } from "./board-description";
import { TagBar } from "./tag-bar";
import { RecordOpening } from "@/components/record-opening";
import type { CardVM } from "./card-vm";

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

  // The board_cards view exposes the computed face, not raw `content`/`kind` — the
  // title editor needs raw content, and a placed NOTE must render as a doorway (N3).
  // One indexed query for both.
  const bitIds = rows.filter((r) => r.target_bit_id).map((r) => r.target_bit_id!);
  const meta = await getBitMeta(supabase, bitIds);

  // Map view rows to the client card model; images resolve a signed URL (the
  // 600px thumb where present). Each row's URL is signed concurrently (Promise.all)
  // — a board of photos would otherwise wait on N sequential storage round-trips.
  const cards = (
    await Promise.all(
      rows.map(async (r): Promise<CardVM | null> => {
        const type = r.type;
        if (r.thing !== "bit" || !isCardType(type)) return null;
        const kind = meta.get(r.target_bit_id!)?.kind ?? "bit";
        // The signed URLs and the fallback size are BOTH shared with bringIn (the
        // client's call-in door) — one table each, in card-defaults.
        const { imageUrl, fileUrl } = await resolveCardMedia(supabase, {
          type,
          thumb_path: r.thumb_path,
          storage_path: r.storage_path,
        });
        const size = defaultCardSize(type, kind);
        return {
          placementId: r.placement_id,
          bitId: r.target_bit_id!,
          type,
          kind,
          x: r.x ?? 40,
          y: r.y ?? 40,
          w: r.width ?? size.w,
          h: r.height ?? size.h,
          z: r.z ?? 0,
          body: r.body ?? undefined,
          drawing: type === "drawing" ? normalizeDrawing(r.strokes) : undefined,
          imageUrl,
          fileUrl,
          content: meta.get(r.target_bit_id!)?.content ?? undefined,
          locked: Boolean(r.locked_at),
          url: type === "link" ? (r.url ?? undefined) : undefined,
          label: type === "link" ? (r.label ?? undefined) : undefined,
          sourceName: r.source_name ?? undefined,
          sourceUrl: r.source_url ?? undefined,
        };
      }),
    )
  ).filter((c): c is CardVM => c !== null);

  return (
    <main className="board-page">
      {/* renders null — stamps "you opened this" for home's "where you were" */}
      <RecordOpening kind="board" id={board.id} />
      <header className="flex shrink-0 flex-wrap items-baseline justify-between gap-4">
        <span className="w-8 shrink-0" aria-hidden="true"></span>
        <BoardTitle boardId={board.id} title={board.title} />
        {/* The way IN to the timeline. Without it the page exists and nothing points at
            it — a route you can only reach by typing the URL is not a feature. */}
        <Link
          href={`/board/${board.id}/timeline`}
          className="shrink-0 text-xs text-neutral-400 underline underline-offset-4 hover:text-neutral-700 hover:no-underline"
          title="See what arrived on this board, and when"
        >
          timeline
        </Link>
      </header>
      <div className="shrink-0">
        <BoardDescription boardId={board.id} initial={board.description ?? ""} />
      </div>
      <div className="shrink-0">
        <TagBar target={{ boardId: board.id }} label="board tags" />
      </div>
      <BoardSurface boardId={board.id} initialCards={cards} />
    </main>
  );
}
