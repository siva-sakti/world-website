import type { SupabaseClient } from "@supabase/supabase-js";

// Source (§2–3) — provenance, the fourth vocabulary citizen. A source is a NAME
// (a book, a site, an author) + an OPTIONAL url, stored once and referenced by id
// (P9). Single-valued: a bit has ONE source (bit.source_id), so — unlike tags —
// there is no join table. The name is created on first use, case-insensitively
// (the vocabulary family's rule, the source_name_ci index). Owner scoping is RLS —
// no uid in queries. Mirrors lib/db/tags.ts, single-valued.

export type Source = { id: string; name: string; url: string | null };

/** Every source, newest first — the picker's menu (and later the reading list). */
export async function listSources(supabase: SupabaseClient): Promise<Source[]> {
  const { data, error } = await supabase
    .from("source")
    .select("id, name, url")
    .order("created_at", { ascending: false });
  if (error) throw error;
  return (data ?? []) as Source[];
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

  let source: Source;
  const ins = await supabase
    .from("source")
    .insert({ name: nm, url: url?.trim() || null })
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
export async function clearSource(supabase: SupabaseClient, bitId: string): Promise<void> {
  const { error } = await supabase.from("bit").update({ source_id: null }).eq("id", bitId);
  if (error) throw error;
}

/** Rename a source — free; every bit carrying it follows instantly (P9, id-referenced). */
export async function renameSource(
  supabase: SupabaseClient,
  sourceId: string,
  name: string,
): Promise<void> {
  const nm = name.trim();
  if (!nm) throw new Error("empty source name");
  const { error } = await supabase.from("source").update({ name: nm }).eq("id", sourceId);
  if (error) throw error;
}
