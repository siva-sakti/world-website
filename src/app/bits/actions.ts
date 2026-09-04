"use server";

import { revalidatePath } from "next/cache";
import { randomUUID } from "crypto";
import { createClient } from "@/lib/supabase/server";
import { requireUser } from "@/lib/supabase/require-user";
import { createLooseTextBit, createLinkBit, trashBit, callInBit, abortBitCreate, duplicateBit, placeManyOnNewBoard } from "@/lib/db/bits";
import { archiveBit } from "@/lib/db/resting";
import { uploadObject, removeObjects, linkThumbPath } from "@/lib/storage";
import { getBoardCards, createBoard } from "@/lib/db/boards";
import { anchorNearContent, pointForIndex, gridPointForIndex } from "./placement-anchor";
import { resolveCardMedia } from "@/app/board/[id]/card-defaults";
import { isCardType } from "@/app/board/[id]/card-vm";
import { setSource } from "@/lib/db/sources";
import { applyTag } from "@/lib/db/tags";
import { fetchPageMeta, fetchImageBlob, normalizeUrl, looksLikeUrl } from "@/lib/page-meta";
import { textToParagraphs } from "@/lib/html";

/** The ONE link-substance fetch (both link doors — intake + board paste): read-once
 * meta, then the stored copy of the page-card image. Best-effort — a failed fetch or
 * upload only means a plainer card, never a blocked capture. */
async function fetchLinkSubstance(
  supabase: Parameters<typeof createLinkBit>[0],
  bitId: string,
  url: string,
): Promise<{ title: string | null; thumbPath: string | null }> {
  const meta = await fetchPageMeta(url);
  let thumbPath: string | null = null;
  if (meta?.image) {
    const img = await fetchImageBlob(meta.image);
    if (img) {
      const path = linkThumbPath(bitId);
      try {
        await uploadObject(supabase, { path, body: img.bytes.buffer as ArrayBuffer, contentType: img.contentType });
        thumbPath = path;
      } catch (e) {
        console.error("link thumb upload failed (plainer card):", e);
      }
    }
  }
  return { title: meta?.title ?? null, thumbPath };
}

export type IntakeInput = {
  note: string;
  asQuote?: boolean;
  sourceName?: string | null; // the source's name (pick-or-create); "" = sourceless
  sourceUrl?: string | null; // only used when the source is newly created
  tags?: string[]; // tag words to apply to the new note (find-or-create, idempotent)
};

/** The intake. WORDS (with or without a URL inside) → a LOOSE text bit — your thought,
 * carrying the sticky source if set (D-102). A BARE URL → a LINK BIT (link-bit-plan.md,
 * owner-ruled 2026-08-31): the thing itself, card image + title fetched ONCE; it takes
 * the sticky source too (the chip you set is always honored) and tags like any bit.
 * "What you give is what it becomes." Quote-formatting shapes notes only (a link bit
 * ignores asQuote — ruled). Any failure after the thumb upload cleans the object up —
 * no orphan in storage. */
