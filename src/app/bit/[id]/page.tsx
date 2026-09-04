import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getBit, getBitBoards, getBitTravel } from "@/lib/db/bits";
import { listBoards } from "@/lib/db/boards";
import { PlaceOnBoard } from "@/app/bits/place-on-board";
import { getBitSource } from "@/lib/db/sources";
import { listGroups } from "@/lib/db/shelf";
import { GroupPicker } from "@/components/shelf-controls";
import { listGatheredInto } from "@/lib/db/references";
import { BitTitle, BitTrash } from "./bit-controls";
import { ArchiveButton } from "@/app/archive/archive-controls";
import { DuplicateBit } from "./duplicate-button";
import { signedUrl } from "@/lib/storage";
import { normalizeDrawing, strokesBounds } from "@/lib/stroke";
import { bitLabel, boardLabel } from "@/lib/labels";
import { hostOf } from "@/lib/page-meta";
import { Stamp, MadeAndEdited } from "@/components/stamp";
import { DoodleBit } from "@/app/board/[id]/doodle-bit";
import { TagBar } from "@/app/board/[id]/tag-bar";
import { SourcePicker } from "@/app/board/[id]/source-picker";
import { TextWorkspace } from "./text-workspace";

export const dynamic = "force-dynamic";

export default async function BitPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();

  const b = await getBit(supabase, id);
  if (!b) notFound();
  if (b.kind === "note") redirect(`/note/${id}`); // a note is a surface — its own page (N1)

  const [boards, travel, source, gatheredInto, allBoards, groups] = await Promise.all([
    getBitBoards(supabase, id),
    getBitTravel(supabase, id),
    getBitSource(supabase, id),
    listGatheredInto(supabase, id),
    listBoards(supabase),
    listGroups(supabase),
  ]);
  // Boards it's NOT already on — the "place on a board…" door (board-side placement
  // stays too; both directions, the owner's ruling). callInBit revives a departed
  // leg rather than duplicating, so this is safe even for a board it once left.
  // A LIVE leg is one with no departure stamp AND on a board that is still live. Travel
  // carries no board state of its own, so this used to disagree with `getBitBoards` on
  // this very page: a trashed board appeared under "on these boards" while the door above
  // correctly left it out (S5, 2026-09-03). `boards` is the ONE definition of membership
  // (lib/db/board-membership); travel supplies only the "since when".
  const liveBoardIds = new Set(boards.map((bd) => bd.id));
  const activeLegs = travel.filter((t) => !t.left_at && liveBoardIds.has(t.board_id));
  const otherBoards = allBoards
    .filter((bd) => !boards.some((cur) => cur.id === bd.id))
    .map((bd) => ({ id: bd.id, title: bd.title }));

  let imageUrl: string | undefined;
  let audioUrl: string | undefined;
  let pdfUrl: string | undefined;
  if (b.type === "image" && b.storage_path) {
    try {
      imageUrl = await signedUrl(supabase, b.storage_path);
    } catch {
      imageUrl = undefined;
    }
  } else if (b.type === "audio" && b.storage_path) {
    try {
      audioUrl = await signedUrl(supabase, b.storage_path);
    } catch {
      audioUrl = undefined;
    }
  } else if (b.type === "pdf" && b.storage_path) {
    try {
      pdfUrl = await signedUrl(supabase, b.storage_path);
    } catch {
      pdfUrl = undefined;
    }
  } else if (b.type === "link" && b.thumb_path) {
    // the stored page-card image (a link has no storage_path)
    try {
      imageUrl = await signedUrl(supabase, b.thumb_path);
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
        <span className="font-semibold text-neutral-400">bit</span>
        <div className="flex items-baseline gap-5">
          {/* The full range, matching /note/[id]: archive (set aside, reversible) then
              trash. The bit page had only trash — a bit could be thrown away but never
              put away (owner, 2026-09-02). `noun` because "bit" is the right word here;
              the note page keeps the default. */}
          <DuplicateBit bitId={b.id} />
          <ArchiveButton thing="bit" id={b.id} noun="bit" returnTo="/bits" />
          <BitTrash bitId={b.id} noun="bit" />
        </div>
      </header>

      {/* Type + the date stamps (created · updated) — quiet, always there. */}
      <p className="text-xs uppercase tracking-wide text-neutral-400">
        {b.type}
        <span className="ml-3 normal-case tracking-normal text-neutral-400">
          <MadeAndEdited created={b.created_at} updated={b.updated_at} />
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
          stays read-only for now; a LINK shows its card + open-↗ (D-129).
          .page-editor = the comfortable document treatment (plan v1.2). */}
      <div className="mt-6">
        {b.type === "text" && (
          <div className="page-editor">
            <TextWorkspace bitId={b.id} initialBody={b.body ?? "<p></p>"} />
          </div>
        )}
        {b.type === "image" &&
          (imageUrl ? (
            <img src={imageUrl} alt={b.content ?? ""} className="max-h-[60vh] rounded-md border border-neutral-200" />
          ) : (
            <p className="text-sm text-neutral-500">Couldn&rsquo;t load this image — reload the page.</p>
          ))}
        {b.type === "link" && (
          <div>
            {imageUrl && (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={imageUrl} alt={b.face ?? ""} className="max-h-[50vh] rounded-md border border-neutral-200" />
            )}
            {b.url && (
              <p className="mt-2 text-sm">
                <a
                  href={b.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="underline underline-offset-4 hover:no-underline"
                >
                  open the page ↗
                </a>
                <span className="ml-3 text-neutral-400">{hostOf(b.url)}</span>
              </p>
            )}
          </div>
        )}
        {b.type === "audio" &&
          (audioUrl ? (
            <audio controls preload="metadata" src={audioUrl} className="w-full" />
          ) : (
            <p className="text-sm text-neutral-500">Couldn&rsquo;t load this recording — reload the page.</p>
          ))}
        {b.type === "pdf" &&
          (pdfUrl ? (
            <div>
              {/* The signed private URL renders inline (Supabase serves application/
                  pdf, no X-Frame-Options: DENY); the "open" link is the hedge if a
                  browser refuses to embed. */}
              <iframe
                src={pdfUrl}
                title={b.face ?? "PDF"}
                className="h-[75vh] w-full rounded-md border border-neutral-200"
              />
              <a
                href={pdfUrl}
                target="_blank"
                rel="noreferrer"
                className="mt-2 inline-block text-sm underline underline-offset-4 hover:no-underline"
              >
                open PDF ↗
              </a>
            </div>
          ) : (
            <p className="text-sm text-neutral-500">Couldn&rsquo;t load this PDF — reload the page.</p>
          ))}
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

      {/* Folder — where this bit is shelved (folders cut across boards, notes, and bits — O1b).
          The name links to the folder's page; the ▾ changes it (folder-story-plan.md). */}
      <div className="mt-3 flex items-baseline gap-2">
        <span className="text-xs uppercase tracking-wide text-neutral-400">folder</span>
        <GroupPicker bitId={b.id} groupId={b.group_id} groups={groups} />
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
                <Stamp iso={g.gatheredAt} className="text-xs text-neutral-400" />
              </li>
            ))}
          </ul>
        </section>
      )}

      {/* WHERE IT IS NOW — the boards it is actively on, each with when it arrived.
          Merged from two sections that overlapped: "on these boards" listed the current
          boards WITHOUT dates, and "where it's been" listed every leg ever WITH dates.
          One list now (owner, 2026-09-02: "just say which boards it is actively on and
          dates of its travel"). A live leg is one with no departure stamp, so the dates
          come from the same rows — no second query.
          The list hides when the bit is on no board ("don't display if it is not actively
          on a board"), but the place-on-a-board control stays: hiding that too would leave
          a loose bit with no way onto a board from its own page. */}
      <section className="mt-8">
        {activeLegs.length > 0 && (
          <>
            <h2 className="mb-2 text-xs uppercase tracking-wide text-neutral-400">on these boards</h2>
            <ul className="space-y-1 text-sm text-neutral-600">
              {activeLegs.map((t) => (
                <li key={t.board_id}>
                  <Link
                    href={`/board/${t.board_id}`}
                    className="text-neutral-800 underline underline-offset-4 hover:no-underline"
                  >
                    {boardLabel(t.board_title)}
                  </Link>
                  {" · arrived "}
                  <Stamp iso={t.arrived_at} />
                </li>
              ))}
            </ul>
          </>
        )}
        {otherBoards.length > 0 && (
          <div className={activeLegs.length > 0 ? "mt-3 text-sm" : "text-sm"}>
            <PlaceOnBoard bitId={b.id} boards={otherBoards} />
          </div>
        )}
      </section>

    </main>
  );
}
