"use client";

import { useRef, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { createLooseTextBit, updateBitBody } from "@/lib/db/bits";
import { reconcileReferences, extractRefIds } from "@/lib/db/references";
import { TextBit } from "@/app/board/[id]/text-bit";

// The writer behind /write. The loose bit is born on the FIRST real content — no
// empty-note litter from opening the page and leaving — guarded by a SYNCHRONOUS
// ref (per-keystroke onChange would double-create through async state; review
// finding 2). Every save AWAITS that create: updateBitBody doesn't assert rows, so
// a flush racing the insert would 0-row-update and silently eat the first words
// (review finding 1 — the same settled-create rule the board's persistence
// enforces). Save = body + `[[`-chip reconcile, exactly the workspace flush pair.
export function QuickWrite() {
  const [supabase] = useState(() => createClient());
  const [err, setErr] = useState<string | null>(null);
  // The born note's id as STATE — render reads this (status line, the picker's
  // self-exclusion); the ref twin below is for synchronous access in flush.
  const [selfId, setSelfId] = useState<string | null>(null);
  const bitId = useRef<string | null>(null);
  const create = useRef<Promise<unknown> | null>(null); // set before any await — the sync guard
  const latest = useRef("");
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  function onChange(html: string) {
    latest.current = html;
    if (!create.current) {
      // Real content = visible text or a gather chip (an all-chip note has no text).
      const hasContent =
        html.replace(/<[^>]+>/g, "").trim() !== "" || html.includes("data-ref");
      if (!hasContent) return;
      const id = crypto.randomUUID();
      bitId.current = id;
      create.current = createLooseTextBit(supabase, { bitId: id, body: html })
        .then(() => setSelfId(id))
        .catch((e) => {
          console.error("create note failed:", e);
          bitId.current = null;
          create.current = null; // the next keystroke retries with a fresh id
          setErr("Couldn't save — check your connection. Your words are still here.");
        });
    }
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(flush, 600);
  }

  async function flush() {
    if (!create.current) return;
    try {
      await create.current; // the settled gate — never write before the row exists
      const id = bitId.current;
      if (!id) return; // the create failed and reset; the retry path owns it now
      await updateBitBody(supabase, id, latest.current);
      await reconcileReferences(supabase, id, extractRefIds(latest.current));
      setErr(null);
    } catch (e) {
      console.error("save failed:", e);
      setErr("Couldn't save — check your connection. Your words are still here.");
    }
  }

  return (
    <div>
      <TextBit html="" editing onChange={onChange} selfBitId={selfId ?? undefined} />
      <p className="mt-4 text-xs text-neutral-400" role="status">
        {err ? (
          <span className="text-red-700">{err}</span>
        ) : selfId ? (
          "in your notes — it saves as you write"
        ) : (
          "start writing — it saves itself"
        )}
      </p>
    </div>
  );
}
