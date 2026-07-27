"use client";

import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { listSources, type Source } from "@/lib/db/sources";
import { listTags, type TagChoice } from "@/lib/db/tags";
import { addToInbox } from "./actions";

// The intake (plan §5 Stage 2, + the reset/tags pass): pile notes under a source,
// with tags, from one calm box. Source and tags autosuggest; both apply on add
// whether or not you pressed Enter (nothing typed is silently dropped), and the
// whole box RESETS after each add — note cleared, textarea shrunk, source + tags
// wiped — so the next note starts fresh. "As a quote" is formatting (a blockquote).
type Sticky = { name: string; url: string | null };

export function Intake() {
  const [supabase] = useState(() => createClient());
  const [sources, setSources] = useState<Source[]>([]);
  const [tagMenu, setTagMenu] = useState<TagChoice[]>([]);
  const [sticky, setSticky] = useState<Sticky | null>(null);
  const [draft, setDraft] = useState(""); // the source input
  const [focused, setFocused] = useState(false);
  const [note, setNote] = useState("");
  const [asQuote, setAsQuote] = useState(false);
  const [tagWords, setTagWords] = useState<string[]>([]);
  const [tagDraft, setTagDraft] = useState("");
  const [tagFocused, setTagFocused] = useState(false);
  const [pending, setPending] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const noteRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    let alive = true;
    listSources(supabase).then((l) => alive && setSources(l)).catch(() => {});
    listTags(supabase).then((l) => alive && setTagMenu(l)).catch(() => {});
    return () => { alive = false; };
  }, [supabase]);

  // Auto-grow the note box to fit its text. Because this runs on every `note` change
  // (including the reset to "" after add), it deterministically SHRINKS back too —
  // no scrollHeight race: useLayoutEffect measures after the DOM has the new value.
  useLayoutEffect(() => {
    const el = noteRef.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = `${el.scrollHeight}px`;
  }, [note]);

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
    const res = await addToInbox({ note: body, asQuote, sourceName, sourceUrl, tags });
    setPending(false);
    if (res.error) { setErr(res.error); return; }
    // Full reset — a fresh box for the next note (the "better reset").
    setNote("");
    setAsQuote(false);
    setSticky(null);
    setDraft("");
    setTagWords([]);
    setTagDraft("");
    noteRef.current?.focus();
  }

  const q = draft.trim().toLowerCase();
  const sourceSuggest = sources.filter((s) => !q || s.name.toLowerCase().includes(q)).slice(0, 10);
  const tq = tagDraft.trim().toLowerCase();
  const tagSuggest = tagMenu
    .filter(
      (t) =>
        (!tq || t.word.toLowerCase().includes(tq)) &&
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
        <button
          className="compose-btn is-primary"
          type="button"
          disabled={pending || !note.trim()}
          onClick={add}
        >
          {pending ? "adding…" : "add"}
        </button>
      </div>
    </div>
  );
}
