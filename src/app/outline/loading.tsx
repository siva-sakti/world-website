// Instant frame for /outline: Next renders this the moment you navigate, while
// the server component runs its DB reads (up to 5 round-trips) behind it. Mirrors
// the outline's real shape — header, intro, a search bar, a few board sections
// with row lines — so the layout doesn't jump when the data arrives. Static +
// decorative: no data, no interactivity. Palette matches the warm-quiet theme
// (globals.css: borders #ece7de, fills a shade lighter).

// A few natural-looking row widths so the placeholder reads as content, not a grid.
const SECTIONS: number[][] = [
  [58, 42, 71],
  [66, 49],
  [52, 63, 38, 74],
];

export default function OutlineLoading() {
  return (
    <main className="mx-auto max-w-4xl px-6 py-10">
      <header className="mb-6 flex items-baseline justify-between">
        <span className="text-sm font-semibold">outline</span>
      </header>

      <p className="mb-4 text-sm text-neutral-500">
        Your whole world as a list — every board and what&rsquo;s placed on it, plus what&rsquo;s
        still loose. Search, filter, and scan; click through to open anything.
      </p>

      {/* controls row (search + tag picker), shaped but empty */}
      <div className="mt-6 flex flex-wrap items-center gap-2.5" aria-hidden>
        <div className="h-7 min-w-[140px] flex-1 animate-pulse rounded-full bg-[#efeae0]" />
        <div className="h-6 w-32 animate-pulse rounded bg-[#efeae0]" />
      </div>

      {/* a handful of board sections with placeholder rows */}
      <div className="mt-6 space-y-6" aria-hidden>
        {SECTIONS.map((rows, s) => (
          <section key={s}>
            <div className="mb-2 flex items-center gap-2">
              <span className="text-neutral-300">▾</span>
              <div className="h-3.5 w-28 animate-pulse rounded bg-[#efeae0]" />
              <div className="h-3 w-4 animate-pulse rounded bg-[#efeae0]" />
            </div>
            <ul className="border-t border-[#ece7de]">
              {rows.map((w, r) => (
                <li
                  key={r}
                  className="flex items-center gap-3 border-b border-[#ece7de] px-1 py-[9px]"
                >
                  <div
                    className="h-3.5 animate-pulse rounded bg-[#efeae0]"
                    style={{ width: `${w}%` }}
                  />
                </li>
              ))}
            </ul>
          </section>
        ))}
      </div>

      <span className="sr-only" role="status">
        Loading your outline…
      </span>
    </main>
  );
}
