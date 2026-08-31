import { createClient } from "@/lib/supabase/server";
import { listAllBits } from "@/lib/db/inbox";
import { listBoards } from "@/lib/db/boards";
import { listGroups } from "@/lib/db/shelf";
import { signThumbs } from "@/lib/storage";
import { Intake } from "./intake";
import { NotesBrowser } from "./notes-browser";

export const dynamic = "force-dynamic";

// The bit-first landing (organize plan O2): lands on the LOOSE pile (the old
// page, unchanged), one tab from ALL bits — search, type filters, sorts. One
// fetch (listAllBits — the loose pile is its boards-empty subset, F19).
export default async function NotesPage({
  searchParams,
}: {
  searchParams: Promise<{ view?: string }>;
}) {
  const { view } = await searchParams;
  const supabase = await createClient();
  // Fragments only (D-118 division, owner-ruled 2026-08-26): written NOTES live
  // in /notes, not here. A bit is a fragment that lives loose or on a board; a
  // note is a document. (The board side-panel still lists notes so they stay
  // placeable — that boundary is a separate open ruling.)
  const bits = (await listAllBits(supabase)).filter((b) => b.kind === "bit");
  const boards = (await listBoards(supabase)).map((b) => ({ id: b.id, title: b.title }));
  const groups = await listGroups(supabase);

  // Resolve display images (thumb preferred). Whole-set signing is fine at
  // one-writer scale; revisit with A22 if the collection outgrows it.
  const imgs = await signThumbs(supabase, bits);

  return (
    <main className="mx-auto max-w-5xl px-6 py-10">
      <header className="mb-6 flex items-baseline justify-between">
        <span className="text-sm font-semibold">bits</span>
      </header>

      <p className="mb-4 text-sm text-neutral-500">
        Your bits — every fragment you&rsquo;ve caught. Loose ones wait here; placed ones live on boards.
      </p>

      {/* Intake: jot a note with an optional source + tags; each add makes a loose
          text bit and the box fully resets. Full editing → the workspace. */}
      <Intake />

      <NotesBrowser
        items={bits}
        imgs={imgs}
        boards={boards}
        groups={groups}
        initialView={view === "all" ? "all" : "loose"}
      />
    </main>
  );
}
