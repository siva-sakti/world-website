// THE escape + plain-text→paragraphs pair (one home — the two prior copies had already
// drifted: one escaped 4 entities, one 5; the 5-entity version wins). Used by every door
// that turns pasted/typed plain text into a text bit's body.

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

/** Plain text → the body html: one <p> per line, escaped. */
export function textToParagraphs(text: string): string {
  return text
    .split(/\r?\n/)
    .map((ln) => `<p>${escapeHtml(ln)}</p>`)
    .join("");
}
