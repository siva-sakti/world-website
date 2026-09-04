"use client";

import { useEffect, useRef, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { updateBoardDescription } from "@/lib/db/boards";
import { registerSave } from "@/lib/save-guard";

// The board's optional description — a quiet subtitle under the title (B+). Clones
// BitTitle's debounced + save-guard pattern (NOT BoardTitle's blur-only save, which
// once lost text): debounce 600ms, flush on blur / page-hide / unmount; Esc reverts;
// empty saves as none.
export function BoardDescription({ boardId, initial }: { boardId: string; initial: string }) {
  const [supabase] = useState(() => createClient());
  const [draft, setDraft] = useState(initial);
  const saved = useRef(initial);
  const latest = useRef(initial);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [err, setErr] = useState(false);
  // Per-field write chain — the same ordering rule the board's save queue has (R1.4).
  // Without it each save fired independently: type, blur, type, blur inside the debounce
  // and the FIRST request could land LAST, leaving the database on the old words while
  // the screen shows the new ones — and `saved` already matching, so nothing ever retried.
  // Found by an antagonist review, 2026-09-03; the same bug class as the board's P2.
  const chain = useRef<Promise<void>>(Promise.resolve());

  function save() {
    timer.current = null;
    const next = latest.current;
    if (next.trim() === saved.current.trim()) return;
    const run = chain.current.then(async () => {
      await updateBoardDescription(supabase, boardId, next);
      saved.current = next;
    });
    chain.current = run.catch(() => {}); // settled-safe tail: one failure can't block the next write
    run.then(() => setErr(false)).catch(() => setErr(true));
  }
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

  const leave = useRef(savePending);
  // eslint-disable-next-line react-hooks/refs -- latest-callback ref: registered once
  leave.current = savePending;
  useEffect(() => registerSave(() => leave.current()), []);
  useEffect(() => () => leave.current(), []);

  return (
    <div className="board-desc">
      <input
        value={draft}
        placeholder="a line about this board — optional"
        className="board-desc-input"
        aria-label="board description"
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
          Couldn&rsquo;t save the description — check your connection.
        </p>
      )}
    </div>
  );
}
