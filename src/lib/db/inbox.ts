import type { SupabaseClient } from "@supabase/supabase-js";
import type { Bit } from "@/lib/types";
import type { Source } from "@/lib/db/sources";
import type { Tag } from "@/lib/db/tags";

// A bit rendered for a browse surface: the bit + its "where from" (single) + its
// tags (many) + the live boards it sits on (many). `boards` empty ⇔ LOOSE.
export type BoardRef = { id: string; title: string | null };
export type PanelBit = Bit & { source: Source | null; tags: Tag[]; boards: BoardRef[] };
// The inbox item is the loose subset — same shape minus the (empty) board list.
export type InboxItem = Bit & { source: Source | null; tags: Tag[] };

// listAllBits — EVERY live bit + source + tags + its live board memberships. The
// on-board panel's one read (the all-bits browser); the inbox derives from it.
//
// Membership uses THE RENDER RULE, identical to the `the_inbox` view (review
// Finding 1): a placement counts only when it is LIVE (left_at null) AND on a
// NON-TRASHED board (board.deleted_at null) — a trashed board renders nothing, so
// it is not a membership, and a bit whose only board is trashed reads as loose.
// Keeping this identical to the_inbox is why F19 ("one loose definition") holds.
export async function listAllBits(supabase: SupabaseClient): Promise<PanelBit[]> {
  const { data, error } = await supabase
    .from("bit")
    .select("*")
    .is("deleted_at", null)
    .order("created_at", { ascending: false });
  if (error) throw error;
  const bits = (data ?? []) as Bit[];
  if (bits.length === 0) return [];
  const ids = bits.map((b) => b.id);

  // Board memberships (the render rule). Name the FK so the embed isn't ambiguous
  // (a placement links board two ways); we want the board it SITS ON.
  const { data: places, error: pErr } = await supabase
    .from("placement")
    .select("target_bit_id, board:board!placement_board_id_fkey(id, title, deleted_at)")
    .is("left_at", null)
    .in("target_bit_id", ids);
  if (pErr) throw pErr;
  const boardsByBit = new Map<string, BoardRef[]>();
  for (const p of places ?? []) {
    const bd = p.board as unknown as { id: string; title: string | null; deleted_at: string | null } | null;
    if (!bd || bd.deleted_at) continue; // trashed board renders nothing → not a live membership
    const arr = boardsByBit.get(p.target_bit_id as string) ?? [];
    arr.push({ id: bd.id, title: bd.title });
    boardsByBit.set(p.target_bit_id as string, arr);
  }

  // Sources: one lookup over the distinct ids carried.
  const srcById = new Map<string, Source>();
  const sourceIds = [...new Set(bits.map((b) => b.source_id).filter((x): x is string => Boolean(x)))];
  if (sourceIds.length > 0) {
    const { data: srcs, error: sErr } = await supabase
      .from("source")
      .select("id, name, url")
      .in("id", sourceIds);
    if (sErr) throw sErr;
    for (const s of (srcs ?? []) as Source[]) srcById.set(s.id, s);
  }

  // Tags: one lookup over the whole set.
  const { data: apps, error: tErr } = await supabase
    .from("tag_application")
    .select("target_bit_id, tag:tag(id, word)")
    .in("target_bit_id", ids);
  if (tErr) throw tErr;
  const tagsByBit = new Map<string, Tag[]>();
  for (const a of apps ?? []) {
    const t = a.tag as unknown as Tag;
    const arr = tagsByBit.get(a.target_bit_id as string) ?? [];
    if (t) arr.push(t);
    tagsByBit.set(a.target_bit_id as string, arr);
  }

  return bits.map((b) => ({
    ...b,
    source: b.source_id ? srcById.get(b.source_id) ?? null : null,
    tags: tagsByBit.get(b.id) ?? [],
    boards: boardsByBit.get(b.id) ?? [],
  }));
}

// The inbox = the LOOSE subset of all bits (F19 — one definition, no drift with the
// on-board panel). A bit is loose ⇔ no live membership on a non-trashed board.
export async function listInbox(supabase: SupabaseClient): Promise<InboxItem[]> {
  const all = await listAllBits(supabase);
  return all.filter((b) => b.boards.length === 0);
}
