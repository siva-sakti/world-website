"use client";

import { useAct, FailedNote } from "@/components/use-act";
import { confirmTrash } from "@/app/trash/trash-confirm";
import { trashBits } from "./actions";

// TRASH, FROM A CARD OR A ROW ON /bits.
//
// This exists because /bits was the one page where trashing did NOT ask. It was a bare
// `<form action={trashFromInbox}>`: one click and the bit was gone — no confirm, no busy
// state, no message if the write failed, and nothing in either file to catch an error.
// Every other trash door in the app goes through confirmTrash + useAct, and the comment on
// the one in bit-controls.tsx even claimed this page was among them (found by an antagonist
// review, 2026-09-03).
//
// It asks the SAME question as everywhere else because it calls the same door — including
// the honest "this is on N boards" line, which the card already knows without a lookup
// (`item.boards`), so the heavier act tells you what it is about to reach.
//
// Goes through `trashBits`, not `trashFromInbox`: the bulk action already returns
// `{ error }` rather than throwing into an unhandled server-action rejection.

export function InboxTrash({
  bitId,
  onBoards,
  className,
}: {
  bitId: string;
  /** How many boards this bit sits on — shown in the question. */
  onBoards: number;
  className?: string;
}) {
  const { busy, failed, run } = useAct();

  async function onTrash() {
    if (!(await confirmTrash({ noun: "bit", onBoards }))) return;
    await run(async () => {
      const r = await trashBits([bitId]);
      if (r.error) throw new Error(r.error); // a failed write must reach the button, not the console
    });
  }

  return (
    <span>
      <button
        className={className}
        onClick={onTrash}
        disabled={busy}
        title={failed ? "that didn't save — try again" : "Move this to the trash — hidden everywhere, restorable"}
        aria-label="move to trash"
      >
        {busy ? "trashing…" : "trash"}
      </button>
      <FailedNote failed={failed} />
    </span>
  );
}
