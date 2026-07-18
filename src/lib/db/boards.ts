import type { SupabaseClient } from "@supabase/supabase-js";
import type { Board, PlacedBit } from "@/lib/types";

// Data access for boards. Components call these; they never touch Supabase directly.

export async function listBoards(
  supabase: SupabaseClient,
): Promise<Board[]> {
  const { data, error } = await supabase
    .from("boards")
    .select("*")
    .order("updated_at", { ascending: false });
  if (error) throw error;
  return data ?? [];
}

export async function getBoard(
  supabase: SupabaseClient,
  id: string,
): Promise<Board | null> {
  const { data, error } = await supabase
    .from("boards")
    .select("*")
    .eq("id", id)
    .maybeSingle();
  if (error) throw error;
  return data;
}

export async function createBoard(
  supabase: SupabaseClient,
  title: string | null,
): Promise<Board> {
  const { data, error } = await supabase
    .from("boards")
    .insert({ title: title || null })
    .select("*")
    .single();
  if (error) throw error;
  return data;
}

/** A board's placements joined with their live bits, back-to-front by z. */
export async function getPlacedBits(
  supabase: SupabaseClient,
  boardId: string,
): Promise<PlacedBit[]> {
  const { data, error } = await supabase
    .from("placements")
    .select("*, bit:bits(*)")
    .eq("board_id", boardId)
    .order("z", { ascending: true });
  if (error) throw error;
  return (data ?? []) as unknown as PlacedBit[];
}
