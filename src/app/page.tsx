import { createClient } from "@/lib/supabase/server";
import { listBoards } from "@/lib/db/boards";
import { listGroups } from "@/lib/db/shelf";
import type { Bit } from "@/lib/types";
import { toSurfaces } from "@/lib/surfaces";
import { DeskAlive } from "./desk-alive";
import { HomeSurfaces } from "./home-surfaces";

export const dynamic = "force-dynamic";

// HOME = your surfaces (S2): what's ALIVE on top (the desk), then ALL your surfaces —
// boards + notes as one list (kind tabs · folders ⇄ flat · sort · name-jump). Bits stay
// their own room. The spatial desk is a later phase; this is the linear home.
export default async function Home() {
  const supabase = await createClient();
  const boards = await listBoards(supabase);
  const groups = await listGroups(supabase);
  const { data: noteRows, error } = await supabase
    .from("bit")
    .select("*")
    .eq("kind", "note")
    .is("deleted_at", null)
    .order("updated_at", { ascending: false });
  if (error) throw error;
  const notes = (noteRows ?? []) as Bit[];

  const surfaces = toSurfaces(boards, notes);
  const alive = surfaces
    .filter((s) => s.pinned_at)
    .sort((a, z) => (z.pinned_at ?? "").localeCompare(a.pinned_at ?? ""));

  return (
    <main className="home-main">
      <DeskAlive alive={alive} />
      <HomeSurfaces surfaces={surfaces} groups={groups} deskEmpty={alive.length === 0} />
    </main>
  );
}
