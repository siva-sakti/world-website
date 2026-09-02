// Display labels — the single home for "what to show when a thing has no title
// or face". Keeps the fallback wording (and its grammar) in one place instead of
// re-derived per page.

const BIT_FALLBACK: Record<string, string> = {
  text: "a note",
  drawing: "a drawing",
  image: "an image",
  audio: "a recording",
  pdf: "a PDF",
  link: "a link",
};

/** A bit's display face, or a per-type fallback (grammatical — "an image"). */
export function bitLabel(type: string, face: string | null | undefined): string {
  return face?.trim() || BIT_FALLBACK[type] || "untitled";
}

// THE TYPE BADGE — the small chip that says what KIND of file a bit is.
//
// Was written five times, and they disagreed: a recording read "recording" on /bits and
// "audio" in /outline (which had no audio branch at all, so it fell through to the raw
// stored word); a drawing read "sketch" in three rooms and "doodle" in /search.
//
// Owner ruling, 2026-09-02: **"audio" not "recording"** (*"to me recording is maybe not
// the most clear"*), and **lowercase throughout** (*"I like lowercase for aesthetic
// reasons"*) — so "pdf", not "PDF".
//
// DELIBERATELY NEUTRAL, and this is the important part: **doodle · sketch · drawing** are
// the owner's own vocabulary for what a drawing IS to her ("something cute" vs "the way a
// cell looks" vs "the form of a fashion piece"), and all three are valid. They are NOT
// type names, and they must not be spent here. The schema already carries the field that
// idea belongs in (`bit.subtype_word_id`, unused so far — and one of the two things this
// pass refused to delete when an audit called it dead code).
const TYPE_BADGE: Record<string, string> = {
  text: "text",
  drawing: "drawing",
  image: "image",
  audio: "audio",
  pdf: "pdf",
  link: "link",
};

/** What KIND of file this is, for a badge. Unknown types show their stored word rather
 *  than a guess — a new bit type should look unfamiliar, not mislabelled. */
export function typeLabel(type: string | null | undefined): string {
  return TYPE_BADGE[type ?? ""] ?? type ?? "bit";
}

/** A board's display title, or the standard placeholder. */
export function boardLabel(title: string | null | undefined): string {
  return title?.trim() || "untitled board";
}
