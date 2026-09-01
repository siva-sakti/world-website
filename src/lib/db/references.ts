import type { SupabaseClient } from "@supabase/supabase-js";
import type { Stroke } from "@/lib/types";

// Gather references (gather-build-plan.md, Stage G2 — the write door + the backward
// read). A `reference` is a DIRECTED tie FROM a text note's writing TO any bit it
// gathered: typing `[[` in the body drops a chip `<span data-ref="<bitId>">name</span>`.
// The BODY is the source of truth; these rows are a DERIVED INDEX reconciled on save
// (migration 20260725000002), so "gathered into" is a fast read instead of scanning
// every body. There is no "author a reference" / "delete a reference" act — you edit
// your writing and save; reconcile makes the rows match the chips, traceless like
// un-tagging. Owner scoping is RLS (no uid in queries — like tags/sources). "From
// must be a text bit" is guarded HERE: the DB deliberately can't see the source's
// type without a second trigger (forbidden — one trigger only, §4.7), so this one
// write door enforces it, and gather-proofs attacks the DB accepting a non-text
// source to keep the boundary honest.

/** The distinct target ids a body's `[[` chips point at. The chip serializes as
 *  `<span data-ref="<bitId>">name</span>` — the id is truth, the visible name is a
 *  cache for search/label (the P9 carve). Both save paths (the board card and the
 *  bit workspace) extract through this ONE helper so they can never drift. Deduped. */
export function extractRefIds(html: string): string[] {
  const ids = new Set<string>();
  const re = /data-ref="([^"]+)"/g;
  let m: RegExpExecArray | null;
  while ((m = re.exec(html)) !== null) ids.add(m[1]);
  return [...ids];
}

/** Reconcile a note's outgoing references to match the chips now in its body —
 *  insert the new, delete the removed, and SKIP ids whose bit no longer exists (the
 *  FK rejects a dangling target; a chip may be left pointing at a destroyed bit).
 *  Called AFTER the body is saved (two writes; a failed reconcile self-heals via
 *  reconcile-on-read + the note's next save — plan risk 1). Idempotent / no-op-safe. */
export async function reconcileReferences(
  supabase: SupabaseClient,
  fromBitId: string,
  toBitIds: string[],
): Promise<void> {
  // App-guard (the one write door): only a TEXT bit originates a tie. Belt-and-
  // suspenders — bodies are text-bit-only, so this never fires in normal use, but it
  // makes "from must be text" real where the DB deliberately won't (migration NOTE).
  const src = await supabase.from("bit").select("type").eq("id", fromBitId).maybeSingle();
  if (src.error) throw src.error;
  if (!src.data) return; // source bit gone → nothing to reconcile
  if (src.data.type !== "text") {
    throw new Error("only a text bit can gather (reference source must be text)");
  }

  const wanted = new Set(toBitIds.filter((id) => id && id !== fromBitId)); // never self

  const ex = await supabase
    .from("reference")
    .select("id, to_bit_id")
    .eq("from_bit_id", fromBitId);
  if (ex.error) throw ex.error;

  const have = new Map<string, string>(); // to_bit_id → row id
  for (const r of ex.data ?? []) have.set(r.to_bit_id as string, r.id as string);

  // Drop rows whose chip left the body.
  const stale = [...have].filter(([toId]) => !wanted.has(toId)).map(([, rowId]) => rowId);
  if (stale.length) {
    const del = await supabase.from("reference").delete().in("id", stale);
    if (del.error) throw del.error;
  }

  // Add new ties, one at a time so a single dead target can't sink the batch.
  for (const toId of wanted) {
    if (have.has(toId)) continue;
    const ins = await supabase
      .from("reference")
      .insert({ from_bit_id: fromBitId, to_bit_id: toId });
    if (ins.error) {
      // 23503 = FK violation → the target bit was destroyed; skip it (as designed).
      // 23505 = (from,to) already exists → a race/double-save; already correct.
      if (ins.error.code === "23503" || ins.error.code === "23505") continue;
      throw ins.error;
    }
  }
}

