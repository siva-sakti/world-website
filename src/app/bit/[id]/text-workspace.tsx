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
  // What the DB is known to hold, and what a write currently in flight is carrying.
  // `saved` MUST start at initialBody: starting empty would make the first mount
  // look dirty and write a stale body over the real one (review F2).
  const saved = useRef(initialBody);
  const writing = useRef<string | null>(null);
  // Per-editor write chain — the same ordering fix the board's persistence got
  // (R1.4): without it, typing "A" then "B" can land B-then-A on a slow link and
  // the DB keeps "A" while the screen says "saved".
  const chain = useRef<Promise<void>>(Promise.resolve());

  function flush() {
    timer.current = null;
    const body = latest.current;
    writing.current = body;
    setStatus("saving");
    // Chained: this write waits for the previous one, so two saves can never
    // reorder on the wire. The write goes FIRST — nothing may precede it.
    const run = chain.current.then(async () => {
      await updateBitBody(supabase, bitId, body);
      // Mark saved HERE — after the body lands, before the chip reconcile. If we
      // waited for reconcile, a body that saved fine but whose reconcile failed
      // would stay dirty forever: re-writing an identical body on every flush while
      // the banner claims "couldn't save" about writing that DID save (F2).
      saved.current = body;
      // Reconcile the `[[` chips into `reference` rows (the two-write step; a
      // failed reconcile is retried by the next save — accepted, plan risk 1).
      await reconcileReferences(supabase, bitId, extractRefIds(body));
    });
    chain.current = run.catch(() => {}); // settled-safe tail: one failure can't block the next write
    run
      .then(() => {
        setStatus("saved");
        setErr(null);
      })
      .catch((e) => {
        console.error("save body failed:", e);
        setErr("Couldn't save — keep typing, we'll retry.");
        setStatus("idle");
      })
      .finally(() => {
        if (writing.current === body) writing.current = null;
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

  /** Write now if anything is UNSAVED. Keyed on dirtiness, not on a pending timer:
   *  `flush()` clears the timer at entry, so the old timer check made both escape
   *  hatches dead after a FAILED save — the editor promised "we'll retry" and then
   *  couldn't (review F2, a real loss path). Safe to call twice: a body already
   *  written, or already in flight, is skipped. */
  function flushPending() {
    if (timer.current) clearTimeout(timer.current);
    timer.current = null;
    if (latest.current === saved.current) return; // nothing new
    if (latest.current === writing.current) return; // already on the wire
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
