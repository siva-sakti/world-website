import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getBit, getBitBoards, getBitTravel } from "@/lib/db/bits";
import { getBitSource } from "@/lib/db/sources";
import { listGatheredInto } from "@/lib/db/references";
import { BitTitle, BitTrash } from "./bit-controls";
import { signedUrl } from "@/lib/storage";
import { normalizeDrawing, strokesBounds } from "@/lib/stroke";
import { bitLabel, boardLabel } from "@/lib/labels";
import { logout } from "@/app/login/actions";
import { DoodleBit } from "@/app/board/[id]/doodle-bit";
import { TagBar } from "@/app/board/[id]/tag-bar";
import { SourcePicker } from "@/app/board/[id]/source-picker";
import { TextWorkspace } from "./text-workspace";

export const dynamic = "force-dynamic";

function fmt(iso: string | null): string {
  if (!iso) return "";
  return new Date(iso).toLocaleDateString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

export default async function BitPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();

  const b = await getBit(supabase, id);
  if (!b) notFound();

  const [boards, travel, source, gatheredInto] = await Promise.all([
    getBitBoards(supabase, id),
    getBitTravel(supabase, id),
    getBitSource(supabase, id),
    listGatheredInto(supabase, id),
  ]);

  let imageUrl: string | undefined;
  if (b.type === "image" && b.storage_path) {
    try {
      imageUrl = await signedUrl(supabase, b.storage_path);
    } catch {
      imageUrl = undefined;
    }
  }
  const drawing = b.type === "drawing" ? normalizeDrawing(b.strokes) : null;
  const dBounds = drawing ? strokesBounds(drawing.strokes) : null;

  const heading = bitLabel(b.type, b.face);

  return (
    <main className="mx-auto max-w-2xl px-6 py-10">
      <header className="mb-8 flex items-baseline justify-between text-sm">
        <div className="flex items-baseline gap-5">
          <Link href="/find" className="underline underline-offset-4 hover:no-underline">
            ← find
          </Link>
          <Link href="/" className="text-neutral-500 underline underline-offset-4 hover:no-underline">
            boards
          </Link>
          <Link href="/inbox" className="text-neutral-500 underline underline-offset-4 hover:no-underline">
            inbox
          </Link>
        </div>
        <div className="flex items-baseline gap-5">
          <BitTrash bitId={b.id} />
          <form action={logout}>
            <button className="text-neutral-500 underline underline-offset-4 hover:no-underline">
              sign out
            </button>
          </form>
        </div>
      </header>

      {/* Type + the date stamps (created · updated) — quiet, always there. */}
      <p className="text-xs uppercase tracking-wide text-neutral-400">
        {b.type}
        <span className="ml-3 normal-case tracking-normal text-neutral-400">
          {fmt(b.created_at)}
          {fmt(b.updated_at) !== fmt(b.created_at) && ` · edited ${fmt(b.updated_at)}`}
        </span>
      </p>
      {/* The note's own words — editable here, the same field the board card edits
          (D-087): a text bit's optional title / a media bit's caption. */}
      {b.type === "text" ? (
        <div className="mt-1">
          <BitTitle bitId={b.id} initial={b.content ?? ""} placeholder="title — optional" />
        </div>
      ) : (
        <h1 className="mt-1 text-2xl font-semibold tracking-tight">{heading}</h1>
      )}

      {/* Source — the "from …" provenance, editable (single-select), near the
          heading; it travels with the bit (P8). Universal, so shown for any type. */}
      <div className="mt-3">
        <SourcePicker bitId={b.id} initial={source} />
      </div>

      {/* The bit itself — a workspace for text (editable rich text, rendered
          through the tiptap pipeline so links/chips render — finding #6); media
          stays read-only for now. Bookmark is retired (D-102), so no such branch.
          .page-editor = the comfortable document treatment (plan v1.2). */}
      <div className="mt-6">
        {b.type === "text" && (
          <div className="page-editor">
            <TextWorkspace bitId={b.id} initialBody={b.body ?? "<p></p>"} />
          </div>
        )}
        {b.type === "image" && imageUrl && (
          <img src={imageUrl} alt={b.content ?? ""} className="max-h-[60vh] rounded-md border border-neutral-200" />
        )}
        {drawing && dBounds && (
          <div
            className="rounded-md border border-neutral-200 bg-white p-3"
            style={{ width: 320, height: Math.max(60, (320 * Math.max(1, dBounds.maxY)) / Math.max(1, dBounds.maxX)) }}
          >
            <DoodleBit drawing={drawing} />
          </div>
        )}
        {b.type !== "text" && (
          <div className="mt-3">
            <BitTitle bitId={b.id} initial={b.content ?? ""} placeholder="add a few words — optional" />
          </div>
        )}
      </div>

      {/* Tags — editable (any bit, loose or placed — §3a, §7). */}
      <div className="mt-6">
        <TagBar target={{ bitId: b.id }} />
      </div>

      {/* Gathered into — the backward half of gather (plan v1.2): every live
          thought whose writing reached for this note. Plain links (a page list,
          not mid-writing — peek is the chip's gesture, not this one's). */}
      {gatheredInto.length > 0 && (
        <section className="mt-8">
          <h2 className="mb-2 text-xs uppercase tracking-wide text-neutral-400">gathered into</h2>
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

      {/* Boards it's on now */}
      <section className="mt-8">
        <h2 className="mb-2 text-xs uppercase tracking-wide text-neutral-400">on these boards</h2>
        {boards.length === 0 ? (
          <p className="text-sm text-neutral-500">Not on any board right now.</p>
        ) : (
          <ul className="space-y-1 text-sm">
            {boards.map((bd) => (
              <li key={bd.id}>
                <Link href={`/board/${bd.id}`} className="underline underline-offset-4 hover:no-underline">
                  {boardLabel(bd.title)}
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>

      {/* Travel */}
      <section className="mt-8">
        <h2 className="mb-2 text-xs uppercase tracking-wide text-neutral-400">travel</h2>
        <ul className="space-y-1 text-sm text-neutral-600">
          {travel.map((t, i) => (
            <li key={i}>
              <span className="text-neutral-800">{boardLabel(t.board_title)}</span>
              {" · arrived "}
              {fmt(t.arrived_at)}
              {t.left_at ? ` · left ${fmt(t.left_at)}` : " · here now"}
            </li>
          ))}
        </ul>
      </section>
    </main>
  );
}
