"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { recordOpening } from "@/lib/db/openings";

// Stamps "you opened this" once on arrival, for the recent section on home
// (plan `recent-section-plan.md`). Mounted by the board page and the note page.
//
// A BROWSER-CLIENT WRITE, not a server action — the house pattern for a small
// owner-scoped write guarded by RLS (pinBoard · pinBit · setBoardGroup · …, all
// called this way from shelf-controls / home-surfaces). It goes through the one
// db module, never Supabase from a component. No server action also means no
// revalidate and no router involvement: stamping a visit must never re-render
// the page the owner just arrived on.
//
// SILENT ON FAILURE, ALWAYS. A dropped connection costs one trail entry and
// nothing else; surfacing it would be noise on a page the owner came here to
// read. `recordOpening` is idempotent (one row per thing, timestamp moved), so
// StrictMode's double mount is harmless.
export function RecordOpening({ kind, id }: { kind: "board" | "note"; id: string }) {
  const [supabase] = useState(() => createClient());
  useEffect(() => {
    recordOpening(supabase, { kind, id }).catch(() => {});
  }, [supabase, kind, id]);
  return null; // renders NOTHING — .board-page is a flex column with a gap
}
