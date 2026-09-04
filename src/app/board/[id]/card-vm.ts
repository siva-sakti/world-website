import type { Drawing } from "@/lib/types";

// THE CARD VIEW-MODEL — what one card on the board is, to the client.
//
// It lives in its own file because ten modules need the shape and only one of them
// (card.tsx) renders it; before this, every hook imported a 500-line component to
// borrow a type. Type-only, no runtime imports: safe on the server (page.tsx builds
// these rows) and on the client alike.
//
// (Placement keeps x/y/w/h/z, so per-note font size has no home yet; text still
// reflows by width. A font_scale column is an additive future call.)

/** The six things a card can BE. One list — the board's type guards read it. */
export type CardType = "text" | "drawing" | "image" | "audio" | "pdf" | "link";

/** Narrow an unknown/db-string type to a CardType. The board drops rows it can't
 *  render rather than guessing (page.tsx and bringIn both gate on this). */
export function isCardType(t: string | null | undefined): t is CardType {
  return t === "text" || t === "drawing" || t === "image" || t === "audio" || t === "pdf" || t === "link";
}

/** Types whose card HEIGHT follows their content, so there is nothing true to store:
 *  a text card grows with its words; an audio card is the native player's own height.
 *  The renderer sets `height: auto` for these and resize only ever writes their WIDTH
 *  back — so a stored height has never described one (S8; owner-ruled 2026-09-03:
 *  stop storing it). Readers fall back to `defaultCardSize`, which is a stated guess
 *  rather than a stale number that looks like a measurement. */
export function isFlexSized(type: CardType): boolean {
  return type === "text" || type === "audio";
}

export type CardVM = {
  placementId: string;
  bitId: string;
  type: CardType;
  kind: "bit" | "note"; // a note (a written PIECE) renders as a page-shaped DOORWAY, not editable text (N3)
  x: number;
  y: number;
  w: number;
  h: number;
  z: number;
  body?: string; // text (tiptap html → bit.body)
  drawing?: Drawing; // drawing (strokes + per-stroke pen width)
  imageUrl?: string; // image thumbnail/full URL — also a PDF's first-page thumbnail (signed thumb_path)
  fileUrl?: string; // audio (resolved storage URL for the <audio> player)
  content?: string; // owner words: a text bit's optional title (D-087) / a media caption (§2b)
  locked?: boolean; // position frozen (B+): drag/resize/nudge/tidy skip it
  /** Degrees; undefined/0 = upright. PRESENTATION ONLY: the tilt is a CSS transform on the
   *  inner content, so w/h and every measurement stay in unrotated space (rotation-plan §1).
   *  A rotated card opts OUT of alignment, exactly as a locked one does (§5). */
  angle?: number;
  url?: string; // a LINK bit's substance — the card's open-↗ target
  label?: string; // a link bit's computed face (caption → read-once title → url) for the title strip
  sourceName?: string; // "from …" — the bit's source (travels with it, P8)
  sourceUrl?: string; // the source's optional clickable link
};
