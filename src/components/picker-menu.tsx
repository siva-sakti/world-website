"use client";

import { useEffect, useState, type RefObject } from "react";
import { createPortal } from "react-dom";

export type MenuRow = {
  key: string;
  label: string;
  special?: boolean; // an action row ("no folder", create "…") — accent-colored
  current?: boolean; // the row that's currently chosen (✓)
  act: () => void;
};

// THE portaled picker menu — one menu, two triggers: SearchablePicker's input and the
// FolderPicker's name+▾. Portaled to <body> and positioned fixed by the anchor's rect, so an
// overflow:hidden card can never clip it; closes on scroll/resize (it must never drift from its
// trigger) and on a click outside. Rows pick on MOUSEDOWN (fires before an input's blur, so the
// pick always registers). `children` renders above the rows (the folder menu's search line).
export function PickerMenu({
  anchorRef,
  rows,
  hi,
  setHi,
  onClose,
  children,
}: {
  anchorRef: RefObject<HTMLElement | null>; // the ref itself — read in the effect, never during render
  rows: MenuRow[];
  hi: number;
  setHi: (i: number) => void;
  onClose: () => void;
  children?: React.ReactNode;
}) {
  const [pos, setPos] = useState<{ top: number; left: number; width: number } | null>(null);

  useEffect(() => {
    const anchor = anchorRef.current;
    if (!anchor) return;
    const r = anchor.getBoundingClientRect();
    setPos({ top: r.bottom + 4, left: r.left, width: Math.max(r.width, 170) });
    function close() {
      onClose();
    }
    function onDoc(e: MouseEvent) {
      const t = e.target as HTMLElement;
      if (!anchor!.contains(t) && !t.closest?.(".picker-menu")) onClose();
    }
    window.addEventListener("scroll", close, true);
    window.addEventListener("resize", close);
    document.addEventListener("mousedown", onDoc);
    return () => {
      window.removeEventListener("scroll", close, true);
      window.removeEventListener("resize", close);
      document.removeEventListener("mousedown", onDoc);
    };
  }, [anchorRef, onClose]);

  if (!pos) return null;
  return createPortal(
    <ul
      className="picker-menu"
      role="listbox"
      style={{ position: "fixed", top: pos.top, left: pos.left, width: pos.width }}
    >
      {children}
      {rows.map((r, i) => (
        <li
          key={r.key}
          role="option"
          aria-selected={i === hi}
          className={`picker-row${i === hi ? " is-hi" : ""}${r.special ? " picker-row--special" : ""}`}
          onMouseEnter={() => setHi(i)}
          onMouseDown={(e) => {
            e.preventDefault();
            r.act();
          }}
        >
          {r.current ? "✓ " : ""}
          {r.label}
        </li>
      ))}
    </ul>,
    document.body,
  );
}
