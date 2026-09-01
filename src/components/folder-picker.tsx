"use client";

import { useCallback, useRef, useState } from "react";
import Link from "next/link";
import type { ShelfGroup } from "@/lib/db/shelf";
import { jumpWords, titleMatches } from "@/lib/jump-match";
import { PickerMenu, type MenuRow } from "@/components/picker-menu";

// THE one folder control (folder-story-plan.md, owner-ruled): the folder's NAME is a link to its
// page (/group/[id]); CHANGING the folder is the separate ▾ beside it. The display never morphs
// into a text box — the ▾ opens the shared PickerMenu with a search line INSIDE it: type to filter
// the folders, "no folder" un-shelves, a fresh name offers create "…" (no prompt dialog). With no
// folder, the whole trigger is one quiet "no folder ▾" (not a link — nowhere to go).
// Presentational: the parent owns the db write; onPick(null) = un-shelve; onNew(name) =
// create-then-assign, parent's job.
export function FolderPicker({
  value,
  groups,
  busy,
  title,
  onPick,
  onNew,
}: {
  value: string | null;
  groups: ShelfGroup[];
  busy: boolean;
  title: string;
  onPick: (groupId: string | null) => void;
  onNew: (name: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const [q, setQ] = useState("");
  const [hi, setHi] = useState(0);
  const wrapRef = useRef<HTMLSpanElement>(null);
  const current = value ? groups.find((g) => g.id === value) : undefined;

  const query = q.trim();
  const hits = groups.filter((g) => titleMatches(g.name, jumpWords(q)));

  const rows: MenuRow[] = [];
  if (current && !query) rows.push({ key: "__none", label: "no folder", special: true, act: () => choose(null) });
  for (const g of hits) rows.push({ key: g.id, label: g.name, current: g.id === value, act: () => choose(g.id) });
  const exact = groups.some((g) => g.name.trim().toLowerCase() === query.toLowerCase());
  if (query && !exact) {
    rows.push({ key: "__create", label: `create “${query}”`, special: true, act: () => { onNew(query); close(); } });
  }

  function choose(id: string | null) { onPick(id); close(); }
  const close = useCallback(() => { setOpen(false); setQ(""); setHi(0); }, []);

  function onKey(e: React.KeyboardEvent) {
    if (e.key === "ArrowDown") { e.preventDefault(); setHi(Math.min(hi + 1, rows.length - 1)); }
    else if (e.key === "ArrowUp") { e.preventDefault(); setHi(Math.max(hi - 1, 0)); }
    else if (e.key === "Enter") { if (rows[hi]) { e.preventDefault(); rows[hi].act(); } }
    else if (e.key === "Escape") { close(); }
  }

  return (
    <span className="folder-ctl" ref={wrapRef}>
      {current ? (
        <>
          <Link href={`/group/${current.id}`} className="folder-name" title="open this folder's page">
            {current.name}
          </Link>
          <button
            className="folder-drop"
            disabled={busy}
            title={title}
            aria-label="change folder"
            onClick={() => (open ? close() : setOpen(true))}
          >
            ▾
          </button>
        </>
      ) : (
        <button
          className="folder-drop folder-drop--none"
          disabled={busy}
          title={title}
          onClick={() => (open ? close() : setOpen(true))}
        >
          no folder ▾
        </button>
      )}
      {open && (
        <PickerMenu anchorRef={wrapRef} rows={rows} hi={hi} setHi={setHi} onClose={close}>
          <li className="picker-search">
            <input
              autoFocus
              value={q}
              placeholder="filter or new folder…"
              onChange={(e) => { setQ(e.target.value); setHi(0); }}
              onKeyDown={onKey}
              aria-label="filter folders or name a new one"
            />
          </li>
        </PickerMenu>
      )}
    </span>
  );
}
