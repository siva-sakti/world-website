"use server";

import { revalidatePath } from "next/cache";
import { randomUUID } from "crypto";
import { createClient } from "@/lib/supabase/server";
import { createLooseTextBit, trashBit, callInBit } from "@/lib/db/bits";
import { setSource } from "@/lib/db/sources";
import { fetchPageMeta, normalizeUrl, looksLikeUrl } from "@/lib/page-meta";

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

export type IntakeInput = {
  note: string;
  asQuote?: boolean;
  sourceName?: string | null; // the sticky source's name (pick-or-create); "" = sourceless
  sourceUrl?: string | null; // only used when the source is newly created
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

  try {
    await createLooseTextBit(supabase, { bitId, body });
    const name = (input.sourceName ?? "").trim();
    if (name) await setSource(supabase, bitId, name, input.sourceUrl ?? null);
  } catch (e) {
    console.error("addToInbox failed:", e);
    return { error: "Couldn't add that — try again." };
  }
  revalidatePath("/inbox");
  return {};
}

/** Trash a loose bit from the inbox (a freeze; restorable from trash). */
export async function trashFromInbox(formData: FormData) {
  const id = String(formData.get("id"));
  const supabase = await createClient();
  await trashBit(supabase, id);
  revalidatePath("/inbox");
}

/** Door B (call-in from the inbox): place a loose note onto a board. It lands at a
 * default spot (you're not on the board — its "fit" frames it); callInBit revives the
 * row if the note lived there before, never a duplicate (I-L1). */
export async function placeOnBoard(bitId: string, boardId: string): Promise<{ error?: string }> {
  const supabase = await createClient();
  try {
    await callInBit(supabase, { bitId, boardId, placementId: randomUUID(), x: 40, y: 40 });
  } catch (e) {
    console.error("placeOnBoard failed:", e);
    return { error: "Couldn't place that on the board." };
  }
  revalidatePath("/inbox");
  return {};
}
