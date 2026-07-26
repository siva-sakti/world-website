"use client";

import { useEffect, useRef, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { updateBitBody } from "@/lib/db/bits";
import { TextBit } from "@/app/board/[id]/text-bit";

// The editable body on the bit workspace — an always-editing TextBit (rich text)
// that debounce-saves to bit.body at the board's cadence (~350ms). Rendered through
// the tiptap pipeline, never raw HTML, so rich-text links (and future gather chips)
// render (plan finding #6). A pending edit flushes on unmount so nothing is lost.
export function TextWorkspace({
  bitId,
  initialBody,
}: {
  bitId: string;
  initialBody: string;
}) {
  const [supabase] = useState(() => createClient());
  const [err, setErr] = useState<string | null>(null);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const latest = useRef(initialBody);

  function flush() {
    timer.current = null;
    updateBitBody(supabase, bitId, latest.current).catch((e) => {
      console.error("save body failed:", e);
      setErr("Couldn't save — keep typing, we'll retry.");
    });
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
      <TextBit html={initialBody} editing onChange={onChange} />
      {err && <p className="mt-1 text-xs text-red-700">{err}</p>}
    </div>
  );
}
