"use client";

// THE SAVE GUARD — one place that makes sure a debounced write isn't lost to a
// timer you never saw.
//
// Every surface in this app coalesces rapid edits into one write ~350-600ms after
// you stop (the board's cards, a note's writing, a title). That is right for the
// database and wrong for leaving: close the tab, switch apps, let the phone sleep,
// or hit back inside the window and the pending write dies with the page.
//
// So every debounced writer registers its flush here, and we run them all at the
// moments a pending write would otherwise be lost — or could finally succeed.
// THREE events, deliberately:
//   · visibilitychange → hidden — switching apps or tabs. The page is still ALIVE
//     here, so a normal request started now completes. This is the phone case, and
//     it is the one that actually bites.
//   · pagehide — real navigation away or a close. Last chance.
//   · online — the connection came BACK (owner-ruled 2026-09-03). A write that failed
//     offline stays queued with no timer, deliberately: re-arming one would make an
//     offline board a request storm re-firing the error banner every debounce. This
//     event is the opposite — it fires once, exactly when there is a reason to try
//     again. Registering it here rather than in the board means every surface that
//     saves gets the retry, not just cards.
// NOT beforeunload: it is unreliable on mobile Safari and ignored in several
// conditions. The events above are what actually fire.
//
// Flushes must be safe to run twice (both events can fire for one departure) — all
// of ours write the current value, so a repeat is a no-op write, never damage.

const pending = new Set<() => void>();
let listening = false;

function runAll() {
  // Copy first: a flush may unregister itself while we iterate.
  for (const flush of [...pending]) {
    try {
      flush();
    } catch {
      /* one writer failing must never stop the others from saving */
    }
  }
}

function listen() {
  if (listening || typeof window === "undefined") return;
  listening = true;
  window.addEventListener("pagehide", runAll);
  window.addEventListener("online", runAll);
  document.addEventListener("visibilitychange", () => {
    if (document.visibilityState === "hidden") runAll();
  });
}

/** Register a flush for the page-going-away moment. Returns its unregister. */
export function registerSave(flush: () => void): () => void {
  listen();
  pending.add(flush);
  return () => pending.delete(flush);
}
