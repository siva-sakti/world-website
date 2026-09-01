import type { Dispatch, SetStateAction } from "react";
import type { SupabaseClient } from "@supabase/supabase-js";
import { unplaceBit, trashBit, getBitBoards, abortBitCreate } from "@/lib/db/bits";
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
  // Flush a card's PENDING writes (typed tail, last nudge) before removing it —
  // the owner-found seam (2026-09-01): forget() after removal drops queued writes,
  // so type-then-remove within the 350ms debounce lost the typed words. Flush
  // first, and the tail lands; forget keeps its teleport-guard job untouched.
  flushNow: (placementId: string) => Promise<boolean>; // true = the words/positions LANDED (hunt #3)
  // Drop a removed card's queued writes once the removal LANDS — a restored patch
  // (F3) must not outlive its card and teleport it after a later call-in (F3e).
  forget: (placementId: string) => void;
  setLooseRefresh: Dispatch<SetStateAction<number>>;
  onErr: (e: unknown) => void;
  // Evaporate's contract reaches the remove acts (R1.3a): a NEVER-had-content
  // board-born bit gets ABORTED, not unplaced/trashed (no blank-bit litter).
  isFreshEmpty: (placementId: string) => boolean;
  clearFresh: (placementId: string) => void;
}) {
  const {
    supabase, cards, selectedIds, setCards, clearSelection,
    setEditingId, settled, flushNow, forget, setLooseRefresh, onErr, isFreshEmpty, clearFresh,
  } = deps;

  // The evaporate-instead-of-remove path: drop the card from state and abort the bit
  // (its placement cascades). No looseRefresh bump — nothing became loose.
  function abortFresh(c: CardVM) {
    clearFresh(c.placementId);
    setCards((cs) => cs.filter((x) => x.placementId !== c.placementId));
    clearSelection();
    setEditingId(null);
    settled(c.placementId)
      .then(() => abortBitCreate(supabase, c.bitId))
      .catch(onErr);
  }

  const isGoneError = (e: unknown) =>
    e instanceof Error && e.message.includes("no longer exists");
  // Hunt #3: a failed pre-remove flush already showed its banner (flush's onErr) and
  // re-queued the words — the remove must simply NOT happen (or trash would freeze a
  // bit whose typed tail never landed, and forget() would then drop it forever).
  const FLUSH_REFUSED = "FLUSH_REFUSED";
  const isFlushRefused = (e: unknown) => e instanceof Error && e.message === FLUSH_REFUSED;

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
    if (snap && isFreshEmpty(placementId)) return abortFresh(snap); // never-had-content → evaporate
    setCards((cs) => cs.filter((c) => c.placementId !== placementId));
    clearSelection();
    setEditingId(null);
    settled(placementId)
      .then(async (id) => {
        if (!(await flushNow(id))) throw new Error(FLUSH_REFUSED); // hunt #3+#6: words first, POST-reconcile key
        return unplaceBit(supabase, id);
      })
      .then(() => {
        forget(placementId); // the card is gone — drop any queued/restored writes for it
        setLooseRefresh((n) => n + 1); // loose again — only once it's TRUE
      })
      .catch((e) => {
        if (isFlushRefused(e)) { if (snap) restore(snap); return; } // banner already up; the card stays
        if (snap) handleRemoveFailure(snap, e);
      });
  }

  // Trash the whole bit — hidden everywhere, restorable from /trash. With multi-board,
  // trash is the heavy act (off EVERY board), so the confirm is honest about it (F16).
  async function trashSelected(placementId: string, bitId: string) {
    // A never-had-content bit has nothing to restore — skip the "restorable from
    // Trash" confirm (it would promise a trash entry the abort never creates) and
    // evaporate instead (the antagonist's honesty wrinkle, decided deliberately).
    const fresh = cards.find((c) => c.placementId === placementId);
    if (fresh && isFreshEmpty(placementId)) return abortFresh(fresh);
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
      .then(async (id) => {
        if (!(await flushNow(id))) throw new Error(FLUSH_REFUSED); // hunt #3+#6
      })
      .then(() => trashBit(supabase, bitId))
      .then(() => forget(placementId))
      .catch((e) => {
        if (isFlushRefused(e)) { if (snap) restore(snap); return; }
        if (snap) handleRemoveFailure(snap, e);
      });
  }

  // Bulk acts (multi-select, ②c) — the same I-W1 acts, looped, each through the
  // settled door (per placement). Rollback is PER-FAILURE, not all-or-nothing: each
  // card's write is independent, so only the ones that failed come back.
  function bulkUnplace() {
    const all = cards.filter((c) => selectedIds.has(c.placementId));
    const fresh = all.filter((c) => isFreshEmpty(c.placementId));
    const chosen = all.filter((c) => !isFreshEmpty(c.placementId));
    setCards((cs) => cs.filter((c) => !selectedIds.has(c.placementId)));
    clearSelection();
    setEditingId(null);
    for (const c of fresh) {
      clearFresh(c.placementId);
      settled(c.placementId).then(() => abortBitCreate(supabase, c.bitId)).catch(onErr);
    }
    // Refresh the loose column on the FIRST landed leg (so genuinely-loose bits show even
    // if a later leg fails) AND once more when all settle (so late legs aren't invisible).
    let landed = 0;
    let settledCount = 0;
    const done = () => {
      settledCount++;
      if (settledCount === chosen.length && landed > 1) setLooseRefresh((n) => n + 1);
    };
    for (const c of chosen) {
      settled(c.placementId)
        .then(async (id) => {
          if (!(await flushNow(id))) throw new Error(FLUSH_REFUSED); // hunt #3+#6
          return unplaceBit(supabase, id);
        })
        .then(() => {
          forget(c.placementId);
          landed++;
          if (landed === 1) setLooseRefresh((n) => n + 1);
          done();
        })
        .catch((e) => {
          if (isFlushRefused(e)) restore(c);
          else handleRemoveFailure(c, e);
          done();
        });
    }
  }

  async function bulkTrash() {
    const everything = cards.filter((c) => selectedIds.has(c.placementId));
    const freshOnes = everything.filter((c) => isFreshEmpty(c.placementId));
    const chosen = everything.filter((c) => !isFreshEmpty(c.placementId));
    for (const c of freshOnes) {
      clearFresh(c.placementId);
      setCards((cs) => cs.filter((x) => x.placementId !== c.placementId));
      settled(c.placementId).then(() => abortBitCreate(supabase, c.bitId)).catch(onErr);
    }
    if (chosen.length === 0) { clearSelection(); setEditingId(null); return; }
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
        .then(async (id) => {
          if (!(await flushNow(id))) throw new Error(FLUSH_REFUSED); // hunt #3+#6
        })
        .then(() => trashBit(supabase, c.bitId))
        .then(() => forget(c.placementId))
        .catch((e) => {
          if (isFlushRefused(e)) restore(c);
          else handleRemoveFailure(c, e);
        });
    }
  }

  return { unplaceSelected, trashSelected, bulkUnplace, bulkTrash };
}
