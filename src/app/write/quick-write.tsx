"use client";

import { useRef, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { createLooseTextBit, updateBitBody, updateBitContent, trashBit } from "@/lib/db/bits";
import { reconcileReferences, extractRefIds } from "@/lib/db/references";
import { TextBit } from "@/app/board/[id]/text-bit";
import { confirm } from "@/components/confirm";

// The writer behind /write. The loose bit is born on the FIRST real content — no
// empty-note litter from opening the page and leaving — guarded by a SYNCHRONOUS
// ref (per-keystroke onChange would double-create through async state; review
// finding 2). Every save AWAITS that create: updateBitBody doesn't assert rows, so
// a flush racing the insert would 0-row-update and silently eat the first words
// (review finding 1 — the same settled-create rule the board's persistence
// enforces). Save = body + `[[`-chip reconcile, exactly the workspace flush pair.
// Placing on a board is NOT a writing-moment act (N1): a note is a surface — you
// place it later, from the note or the board, never mid-write.
export function QuickWrite() {
  const [supabase] = useState(() => createClient());
  const [err, setErr] = useState<string | null>(null);
  // The born note's id as STATE — render reads this (the status line); the ref
  // twin below is for synchronous access in flush.
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
  // Bumped on trash to remount the editor blank for a fresh start.
  const [resetKey, setResetKey] = useState(0);

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

  // Trash the just-written note in place — the same "trash" as everywhere else
  // (restorable), then reset to a fresh blank writer. Only offered once it's born.
  async function trashNote() {
    const id = bitId.current;
    if (!id) return;
    if (
      !(await confirm({
        message: "Trash this note?",
        confirmLabel: "Trash",
        danger: true,
      }))
    )
      return;
    try {
      await create.current; // never trash before the row exists (the settled gate)
      await trashBit(supabase, id);
    } catch (e) {
      console.error("trash failed:", e);
      setErr("Couldn't trash — check your connection.");
      return;
    }
    if (timer.current) clearTimeout(timer.current);
    bitId.current = null;
    create.current = null; // any in-flight flush now reads a null id and aborts
    latest.current = "";
    titleRef.current = "";
    titleSaved.current = "";
    setTitle("");
    setSelfId(null);
    setErr(null);
    setResetKey((k) => k + 1);
  }

  return (
    <div>
      {/* A stable action toolbar — always here, never popping in as you type. Trash is
          always available; open lights up once the note exists. */}
      <div className="mb-4 flex items-center justify-end gap-2 text-sm">
        <button
          type="button"
          onClick={trashNote}
          className="rounded-md border border-neutral-200 px-2 py-1 hover:bg-neutral-50"
          title="Trash this note (restorable)"
        >
          🗑 trash
        </button>
      </div>
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
        <TextBit key={resetKey} html="" editing onChange={onChange} selfBitId={selfId ?? undefined} />
      </div>
      <p className="mt-4 text-xs text-neutral-400" role="status">
        {err ? (
          <span className="text-red-700">{err}</span>
        ) : (
          // The gather hint (O3): the page's superpower shouldn't be a secret.
          <span>
            type <code className="rounded bg-neutral-100 px-1">[[</code> to gather a note into your writing
          </span>
        )}
      </p>
    </div>
  );
}
