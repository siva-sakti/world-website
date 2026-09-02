"use client";

import { useEffect, useState } from "react";
import { readLocal, writeLocal } from "@/lib/local-storage";
import { emptyMessage } from "@/lib/empty-message";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { useAct } from "@/components/use-act";
import type { Surface } from "@/lib/surfaces";
import {
  type ShelfGroup,
  createGroup,
  setBoardGroup,
  setBitGroup,
  pinBoard,
  pinBit,
  pinGroup,
  moveGroup,
  deleteGroup,
} from "@/lib/db/shelf";
import { duplicateBoard } from "@/lib/db/boards";
import { SurfaceRow } from "./surface-row";
import { confirm } from "@/components/confirm";
import { jumpWords, titleMatches } from "@/lib/jump-match";

// YOUR SURFACES — the one list of boards + notes (S2). Kind tabs · folders ⇄ flat ·
// a sort · a name-jump (shared word-start match) · per-row controls. Folders drill in
// inline (accordion). Boards & notes are one family, so they're views of one list.

type Kind = "all" | "board" | "note";
type View = "folders" | "flat";
type Sort = "alive" | "alpha" | "created" | "modified";

const KINDS: { k: Kind; label: string }[] = [
  { k: "all", label: "all" },
  { k: "board", label: "boards" },
  { k: "note", label: "notes" },
];
const SORTS: { s: Sort; label: string }[] = [
  { s: "alive", label: "alive first" },
  { s: "alpha", label: "A→Z" },
  { s: "created", label: "newest created" },
  { s: "modified", label: "recently modified" },
];

