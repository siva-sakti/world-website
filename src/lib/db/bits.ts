import type { SupabaseClient } from "@supabase/supabase-js";
import type { Bit, Placement, Drawing } from "@/lib/types";

// Data access for bits and their placements (§7). A bit is a thing; a placement
// is the act of putting it on a board. Ids are client-supplied (crypto.randomUUID)
// so the canvas can create optimistically and still know the row's id — the
// schema allows it (I-D4, client-suppliable). Removing a placement never touches
// the bit (I-L7); un-place stamps left_at (§2c), trash freezes the bit (§2g).

type Pos = { x?: number | null; y?: number | null; width?: number | null; height?: number | null; z?: number | null };

async function insertPlacement(
  supabase: SupabaseClient,
  args: { id: string; boardId: string; bitId: string } & Pos,
): Promise<Placement> {
  const { data, error } = await supabase
    .from("placement")
    .insert({
      id: args.id,
      board_id: args.boardId,
      target_bit_id: args.bitId,
      x: args.x ?? null,
      y: args.y ?? null,
      width: args.width ?? null,
      height: args.height ?? null,
      z: args.z ?? 0,
    })
    .select("*")
    .single();
  if (error) throw error;
  return data as Placement;
}

/** A text bit (its words live in `body`; the optional title is `content` — D-087). */
export async function createTextBit(
  supabase: SupabaseClient,
  args: { bitId: string; placementId: string; boardId: string; body?: string } & Pos,
): Promise<{ bit: Bit; placement: Placement }> {
  const { data: bit, error } = await supabase
    .from("bit")
    .insert({ id: args.bitId, type: "text", body: args.body ?? "<p></p>" })
    .select("*")
    .single();
  if (error) throw error;
  const placement = await insertPlacement(supabase, {
    id: args.placementId, boardId: args.boardId, bitId: args.bitId,
    x: args.x, y: args.y, width: args.width, height: args.height, z: args.z,
  });
  return { bit: bit as Bit, placement };
}

/** A drawing bit (perfect-freehand strokes as vectors, per-stroke width — §2a). */
export async function createDrawingBit(
  supabase: SupabaseClient,
  args: { bitId: string; placementId: string; boardId: string; drawing: Drawing } & Pos,
): Promise<{ bit: Bit; placement: Placement }> {
  const { data: bit, error } = await supabase
    .from("bit")
    .insert({ id: args.bitId, type: "drawing", strokes: args.drawing })
    .select("*")
    .single();
  if (error) throw error;
  const placement = await insertPlacement(supabase, {
    id: args.placementId, boardId: args.boardId, bitId: args.bitId,
    x: args.x, y: args.y, width: args.width, height: args.height, z: args.z,
  });
  return { bit: bit as Bit, placement };
}

/** An image bit — its bytes live in Storage; the row holds the path + facts (§7 layer B). */
export async function createImageBit(
  supabase: SupabaseClient,
  args: {
    bitId: string; placementId: string; boardId: string;
    storagePath: string; thumbPath?: string;
    mediaWidth: number; mediaHeight: number;
    mime: string; byteSize: number; fileName?: string;
  } & Pos,
): Promise<{ bit: Bit; placement: Placement }> {
  const { data: bit, error } = await supabase
    .from("bit")
    .insert({
      id: args.bitId, type: "image",
      storage_path: args.storagePath, thumb_path: args.thumbPath ?? null,
      media_width: args.mediaWidth, media_height: args.mediaHeight,
      mime: args.mime, byte_size: args.byteSize, file_name: args.fileName ?? null,
    })
    .select("*")
    .single();
  if (error) throw error;
  const placement = await insertPlacement(supabase, {
    id: args.placementId, boardId: args.boardId, bitId: args.bitId,
    x: args.x, y: args.y, width: args.width, height: args.height, z: args.z,
  });
  return { bit: bit as Bit, placement };
}

/** A loose text bit — born on NO board (D-100). The bit is the atom; it needs no
 * board (finally honored). It appears in the inbox until placed (call-in). */
export async function createLooseTextBit(
  supabase: SupabaseClient,
  args: { bitId: string; body?: string },
): Promise<Bit> {
  const { data, error } = await supabase
    .from("bit")
    .insert({ id: args.bitId, type: "text", body: args.body ?? "<p></p>" })
    .select("*")
    .single();
  if (error) throw error;
  return data as Bit;
}

/** A bookmark bit — a saved URL, born loose into the inbox by default (D-100). A
 * bookmark's source IS itself, so source_* stay null and the page title lives in
 * `captured_title` (I-S3). A preview picture (storage_path) may be added later —
 * the substance rule now permits it for bookmarks (D-100). */
