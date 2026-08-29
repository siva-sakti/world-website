// The search language (client-side, instant, EXACT — no DB stemming, which would
// treat "run" = "running", the opposite of what the owner wants). Parse a raw query
// into terms / phrases / exclusions, compile it once into a matcher, run it over each
// bit or note's words. Grammar: whole word by default · word* = starts-with ·
// "exact phrase" = words contiguous · -word = exclude · two words = both must appear.

export type ParsedQuery = {
  terms: { text: string; prefix: boolean }[]; // all must appear
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

  const terms: { text: string; prefix: boolean }[] = [];
  const excludes: string[] = [];
  for (const tok of rest.split(/\s+/)) {
    if (!tok) continue;
    if (tok.startsWith("-") && tok.length > 1) {
      const x = tok.slice(1).replace(/\*+$/, "");
      if (x) excludes.push(x);
      continue;
    }
    const prefix = tok.endsWith("*");
    const text = prefix ? tok.replace(/\*+$/, "") : tok;
    if (text) terms.push({ text, prefix });
  }
  return { terms, phrases, excludes };
}

export function isEmptyQuery(pq: ParsedQuery): boolean {
  return pq.terms.length === 0 && pq.phrases.length === 0 && pq.excludes.length === 0;
}

/** Compile a parsed query once into a fast matcher over a thing's lowercased words. */
export function compileMatcher(pq: ParsedQuery): (text: string) => boolean {
  // \b is a word boundary: `\blit\b` matches the word "lit" but not "literature"
  // or "split"; a prefix drops the trailing \b so `\blit` matches words *starting*
  // with "lit" (never mid-word — "split" has no boundary before "lit").
  const phraseRes = pq.phrases.map((p) => new RegExp(`\\b${esc(p)}\\b`));
  const termRes = pq.terms.map((t) =>
    t.prefix ? new RegExp(`\\b${esc(t.text)}`) : new RegExp(`\\b${esc(t.text)}\\b`),
  );
  const excludeRes = pq.excludes.map((x) => new RegExp(`\\b${esc(x)}\\b`));

  return (text: string) => {
    for (const re of phraseRes) if (!re.test(text)) return false;
    for (const re of termRes) if (!re.test(text)) return false;
    for (const re of excludeRes) if (re.test(text)) return false;
    return true;
  };
}
