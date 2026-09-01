// The jot box's device-local draft (parked A12, re-entered 2026-09-02). The capture
// box on /bits held everything in memory only: navigate away, reload, or let the phone
// evict the tab and the words, the source, the tags and the quote toggle were gone with
// no trace. This mirrors the box to localStorage so it's simply there when you return.
//
// I-D3 IS THE LINE: a draft may restore into the BOX only — it must never save itself
// to the database on the owner's behalf. Nothing here writes to the DB; the owner
// presses add. That is also why this is device-local and not an "unsent note" record.
//
// Every field stored is a field the SUBMIT path actually uses (intake.tsx): a
// typed-but-not-Entered source name AND tag word are both submitted, so both are kept —
// dropping either would silently lose something the owner had chosen.

export type PickedSource = { name: string; url: string | null };

export type JotDraft = {
  note: string;
  asQuote: boolean;
  sticky: PickedSource | null;
  draft: string; // the source input's typed text — SUBMITTED when no chip is picked
  tagWords: string[];
  tagDraft: string; // the tag input's typed text — SUBMITTED alongside tagWords
};

const KEY = "jot-draft:v1";

/** Nothing worth keeping? `asQuote` alone doesn't count: it carries no authored
 *  content, add is disabled without note text, and counting it would mean an
 *  untouched box quietly arriving with "as a quote" ticked and a key that never dies. */
export function isEmptyDraft(d: JotDraft): boolean {
  return (
    !d.note.trim() &&
    !d.draft.trim() &&
    !d.sticky &&
    d.tagWords.length === 0 &&
    !d.tagDraft.trim()
  );
}

function isSource(v: unknown): v is PickedSource {
  if (typeof v !== "object" || v === null) return false;
  const s = v as Record<string, unknown>;
  return typeof s.name === "string" && (s.url === null || typeof s.url === "string");
}

/** Parse + SHAPE-VALIDATE (not just JSON-guard): a stored `{"tagWords":"a,b"}` parses
 *  fine and would then crash the render on .map. Anything unexpected reads as no draft. */
export function parseDraft(raw: string | null): JotDraft | null {
  if (!raw) return null;
  try {
    const v: unknown = JSON.parse(raw);
    if (typeof v !== "object" || v === null) return null;
    const d = v as Record<string, unknown>;
    if (typeof d.note !== "string") return null;
    if (typeof d.asQuote !== "boolean") return null;
    if (typeof d.draft !== "string") return null;
    if (typeof d.tagDraft !== "string") return null;
    if (!Array.isArray(d.tagWords) || d.tagWords.some((w) => typeof w !== "string")) return null;
    if (d.sticky !== null && !isSource(d.sticky)) return null;
    const out: JotDraft = {
      note: d.note,
      asQuote: d.asQuote,
      sticky: d.sticky as PickedSource | null,
      draft: d.draft,
      tagWords: d.tagWords as string[],
      tagDraft: d.tagDraft,
    };
    return isEmptyDraft(out) ? null : out; // a stored-but-empty draft is no draft
  } catch {
    return null;
  }
}

/** The saved draft, or null. Never throws and never REMOVES the key — a read that
 *  cleared would lose the draft on React StrictMode's double-invoked mount effect. */
export function loadDraft(): JotDraft | null {
  try {
    return parseDraft(localStorage.getItem(KEY));
  } catch {
    return null; // storage blocked (Safari block-all) — the feature is simply absent
  }
}

/** Mirror the box. An empty box REMOVES the key rather than storing a blank, so
 *  there's never a stale empty draft to restore. Best-effort: a full or blocked
 *  store must never break capture. */
export function saveDraft(d: JotDraft): void {
  try {
    if (isEmptyDraft(d)) localStorage.removeItem(KEY);
    else localStorage.setItem(KEY, JSON.stringify(d));
  } catch {
    /* storage full or blocked — the draft just won't persist */
  }
}
// There is deliberately no clearDraft(): clearing the box IS emptying it, and the
// mirror above turns an empty box into a removed key. One mechanism, nothing to drift.
