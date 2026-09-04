import type { SupabaseClient } from "@supabase/supabase-js";
import type { Bit } from "@/lib/types";
import type { Source } from "@/lib/db/sources";
import type { Tag } from "@/lib/db/tags";
import { pagedRows, chunk } from "@/lib/db/paged";
import { MEMBERSHIP_SELECT, liveBoardOf, type BoardRef } from "./board-membership";

// A bit rendered for a browse surface: the bit + its "where from" (single) + its
// tags (many) + the live boards it sits on (many). `boards` empty ⇔ LOOSE.
export type { BoardRef } from "./board-membership"; // one definition, not a second copy
export type PanelBit = Bit & { source: Source | null; tags: Tag[]; boards: BoardRef[] };

// listAllBits — EVERY live bit + source + tags + its live board memberships. The
// on-board panel's one read (the all-bits browser); the inbox derives from it.
//
// Membership uses THE RENDER RULE, identical to the `the_inbox` view (review
// Finding 1): a placement counts only when it is LIVE (left_at null) AND on a
// NON-TRASHED board (board.deleted_at null) — a trashed board renders nothing, so
// it is not a membership, and a bit whose only board is trashed reads as loose.
// Keeping this identical to the_inbox is why F19 ("one loose definition") holds.
export async function listAllBits(supabase: SupabaseClient): Promise<PanelBit[]> {
  // Paged + chunked (review L2): past PostgREST's silent 1000-row cap, a bare read
  // truncates — the bit list would cut off AND placed bits would misclassify as
  // LOOSE (their membership rows dropped), inviting mistaken bulk acts.
  const bits = await pagedRows<Bit>((from, to) =>
    supabase
      .from("bit")
      .select("*")
      .eq("state", "live")
      .order("created_at", { ascending: false })
      .order("id") // tiebreak — created_at ties must not shuffle across pages
      .range(from, to),
  );
  if (bits.length === 0) return [];
  const ids = bits.map((b) => b.id);

  // Board memberships — the ONE definition (lib/db/board-membership), shared with
  // getBitBoards so the two can never drift apart again.
  const boardsByBit = new Map<string, BoardRef[]>();
  for (const idChunk of chunk(ids)) {
    const { data: places, error: pErr } = await supabase
      .from("placement")
      .select(`target_bit_id, ${MEMBERSHIP_SELECT}`)
      .is("left_at", null)
      .in("target_bit_id", idChunk);
    if (pErr) throw pErr;
    for (const p of places ?? []) {
      const bd = liveBoardOf(p);
      if (!bd) continue; // a trashed/archived board renders nothing → not a live membership
      const arr = boardsByBit.get(p.target_bit_id as string) ?? [];
      arr.push(bd);
      boardsByBit.set(p.target_bit_id as string, arr);
    }
  }

  // Sources: one lookup over the distinct ids carried.
  const srcById = new Map<string, Source>();
  const sourceIds = [...new Set(bits.map((b) => b.source_id).filter((x): x is string => Boolean(x)))];
  for (const idChunk of chunk(sourceIds)) {
    const { data: srcs, error: sErr } = await supabase
      .from("source")
      .select("id, name, url")
      .in("id", idChunk);
    if (sErr) throw sErr;
    for (const s of (srcs ?? []) as Source[]) srcById.set(s.id, s);
  }

  // Tags: chunked lookups over the whole set.
  // Chunked (URL length) AND paged (the 1000-row cap): a chunk of 200 bits with
  // several tags each overflows one page, which makes the tag lists WRONG, not short.
  const apps: { target_bit_id: unknown; tag: unknown }[] = [];
  for (const idChunk of chunk(ids)) {
    const page = await pagedRows<{ target_bit_id: unknown; tag: unknown }>((from, to) =>
      supabase
        .from("tag_application")
        .select("target_bit_id, tag:tag(id, word)")
        .in("target_bit_id", idChunk)
        .order("target_bit_id")
        .order("tag_id")
        .range(from, to),
    );
    apps.push(...page);
  }
  const tagsByBit = new Map<string, Tag[]>();
  for (const a of apps) {
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
