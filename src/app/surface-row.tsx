"use client";

import Link from "next/link";
import type { Surface } from "@/lib/surfaces";
import type { ShelfGroup } from "@/lib/db/shelf";
import { FolderPicker } from "@/components/folder-picker";
import { BitTrash } from "@/app/bit/[id]/bit-controls";
import { ArchiveButton } from "@/app/archive/archive-controls";
import { trashBoardAction } from "@/app/actions";

// One row in the home surfaces list — a board or a note, with its own controls.
// The parent (home-surfaces) owns the db writes; this dispatches trash by kind
// (a board's server-action form · a note's BitTrash), and hands folder/pin up.
export function SurfaceRow({
  surface,
  groups,
  busy,
  onPick,
  onNew,
  onPin,
}: {
  surface: Surface;
  groups: ShelfGroup[];
  busy: boolean;
  onPick: (groupId: string | null) => void;
  onNew: (name: string) => void;
  onPin: () => void;
}) {
  const s = surface;
  return (
    <li className="flex items-baseline justify-between gap-4">
      <Link
        href={s.href}
        className="min-w-0 flex-1 truncate underline underline-offset-4 hover:no-underline"
      >
        <span className="mr-2 text-xs uppercase tracking-wide text-neutral-400">{s.kind}</span>
        {s.title}
      </Link>
      <span className="flex flex-none items-baseline gap-3">
        <FolderPicker
          value={s.group_id}
          groups={groups}
          busy={busy}
          title="which folder"
          onPick={onPick}
          onNew={onNew}
        />
        <button
          className="shelf-pin"
          disabled={busy}
          title={s.pinned_at ? "no longer alive" : "mark alive — it greets you on home"}
          onClick={onPin}
        >
          {s.pinned_at ? "★" : "☆"}
        </button>
        <ArchiveButton thing={s.kind === "board" ? "board" : "bit"} id={s.id} compact />
        {s.kind === "board" ? (
          <form action={trashBoardAction}>
            <input type="hidden" name="id" value={s.id} />
            <button
              className="text-xs text-neutral-400 hover:text-neutral-700"
              title="Trash this board (its bits stay in your collection; restorable)"
            >
              trash
            </button>
          </form>
        ) : (
          <BitTrash bitId={s.id} returnTo="/" compact />
        )}
      </span>
    </li>
  );
}
