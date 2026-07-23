import type { SupabaseClient } from "@supabase/supabase-js";

// Tagging (§3). A tag is a word stored once; applying it is an act (one row per
// word-on-thing). The word is created on first use, case-insensitively (§3e —
// Astrology/astrology can't both exist), enforced by the DB's CI-unique index.
// Only owner acts write tags (I-G4); the picker only ever proposes.

export type Tag = { id: string; word: string };

/** A tag word for the picker, with its live count and last use (recency-first). */
export type TagChoice = { id: string; word: string; count: number; lastUsed: string | null };

/** Every tag word, most-recently-used first — the picker's menu (§3c). */
export async function listTags(supabase: SupabaseClient): Promise<TagChoice[]> {
  const { data, error } = await supabase
    .from("tag_counts")
    .select("tag_id, word, world_count, last_used_at");
  if (error) throw error;
  return (data ?? [])
    .map((r) => ({
      id: r.tag_id as string,
      word: r.word as string,
      count: (r.world_count as number) ?? 0,
      lastUsed: (r.last_used_at as string | null) ?? null,
    }))
    .sort((a, b) => (b.lastUsed ?? "").localeCompare(a.lastUsed ?? ""));
}

// Anything is taggable — a bit OR a board (§3a). One shape, both targets.
export type TagTarget = { bitId: string } | { boardId: string };
function targetCol(t: TagTarget): { col: "target_bit_id" | "target_board_id"; id: string } {
  return "bitId" in t
    ? { col: "target_bit_id", id: t.bitId }
    : { col: "target_board_id", id: t.boardId };
}

/** The tags currently on one thing (a bit or a board). */
export async function getThingTags(
  supabase: SupabaseClient,
  target: TagTarget,
): Promise<Tag[]> {
  const { col, id } = targetCol(target);
  const { data, error } = await supabase
    .from("tag_application")
    .select("tag:tag(id, word)")
    .eq(col, id);
  if (error) throw error;
  return (data ?? []).map((r) => r.tag as unknown as Tag).filter(Boolean);
}

/** Apply a tag word to a thing — find-or-create the word (CI), then record the
 *  act. Idempotent: re-applying is a no-op (UNIQUE(tag,target), I-R7). */
export async function applyTag(
  supabase: SupabaseClient,
  args: TagTarget & { word: string },
): Promise<Tag> {
  const word = args.word.trim();
  if (!word) throw new Error("empty tag");

  // Create the word; if it already exists (CI), select the existing one.
  let tag: Tag;
  const ins = await supabase.from("tag").insert({ word }).select("id, word").single();
  if (ins.error) {
    if (ins.error.code === "23505") {
      const sel = await supabase.from("tag").select("id, word").ilike("word", word).limit(1).single();
      if (sel.error) throw sel.error;
      tag = sel.data as Tag;
    } else {
      throw ins.error;
    }
  } else {
    tag = ins.data as Tag;
  }

  const { col, id } = targetCol(args);
  const app = await supabase.from("tag_application").insert({ tag_id: tag.id, [col]: id });
  if (app.error && app.error.code !== "23505") throw app.error;
  return tag;
}

/** Remove a tag from a thing — un-tag is traceless (agreements §5). */
export async function removeTag(
  supabase: SupabaseClient,
  args: TagTarget & { tagId: string },
): Promise<void> {
  const { col, id } = targetCol(args);
  const { error } = await supabase
    .from("tag_application")
    .delete()
    .eq(col, id)
    .eq("tag_id", args.tagId);
  if (error) throw error;
}

// ---- the tag manager (§3e) ----

/** Rename a tag word — free; every use follows instantly (P9, id-referenced). */
export async function renameTag(
  supabase: SupabaseClient,
  tagId: string,
  word: string,
): Promise<void> {
  const w = word.trim();
  if (!w) throw new Error("empty tag name");
  const { error } = await supabase.from("tag").update({ word: w }).eq("id", tagId);
  if (error) throw error;
}

/** Merge `from` into `into` — everything carrying `from` now carries `into`,
 *  deduped by construction (I-R7); `from` disappears (§3e). Reaches every
 *  application, in-world and frozen (I-T3), so a later restore can't resurrect a
 *  reference to the deleted word. */
export async function mergeTags(
  supabase: SupabaseClient,
  fromId: string,
  intoId: string,
): Promise<void> {
  if (fromId === intoId) return;
  const { data: fromApps, error } = await supabase
    .from("tag_application")
    .select("target_bit_id, target_board_id")
    .eq("tag_id", fromId);
  if (error) throw error;
  for (const a of fromApps ?? []) {
    const ins = await supabase.from("tag_application").insert({
      tag_id: intoId,
      target_bit_id: a.target_bit_id,
      target_board_id: a.target_board_id,
    });
    // 23505 = the target already carries `into` — the dedupe we want; ignore.
    if (ins.error && ins.error.code !== "23505") throw ins.error;
  }
  const del = await supabase.from("tag").delete().eq("id", fromId); // cascade drops from's apps
  if (del.error) throw del.error;
}

/** Delete a tag word — its applications go (cascade, in-world AND frozen, I-T3);
 *  the things survive, they just lose the word (§3e). */
export async function deleteTag(supabase: SupabaseClient, tagId: string): Promise<void> {
  const { error } = await supabase.from("tag").delete().eq("id", tagId);
  if (error) throw error;
}
