import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getBit, getBitBoards } from "@/lib/db/bits";
import { getBitSource } from "@/lib/db/sources";
import { listBoards } from "@/lib/db/boards";
import { listGatheredInto } from "@/lib/db/references";
import { fmt } from "@/lib/dates";
import { bitLabel, boardLabel } from "@/lib/labels";
import { TagBar } from "@/app/board/[id]/tag-bar";
import { SourcePicker } from "@/app/board/[id]/source-picker";
import { TextWorkspace } from "@/app/bit/[id]/text-workspace";
import { BitTitle, BitTrash } from "@/app/bit/[id]/bit-controls";
import { ArchiveButton } from "@/app/archive/archive-controls";
import { PinToggle } from "@/app/bits/note-card";
import { PlaceOnBoard } from "@/app/bits/place-on-board";

export const dynamic = "force-dynamic";

// THE NOTE SURFACE (N1): a note is a writing surface, a peer of a board — not a
// fragment's detail sheet. The writing is central; every action lives in the top
// bar, every read-mostly fact in the quiet footer — nothing in the writing.
// A note stays a `bit(kind='note')` underneath (the machinery is reused); this
// page just presents it as the surface it is. A non-note here → the bit page.
export default async function NotePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();

  const b = await getBit(supabase, id); // getBit already excludes trashed
  if (!b) notFound();
  if (b.kind !== "note") redirect(`/bit/${id}`); // fragments live on the bit page

  const [boards, source, gatheredInto, allBoards] = await Promise.all([
    getBitBoards(supabase, id),
    getBitSource(supabase, id),
    listGatheredInto(supabase, id),
    listBoards(supabase),
  ]);
  const otherBoards = allBoards
    .filter((bd) => !boards.some((cur) => cur.id === bd.id))
    .map((bd) => ({ id: bd.id, title: bd.title }));

  return (
    <main className="mx-auto max-w-2xl px-6 py-10">
      {/* Action bar — everything that ISN'T writing (owner: never in the writing). */}
      <div className="note-actions">
        <PinToggle bitId={b.id} pinned={Boolean(b.pinned_at)} />
        <PlaceOnBoard bitId={b.id} boards={otherBoards} />
        <span className="note-actions-spacer" />
        <ArchiveButton thing="bit" id={b.id} returnTo="/" />
        <BitTrash bitId={b.id} returnTo="/" />
      </div>

      {/* The surface — title + the writing, central, full-width. */}
      <BitTitle bitId={b.id} initial={b.content ?? ""} placeholder="title — optional" />
      <div className="page-editor mt-3">
        <TextWorkspace bitId={b.id} initialBody={b.body ?? "<p></p>"} />
      </div>

      {/* Quiet footer — the read-mostly facts + connections. */}
      <footer className="note-footer">
        <p className="note-footer-dates">
          {fmt(b.created_at)}
          {fmt(b.updated_at) !== fmt(b.created_at) && ` · edited ${fmt(b.updated_at)}`}
        </p>
        <div className="mt-3">
          <SourcePicker bitId={b.id} initial={source} />
        </div>
        <div className="mt-3">
          <TagBar target={{ bitId: b.id }} />
        </div>

        {gatheredInto.length > 0 && (
          <section className="mt-6">
            <h2 className="note-footer-h">gathered into</h2>
            <ul className="space-y-1 text-sm">
              {gatheredInto.map((g) => (
                <li key={g.bitId} className="flex items-baseline gap-3">
                  <Link href={`/bit/${g.bitId}`} className="underline underline-offset-4 hover:no-underline">
                    {bitLabel(g.type, g.face)}
                  </Link>
                  <span className="text-xs text-neutral-400">{fmt(g.gatheredAt)}</span>
                </li>
              ))}
            </ul>
          </section>
        )}

        {boards.length > 0 && (
          <section className="mt-6">
            <h2 className="note-footer-h">on these boards</h2>
            <ul className="space-y-1 text-sm">
              {boards.map((bd) => (
                <li key={bd.id}>
                  <Link href={`/board/${bd.id}`} className="underline underline-offset-4 hover:no-underline">
                    {boardLabel(bd.title)}
                  </Link>
                </li>
              ))}
            </ul>
          </section>
        )}
      </footer>
    </main>
  );
}
