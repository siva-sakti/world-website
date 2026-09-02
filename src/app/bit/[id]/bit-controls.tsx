"use client";

import { useEffect, useRef, useState } from "react";
import { useAct, FailedNote } from "@/components/use-act";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { updateBitContent, trashBit, getBitBoards } from "@/lib/db/bits";
import { confirmTrash } from "@/app/trash/trash-confirm";
import { registerSave } from "@/lib/save-guard";

// The note's own words above its body (plan v1.2): the same `content` field the
// board card edits (D-087) — a text bit's optional TITLE / a media bit's caption.
// Esc reverts; empty saves as "no words" (P5).
//
// It used to save ONLY on Enter/blur, and that lost titles: hit back (or close the
// tab) while still in the field and React tears the input down without ever firing
// blur, so the title was never written. Now it also debounces like the body, and
// registers with the save guard — so leaving, hiding, or closing the page writes
// what you typed.
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
  const saved = useRef(initial); // what the db has
  const latest = useRef(initial); // what you've typed (a timer's closure can't see state)
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [err, setErr] = useState(false);

  function save() {
    timer.current = null;
    const next = latest.current;
    if (next.trim() === saved.current.trim()) return; // nothing changed
    updateBitContent(supabase, bitId, next)
      .then(() => {
        saved.current = next;
        setErr(false);
      })
      .catch(() => setErr(true));
  }

  /** Write now if anything is waiting. Safe to call twice. */
  function savePending() {
    if (timer.current) clearTimeout(timer.current);
    save();
  }

  function type(v: string) {
    setDraft(v);
    latest.current = v;
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(save, 600);
  }

  // One stable door to the latest savePending, for the escape hatches below.
  const leave = useRef(savePending);
  // eslint-disable-next-line react-hooks/refs -- latest-callback ref: registered once
  leave.current = savePending;
  // The tab hidden · the app switched · the page closed.
  useEffect(() => registerSave(() => leave.current()), []);
  // Leaving this page — the case that used to lose titles.
  useEffect(() => () => leave.current(), []);

  return (
    <div>
      <input
        value={draft}
        placeholder={placeholder}
        className="page-title-input"
        onChange={(e) => type(e.target.value)}
        onBlur={savePending}
        onKeyDown={(e) => {
          if (e.key === "Enter") (e.target as HTMLInputElement).blur();
          if (e.key === "Escape") {
            if (timer.current) clearTimeout(timer.current);
            timer.current = null;
            latest.current = saved.current;
            setDraft(saved.current);
          }
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

// (No kind toggle: a thing never changes type. A bit is always a bit, a note always
// a note — decided at birth (catch → bit · ✎ write → note). To write a piece from
// bits you saved, start a note and pull them in with `[[`. Ruled 2026-08-27.)

// Trash, from the note's own page — the same honest multi-board confirm the board
// uses (F16), the same one-door act. Afterwards you land in your notes (the inbox):
// the page you were on no longer shows its note.
export function BitTrash({
  bitId,
  returnTo = "/bits",
  compact = false,
  noun = "note",
}: {
  bitId: string;
  returnTo?: string;
  compact?: boolean; // small/grey to match a row's board-trash (home list); default = the page style
  /** What to CALL this in the confirm. Storage can't tell a note from a photo (bit rows
   *  hold both), so the page says. Defaults to "note" — right where this started, on the
   *  note page; /bit/[id] passes "bit". */
  noun?: string;
}) {
  const [supabase] = useState(() => createClient());
  const router = useRouter();
  // keepBusyOnSuccess: this leaves the page — see use-act.
  const { busy, failed, run } = useAct({ keepBusyOnSuccess: true });

  async function onTrash() {
    let n = 1;
    try {
      n = (await getBitBoards(supabase, bitId)).length;
    } catch {
      /* fall back to the plain confirm */
    }
    // THE one trash confirm (app/trash/trash-confirm) — shared with the board, /bits
    // and /write, so the same act asks the same question wherever you meet it.
    if (!(await confirmTrash({ noun, onBoards: n }))) return;
    await run(async () => {
      await trashBit(supabase, bitId);
      router.push(returnTo);
    });
  }

  return (
    <span>
      <button
        className={
          compact
            ? "text-xs text-neutral-400 hover:text-neutral-700 disabled:opacity-50"
            : "text-neutral-500 underline underline-offset-4 hover:no-underline disabled:opacity-50"
        }
        onClick={onTrash}
        disabled={busy}
        title={failed ? "that didn't save — try again" : "Move this note to the trash — hidden everywhere, restorable"}
      >
        {busy ? "trashing…" : "trash"}
      </button>
      <FailedNote failed={failed} />
    </span>
  );
}
