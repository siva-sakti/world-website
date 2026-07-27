"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { renameTag, mergeTags, deleteTag, type ManagedTag } from "@/lib/db/tags";

// The tag manager (§3e): rename (free, follows everywhere), merge (dedupes by
// construction), delete (with a count that reckons with the frozen — I-T2).
export function TagManager({ initial }: { initial: ManagedTag[] }) {
  const [tags, setTags] = useState<ManagedTag[]>(initial);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [draft, setDraft] = useState("");
  const [note, setNote] = useState<string | null>(null);
  const [supabase] = useState(() => createClient());

  function countLabel(t: ManagedTag): string {
    const parts = [`${t.world} ${t.world === 1 ? "thing" : "things"}`];
    if (t.trash > 0) parts.push(`${t.trash} in trash`);
    return parts.join(" + ");
  }

  async function saveRename(t: ManagedTag) {
    const w = draft.trim();
    if (!w || w === t.word) { setEditingId(null); return; }
    try {
      await renameTag(supabase, t.id, w);
      setTags((ts) => ts.map((x) => (x.id === t.id ? { ...x, word: w } : x)));
      setEditingId(null); // close only after a successful rename
    } catch (e) {
      const code = (e as { code?: string })?.code;
      setNote(
        code === "23505"
          ? `“${w}” already exists — use “merge into” instead of renaming.`
          : "Couldn't rename that tag.",
      );
      // keep the field open so the typed word survives the error
    }
  }

  async function doMerge(from: ManagedTag, intoId: string) {
    const into = tags.find((t) => t.id === intoId);
    if (!into) return;
    if (!confirm(`Merge “${from.word}” into “${into.word}”? Everything tagged “${from.word}” (${countLabel(from)}) will become “${into.word}”. This can't be undone.`))
      return;
    try {
      await mergeTags(supabase, from.id, into.id);
      setTags((ts) =>
        ts
          .filter((t) => t.id !== from.id)
          .map((t) => (t.id === into.id ? { ...t, world: t.world + from.world, trash: t.trash + from.trash } : t)),
      );
      setNote(`Merged “${from.word}” into “${into.word}”.`);
    } catch {
      setNote("Couldn't merge those tags.");
    }
  }

  async function doDelete(t: ManagedTag) {
    if (!confirm(`Delete the tag “${t.word}”? ${countLabel(t)} will lose it (the things themselves stay). This can't be undone.`))
      return;
    try {
      await deleteTag(supabase, t.id);
      setTags((ts) => ts.filter((x) => x.id !== t.id));
      setNote(`Deleted “${t.word}”.`);
    } catch {
      setNote("Couldn't delete that tag.");
    }
  }

  if (tags.length === 0) {
    return <p className="text-neutral-500">No tags yet — tag some notes on a board first.</p>;
  }

  return (
    <div>
      {note && (
        <p className="mb-4 text-sm text-neutral-600">
          {note}{" "}
          <button className="underline" onClick={() => setNote(null)}>
            ok
          </button>
        </p>
      )}
      <ul className="divide-y divide-neutral-100">
        {tags.map((t) => (
          <li key={t.id} className="flex flex-wrap items-baseline justify-between gap-3 py-3">
            <span className="flex items-baseline gap-3">
              {editingId === t.id ? (
                <input
                  autoFocus
                  value={draft}
                  onChange={(e) => setDraft(e.target.value)}
                  onBlur={() => saveRename(t)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") saveRename(t);
                    if (e.key === "Escape") setEditingId(null);
                  }}
                  className="w-40 border-b border-neutral-300 bg-transparent outline-none focus:border-neutral-900"
                />
              ) : (
                <button
                  className="font-medium hover:underline underline-offset-4"
                  title="rename"
                  onClick={() => {
                    setEditingId(t.id);
                    setDraft(t.word);
                  }}
                >
                  {t.word}
                </button>
              )}
              <span className="text-xs text-neutral-400">{countLabel(t)}</span>
            </span>
            <span className="flex items-baseline gap-3 text-sm">
              <select
                value=""
                onChange={(e) => e.target.value && doMerge(t, e.target.value)}
                className="border-b border-neutral-200 bg-transparent text-neutral-500 outline-none"
                title="merge into another tag"
              >
                <option value="">merge into…</option>
                {tags
                  .filter((o) => o.id !== t.id)
                  .map((o) => (
                    <option key={o.id} value={o.id}>
                      {o.word}
                    </option>
                  ))}
              </select>
              <button
                onClick={() => doDelete(t)}
                className="text-neutral-400 underline underline-offset-4 hover:text-red-700"
              >
                delete
              </button>
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}
