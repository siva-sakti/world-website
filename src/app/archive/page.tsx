import { createClient } from "@/lib/supabase/server";
import { listArchive } from "@/lib/db/resting";
import { boardLabel } from "@/lib/labels";
import { UnarchiveButton } from "./archive-controls";

export const dynamic = "force-dynamic";

// THE ARCHIVE — things you've set aside to cut clutter (a whole board or note you're
// done with for now). Hidden from your world but fully kept; un-archive and they
// return exactly where they were. Trash's twin, minus the destroy — archive never
// deletes, so there is no empty/destroy here.
export default async function ArchivePage() {
  const supabase = await createClient();
  const items = await listArchive(supabase);

  return (
    <main className="mx-auto max-w-2xl px-6 py-10">
      <header className="mb-6 flex items-baseline justify-between">
        <span className="text-sm font-semibold">archive</span>
      </header>

      <p className="mb-6 text-sm text-neutral-500">
        Set aside to cut clutter — hidden from your world but kept. Un-archive any of them and
        they return exactly where they were. (Nothing here is ever deleted.)
      </p>

      {items.length === 0 ? (
        <p className="text-neutral-500">Nothing archived.</p>
      ) : (
        <ul className="divide-y divide-neutral-100">
          {items.map((it) => (
            <li key={`${it.thing}-${it.id}`} className="flex items-baseline justify-between gap-4 py-3">
              <span className={it.label ? "" : "italic text-neutral-500"}>
                {it.thing === "board" ? boardLabel(it.label) : it.label || "a note"}
                <span className="ml-2 text-xs text-neutral-400">{it.thing}</span>
              </span>
              <UnarchiveButton thing={it.thing} id={it.id} />
            </li>
          ))}
        </ul>
      )}
    </main>
  );
}
