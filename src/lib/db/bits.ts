import type { SupabaseClient } from "@supabase/supabase-js";
import type { Bit, Placement, Drawing } from "@/lib/types";
import { removeObjects } from "@/lib/storage";
import { setResting } from "./resting";

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

/** The shared file-bit insert (§7 layer B) — the bytes live in Storage; the row
 * holds the path + facts. Every file-backed type (image, audio, pdf) writes the
 * SAME media columns, so they funnel through here. Media dimensions are OPTIONAL
 * (audio has none; a pdf carries its page-1 dims). Placement is OPTIONAL too: pass
 * placementId + boardId to land it on a board (image, board-born audio/pdf); omit
 * both for a LOOSE file bit (like createLooseTextBit) — it appears in the inbox
 * until called in. */
export async function createFileBit(
  supabase: SupabaseClient,
  type: "image" | "audio" | "pdf",
  args: {
    bitId: string; placementId?: string; boardId?: string;
    storagePath: string; thumbPath?: string;
    mediaWidth?: number; mediaHeight?: number;
    mime: string; byteSize: number; fileName?: string;
  } & Pos,
): Promise<{ bit: Bit; placement: Placement | null }> {
  const { data: bit, error } = await supabase
    .from("bit")
    .insert({
      id: args.bitId, type,
      storage_path: args.storagePath, thumb_path: args.thumbPath ?? null,
      media_width: args.mediaWidth ?? null, media_height: args.mediaHeight ?? null,
      mime: args.mime, byte_size: args.byteSize, file_name: args.fileName ?? null,
    })
    .select("*")
    .single();
  if (error) throw error;
  const placement =
    args.placementId && args.boardId
      ? await insertPlacement(supabase, {
          id: args.placementId, boardId: args.boardId, bitId: args.bitId,
          x: args.x, y: args.y, width: args.width, height: args.height, z: args.z,
        })
      : null;
  return { bit: bit as Bit, placement };
}

/** An image bit — a thin wrapper over createFileBit (dimensions required; always
 * board-born, so its placement is never null). Signature + behavior unchanged. */
export async function createImageBit(
  supabase: SupabaseClient,
  args: {
    bitId: string; placementId: string; boardId: string;
    storagePath: string; thumbPath?: string;
    mediaWidth: number; mediaHeight: number;
    mime: string; byteSize: number; fileName?: string;
  } & Pos,
): Promise<{ bit: Bit; placement: Placement }> {
  const { bit, placement } = await createFileBit(supabase, "image", args);
  return { bit, placement: placement! }; // placementId+boardId were passed → never null
}

/** An audio bit (a voice memo) — a file bit with no thumbnail and no image
 * dimensions. `mediaWidth` optionally carries the recording's duration (seconds).
 * Placement optional: board-born on a board, or LOOSE from the /bits door. */
export async function createAudioBit(
  supabase: SupabaseClient,
  args: {
    bitId: string; placementId?: string; boardId?: string;
    storagePath: string; mediaWidth?: number;
    mime: string; byteSize: number; fileName?: string;
  } & Pos,
): Promise<{ bit: Bit; placement: Placement | null }> {
  return createFileBit(supabase, "audio", args);
}

/** A pdf bit — a file bit that (like an image) carries a first-page thumbnail
 * (thumb_path) + page-1 dimensions; the original PDF lives at storage_path for the
 * bit-page viewer. thumbPath may be absent (an unrenderable page 1 → a document
 * glyph fallback). Placement optional: board-born on a board, or LOOSE from /bits. */
export async function createPdfBit(
  supabase: SupabaseClient,
  args: {
    bitId: string; placementId?: string; boardId?: string;
    storagePath: string; thumbPath?: string;
    mediaWidth?: number; mediaHeight?: number;
    mime: string; byteSize: number; fileName?: string;
  } & Pos,
): Promise<{ bit: Bit; placement: Placement | null }> {
  return createFileBit(supabase, "pdf", args);
}

/** A loose text bit — born on NO board (D-100). The bit is the atom; it needs no
 * board (finally honored). It appears in the inbox until placed (call-in). */
/** A LINK bit (link-bit-plan.md): the url is the substance; captured_title + a stored
 * copy of the page's card image (thumb_path) are read-once artifacts — a dead page
 * never rewrites the card. Media facts stay null (they describe a stored FILE;
 * bit_media_facts_only_with_file exempts thumb_path alone for type='link'). */