export type BitHit = {
  id: string;
  face: string;
  type: string;
  // The bit's own words, so the picker searches full text like every other box
  // (the owner's ruling, 2026-08-28) instead of only the face.
  // Enough to draw a thumbnail in the organized picker (and the media chip): an
  // image's object path (sign at read time) or a drawing's vectors. Null on a text
  // bit — it shows by its words, not a picture.
  thumbPath: string | null;
  storagePath: string | null;
  strokes: Stroke[] | null;
};

/** The `[[` picker's candidates — recent LIVE bits (newest first), each with its
 *  face for the label + type for the section, plus a thumb path / strokes so a
 *  picture identifies a doodle or screenshot by sight (the organized picker). The
 *  picker filters this list client-side through lib/search-query — the one match rule
 *  (full text, partial words), the house pattern (source-picker/tag-bar) and the
 *  best as-you-type feel at one writer's scale; a server-side search is the later
 *  add when the pile grows past this cap. Excludes
 *  `excludeId` (you can't gather the note you're writing) and trashed bits. Existing
 *  bits only — v1 doesn't create from `[[`. */
export async function listGatherCandidates(
  supabase: SupabaseClient,
  excludeId?: string,
  limit = 200,
): Promise<BitHit[]> {
  let query = supabase
    .from("bit")
    .select("id, face, type, thumb_path, storage_path, strokes")
    .eq("state", "live")
    .order("created_at", { ascending: false })
    .limit(limit);
  if (excludeId) query = query.neq("id", excludeId);
  const { data, error } = await query;
  if (error) throw error;
  return (data ?? []).map((b) => ({
    id: b.id as string,
    face: (b.face as string | null) ?? "",
    type: b.type as string,
    thumbPath: (b.thumb_path as string | null) ?? null,
    storagePath: (b.storage_path as string | null) ?? null,
    strokes: (b.strokes as Stroke[] | null) ?? null,
  }));
}

export type GatheredIntoRow = {
  bitId: string; // the gathering thought
  face: string | null;
  type: string;
  gatheredAt: string; // the reference row's created_at — when the tie was made
};

/** "Gathered into" — the backward half (plan v1.2): every LIVE thought whose
 *  writing `[[`-gathered this bit. Trashed gatherers are excluded by the render
 *  rule (hidden everywhere); the tie itself survives in the row, so restoring
 *  the thought brings its entry back for free. Newest tie first. */
export async function listGatheredInto(
  supabase: SupabaseClient,
  bitId: string,
): Promise<GatheredIntoRow[]> {
  const { data, error } = await supabase
    .from("reference")
    .select("created_at, gatherer:from_bit_id(id, face, type, state)")
    .eq("to_bit_id", bitId)
    .order("created_at", { ascending: false });
  if (error) throw error;
  type Row = {
    created_at: string;
    gatherer: { id: string; face: string | null; type: string; state: string } | null;
  };
  return ((data ?? []) as unknown as Row[])
    .filter((r) => r.gatherer && r.gatherer.state === "live")
    .map((r) => ({
      bitId: r.gatherer!.id,
      face: r.gatherer!.face,
      type: r.gatherer!.type,
      gatheredAt: r.created_at,
    }));
}

export type RefTargetRow = {
  type: string;
  content: string | null;
  body: string | null;
  thumb_path: string | null;
  storage_path: string | null;
  strokes: Stroke[] | null;
  face: string | null;
  state: string;
};

/** The target bit behind a gather chip — read once by the chip's inline thumbnail +
 *  peek (bit-ref-view). This is the db door for that read; signing the image and
 *  normalizing the drawing stay in the view (storage/render concerns). Null if the id
 *  doesn't resolve. */
export async function getRefTarget(
  supabase: SupabaseClient,
  bitId: string,
): Promise<RefTargetRow | null> {
  const { data, error } = await supabase
    .from("bit")
    .select("type, content, body, thumb_path, storage_path, strokes, face, state")
    .eq("id", bitId)
    .maybeSingle();
  if (error) throw error;
  return (data as RefTargetRow | null) ?? null;
}
