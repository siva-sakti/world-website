"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { confirm } from "@/components/confirm";
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
}: {
  thing: "bit" | "board";
  id: string;
  returnTo?: string;
  compact?: boolean;
}) {
  const router = useRouter();
  const [supabase] = useState(() => createClient());
  const [busy, setBusy] = useState(false);
  const [failed, setFailed] = useState(false);

  async function onClick() {
    let n = 0;
    if (thing === "bit") {
      try {
        n = (await getBitBoards(supabase, id)).length;
      } catch {
        /* fall back to the plain message */
      }
    }
    const msg =
      n > 0
        ? `This is on ${n} board${n === 1 ? "" : "s"} — archiving hides it from ${
            n === 1 ? "it" : "them"
          } until you un-archive.`
        : `Archive this ${thing === "board" ? "board" : "note"}? It's set aside in your archive — un-archive anytime.`;
    if (!(await confirm({ message: msg, confirmLabel: "Archive" }))) return;
    setBusy(true);
    setFailed(false);
    try {
      await archiveItemAction(thing, id);
      if (returnTo) router.push(returnTo);
      router.refresh();
    } catch (e) {
      console.error(e);
      setFailed(true); // visible — a silent busy-release is not feedback
      setBusy(false);
    }
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
      {failed && <span className="ml-1 text-xs text-red-700">failed — try again</span>}
    </span>
  );
}

export function UnarchiveButton({ thing, id }: { thing: "bit" | "board"; id: string }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [failed, setFailed] = useState(false);

  async function onClick() {
    setBusy(true);
    setFailed(false);
    try {
      await unarchiveItemAction(thing, id);
      router.refresh();
    } catch (e) {
      console.error(e);
      setFailed(true); // visible — a silent busy-release is not feedback
      setBusy(false);
    }
  }

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
      {failed && <span className="ml-1 text-xs text-red-700">failed — try again</span>}
    </span>
  );
}