export async function createLinkBit(
  supabase: SupabaseClient,
  args: { bitId: string; url: string; capturedTitle?: string | null; thumbPath?: string | null },
): Promise<Bit> {
  const { data, error } = await supabase
    .from("bit")
    .insert({
      id: args.bitId, type: "link", url: args.url,
      captured_title: args.capturedTitle ?? null, thumb_path: args.thumbPath ?? null,
    })
    .select("*")
    .single();
  if (error) throw error;
  return data as Bit;
}

export async function createLooseTextBit(
  supabase: SupabaseClient,
  args: { bitId: string; body?: string; kind?: "bit" | "note" },
): Promise<Bit> {
  const { data, error } = await supabase
    .from("bit")
    .insert({ id: args.bitId, type: "text", body: args.body ?? "<p></p>", kind: args.kind ?? "bit" })
    .select("*")
    .single();
  if (error) throw error;
  return data as Bit;
}

// (No setBitKind: a thing never changes type — kind is fixed at birth, catch → 'bit'
// / ✎ write → 'note' (ruled 2026-08-27). The only kind-writes are the create paths.)

/** Call a loose bit onto a board — the app-layer consumer of I-L1. A loose bit has
 * no LIVE placement, but it may carry a DEPARTED one on this board (it lived here and
 * left). So: insert a placement with the caller's optimistic id; if the unique index
 * refuses it (23505 — `placement_bit_once` covers departed rows too), REVIVE that row
 * instead — clear left_at, reposition — keeping its original arrived_at (§2c; the
 * trigger refreshes updated_at). Returns the TRUE placement so the caller can reconcile
 * its optimistic card to the real id (a revived row keeps its own id, not the guess). */
export async function callInBit(
  supabase: SupabaseClient,
  args: {
    bitId: string; boardId: string; placementId: string;
    x: number; y: number; // always a whole position — no positionless card lands via call-in
    width?: number | null; height?: number | null; z?: number | null;
  },
): Promise<Placement> {
  // Liveness guard (I-D1): no write lands on a tombstone. A STALE surface (another
  // tab's inbox) can offer a bit — or target a board — trashed since it rendered;
  // refuse loudly instead of planting an invisible placement. (The full ruled clash
  // mechanism, §2h FOR SHARE + keep-by-default, is the owed follow-up; this narrow
  // guard covers the call-in door.)
  const [bitLive, boardLive] = await Promise.all([
    supabase.from("bit").select("id").eq("id", args.bitId).eq("state", "live").maybeSingle(),
    supabase.from("board").select("id").eq("id", args.boardId).eq("state", "live").maybeSingle(),
  ]);
  if (bitLive.error) throw bitLive.error;
  if (boardLive.error) throw boardLive.error;
  if (!bitLive.data) throw new Error("TRASHED_BIT");
  if (!boardLive.data) throw new Error("TRASHED_BOARD");

  const pos = {
    x: args.x,
    y: args.y,
    width: args.width ?? null,
    height: args.height ?? null,
    z: args.z ?? 0,
  };
  const ins = await supabase
    .from("placement")
    .insert({ id: args.placementId, board_id: args.boardId, target_bit_id: args.bitId, ...pos })
    .select("*")
    .single();
  if (!ins.error) return ins.data as Placement;
  if (ins.error.code !== "23505") throw ins.error;
  // A row for (board, bit) already exists. Revive ONLY a departed one (left_at set),
  // never duplicate (I-L1). If the conflicting row is LIVE — a stale-surface
  // double-place — return it UNTOUCHED: we never yank a live card to a new spot.
  const rev = await supabase
    .from("placement")
    .update({ left_at: null, ...pos })
    .eq("board_id", args.boardId)
    .eq("target_bit_id", args.bitId)
    .not("left_at", "is", null)
    .select("*")
    .maybeSingle();
  if (rev.error) throw rev.error;
  if (rev.data) return rev.data as Placement;
  const cur = await supabase
    .from("placement")
    .select("*")
    .eq("board_id", args.boardId)
    .eq("target_bit_id", args.bitId)
    .single();
  if (cur.error) throw cur.error;
  return cur.data as Placement;
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
 * §2c) — we stamp left_at, never delete. The bit survives (I-L7). Asserts a row
 * was actually stamped: a 0-row update means the act silently missed (the review's
 * lost-removal class) — surface it, never swallow it. */
export async function unplaceBit(
  supabase: SupabaseClient,
  placementId: string,
): Promise<void> {
  const { data, error } = await supabase
    .from("placement")
    .update({ left_at: new Date().toISOString() })
    .eq("id", placementId)
    .select("id");
  if (error) throw error;
  if (!data?.length) throw new Error("that card no longer exists — reload the board");
}

