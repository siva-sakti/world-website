import type { SupabaseClient } from "@supabase/supabase-js";

// OPENINGS — where you were (plan `recent-section-plan.md`, migration
// 20260903000001). An `opening` is the owner's ruled act: you OPENED a board or a
// note. Home reads the newest few and shows them as "where you were".
// One-door module: nothing else writes this table.

export type Opening = {
  board_id: string | null;
  bit_id: string | null;
  opened_at: string;
};

/** Record that the owner opened a surface. Idempotent: one row per thing, its
 *  timestamp moved forward — so a re-open reorders the trail instead of piling up.
 *
 *  TWO THINGS HERE ARE LOAD-BEARING, both proven in `verification/opening-proofs.sql`
 *  after an antagonist caught them as fatal, silent defects in the plan:
 *
 *  1. `onConflict` names PLAIN unique constraints. PostgREST emits bare column
 *     names with no index predicate, so ON CONFLICT can never infer a PARTIAL
 *     index — the earlier design would have thrown 42P10 on every open, into the
 *     caller's catch, forever (proof 3).
 *  2. `opened_at` is SENT, never left to the column default. A default fires on
 *     INSERT only, so omitting it freezes the row at its first-ever visit and the
 *     trail can never reorder — the whole feature (proofs 4 and 5). */
export async function recordOpening(
  supabase: SupabaseClient,
  target: { kind: "board" | "note"; id: string },
): Promise<void> {
  const opened_at = new Date().toISOString();
  const { error } = await supabase.from("opening").upsert(
    target.kind === "board"
      ? { board_id: target.id, opened_at }
      : { bit_id: target.id, opened_at },
    { onConflict: target.kind === "board" ? "owner_id,board_id" : "owner_id,bit_id" },
  );
  if (error) throw error;
}

/** The owner's newest openings (RLS scopes them). Ids + a timestamp only — home
 *  already holds every surface, so the titles are joined in memory, never here
 *  (derive, don't duplicate: `recentSurfaces` in lib/recent.ts).
 *
 *  The default 30 is deliberately larger than the 5 shown: openings whose target
 *  is trashed or archived are dropped AFTER the fetch, so a raw limit of 5 could
 *  render one row. Well under any paging cap. */
export async function listRecentOpenings(
  supabase: SupabaseClient,
  limit = 30,
): Promise<Opening[]> {
  const { data, error } = await supabase
    .from("opening")
    .select("board_id, bit_id, opened_at")
    .order("opened_at", { ascending: false })
    .limit(limit);
  if (error) throw error;
  return (data ?? []) as Opening[];
}