export async function addToInbox(input: IntakeInput): Promise<{ error?: string }> {
  const note = (input.note ?? "").trim();
  if (!note) return { error: "Nothing to add." };
  const supabase = await createClient();
  await requireUser(supabase);
  const bitId = randomUUID();

  const isLink = looksLikeUrl(note);
  let thumbPath: string | null = null;

  let created = false;
  try {
    if (isLink) {
      const url = normalizeUrl(note);
      const sub = await fetchLinkSubstance(supabase, bitId, url);
      thumbPath = sub.thumbPath;
      await createLinkBit(supabase, { bitId, url, capturedTitle: sub.title, thumbPath });
    } else {
      const inner = textToParagraphs(note);
      const body = input.asQuote ? `<blockquote>${inner}</blockquote>` : inner;
      await createLooseTextBit(supabase, { bitId, body });
    }
    created = true;
    const rawName = (input.sourceName ?? "").trim();
    if (rawName) {
      let name = rawName;
      let url = input.sourceUrl ?? null;
      // A source given as a bare link → fetch its page title (the same plumbing a
      // pasted-link note uses) so it reads "Title ↗", not a raw URL. A failed fetch
      // falls back to the URL itself — capture is never blocked by the network.
      if (!url && looksLikeUrl(rawName)) {
        url = normalizeUrl(rawName);
        const meta = await fetchPageMeta(url);
        name = meta?.title?.trim() || url;
      }
      await setSource(supabase, bitId, name, url);
    }
    for (const w of input.tags ?? []) {
      const word = w.trim();
      if (word) await applyTag(supabase, { bitId, word });
    }
  } catch (e) {
    console.error("addToInbox failed:", e);
    // A late step (source/tag) failed AFTER the bit was born: abort the create so
    // "try again" starts clean — otherwise the retry duplicates the note (the first
    // copy sitting in the pile missing its source/tags). A link bit's uploaded thumb
    // must go with it — the row is gone, so destroy-cleanup would never reach it.
    // The thumb is removed only after a CONFIRMED row abort (R2.11): if the abort
    // itself fails, the bit row survives — stripping its card image then would leave
    // a permanent link bit pointing at nothing.
    try {
      if (created) await abortBitCreate(supabase, bitId);
      if (thumbPath) await removeObjects(supabase, [thumbPath]);
    } catch (cleanupErr) {
      console.error("addToInbox cleanup failed (row or thumb may remain):", cleanupErr);
    }
    return { error: "Couldn't add that — try again." };
  }
  revalidatePath("/bits");
  revalidatePath(`/bit/${bitId}`); // the thing's own page shows its boards + this door
  return {};
}

/** DUPLICATE THIS BIT — a real copy with its own id and its own file (see duplicateBit).
 *
 *  Two doors, both single (owner: "duplicate this bit", singular):
 *   · from a BOARD — pass boardId/x/y and the copy lands beside the original
 *   · from anywhere else — omit them and the copy is LOOSE, which is what loose means:
 *     no board is showing it, so it has no position to have.
 *
 *  Not undoable, deliberately and consistently: creating a card is not either. The
 *  reversal is trashing the copy, exactly as for anything else you just made. */
export async function duplicateBitAction(
  bitId: string,
  // The copy's whole ARRANGEMENT, not just where it sits. Passing only x/y left the
  // placement row with a null size, z 0 and no angle — the screen looked right (it was
  // painted from the original) and a reload snapped the copy back to its type's default
  // size, upright, behind everything. The screen and the database disagreed.
  place?: { boardId: string; x: number; y: number; width?: number; height?: number; z?: number; angle?: number },
): Promise<{ bitId?: string; placementId?: string; imageUrl?: string; fileUrl?: string; error?: string }> {
  const supabase = await createClient();
  await requireUser(supabase);
  try {
    const copy = await duplicateBit(supabase, bitId);
    let placementId: string | undefined;
    if (place) {
      placementId = randomUUID();
      try {
        await callInBit(supabase, {
          bitId: copy.id, boardId: place.boardId, placementId,
          x: place.x, y: place.y,
          width: place.width, height: place.height, z: place.z, angle: place.angle,
        });
      } catch (e) {
        // The COPY already exists — its row and its files landed. Destroying it here would
        // throw away something that succeeded; saying "couldn't duplicate" would be a lie
        // and would invite a retry that makes ANOTHER copy. So: tell the truth about where
        // it went. It is a loose bit, which is exactly what a bit on no board is.
        console.error("duplicateBitAction: the copy was made but could not be placed:", e);
        revalidatePath("/bits");
        return { bitId: copy.id, error: "The copy was made, but it couldn't land on this board — you'll find it in your bits." };
      }
      revalidatePath(`/board/${place.boardId}`);
    }
    revalidatePath("/bits");
    revalidatePath("/");
    // The COPY'S OWN signed urls. The board paints the new card immediately, and without
    // these it would show the ORIGINAL's object — right pixels, wrong file, and blank if
    // the original is destroyed before a reload.
    const media = isCardType(copy.type)
      ? await resolveCardMedia(supabase, {
          type: copy.type,
          thumb_path: copy.thumb_path,
          storage_path: copy.storage_path,
        })
      : {};
    return { bitId: copy.id, placementId, ...media };
  } catch (e) {
    console.error("duplicateBitAction:", e);
    return { error: "Couldn't duplicate that — try again." };
  }
}

