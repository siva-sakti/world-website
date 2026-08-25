"use server";

import { revalidatePath } from "next/cache";
import { randomUUID } from "crypto";
import { createClient } from "@/lib/supabase/server";
import { createLooseTextBit, trashBit, callInBit, abortBitCreate } from "@/lib/db/bits";
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
  return {};
}

/** Trash a loose bit from the inbox (a freeze; restorable from trash). */
export async function trashFromInbox(formData: FormData) {
  const id = String(formData.get("id"));
  const supabase = await createClient();
  await trashBit(supabase, id);
  revalidatePath("/bits");
}

/** Door B (call-in from the inbox): place a loose note onto a board. It lands at a
 * default spot (you're not on the board — its "fit" frames it), spread a little by
 * the bit's own id so several sends don't stack at one exact point; callInBit
 * revives the row if the note lived there before, never a duplicate (I-L1). */
export async function placeOnBoard(bitId: string, boardId: string): Promise<{ error?: string }> {
  const supabase = await createClient();
  const seed = Array.from(bitId).reduce((a, c) => a + c.charCodeAt(0), 0);
  const x = 40 + (seed % 5) * 36;
  const y = 40 + (seed % 7) * 28;
  try {
    await callInBit(supabase, { bitId, boardId, placementId: randomUUID(), x, y });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "";
    revalidatePath("/bits"); // a stale pile is often the CAUSE (trashed elsewhere) — refresh it
    if (msg === "TRASHED_BIT") return { error: "That note is in the trash — restore it first." };
    if (msg === "TRASHED_BOARD") return { error: "That board is in the trash." };
    console.error("placeOnBoard failed:", e);
    return { error: "Couldn't place that on the board." };
  }
  revalidatePath("/bits");
  return {};
}
