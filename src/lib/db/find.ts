import type { SupabaseClient } from "@supabase/supabase-js";
import type { Bit, BitType } from "@/lib/types";
import { bitLabel, boardLabel } from "@/lib/labels";

// Find (§7) — all computed, stored nowhere. The empty query is THE LEDGER: every
// live bit, newest first, the reachability floor (I-T1). Add a text query, a tag,
// or a type and it narrows. Filtering by a tag is the pull (everything carrying
// the word). Search runs over the face's words (the search index, D-088).

export type FindResult = Bit & { tags: { id: string; word: string }[] };

export type FindArgs = { q?: string; tagId?: string; type?: BitType; kind?: "bit" | "note" };

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
  if (args.kind) query = query.eq("kind", args.kind); // bit vs note (N4)
  if (args.q && args.q.trim())
    query = query.textSearch("search_tsv", args.q.trim(), { type: "websearch" });
  if (onlyIds) query = query.in("id", onlyIds);

  const { data: bits, error } = await query;
  if (error) throw error;
  return attachTags(supabase, (bits ?? []) as Bit[]);
}

/** Everything from one source (§5b) — the source view's list. Live bits carrying
 *  source_id = X, newest first, tags attached. Grouping by id is cheap (I-Src);
 *  clones the findBits shape so the two lists render identically. */
export async function bitsFromSource(
  supabase: SupabaseClient,
  sourceId: string,
): Promise<FindResult[]> {
  const { data, error } = await supabase
    .from("bit")
    .select("*")
    .eq("source_id", sourceId)
    .is("deleted_at", null)
    .order("created_at", { ascending: false })
    .limit(200);
  if (error) throw error;
  return attachTags(supabase, (data ?? []) as Bit[]);
}

/** Attach each bit's tags in one round-trip (the pull, denormalized for a list). */
async function attachTags(
  supabase: SupabaseClient,
  rows: Bit[],
): Promise<FindResult[]> {
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

// ---- boards + the unified find (N4) ----

type BoardFindRow = { id: string; title: string | null; created_at: string; tags: { id: string; word: string }[] };

/** Boards matching a text query (over the board's `search_tsv` — its title) and/or a
 *  tag (a tag on a board — the polymorphic `target_board_id` side). Title-deep only:
 *  we do NOT dive into the bits placed on a board (those turn up as bits themselves). */
export async function findBoards(
  supabase: SupabaseClient,
  args: { q?: string; tagId?: string },
): Promise<BoardFindRow[]> {
  let onlyIds: string[] | null = null;
  if (args.tagId) {
    const { data, error } = await supabase
      .from("tag_application")
      .select("target_board_id")
      .eq("tag_id", args.tagId)
      .not("target_board_id", "is", null);
    if (error) throw error;
    onlyIds = (data ?? []).map((r) => r.target_board_id as string);
    if (onlyIds.length === 0) return [];
  }

  let query = supabase
    .from("board")
    .select("id, title, created_at")
    .is("deleted_at", null)
    .order("created_at", { ascending: false })
    .limit(200);
  if (args.q && args.q.trim())
    query = query.textSearch("search_tsv", args.q.trim(), { type: "websearch" });
  if (onlyIds) query = query.in("id", onlyIds);

  const { data, error } = await query;
  if (error) throw error;
  const rows = (data ?? []) as { id: string; title: string | null; created_at: string }[];
  if (rows.length === 0) return [];

  const { data: apps, error: tErr } = await supabase
    .from("tag_application")
    .select("target_board_id, tag:tag(id, word)")
    .in("target_board_id", rows.map((b) => b.id));
  if (tErr) throw tErr;
  const byBoard = new Map<string, { id: string; word: string }[]>();
  for (const a of apps ?? []) {
    const t = a.tag as unknown as { id: string; word: string };
    const arr = byBoard.get(a.target_board_id as string) ?? [];
    if (t) arr.push(t);
    byBoard.set(a.target_board_id as string, arr);
  }
  return rows.map((b) => ({ ...b, tags: byBoard.get(b.id) ?? [] }));
}

export type FindKind = "all" | "bit" | "note" | "board";

/** One result in the mixed find list, tagged with what it is. */
export type FindItem = {
  kind: "bit" | "note" | "board";
  id: string;
  label: string;
  mediaType?: BitType; // bits only — text/drawing/image
  tags: { id: string; word: string }[];
  created_at: string;
};

/** Find across all three kinds (N4). Bits (fragments and notes, by their words),
 *  boards (by their title), each labeled; narrowed by `kind`; newest first. Empty
 *  query = everything (the ledger, now including boards). */
export async function findItems(
  supabase: SupabaseClient,
  args: { q?: string; tagId?: string; kind: FindKind },
): Promise<FindItem[]> {
  const wantBits = args.kind === "all" || args.kind === "bit" || args.kind === "note";
  const wantBoards = args.kind === "all" || args.kind === "board";
  const items: FindItem[] = [];

  if (wantBits) {
    const bitKind = args.kind === "bit" || args.kind === "note" ? args.kind : undefined;
    const bits = await findBits(supabase, { q: args.q, tagId: args.tagId, kind: bitKind });
    for (const b of bits) {
      items.push({
        kind: b.kind,
        id: b.id,
        label: bitLabel(b.type, b.face),
        mediaType: b.type,
        tags: b.tags,
        created_at: b.created_at,
      });
    }
  }

  if (wantBoards) {
    const boards = await findBoards(supabase, { q: args.q, tagId: args.tagId });
    for (const bd of boards) {
      items.push({
        kind: "board",
        id: bd.id,
        label: boardLabel(bd.title),
        tags: bd.tags,
        created_at: bd.created_at,
      });
    }
  }

  items.sort((a, z) => z.created_at.localeCompare(a.created_at));
  return items.slice(0, 200);
}
