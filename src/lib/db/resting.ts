import type { SupabaseClient } from "@supabase/supabase-js";

// The ONE resting-state mechanism (D-1xx). Trash and archive are twins — both set/
// clear a timestamp on a bit or board — so they share this setter; the named wrappers
// keep the call sites readable. Destroy stays its own act (a hard delete + storage).
// The `state` generated column derives live/archived/trashed from the two timestamps.

/** Set or clear a resting-state timestamp on a bit or board. **Trash wins:** trashing
 *  also clears `archived_at`, so a thing is in exactly ONE resting place — restore-from-
 *  trash returns it to *live*, not to archive (owner ruling, 2026-08-29).
 *
 *  THROWS when the update touches no row. Every resting act — put away, take back out,
 *  trash, restore, for bits AND boards — passes through here, so asserting once here is
 *  what stops any of them failing silently. Before this, 6 of the 9 paths ignored the
 *  count: putting a thing away from a stale page did nothing at all, with no error, and
 *  the screen simply re-rendered it still sitting there (owner-flagged, 2026-09-02).
 *  Zero rows means the thing is gone, or RLS refused — either way the act did not
 *  happen, and saying so is the house standard. */
export async function setResting(
  supabase: SupabaseClient,
  thing: "bit" | "board",
  id: string,
  column: "deleted_at" | "archived_at",
  on: boolean,
): Promise<void> {
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
  let q = supabase.from(thing).update(patch).eq("id", id);
  // THE CROSSFIRE GUARD (antagonist A1, owner-ruled 2026-09-03: "we should be able to get
  // trashed and then you can't archive it"): archive acts refuse a TRASHED row. Without
  // this, archive-from-a-stale-page after a trash on another device wrote BOTH timestamps
  // — the thing showed nowhere in the archive, and restore-from-trash then dropped it
  // into the archive instead of back to live (proven on a throwaway DB). The guard makes
  // the 0-row assert below fire instead — "reload", the house behavior. Applies to
  // un-archive too: a trashed thing already LEFT the archive (trash cleared archived_at),
  // so un-archiving it from a stale page is equally an act on a thing that's gone.
  // The DB CHECK twin (bit/board_trashed_archived_exclusive) makes the bad state
  // physically impossible; this guard makes the refusal LOUD.
  if (column === "archived_at") q = q.is("deleted_at", null);
  const { data, error } = await q.select("id");
  if (error) throw error;
  if (!data?.length) throw new Error(goneMessage(column, on));
}

/** The sentence a vanished thing gets. The two RESTORE wordings are the ones the
 *  restore paths already showed, kept verbatim. The put-away/trash wording drops the
 *  noun ("that note…" → "that…") because one sentence now serves bits AND boards, and
 *  "note" was wrong for a board — flagged for the owner's own words. */
function goneMessage(column: "deleted_at" | "archived_at", on: boolean): string {
  if (on) return "that no longer exists — reload";
  return column === "deleted_at"
    ? "that's no longer in the trash — it may have been destroyed"
    : "that's no longer in the archive — it may have been taken back out";
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
