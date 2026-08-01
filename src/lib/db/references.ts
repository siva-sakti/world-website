import type { SupabaseClient } from "@supabase/supabase-js";

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

export type BitHit = { id: string; face: string; type: string };

/** The `[[` picker's candidates — recent LIVE bits (newest first), each with its
 *  face for the label + type for a glyph. The picker filters this list client-side
 *  by substring as you type (the house pattern — source-picker/tag-bar — best
 *  as-you-type feel at one writer's scale; server-side body search is a later add
 *  when the pile grows). Excludes `excludeId` (you can't gather the note you're
 *  writing) and trashed bits. Existing bits only — v1 doesn't create from `[[`. */
export async function listGatherCandidates(
  supabase: SupabaseClient,
  excludeId?: string,
  limit = 200,
): Promise<BitHit[]> {
  let query = supabase
    .from("bit")
    .select("id, face, type")
    .is("deleted_at", null)
    .order("created_at", { ascending: false })
    .limit(limit);
  if (excludeId) query = query.neq("id", excludeId);
  const { data, error } = await query;
  if (error) throw error;
  return (data ?? []).map((b) => ({
    id: b.id as string,
    face: (b.face as string | null) ?? "",
    type: b.type as string,
  }));
}

export type GatheredInto = { fromBitId: string; face: string };

/** "Gathered into" — every LIVE note that gathered this bit, newest first, each with
 *  its current face for the label (G-F4, the backward payoff read). Trashed sources
 *  are hidden, like everywhere. Two queries + a JS join — the house shape (there's no
 *  reference-face view; mirrors listManagedSources). Safe to run defensively on a
 *  bit's page (reconcile-on-read, G-F7). */
export async function listGatheredInto(
  supabase: SupabaseClient,
  bitId: string,
): Promise<GatheredInto[]> {
  const refs = await supabase
    .from("reference")
    .select("from_bit_id, created_at")
    .eq("to_bit_id", bitId)
    .order("created_at", { ascending: false });
  if (refs.error) throw refs.error;
  const rows = refs.data ?? [];
  if (rows.length === 0) return [];

  const fromIds = [...new Set(rows.map((r) => r.from_bit_id as string))];
  const bits = await supabase.from("bit").select("id, face, deleted_at").in("id", fromIds);
  if (bits.error) throw bits.error;

  const liveFace = new Map<string, string>();
  for (const b of bits.data ?? []) {
    if (!b.deleted_at) liveFace.set(b.id as string, (b.face as string | null) ?? "");
  }

  const out: GatheredInto[] = [];
  const seen = new Set<string>();
  for (const r of rows) {
    // rows are already newest-first; dedupe a target mentioned twice, drop trashed sources
    const id = r.from_bit_id as string;
    if (seen.has(id) || !liveFace.has(id)) continue;
    seen.add(id);
    out.push({ fromBitId: id, face: liveFace.get(id)! });
  }
  return out;
}
