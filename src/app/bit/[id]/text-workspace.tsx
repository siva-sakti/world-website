"use client";

import { useEffect, useRef, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { updateBitBody } from "@/lib/db/bits";
import { reconcileReferences, extractRefIds } from "@/lib/db/references";
import { TextBit, type GatherTarget } from "@/app/board/[id]/text-bit";

// The editable body on the bit workspace — an always-editing TextBit (rich text)
// that debounce-saves to bit.body at the board's cadence (~350ms). Rendered through
// the tiptap pipeline, never raw HTML, so rich-text links (and future gather chips)
// render (plan finding #6). A pending edit flushes on unmount so nothing is lost.
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
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const latest = useRef(initialBody);

  function flush() {
    timer.current = null;
    const body = latest.current;
    // Save the body, then reconcile its `[[` chips into `reference` rows (the two-
    // write step; a failed reconcile self-heals on next save/read — plan risk 1).
    // NOTHING runs before this write: a listener that threw would silently skip
    // the save, and this function also runs from the unmount cleanup.
    updateBitBody(supabase, bitId, body)
      .then(() => reconcileReferences(supabase, bitId, extractRefIds(body)))
      .catch((e) => {
        console.error("save body failed:", e);
        setErr("Couldn't save — keep typing, we'll retry.");
      });
    // Then tell the parent what the writing says — the note page reads its `[[`
    // chips from this to mark drawer rows "gathered", at save cadence rather than
    // per keystroke. Guarded: a listener must never be able to break saving.
    try {
      onSaved?.(body);
    } catch {
      /* a mark that didn't update is not worth losing writing over */
    }
  }

  function onChange(html: string) {
    latest.current = html;
    setErr(null);
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(flush, 350);
  }

  useEffect(() => {
    return () => {
      if (timer.current) {
        clearTimeout(timer.current);
        flush();
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="rounded-md border border-neutral-200 p-4">
      <TextBit html={initialBody} editing onChange={onChange} selfBitId={bitId} onReady={onReady} />
      {err && <p className="mt-1 text-xs text-red-700">{err}</p>}
    </div>
  );
}
