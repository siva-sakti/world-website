"use server";

import { revalidatePath } from "next/cache";
import { randomUUID } from "crypto";
import { createClient } from "@/lib/supabase/server";
import { requireUser } from "@/lib/supabase/require-user";
import { createLooseTextBit, createLinkBit, trashBit, callInBit, abortBitCreate } from "@/lib/db/bits";
import { archiveBit } from "@/lib/db/resting";
import { uploadObject, removeObjects } from "@/lib/storage";
import { getBoardCards } from "@/lib/db/boards";
import { anchorNearContent, pointForIndex } from "./placement-anchor";
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
      const path = `thumbs/${bitId}.jpg`;
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

/** Trash a loose bit from the inbox (a freeze; restorable from trash). */
export async function trashFromInbox(formData: FormData) {
  const id = String(formData.get("id"));
  const supabase = await createClient();
  await requireUser(supabase);
  await trashBit(supabase, id);
  revalidatePath("/bits");
}

/** Door B (call-in from the inbox): send one or more loose bits to a board (Batch 2 —
 * send-to-board-plan.md). You're NOT on the board, so each arrival lands just to the RIGHT of the
 * board's existing cluster (anchorNearContent — never on top of it), cascading down-right so a batch
 * doesn't pile. Best-effort: a trashed bit/board is reported, the rest still land. callInBit revives
 * a row the bit lived on before, never a duplicate (I-L1) — and each bit needs a FRESH placement id
 * (a reused one collides on the PK and would throw for every bit after the first). */
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

/** Bulk trash from the loose multi-select (owner-ruled 2026-08-31). Trash is a freeze —
 * everything lands in /trash, restorable — so best-effort like the bulk send: a failure is
 * reported, the rest still land. */
/** Archive the selected bits — set aside, hidden but kept, reversible from /archive.
 *  Mirrors trashBits exactly (same loop, same partial-failure reporting): each bit is
 *  independent, so one failure must not abandon the rest, and the owner is told whether
 *  it was all of them or some.
 *
 *  No confirm here, by owner ruling (2026-09-02) — archive is reversible, unlike trash.
 *  NOTE the asymmetry that leaves: the SINGLE archive button (archive-controls.tsx:45)
 *  does ask. Flagged to the owner, deliberate, not an oversight.
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
