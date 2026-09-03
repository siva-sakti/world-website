import type { Dispatch, SetStateAction } from "react";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { useUndo } from "./use-undo";
import type { CardVM } from "./card-vm";
import { runLegs, countLabel } from "./act-rules";

/** THE OUTSIDE WORLD, passed in rather than imported.
 *
 *  This module has no React hooks in it — it is a plain function of its arguments —
 *  so these seven calls were the ONLY thing standing between the board's most
 *  dangerous code and an automated test. Importing them by name also meant a test
 *  runner could not load the file at all (the `@/` paths don't resolve outside the
 *  Next build). board-surface.tsx passes the real ones; remove-acts.test.mjs
 *  passes fakes and drives all four gestures, their rollbacks, and undo/redo.
 *
 *  Deliberately structural, not `typeof unplaceBit` etc.: a test's fake should have
 *  to satisfy the SHAPE the acts actually use, not import the db module to get it.
 *  `callInBit` is typed by the one field this file reads (`id`). */
export type RemoveDoors = {
  unplaceBit: (s: SupabaseClient, placementId: string) => Promise<void>;
  trashBit: (s: SupabaseClient, bitId: string) => Promise<void>;
  restoreBit: (s: SupabaseClient, bitId: string) => Promise<void>;
  archiveBit: (s: SupabaseClient, bitId: string) => Promise<void>;
  unarchiveBit: (s: SupabaseClient, bitId: string) => Promise<void>;
  callInBit: (
    s: SupabaseClient,
    args: {
      bitId: string; boardId: string; placementId: string;
      x: number; y: number; width?: number | null; height?: number | null; z?: number | null;
    },
  ) => Promise<{ id: string }>;
  setPlacementLock: (s: SupabaseClient, placementId: string, on: boolean) => Promise<void>;
  getBitBoards: (s: SupabaseClient, bitId: string) => Promise<{ id: string; title: string | null }[]>;
  /** Ask before trashing — THE one trash confirm (app/trash/trash-confirm), shared with
   *  /bits, /bit/[id] and /write. Injected rather than imported so this module stays
   *  loadable by the test runner, and so a test can answer yes/no without a dialog. */
  confirmTrash: (args: { count?: number; noun?: string; onBoards?: number; shared?: number }) => Promise<boolean>;
  /** Ask before archiving — the one archive confirm (app/archive/archive-confirm),
   *  shared with /bits and /bit/[id]. Same injection reasoning as confirmTrash. */
  confirmArchive: (args: { count?: number; noun?: string; onBoards?: number }) => Promise<boolean>;
};

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
export function removeActs(deps: {
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
  /** The db doors + the confirm dialog (see RemoveDoors). */
  doors: RemoveDoors;
}) {
  const {
    supabase, boardId, cards, cardsRef, record, fail, trackCreate, reconcileId, chain,
    selectedIds, setCards, clearSelection,
    setEditingId, settled, flushNow, trackRemove, forget, setLooseRefresh, onErr, doors,
  } = deps;


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
      const p = doors.callInBit(supabase, {
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
        await chain(placement.id, () => doors.setPlacementLock(supabase, placement.id, true)).catch((e) =>
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
      await doors.unplaceBit(supabase, id);
      forget(cur.placementId);
      setLooseRefresh((n) => n + 1);
    } catch (e) {
      setCards((cs) => (cs.some((c) => c.bitId === bitId) ? cs : [...cs, cur]));
      throw e;
    }
  }

  function handleRemoveFailure(snap: CardVM, e: unknown) {
    if (isGoneError(e)) {
      console.error("remove hit an already-gone row (leftover of a failed create?) — staying removed:", e);
      return; // the screen is already right
    }
    restore(snap);
    onErr(e);
  }

  /** Undo of a trash = RESTORE the bit globally (it returns everywhere trash froze
   *  it), then the card back on screen. DB first, so a failed restore never paints a
   *  ghost card over a bit that is still frozen. */
  async function restoreOne(snap: CardVM): Promise<void> {
    await doors.restoreBit(supabase, snap.bitId);
    setCards((cs) => (cs.some((c) => c.bitId === snap.bitId) ? cs : [...cs, snap]));
  }

  /** Redo of a trash = trash again, resolved against the CURRENT card. Honors the
   *  owner-found flush seam exactly like the act does (antagonist D4): type into the
   *  restored card, press redo inside the 350ms debounce, and without the gate the
   *  typed tail would be forgotten along with the freeze. */
  async function trashOne(snap: CardVM): Promise<void> {
    const cur = cardsRef.current?.find((c) => c.bitId === snap.bitId);
    setCards((cs) => cs.filter((c) => c.bitId !== snap.bitId));
    try {
      if (cur) {
        const id = await settled(cur.placementId);
        if (!(await flushNow(id))) throw new Error(FLUSH_REFUSED);
      }
      await doors.trashBit(supabase, snap.bitId);
      if (cur) forget(cur.placementId);
    } catch (e) {
      if (cur) setCards((cs) => (cs.some((c) => c.bitId === snap.bitId) ? cs : [...cs, cur]));
      throw e;
    }
  }

  /** Undo of an archive = un-archive the bit globally, then the card back on screen.
   *  Same shape as restoreOne: archive and trash both hide a bit from every board via
   *  the SAME board_cards view filter (b.state = 'live'), so no placement recreation is
   *  needed either way — the placement row was never touched. Kept as its own function
   *  rather than folded into restoreOne: this module's tested history is worth more than
   *  the few lines a merge would save. */
  async function unarchiveOne(snap: CardVM): Promise<void> {
    await doors.unarchiveBit(supabase, snap.bitId);
    setCards((cs) => (cs.some((c) => c.bitId === snap.bitId) ? cs : [...cs, snap]));
  }

  /** Redo of an archive = archive again, resolved against the CURRENT card. Same flush
   *  gate as trashOne — a typed tail must land before the bit freezes. */
  async function archiveOne(snap: CardVM): Promise<void> {
    const cur = cardsRef.current?.find((c) => c.bitId === snap.bitId);
    setCards((cs) => cs.filter((c) => c.bitId !== snap.bitId));
    try {
      if (cur) {
        const id = await settled(cur.placementId);
        if (!(await flushNow(id))) throw new Error(FLUSH_REFUSED);
      }
      await doors.archiveBit(supabase, snap.bitId);
      if (cur) forget(cur.placementId);
    } catch (e) {
      if (cur) setCards((cs) => (cs.some((c) => c.bitId === snap.bitId) ? cs : [...cs, cur]));
      throw e;
    }
  }

  // ---- ONE gesture, three kinds ----
  // These acts (un-place / trash / archive, one card / many) used to be four hand-written
  // copies of the same shape: the same flush gate, the same J1 landed bookkeeping, the
  // same failure carve, the same "one entry for the whole gesture" scaffold. The trash
  // legs were character-identical apart from variable names. Archive joined later
  // (2026-09-03) as a THIRD kind through the same removeGesture/removeLeg machinery —
  // it collapses the same way trash's single/bulk pair did, at n = 1.
  //
  // The insight that collapses them: SINGULAR IS BULK WITH ONE CARD. Every difference
  // that looked real resolves at n = 1 (the loose-refresh dance fires once; the
  // all-legs-failed test is 1 === 1; allSettled over one leg settles with that leg).
  // The equivalence was written out case by case before this was touched.
  //
  // What did NOT collapse, and stays at the door: the confirm sentences. The two trash
  // doors count different things and say different things, and that is copy — the
  // owner's to write, not mine to standardise (see act-rules.ts).

  type RemoveKind = "unplace" | "trash" | "archive";

  /** One card's DB write. Every remove goes through the settled door (a write fired
   *  while the card's create is in flight matches 0 rows and silently loses the act),
   *  then the flush gate (hunt #3+#6: the owner's typed tail lands BEFORE the row is
   *  frozen, keyed POST-reconcile), then forget() so no queued write outlives the card. */
  async function removeLeg(kind: RemoveKind, card: CardVM): Promise<void> {
    const id = await settled(card.placementId);
    if (!(await flushNow(id))) throw new Error(FLUSH_REFUSED);
    if (kind === "unplace") await doors.unplaceBit(supabase, id);
    else if (kind === "trash") await doors.trashBit(supabase, card.bitId);
    else await doors.archiveBit(supabase, card.bitId);
    forget(card.placementId);
  }

  function labelFor(kind: RemoveKind, n: number): string {
    if (kind === "unplace") return countLabel("remove", n, "from board");
    if (kind === "trash") return countLabel("trash", n);
    return countLabel("archive", n);
  }

  function undoLegFor(kind: RemoveKind, c: CardVM): () => Promise<void> {
    if (kind === "unplace") return () => reviveOne(c);
    if (kind === "trash") return () => restoreOne(c);
    return () => unarchiveOne(c);
  }

  function redoLegFor(kind: RemoveKind, c: CardVM): () => Promise<void> {
    if (kind === "unplace") return () => unplaceOne(c.bitId);
    if (kind === "trash") return () => trashOne(c);
    return () => archiveOne(c);
  }

  /** Remove these cards — optimistically on screen, then one independent write each.
   *  Rollback is PER-FAILURE, never all-or-nothing: only the legs that failed come back. */
  function removeGesture(kind: RemoveKind, chosen: CardVM[]) {
    // Cleared FIRST so an empty selection still resets the bar (bulkUnplace did this
    // even with nothing chosen — preserved).
    clearSelection();
    setEditingId(null);
    if (!chosen.length) return;

    const snaps = chosen.map((c) => ({ ...c }));
    const gone = new Set(snaps.map((c) => c.bitId));
    setCards((cs) => cs.filter((c) => !gone.has(c.bitId)));

    // J1: a leg that FAILED (its card was restored) drops out of `landedSet`, so the
    // reverses iterate only what actually LEFT — undo-then-redo never does more than
    // the gesture did. The label still counts the whole gesture: a deliberate
    // overstatement, because one word of noise beats a label that shifts under you.
    const landedSet = new Set(snaps.map((c) => c.bitId));
    const live = () => snaps.filter((c) => landedSet.has(c.bitId));

    // ONE entry for the whole gesture (plan §5), both reverses under the survivor rule.
    const entry = record(
      labelFor(kind, snaps.length),
      snaps.map((c) => c.bitId),
      () => runLegs(live().map((c) => undoLegFor(kind, c))),
      () => runLegs(live().map((c) => redoLegFor(kind, c))),
    );

    // The loose column repaints on the FIRST landed leg (so genuinely-loose bits show
    // even if a later leg fails) and once more when all have settled (so late legs
    // aren't invisible). Un-place only: a trashed/archived bit isn't loose, it's gone.
    let landed = 0;
    let settledCount = 0;
    let failedLegs = 0;
    const legs = snaps.map((c) => {
      const leg = removeLeg(kind, c)
        .then(() => {
          landed++;
          if (kind === "unplace" && landed === 1) setLooseRefresh((n) => n + 1);
        })
        .catch((e) => {
          failedLegs++;
          landedSet.delete(c.bitId);
          if (failedLegs === snaps.length) fail(entry); // nothing happened → no memory
          // A refused flush already showed its banner and re-queued the words; the
          // card simply stays. Anything else goes through the gone-row carve.
          if (isFlushRefused(e)) restore(c);
          else handleRemoveFailure(c, e);
        })
        .finally(() => {
          settledCount++;
          if (kind === "unplace" && settledCount === snaps.length && landed > 1) {
            setLooseRefresh((n) => n + 1);
          }
        });
      trackRemove(leg);
      return leg;
    });
    // Pressing undo 200ms in waits for the gesture's writes to land first (stage-1 D6).
    entry.settled = Promise.allSettled(legs);
  }

  // ---- the doors ----

  /** Take the card off THIS board only; the bit lives on (its travel keeps the leg).
   *  (Evaporate retired — D-138: an empty card removes like any other, and records.) */
  function unplaceSelected(placementId: string) {
    removeGesture("unplace", cards.filter((c) => c.placementId === placementId));
  }

  /** Trash the whole bit — hidden everywhere, restorable from /trash. Trash is the
   *  heavy act (it comes off EVERY board), so the confirm is honest about it (F16). */
  async function trashSelected(placementId: string, bitId: string) {
    let boards = 1;
    try { boards = (await doors.getBitBoards(supabase, bitId)).length; } catch { /* fall back to the plain confirm */ }
    if (!(await doors.confirmTrash({ noun: "card", onBoards: boards }))) return;
    removeGesture("trash", cards.filter((c) => c.bitId === bitId));
  }

  function bulkUnplace() {
    removeGesture("unplace", cards.filter((c) => selectedIds.has(c.placementId)));
  }

  async function bulkTrash() {
    const chosen = cards.filter((c) => selectedIds.has(c.placementId));
    if (chosen.length === 0) { clearSelection(); setEditingId(null); return; }
    const bitIds = [...new Set(chosen.map((c) => c.bitId))];
    let shared = 0;
    try {
      const counts = await Promise.all(bitIds.map((bid) => doors.getBitBoards(supabase, bid)));
      shared = counts.filter((boards) => boards.length > 1).length;
    } catch { /* fall back to the plain confirm */ }
    if (!(await doors.confirmTrash({ count: bitIds.length, noun: "card", shared }))) return;
    removeGesture("trash", chosen);
  }

  /** Archive the whole bit — set aside, restorable from the archive. Same "onBoards"
   *  honesty as trash: archiving something placed elsewhere hides it there too, since
   *  archived bits fail the SAME board_cards `state = 'live'` filter trashed ones do. */
  async function archiveSelected(placementId: string, bitId: string) {
    let boards = 1;
    try { boards = (await doors.getBitBoards(supabase, bitId)).length; } catch { /* fall back to the plain confirm */ }
    if (!(await doors.confirmArchive({ noun: "card", onBoards: boards }))) return;
    removeGesture("archive", cards.filter((c) => c.bitId === bitId));
  }

  /** confirmArchive has no `shared` field (archive-message.ts: onBoards is single-only) —
   *  unlike bulkTrash, no getBitBoards fan-out is needed for the bulk confirm. */
  async function bulkArchive() {
    const chosen = cards.filter((c) => selectedIds.has(c.placementId));
    if (chosen.length === 0) { clearSelection(); setEditingId(null); return; }
    const bitIds = [...new Set(chosen.map((c) => c.bitId))];
    if (!(await doors.confirmArchive({ count: bitIds.length, noun: "card" }))) return;
    removeGesture("archive", chosen);
  }

  return { unplaceSelected, trashSelected, archiveSelected, bulkUnplace, bulkTrash, bulkArchive };
}
