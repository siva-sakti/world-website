"use client";

import { useAct, FailedNote } from "@/components/use-act";
import { confirm } from "@/components/confirm";
import { destroyItemAction, emptyTrashAction } from "@/app/actions";

// The app's ONLY irreversible acts (empty-trash · destroy) — each behind a DOUBLE
// confirm, because there is no undo. The db layer guards to trashed-only; here we
// make sure it can't happen by accident.

export function DestroyButton({
  thing,
  id,
  label,
}: {
  thing: "bit" | "board";
  id: string;
  label: string;
}) {
  const { busy, failed, run } = useAct({ keepBusyOnSuccess: true });

  async function onClick() {
    const name = label.trim() || (thing === "board" ? "this board" : "this note");
    const detail =
      thing === "board"
        ? "The board is gone for good — its bits stay in your collection."
        : "It's gone for good — removed from every board and any note that gathered it.";
    if (
      !(await confirm({
        message: `Permanently delete “${name}”? This can’t be undone.`,
        confirmLabel: "Delete forever",
        danger: true,
      }))
    )
      return;
    if (
      !(await confirm({
        message: `Are you absolutely sure? ${detail}`,
        confirmLabel: "Destroy",
        danger: true,
      }))
    )
      return;
    await run(() => destroyItemAction(thing, id));
  }

  return (
    <span>
      <button
        className="text-sm text-red-700 underline underline-offset-4 hover:no-underline disabled:opacity-50"
        onClick={onClick}
        disabled={busy}
        title="Delete permanently — cannot be undone"
      >
        {busy ? "destroying…" : "destroy"}
      </button>
      <FailedNote failed={failed} />
    </span>
  );
}

export function EmptyTrashButton({ count }: { count: number }) {
  // The trash page stays put and just empties, so the button releases.
  const { busy, failed, run } = useAct();

  async function onClick() {
    if (
      !(await confirm({
        message: `Permanently delete all ${count} thing${count === 1 ? "" : "s"} in the trash? This can’t be undone.`,
        confirmLabel: "Empty trash",
        danger: true,
      }))
    )
      return;
    if (
      !(await confirm({
        message: "Last chance — everything in the trash will be gone for good.",
        confirmLabel: "Empty forever",
        danger: true,
      }))
    )
      return;
    await run(() => emptyTrashAction());
  }

  return (
    <span>
      <button
        className="text-sm text-red-700 underline underline-offset-4 hover:no-underline disabled:opacity-50"
        onClick={onClick}
        disabled={busy}
        title="Permanently delete everything in the trash"
      >
        {busy ? "emptying…" : "empty trash"}
      </button>
      <FailedNote failed={failed} />
    </span>
  );
}
