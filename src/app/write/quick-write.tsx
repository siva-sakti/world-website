"use client";

import { useRef, useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { createLooseTextBit, updateBitBody, updateBitContent } from "@/lib/db/bits";
import { reconcileReferences, extractRefIds } from "@/lib/db/references";
import { TextBit } from "@/app/board/[id]/text-bit";
import { PlaceOnBoard } from "@/app/bits/place-on-board";

// The writer behind /write. The loose bit is born on the FIRST real content — no
// empty-note litter from opening the page and leaving — guarded by a SYNCHRONOUS
// ref (per-keystroke onChange would double-create through async state; review
// finding 2). Every save AWAITS that create: updateBitBody doesn't assert rows, so
// a flush racing the insert would 0-row-update and silently eat the first words
// (review finding 1 — the same settled-create rule the board's persistence
// enforces). Save = body + `[[`-chip reconcile, exactly the workspace flush pair.
export function QuickWrite({ boards }: { boards: { id: string; title: string | null }[] }) {
  const [supabase] = useState(() => createClient());
  const [err, setErr] = useState<string | null>(null);
  const [placed, setPlaced] = useState(false); // v1.2 — writing can end with placing
  // The born note's id as STATE — render reads this (status line, the picker's
  // self-exclusion); the ref twin below is for synchronous access in flush.
  const [selfId, setSelfId] = useState<string | null>(null);
  const bitId = useRef<string | null>(null);
  const create = useRef<Promise<unknown> | null>(null); // set before any await — the sync guard
  const latest = useRef("");
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  // The optional title (plan v1.2): held locally until the note is BORN on first
  // body content (title alone never births — unchanged), then flushed to
  // bit.content (D-087 — the same field the board card and the note's page edit).
  const [title, setTitle] = useState("");
  const titleRef = useRef("");
  const titleSaved = useRef("");

  function flushTitle() {
    const id = bitId.current;
    const t = titleRef.current;
    if (!id || !create.current || t.trim() === titleSaved.current.trim()) return;
    create.current.then(() => {
      if (!bitId.current) return; // the create failed and reset
      updateBitContent(supabase, id, t)
        .then(() => (titleSaved.current = t))
        .catch(() => {}); // retried on the next blur/keystroke flush
    });
  }

  function onChange(html: string) {
    latest.current = html;
    if (!create.current) {
      // Real content = visible text or a gather chip (an all-chip note has no text).
      const hasContent =
        html.replace(/<[^>]+>/g, "").trim() !== "" || html.includes("data-ref");
      if (!hasContent) return;
      const id = crypto.randomUUID();
      bitId.current = id;
      create.current = createLooseTextBit(supabase, { bitId: id, body: html, kind: "note" })
        .then(() => {
          setSelfId(id);
          flushTitle(); // a title typed before the note was born lands now
        })
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
      <input
        value={title}
        placeholder="title — optional"
        className="page-title-input mb-3"
        onChange={(e) => {
          setTitle(e.target.value);
          titleRef.current = e.target.value;
        }}
        onBlur={flushTitle}
        onKeyDown={(e) => {
          if (e.key === "Enter") (e.target as HTMLInputElement).blur();
        }}
      />
      <div className="page-editor">
        <TextBit html="" editing onChange={onChange} selfBitId={selfId ?? undefined} />
      </div>
      <p className="mt-4 text-xs text-neutral-400" role="status">
        {err ? (
          <span className="text-red-700">{err}</span>
        ) : selfId ? (
          // Born — orientation doors (plan v1.2): where it lives, its own page,
          // and the finishing act: place it on a board right here.
          <span className="flex flex-wrap items-baseline gap-x-2 gap-y-1">
            {placed ? (
              // Placed = no longer loose — so no "in your notes" link (it would lie).
              <span>
                placed on its board ✓ ·{" "}
                <Link href={`/bit/${selfId}`} className="underline underline-offset-4 hover:no-underline">
                  open its page →
                </Link>
              </span>
            ) : (
              <>
                <span>
                  saved —{" "}
                  <Link href="/notes" className="underline underline-offset-4 hover:no-underline">
                    in your notes →
                  </Link>{" "}
                  ·{" "}
                  <Link href={`/bit/${selfId}`} className="underline underline-offset-4 hover:no-underline">
                    open its page →
                  </Link>
                </span>
                <PlaceOnBoard bitId={selfId} boards={boards} onPlaced={() => setPlaced(true)} />
              </>
            )}
          </span>
        ) : (
          // The gather hint (O3): the page's superpower shouldn't be a secret.
          <span>
            start writing — it saves itself · type <code className="rounded bg-neutral-100 px-1">[[</code> to
            gather a note into your writing
          </span>
        )}
      </p>
    </div>
  );
}
