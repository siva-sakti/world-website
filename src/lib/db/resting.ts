import type { SupabaseClient } from "@supabase/supabase-js";

// The ONE resting-state mechanism (D-1xx). Trash and archive are twins — both set/
// clear a timestamp on a bit or board — so they share this setter; the named wrappers
// keep the call sites readable. Destroy stays its own act (a hard delete + storage).
// The `state` generated column derives live/archived/trashed from the two timestamps.

/** Set or clear a resting-state timestamp on a bit or board. Returns the affected-row
 *  count so a caller can assert the thing still exists. **Trash wins:** trashing also
 *  clears `archived_at`, so a thing is in exactly ONE resting place — restore-from-trash
 *  returns it to *live*, not to archive (owner ruling, 2026-08-29). */
export async function setResting(
  supabase: SupabaseClient,
  thing: "bit" | "board",
  id: string,
  column: "deleted_at" | "archived_at",
  on: boolean,
): Promise<number> {
  const patch: Record<string, string | null> = {
    [column]: on ? new Date().toISOString() : null,
  };
  if (column === "deleted_at" && on) patch.archived_at = null; // mutual exclusion: trash wins
  // "Nothing is both alive-right-now and put away" — archiving clears the star, for bit
  // AND board, at the ONE door every archive path uses (review R2.6: the second door used
  // to keep it). App-enforced tonight; the DB CHECK (bit/board_archived_not_alive) is
  // written + proven and queued for the owner's cloud paste. Un-archiving does NOT
  // resurrect the star (the value was nulled here — deliberate).
  if (column === "archived_at" && on) patch.pinned_at = null;
  const { data, error } = await supabase.from(thing).update(patch).eq("id", id).select("id");
  if (error) throw error;
  return data?.length ?? 0;
}

/** Archive a thing — hide-but-keep, its own area, restorable; NEVER deletes. */
export const archiveBit = (s: SupabaseClient, id: string) => setResting(s, "bit", id, "archived_at", true);
export const unarchiveBit = (s: SupabaseClient, id: string) => setResting(s, "bit", id, "archived_at", false);
export const archiveBoard = (s: SupabaseClient, id: string) => setResting(s, "board", id, "archived_at", true);
export const unarchiveBoard = (s: SupabaseClient, id: string) => setResting(s, "board", id, "archived_at", false);

/** The archive listing — the archived things' one surface (mirrors listTrash). */
export type ArchiveItem = { thing: "bit" | "board"; id: string; label: string | null; archivedAt: string };
export async function listArchive(supabase: SupabaseClient): Promise<ArchiveItem[]> {
  const { data, error } = await supabase
    .from("archive_listing")
    .select("thing, thing_id, label, archived_at");
  if (error) throw error;
  return (data ?? []).map((r) => ({
    thing: r.thing as "bit" | "board",
    id: r.thing_id as string,
    label: (r.label as string | null) ?? null,
    archivedAt: r.archived_at as string,
  }));
}
