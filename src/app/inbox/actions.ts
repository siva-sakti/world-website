"use server";

import { revalidatePath } from "next/cache";
import { randomUUID } from "crypto";
import { createClient } from "@/lib/supabase/server";
import { createLooseTextBit, createBookmarkBit, trashBit } from "@/lib/db/bits";
import { fetchPageMeta, normalizeUrl, looksLikeUrl } from "@/lib/page-meta";

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

/** Quick-add from the inbox: a pasted link → a bookmark; typed prose → a note.
 * Either way the bit is born LOOSE (no board) and lands in the inbox (D-100). */
export async function quickAdd(formData: FormData) {
  const raw = String(formData.get("text") ?? "").trim();
  if (!raw) return;
  const supabase = await createClient();
  if (looksLikeUrl(raw)) {
    const url = normalizeUrl(raw);
    // https pages get a title; the bookmark saves either way (fail-safe).
    const meta = await fetchPageMeta(url);
    await createBookmarkBit(supabase, {
      bitId: randomUUID(), url, capturedTitle: meta?.title ?? null,
    });
  } else {
    const body = raw.split(/\n+/).map((line) => `<p>${escapeHtml(line)}</p>`).join("");
    await createLooseTextBit(supabase, { bitId: randomUUID(), body });
  }
  revalidatePath("/inbox");
}

/** Trash a loose bit from the inbox (a freeze; restorable from trash). */
export async function trashFromInbox(formData: FormData) {
  const id = String(formData.get("id"));
  const supabase = await createClient();
  await trashBit(supabase, id);
  revalidatePath("/inbox");
}
