"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { renameBoard } from "@/lib/db/boards";

// Click the board's name to rename it, inline. Enter/blur saves; Esc cancels.
// Untitled boards stay legal (§5) — clearing the field saves "no title".
export function BoardTitle({
  boardId,
  title,
}: {
  boardId: string;
  title: string | null;
}) {
  const [value, setValue] = useState(title ?? "");
  const [editing, setEditing] = useState(false);
  const [saved, setSaved] = useState(title ?? "");
  const [supabase] = useState(() => createClient());

  async function save() {
    setEditing(false);
    const next = value.trim();
    if (next === saved.trim()) return;
    try {
      await renameBoard(supabase, boardId, next || null);
      setSaved(next);
    } catch (e) {
      console.error("rename failed:", e);
      setValue(saved); // revert; the header never lies about what's stored
    }
  }

  if (editing) {
    return (
      <input
        autoFocus
        value={value}
        placeholder="untitled board"
        onChange={(e) => setValue(e.target.value)}
        onBlur={save}
        onKeyDown={(e) => {
          if (e.key === "Enter") save();
          if (e.key === "Escape") {
            setValue(saved);
            setEditing(false);
          }
        }}
        className="w-48 border-b border-neutral-300 bg-transparent text-sm outline-none focus:border-neutral-900"
      />
    );
  }
  return (
    <button
      onClick={() => setEditing(true)}
      title="Rename this board"
      className={`text-sm ${value ? "text-neutral-700" : "text-neutral-400 italic"} hover:underline underline-offset-4`}
    >
      {value || "untitled board — name it"}
    </button>
  );
}
