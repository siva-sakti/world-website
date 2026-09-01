import type { Dispatch, SetStateAction } from "react";
import type { SupabaseClient } from "@supabase/supabase-js";
import { unplaceBit, trashBit, getBitBoards } from "@/lib/db/bits";
import { confirm } from "@/components/confirm";
import type { CardVM } from "./card";

// The board's REMOVE acts (I-W1: two distinct, labeled acts), singular and in bulk:
//  · un-place — take the card off THIS board only; the bit lives on (travel keeps
//    the leg). It's loose again, so bump the loose column — after the write LANDS.
//  · trash — freeze the whole bit, hidden everywhere, restorable from /trash.
// Every DB write goes through the settled-create door (per placement): firing while
// a card's create is still in flight would match 0 rows and silently lose the act
// (review finding #1). The multi-board trash confirm stays honest (F16).
//
// ROLLBACK (board-basics review): the removes are optimistic — the card leaves the
// screen before the write lands — so a FAILED write must put it back, or the screen
// lies (a reload would resurrect it). Exception: the "no longer exists" throw means
// the row is already gone (e.g. the leftover of a failed create) — removal from the
// screen is then CORRECT; restoring would resurrect an un-removable zombie.
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

  const isGoneError = (e: unknown) =>
    e instanceof Error && e.message.includes("no longer exists");

  // Put an optimistically-removed card back (unless something already renders under
  // its placement id — never two cards per placement).
  function restore(snap: CardVM) {
    setCards((cs) => (cs.some((c) => c.placementId === snap.placementId) ? cs : [...cs, snap]));
  }

  function handleRemoveFailure(snap: CardVM, e: unknown) {
    if (isGoneError(e)) {
      console.error("remove hit an already-gone row (leftover of a failed create?) — staying removed:", e);
      return; // the screen is already right
    }
    restore(snap);
    onErr(e);
  }

  // Take the card off THIS board only; the bit lives on (its travel keeps the leg).
  function unplaceSelected(placementId: string) {
    const snap = cards.find((c) => c.placementId === placementId);
    setCards((cs) => cs.filter((c) => c.placementId !== placementId));
    clearSelection();
    setEditingId(null);
    settled(placementId)
      .then((id) => unplaceBit(supabase, id))
      .then(() => setLooseRefresh((n) => n + 1)) // loose again — only once it's TRUE
      .catch((e) => snap && handleRemoveFailure(snap, e));
  }

  // Trash the whole bit — hidden everywhere, restorable from /trash. With multi-board,
  // trash is the heavy act (off EVERY board), so the confirm is honest about it (F16).
  async function trashSelected(placementId: string, bitId: string) {
    let n = 1;
    try { n = (await getBitBoards(supabase, bitId)).length; } catch { /* fall back to the plain confirm */ }
    const msg = n > 1
      ? `This card is on ${n} boards — trashing removes it from all of them (restorable from Trash). Continue?`
      : `Move this card to the trash? Hidden everywhere, restorable from Trash.`;
    if (!(await confirm({ message: msg, confirmLabel: "Trash", danger: true }))) return;
    const snap = cards.find((c) => c.placementId === placementId);
    setCards((cs) => cs.filter((c) => c.bitId !== bitId));
    clearSelection();
    setEditingId(null);
    settled(placementId)
      .then(() => trashBit(supabase, bitId))
      .catch((e) => snap && handleRemoveFailure(snap, e));
  }

  // Bulk acts (multi-select, ②c) — the same I-W1 acts, looped, each through the
  // settled door (per placement). Rollback is PER-FAILURE, not all-or-nothing: each
  // card's write is independent, so only the ones that failed come back.
  function bulkUnplace() {
    const chosen = cards.filter((c) => selectedIds.has(c.placementId));
    setCards((cs) => cs.filter((c) => !selectedIds.has(c.placementId)));
    clearSelection();
    setEditingId(null);
    let landed = 0;
    for (const c of chosen) {
      settled(c.placementId)
        .then((id) => unplaceBit(supabase, id))
        .then(() => {
          landed++;
          if (landed === chosen.length) setLooseRefresh((n) => n + 1);
        })
        .catch((e) => handleRemoveFailure(c, e));
    }
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
        ? `Trash ${n} card${n === 1 ? "" : "s"}? ${onOtherBoards} of them also live on other boards — this removes them from all of them (restorable from Trash).`
        : `Trash ${n} card${n === 1 ? "" : "s"}? Hidden everywhere, restorable from Trash.`;
    if (!(await confirm({ message: msg, confirmLabel: "Trash", danger: true }))) return;
    setCards((cs) => cs.filter((c) => !selectedIds.has(c.placementId)));
    clearSelection();
    setEditingId(null);
    for (const c of chosen) {
      settled(c.placementId)
        .then(() => trashBit(supabase, c.bitId))
        .catch((e) => handleRemoveFailure(c, e));
    }
  }

  return { unplaceSelected, trashSelected, bulkUnplace, bulkTrash };
}
