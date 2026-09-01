"use server";

import { revalidatePath } from "next/cache";
import { randomUUID } from "crypto";
import { createClient } from "@/lib/supabase/server";
import { createLooseTextBit, trashBit, callInBit, abortBitCreate } from "@/lib/db/bits";
import { getBoardCards } from "@/lib/db/boards";
import { anchorNearContent, pointForIndex } from "./placement-anchor";
import { setSource } from "@/lib/db/sources";
import { applyTag } from "@/lib/db/tags";
import { fetchPageMeta, normalizeUrl, looksLikeUrl } from "@/lib/page-meta";

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

export type IntakeInput = {
  note: string;
  asQuote?: boolean;
  sourceName?: string | null; // the source's name (pick-or-create); "" = sourceless
  sourceUrl?: string | null; // only used when the source is newly created
  tags?: string[]; // tag words to apply to the new note (find-or-create, idempotent)
};

/** The intake: a note (or a pasted link) → a LOOSE text bit, carrying the sticky
 * source if one is set (D-102, plan §5 Stage 2). Quote vs. thought is *formatting*
 * (a blockquote), not a new kind. The source is set via setSource (pick-or-create,
 * idempotent) so piling several notes under one sticky source just re-finds it. */
export async function addToInbox(input: IntakeInput): Promise<{ error?: string }> {
  const note = (input.note ?? "").trim();
  if (!note) return { error: "Nothing to add." };
  const supabase = await createClient();
  const bitId = randomUUID();

  let inner: string;
  if (looksLikeUrl(note)) {
    // A bare pasted link stays a NOTE whose body is a clickable link — bookmark is
    // retired (D-102). It can carry the sticky source like any other note.
    const url = normalizeUrl(note);
    const meta = await fetchPageMeta(url);
    const label = meta?.title ?? url;
    inner = `<p><a href="${escapeHtml(url)}">${escapeHtml(label)}</a></p>`;
  } else {
    inner = note.split(/\n+/).map((line) => `<p>${escapeHtml(line)}</p>`).join("");
  }
  const body = input.asQuote ? `<blockquote>${inner}</blockquote>` : inner;

  let created = false;
  try {
    await createLooseTextBit(supabase, { bitId, body });
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
    // copy sitting in the pile missing its source/tags).
    if (created) await abortBitCreate(supabase, bitId);
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

/** Bulk trash from the loose multi-select (owner-ruled 2026-08-31). Trash is a freeze —
 * everything lands in /trash, restorable — so best-effort like the bulk send: a failure is
 * reported, the rest still land. */
export async function trashBits(ids: string[]): Promise<{ error?: string }> {
  const supabase = await createClient();
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
