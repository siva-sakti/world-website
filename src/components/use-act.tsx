"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

// THE ACT DOOR — one definition of "a button that does something, might be slow, and
// might fail."
//
// This shape was written out NINE times, under three different names (`onClick`, `run`,
// `act`), each with its own copy of the same five lines: flag busy, clear the last
// failure, await, refresh the page, catch → log → show the failure, release busy. Even
// the comment travelled with it verbatim — "visible — a silent busy-release is not
// feedback" appeared in six files.
//
// Nine copies of one decision is nine chances for them to disagree, and they already had:
// some released `busy` in a `finally`, some only in the `catch`.
//
// THAT DIFFERENCE IS REAL AND IS PRESERVED. The acts that NAVIGATE AWAY on success
// (archive, trash, destroy — the page you are on stops existing) deliberately leave the
// button disabled, because flicking it back to "ready" mid-navigation looks like the act
// did nothing. Pass `keepBusyOnSuccess` for those. The acts that stay on the page
// (pin, folder, un-archive, empty trash) release it. One door, one honest option.

export function useAct(opts?: { keepBusyOnSuccess?: boolean }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [failed, setFailed] = useState(false);

  /** Run it. Re-entry is refused while busy — a double-tap must not fire twice. */
  async function run(fn: () => Promise<unknown>): Promise<void> {
    if (busy) return;
    setBusy(true);
    setFailed(false);
    try {
      await fn();
      router.refresh();
      if (!opts?.keepBusyOnSuccess) setBusy(false);
    } catch (e) {
      console.error(e);
      // Visible — a silent busy-release is not feedback.
      setFailed(true);
      setBusy(false); // always released on failure: you must be able to try again
    }
  }

  return { busy, failed, run, clearFailed: () => setFailed(false) };
}

/** The failure note that sits beside a button. Was written out identically six times. */
export function FailedNote({ failed }: { failed: boolean }) {
  if (!failed) return null;
  return <span className="ml-1 text-xs text-red-700">failed — try again</span>;
}
