"use client";

import { useCallback, useRef, useState } from "react";
import { jumpWords, titleMatches } from "@/lib/jump-match";
import { PickerMenu, type MenuRow } from "@/components/picker-menu";

export type PickerOption = { id: string; label: string };

// The type-first shared picker: type to search a list, a quiet dropdown forms below, pick a row.
// Filters with the app's own jumpWords/titleMatches (word-start), matching how "jump to a board or
// note" already behaves. The dropdown appears only once you've typed (or on ArrowDown); the menu
// itself is the shared PickerMenu (portaled — never clipped by a card). Used by the ACTION pickers:
// "place on…", "send to…", "merge into…". A folder-style bound control is FolderPicker.
export function SearchablePicker({
  options,
  onPick,
  placeholder = "search…",
  disabled,
  noneLabel,
  title,
}: {
  options: PickerOption[];
  onPick: (id: string) => void;
  placeholder?: string;
  disabled?: boolean;
  noneLabel?: string; // a top row (shown when not searching) that clears a bound value via onPick("")
  title?: string; // tooltip on the input
}) {
  const [q, setQ] = useState("");
  const [open, setOpen] = useState(false);
  const [hi, setHi] = useState(0); // highlighted row (keyboard)
  const inputRef = useRef<HTMLInputElement>(null);

  const query = q.trim();
  const hits = options.filter((o) => titleMatches(o.label, jumpWords(q)));

  const rows: MenuRow[] = [];
  if (noneLabel && !query) rows.push({ key: "__none", label: noneLabel, special: true, act: () => choose("") });
  for (const o of hits) rows.push({ key: o.id, label: o.label, act: () => choose(o.id) });

  // Show only once the user has typed (start typing → the dropdown forms), or via ArrowDown.
  // A query with NO rows still shows the menu — with a quiet "no match" line, never a silent vanish.
  const showMenu = open && (query.length > 0 || (rows.length > 0 && Boolean(noneLabel)));

  function choose(id: string) { onPick(id); after(); }
  function after() { setQ(""); setOpen(false); setHi(0); }
  const closeMenu = useCallback(() => setOpen(false), []);

  function onKey(e: React.KeyboardEvent) {
    if (e.key === "ArrowDown") { e.preventDefault(); setOpen(true); setHi(Math.min(hi + 1, rows.length - 1)); }
    else if (e.key === "ArrowUp") { e.preventDefault(); setHi(Math.max(hi - 1, 0)); }
    else if (e.key === "Enter") { if (rows[hi]) { e.preventDefault(); rows[hi].act(); } }
    else if (e.key === "Escape") { setOpen(false); }
  }

  return (
    <div className="picker">
      <input
        ref={inputRef}
        className="picker-input"
        value={q}
        disabled={disabled}
        placeholder={placeholder}
        onChange={(e) => { setQ(e.target.value); setOpen(true); setHi(0); }}
        // A picker WITH a none-row (a bound value / a filter) opens on click — you'd expect to see
        // the choices; the pure action pickers stay type-first.
        onFocus={() => { if (noneLabel) setOpen(true); }}
        onKeyDown={onKey}
        aria-label={placeholder}
        title={title}
        autoComplete="off"
      />
      {showMenu && (
        <PickerMenu anchorRef={inputRef} rows={rows} hi={hi} setHi={setHi} onClose={closeMenu} empty="no match" />
      )}
    </div>
  );
}
