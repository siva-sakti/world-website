import { createClient } from "@/lib/supabase/server";
import { listTrash } from "@/lib/db/boards";
import { boardLabel } from "@/lib/labels";
import { restoreBitAction, restoreBoardAction } from "@/app/actions";
import { DestroyButton, EmptyTrashButton } from "./trash-controls";

export const dynamic = "force-dynamic";

export default async function TrashPage() {
  const supabase = await createClient();
  const items = await listTrash(supabase);

  return (
    <main className="mx-auto max-w-2xl px-6 py-10">
      <header className="mb-6 flex items-baseline justify-between">
        <span className="text-sm font-semibold">trash</span>
        {items.length > 0 && <EmptyTrashButton count={items.length} />}
      </header>

      <p className="mb-6 text-sm text-neutral-500">
        Trashed things are hidden everywhere but not gone — <strong>restore</strong> any of them, or{" "}
        <strong>destroy</strong> them for good. Destroying can&rsquo;t be undone.
      </p>

      {items.length === 0 ? (
        <p className="text-neutral-500">Nothing in the trash.</p>
      ) : (
        <ul className="divide-y divide-neutral-100">
          {items.map((it) => (
            <li key={`${it.thing}-${it.id}`} className="flex items-baseline justify-between gap-4 py-3">
              <span className={it.label ? "" : "italic text-neutral-500"}>
                {it.thing === "board" ? boardLabel(it.label) : it.label || "a note"}
                <span className="ml-2 text-xs text-neutral-400">{it.thing}</span>
              </span>
              <span className="flex flex-none items-baseline gap-4">
                <form action={it.thing === "board" ? restoreBoardAction : restoreBitAction}>
                  <input type="hidden" name="id" value={it.id} />
                  <button className="text-sm underline underline-offset-4 hover:no-underline">
                    restore
                  </button>
                </form>
                <DestroyButton
                  thing={it.thing}
                  id={it.id}
                  label={it.thing === "board" ? boardLabel(it.label) : it.label ?? ""}
                />
              </span>
            </li>
          ))}
        </ul>
      )}
    </main>
  );
}
