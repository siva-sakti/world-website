import type { SupabaseClient } from "@supabase/supabase-js";
import type { Bit, BitType } from "@/lib/types";
import { bitLabel } from "@/lib/labels";
import { pagedRows, chunk } from "@/lib/db/paged";

// Search (§7) — all computed, stored nowhere. The empty query is THE LEDGER: every
// live bit, newest first, the reachability floor (I-T1). Add a text query, a tag,
// or a type and it narrows. Filtering by a tag is the pull (everything carrying the
// word). Search runs over the bit's words (the search index, D-088) — a board never
// appears (no content of its own; reach a board by title via jump-to on its list).

export type SearchResult = Bit & { tags: { id: string; word: string }[] };

export type SearchArgs = { q?: string; tagId?: string; type?: BitType; kind?: "bit" | "note" };

async function searchBits(
  supabase: SupabaseClient,
  args: SearchArgs,
): Promise<SearchResult[]> {
  // A tag filter is a join, so resolve the matching bit ids first (the pull).
  // Paged: an unbounded read silently stops at PostgREST's 1000-row cap, which for
  // a popular tag would quietly drop bits OUT of the pull's result.
  let onlyIds: string[] | null = null;
  if (args.tagId) {
    const rows = await pagedRows<{ target_bit_id: string }>((from, to) =>
      supabase
        .from("tag_application")
        .select("target_bit_id")
        .eq("tag_id", args.tagId!)
        .not("target_bit_id", "is", null)
        .order("target_bit_id")
        .range(from, to),
    );
    onlyIds = rows.map((r) => r.target_bit_id);
    if (onlyIds.length === 0) return [];
  }

  // PAGED, not capped (review F4): the old `.limit(1000)` was exactly PostgREST's
  // max_rows, so /search silently truncated while its UI said "everything". The
  // second `.order("id")` is the stable tiebreak — created_at ties without it can
  // repeat or drop rows across page boundaries.
  const bits = await pagedRows<Bit>((from, to) => {
    let q = supabase
      .from("bit")
      .select("*")
      .eq("state", "live")
      .order("created_at", { ascending: false })
      .order("id")
      .range(from, to);
    if (args.type) q = q.eq("type", args.type);
    if (args.kind) q = q.eq("kind", args.kind); // bit vs note
    if (args.q && args.q.trim())
      q = q.textSearch("search_tsv", args.q.trim(), { type: "websearch" });
    // A huge id list would blow the URL; chunking here would break paging, so the
    // tag filter narrows client-side below when it's large.
    if (onlyIds && onlyIds.length <= 200) q = q.in("id", onlyIds);
    return q;
  });
  const only = onlyIds && onlyIds.length > 200 ? new Set(onlyIds) : null;
  return attachTags(supabase, only ? bits.filter((b) => only.has(b.id)) : bits);
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
  // CHUNKED (URL length) *and* PAGED (the 1000-row cap): 200 bits carrying >5 tags
  // each overflows a single page inside one chunk, which would make the tag facet
  // WRONG rather than merely short. Chunking alone moves that bug; it doesn't close it.
  const apps: { target_bit_id: unknown; tag: unknown }[] = [];
  for (const ids of chunk(rows.map((b) => b.id))) {
    const page = await pagedRows<{ target_bit_id: unknown; tag: unknown }>((from, to) =>
      supabase
        .from("tag_application")
        .select("target_bit_id, tag:tag(id, word)")
        .in("target_bit_id", ids)
        .order("target_bit_id")
        .order("tag_id")
        .range(from, to),
    );
    apps.push(...page);
  }
  const byBit = new Map<string, { id: string; word: string }[]>();
  for (const a of apps) {
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
  // Source names, searchable ("ottessa" finds everything from Ottessa) — the queue's
  // "search misses the source attached to a bit" gap. One round-trip for the distinct
  // sources on these bits (the attachTags pattern).
  const srcIds = [...new Set(bits.map((b) => b.source_id).filter((x): x is string => Boolean(x)))];
  const srcName = new Map<string, string>();
  if (srcIds.length) {
    const { data } = await supabase.from("source").select("id, name").in("id", srcIds);
    for (const s of data ?? []) srcName.set(s.id as string, s.name as string);
  }
  const items: SearchItem[] = bits.map((b) => {
    // `face` IS a stored generated column on bit (init.sql:190 — the old comment here
    // claimed otherwise, and the JS re-derivation had already drifted: an uncaptioned
    // link labeled generically where the DB face shows its URL — review B1/L7).
    // Use the DB's face; derive-don't-duplicate.
    const bodyText = (b.body ?? "").replace(/<[^>]+>/g, " ").trim();
    const face = b.face;
    // A link's url, split into WORDS — the DB tsvector only tokenizes hosts whole
    // ("barewall.example.net"), so word-level url search lives here (link-bit-plan §9).
    const urlWords = (b.url ?? "").replace(/[^\p{L}\p{N}]+/gu, " ").trim();
    return {
      kind: b.kind,
      id: b.id,
      label: bitLabel(b.type, face),
      mediaType: b.type,
      tags: b.tags,
      created_at: b.created_at,
      // file_name too (media findable by filename), and a link's title + url words —
      // the DB search_tsv indexes them, but the /search UI filters client-side on this.
      searchText: `${b.content ?? ""} ${bodyText} ${b.file_name ?? ""} ${b.captured_title ?? ""} ${urlWords} ${b.source_id ? (srcName.get(b.source_id) ?? "") : ""} ${b.tags.map((t) => t.word).join(" ")}`.toLowerCase(),
    };
  });
  items.sort((a, z) => z.created_at.localeCompare(a.created_at));
  return items.slice(0, 2000);
}
