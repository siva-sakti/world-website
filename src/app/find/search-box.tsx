"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";

// The search field. The URL is the query (bookmarkable) — Enter navigates,
// preserving any active tag/type filter.
export function SearchBox({ initial }: { initial: string }) {
  const [q, setQ] = useState(initial);
  const router = useRouter();
  const params = useSearchParams();

  function go() {
    const p = new URLSearchParams(params.toString());
    if (q.trim()) p.set("q", q.trim());
    else p.delete("q");
    router.push(`/find${p.toString() ? `?${p}` : ""}`);
  }

  return (
    <input
      value={q}
      onChange={(e) => setQ(e.target.value)}
      onKeyDown={(e) => e.key === "Enter" && go()}
      placeholder="search your notes…"
      className="w-full border-b border-neutral-300 bg-transparent py-2 text-base outline-none focus:border-neutral-900"
      autoFocus={!initial}
    />
  );
}