export async function createBookmarkBit(
  supabase: SupabaseClient,
  args: {
    bitId: string; url: string; capturedTitle?: string | null;
    storagePath?: string | null; thumbPath?: string | null;
    mediaWidth?: number | null; mediaHeight?: number | null;
    mime?: string | null; byteSize?: number | null;
  },
): Promise<Bit> {
  const { data, error } = await supabase
    .from("bit")
    .insert({
      id: args.bitId, type: "bookmark", url: args.url,
      captured_title: args.capturedTitle ?? null,
      storage_path: args.storagePath ?? null, thumb_path: args.thumbPath ?? null,
      media_width: args.mediaWidth ?? null, media_height: args.mediaHeight ?? null,
      mime: args.mime ?? null, byte_size: args.byteSize ?? null,
    })
    .select("*")
    .single();
  if (error) throw error;
  return data as Bit;
}

export async function updatePlacement(
  supabase: SupabaseClient,
  id: string,
  patch: Pos,
): Promise<void> {
  const { error } = await supabase.from("placement").update(patch).eq("id", id);
  if (error) throw error;
}

/** Edit a text bit's words. Changed once → changed on every board (§8, live reference). */
export async function updateBitBody(
  supabase: SupabaseClient,
  id: string,
  body: string,
): Promise<void> {
  const { error } = await supabase.from("bit").update({ body }).eq("id", id);
  if (error) throw error;
}

/** Write a bit's owner content — a caption, or a text bit's optional title (D-087). */
export async function updateBitContent(
  supabase: SupabaseClient,
  id: string,
  content: string | null,
): Promise<void> {
  const value = content && content.trim() ? content : null;
  const { error } = await supabase.from("bit").update({ content: value }).eq("id", id);
  if (error) throw error;
}

/** Un-place: take the card off this board. The membership row is KEPT (travel,
 * §2c) — we stamp left_at, never delete. The bit survives (I-L7). */
export async function unplaceBit(
  supabase: SupabaseClient,
  placementId: string,
): Promise<void> {
  const { error } = await supabase
    .from("placement")
    .update({ left_at: new Date().toISOString() })
    .eq("id", placementId);
  if (error) throw error;
}

/** Trash the whole bit — a freeze, hidden everywhere, restorable (§2g). */
export async function trashBit(
  supabase: SupabaseClient,
  bitId: string,
): Promise<void> {
  const { error } = await supabase
    .from("bit")
    .update({ deleted_at: new Date().toISOString() })
    .eq("id", bitId);
  if (error) throw error;
}

/** Restore a trashed bit — back to the world exactly, everywhere it was (§2g). */
export async function restoreBit(
  supabase: SupabaseClient,
  bitId: string,
): Promise<void> {
  const { error } = await supabase
    .from("bit")
    .update({ deleted_at: null })
    .eq("id", bitId);
  if (error) throw error;
}

// ---- reads (the bit page + the board's raw-content need) ----

/** One bit for its page — null if missing or trashed. */
export async function getBit(supabase: SupabaseClient, id: string): Promise<Bit | null> {
  const { data } = await supabase
    .from("bit").select("*").eq("id", id).is("deleted_at", null).maybeSingle();
  return (data as Bit) ?? null;
}

/** The boards a bit is on right now (placement present). */
export async function getBitBoards(
  supabase: SupabaseClient,
  bitId: string,
): Promise<{ id: string; title: string | null }[]> {
  // A placement links to board TWO ways (board_id = the board it's on;
  // target_board_id = a board placed as a card). Name the FK so the embed isn't
  // ambiguous — we want the board this bit sits on.
  const { data, error } = await supabase
    .from("placement").select("board:board!placement_board_id_fkey(id, title)")
    .eq("target_bit_id", bitId).is("left_at", null);
  if (error) throw error;
  return (data ?? [])
    .map((r) => r.board as unknown as { id: string; title: string | null })
    .filter(Boolean);
}

/** A bit's travel — every board it has visited, arrived/left (bit_travel view). */
export type BitTravelLeg = {
  board_id: string; board_title: string | null; arrived_at: string; left_at: string | null;
};
export async function getBitTravel(
  supabase: SupabaseClient,
  bitId: string,
): Promise<BitTravelLeg[]> {
  const { data, error } = await supabase
    .from("bit_travel").select("board_id, board_title, arrived_at, left_at").eq("bit_id", bitId);
  if (error) throw error;
  return (data ?? []) as BitTravelLeg[];
}

/** Raw owner content for a set of bits — the board_cards view exposes only the
 * computed face, but the title editor needs the raw column. */
export async function getBitContents(
  supabase: SupabaseClient,
  ids: string[],
): Promise<Map<string, string | null>> {
  const out = new Map<string, string | null>();
  if (!ids.length) return out;
  const { data } = await supabase.from("bit").select("id, content").in("id", ids);
  for (const b of data ?? []) out.set(b.id as string, (b.content as string | null) ?? null);
  return out;
}
