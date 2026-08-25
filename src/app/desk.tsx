"use client";

import Link from "next/link";
import { useState } from "react";
import type { HomeBoard, Bit } from "@/lib/types";
import type { ShelfGroup } from "@/lib/db/shelf";
import { boardLabel, bitLabel } from "@/lib/labels";

// THE DESK (V3, mock B — owner's pick): what's ALIVE as tiles, then folders as
// chips (starred first) with the tapped one open beneath. Curated by the owner's
// hand (★); the complete lists live in the cabinet, not here.

type AliveThing =
  | { kind: "board"; id: string; name: string; when: string }
  | { kind: "note"; id: string; name: string; when: string };

function ago(iso: string): string {
  const d = Math.floor((Date.now() - new Date(iso).getTime()) / 86400000);
  if (d <= 0) return "today";
  if (d === 1) return "yesterday";
  if (d < 30) return `${d}d ago`;
  return new Date(iso).toLocaleDateString(undefined, { month: "short", day: "numeric" });
}

export function Desk({
  boards,
  notes,
  groups,
}: {
  boards: HomeBoard[];
  notes: Bit[];
  groups: ShelfGroup[];
}) {
  const alive: AliveThing[] = [
    ...boards
      .filter((b) => b.pinned_at)
      .map((b) => ({ kind: "board" as const, id: b.id, name: boardLabel(b.title), when: `touched ${ago(b.touched_at)}` })),
    ...notes
      .filter((n) => n.pinned_at)
      .map((n) => ({ kind: "note" as const, id: n.id, name: bitLabel(n.type, n.face) ?? "untitled", when: `edited ${ago(n.updated_at)}` })),
  ];

  // Order alive by the pin timestamps (newest star first).
  const pinStamp = new Map<string, string>();
  for (const b of boards) if (b.pinned_at) pinStamp.set(b.id, b.pinned_at);
  for (const n of notes) if (n.pinned_at) pinStamp.set(n.id, n.pinned_at);
  alive.sort((a, z) => (pinStamp.get(z.id) ?? "").localeCompare(pinStamp.get(a.id) ?? ""));

  // Folders: starred first (newest star first), then shelf order.
  const ordered = [...groups].sort((a, z) => {
    if (Boolean(a.pinned_at) !== Boolean(z.pinned_at)) return a.pinned_at ? -1 : 1;
    if (a.pinned_at && z.pinned_at) return z.pinned_at.localeCompare(a.pinned_at);
    return a.position - z.position;
  });
  const [openId, setOpenId] = useState<string | null>(ordered[0]?.id ?? null);
  const contents = (gid: string) => ({
    boards: boards.filter((b) => b.group_id === gid),
    notes: notes.filter((n) => n.group_id === gid),
  });
  const count = (gid: string) => {
    const c = contents(gid);
    return c.boards.length + c.notes.length;
  };
  const open = openId ? ordered.find((g) => g.id === openId) : null;
  const openC = open ? contents(open.id) : null;

  return (
    <div>
      <h2 className="desk-h">alive right now</h2>
      {alive.length === 0 ? (
        <p className="mb-10 text-sm text-neutral-500">
          Nothing marked alive yet — tap ★ on a board or note you&rsquo;re working on, and it greets you here.
        </p>
      ) : (
        <div className="desk-tiles">
          {alive.map((t) => (
            <Link
              key={t.id}
              href={t.kind === "board" ? `/board/${t.id}` : `/bit/${t.id}`}
              className={`desk-tile${t.kind === "note" ? " is-note" : ""}`}
            >
              <span className="desk-tile-kind">{t.kind}</span>
              <span className="desk-tile-name">{t.name}</span>
              <span className="desk-tile-meta">{t.when}</span>
            </Link>
          ))}
        </div>
      )}

      <h2 className="desk-h">folders</h2>
      {ordered.length === 0 ? (
        <p className="text-sm text-neutral-500">
          No folders yet — pick &ldquo;+ new group…&rdquo; on any board (
          <Link href="/boards" className="underline underline-offset-4 hover:no-underline">all boards</Link>
          ) or note to start one.
        </p>
      ) : (
        <>
          <div className="desk-chips">
            {ordered.map((g) => (
              <button
                key={g.id}
                className={`desk-chip${g.pinned_at ? " is-starred" : ""}${openId === g.id ? " is-open" : ""}`}
                onClick={() => setOpenId(openId === g.id ? null : g.id)}
              >
                {g.pinned_at && "★ "}
                {g.name}
                <span className="desk-chip-n">{count(g.id)}</span>
              </button>
            ))}
          </div>
          {open && openC && (
            <div className="desk-open">
              <h3>
                {open.pinned_at && "★ "}
                <Link href={`/group/${open.id}`} className="underline underline-offset-4 hover:no-underline" title="open this folder's page">
                  {open.name}
                </Link>
              </h3>
              {openC.boards.length + openC.notes.length === 0 ? (
                <p className="pl-4 text-xs text-neutral-400">empty — shelve boards or notes into it from their pickers</p>
              ) : (
                <ul>
                  {openC.boards.map((b) => (
                    <li key={b.id}>
                      <span className="desk-open-kind">board</span>
                      <Link href={`/board/${b.id}`} className="underline underline-offset-4 hover:no-underline">
                        {boardLabel(b.title)}
                      </Link>
                    </li>
                  ))}
                  {openC.notes.map((n) => (
                    <li key={n.id}>
                      <span className="desk-open-kind">note</span>
                      <Link href={`/bit/${n.id}`} className="underline underline-offset-4 hover:no-underline">
                        {n.content?.trim() || n.face || "untitled"}
                      </Link>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          )}
        </>
      )}
    </div>
  );
}
