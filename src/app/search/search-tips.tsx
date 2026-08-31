"use client";

import { useState } from "react";

// A quiet ? by the search box → a non-intrusive cheatsheet for the search language.
// Toggle open/closed; nothing is blocked while it's up.
const TIPS: { syntax: string; means: string }[] = [
  { syntax: "climate", means: "words starting with “climate” — matches as you type" },
  { syntax: "*ai", means: "“ai” anywhere in a word — even buried inside a link" },
  { syntax: "“climate policy”", means: "those words together, in order (use straight quotes)" },
  { syntax: "climate -draft", means: "starts with “climate”, but not “draft”" },
  { syntax: "climate policy", means: "both words appear, in any order" },
];

export function SearchTips() {
  const [open, setOpen] = useState(false);
  return (
    <span className="relative shrink-0">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="flex h-6 w-6 items-center justify-center rounded-full border border-neutral-300 text-xs text-neutral-500 hover:border-neutral-500 hover:text-neutral-800"
        title="search tips"
        aria-label="search tips"
        aria-expanded={open}
      >
        ?
      </button>
      {open && (
        <div className="absolute right-0 z-10 mt-2 w-72 rounded-md border border-neutral-200 bg-white p-3 text-sm shadow-lg">
          <p className="mb-2 font-semibold text-neutral-700">search tips</p>
          <ul className="space-y-1.5">
            {TIPS.map((t) => (
              <li key={t.syntax} className="flex flex-col">
                <code className="text-[13px] text-neutral-900">{t.syntax}</code>
                <span className="text-xs text-neutral-500">{t.means}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </span>
  );
}
