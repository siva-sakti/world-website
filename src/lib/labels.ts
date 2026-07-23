// Display labels — the single home for "what to show when a thing has no title
// or face". Keeps the fallback wording (and its grammar) in one place instead of
// re-derived per page.

const BIT_FALLBACK: Record<string, string> = {
  text: "a note",
  drawing: "a drawing",
  image: "an image",
  bookmark: "a saved page",
};

/** A bit's display face, or a per-type fallback (grammatical — "an image"). */
export function bitLabel(type: string, face: string | null | undefined): string {
  return face?.trim() || BIT_FALLBACK[type] || "untitled";
}

/** A board's display title, or the standard placeholder. */
export function boardLabel(title: string | null | undefined): string {
  return title?.trim() || "untitled board";
}
