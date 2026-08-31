// The search language (client-side, instant — no DB stemming, which would treat
// "run" = "running"). Parse a raw query into terms / phrases / exclusions, compile it
// once into a matcher, run it over each bit or note's words. Grammar: STARTS-WITH by
// default (matches word beginnings, so it grows as you type — "ai" → "aim", never
// "again") · *word = contains (anywhere, for text buried in a URL) · "exact phrase" =
// words contiguous · -word = exclude · two words = both must appear.

export type ParsedQuery = {
  terms: { text: string; contains: boolean }[]; // all must appear (contains = anywhere; else starts-with)
  phrases: string[]; // all must appear, words contiguous
  excludes: string[]; // none may appear
};

function esc(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

export function parseQuery(raw: string): ParsedQuery {
  const phrases: string[] = [];
  // Pull out "quoted phrases" first, then split what's left on whitespace.
  const rest = raw.trim().toLowerCase().replace(/"([^"]+)"/g, (_m, p: string) => {
    const t = p.trim();
    if (t) phrases.push(t);
    return " ";
  });

  const terms: { text: string; contains: boolean }[] = [];
  const excludes: string[] = [];
  for (const tok of rest.split(/\s+/)) {
    if (!tok) continue;
    if (tok.startsWith("-") && tok.length > 1) {
      const x = tok.slice(1).replace(/^\*+|\*+$/g, "");
      if (x) excludes.push(x);
      continue;
    }
    // A leading * (e.g. *ai, *ai*) = CONTAINS — match anywhere in a word, for a
    // handle buried in a URL. Otherwise the term is STARTS-WITH (the default): it
    // matches words BEGINNING with it, so it grows as you type and never fires on a
    // mid-word ("ai" → "aim"/"AI", never "again"). A trailing * is just the default.
    const contains = tok.startsWith("*");
    const text = tok.replace(/^\*+|\*+$/g, "");
    if (text) terms.push({ text, contains });
  }
  return { terms, phrases, excludes };
}

export function isEmptyQuery(pq: ParsedQuery): boolean {
  return pq.terms.length === 0 && pq.phrases.length === 0 && pq.excludes.length === 0;
}

/** Compile a parsed query once into a fast matcher over a thing's lowercased words. */
export function compileMatcher(pq: ParsedQuery): (text: string) => boolean {
  // \b is a word boundary. Default term = STARTS-WITH (`\bword`): matches words
  // beginning with the term ("ai" → "aim"/"AI", never "again"/"email" mid-word) — so
  // it grows as you type. `contains` drops the leading \b too (`word`) to match
  // anywhere. A "phrase" is exact contiguous words (`\bword\b`); -word excludes a
  // word-start.
  const phraseRes = pq.phrases.map((p) => new RegExp(`\\b${esc(p)}\\b`));
  const termRes = pq.terms.map((t) =>
    t.contains ? new RegExp(esc(t.text)) : new RegExp(`\\b${esc(t.text)}`),
  );
  const excludeRes = pq.excludes.map((x) => new RegExp(`\\b${esc(x)}`));

  return (text: string) => {
    for (const re of phraseRes) if (!re.test(text)) return false;
    for (const re of termRes) if (!re.test(text)) return false;
    for (const re of excludeRes) if (re.test(text)) return false;
    return true;
  };
}
