"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { registerSave } from "@/lib/save-guard";
import { jumpWords, titleMatches } from "@/lib/jump-match";
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
// taggable; §3c — guided, never gating: tap an existing chip or type a new word).
// A chip has TWO halves: the word is THE PULL (→ everything carrying it) and the ×
// removes — it used to be one button that removed on any tap (flow review F1).
export function TagBar({ target, label = "tags", onTagAct, refreshSignal = 0 }: { target: TagTarget; label?: string;
  /** Board-only (undo §6): reports a landed tag act so the stack can record it.
   *  Unwired everywhere else — bit/note pages have no stack. */
  onTagAct?: (kind: "add" | "remove", tag: { id: string; word: string }) => void;
  /** Bumped by an undo/redo reverse — refetch so the reverse can repaint us. */
  refreshSignal?: number;
}) {
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
    // eslint-disable-next-line react-hooks/set-state-in-effect -- reset the loading flag when the target changes; results follow async
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
  }, [targetId, supabase, refreshSignal]);

  async function add(word: string, report = true) {
    const w = word.trim();
    setDraft("");
    setErr(null);
    if (!w || tags.some((t) => t.word.toLowerCase() === w.toLowerCase())) return;
    try {
      const tag = await applyTag(supabase, { ...target, word: w });
      if (report) onTagAct?.("add", tag); // AFTER the write lands — a failed add records nothing
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

  // Click-away that UNMOUNTS the bar (deselecting the card, switching cards) never
  // fires the input's blur — commit the typed word on unmount too, so it's applied,
  // not silently dropped. Refs keep the latest draft + add (post-unmount setStates
  // are no-ops; applyTag is idempotent).
  const commitRef = useRef<() => void>(() => {});
  // eslint-disable-next-line react-hooks/refs -- latest-callback ref: the unmount effect below commits the current draft
  commitRef.current = () => {
    const w = draft.trim();
    if (w) void add(w, false); // the unmount-commit carve (undo §6): never recorded
  };
  useEffect(() => {
    // Page-hide too (hunt #8): a phone backgrounding fires visibilitychange, not
    // blur and not unmount — the typed word must land then as well.
    const un = registerSave(() => commitRef.current());
    return () => {
      un();
      commitRef.current();
    };
  }, []);

  async function remove(tag: Tag) {
    setErr(null);
    setTags((ts) => ts.filter((t) => t.id !== tag.id));
    try {
      await removeTag(supabase, { ...target, tagId: tag.id });
      onTagAct?.("remove", tag); // AFTER the write lands
    } catch (e) {
      console.error("untag failed:", e);
      setTags((ts) => (ts.some((t) => t.id === tag.id) ? ts : [...ts, tag])); // put it back
      setErr("Couldn't remove that tag — try again.");
    }
  }

  const onBit = new Set(tags.map((t) => t.id));
  // Word-START matching (jump-match.ts): "art" surfaces "artist"/"article", never
  // "cartography" — while still completing as you type.
  const words = jumpWords(draft);
  const suggestions = all
    .filter((a) => !onBit.has(a.id) && titleMatches(a.word, words))
    .slice(0, 10);

  return (
    <div className="tag-bar" onPointerDown={(e) => e.stopPropagation()}>
      <span className="tag-bar-label">{label}</span>
      {/* THE PULL vs REMOVE (flow review F1). The whole chip used to be one button
          that DELETED the tag — no confirm, no undo — while the pull (tap a word,
          see everything carrying it) was wired in two places app-wide. Now the WORD
          is the pull and a separate × removes. Siblings, not nested: a <button>
          inside an <a> is invalid and swallows the click. */}
      {tags.map((t) => (
        <span key={t.id} className="tag-chip is-on">
          <Link
            href={`/search?tag=${t.id}`}
            className="tag-chip-word"
            title={`everything tagged “${t.word}”`}
          >
            {t.word}
          </Link>
          <button
            type="button"
            className="tag-chip-x"
            onClick={() => remove(t)}
            aria-label={`remove the tag ${t.word}`}
            title="remove this tag"
          >
            ×
          </button>
        </span>
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
