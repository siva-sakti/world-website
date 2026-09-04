import { headers } from "next/headers";
import { FALLBACK_ZONE } from "./dates";

// THE SERVER'S GUESS at where the reader is (I-G5).
//
// The device decides what day a moment reads as — but the server renders the page
// first, and it has no way to ask. So it guesses, and the browser corrects it on
// hydration (components/zone.tsx). The important property: THE GUESS CAN BE WRONG AT
// NO COST. It only decides the first paint, and the device always wins a moment later.
// So this never needs to be right, only usually right — which is a much easier thing
// to build, and why there is no failure mode here to handle.
//
// `x-vercel-ip-timezone` is an IANA name (e.g. "America/Chicago") that every Vercel
// deployment receives, on by default, no configuration (verified against Vercel's docs
// 2026-09-03). It is absent locally and behind a proxy, and IP geolocation is defeated
// by a VPN — all of which land on the fallback, which is fine, per the above.
export async function readerZone(): Promise<string> {
  try {
    const h = await headers();
    return h.get("x-vercel-ip-timezone") || FALLBACK_ZONE;
  } catch {
    return FALLBACK_ZONE; // rendered outside a request (a static page, a test)
  }
}
