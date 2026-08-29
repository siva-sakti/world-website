"use client";

import Link from "next/link";
import { useState } from "react";

// Jump to — the TARGETED look (one shared piece, D-log at build). You know the thing
// and roughly its name; type it and go straight there. Titles only, never content
// (that's Search). Reused on every list — the boards list, the notes list, and the
// home surfaces list when it's built; each page hands in plain `items` + its own
// normal view as `children`. Empty box → the normal view; typing → a FLAT list of
// matches (folder grouping drops away), each with its folder in grey to the right.

export type JumpItem = { id: string; title: string; href: string; folder: string | null };

export function JumpTo({
  items,
  placeholder,
  emptyMatch,
  children,
}: {
  items: JumpItem[];
  placeholder: string;
  emptyMatch: string;
  children: React.ReactNode; // the page's normal view, shown when the box is empty
}) {
  const [q, setQ] = useState("");

  // Nothing to jump to → no box at all, just the normal (empty) view.
  if (items.length === 0) return <>{children}</>;

  const needle = q.trim().toLowerCase();
  const matches = needle ? items.filter((it) => it.title.toLowerCase().includes(needle)) : [];

  return (
    <>
      <input
        value={q}
        onChange={(e) => setQ(e.target.value)}
        placeholder={placeholder}
        aria-label={placeholder}
        className="mb-6 w-full border-b border-neutral-300 bg-transparent py-2 text-base outline-none focus:border-neutral-900"
      />
      {needle ? (
        matches.length === 0 ? (
          <p className="text-neutral-500">{emptyMatch}</p>
        ) : (
          <ul className="divide-y divide-neutral-100">
            {matches.map((it) => (
              <li key={it.id} className="flex items-baseline justify-between gap-4 py-3">
                <Link href={it.href} className="min-w-0 truncate hover:underline underline-offset-4">
                  {it.title || "untitled"}
                </Link>
                {it.folder && (
                  <span className="shrink-0 text-xs text-neutral-400">{it.folder}</span>
                )}
              </li>
            ))}
          </ul>
        )
      ) : (
        children
      )}
    </>
  );
}