/** The most cards one "make a board from these" will gather. Each placement is its own
 *  round trip, so this is a real limit, not a taste: past a couple of hundred the request
 *  would outlive itself and leave a half-filled board. Stated to the owner rather than
 *  silently truncating. */
const GATHER_CAP = 200; // NOT exported: a "use server" file may only export async functions

/** MAKE A BOARD FROM THESE — gather a set of bits onto a brand-new board.
 *
 *  Owner's ask: *"from a tag or from multi-select... an option to make this a board, and
 *  then it would just gather everything into a board and you'd have to arrange it."*
 *
 *  Lands them in a GRID, not the send-to-board cascade: that cascade steps down-right per
 *  arrival, which is right for sending three things to a board you cannot see and wrong for
 *  gathering forty (a 1,600px diagonal) — and the owner expects to arrange what lands.
 *
 *  IF EVERY PLACEMENT FAILS the empty board is KEPT, deliberately: deleting a board she
 *  just asked for is more surprising than an empty one she can trash, and the error says
 *  what happened. NOT UNDOABLE — board creation sits outside the board-scoped undo stack;
 *  the reversal is trashing the board. */
export async function makeBoardFromBits(
  bitIds: string[],
  title: string | null,
): Promise<{ boardId?: string; error?: string }> {
  if (!bitIds.length) return { error: "Nothing to gather." };
  if (bitIds.length > GATHER_CAP) {
    return { error: `That's ${bitIds.length} things — more than a board can take at once (${GATHER_CAP}). Narrow it down first.` };
  }
  const supabase = await createClient();
  await requireUser(supabase);
  // Reported, not thrown (2026-09-03). This was the one action in the file that let a
  // failure escape as an unhandled server-action rejection while every sibling returned
  // `{ error }` — so the same kind of problem reached the owner two different ways
  // depending on which button they pressed. Found by an antagonist review.
  let board: Awaited<ReturnType<typeof createBoard>>;
  try {
    board = await createBoard(supabase, title);
  } catch (e) {
    console.error("makeBoardFromBits: the board couldn't be made:", e);
    return { error: "Couldn't make the board — check your connection and try again." };
  }
  // Two round trips for the whole batch (placeManyOnNewBoard), not two PER BIT. The loop
  // this replaced could outlive its own request on a busy tag and leave a half-filled
  // board with the owner told only that it "failed".
  let placed: number;
  let skipped: string[];
  try {
    ({ placed, skipped } = await placeManyOnNewBoard(
      supabase,
      board.id,
      bitIds.map((bitId, i) => ({ bitId, ...gridPointForIndex(i, bitIds.length) })),
    ));
  } catch (e) {
    // The board landed and the placing did not. Say so and hand back its id — an empty
    // board the owner can see and trash beats a silent failure and a board they never
    // learn about.
    console.error("makeBoardFromBits: the board was made but nothing could be placed:", e);
    revalidatePath("/");
    return { boardId: board.id, error: "The board was made, but nothing could be placed on it — try again from the board." };
  }
  revalidatePath("/");
  revalidatePath("/bits");
  revalidatePath(`/board/${board.id}`);
  if (!placed) {
    return { boardId: board.id, error: "The board was made, but nothing could be placed on it — those may be in the trash." };
  }
  if (skipped.length) {
    return { boardId: board.id, error: `The board was made — ${skipped.length} of those couldn't be placed (in the trash or archived).` };
  }
  return { boardId: board.id };
}

