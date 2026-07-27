"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import {
  listTags,
  getThingTags,
  applyTag,
  removeTag,
  type Tag,
  type TagChoice,
  type TagTarget,
} from "@/lib/db/tags";

// The tag editor for a selected note OR the board itself (§3a — anything is
// taggable; §3c — guided, never gating: tap an existing chip or type a new word;
// tap a chip to remove it).
export function TagBar({ target, label = "tags" }: { target: TagTarget; label?: string }) {
  const [supabase] = useState(() => createClient());
  const [tags, setTags] = useState<Tag[]>([]);
  const [all, setAll] = useState<TagChoice[]>([]);
  const [draft, setDraft] = useState("");
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);
  const [focused, setFocused] = useState(false); // suggestions collapse until you tap in
  const targetId = "bitId" in target ? target.bitId : target.boardId;

  useEffect(() => {
    let alive = true;
    setLoading(true);
    Promise.all([getThingTags(supabase, target), listTags(supabase)])
      .then(([bt, at]) => {
        if (!alive) return;
        setTags(bt);
        setAll(at);
        setLoading(false);
      })
      .catch(() => alive && setLoading(false));
    return () => {
      alive = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [targetId, supabase]);

  async function add(word: string) {
    const w = word.trim();
    setDraft("");
    setErr(null);
    if (!w || tags.some((t) => t.word.toLowerCase() === w.toLowerCase())) return;
    try {
      const tag = await applyTag(supabase, { ...target, word: w });
      setTags((ts) => (ts.some((t) => t.id === tag.id) ? ts : [...ts, tag]));
      setAll((a) =>
        a.some((x) => x.id === tag.id)
          ? a
          : [{ id: tag.id, word: tag.word, count: 1, lastUsed: new Date().toISOString() }, ...a],
      );
    } catch (e) {
      console.error("tag failed:", e);
      setErr("Couldn't add that tag — try again.");
    }
  }

  async function remove(tag: Tag) {
    setErr(null);
    setTags((ts) => ts.filter((t) => t.id !== tag.id));
    try {
      await removeTag(supabase, { ...target, tagId: tag.id });
    } catch (e) {
      console.error("untag failed:", e);
      setTags((ts) => (ts.some((t) => t.id === tag.id) ? ts : [...ts, tag])); // put it back
      setErr("Couldn't remove that tag — try again.");
    }
  }

  const onBit = new Set(tags.map((t) => t.id));
  const q = draft.trim().toLowerCase();
  const suggestions = all
    .filter((a) => !onBit.has(a.id) && (!q || a.word.toLowerCase().includes(q)))
    .slice(0, 10);

  return (
    <div className="tag-bar" onPointerDown={(e) => e.stopPropagation()}>
      <span className="tag-bar-label">{label}</span>
      {tags.map((t) => (
        <button key={t.id} className="tag-chip is-on" onClick={() => remove(t)} title="remove tag">
          {t.word} <span aria-hidden>×</span>
        </button>
      ))}
      <span className="tag-bar-field">
        <input
          className="tag-bar-input"
          value={draft}
          placeholder={loading ? "loading…" : "＋ tag"}
          onChange={(e) => setDraft(e.target.value)}
          onFocus={() => setFocused(true)}
          // Commit a typed tag on blur too — click-away saves, never lingers
          // un-applied. (Suggestion buttons preventDefault mousedown, so a pick-click
          // keeps focus and wins; an empty/dupe draft is a no-op in add().)
          onBlur={() => { add(draft); setTimeout(() => setFocused(false), 120); }}
          onKeyDown={(e) => {
            if (e.key === "Enter") add(draft);
          }}
        />
        {focused && suggestions.length > 0 && (
          <div className="tag-suggest">
            {suggestions.map((s) => (
              <button
                key={s.id}
                className="tag-chip"
                onMouseDown={(e) => e.preventDefault()} // keep the input focused on pick
                onClick={() => add(s.word)}
                title="add tag"
              >
                {s.word}
              </button>
            ))}
          </div>
        )}
      </span>
      {err && <span className="text-xs text-red-700">{err}</span>}
    </div>
  );
}
