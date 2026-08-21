import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { listAllBits } from "@/lib/db/inbox";
import { listBoards } from "@/lib/db/boards";
import { signedUrl } from "@/lib/storage";
import { logout } from "@/app/login/actions";
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
  const bits = await listAllBits(supabase);
  const boards = (await listBoards(supabase)).map((b) => ({ id: b.id, title: b.title }));

  // Resolve display images (thumb preferred). Whole-set signing is fine at
  // one-writer scale; revisit with A22 if the collection outgrows it.
  const imgs: Record<string, string> = {};
  await Promise.all(
    bits.map(async (b) => {
      if (b.type !== "image") return;
      const path = b.thumb_path ?? b.storage_path;
      if (!path) return;
      try {
        imgs[b.id] = await signedUrl(supabase, path);
      } catch {
        /* skip */
      }
    }),
  );

  return (
    <main className="mx-auto max-w-5xl px-6 py-10">
      <header className="mb-6 flex items-baseline justify-between">
        <div className="flex items-baseline gap-5 text-sm">
          <Link href="/" className="underline underline-offset-4 hover:no-underline">← boards</Link>
          <span className="font-semibold">notes</span>
          <Link href="/find" className="text-neutral-500 underline underline-offset-4 hover:no-underline">find</Link>
          <Link href="/tags" className="text-neutral-500 underline underline-offset-4 hover:no-underline">tags</Link>
          <Link href="/sources" className="text-neutral-500 underline underline-offset-4 hover:no-underline">sources</Link>
        </div>
        <form action={logout}>
          <button className="text-sm text-neutral-500 underline underline-offset-4 hover:no-underline">sign out</button>
        </form>
      </header>

      <p className="mb-4 text-sm text-neutral-500">
        Your notes — land here loose, get placed on boards, or just live here.
      </p>

      {/* Intake: jot a note with an optional source + tags; each add makes a loose
          text bit and the box fully resets. Full editing → the workspace. */}
      <Intake />

      <NotesBrowser
        items={bits}
        imgs={imgs}
        boards={boards}
        initialView={view === "all" ? "all" : "loose"}
      />
    </main>
  );
}
