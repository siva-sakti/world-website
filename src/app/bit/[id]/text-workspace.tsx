"use client";

import { useEffect, useRef, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { updateBitBody } from "@/lib/db/bits";
import { reconcileReferences, extractRefIds } from "@/lib/db/references";
import { TextBit, type GatherTarget } from "@/app/board/[id]/text-bit";
import { registerSave } from "@/lib/save-guard";

// The editable body on the bit/note workspace — an always-editing TextBit (rich
// text) that debounce-saves to bit.body at the board's cadence (~350ms). Rendered
// through the tiptap pipeline, never raw HTML, so rich-text links and gather chips
// render (plan finding #6).
//
// A pending edit is flushed THREE ways so it can't be lost: on unmount (leaving
// the page), from the save guard (the tab hidden / the app switched / the page
// closed), and by the timer itself. It says what it's doing — "saving…" then
// "saved" — because a silent save is indistinguishable from a broken one.
export function TextWorkspace({
  bitId,
  initialBody,
  onReady,
  onSaved,
}: {
  bitId: string;
  initialBody: string;
  // Both additive and optional (N4b) — the bit page passes neither.
  onReady?: (api: { gather: (t: GatherTarget) => void }) => void;
  onSaved?: (html: string) => void; // the body as it goes to the db, at save cadence
}) {
  const [supabase] = useState(() => createClient());
  const [err, setErr] = useState<string | null>(null);
  const [status, setStatus] = useState<"idle" | "saving" | "saved">("idle");
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const latest = useRef(initialBody);

  function flush() {
    timer.current = null;
    const body = latest.current;
    // The write goes FIRST — nothing may precede it. This function also runs from
    // the unmount cleanup and the save guard, where anything that threw ahead of
    // the write would silently lose the writing.
    const write = updateBitBody(supabase, bitId, body).then(() =>
      // Reconcile the `[[` chips into `reference` rows (the two-write step; a
      // failed reconcile self-heals on the next save/read — plan risk 1).
      reconcileReferences(supabase, bitId, extractRefIds(body)),
    );
    setStatus("saving");
    write
      .then(() => {
        setStatus("saved");
        setErr(null);
      })
      .catch((e) => {
        console.error("save body failed:", e);
        setErr("Couldn't save — keep typing, we'll retry.");
        setStatus("idle");
      });
    // Then tell the parent what the writing says — the note page reads its `[[`
    // chips from this to mark drawer rows "gathered". Guarded: a listener must
    // never be able to break saving.
    try {
      onSaved?.(body);
    } catch {
      /* a mark that didn't update is not worth losing writing over */
    }
  }

  /** Write now if anything is waiting. Safe to call twice — it writes the current
   *  body, so a repeat is a no-op write, never damage. */
  function flushPending() {
    if (!timer.current) return;
    clearTimeout(timer.current);
    flush();
  }

  function onChange(html: string) {
    latest.current = html;
    setErr(null);
    setStatus("idle");
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(flush, 350);
  }

  // One stable door to the latest flushPending, for the two escape hatches below.
  const leave = useRef(flushPending);
  // eslint-disable-next-line react-hooks/refs -- latest-callback ref: the listeners below are registered once
  leave.current = flushPending;

  // The tab hidden · the app switched · the page closed (lib/save-guard).
  useEffect(() => registerSave(() => leave.current()), []);
  // Leaving this page.
  useEffect(() => () => leave.current(), []);

  return (
    <div className="rounded-md border border-neutral-200 p-4">
      <TextBit html={initialBody} editing onChange={onChange} selfBitId={bitId} onReady={onReady} />
      {err ? (
        <p className="save-note is-err" role="status">
          {err}
        </p>
      ) : status !== "idle" ? (
        <p className="save-note" role="status">
          {status === "saving" ? "saving…" : "saved"}
        </p>
      ) : null}
    </div>
  );
}
