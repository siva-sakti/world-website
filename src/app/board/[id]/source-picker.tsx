"use client";

import { useEffect, useRef, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { jumpWords, titleMatches } from "@/lib/jump-match";
import {
  listSources,
  getBitSource,
  setSource,
  clearSource,
  type Source,
} from "@/lib/db/sources";

// The source editor for a bit (§3, §5c) — clones TagBar, SINGLE-select. Shows the
// bit's current "from …" (open ↗ when it has a url; × to clear) and a pick-or-create
// autosuggest over the sources list. One source per bit (bit.source_id); picking a
// new one replaces the old. `initial` seeds it so the workspace shows the source
// without a load flash.
export function SourcePicker({
  bitId,
  initial = null,
  label = "source",
  onChange,
}: {
  bitId: string;
  initial?: Source | null;
  label?: string;
  // Fired when the bit's source is picked/created (the Source) or cleared (null).
  // Optional — the note/bit pages don't pass it; the board card uses it to refresh
  // its resting "from …" stamp without a reload.
  onChange?: (source: Source | null) => void;
}) {
  const [supabase] = useState(() => createClient());
  const [current, setCurrent] = useState<Source | null>(initial);
  const [all, setAll] = useState<Source[]>([]);
  const [draft, setDraft] = useState("");
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);
  const [focused, setFocused] = useState(false); // suggestions collapse until you tap in

  useEffect(() => {
    let alive = true;
    // eslint-disable-next-line react-hooks/set-state-in-effect -- reset the loading flag when the target changes; results follow async
    setLoading(true);
    Promise.all([
      listSources(supabase),
      initial ? Promise.resolve(initial) : getBitSource(supabase, bitId),
    ])
      .then(([list, cur]) => {
        if (!alive) return;
        setAll(list);
        setCurrent(cur);
        setLoading(false);
      })
      .catch(() => alive && setLoading(false));
    return () => {
      alive = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [bitId, supabase]);

  async function pick(name: string) {
    const nm = name.trim();
    setDraft("");
    setErr(null);
    if (!nm) return;
    try {
      const src = await setSource(supabase, bitId, nm);
      setCurrent(src);
      onChange?.(src);
      setAll((a) => (a.some((s) => s.id === src.id) ? a : [src, ...a]));
    } catch (e) {
      console.error("set source failed:", e);
      setErr("Couldn't set that source — try again.");
    }
  }

  // Unmount (deselect / card switch) never fires blur — commit the typed source on
  // unmount too, so it's applied, not silently dropped (mirrors tag-bar).
  const commitRef = useRef<() => void>(() => {});
  // eslint-disable-next-line react-hooks/refs -- latest-callback ref: the unmount effect below commits the current draft
  commitRef.current = () => {
    const nm = draft.trim();
    if (nm) void pick(nm);
  };
  useEffect(() => () => commitRef.current(), []);

  async function clear() {
    setErr(null);
    const prev = current;
    setCurrent(null);
    onChange?.(null);
    try {
      await clearSource(supabase, bitId);
    } catch (e) {
      console.error("clear source failed:", e);
      setCurrent(prev); // put it back
      onChange?.(prev); // and the card's resting stamp with it
      setErr("Couldn't clear the source — try again.");
    }
  }

  // Word-START matching (jump-match.ts): each typed word must begin a word in the
  // source name — "art" → "Artforum", never "cartography" — still completing as you type.
  const words = jumpWords(draft);
  const suggestions = all
    .filter((s) => s.id !== current?.id && titleMatches(s.name, words))
    .slice(0, 10);

  return (
    <div className="tag-bar" onPointerDown={(e) => e.stopPropagation()}>
      <span className="tag-bar-label">{label}</span>
      {current && (
        <span className="source-current">
          <button className="tag-chip is-on" onClick={clear} title="clear source">
            {current.name} <span aria-hidden>×</span>
          </button>
          {current.url && (
            <a
              className="source-open"
              href={current.url}
              target="_blank"
              rel="noreferrer"
              title="open source"
            >
              ↗
            </a>
          )}
        </span>
      )}
      <span className="tag-bar-field">
        <input
          className="tag-bar-input"
          value={draft}
          placeholder={loading ? "loading…" : current ? "change source" : "＋ source"}
          onChange={(e) => setDraft(e.target.value)}
          onFocus={() => setFocused(true)}
          // Commit a typed source on blur too — click-away saves, never lingers
          // un-applied. (Suggestion buttons preventDefault mousedown, so a pick-click
          // keeps focus and wins; an empty draft is a no-op in pick().)
          onBlur={() => { pick(draft); setTimeout(() => setFocused(false), 120); }}
          onKeyDown={(e) => {
            if (e.key === "Enter") pick(draft);
          }}
        />
        {focused && suggestions.length > 0 && (
          <div className="tag-suggest">
            {suggestions.map((s) => (
              <button
                key={s.id}
                className="tag-chip"
                onMouseDown={(e) => e.preventDefault()} // keep the input focused on pick
                onClick={() => pick(s.name)}
                title="use this source"
              >
                {s.name}
              </button>
            ))}
          </div>
        )}
      </span>
      {err && <span className="text-xs text-red-700">{err}</span>}
    </div>
  );
}
