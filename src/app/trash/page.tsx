import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { listTrash } from "@/lib/db/boards";
import { boardLabel } from "@/lib/labels";
import { restoreBitAction, restoreBoardAction } from "@/app/actions";
import { logout } from "@/app/login/actions";

export const dynamic = "force-dynamic";

export default async function TrashPage() {
  const supabase = await createClient();
  const items = await listTrash(supabase);

  return (
    <main className="mx-auto max-w-2xl px-6 py-10">
      <header className="mb-6 flex items-baseline justify-between text-sm">
        <div className="flex items-baseline gap-5">
          <Link href="/" className="underline underline-offset-4 hover:no-underline">
            ← boards
          </Link>
          <Link href="/find" className="text-neutral-500 underline underline-offset-4 hover:no-underline">
            find
          </Link>
          <span className="font-semibold">trash</span>
        </div>
        <form action={logout}>
          <button className="text-neutral-500 underline underline-offset-4 hover:no-underline">
            sign out
          </button>
        </form>
      </header>

      <p className="mb-6 text-sm text-neutral-500">
        Trashed things are hidden everywhere but not gone — restore any of them. (Permanently
        emptying the trash comes later, on purpose — nothing is destroyed here.)
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
              <form action={it.thing === "board" ? restoreBoardAction : restoreBitAction}>
                <input type="hidden" name="id" value={it.id} />
                <button className="text-sm underline underline-offset-4 hover:no-underline">
                  restore
                </button>
              </form>
            </li>
          ))}
        </ul>
      )}
    </main>
  );
}
