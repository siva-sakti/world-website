import type { Dispatch, SetStateAction } from "react";
import type { SupabaseClient } from "@supabase/supabase-js";
import { unplaceBit, trashBit, restoreBit, callInBit, setPlacementLock, getBitBoards, abortBitCreate } from "@/lib/db/bits";
import type { useUndo } from "./use-undo";
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
  boardId: string; // the revive (undo of un-place) needs its board
  cards: CardVM[];
  cardsRef: React.RefObject<CardVM[]>; // reverse-time truth (never snapshots) — the house rule
  record: ReturnType<typeof useUndo>["record"];
  fail: ReturnType<typeof useUndo>["fail"];
  trackCreate: (placementId: string, p: Promise<unknown>) => void;
  reconcileId: (oldId: string, newId: string) => void;
  chain: (realId: string, fn: () => Promise<void>) => Promise<void>;
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
  // Hunt #9: duplicate-board awaits flushAll + pendingCreates — but removes are
  // NEITHER, so a copy could include a card whose removal was in flight. Every
  // remove's chain registers here (self-cleaning); duplicateThis awaits the set.
  trackRemove: (p: Promise<unknown>) => void;
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
    supabase, boardId, cards, cardsRef, record, fail, trackCreate, reconcileId, chain,
    selectedIds, setCards, clearSelection,
    setEditingId, settled, flushNow, trackRemove, forget, setLooseRefresh, onErr, isFreshEmpty, clearFresh,
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

  // ---- FLOOR 3: the keeping acts' reverses (undo plan §5, all amendments) ----

  /** Undo of an un-place = REVIVE at the snapshot's spot. Travel preserved by
   *  construction: callInBit with the CAPTURED placementId collides on the departed
   *  row and revives it — same row, arrival intact, reconcileId a no-op. The re-add
   *  is optimistic and ROLLED BACK on failure; the revive registers via trackCreate
   *  so a drag on the restored card can't race the in-flight insert (the bringIn
   *  choreography, mirrored); the LOCK is re-applied (unplaceBit clears it — the
   *  review's catch: without this, undo returns the card unlocked). */
  async function reviveOne(snap: CardVM): Promise<void> {
    if (cardsRef.current?.some((c) => c.bitId === snap.bitId)) return; // already back (another door)
    setCards((cs) => (cs.some((c) => c.bitId === snap.bitId) ? cs : [...cs, snap]));
    try {
      const p = callInBit(supabase, {
        bitId: snap.bitId, boardId, placementId: snap.placementId,
        x: snap.x, y: snap.y, width: snap.w ?? null, height: snap.h ?? null, z: snap.z ?? 0,
      });
      trackCreate(snap.placementId, p);
      const placement = await p;
      if (placement.id !== snap.placementId) {
        // the twin/stale case — rename in flight, exactly as bringIn does
        reconcileId(snap.placementId, placement.id);
        setCards((cs) => cs.map((c) => (c.placementId === snap.placementId ? { ...c, placementId: placement.id } : c)));
      }
      setLooseRefresh((n) => n + 1); // no longer loose — the column must stop offering it
      // The lock re-apply sits OUTSIDE the rollback (antagonist J5): the revive
      // LANDED — un-painting the card over a lock hiccup would make the screen lie
      // the other way. A failed re-lock is surfaced, not fatal; retrying the entry
      // would early-return on the already-back guard anyway.
      if (snap.locked) {
        await chain(placement.id, () => setPlacementLock(supabase, placement.id, true)).catch((e) =>
          console.error("revive landed but the lock could not be re-applied:", e),
        );
      }
    } catch (e) {
      setCards((cs) => cs.filter((c) => c.bitId !== snap.bitId)); // roll the re-add back out
      throw e; // TRASHED_BIT/TRASHED_BOARD classify terminal; network stays retryable
    }
  }

  /** Redo of an un-place = remove again, resolved against the CURRENT card. */
  async function unplaceOne(bitId: string): Promise<void> {
    const cur = cardsRef.current?.find((c) => c.bitId === bitId);
    if (!cur) throw new Error("that card no longer exists on this board");
    setCards((cs) => cs.filter((c) => c.bitId !== bitId));
    try {
      const id = await settled(cur.placementId);
      if (!(await flushNow(id))) throw new Error(FLUSH_REFUSED);
      await unplaceBit(supabase, id);
      forget(cur.placementId);
      setLooseRefresh((n) => n + 1);
    } catch (e) {
      setCards((cs) => (cs.some((c) => c.bitId === bitId) ? cs : [...cs, cur]));
      throw e;
    }
  }

  /** N-legged reverse: every survivor is applied; terminal only when NOTHING could
   *  be (the floor-2 antagonist's D4 rule, reused here). One banner, not N. */
  async function allLegs(legs: (() => Promise<void>)[]): Promise<void> {
    let applied = 0;
    let firstErr: unknown = null;
    for (const leg of legs) {
      try { await leg(); applied++; } catch (e) { if (firstErr === null) firstErr = e; }
    }
    if (applied === 0 && firstErr !== null) throw firstErr;
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
    const act = settled(placementId)
      .then(async (id) => {
        if (!(await flushNow(id))) throw new Error(FLUSH_REFUSED); // hunt #3+#6: words first, POST-reconcile key
        return unplaceBit(supabase, id);
      })
      .then(() => {
        forget(placementId); // the card is gone — drop any queued/restored writes for it
        setLooseRefresh((n) => n + 1); // loose again — only once it's TRUE
      });
    // The entry rides the act's own promise (`settled` field): pressing ↶ 200ms in
    // waits for the un-place to land before reviving (stage-1 D6). Lifecycle: a
    // refused/failed act un-happened → entry FAILED (never replays); the already-
    // gone carve → the reverse can't succeed → entry DEAD (plan §5).
    const entry = snap
      ? record(
          "remove card from board", [snap.bitId],
          () => reviveOne(snap),
          () => unplaceOne(snap.bitId),
          act,
        )
      : null;
    trackRemove(
      act.catch((e) => {
        if (entry) fail(entry);
        if (isFlushRefused(e)) { if (snap) restore(snap); return; } // banner already up; the card stays
        if (snap) handleRemoveFailure(snap, e);
      }),
    );
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
    const act = settled(placementId)
      .then(async (id) => {
        if (!(await flushNow(id))) throw new Error(FLUSH_REFUSED); // hunt #3+#6
      })
      .then(() => trashBit(supabase, bitId))
      .then(() => forget(placementId));
    // Undo = RESTORE (global — the bit returns everywhere trash froze it), then the
    // card back on screen; DB first so a failed restore never paints a ghost. Redo
    // re-trashes WITHOUT re-asking the confirm (ruled). A restore refused because
    // the bit was destroyed → "no longer in the trash" → terminal → dead, honestly.
    const entry = snap
      ? record(
          "trash card", [snap.bitId],
          async () => {
            await restoreBit(supabase, bitId);
            setCards((cs) => (cs.some((c) => c.bitId === snap.bitId) ? cs : [...cs, snap]));
          },
          async () => {
            const cur = cardsRef.current?.find((c) => c.bitId === snap.bitId);
            setCards((cs) => cs.filter((c) => c.bitId !== snap.bitId));
            try {
              // The redo honors the owner-found seam exactly like the act (antagonist
              // D4): type into the restored card, press ↷ inside the debounce, and
              // without this the typed tail would be forgotten with the freeze.
              if (cur) {
                const id = await settled(cur.placementId);
                if (!(await flushNow(id))) throw new Error(FLUSH_REFUSED);
              }
              await trashBit(supabase, bitId);
              if (cur) forget(cur.placementId);
            } catch (e) {
              if (cur) setCards((cs) => (cs.some((c) => c.bitId === snap.bitId) ? cs : [...cs, cur]));
              throw e;
            }
          },
          act,
        )
      : null;
    trackRemove(
      act.catch((e) => {
        if (entry) fail(entry);
        if (isFlushRefused(e)) { if (snap) restore(snap); return; }
        if (snap) handleRemoveFailure(snap, e);
      }),
    );
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
    // ONE entry for the whole gesture (plan §5): undo revives every survivor, redo
    // un-places them again — the D4 survivor rule via allLegs. The entry rides the
    // WHOLE gesture's writes; if EVERY leg fails the gesture un-happened → FAILED.
    const snaps = chosen.map((c) => ({ ...c }));
    const legs: Promise<unknown>[] = [];
    let failedLegs = 0;
    // J1: a leg that FAILED (its card was restored) leaves `alive` — the reverses
    // iterate only what actually landed, so undo-then-redo never does more than the
    // gesture did. The label still counts the GESTURE (a deliberate overstatement,
    // one word of noise beats a shifting label).
    const landedSet = new Set(snaps.map((c) => c.bitId));
    const live = () => snaps.filter((c) => landedSet.has(c.bitId));
    const entry = snaps.length
      ? record(
          snaps.length === 1 ? "remove card from board" : `remove ${snaps.length} cards from board`,
          snaps.map((c) => c.bitId),
          () => allLegs(live().map((c) => () => reviveOne(c))),
          () => allLegs(live().map((c) => () => unplaceOne(c.bitId))),
        )
      : null;
    for (const c of chosen) {
      const leg = settled(c.placementId)
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
          failedLegs++;
          landedSet.delete(c.bitId); // this card never left — the reverses skip it (J1)
          if (entry && failedLegs === chosen.length) fail(entry); // nothing happened → no memory
          if (isFlushRefused(e)) restore(c);
          else handleRemoveFailure(c, e);
          done();
        });
      legs.push(leg);
      trackRemove(leg);
    }
    if (entry) entry.settled = Promise.allSettled(legs); // ↶ waits for the gesture to land (D6)
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
    const snaps = chosen.map((c) => ({ ...c }));
    const legs: Promise<unknown>[] = [];
    let failedLegs = 0;
    const landedSet = new Set(snaps.map((c) => c.bitId)); // J1 — see bulkUnplace
    const live = () => snaps.filter((c) => landedSet.has(c.bitId));
    const entry = snaps.length
      ? record(
          snaps.length === 1 ? "trash card" : `trash ${snaps.length} cards`,
          snaps.map((c) => c.bitId),
          // Undo = restore each bit (DB first), then its card back; redo re-trashes
          // without re-asking (ruled). The D4 survivor rule both ways.
          () =>
            allLegs(
              live().map((c) => async () => {
                await restoreBit(supabase, c.bitId);
                setCards((cs) => (cs.some((x) => x.bitId === c.bitId) ? cs : [...cs, c]));
              }),
            ),
          () =>
            allLegs(
              live().map((c) => async () => {
                const cur = cardsRef.current?.find((x) => x.bitId === c.bitId);
                setCards((cs) => cs.filter((x) => x.bitId !== c.bitId));
                try {
                  if (cur) {
                    const id = await settled(cur.placementId); // the D4 flush gate, bulk leg
                    if (!(await flushNow(id))) throw new Error(FLUSH_REFUSED);
                  }
                  await trashBit(supabase, c.bitId);
                  if (cur) forget(cur.placementId);
                } catch (e) {
                  if (cur) setCards((cs) => (cs.some((x) => x.bitId === c.bitId) ? cs : [...cs, cur]));
                  throw e;
                }
              }),
            ),
        )
      : null;
    for (const c of chosen) {
      const leg = settled(c.placementId)
        .then(async (id) => {
          if (!(await flushNow(id))) throw new Error(FLUSH_REFUSED); // hunt #3+#6
        })
        .then(() => trashBit(supabase, c.bitId))
        .then(() => forget(c.placementId))
        .catch((e) => {
          failedLegs++;
          landedSet.delete(c.bitId); // J1
          if (entry && failedLegs === chosen.length) fail(entry);
          if (isFlushRefused(e)) restore(c);
          else handleRemoveFailure(c, e);
        });
      legs.push(leg);
      trackRemove(leg);
    }
    if (entry) entry.settled = Promise.allSettled(legs); // ↶ waits for the gesture to land (D6)
  }

  return { unplaceSelected, trashSelected, bulkUnplace, bulkTrash };
}
