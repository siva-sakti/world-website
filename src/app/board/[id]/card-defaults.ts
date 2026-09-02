import type { SupabaseClient } from "@supabase/supabase-js";
import { signedUrl } from "@/lib/storage";
import type { CardType } from "./card-vm";

// The two facts every card-building path needs, each stated ONCE. Both used to exist
// twice — in page.tsx (the server, rebuilding a saved board) and in use-create-doors'
// bringIn (the client, calling a loose bit onto the board) — and the size table had
// ALREADY DRIFTED between them (text 240 vs 400, audio 260 vs 300; heights agreed).
// A seventh bit type would have needed both edited, with nothing to enforce it.

const AUDIO_H = 56; // the native player's height (flex-sized: h follows the player)

/** A card's size when nothing has set one — a fresh call-in, or an old placement row
 *  whose width/height were never written.
 *
 *  Owner ruling (2026-09-02): ONE table, using the sizes the app actually creates
 *  today, so nothing you make changes size; only legacy rows that never got a width
 *  now match everything else. Deliberately not a design decision — the owner's design
 *  pass owns real sizing ("card size and auto size and different options for
 *  backgrounds"); this exists so there is one place for that pass to edit. */
export function defaultCardSize(type: CardType, kind: "bit" | "note"): { w: number; h: number } {
  if (kind === "note") return { w: 200, h: 260 }; // a note lands page-shaped — a doorway, not a receipt
  switch (type) {
    case "text":
      return { w: 400, h: 60 };
    case "audio":
      return { w: 300, h: AUDIO_H };
    case "pdf":
      return { w: 220, h: 280 };
    case "link":
      return { w: 220, h: 180 };
    default:
      return { w: 220, h: 220 }; // image · drawing
  }
}

/** The stored object(s) a card renders from, resolved to signed URLs.
 *
 *  image → thumb if there is one, else the full object, into `imageUrl`
 *  pdf   → its first-page thumb ONLY (storage_path is the PDF binary, never an <img> src)
 *  link  → its stored page-card image; no thumb → the card's title/URL fallback
 *  audio → its stored object into `fileUrl`, for the <audio> player
 *
 *  A signing failure yields undefined, never a throw: one unreachable object must not
 *  fail the whole board load — the card falls back to its own empty state. */
export async function resolveCardMedia(
  supabase: SupabaseClient,
  row: { type: CardType; thumb_path?: string | null; storage_path?: string | null },
): Promise<{ imageUrl?: string; fileUrl?: string }> {
  const sign = async (path: string | null | undefined): Promise<string | undefined> => {
    if (!path) return undefined;
    try {
      return await signedUrl(supabase, path);
    } catch {
      return undefined;
    }
  };
  switch (row.type) {
    case "image":
      return { imageUrl: await sign(row.thumb_path ?? row.storage_path) };
    case "pdf":
    case "link":
      return { imageUrl: await sign(row.thumb_path) };
    case "audio":
      return { fileUrl: await sign(row.storage_path) };
    default:
      return {}; // text · drawing carry no stored object
  }
}
