"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { updateBitContent, trashBit, getBitBoards } from "@/lib/db/bits";
import { confirm } from "@/components/confirm";

// The note's own words above its body (plan v1.2): the same `content` field the
// board card edits (D-087) — a text bit's optional TITLE / a media bit's caption.
// Saves on Enter/blur; Esc reverts; empty saves as "no words" (P5).
export function BitTitle({
  bitId,
  initial,
  placeholder,
}: {
  bitId: string;
  initial: string;
  placeholder: string;
}) {
  const [supabase] = useState(() => createClient());
  const [draft, setDraft] = useState(initial);
  const saved = useRef(initial);
  const [err, setErr] = useState(false);

  function save() {
    if (draft.trim() === saved.current.trim()) return;
    const next = draft;
    updateBitContent(supabase, bitId, next)
      .then(() => {
        saved.current = next;
        setErr(false);
      })
      .catch(() => setErr(true));
  }

  return (
    <div>
      <input
        value={draft}
        placeholder={placeholder}
        className="page-title-input"
        onChange={(e) => setDraft(e.target.value)}
        onBlur={save}
        onKeyDown={(e) => {
          if (e.key === "Enter") (e.target as HTMLInputElement).blur();
          if (e.key === "Escape") setDraft(saved.current);
        }}
      />
      {err && (
        <p className="mt-1 text-xs text-red-700" role="status">
          Couldn&rsquo;t save the title — check your connection.
        </p>
      )}
    </div>
  );
}

// Trash, from the note's own page — the same honest multi-board confirm the board
// uses (F16), the same one-door act. Afterwards you land in your notes (the inbox):
// the page you were on no longer shows its note.
export function BitTrash({ bitId }: { bitId: string }) {
  const [supabase] = useState(() => createClient());
  const router = useRouter();
  const [busy, setBusy] = useState(false);

  async function onTrash() {
    let n = 1;
    try {
      n = (await getBitBoards(supabase, bitId)).length;
    } catch {
      /* fall back to the plain confirm */
    }
    const msg =
      n > 1
        ? `This note is on ${n} boards — trashing removes it from all of them (restorable from Trash). Continue?`
        : `Move this note to the trash? Hidden everywhere, restorable from Trash.`;
    if (!(await confirm({ message: msg, confirmLabel: "Trash", danger: true }))) return;
    setBusy(true);
    try {
      await trashBit(supabase, bitId);
      router.push("/notes");
      router.refresh();
    } catch {
      setBusy(false);
    }
  }

  return (
    <button
      className="text-neutral-500 underline underline-offset-4 hover:no-underline disabled:opacity-50"
      onClick={onTrash}
      disabled={busy}
      title="Move this note to the trash — hidden everywhere, restorable"
    >
      {busy ? "trashing…" : "trash"}
    </button>
  );
}