export async function placeBitsOnBoard(bitIds: string[], boardId: string): Promise<{ error?: string }> {
  const supabase = await createClient();
  await requireUser(supabase);
  const anchor = anchorNearContent(await getBoardCards(supabase, boardId));
  let failed = 0;
  let firstMsg = "";
  for (let i = 0; i < bitIds.length; i++) {
    const { x, y } = pointForIndex(anchor, i);
    try {
      await callInBit(supabase, { bitId: bitIds[i], boardId, placementId: randomUUID(), x, y });
    } catch (e) {
      failed++;
      if (!firstMsg) firstMsg = e instanceof Error ? e.message : "";
      console.error("placeBitsOnBoard: a bit failed:", e);
    }
  }
  // Revalidate on success AND on error — a stale pile (trashed elsewhere) is often the cause. Pre-warm
  // the board so it shows the arrivals when the "open it" link is followed.
  revalidatePath("/bits");
  revalidatePath(`/board/${boardId}`);
  for (const id of bitIds) revalidatePath(`/bit/${id}`);
  if (failed) {
    const many = bitIds.length > 1;
    if (firstMsg === "TRASHED_BIT")
      return { error: many ? "Some of those notes are in the trash — restore them first." : "That note is in the trash — restore it first." };
    if (firstMsg === "TRASHED_BOARD") return { error: "That board is in the trash." };
    return { error: many ? "Couldn't send some of those to the board." : "Couldn't place that on the board." };
  }
  return {};
}

/** Single-bit send — a thin wrapper so the existing per-card door keeps its signature. */
export async function placeOnBoard(bitId: string, boardId: string): Promise<{ error?: string }> {
  return placeBitsOnBoard([bitId], boardId);
}

/** Board-paste door (link-bit-plan): capture a pasted URL as a LOOSE link bit, fully
 * server-side — read-once meta + a stored copy of the page-card image — and return the
 * created row so the board can place it via the normal call-in path. Best-effort media:
 * a failed fetch/upload only means a plainer card; a failed INSERT cleans the thumb up. */
export async function captureLink(
  rawUrl: string,
): Promise<{ bit?: import("@/lib/types").Bit; error?: string }> {
  const supabase = await createClient();
  await requireUser(supabase);
  const bitId = randomUUID();
  const url = normalizeUrl(rawUrl);
  let thumbPath: string | null = null;
  try {
    const sub = await fetchLinkSubstance(supabase, bitId, url);
    thumbPath = sub.thumbPath;
    const bit = await createLinkBit(supabase, { bitId, url, capturedTitle: sub.title, thumbPath });
    revalidatePath("/bits");
    return { bit };
  } catch (e) {
    console.error("captureLink failed:", e);
    if (thumbPath) await removeObjects(supabase, [thumbPath]).catch(() => {});
    return { error: "Couldn't capture that link — try again." };
  }
}

/** Archive the selected bits — set aside, hidden but kept, reversible from /archive.
 *  Mirrors trashBits exactly (same loop, same partial-failure reporting): each bit is
 *  independent, so one failure must not abandon the rest, and the owner is told whether
 *  it was all of them or some.
 *
 *  Asks first, through the ONE archive confirm (app/archive/archive-confirm) that the
 *  single ArchiveButton also uses — so "does archiving ask?" is answered in one file.
 *  (This comment used to describe an asymmetry between the two doors; the shared door
 *  removed it, and the comment outlived the fact.)
 *
 *  Revalidates /bits (the bit leaves the live list — listAllBits filters state='live')
 *  and /archive (where it now appears), the same pair archiveItemAction uses. */
export async function archiveBits(ids: string[]): Promise<{ error?: string }> {
  const supabase = await createClient();
  await requireUser(supabase);
  let failed = 0;
  for (const id of ids) {
    try {
      await archiveBit(supabase, id);
    } catch (e) {
      failed++;
      console.error("archiveBits: a bit failed:", e);
    }
  }
  revalidatePath("/bits");
  revalidatePath("/archive");
  revalidatePath("/");
  if (failed) {
    return { error: failed === ids.length ? "Couldn't archive those — try again." : "Couldn't archive some of those." };
  }
  return {};
}

export async function trashBits(ids: string[]): Promise<{ error?: string }> {
  const supabase = await createClient();
  await requireUser(supabase);
  let failed = 0;
  for (const id of ids) {
    try {
      await trashBit(supabase, id);
    } catch (e) {
      failed++;
      console.error("trashBits: a bit failed:", e);
    }
  }
  revalidatePath("/bits");
  if (failed) {
    return { error: failed === ids.length ? "Couldn't trash those — try again." : "Couldn't trash some of those." };
  }
  return {};
}
