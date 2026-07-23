import type { SupabaseClient } from "@supabase/supabase-js";
import type { Board, BoardCard, HomeBoard } from "@/lib/types";

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
    .is("deleted_at", null)
    .maybeSingle();
  if (error) throw error;
  return data as Board | null;
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
  const { error } = await supabase
    .from("board")
    .update({ deleted_at: new Date().toISOString() })
    .eq("id", id);
  if (error) throw error;
}

/** Restore a trashed board — its arrangement returns exactly (§2g). */
export async function restoreBoard(
  supabase: SupabaseClient,
  id: string,
): Promise<void> {
  const { error } = await supabase
    .from("board")
    .update({ deleted_at: null })
    .eq("id", id);
  if (error) throw error;
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
