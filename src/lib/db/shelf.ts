import type { SupabaseClient } from "@supabase/supabase-js";

// The shelf (organize plan O1): groups + pins = how HOME is arranged.
// Arrangement, not knowledge — a group is a shelf section (one per board),
// never a rival to tags (meaning) or hub boards (craft). One-door module.

export type ShelfGroup = { id: string; name: string; position: number; pinned_at: string | null };

export async function listGroups(supabase: SupabaseClient): Promise<ShelfGroup[]> {
  const { data, error } = await supabase
    .from("shelf_group")
    .select("id, name, position, pinned_at")
    .order("position", { ascending: true });
  if (error) throw error;
  return (data ?? []) as ShelfGroup[];
}

/** Create a section at the end of the shelf (position = after the last). */
export async function createGroup(supabase: SupabaseClient, name: string): Promise<ShelfGroup> {
  const clean = name.trim();
  if (!clean) throw new Error("a group needs a name");
  const groups = await listGroups(supabase);
  const position = (groups[groups.length - 1]?.position ?? 0) + 1;
  const { data, error } = await supabase
    .from("shelf_group")
    .insert({ name: clean, position })
    .select("id, name, position, pinned_at")
    .single();
  if (error) throw error;
  return data as ShelfGroup;
}

/** Shelve a board into a section (null = ungrouped). */
export async function setBoardGroup(
  supabase: SupabaseClient,
  boardId: string,
  groupId: string | null,
): Promise<void> {
  const { error } = await supabase.from("board").update({ group_id: groupId }).eq("id", boardId);
  if (error) throw error;
}

/** Move a section up/down the shelf: swap positions with its neighbor. */
export async function moveGroup(
  supabase: SupabaseClient,
  groupId: string,
  dir: "up" | "down",
): Promise<void> {
  const groups = await listGroups(supabase);
  const i = groups.findIndex((g) => g.id === groupId);
  if (i < 0) return;
  const j = dir === "up" ? i - 1 : i + 1;
  if (j < 0 || j >= groups.length) return; // already at the edge
  const a = groups[i];
  const b = groups[j];
  const { error: e1 } = await supabase.from("shelf_group").update({ position: b.position }).eq("id", a.id);
  if (e1) throw e1;
  const { error: e2 } = await supabase.from("shelf_group").update({ position: a.position }).eq("id", b.id);
  if (e2) throw e2;
}

/** How many live bits sit in each folder. Folders cut across kinds (O1b), so a
 *  "what happens if I delete this" count built from boards alone would understate
 *  it — and this app's confirms are honest about what they touch (F16). */
export async function countBitsPerGroup(
  supabase: SupabaseClient,
): Promise<Record<string, number>> {
  const { data, error } = await supabase
    .from("bit")
    .select("group_id")
    .not("group_id", "is", null)
    .is("deleted_at", null);
  if (error) throw error;
  const out: Record<string, number> = {};
  for (const r of data ?? []) {
    const g = r.group_id as string;
    out[g] = (out[g] ?? 0) + 1;
  }
  return out;
}

/** Delete a section — its boards fall back to ungrouped (set-null physics, proven). */
export async function deleteGroup(supabase: SupabaseClient, groupId: string): Promise<void> {
  const { error } = await supabase.from("shelf_group").delete().eq("id", groupId);
  if (error) throw error;
}

/** Shelve a bit into a section (null = ungrouped) — folders cut across kinds (O1b). */
export async function setBitGroup(
  supabase: SupabaseClient,
  bitId: string,
  groupId: string | null,
): Promise<void> {
  const { error } = await supabase.from("bit").update({ group_id: groupId }).eq("id", bitId);
  if (error) throw error;
}

/** Star / unstar a FOLDER — folders can be alive too (starred bump first). */
export async function pinGroup(supabase: SupabaseClient, groupId: string, on: boolean): Promise<void> {
  const { error } = await supabase
    .from("shelf_group")
    .update({ pinned_at: on ? new Date().toISOString() : null })
    .eq("id", groupId);
  if (error) throw error;
}

/** Pin / unpin a board (pinned floats to the shelf's top; timestamp orders pins). */
export async function pinBoard(supabase: SupabaseClient, boardId: string, on: boolean): Promise<void> {
  const { error } = await supabase
    .from("board")
    .update({ pinned_at: on ? new Date().toISOString() : null })
    .eq("id", boardId);
  if (error) throw error;
}

/** Pin / unpin a bit (pinned floats to the top of the notes view). */
export async function pinBit(supabase: SupabaseClient, bitId: string, on: boolean): Promise<void> {
  const { error } = await supabase
    .from("bit")
    .update({ pinned_at: on ? new Date().toISOString() : null })
    .eq("id", bitId);
  if (error) throw error;
}
