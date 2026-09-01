import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { listBoards } from "@/lib/db/boards";
import { listAllBits } from "@/lib/db/inbox";
import { listGroups, getGroup } from "@/lib/db/shelf";
import { signThumbs } from "@/lib/storage";
import { boardLabel } from "@/lib/labels";
import { GroupNotes } from "./group-notes";

export const dynamic = "force-dynamic";

// A folder, opened (O1b): everything shelved in this group — its boards AND its
// notes, together. The owner's original ask: folders cut across both, because
// both are assembled things.
export default async function GroupPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();

  const group = await getGroup(supabase, id);
  if (!group) notFound(); // existence gate first; the rest load in parallel

  const [boardsAll, allBitsAll, groups] = await Promise.all([
    listBoards(supabase),
    listAllBits(supabase),
    listGroups(supabase),
  ]);
  const boards = boardsAll.filter((b) => b.group_id === id);
  const bits = allBitsAll.filter((b) => b.group_id === id);
  const allBoards = boardsAll.map((b) => ({ id: b.id, title: b.title }));

  const imgs = await signThumbs(supabase, bits);

  return (
    <main className="mx-auto max-w-5xl px-6 py-10">
      <header className="mb-6 flex items-baseline justify-between">
        <span className="text-sm font-semibold">folder</span>
      </header>

      <h1 className="mt-1 text-2xl font-semibold tracking-tight">{group.name}</h1>

      <section className="mt-8">
        <h2 className="mb-2 text-xs uppercase tracking-wide text-neutral-400">boards</h2>
        {boards.length === 0 ? (
          <p className="text-sm text-neutral-500">No boards in this folder — shelve one from home.</p>
        ) : (
          <ul className="space-y-2 text-sm">
            {boards.map((b) => (
              <li key={b.id}>
                <Link href={`/board/${b.id}`} className="underline underline-offset-4 hover:no-underline">
                  {boardLabel(b.title)}
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="mt-8">
        <h2 className="mb-2 text-xs uppercase tracking-wide text-neutral-400">notes</h2>
        {bits.length === 0 ? (
          <p className="text-sm text-neutral-500">
            No notes in this folder — pick this folder on a note.
          </p>
        ) : (
          <GroupNotes items={bits} imgs={imgs} boards={allBoards} groups={groups} />
        )}
      </section>
    </main>
  );
}
