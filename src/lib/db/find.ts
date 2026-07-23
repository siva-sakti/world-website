import type { SupabaseClient } from "@supabase/supabase-js";
import type { Bit, BitType } from "@/lib/types";

// Find (§7) — all computed, stored nowhere. The empty query is THE LEDGER: every
// live bit, newest first, the reachability floor (I-T1). Add a text query, a tag,
// or a type and it narrows. Filtering by a tag is the pull (everything carrying
// the word). Search runs over the face's words (the search index, D-088).

export type FindResult = Bit & { tags: { id: string; word: string }[] };

export type FindArgs = { q?: string; tagId?: string; type?: BitType };

export async function findBits(
  supabase: SupabaseClient,
  args: FindArgs,
): Promise<FindResult[]> {
  // A tag filter is a join, so resolve the matching bit ids first (the pull).
  let onlyIds: string[] | null = null;
  if (args.tagId) {
    const { data, error } = await supabase
      .from("tag_application")
      .select("target_bit_id")
      .eq("tag_id", args.tagId)
      .not("target_bit_id", "is", null);
    if (error) throw error;
    onlyIds = (data ?? []).map((r) => r.target_bit_id as string);
    if (onlyIds.length === 0) return [];
  }

  let query = supabase
    .from("bit")
    .select("*")
    .is("deleted_at", null)
    .order("created_at", { ascending: false })
    .limit(200);
  if (args.type) query = query.eq("type", args.type);
  if (args.q && args.q.trim())
    query = query.textSearch("search_tsv", args.q.trim(), { type: "websearch" });
  if (onlyIds) query = query.in("id", onlyIds);

  const { data: bits, error } = await query;
  if (error) throw error;
  const rows = (bits ?? []) as Bit[];
  if (rows.length === 0) return [];

  // Attach each bit's tags in one round-trip.
  const { data: apps, error: tErr } = await supabase
    .from("tag_application")
    .select("target_bit_id, tag:tag(id, word)")
    .in("target_bit_id", rows.map((b) => b.id));
  if (tErr) throw tErr;
  const byBit = new Map<string, { id: string; word: string }[]>();
  for (const a of apps ?? []) {
    const t = a.tag as unknown as { id: string; word: string };
    const arr = byBit.get(a.target_bit_id as string) ?? [];
    if (t) arr.push(t);
    byBit.set(a.target_bit_id as string, arr);
  }

  return rows.map((b) => ({ ...b, tags: byBit.get(b.id) ?? [] }));
}
