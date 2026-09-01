import type { SupabaseClient } from "@supabase/supabase-js";

// Source (§2–3) — provenance, the fourth vocabulary citizen. A source is a NAME
// (a book, a site, an author) + an OPTIONAL url, stored once and referenced by id
// (P9). Single-valued: a bit has ONE source (bit.source_id), so — unlike tags —
// there is no join table. The name is created on first use, case-insensitively
// (the vocabulary family's rule, the source_name_ci index). Owner scoping is RLS —
// no uid in queries. Mirrors lib/db/tags.ts, single-valued.

export type Source = { id: string; name: string; url: string | null };

/** A storable source url, or null. Only http(s) is a source link — anything else
 * (javascript:, data:, a stray word) is dropped at this ONE write door, which
 * guards every render site that puts source.url into an href. */
function sanitizeUrl(raw?: string | null): string | null {
  const t = (raw ?? "").trim();
  if (!t) return null;
  try {
    const u = new URL(t);
    return u.protocol === "http:" || u.protocol === "https:" ? t : null;
  } catch {
    return null;
  }
}

/** Every source, newest first — the picker's menu (and later the reading list). */
export async function listSources(supabase: SupabaseClient): Promise<Source[]> {
  const { data, error } = await supabase
    .from("source")
    .select("id, name, url")
    .order("created_at", { ascending: false });
  if (error) throw error;
  return (data ?? []) as Source[];
}

/** One source by id — the source view's heading (name + optional url). */
export async function getSource(
  supabase: SupabaseClient,
  id: string,
): Promise<Source | null> {
  const { data, error } = await supabase
    .from("source")
    .select("id, name, url")
    .eq("id", id)
    .maybeSingle();
  if (error) throw error;
  return (data as Source | null) ?? null;
}

/** The source currently on a bit — null if it carries none. */
export async function getBitSource(
  supabase: SupabaseClient,
  bitId: string,
): Promise<Source | null> {
  const { data, error } = await supabase
    .from("bit")
    .select("source(id, name, url)")
    .eq("id", bitId)
    .maybeSingle();
  if (error) throw error;
  const raw = (data as unknown as { source: Source | Source[] | null } | null)?.source ?? null;
  return Array.isArray(raw) ? raw[0] ?? null : raw;
}

/** Pick-or-create a source by name (case-insensitive, like tags), then set it as
 *  the bit's single source. `url` is stored only when the source is newly created —
 *  a source is one named thing; re-URLing an existing one is a deliberate edit,
 *  not a side effect of picking (I-Src). Returns the source. */
export async function setSource(
  supabase: SupabaseClient,
  bitId: string,
  name: string,
  url?: string | null,
): Promise<Source> {
  const nm = name.trim();
  if (!nm) throw new Error("empty source name");

  const cleanUrl = sanitizeUrl(url);
  let source: Source;
  const ins = await supabase
    .from("source")
    .insert({ name: nm, url: cleanUrl })
    .select("id, name, url")
    .single();
  if (ins.error) {
    if (ins.error.code === "23505") {
      // Existing name (CI-unique index). Escape LIKE metacharacters so a name with
      // % or _ matches literally, not as a wildcard (mirrors applyTag).
      const pat = nm.replace(/[\\%_]/g, (m) => "\\" + m);
      const sel = await supabase
        .from("source")
        .select("id, name, url")
        .ilike("name", pat)
        .limit(1)
        .single();
      if (sel.error) throw sel.error;
      source = sel.data as Source;
      // Back-fill: the caller brought a url and the existing same-named source has
      // NONE — record it (a gained fact, not an overwrite). A CONFLICTING url is
      // never silently replaced (I-Src3: re-URLing is a deliberate edit); surfacing
      // that collision to the owner is a queued follow-up.
      if (cleanUrl && !source.url) {
        const fill = await supabase
          .from("source")
          .update({ url: cleanUrl })
          .eq("id", source.id)
          .select("id, name, url")
          .single();
        if (!fill.error) source = fill.data as Source;
      }
    } else {
      throw ins.error;
    }
  } else {
    source = ins.data as Source;
  }

  const upd = await supabase.from("bit").update({ source_id: source.id }).eq("id", bitId);
  if (upd.error) throw upd.error;
  return source;
}

/** Clear a bit's source — the bit survives, it just loses the stamp (§6). */
/** Undo's narrow source door (undo plan §6): ONE update by id — no find-or-create,
 *  no url back-fill — so a reverse is exactly what it claims. `setSource` (by name)
 *  is not a clean inverse: it can re-create a deleted source and back-fill its url.
 *  A prior source deleted meanwhile FK-refuses; the entry stays retryable — narrow,
 *  named, accepted (sources are rarely deleted). Public-signature addition, flagged
 *  in the plan per the house rule. */