export function HomeSurfaces({
  surfaces,
  groups,
  deskEmpty,
}: {
  surfaces: Surface[];
  groups: ShelfGroup[];
  deskEmpty: boolean;
}) {
  const [supabase] = useState(() => createClient());
  const [kind, setKind] = useState<Kind>("all");
  const [view, setView] = useState<View>("folders");
  const [sort, setSort] = useState<Sort>("alive");
  const [q, setQ] = useState("");
  const [open, setOpen] = useState<string | null>(null);

  // Collapse the list to just the desk — remembered per person (the rail's pattern).
  // When the desk is empty we keep it open, so home is never a blank screen.
  const [collapsed, setCollapsed] = useState(false);
  useEffect(() => {
    // Only "collapsed" is restored — an absent value means expanded, which is the
    // default anyway. (The rail restores both; it has a route default to override.)
    // eslint-disable-next-line react-hooks/set-state-in-effect -- one-time client storage read
    if (readLocal("homeListCollapsed") === "1") setCollapsed(true);
  }, []);
  function toggleCollapsed() {
    const next = !collapsed;
    setCollapsed(next);
    writeLocal("homeListCollapsed", next ? "1" : "0");
  }
  const showBody = deskEmpty || !collapsed;

  // The one act door (use-act). Home shows a SENTENCE rather than the small
  // "failed — try again" its siblings use — the door supplies the machinery, the caller
  // still chooses how the failure looks. That difference is presentation, not policy.
  const { busy, failed, run: act, clearFailed } = useAct();

  const pin = (s: Surface) =>
    void act(() =>
      s.kind === "board" ? pinBoard(supabase, s.id, !s.pinned_at) : pinBit(supabase, s.id, !s.pinned_at),
    );
  const pick = (s: Surface, gid: string | null) =>
    void act(() => (s.kind === "board" ? setBoardGroup(supabase, s.id, gid) : setBitGroup(supabase, s.id, gid)));
  const pickNew = (s: Surface, name: string) =>
    void act(async () => {
      const g = await createGroup(supabase, name);
      await (s.kind === "board" ? setBoardGroup(supabase, s.id, g.id) : setBitGroup(supabase, s.id, g.id));
    });

  function cmp(a: Surface, z: Surface): number {
    if (sort === "alpha") return a.title.localeCompare(z.title);
    if (sort === "created") return z.created_at.localeCompare(a.created_at);
    if (sort === "modified") return z.modified_at.localeCompare(a.modified_at);
    // alive: pinned first (newest star), then most-recently-modified
    if (Boolean(a.pinned_at) !== Boolean(z.pinned_at)) return a.pinned_at ? -1 : 1;
    if (a.pinned_at && z.pinned_at) return z.pinned_at.localeCompare(a.pinned_at);
    return z.modified_at.localeCompare(a.modified_at);
  }

  /** Remove a folder. Its contents are NOT trashed — the boards and notes inside
   *  simply come out of it (ON DELETE SET NULL physics). The confirm says so, and
   *  counts BOTH kinds from the unfiltered list, so the number is honest even when
   *  a kind tab is narrowing the view. (Re-wired at the origin/main merge: the db
   *  door exported deleteGroup but nothing called it — the half-built door again.) */
  async function removeGroup(g: { id: string; name: string }) {
    const inGroup = surfaces.filter((s) => s.group_id === g.id);
    const nb = inGroup.filter((s) => s.kind === "board").length;
    const nn = inGroup.filter((s) => s.kind === "note").length;
    const inside = [
      nb ? `${nb} board${nb === 1 ? "" : "s"}` : "",
      nn ? `${nn} note${nn === 1 ? "" : "s"}` : "",
    ]
      .filter(Boolean)
      .join(" and ");
    const message = inside
      ? `Delete the folder \u201c${g.name}\u201d? Its ${inside} come out of the folder \u2014 nothing is trashed.`
      : `Delete the empty folder \u201c${g.name}\u201d?`;
    if (!(await confirm({ message, confirmLabel: "Delete folder", danger: true }))) return;
    await act(() => deleteGroup(supabase, g.id));
  }

  const kinded = surfaces.filter((s) => kind === "all" || s.kind === kind);
  const words = jumpWords(q);

  const row = (s: Surface) => (
    <SurfaceRow
      key={`${s.kind}-${s.id}`}
      surface={s}
      groups={groups}
      busy={busy}
      onPick={(gid) => pick(s, gid)}
      onNew={(name) => pickNew(s, name)}
      onPin={() => pin(s)}
      onDuplicate={s.kind === "board" ? () => act(() => duplicateBoard(supabase, s.id)) : undefined}
    />
  );

  // Folders shown starred-first then shelf order; the ↑↓ moves POSITION (from the
  // original position-ordered `groups`, so the disable edges stay correct).
  const orderedGroups = [...groups].sort((a, z) => {
    if (Boolean(a.pinned_at) !== Boolean(z.pinned_at)) return a.pinned_at ? -1 : 1;
    if (a.pinned_at && z.pinned_at) return z.pinned_at.localeCompare(a.pinned_at);
    return a.position - z.position;
  });

  const controls = (
    <div className="mb-5 flex flex-wrap items-center gap-3">
      <div className="loose-scope">
        {KINDS.map((x) => (
          <button
            key={x.k}
            className={`loose-scope-tab${kind === x.k ? " is-on" : ""}`}
            onClick={() => setKind(x.k)}
          >
            {x.label}
          </button>
        ))}
      </div>
      <div className="loose-scope">
        <button className={`loose-scope-tab${view === "folders" ? " is-on" : ""}`} onClick={() => setView("folders")}>
          folders
        </button>
        <button className={`loose-scope-tab${view === "flat" ? " is-on" : ""}`} onClick={() => setView("flat")}>
          flat
        </button>
      </div>
      <select
        className="shelf-picker"
        value={sort}
        onChange={(e) => setSort(e.target.value as Sort)}
        aria-label="sort"
        title="sort"
      >
        {SORTS.map((x) => (
          <option key={x.s} value={x.s}>
            {x.label}
          </option>
        ))}
      </select>
      <input
        value={q}
        onChange={(e) => setQ(e.target.value)}
        placeholder="Jump to a board or note…"
        aria-label="jump to a board or note"
        className="min-w-[12rem] flex-1 border-b border-neutral-300 bg-transparent py-1 text-sm outline-none focus:border-neutral-900"
      />
    </div>
  );

  let body: React.ReactNode;
  if (surfaces.length === 0) {
    body = (
      <p className="text-neutral-500">
        Nothing yet — make your first board, or{" "}
        <Link href="/write" className="underline underline-offset-4 hover:no-underline">
          ✎ write your first note
        </Link>
        .
      </p>
    );
  } else if (words.length) {
    // Jump mode: a flat list of matches (simple links + folder in grey), sorted.
    const matches = kinded.filter((s) => titleMatches(s.title, words)).sort(cmp);
    body =
      matches.length === 0 ? (
        <p className="text-neutral-500">{emptyMessage({ filtered: true, hint: null })}</p>
      ) : (
        <ul className="divide-y divide-neutral-100">
          {matches.map((s) => (
            <li key={`${s.kind}-${s.id}`} className="flex items-baseline justify-between gap-4 py-2">
              <Link href={s.href} className="min-w-0 truncate hover:underline underline-offset-4">
                <span className="mr-2 text-xs uppercase tracking-wide text-neutral-400">{s.kind}</span>
                {s.title}
              </Link>
              {s.group_id && (
                <span className="shrink-0 text-xs text-neutral-400">
                  {groups.find((g) => g.id === s.group_id)?.name}
                </span>
              )}
            </li>
          ))}
        </ul>
      );
  } else if (view === "flat") {
    body = <ul className="space-y-3">{kinded.slice().sort(cmp).map(row)}</ul>;
  } else {
    // Folders view: each folder drills in (accordion); unfiled below.
    const unfiled = kinded.filter((s) => !s.group_id).sort(cmp);
    body = (
      <div className="space-y-8">
        {orderedGroups.map((g) => {
          const members = kinded.filter((s) => s.group_id === g.id).sort(cmp);
          const isOpen = open === g.id;
          const pos = groups.findIndex((x) => x.id === g.id);
          return (
            <section key={g.id}>
              <h3 className="mb-2 flex items-baseline gap-2 text-xs uppercase tracking-wide text-neutral-400">
                <button
                  className="underline underline-offset-4 hover:no-underline"
                  onClick={() => setOpen(isOpen ? null : g.id)}
                  title="open this folder"
                >
                  {g.pinned_at && "★ "}
                  {g.name} <span className="normal-case text-neutral-400">{members.length}</span>{" "}
                  {isOpen ? "▾" : "▸"}
                </button>
                <span className="normal-case tracking-normal">
                  <Link
                    href={`/group/${g.id}`}
                    className="shelf-move"
                    title="the folder's own page"
                  >
                    →
                  </Link>
                  <button
                    className="shelf-pin"
                    disabled={busy}
                    title={g.pinned_at ? "unstar this folder" : "star this folder — it leads the desk"}
                    onClick={() => act(() => pinGroup(supabase, g.id, !g.pinned_at))}
                  >
                    {g.pinned_at ? "★" : "☆"}
                  </button>
                  <button
                    className="shelf-move"
                    disabled={busy || pos === 0}
                    title="move up"
                    onClick={() => act(() => moveGroup(supabase, g.id, "up"))}
                  >
                    ↑
                  </button>
                  <button
                    className="shelf-move"
                    disabled={busy || pos === groups.length - 1}
                    title="move down"
                    onClick={() => act(() => moveGroup(supabase, g.id, "down"))}
                  >
                    ↓
                  </button>
                  <button
                    className="shelf-move"
                    disabled={busy}
                    title="delete this folder — what's inside comes out, nothing is trashed"
                    onClick={() => void removeGroup(g)}
                  >
                    ×
                  </button>
                </span>
              </h3>
              {isOpen &&
                (members.length === 0 ? (
                  <p className="pl-4 text-xs text-neutral-400">
                    empty — move a board or note into it from its folder picker
                  </p>
                ) : (
                  <ul className="space-y-3">{members.map(row)}</ul>
                ))}
            </section>
          );
        })}
        <section>
          <h3 className="mb-2 text-xs uppercase tracking-wide text-neutral-400">
            unfiled <span className="text-neutral-400">{unfiled.length}</span>
          </h3>
          {unfiled.length === 0 ? (
            <p className="pl-4 text-xs text-neutral-400">nothing unfiled</p>
          ) : (
            <ul className="space-y-3">{unfiled.map(row)}</ul>
          )}
        </section>
      </div>
    );
  }

  return (
    <div>
      {failed && (
        <p className="mb-3 text-sm text-red-700" role="status">
          Couldn&apos;t save that — check your connection and try again.{" "}
          <button className="underline" onClick={clearFailed}>
            ok
          </button>
        </p>
      )}
      <div className="mb-4 border-t border-neutral-100 pt-6">
        <button
          onClick={toggleCollapsed}
          className="text-sm font-semibold"
          title={showBody ? "collapse to just your desk" : "show your surfaces"}
          aria-expanded={showBody}
        >
          your surfaces <span className="font-normal text-neutral-400">{surfaces.length}</span>{" "}
          <span className="text-neutral-400">{showBody ? "⌄" : "›"}</span>
        </button>
      </div>
      {showBody && (
        <>
          {controls}
          {body}
        </>
      )}
    </div>
  );
}
