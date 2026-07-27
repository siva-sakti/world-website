"use client";

import { useEffect, useRef, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { listSources, type Source } from "@/lib/db/sources";
import { addToInbox } from "./actions";

// The intake (plan §5 Stage 2): pile notes under a source. Pick/enter a source and
// it stays STICKY (a "capturing from …" chip) so several notes land under one source
// without re-picking; × returns to sourceless jotting. Each add makes a LOOSE text
// bit carrying that source (setSource, pick-or-create). "As a quote" is formatting —
// a blockquote — not a new kind. Fast + calm: a pile you fill, not a form.
type Sticky = { name: string; url: string | null };

export function Intake() {
  const [supabase] = useState(() => createClient());
  const [sources, setSources] = useState<Source[]>([]);
  const [sticky, setSticky] = useState<Sticky | null>(null);
  const [draft, setDraft] = useState(""); // the source input
  const [focused, setFocused] = useState(false);
  const [note, setNote] = useState("");
  const [asQuote, setAsQuote] = useState(false);
  const [pending, setPending] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const noteRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    let alive = true;
    listSources(supabase)
      .then((list) => alive && setSources(list))
      .catch(() => {});
    return () => { alive = false; };
  }, [supabase]);

  function grow() {
    const el = noteRef.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = `${el.scrollHeight}px`;
  }

  function pickSource(name: string, url: string | null) {
    const nm = name.trim();
    if (!nm) return;
    setSticky({ name: nm, url });
    setDraft("");
    setFocused(false);
    noteRef.current?.focus();
  }

  async function add() {
    const body = note.trim();
    if (!body || pending) return;
    setPending(true);
    setErr(null);
    const res = await addToInbox({
      note: body,
      asQuote,
      sourceName: sticky?.name ?? null,
      sourceUrl: sticky?.url ?? null,
    });
    setPending(false);
    if (res.error) { setErr(res.error); return; }
    // Clear the note, KEEP the sticky source — pile the next piece under it.
    setNote("");
    setAsQuote(false);
    requestAnimationFrame(grow);
    noteRef.current?.focus();
  }

  const q = draft.trim().toLowerCase();
  const suggestions = sources
    .filter((s) => !q || s.name.toLowerCase().includes(q))
    .slice(0, 10);

  return (
    <div className="intake">
      {sticky ? (
        <div className="intake-source">
          <span className="tag-bar-label">capturing from</span>
          <button
            type="button"
            className="tag-chip is-on"
            onClick={() => setSticky(null)}
            title="stop capturing from this source"
          >
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
              placeholder="a book, a site, an author… (optional)"
              autoComplete="off"
              onChange={(e) => setDraft(e.target.value)}
              onFocus={() => setFocused(true)}
              onBlur={() => setTimeout(() => setFocused(false), 120)}
              onKeyDown={(e) => {
                if (e.key === "Enter") { e.preventDefault(); pickSource(draft, null); }
              }}
            />
            {focused && suggestions.length > 0 && (
              <div className="tag-suggest">
                {suggestions.map((s) => (
                  <button
                    key={s.id}
                    type="button"
                    className="tag-chip"
                    onMouseDown={(e) => e.preventDefault()}
                    onClick={() => pickSource(s.name, s.url)}
                    title="capture from this source"
                  >
                    {s.name}
                  </button>
                ))}
              </div>
            )}
          </span>
        </div>
      )}

      <textarea
        ref={noteRef}
        className="intake-note"
        value={note}
        rows={2}
        placeholder="Jot a note, or paste a link…"
        aria-label="Add to inbox"
        onChange={(e) => { setNote(e.target.value); grow(); }}
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
