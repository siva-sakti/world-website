import type { SupabaseClient } from "@supabase/supabase-js";
import type { Bit, BitType } from "@/lib/types";
import { bitLabel } from "@/lib/labels";

// Search (§7) — all computed, stored nowhere. The empty query is THE LEDGER: every
// live bit, newest first, the reachability floor (I-T1). Add a text query, a tag,
// or a type and it narrows. Filtering by a tag is the pull (everything carrying the
// word). Search runs over the bit's words (the search index, D-088) — a board never
// appears (no content of its own; reach a board by title via jump-to on its list).

export type SearchResult = Bit & { tags: { id: string; word: string }[] };

export type SearchArgs = { q?: string; tagId?: string; type?: BitType; kind?: "bit" | "note" };

export async function searchBits(
  supabase: SupabaseClient,
  args: SearchArgs,
): Promise<SearchResult[]> {
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
    .eq("state", "live")
    .order("created_at", { ascending: false })
    .limit(1000); // load-most: search filters client-side (instant); ~1000+ = server-search trigger
  if (args.type) query = query.eq("type", args.type);
  if (args.kind) query = query.eq("kind", args.kind); // bit vs note
  if (args.q && args.q.trim())
    query = query.textSearch("search_tsv", args.q.trim(), { type: "websearch" });
  if (onlyIds) query = query.in("id", onlyIds);

  const { data: bits, error } = await query;
  if (error) throw error;
  return attachTags(supabase, (bits ?? []) as Bit[]);
}

/** Everything from one source (§5b) — the source view's list. Live bits carrying
 *  source_id = X, newest first, tags attached. Grouping by id is cheap (I-Src);
 *  clones the searchBits shape so the two lists render identically. */
export async function bitsFromSource(
  supabase: SupabaseClient,
  sourceId: string,
): Promise<SearchResult[]> {
  const { data, error } = await supabase
    .from("bit")
    .select("*")
    .eq("source_id", sourceId)
    .eq("state", "live")
    .order("created_at", { ascending: false })
    .limit(200);
  if (error) throw error;
  return attachTags(supabase, (data ?? []) as Bit[]);
}

/** Attach each bit's tags in one round-trip (the pull, denormalized for a list). */
async function attachTags(
  supabase: SupabaseClient,
  rows: Bit[],
): Promise<SearchResult[]> {
  if (rows.length === 0) return [];
  const { data: apps, error } = await supabase
    .from("tag_application")
    .select("target_bit_id, tag:tag(id, word)")
    .in("target_bit_id", rows.map((b) => b.id));
  if (error) throw error;
  const byBit = new Map<string, { id: string; word: string }[]>();
  for (const a of apps ?? []) {
    const t = a.tag as unknown as { id: string; word: string };
    const arr = byBit.get(a.target_bit_id as string) ?? [];
    if (t) arr.push(t);
    byBit.set(a.target_bit_id as string, arr);
  }
  return rows.map((b) => ({ ...b, tags: byBit.get(b.id) ?? [] }));
}

export type SearchKind = "all" | "bit" | "note";

/** One result in the search list, tagged with what it is (a bit or a note). */
export type SearchItem = {
  kind: "bit" | "note";
  id: string;
  label: string;
  mediaType?: BitType; // text/drawing/image
  tags: { id: string; word: string }[];
  created_at: string;
  searchText: string; // lowercased words to match on client-side (content + body + face)
};

/** Search across bits and notes by their words, each labeled; narrowed by `kind`;
 *  newest first. Empty query = everything (the ledger). A board never appears — it
 *  has no content of its own (reach a board by title via jump-to on its list). */
export async function searchItems(
  supabase: SupabaseClient,
  args: { q?: string; tagId?: string; kind: SearchKind },
): Promise<SearchItem[]> {
  const bitKind = args.kind === "bit" || args.kind === "note" ? args.kind : undefined;
  const bits = await searchBits(supabase, { q: args.q, tagId: args.tagId, kind: bitKind });
  const items: SearchItem[] = bits.map((b) => ({
    kind: b.kind,
    id: b.id,
    label: bitLabel(b.type, b.face),
    mediaType: b.type,
    tags: b.tags,
    created_at: b.created_at,
    searchText: `${b.content ?? ""} ${(b.body ?? "").replace(/<[^>]+>/g, " ")} ${b.face ?? ""}`.toLowerCase(),
  }));
  items.sort((a, z) => z.created_at.localeCompare(a.created_at));
  return items.slice(0, 2000);
}
