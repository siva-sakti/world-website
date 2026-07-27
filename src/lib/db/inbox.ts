import type { SupabaseClient } from "@supabase/supabase-js";
import type { Bit } from "@/lib/types";
import type { Source } from "@/lib/db/sources";
import type { Tag } from "@/lib/db/tags";

// A loose bit, rendered for the inbox: the bit plus its "where from" (single) and
// its tags (many) — so the browse surface shows provenance + words at a glance.
export type InboxItem = Bit & { source: Source | null; tags: Tag[] };

// The inbox = the loose pile (D-100). A bit is loose when it is live AND no board
// actually shows it — computed by the `the_inbox` view (security_invoker; the
// exact render conjunction board_cards uses, plus the bit's own deleted_at).
// Reads only: a loose bit is BORN by creating a bit with no placement, or RETURNS
// here when un-placed from its last board. Newest-first. Source + tags are attached
// in one round-trip each (mirrors find.ts) so the pile renders with no per-card query.
export async function listInbox(supabase: SupabaseClient): Promise<InboxItem[]> {
  const { data, error } = await supabase
    .from("the_inbox")
    .select("*")
    .order("created_at", { ascending: false });
  if (error) throw error;
  const bits = (data ?? []) as Bit[];
  if (bits.length === 0) return [];

  // Sources: one lookup over the distinct ids the loose set actually carries.
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

  // Tags: one lookup over every loose bit (the pull, denormalized for the pile).
  const { data: apps, error: tErr } = await supabase
    .from("tag_application")
    .select("target_bit_id, tag:tag(id, word)")
    .in("target_bit_id", bits.map((b) => b.id));
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
  }));
}
