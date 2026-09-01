import { createClient } from "@/lib/supabase/server";
import { listBoards } from "@/lib/db/boards";
import { listGroups } from "@/lib/db/shelf";
import { listNotes } from "@/lib/db/bits";
import { listRecentOpenings } from "@/lib/db/openings";
import { toSurfaces } from "@/lib/surfaces";
import { recentSurfaces } from "@/lib/recent";
import { DeskAlive } from "./desk-alive";
import { WhereYouWere } from "./where-you-were";
import { HomeSurfaces } from "./home-surfaces";

export const dynamic = "force-dynamic";

// HOME = your surfaces (S2): what's ALIVE on top (the desk), then ALL your surfaces —
// boards + notes as one list (kind tabs · folders ⇄ flat · sort · name-jump). Bits stay
// their own room. The spatial desk is a later phase; this is the linear home.
export default async function Home() {
  const supabase = await createClient();
  // Independent reads in parallel (R4.20) — three sequential round-trips were pure TTFB cost.
  const [boards, groups, notes, openings] = await Promise.all([
    listBoards(supabase),
    listGroups(supabase),
    listNotes(supabase),
    // The trail is DECORATION; the surfaces are the page. So a failed read here —
    // a migration not yet applied, an RLS slip — degrades to "no trail" instead of
    // taking down the landing page. Logged, never swallowed: the db module still
    // throws (that's its job), and this is the one place that knows the read is
    // inessential. The other three reads have no such catch — if those fail, home
    // genuinely has nothing to show and should say so.
    listRecentOpenings(supabase).catch((e) => {
      console.error("where you were: could not read openings —", e);
      return [];
    }),
  ]);

  const surfaces = toSurfaces(boards, notes);
  const alive = surfaces
    .filter((s) => s.pinned_at)
    .sort((a, z) => (z.pinned_at ?? "").localeCompare(a.pinned_at ?? ""));
  // "where you were" resolves against the surfaces already loaded — no second
  // read, and trashed/archived targets fall out for free (lib/recent.ts).
  const recent = recentSurfaces(openings, surfaces);

  return (
    <main className="home-main">
      <DeskAlive alive={alive} />
      <WhereYouWere recent={recent} />
      <HomeSurfaces surfaces={surfaces} groups={groups} deskEmpty={alive.length === 0} />
    </main>
  );
}
