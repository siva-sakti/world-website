"use client";

import { createContext, useContext, useSyncExternalStore } from "react";
import { FALLBACK_ZONE } from "@/lib/dates";

// WHERE THE READER IS — the one answer every date on the page formats against (I-G5).
//
// The server renders first and cannot ask the browser where it is, so it passes its
// best guess (lib/reader-zone) and the device's own answer takes over on hydration.
// Both renders read this one context, so a date is never formatted against two
// different answers within a single paint.
//
// useSyncExternalStore, not an effect: this is exactly the "a value only the browser
// knows" case it exists for. It hands React a server snapshot to render and hydrate
// with, then the real one — no setState during render, no flash written by hand.
//
// A stored preference, when a profile page exists, becomes an OVERRIDE right here —
// one line, ahead of the device read. Deliberately not a REPLACEMENT for asking the
// device: someone who never set a preference should still get their own dates.

const ZoneContext = createContext<string>(FALLBACK_ZONE);

/** The device's own zone ("America/Los_Angeles"). Falls back where Intl has no data. */
function deviceZone(): string {
  try {
    return Intl.DateTimeFormat().resolvedOptions().timeZone || FALLBACK_ZONE;
  } catch {
    return FALLBACK_ZONE;
  }
}

// The zone cannot change under a live page, so there is nothing to subscribe to.
const noSubscription = () => () => {};

export function ZoneProvider({ guess, children }: { guess: string; children: React.ReactNode }) {
  const zone = useSyncExternalStore(noSubscription, deviceZone, () => guess);
  return <ZoneContext.Provider value={zone}>{children}</ZoneContext.Provider>;
}

export const useReaderZone = () => useContext(ZoneContext);
