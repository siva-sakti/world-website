// Word-start title matching — the shared behavior behind "jump to a thing by name",
// used by the home surfaces list's name-jump (S2). Each typed
// word must BEGIN a word in the title (\b = word boundary): "clim" finds "Climate" but
// never mid-word ("victim"); "clim pol" needs a word starting each. No operators — a
// name-jump, not a content search (that's Search).

export function jumpWords(q: string): string[] {
  return q.trim().toLowerCase().split(/\s+/).filter(Boolean);
}

export function titleMatches(title: string, words: string[]): boolean {
  if (words.length === 0) return true;
  const t = title.toLowerCase();
  return words.every((w) => new RegExp(`\\b${w.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}`).test(t));
}
