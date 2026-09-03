import type { SupabaseClient } from "@supabase/supabase-js";
import type { Board, BoardCard, HomeBoard } from "@/lib/types";
import { removeObjects } from "@/lib/storage";
import { setResting } from "./resting";

// Data access for boards. Components call these; they never touch Supabase
// directly (the one-door rule). Surfaces read the computed views (home,
// board_cards) so nothing is stored twice.

/** Home: your boards, most-recently-touched first (the `home` view — §5a). */
export async function listBoards(
  supabase: SupabaseClient,
): Promise<HomeBoard[]> {
  const { data, error } = await supabase.from("home").select("*");
  if (error) throw error;
  return (data ?? []) as HomeBoard[];
}

export async function getBoard(
  supabase: SupabaseClient,
  id: string,
): Promise<Board | null> {
  const { data, error } = await supabase
    .from("board")
    .select("*")
    .eq("id", id)
    .eq("state", "live")
    .maybeSingle();
  if (error) throw error;
  return data as Board | null;
}

/** Duplicate a board (basic act, ruled 2026-09-01 — organize-phase-plan §4b): a SECOND
 * ARRANGEMENT of the same material — the copy's placements point at the SAME bits (bits are
 * the atoms; deep-copying would double material and pollute search/tags). Copies title+" copy",
 * visibility, folder, and every LIVE placement's geometry with a FRESH arrived_at (travel
 * history is the original's story, not the copy's) — and locked_at (a lock is arrangement
 * state like x/y/z, so a faithful copy keeps it — check-ruled). Not copied: the ★ (a copy isn't alive
 * until you say so) · departed legs · connectors (no create-UI exists yet — when arrows
 * arrive, duplicate must learn placement-id remapping). If the placements fail after the
 * board row lands, the half-copy is deleted (cascade takes its placements) — no litter.
 *
 * WHAT IT COPIES IS WHAT RENDERS (antagonist A2, fixed 2026-09-03). The copy list reads
 * `board_cards` — the ONE render rule — not the raw placement table. The old raw read
 * filtered `left_at` only, so a bit trashed or archived WHILE PLACED still had a present
 * placement row and rode along invisibly: restore it months later and it materialised on a
 * board the owner never put it on, with a fabricated arrival date. Reading the view means
 * "copies every live card" is true by construction rather than by a second hand-written
 * copy of the state rule that could drift from it. */
export async function duplicateBoard(supabase: SupabaseClient, boardId: string): Promise<Board> {
  const { data: src, error: e1 } = await supabase
    .from("board")
    .select("title, visibility, group_id, description")
    .eq("id", boardId)
    .eq("state", "live")
    .single();
  if (e1) throw e1;
  const { data: board, error: e2 } = await supabase
    .from("board")
    .insert({
      title: `${src.title || "untitled board"} copy`,
      visibility: src.visibility,
      group_id: src.group_id,
      description: src.description, // part of the board's identity — a faithful copy keeps it
    })
    .select("*")
    .single();
  if (e2) throw e2;
  try {
    const { data: rows, error: e3 } = await supabase
      .from("board_cards") // the render rule — never the raw table (A2)
      .select("target_bit_id, target_board_id, x, y, width, height, z, display_size, locked_at, angle")
      .eq("board_id", boardId);
    if (e3) throw e3;
    if (rows && rows.length) {
      const { error: e4 } = await supabase
        .from("placement")
        .insert(rows.map((r) => ({ ...r, board_id: board.id })));
      if (e4) throw e4;
    }
  } catch (e) {
    // Deliberate half-copy cleanup; if the cleanup ITSELF fails, say so (a stray
    // "X copy" board on home) but still surface the original error.
    const { error: cleanupErr } = await supabase.from("board").delete().eq("id", board.id);
    if (cleanupErr) console.error("duplicateBoard: half-copy cleanup failed too:", cleanupErr);
    throw e;
  }
  return board as Board;
}

export async function createBoard(
  supabase: SupabaseClient,
  title: string | null,
): Promise<Board> {
  const { data, error } = await supabase
    .from("board")
    .insert({ title: title || null })
    .select("*")
    .single();
  if (error) throw error;
  return data as Board;
}

