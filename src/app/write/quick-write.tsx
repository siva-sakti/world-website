"use client";

import { useRef, useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { createLooseTextBit, updateBitBody, updateBitContent, trashBit } from "@/lib/db/bits";
import { reconcileReferences, extractRefIds } from "@/lib/db/references";
import { registerSave } from "@/lib/save-guard";
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
  // Same three refs as the note editor (F2, one class not one instance): what the
  // DB holds, what's on the wire, and a write chain so two bodies can't reorder.
  const saved = useRef("");
  const writing = useRef<string | null>(null);
  const chain = useRef<Promise<void>>(Promise.resolve());
  const [status, setStatus] = useState<"idle" | "saving" | "saved">("idle");
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
        .catch((e) => {
          // Was swallowed entirely: the body saved, the page looked fine, and the
          // title simply wasn't there later (flow review, network case 3).
          console.error("save title failed:", e);
          setErr("Couldn't save the title — it'll retry as you keep typing.");
        });
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
    setStatus("idle");
    timer.current = setTimeout(flush, 600);
  }

  /** Returns TRUE when the body landed (hunt #3: openSelf used to navigate on a
   *  FAILED save — /note/[id] then rendered the stale body and its next save
   *  overwrote the tail). The catch below already shows the honest banner. */
  function flush(): Promise<boolean> {
    if (!create.current) return Promise.resolve(true);
    const body = latest.current;
    writing.current = body;
    setStatus("saving");
    const run = chain.current.then(async () => {
      await create.current; // the settled gate — never write before the row exists
      const id = bitId.current;
      if (!id) return; // the create failed and reset; the retry path owns it now
      await updateBitBody(supabase, id, body);
      saved.current = body; // saved once the BODY lands — before the chip reconcile
      await reconcileReferences(supabase, id, extractRefIds(body));
    });
    chain.current = run.catch(() => {}); // settled-safe tail
    return run
      .then(() => {
        setStatus("saved");
        setErr(null);
        return true;
      })
      .catch((e) => {
        console.error("save failed:", e);
        setStatus("idle");
        setErr("Couldn't save — check your connection. Your words are still here.");
        return false;
      })
      .finally(() => {
        if (writing.current === body) writing.current = null;
      });
  }

  /** Write now if anything is UNSAVED (the dirty check the note editor gained in
   *  F2 — a failed save must not disable the escape hatches). */
  function flushPending(): Promise<boolean> {
    if (timer.current) clearTimeout(timer.current);
    timer.current = null;
    if (!create.current) return Promise.resolve(true);
    if (latest.current === saved.current) return Promise.resolve(true);
    if (latest.current === writing.current) return Promise.resolve(true);
    return flush();
  }

  /** Write everything waiting — leaving /write, or the page going away. Without
   *  this, words typed less than 600ms before navigating away died with the timer,
   *  and a title never blurred was never written at all. */
  function leaveNow() {
    flushTitle(); // guarded internally (no id / unchanged → no-op)
    void flushPending();
  }

  /** Open the note you just wrote. Flushes FIRST, then navigates — a plain link
   *  would let /note/[id] server-render a pre-flush body, and its next save would
   *  overwrite the tail you just typed (the hazard board-surface's openSelected
   *  documents; /write debounces at 600ms, so the window is wide — review F6). */
  const router = useRouter();
  const [opening, setOpening] = useState(false);
  async function openSelf() {
    const id = selfId;
    if (!id || opening) return;
    setOpening(true);
    try {
      flushTitle();
      if (!(await flushPending())) {
        // Hunt #3: the save failed — navigating would render the stale body and its
        // next save would clobber the tail. The banner is already up; stay and retry.
        setOpening(false);
        return;
      }
      router.push(`/note/${id}`);
    } catch (e) {
      console.error("open failed:", e);
      setErr("Couldn't finish saving — try again before leaving.");
      setOpening(false);
    }
  }
  const leave = useRef(leaveNow);
  leave.current = leaveNow;
  useEffect(() => registerSave(() => leave.current()), []);
  useEffect(() => () => leave.current(), []);
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
    saved.current = "";
    writing.current = null;
    chain.current = Promise.resolve();
    setStatus("idle");
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
        <button
          type="button"
          onClick={() => void openSelf()}
          disabled={!selfId || opening}
          className="rounded-md border border-neutral-200 px-2 py-1 hover:bg-neutral-50 disabled:opacity-40"
          title={selfId ? "Open this note on its own page" : "Starts once you've written something"}
        >
          {opening ? "opening…" : "open →"}
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
        ) : status !== "idle" ? (
          // A silent save is indistinguishable from a broken one — /write said
          // nothing at all until now (review F6).
          <span>{status === "saving" ? "saving…" : "saved"}</span>
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