export async function setBitSourceId(
  supabase: SupabaseClient,
  bitId: string,
  sourceId: string | null,
): Promise<void> {
  const { data, error } = await supabase
    .from("bit")
    .update({ source_id: sourceId })
    .eq("id", bitId)
    .select("id");
  if (error) throw error;
  if (!data?.length) throw new Error("that bit no longer exists");
}

export async function clearSource(supabase: SupabaseClient, bitId: string): Promise<void> {
  const { error } = await supabase.from("bit").update({ source_id: null }).eq("id", bitId);
  if (error) throw error;
}

// ---- the sources-list / reading list (§5c) ----

/** A source with its carrier counts — live bits AND frozen (trashed) ones. The
 *  trash count exists so destructive confirms can state their FULL loss (I-T2):
 *  merge/delete reach frozen carriers too, and the confirm must say so. */
export type ManagedSource = {
  id: string; name: string; url: string | null;
  count: number; // live carriers
  trash: number; // frozen carriers — reached by merge/delete all the same
};

/** Every source with how many bits carry it — your reading list, most-used first.
 *  There's no source_counts view (that'd be a migration), so the tally happens here
 *  over ALL carriers, split live/trash (mirrors tag_counts' world+trash — I-T2).
 *  Sources arrive newest-first; a stable sort by live count keeps that tiebreak. */
export async function listManagedSources(
  supabase: SupabaseClient,
): Promise<ManagedSource[]> {
  const [srcRes, bitRes] = await Promise.all([
    supabase.from("source").select("id, name, url").order("created_at", { ascending: false }),
    supabase.from("bit").select("source_id, deleted_at").not("source_id", "is", null),
  ]);
  if (srcRes.error) throw srcRes.error;
  if (bitRes.error) throw bitRes.error;

  const live = new Map<string, number>();
  const frozen = new Map<string, number>();
  for (const r of bitRes.data ?? []) {
    const id = r.source_id as string;
    const m = r.deleted_at ? frozen : live;
    m.set(id, (m.get(id) ?? 0) + 1);
  }
  return (srcRes.data ?? [])
    .map((s) => ({
      id: s.id as string,
      name: s.name as string,
      url: (s.url as string | null) ?? null,
      count: live.get(s.id as string) ?? 0,
      trash: frozen.get(s.id as string) ?? 0,
    }))
    .sort((a, b) => b.count - a.count);
}

// ---- the source manager (§3e, mirrors the tag manager) ----

/** Edit a source — rename and/or (re)set its url in one update. Name non-empty;
 *  a case-insensitive collision with ANOTHER source is refused (23505 from the
 *  source_name_ci index), surfaced to the caller like a tag rename. An empty url
 *  stores null. Id-referenced, so every bit carrying it re-labels instantly
 *  (P9, I-Src3 — a deliberate rename, never a machine re-read). */
export async function editSource(
  supabase: SupabaseClient,
  id: string,
  name: string,
  url?: string | null,
): Promise<void> {
  const nm = name.trim();
  if (!nm) throw new Error("empty source name");
  const clean = sanitizeUrl(url);
  // A deliberate edit typing something that ISN'T a web address is refused loudly
  // (silently nulling it would look like a successful save).
  if ((url ?? "").trim() && !clean) throw new Error("that link isn't a web address");
  const { error } = await supabase
    .from("source")
    .update({ name: nm, url: clean })
    .eq("id", id);
  if (error) throw error;
}

/** Merge `from` into `into` — every bit stamped `from` is re-stamped `into`
 *  (a bit carries one source, so nothing to dedupe), then `from` disappears. */
export async function mergeSources(
  supabase: SupabaseClient,
  fromId: string,
  intoId: string,
): Promise<void> {
  if (fromId === intoId) return;
  const upd = await supabase.from("bit").update({ source_id: intoId }).eq("source_id", fromId);
  if (upd.error) throw upd.error;
  const del = await supabase.from("source").delete().eq("id", fromId);
  if (del.error) throw del.error;
}

/** Delete a source — the FK's `on delete set null` blanks its bits' source_id
 *  (I-Src4): the notes survive, losing only the "from…" stamp, never the words. */
export async function deleteSource(supabase: SupabaseClient, id: string): Promise<void> {
  const { error } = await supabase.from("source").delete().eq("id", id);
  if (error) throw error;
}
