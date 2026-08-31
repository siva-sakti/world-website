import type { SupabaseClient } from "@supabase/supabase-js";
import { bitLabel } from "@/lib/labels";

// The graph data (Phase 3). v1 is the WORD web: your tags and the bits that carry
// them, joined by "this bit carries this word". Two node kinds only (tag, bit) so
// it stays legible. Untagged bits aren't part of the word web — they don't appear
// here (they'll show in the Rooms graph). Nodes are namespaced by kind so a tag id
// and a bit id can never collide in one list; degree drives dot size.

export type GraphNode = {
  id: string; // "tag_<uuid>" | "bit_<uuid>"
  kind: "tag" | "bit";
  label: string; // the word, or the bit's face (with its type fallback)
  bitType?: string; // for bits: text | drawing | image
  refId: string; // the underlying tag/bit id, for navigation
  degree: number; // number of connections — sizes the dot
};
export type GraphLink = { source: string; target: string };
export type WordGraph = { nodes: GraphNode[]; links: GraphLink[] };

export async function getWordGraph(supabase: SupabaseClient): Promise<WordGraph> {
  // One pass over every bit-tag application, pulling the word + the bit's face.
  const { data, error } = await supabase
    .from("tag_application")
    .select("tag:tag(id, word), bit:bit(id, face, type, state)")
    .not("target_bit_id", "is", null);
  if (error) throw error;

  const nodes = new Map<string, GraphNode>();
  const links: GraphLink[] = [];
  for (const a of data ?? []) {
    const tag = a.tag as unknown as { id: string; word: string } | null;
    const bit = a.bit as unknown as
      | { id: string; face: string | null; type: string; state: string }
      | null;
    if (!tag || !bit || bit.state !== "live") continue; // trashed/archived bits are out of the web

    const tagId = `tag_${tag.id}`;
    const bitId = `bit_${bit.id}`;
    if (!nodes.has(tagId))
      nodes.set(tagId, { id: tagId, kind: "tag", label: tag.word, refId: tag.id, degree: 0 });
    if (!nodes.has(bitId))
      nodes.set(bitId, {
        id: bitId,
        kind: "bit",
        label: bitLabel(bit.type, bit.face),
        bitType: bit.type,
        refId: bit.id,
        degree: 0,
      });
    links.push({ source: tagId, target: bitId });
    nodes.get(tagId)!.degree++;
    nodes.get(bitId)!.degree++;
  }

  return { nodes: [...nodes.values()], links };
}
