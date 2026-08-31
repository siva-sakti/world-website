"use client";

import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import type { HomeBoard } from "@/lib/types";
import { boardLabel } from "@/lib/labels";
import {
  type ShelfGroup,
  createGroup,
  setBoardGroup,
  moveGroup,
  pinBoard,
  pinGroup,
  deleteGroup,
} from "@/lib/db/shelf";
import { FolderPicker } from "@/components/folder-picker";
import { trashBoardAction } from "./actions";
import { confirm } from "@/components/confirm";

// The shelf (O1): pinned boards float in a ★ section; groups in the owner's own
// order (↑/↓); ungrouped below. Grouping is a quiet per-row picker — groups
// exist because boards name them (the owner's ruling; no manage screen).
export function Shelf({
  boards,
  groups,
  bitCounts = {},
}: {
  boards: HomeBoard[];
  groups: ShelfGroup[];
  bitCounts?: Record<string, number>; // notes per folder — folders cut across kinds
}) {
  const [supabase] = useState(() => createClient());
  const router = useRouter();
  const [busy, setBusy] = useState(false);

  async function act(fn: () => Promise<unknown>) {
    if (busy) return;
    setBusy(true);
    try {
      await fn();
      router.refresh();
    } catch (e) {
      console.error(e);
    } finally {
      setBusy(false);
    }
  }

  /** Remove a folder. Its contents are NOT trashed — boards and notes simply come
   *  out of it (set-null physics). The confirm says so, and counts both kinds:
   *  a count of boards alone would understate what you're about to touch. */
  async function removeGroup(g: ShelfGroup) {
    const nb = byGroup(g.id).length;
    const nn = bitCounts[g.id] ?? 0;
    const inside = [
      nb ? `${nb} board${nb === 1 ? "" : "s"}` : "",
      nn ? `${nn} note${nn === 1 ? "" : "s"}` : "",
    ].filter(Boolean).join(" and ");
    const msg = inside
      ? `Delete the folder “${g.name}”? Its ${inside} come out of the folder — nothing is trashed.`
      : `Delete the empty folder “${g.name}”?`;
    if (!(await confirm({ message: msg, confirmLabel: "Delete folder", danger: true }))) return;
    void act(() => deleteGroup(supabase, g.id));
  }

  function reshelve(boardId: string, groupId: string | null) {
    void act(() => setBoardGroup(supabase, boardId, groupId));
  }
  function reshelveNew(boardId: string, name: string) {
    void act(async () => {
      const g = await createGroup(supabase, name);
      await setBoardGroup(supabase, boardId, g.id);
    });
  }

  const pinned = boards
    .filter((b) => b.pinned_at)
    .sort((a, z) => (z.pinned_at ?? "").localeCompare(a.pinned_at ?? ""));
  const unpinned = boards.filter((b) => !b.pinned_at);
  const ungrouped = unpinned.filter((b) => !b.group_id);
  const byGroup = (gid: string) => unpinned.filter((b) => b.group_id === gid);

  function row(b: HomeBoard) {
    return (
      <li key={b.id} className="flex items-baseline justify-between gap-4">
        <Link href={`/board/${b.id}`} className="underline underline-offset-4 hover:no-underline">
          {boardLabel(b.title)}
        </Link>
        <span className="flex items-baseline gap-3">
          <FolderPicker
            value={b.group_id}
            groups={groups}
            busy={busy}
            title="which shelf section"
            onPick={(gid) => reshelve(b.id, gid)}
            onNew={(name) => reshelveNew(b.id, name)}
          />
          <button
            className="shelf-pin"
            disabled={busy}
            title={b.pinned_at ? "no longer alive" : "mark alive — it greets you on home"}
            onClick={() => act(() => pinBoard(supabase, b.id, !b.pinned_at))}
          >
            {b.pinned_at ? "★" : "☆"}
          </button>
          <form action={trashBoardAction}>
            <input type="hidden" name="id" value={b.id} />
            <button
              className="text-xs text-neutral-400 hover:text-neutral-700"
              title="Trash this board (its bits stay in your collection; restorable)"
            >
              trash
            </button>
          </form>
        </span>
      </li>
    );
  }

  if (boards.length === 0)
    return <p className="text-neutral-500">Nothing here yet — make your first board.</p>;

  return (
    <div className="space-y-8">
      {pinned.length > 0 && (
        <section>
          <h3 className="mb-2 text-xs uppercase tracking-wide text-neutral-400">★ alive</h3>
          <ul className="space-y-3">{pinned.map(row)}</ul>
        </section>
      )}
      {groups.map((g, i) => {
        const members = byGroup(g.id);
        return (
          <section key={g.id}>
            <h3 className="mb-2 flex items-baseline gap-2 text-xs uppercase tracking-wide text-neutral-400">
              <Link href={`/group/${g.id}`} className="underline underline-offset-4 hover:no-underline" title="open this group — its boards and notes together">
                {g.name}
              </Link>
              <span className="normal-case tracking-normal">
                <button className="shelf-pin" disabled={busy}
                  title={g.pinned_at ? "unstar this folder" : "star this folder — it leads the desk"}
                  onClick={() => act(() => pinGroup(supabase, g.id, !g.pinned_at))}>{g.pinned_at ? "★" : "☆"}</button>
                <button className="shelf-move" disabled={busy || i === 0} title="move up"
                  onClick={() => act(() => moveGroup(supabase, g.id, "up"))}>↑</button>
                <button className="shelf-move" disabled={busy || i === groups.length - 1} title="move down"
                  onClick={() => act(() => moveGroup(supabase, g.id, "down"))}>↓</button>
                <button className="shelf-move" disabled={busy} title="delete this folder — what's inside comes out, nothing is trashed"
                  onClick={() => void removeGroup(g)}>×</button>
              </span>
            </h3>
            {members.length === 0 ? (
              <p className="text-xs text-neutral-400">empty — pick this group on a board to shelve it here</p>
            ) : (
              <ul className="space-y-3">{members.map(row)}</ul>
            )}
          </section>
        );
      })}
      <section>
        {(groups.length > 0 || pinned.length > 0) && (
          <h3 className="mb-2 text-xs uppercase tracking-wide text-neutral-400">boards</h3>
        )}
        <ul className="space-y-3">{ungrouped.map(row)}</ul>
      </section>
    </div>
  );
}
