// THE one definition of "does this thing match what I typed" — used by every
// search box in the app: find, the drawer (board + note page), and the `[[`
// gather picker. Before this, each surface hand-rolled its own `.includes()`
// over a different set of fields, and they had already drifted.
//
// Two rulings live here (owner, 2026-08-28):
//   1. PARTIAL WORDS — plain substring, so `budd` finds "buddhism". Not
//      Postgres word-stemming: partial typing is how you search your own notes.
//   2. FULL TEXT EVERYWHERE — every surface reads a thing's whole words, body
//      included. You often remember a phrase from INSIDE a note, not its title.
//      (An earlier draft had a shallow/deep dial; with nothing shallow left it
//      was speculative, so there is no dial.)

/** What a thing offers up to be searched. The surfaces hold different shapes
 *  (PanelBit · FindItem · BitHit) but the searchable fields are the same few. */
export type Searchable = {
  face?: string | null;
  content?: string | null; // a text bit's optional title (D-087)
  body?: string | null; // rich-text HTML — stripped to words here
  fileName?: string | null; // an image's filename, when it has no other words
  sourceName?: string | null; // "where from"
  tagWords?: string[];
};

/** Rich text → plain words. Tags become spaces so `a<br>b` doesn't read "ab". */
export function stripHtml(html: string | null | undefined): string {
  return (html ?? "").replace(/<[^>]+>/g, " ");
}

/** Everything a thing can be found by, as one lowercased string.
 *  ALWAYS lowercase — `matches` relies on it, and doing it once per thing
 *  instead of once per keystroke is what keeps a big list instant. */
export function haystack(s: Searchable): string {
  return [
    s.face ?? "",
    s.content ?? "",
    stripHtml(s.body),
    s.fileName ?? "",
    s.sourceName ?? "",
    ...(s.tagWords ?? []),
  ]
    .join(" ")
    .toLowerCase();
}

/** Does this thing match the query? `hay` MUST come from `haystack()` (already
 *  lowercased). An empty query matches everything — the ledger, unfiltered. */
export function matches(hay: string, query: string): boolean {
  const q = query.trim().toLowerCase();
  return q === "" || hay.includes(q);
}