/** Put a note away, or take it back out (N5). Archive is a RESTING state, not
 *  trash-lite: the row stays live, so find still reaches it — it just leaves the
 *  rooms you work in.
 *
 *  Archiving clears the star in the SAME statement. Nothing is both "alive right
 *  now" and put away — they're opposite claims about one thing — and the DB check
 *  `bit_archived_not_alive` refuses any other combination, so this is the only
 *  shape that can succeed. That's deliberate: the invariant lives in the schema,
 *  and this is the one door that satisfies it. */
export async function archiveBit(
  supabase: SupabaseClient,
  bitId: string,
  on: boolean,
): Promise<void> {
  const patch = on
    ? { archived_at: new Date().toISOString(), pinned_at: null }
    : { archived_at: null };
  const { data, error } = await supabase
    .from("bit")
    .update(patch)
    .eq("id", bitId)
    .select("id");
  if (error) throw error;
  if (!data?.length) throw new Error("that note no longer exists — reload");
}

/** Trash the whole bit — a freeze, hidden everywhere, restorable (§2g). Asserts a
 * row was touched (0 rows = the act missed — surface it). */
export async function trashBit(
  supabase: SupabaseClient,
  bitId: string,
): Promise<void> {
  const n = await setResting(supabase, "bit", bitId, "deleted_at", true);
  if (!n) throw new Error("that note no longer exists — reload");
}

/** Compensating erase of a bit created MOMENTS ago by a multi-step intake whose
 * later step failed — an abort of the act, not a destroy of a kept thing (the bit
 * was never seen). Best-effort: cascades take any placements. */
export async function abortBitCreate(supabase: SupabaseClient, bitId: string): Promise<void> {
  await supabase.from("bit").delete().eq("id", bitId);
}

/** Restore a trashed bit — back to the world exactly, everywhere it was (§2g). */
export async function restoreBit(
  supabase: SupabaseClient,
  bitId: string,
): Promise<void> {
  await setResting(supabase, "bit", bitId, "deleted_at", false);
}

/** DESTROY a bit permanently (I-L10) — only if trashed. Removes its media files,
 *  then deletes the row; the schema cascades its placements (+ their connectors),
 *  tag applications, gather ties both ways, and travel. Guarded to `deleted_at IS
 *  NOT NULL`: a live bit can never be destroyed, even if this is mis-called. */
export async function destroyBit(supabase: SupabaseClient, bitId: string): Promise<void> {
  // Best-effort media cleanup: a failed READ here only skips object removal (an
  // orphaned file, not lost data) — the row delete below still proceeds.
  const { data } = await supabase
    .from("bit")
    .select("storage_path, thumb_path")
    .eq("id", bitId)
    .not("deleted_at", "is", null)
    .maybeSingle();
  if (data) await removeObjects(supabase, [data.storage_path, data.thumb_path]);
  const { error } = await supabase
    .from("bit")
    .delete()
    .eq("id", bitId)
    .not("deleted_at", "is", null);
  if (error) throw error;
}

// ---- reads (the bit page + the board's raw-content need) ----

/** One bit for its page — null if missing or trashed. */
export async function getBit(supabase: SupabaseClient, id: string): Promise<Bit | null> {
  const { data, error } = await supabase
    .from("bit").select("*").eq("id", id).eq("state", "live").maybeSingle();
  if (error) throw error; // a network blip must not read as "no bit" (a false 404)
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

/** Every live NOTE (kind='note'), recently-edited first — the home list's read. */
export async function listNotes(supabase: SupabaseClient): Promise<Bit[]> {
  const { data, error } = await supabase
    .from("bit")
    .select("*")
    .eq("kind", "note")
    .eq("state", "live")
    .order("updated_at", { ascending: false });
  if (error) throw error;
  return (data ?? []) as Bit[];
}

/** Raw per-bit fields the board_cards view doesn't expose: `content` (the title
 * editor needs the raw column, not the computed face) and `kind` (so a placed NOTE
 * renders as a doorway, not editable text — N3). One indexed query for the board. */
export async function getBitMeta(
  supabase: SupabaseClient,
  ids: string[],
): Promise<Map<string, { content: string | null; kind: "bit" | "note" }>> {
  const out = new Map<string, { content: string | null; kind: "bit" | "note" }>();
  if (!ids.length) return out;
  const { data, error } = await supabase.from("bit").select("id, content, kind").in("id", ids);
  if (error) throw error; // a failed read must not silently render notes as editable text (kind fallback)
  for (const b of data ?? [])
    out.set(b.id as string, {
      content: (b.content as string | null) ?? null,
      kind: (b.kind as "bit" | "note") ?? "bit",
    });
  return out;
}
