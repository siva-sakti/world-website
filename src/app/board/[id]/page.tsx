import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getBoard, getBoardCards } from "@/lib/db/boards";
import { getBitMeta } from "@/lib/db/bits";
import { normalizeDrawing } from "@/lib/stroke";
import { signedUrl } from "@/lib/storage";
import { BoardSurface } from "./board-surface";
import { BoardTitle } from "./board-title";
import { BoardDescription } from "./board-description";
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
        if (r.thing !== "bit" || !r.type) return null;
        if (r.type !== "text" && r.type !== "drawing" && r.type !== "image" && r.type !== "audio" && r.type !== "pdf" && r.type !== "link") return null;
        const type = r.type;
        const kind = meta.get(r.target_bit_id!)?.kind ?? "bit";
        const isNoteCard = kind === "note"; // a note lands as a page-shaped doorway
        // File types resolve a signed URL: image → its thumb/full (into imageUrl);
        // pdf → its first-page thumb only (into imageUrl); audio → its stored object
        // (into fileUrl, for the <audio> player).
        let imageUrl: string | undefined;
        let fileUrl: string | undefined;
        if (type === "image") {
          const path = r.thumb_path ?? r.storage_path;
          if (path) {
            try {
              imageUrl = await signedUrl(supabase, path);
            } catch {
              imageUrl = undefined;
            }
          }
        } else if (type === "pdf" && r.thumb_path) {
          // thumb_path only — storage_path is the PDF binary, never an <img> src.
          try {
            imageUrl = await signedUrl(supabase, r.thumb_path);
          } catch {
            imageUrl = undefined;
          }
        } else if (type === "audio" && r.storage_path) {
          try {
            fileUrl = await signedUrl(supabase, r.storage_path);
          } catch {
            fileUrl = undefined;
          }
        } else if (type === "link" && r.thumb_path) {
          // the stored page-card image (thumb_path only — a link has no storage_path)
          try {
            imageUrl = await signedUrl(supabase, r.thumb_path);
          } catch {
            imageUrl = undefined;
          }
        }
        return {
          placementId: r.placement_id,
          bitId: r.target_bit_id!,
          type,
          kind,
          x: r.x ?? 40,
          y: r.y ?? 40,
          w: r.width ?? (isNoteCard ? 200 : type === "text" ? 240 : type === "audio" ? 260 : 220),
          h: r.height ?? (isNoteCard ? 260 : type === "text" ? 60 : type === "audio" ? 56 : type === "pdf" ? 280 : type === "link" ? 180 : 220),
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
      <header className="flex shrink-0 flex-wrap items-baseline justify-between gap-4">
        <span className="w-8 shrink-0" aria-hidden="true"></span>
        <BoardTitle boardId={board.id} title={board.title} />
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
