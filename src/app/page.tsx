import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { listBoards } from "@/lib/db/boards";
import { listGroups } from "@/lib/db/shelf";
import type { Bit } from "@/lib/types";
import { newBoard } from "./actions";
import { logout } from "./login/actions";
import { Desk } from "./desk";

export const dynamic = "force-dynamic";

// HOME = THE DESK + THE CABINET (V3, mock B — the owner's pick, D-118):
// the rail holds everything (create-acts · the complete lists · lenses ·
// housekeeping); the main area holds only what's ALIVE + folders. Curation
// here, completeness in the cabinet.
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
    <div className="home-shell">
      <nav className="rail">
        <div className="rail-brand">world</div>
        <Link href="/write" className="rail-link">✎ write</Link>
        <form action={newBoard}>
          <button className="rail-link rail-btn">+ new board</button>
        </form>
        <div className="rail-sec">everything</div>
        <Link href="/boards" className="rail-link">all boards</Link>
        <Link href="/notes" className="rail-link">all notes</Link>
        <Link href="/bits" className="rail-link">bits</Link>
        <div className="rail-sec">lenses</div>
        <Link href="/find" className="rail-link">find</Link>
        <Link href="/graph" className="rail-link">graph</Link>
        <Link href="/tags" className="rail-link">tags</Link>
        <div className="rail-foot">
          <Link href="/sources" className="rail-link">sources</Link>
          <Link href="/trash" className="rail-link">trash</Link>
          <a href="/api/export" className="rail-link" title="Download all your data">export</a>
          <form action={logout}>
            <button className="rail-link rail-btn">sign out</button>
          </form>
        </div>
      </nav>
      <main className="home-main">
        <Desk boards={boards} notes={notes} groups={groups} />
      </main>
    </div>
  );
}