/** The cards to render on a board (the `board_cards` view), back-to-front by z. */
export async function getBoardCards(
  supabase: SupabaseClient,
  boardId: string,
): Promise<BoardCard[]> {
  const { data, error } = await supabase
    .from("board_cards")
    .select("*")
    .eq("board_id", boardId)
    .order("z", { ascending: true, nullsFirst: true });
  if (error) throw error;
  return (data ?? []) as BoardCard[];
}

/** The board's optional description/subtitle (B+); empty saves as none. */
export async function updateBoardDescription(
  supabase: SupabaseClient,
  id: string,
  description: string | null,
): Promise<void> {
  const value = description && description.trim() ? description.trim() : null;
  const { error } = await supabase.from("board").update({ description: value }).eq("id", id);
  if (error) throw error;
}

/** Rename a board — free, forever; titles never touch anything placed (P9). */
export async function renameBoard(
  supabase: SupabaseClient,
  id: string,
  title: string | null,
): Promise<void> {
  const value = title && title.trim() ? title.trim() : null;
  const { error } = await supabase.from("board").update({ title: value }).eq("id", id);
  if (error) throw error;
}

/** Trash a board — a freeze; restorable (§2g). Its bits are untouched. */
export async function trashBoard(
  supabase: SupabaseClient,
  id: string,
): Promise<void> {
  await setResting(supabase, "board", id, "deleted_at", true);
}

/** Restore a trashed board — its arrangement returns exactly (§2g). Restoring against
 *  an emptied trash must say so, not silently no-op (R2.12) — asserted in setResting. */
export async function restoreBoard(
  supabase: SupabaseClient,
  id: string,
): Promise<void> {
  await setResting(supabase, "board", id, "deleted_at", false);
}

/** DESTROY a board permanently (I-L6) — only if trashed. Cascade deletes its
 *  placements (those on it AND board-cards of it), connectors, and tag
 *  applications; NO bits (I-L7). Guarded to trashed-only. */
export async function destroyBoard(supabase: SupabaseClient, id: string): Promise<void> {
  const { error } = await supabase
    .from("board")
    .delete()
    .eq("id", id)
    .not("deleted_at", "is", null);
  if (error) throw error;
}

/** Empty the trash — destroy every trashed bit + board (I-L2 · I-L10 · I-L6).
 *  DELETE…RETURNING (R2.8): the file paths come from the rows ACTUALLY deleted, so a
 *  bit restored mid-act simply isn't in the returning set — its files are never
 *  touched (the old read-then-delete shape could remove a restored bit's media from a
 *  stale path list). Rows-first ordering: a failed file-remove leaves orphan objects
 *  (the accepted lesser evil), never restorable rows whose media is gone. The bulk
 *  delete is ONE atomic statement — all rows or an error; on error nothing was
 *  deleted and no file is removed. Files removed right after the bit delete so a
 *  board-delete failure can't strand them. */
export async function emptyTrash(supabase: SupabaseClient): Promise<void> {
  const bitDel = await supabase
    .from("bit")
    .delete()
    .not("deleted_at", "is", null)
    .select("storage_path, thumb_path");
  if (bitDel.error) throw bitDel.error;
  const paths = (bitDel.data ?? []).flatMap((b) => [
    b.storage_path as string | null,
    b.thumb_path as string | null,
  ]);
  if (paths.some(Boolean)) await removeObjects(supabase, paths);
  const boardDel = await supabase.from("board").delete().not("deleted_at", "is", null);
  if (boardDel.error) throw boardDel.error;
}

/** The trash listing: the frozen things' one surface (§4 · I-T4). */
export type TrashItem = { thing: "bit" | "board"; id: string; label: string | null; deletedAt: string };
export async function listTrash(supabase: SupabaseClient): Promise<TrashItem[]> {
  const { data, error } = await supabase
    .from("trash_listing")
    .select("thing, thing_id, label, deleted_at");
  if (error) throw error;
  return (data ?? []).map((r) => ({
    thing: r.thing as "bit" | "board",
    id: r.thing_id as string,
    label: (r.label as string | null) ?? null,
    deletedAt: r.deleted_at as string,
  }));
}
