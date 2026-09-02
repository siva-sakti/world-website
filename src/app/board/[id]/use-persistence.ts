import { useRef } from "react";
import type { Dispatch, SetStateAction } from "react";
import type { SupabaseClient } from "@supabase/supabase-js";
import { updatePlacement, updateBitBody, updateBitContent } from "@/lib/db/bits";
import { reconcileReferences, extractRefIds } from "@/lib/db/references";
import type { CardVM } from "./card";

type PlacementPatch = { x?: number; y?: number; width?: number; height?: number; z?: number };

// Debounced persistence for the board: coalesce a card's rapid moves/keystrokes
// into one write per ~350ms, per card — and make a move wait for the card's
// create to land first (a placement update to a not-yet-created row silently
// updates 0 rows, so the move would be lost). Optimistic state + DB, one door.
export function usePersistence(
  supabase: SupabaseClient,
  setCards: Dispatch<SetStateAction<CardVM[]>>,
  onErr: (e: unknown) => void,
) {
  const pending = useRef(
    new Map<string, { bitId: string; placement: PlacementPatch; body?: string }>(),
  );
  const timers = useRef(new Map<string, ReturnType<typeof setTimeout>>());
  const creates = useRef(new Map<string, Promise<unknown>>());
  // Call-in may reconcile a card's optimistic placement id to the server's real one
  // (a revive reuses the departed row's own id). Remember the rename so a flush that
  // already captured the old key still writes to the real row — never a lost move.
  const renamed = useRef(new Map<string, string>());
  // Per-ROW write ordering (review R1.4): the tail of the last write chained for each
  // REAL row id. Without it, a stalled earlier flush can land after a later one and
  // silently revert the DB (reload teleports a card / reverts typed text).
  const chains = useRef(new Map<string, Promise<void>>());

  // Remember each card's create so writes can wait for the row to exist. Stored
  // settled-safe (.catch): a REJECTED create must not detonate inside flush or a
  // destructive act — the creator's own .catch already surfaced the error.
  function trackCreate(placementId: string, p: Promise<unknown>) {
    const safe = p.catch(() => {});
    creates.current.set(placementId, safe);
    safe.finally(() => creates.current.delete(placementId));
  }

  /** Wait for this card's create (if in flight) and resolve the REAL placement id
   * (a call-in revive renames the optimistic one). EVERY write against a card —
   * flush, un-place, trash, content — goes through here: a write that skips it can
   * hit a not-yet-created row, match 0 rows, and silently lose the act. */
  async function settled(placementId: string): Promise<string> {
    const create = creates.current.get(placementId);
    if (create) await create;
    return renamed.current.get(placementId) ?? placementId;
  }

  function schedule(placementId: string, bitId: string, patch: Partial<CardVM>) {
    const cur = pending.current.get(placementId) ?? { bitId, placement: {} };
    if (patch.x !== undefined) cur.placement.x = patch.x;
    if (patch.y !== undefined) cur.placement.y = patch.y;
    if (patch.w !== undefined) cur.placement.width = patch.w;
    if (patch.h !== undefined) cur.placement.height = patch.h;
    if (patch.z !== undefined) cur.placement.z = patch.z;
    if (patch.body !== undefined) cur.body = patch.body;
    pending.current.set(placementId, cur);
    const existing = timers.current.get(placementId);
    if (existing) clearTimeout(existing);
    timers.current.set(placementId, setTimeout(() => flush(placementId), 350));
  }

  /** Returns TRUE when the owner's words/positions are safely in the DB — the
   *  boundary hunt's #3: every "flush before you leave/remove" gate used to resolve
   *  indistinguishably on failure, so removes forgot restored patches and opens
   *  navigated onto stale pages. Gates now refuse their destructive step on false.
   *  (A failed reference-reconcile does NOT count as failure — hunt #7: the body IS
   *  saved; the index self-heals on the next save, and the old behavior restored the
   *  whole patch and showed a banner about words that had landed.) */
  async function flush(placementId: string): Promise<boolean> {
    const p = pending.current.get(placementId);
    pending.current.delete(placementId); // capture-at-fire (kept BEFORE any await — deliberate)
    timers.current.delete(placementId);
    if (!p) return true;
    // The row must exist before we update it; resolve the id AFTER the wait —
    // a reconcile may have landed meanwhile. (settled never rejects.)
    const realId = await settled(placementId);
    // Chain behind the previous write for the SAME real row — keyed POST-reconcile
    // (the optimistic id can rename; the real row's never does), so two flushes can
    // never reorder on the wire. Two flushes awaiting the same `prev` resume in
    // registration order (microtask FIFO) = capture order. The stored tail is
    // settled-safe (errors surface once via onErr, and never block the next write).
    let ok = true;
    let bodyLanded = false;
    const prev = chains.current.get(realId) ?? Promise.resolve();
    const tail = prev
      .then(async () => {
        if (Object.keys(p.placement).length)
          await updatePlacement(supabase, realId, p.placement);
        if (p.body !== undefined) {
          await updateBitBody(supabase, p.bitId, p.body);
          bodyLanded = true; // the WORDS are safe from here (hunt #7 carve)
          // Reconcile the note's `[[` chips into `reference` rows (self-heals on a
          // later save/read if this leg fails — plan risk 1).
          await reconcileReferences(supabase, p.bitId, extractRefIds(p.body));
        }
      })
      .catch((e) => {
        if (bodyLanded) {
          // Only the reconcile leg failed: the body saved. No restore (it would
          // re-write identical words), no banner (it would lie). Self-heals.
          console.error("reference reconcile failed (self-heals on next save):", e);
          return;
        }
        ok = false;
        // The patch was captured-at-fire and deleted, so a failure used to strand
        // the change in React state forever while the banner said "your work is
        // still here" (review F3). Put it BACK so the next edit — or the flushAll
        // when you leave the board / the tab hides — writes it. Keyed by realId:
        // the optimistic id may have been reconciled away.
        restorePending(realId, p);
        onErr(e);
      });
    chains.current.set(realId, tail);
    void tail.finally(() => {
      if (chains.current.get(realId) === tail) chains.current.delete(realId);
    });
    await tail;
    return ok;
  }

  /** Put a FAILED patch back into `pending` so a later flush retries it. Field-level
   *  merge with the CURRENT entry winning: anything already pending was scheduled
   *  after this patch was captured, so it is genuinely newer. (Safe because no call
   *  site ever patches x without y — a mixed old-x/new-y position can't arise.)
   *  Deliberately does NOT re-arm a timer: an offline board would become a request
   *  storm re-firing the error banner every 350ms. The natural retry points are the
   *  next edit to this card and flushAll. */
  function restorePending(key: string, p: { bitId: string; placement: PlacementPatch; body?: string }) {
    const cur = pending.current.get(key);
    if (!cur) {
      pending.current.set(key, p);
      return;
    }
    cur.placement = { ...p.placement, ...cur.placement };
    if (cur.body === undefined && p.body !== undefined) cur.body = p.body;
  }

  /** Drop everything queued for a card — called by the remove acts once the removal
   *  LANDS. Without it a restored patch could outlive the card: un-place it, call it
   *  back in later (callInBit's revive rewrites position), and a stale flush would
   *  teleport it to where it used to be. */
  function forget(placementId: string) {
    const key = renamed.current.get(placementId) ?? placementId;
    for (const k of new Set([placementId, key])) {
      const t = timers.current.get(k);
      if (t) clearTimeout(t);
      timers.current.delete(k);
      pending.current.delete(k);
    }
  }

  // Re-point a card's in-flight persistence from its optimistic id to the real one.
  function reconcileId(oldId: string, newId: string) {
    if (oldId === newId) return;
    renamed.current.set(oldId, newId);
    const p = pending.current.get(oldId);
    if (p) {
      pending.current.delete(oldId);
      pending.current.set(newId, p);
    }
    const t = timers.current.get(oldId);
    if (t) {
      clearTimeout(t);
      timers.current.delete(oldId);
      timers.current.set(newId, setTimeout(() => flush(newId), 350));
    }
  }

  function patchCard(placementId: string, bitId: string, patch: Partial<CardVM>) {
    setCards((cs) => cs.map((c) => (c.placementId === placementId ? { ...c, ...patch } : c)));
    schedule(placementId, bitId, patch);
  }

  function saveContent(placementId: string, bitId: string, value: string) {
    setCards((cs) =>
      cs.map((c) => (c.placementId === placementId ? { ...c, content: value.trim() || undefined } : c)),
    );
    // Through the door: a title typed on a fresh optimistic card must wait for the
    // bit row to exist, or the update matches 0 rows and the title vanishes.
    settled(placementId)
      .then((id) => chain(id, () => updateBitContent(supabase, bitId, value))) // ordered (health check S4):
      // four doors now hit saveContent (blur · unmount-commit · page-hide · the offer) —
      // unchained, two writes could reorder on the wire and an older caption win.
      .catch(onErr);
  }

  /** Write EVERY waiting change now — leaving the board, or the page going away.
   *  Returns a promise that resolves when the writes have LANDED (duplicate-board
   *  awaits this so the copy includes the last drag/keystroke); the save-guard's
   *  pagehide callers ignore the return, unchanged. Covers both the still-timered
   *  flushes AND a snapshot of in-flight chains — a flush already past its
   *  pending-delete is invisible to the timers map (the antagonist's catch: without
   *  the snapshot, the await misses exactly the write it exists to include). */
  function flushAll(): Promise<void> {
    const fired: Promise<boolean>[] = [];
    // timers ∪ pending: a RESTORED patch (review F3) has no timer by design, so a
    // timers-only sweep would never retry the very writes this exists to rescue.
    for (const id of new Set([...timers.current.keys(), ...pending.current.keys()])) {
      const t = timers.current.get(id);
      if (t) clearTimeout(t);
      fired.push(flush(id));
    }
    const inFlight = [...chains.current.values()];
    return Promise.allSettled([...fired, ...inFlight]).then(() => {});
  }

  /** Every in-flight CREATE (uploads + inserts). Duplicate-board awaits this so a
   *  just-dropped card's row exists before the copy reads the board. Entries are
   *  settled-safe and self-cleaning (trackCreate), so this can never hang. */
  function pendingCreates(): Promise<void> {
    return Promise.allSettled([...creates.current.values()]).then(() => {});
  }

  /** Run a DISCRETE row write behind the same per-row chain the debounced flushes
   *  use (undo plan §3 / senior review §2c): a revive, a lock re-apply, or a
   *  forced move on a row must never reorder against an in-flight flush for that
   *  SAME row — two writes ~100ms apart would otherwise co-fire on the wire.
   *  `realId` must be the POST-reconcile id (resolve via settled() first). The
   *  caller sees the write's own success/failure and classifies it; the STORED
   *  tail is settled-safe so a failure never blocks the row's next write. */
  function chain(realId: string, fn: () => Promise<void>): Promise<void> {
    const prev = chains.current.get(realId) ?? Promise.resolve();
    const run = prev.then(fn);
    const stored = run.catch(() => {});
    chains.current.set(realId, stored);
    void stored.finally(() => {
      if (chains.current.get(realId) === stored) chains.current.delete(realId);
    });
    return run;
  }

  return { patchCard, saveContent, trackCreate, reconcileId, settled, forget, flushNow: flush, flushAll, pendingCreates, chain };
}
