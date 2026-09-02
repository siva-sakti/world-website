"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useAct, FailedNote } from "@/components/use-act";
import { createClient } from "@/lib/supabase/client";
import { confirmArchive } from "./archive-confirm";
import { archiveItemAction, unarchiveItemAction } from "@/app/actions";
import { getBitBoards } from "@/lib/db/bits";

// Archive is trash's twin: set a thing aside (hidden, fully kept), un-archive anytime.
// Archiving something placed on boards hides it from them too — so we INFORM (a light
// confirm, mirroring BitTrash's multi-board note), never a scary one; there's no undo
// cost, just a heads-up about the hole it leaves until you bring it back.
export function ArchiveButton({
  thing,
  id,
  returnTo,
  compact = false,
  noun,
}: {
  thing: "bit" | "board";
  id: string;
  returnTo?: string;
  compact?: boolean;
  /** What to CALL this in the confirm. `thing` is the storage kind (bit rows hold
   *  both bits and notes), so it cannot answer this on its own — the call site knows.
   *  Defaults to the old wording, which read "note" for every bit: correct on the note
   *  page, wrong on a photo or a PDF, and only exposed once /bit/[id] gained this
   *  button (2026-09-02). */
  noun?: string;
}) {
  const [supabase] = useState(() => createClient());
  const router = useRouter();
  // keepBusyOnSuccess: this navigates away — releasing the button mid-navigation reads
  // as "nothing happened".
  const { busy, failed, run } = useAct({ keepBusyOnSuccess: Boolean(returnTo) });

  async function onClick() {
    let n = 0;
    if (thing === "bit") {
      try {
        n = (await getBitBoards(supabase, id)).length;
      } catch {
        /* fall back to the plain message */
      }
    }
    // THE one archive confirm (archive-confirm.ts) — shared with the bulk act on /bits,
    // so changing what archiving asks (or whether it asks) is a single-file edit.
    if (!(await confirmArchive({ noun: noun ?? (thing === "board" ? "board" : "note"), onBoards: n }))) return;
    await run(async () => {
      await archiveItemAction(thing, id);
      if (returnTo) router.push(returnTo);
    });
  }

  const cls = compact
    ? "text-xs text-neutral-400 hover:text-neutral-700 disabled:opacity-50"
    : "text-neutral-500 underline underline-offset-4 hover:no-underline disabled:opacity-50";
  return (
    <span>
      <button
        className={cls}
        onClick={onClick}
        disabled={busy}
        title="Set aside in your archive — hidden but kept, un-archive anytime"
      >
        {busy ? "archiving…" : "archive"}
      </button>
      <FailedNote failed={failed} />
    </span>
  );
}

export function UnarchiveButton({ thing, id }: { thing: "bit" | "board"; id: string }) {
  const { busy, failed, run } = useAct();

  const onClick = () => run(() => unarchiveItemAction(thing, id));

  return (
    <span>
      <button
        className="text-sm underline underline-offset-4 hover:no-underline disabled:opacity-50"
        onClick={onClick}
        disabled={busy}
        title="Bring it back to the world, exactly where it was"
      >
        {busy ? "…" : "un-archive"}
      </button>
      <FailedNote failed={failed} />
    </span>
  );
}
