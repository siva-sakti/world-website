"use client";

import { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { jumpWords, titleMatches } from "@/lib/jump-match";
import { listSources, type Source } from "@/lib/db/sources";
import { listTags, type TagChoice } from "@/lib/db/tags";
import { addToInbox } from "./actions";
import { loadDraft, saveDraft, isEmptyDraft, type PickedSource } from "./jot-draft";

// The intake (plan §5 Stage 2, + the reset/tags pass): pile notes under a source,
// with tags, from one calm box. Source and tags autosuggest; both apply on add
// whether or not you pressed Enter (nothing typed is silently dropped), and the
// whole box RESETS after each add — note cleared, textarea shrunk, source + tags
// wiped — so the next note starts fresh. "As a quote" is formatting (a blockquote).
// The box also MIRRORS itself to device-local storage (jot-draft.ts) so a reload,
// a navigation or an evicted phone tab doesn't lose what you were writing.

export function Intake() {
  const [supabase] = useState(() => createClient());
  const [sources, setSources] = useState<Source[]>([]);
  const [tagMenu, setTagMenu] = useState<TagChoice[]>([]);
  const [sticky, setSticky] = useState<PickedSource | null>(null);
  const [draft, setDraft] = useState(""); // the source input
  const [focused, setFocused] = useState(false);
  const [note, setNote] = useState("");
  const [asQuote, setAsQuote] = useState(false);
  const [tagWords, setTagWords] = useState<string[]>([]);
  const [tagDraft, setTagDraft] = useState("");
  const [tagFocused, setTagFocused] = useState(false);
  const [pending, setPending] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [hydrated, setHydrated] = useState(false); // gates the mirror until the restore has run
  const noteRef = useRef<HTMLTextAreaElement>(null);

  // Reloadable (review R3.17): a source/tag created by one add must autosuggest on
  // the NEXT note without a remount — and the server may have retitled a URL-source,
  // which the client can't know locally. Fire-and-forget after each successful add.
  const reloadSuggestions = useCallback(() => {
    listSources(supabase).then(setSources).catch(() => {});
    listTags(supabase).then(setTagMenu).catch(() => {});
  }, [supabase]);
  useEffect(() => {
    reloadSuggestions();
  }, [reloadSuggestions]);

  // Auto-grow the note box to fit its text. Because this runs on every `note` change
  // (including the reset to "" after add), it deterministically SHRINKS back too —
  // no scrollHeight race: useLayoutEffect measures after the DOM has the new value.
  useLayoutEffect(() => {
    const el = noteRef.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = `${el.scrollHeight}px`;
  }, [note]);

  // Restore the draft ONCE, on mount. Read in an effect, never in render: localStorage
  // in render is a hydration mismatch. Functional setState so anything typed before
  // this lands (fast fingers / StrictMode's double mount) WINS over the stored draft —
  // the restore fills an empty box, it never overwrites live typing.
  // I-D3: this puts words back in the BOX. It never submits them.
  useEffect(() => {
    const d = loadDraft();
    if (d) {
      // eslint-disable-next-line react-hooks/set-state-in-effect -- one-time client storage read
      setNote((p) => p || d.note);
      setAsQuote((p) => p || d.asQuote);
      setSticky((p) => p ?? d.sticky);
      setDraft((p) => p || d.draft);
      setTagWords((p) => (p.length ? p : d.tagWords));
      setTagDraft((p) => p || d.tagDraft);
    }
    setHydrated(true);
  }, []);

  // Mirror the box into storage on every change. localStorage is synchronous, so there
  // is nothing to debounce and nothing in flight to race an add's reset against: the
  // reset re-runs this with an empty box, which REMOVES the key. Gated on `hydrated`
  // so the first paint's empty box can't wipe the draft before it's read back.
  useEffect(() => {
    if (!hydrated || pending) return; // pending too (health check R2): the un-disabled
    // controls (sticky ×, tag ×, the checkbox) could re-mirror the snapshot mid-add
    // and reopen the double-capture window the pre-await clear closed.
    saveDraft({ note, asQuote, sticky, draft, tagWords, tagDraft });
  }, [hydrated, pending, note, asQuote, sticky, draft, tagWords, tagDraft]);

  // One reset, used by BOTH a successful add and "clear" — so the two can't drift apart
  // and leave a field behind. The mirror effect above turns this into a key removal.
  const resetBox = useCallback(() => {
    setNote("");
    setAsQuote(false);
    setSticky(null);
    setDraft("");
    setTagWords([]);
    setTagDraft("");
    setErr(null);
  }, []);

  function pickSource(name: string, url: string | null) {
    const nm = name.trim();
    if (!nm) return;
    setSticky({ name: nm, url });
    setDraft("");
    setFocused(false);
    noteRef.current?.focus();
  }

  function addTag(word: string) {
    const w = word.trim();
    if (!w) return;
    setTagWords((ts) => (ts.some((t) => t.toLowerCase() === w.toLowerCase()) ? ts : [...ts, w]));
    setTagDraft("");
    setTagFocused(false);
  }

  async function add() {
    const body = note.trim();
    if (!body || pending) return;
    setPending(true);
    setErr(null);
    // Apply whatever's showing — a typed-but-not-Entered source/tag is NOT dropped.
    const sourceName = sticky?.name ?? (draft.trim() || null);
    const sourceUrl = sticky?.url ?? null;
    const tags = tagDraft.trim() ? [...tagWords, tagDraft.trim()] : tagWords;
    // The boundary hunt's #5: navigate away between the server accepting this add and
    // resetBox() rendering, and the device-local draft would still hold the note — a
    // returning visit restores it and a second add captures it TWICE. So the draft is
    // cleared BEFORE the await (the box is locked while pending, so no state change
    // can re-mirror it), and explicitly restored on every failure path.
    const snapshot = { note, asQuote, sticky, draft, tagWords, tagDraft };
    saveDraft({ note: "", asQuote: false, sticky: null, draft: "", tagWords: [], tagDraft: "" });
    try {
      const res = await addToInbox({ note: body, asQuote, sourceName, sourceUrl, tags });
      if (res.error) {
        setErr(res.error);
        saveDraft(snapshot); // the add failed — the crash-guard must hold the words again
        return;
      }
      reloadSuggestions(); // a source/tag born in THIS add must autosuggest on the next (fire-and-forget)
      resetBox(); // a fresh box for the next note — and the mirror drops the saved draft
      noteRef.current?.focus();
    } catch {
      // The action call itself rejected (offline / flaky network — the phone case).
      // Without this catch, `pending` would stick true and lock the box forever.
      setErr("Couldn't reach the server — check your connection and try again.");
      saveDraft(snapshot);
    } finally {
      setPending(false);
    }
  }

  // Is there anything in the box? Same predicate the mirror uses to decide whether a
  // draft is worth keeping, so "clear is offered" and "a draft is saved" never disagree.
  const anything = !isEmptyDraft({ note, asQuote, sticky, draft, tagWords, tagDraft });

  // Word-START matching (jump-match.ts): each typed word must begin a word in the
  // name — "art" → "Artforum"/"artist", never "cartography" — still completing as you type.
  const sourceWords = jumpWords(draft);
  const sourceSuggest = sources.filter((s) => titleMatches(s.name, sourceWords)).slice(0, 10);
  const tagWordsQ = jumpWords(tagDraft);
  const tagSuggest = tagMenu
    .filter(
      (t) =>
        titleMatches(t.word, tagWordsQ) &&
        !tagWords.some((w) => w.toLowerCase() === t.word.toLowerCase()),
    )
    .slice(0, 10);

  return (
    <div className="intake">
      {sticky ? (
        <div className="intake-source">
          <span className="tag-bar-label">capturing from</span>
          <button type="button" className="tag-chip is-on" onClick={() => setSticky(null)} title="clear source">
            {sticky.name} <span aria-hidden>×</span>
          </button>
        </div>
      ) : (
        <div className="intake-source">
          <span className="tag-bar-label">from</span>
          <span className="tag-bar-field">
            <input
              className="tag-bar-input"
              value={draft}
          disabled={pending}
              placeholder="a book, a site, an author, or paste a link…"
              autoComplete="off"
              onChange={(e) => setDraft(e.target.value)}
              onFocus={() => setFocused(true)}
              onBlur={() => setTimeout(() => setFocused(false), 120)}
              onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); pickSource(draft, null); } }}
            />
            {focused && sourceSuggest.length > 0 && (
              <div className="tag-suggest">
                {sourceSuggest.map((s) => (
                  <button
                    key={s.id}
                    type="button"
                    className="tag-chip"
                    onMouseDown={(e) => e.preventDefault()}
                    onClick={() => pickSource(s.name, s.url)}
                  >
                    {s.name}
                  </button>
                ))}
              </div>
            )}
          </span>
        </div>
      )}

      <div className="intake-source">
        <span className="tag-bar-label">tags</span>
        <span className="tag-bar-field">
          {tagWords.map((w) => (
            <button
              key={w}
              type="button"
              className="tag-chip is-on"
              onClick={() => setTagWords((ts) => ts.filter((t) => t !== w))}
              title="remove tag"
            >
              {w} <span aria-hidden>×</span>
            </button>
          ))}
          <input
            className="tag-bar-input"
            value={tagDraft}
          disabled={pending}
            placeholder="add a tag…"
            autoComplete="off"
            onChange={(e) => setTagDraft(e.target.value)}
            onFocus={() => setTagFocused(true)}
            onBlur={() => setTimeout(() => setTagFocused(false), 120)}
            onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); addTag(tagDraft); } }}
          />
          {tagFocused && tagSuggest.length > 0 && (
            <div className="tag-suggest">
              {tagSuggest.map((t) => (
                <button
                  key={t.id}
                  type="button"
                  className="tag-chip"
                  onMouseDown={(e) => e.preventDefault()}
                  onClick={() => addTag(t.word)}
                >
                  {t.word}
                </button>
              ))}
            </div>
          )}
        </span>
      </div>

      <textarea
        ref={noteRef}
        className="intake-note"
        value={note}
        rows={2}
        disabled={pending} /* the hunt's #1: words typed DURING the add were wiped by the
          success-reset with no recovery (the mirror then dropped the draft too). A locked
          box for the sub-second of "adding…" is honest; typing resumes on focus after. */
        placeholder="Jot a note, or paste a link…"
        aria-label="Add to inbox"
        onChange={(e) => setNote(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) { e.preventDefault(); add(); }
        }}
      />

      <div className="intake-foot">
        <label className="intake-quote">
          <input type="checkbox" checked={asQuote} onChange={(e) => setAsQuote(e.target.checked)} />
          as a quote
        </label>
        {err && <span className="intake-err">{err}</span>}
        <span className="intake-actions">
          {/* Shown only when there's something to lose. Says "clear" — the two × marks
              already on this box mean narrower things (drop the source, drop a tag). */}
          {anything && (
            <button className="compose-btn" type="button" disabled={pending} onClick={resetBox}>
              clear
            </button>
          )}
          <button
            className="compose-btn is-primary"
            type="button"
            disabled={pending || !note.trim()}
            onClick={add}
          >
            {pending ? "adding…" : "add"}
          </button>
        </span>
      </div>
    </div>
  );
}
