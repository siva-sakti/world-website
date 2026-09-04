// THE COPY RULE — what a duplicate inherits, stated once so it can be enforced.
//
//   A copy inherits what the bit HAS. It never inherits what POINTS AT it.
//
// Owner-ruled 2026-09-03 (D-144). It exists because duplicate lost fields twice in one
// week — first `locked` and the signed URLs, then size, tilt and stacking — and each
// time the reported field was fixed and nobody asked what else was in the same position.
// The rule is what makes that question answerable without a list to remember.
//
// It matters beyond the board: the composition spec (§24.5b) ruled that "bring the bit
// in as a COPY" IS this feature, so whatever a duplicate drops will be dropped inside
// the owner's writing too.
//
// What POINTS AT a bit lives in other tables and is never copied: `placement` (which
// boards show it), `reference` (which writing mentions it), and its travel history.
// Tags ARE copied — a tag is something the bit HAS, not a pointer at it.
//
// These two lists must together name every column of `bit`. A new column that appears
// in neither fails bit-copy-rule.test.mjs — which is the whole point: the next person
// to add one has to decide, rather than inherit whichever behaviour they didn't notice.

/** Copied to the duplicate: what the bit IS. */
export const COPIED_TO_A_DUPLICATE = [
  "type",
  "kind", // a thing never changes type (I-K1) — and neither does its copy
  "body",
  "strokes",
  "content",
  "url",
  "captured_title",
  "storage_path", // its OWN copy of the file — never the same object
  "thumb_path", //   (two bits sharing one file means trashing either destroys both)
  "media_width",
  "media_height",
  "mime",
  "byte_size",
  "file_name",
  "source_id", // where it came from travels with it (P8)
  "subtype_word_id",
  "group_id", // filed with its original — the answer that needs no explanation
] as const;

/** Deliberately NOT copied, each for a stated reason. */
export const NOT_COPIED_TO_A_DUPLICATE = {
  id: "a copy is a different thing — that is the whole point",
  created_at: "the copy is made now, not when the original was",
  updated_at: "same",
  deleted_at: "a copy is born live, never pre-trashed",
  archived_at: "a copy is born live, never pre-archived",
  pinned_at: "the star is a claim about what you are on NOW, not about the thing",
  visibility: "left at the column default — a copy makes no claim about who may see it",
  state: "generated from the timestamps; never written",
  face: "generated from content/title/url; never written",
  search_tsv: "generated; never written",
} as const;
