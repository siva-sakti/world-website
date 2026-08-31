import { createClient } from "@/lib/supabase/server";
import { listBoards } from "@/lib/db/boards";
import { listGroups } from "@/lib/db/shelf";
import type { Bit } from "@/lib/types";
import { Desk } from "./desk";

export const dynamic = "force-dynamic";

// HOME = THE DESK (V3, mock B): only what's ALIVE + folders. The cabinet rail
// comes from the AppShell (V4 — everywhere); completeness lives there.
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

  return (
    <main className="home-main">
      <Desk boards={boards} notes={notes} groups={groups} />
    </main>
  );
}
