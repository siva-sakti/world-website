import type { Dispatch, SetStateAction } from "react";
import type { SupabaseClient } from "@supabase/supabase-js";
import { unplaceBit, trashBit, getBitBoards } from "@/lib/db/bits";
import { confirm } from "@/components/confirm";
import type { CardVM } from "./card";

// The board's REMOVE acts (I-W1: two distinct, labeled acts), singular and in bulk:
//  · un-place — take the card off THIS board only; the bit lives on (travel keeps
//    the leg). It's loose again, so bump the loose column.
//  · trash — freeze the whole bit, hidden everywhere, restorable from /trash.
// Every DB write goes through the settled-create door (per placement): firing while
// a card's create is still in flight would match 0 rows and silently lose the act
// (review finding #1). The multi-board trash confirm stays honest (F16) — trashing
// removes the note from EVERY board it's on.
export function useBoardActs(deps: {
  supabase: SupabaseClient;
  cards: CardVM[];
  selectedIds: Set<string>;
  setCards: Dispatch<SetStateAction<CardVM[]>>;
  clearSelection: () => void;
  setEditingId: Dispatch<SetStateAction<string | null>>;
  settled: (placementId: string) => Promise<string>;
  setLooseRefresh: Dispatch<SetStateAction<number>>;
  onErr: (e: unknown) => void;
}) {
  const {
    supabase, cards, selectedIds, setCards, clearSelection,
    setEditingId, settled, setLooseRefresh, onErr,
  } = deps;

  function clearCard(placementId: string) {
    setCards((cs) => cs.filter((c) => c.placementId !== placementId));
    clearSelection();
    setEditingId(null);
  }

  // Take the card off THIS board only; the bit lives on (its travel keeps the leg).
  // Through the settled-create door: firing while the card's create is still in
  // flight would match 0 rows and silently lose the removal (review finding #1).
  function unplaceSelected(placementId: string) {
    clearCard(placementId);
    settled(placementId)
      .then((id) => unplaceBit(supabase, id))
      .catch(onErr);
    setLooseRefresh((n) => n + 1); // it's loose again — let the column show it
  }

  // Trash the whole bit — hidden everywhere, restorable from /trash. With multi-board,
  // trash is the heavy act (off EVERY board), so the confirm is honest about it (F16).
  // Same door: the bit row must exist before the freeze can land.
  async function trashSelected(placementId: string, bitId: string) {
    let n = 1;
    try { n = (await getBitBoards(supabase, bitId)).length; } catch { /* fall back to the plain confirm */ }
    const msg = n > 1
      ? `This note is on ${n} boards — trashing removes it from all of them (restorable from Trash). Continue?`
      : `Move this note to the trash? Hidden everywhere, restorable from Trash.`;
    if (!(await confirm({ message: msg, confirmLabel: "Trash", danger: true }))) return;
    setCards((cs) => cs.filter((c) => c.bitId !== bitId));
    clearSelection();
    setEditingId(null);
    settled(placementId)
      .then(() => trashBit(supabase, bitId))
      .catch(onErr);
  }

  // Bulk acts (multi-select, ②c) — the same I-W1 acts, looped, each through the
  // settled door (per placement); the trash confirm keeps ①'s multi-board honesty.
  function bulkUnplace() {
    const ids = [...selectedIds];
    setCards((cs) => cs.filter((c) => !selectedIds.has(c.placementId)));
    clearSelection();
    setEditingId(null);
    for (const pid of ids) settled(pid).then((id) => unplaceBit(supabase, id)).catch(onErr);
    setLooseRefresh((n) => n + 1);
  }

  async function bulkTrash() {
    const chosen = cards.filter((c) => selectedIds.has(c.placementId));
    const bitIds = [...new Set(chosen.map((c) => c.bitId))];
    let onOtherBoards = 0;
    try {
      const counts = await Promise.all(bitIds.map((bid) => getBitBoards(supabase, bid)));
      onOtherBoards = counts.filter((boards) => boards.length > 1).length;
    } catch { /* fall back to the plain confirm */ }
    const n = bitIds.length;
    const msg =
      onOtherBoards > 0
        ? `Trash ${n} note${n === 1 ? "" : "s"}? ${onOtherBoards} of them also live on other boards — this removes them from all of them (restorable from Trash).`
        : `Trash ${n} note${n === 1 ? "" : "s"}? Hidden everywhere, restorable from Trash.`;
    if (!(await confirm({ message: msg, confirmLabel: "Trash", danger: true }))) return;
    setCards((cs) => cs.filter((c) => !selectedIds.has(c.placementId)));
    clearSelection();
    setEditingId(null);
    for (const c of chosen) settled(c.placementId).then(() => trashBit(supabase, c.bitId)).catch(onErr);
  }

  return { unplaceSelected, trashSelected, bulkUnplace, bulkTrash };
}
