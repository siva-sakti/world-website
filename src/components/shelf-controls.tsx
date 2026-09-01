"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { pinBit, setBitGroup, createGroup, type ShelfGroup } from "@/lib/db/shelf";
import { FolderPicker } from "@/components/folder-picker";

// THE shared shelf controls for a BIT — promoted out of note-card (review R4.21:
// they render on four routes — bits cards + rows, the bit page, the note page —
// and shared leaf controls belong in components/, not deep-imported from the
// route file they were born in). Board rows use FolderPicker + their own pin.

/** The quiet folder picker (O1b → V4: one shared control) — a note shelves like a board. */
export function GroupPicker({
  bitId,
  groupId,
  groups,
}: {
  bitId: string;
  groupId: string | null;
  groups: ShelfGroup[];
}) {
  const [supabase] = useState(() => createClient());
  const [busy, setBusy] = useState(false);
  const [failed, setFailed] = useState(false);
  const router = useRouter();
  async function run(fn: () => Promise<unknown>) {
    setBusy(true);
    setFailed(false);
    try {
      await fn();
      router.refresh();
    } catch (e) {
      console.error(e);
      setFailed(true); // visible — a silent busy-release is not feedback
    } finally {
      setBusy(false);
    }
  }
  return (
    <>
      <FolderPicker
        value={groupId}
        groups={groups}
        busy={busy}
        title="which folder"
        onPick={(gid) => run(() => setBitGroup(supabase, bitId, gid))}
        onNew={(name) =>
          run(async () => {
            const g = await createGroup(supabase, name);
            await setBitGroup(supabase, bitId, g.id);
          })
        }
      />
      {failed && <span className="text-xs text-red-700" title="that folder change didn't save — try again">failed</span>}
    </>
  );
}

/** The ★/☆ pin toggle (O1) — shared by the card, the row, and the pages. */
export function PinToggle({ bitId, pinned }: { bitId: string; pinned: boolean }) {
  const [supabase] = useState(() => createClient());
  const [busy, setBusy] = useState(false);
  const [failed, setFailed] = useState(false);
  const router = useRouter();
  return (
    <button
      className={`shelf-pin${failed ? " text-red-700" : ""}`}
      disabled={busy}
      title={failed ? "that didn't save — click to try again" : pinned ? "no longer alive" : "mark alive — it greets you on home"}
      onClick={async () => {
        setBusy(true);
        setFailed(false);
        try {
          await pinBit(supabase, bitId, !pinned);
          router.refresh();
        } catch (e) {
          console.error(e);
          setFailed(true); // visible — a silent busy-release is not feedback
        } finally {
          setBusy(false);
        }
      }}
    >
      {pinned ? "★" : "☆"}
    </button>
  );
}
