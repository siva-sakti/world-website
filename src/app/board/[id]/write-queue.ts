import type { Dispatch, SetStateAction } from "react";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { CardVM } from "./card-vm";

// NOTE (rotation, 2026-09-03): this list and schedule()'s copy below are a HARD-CODED
// pair — a CardVM key absent from both is silently dropped on its way to the database
// (the act works for the session, then vanishes on reload, with no error anywhere).
// Any future placement field must be added in BOTH places, and in bits.ts's `Pos`.
export type PlacementPatch = { x?: number; y?: number; width?: number; height?: number; z?: number; angle?: number };

/** THE OUTSIDE WORLD, passed in rather than imported.
 *
 *  Same reasoning as remove-acts.ts's RemoveDoors: this module has no React hooks in
 *  it — it is a plain function of its arguments — so these five calls were the ONLY
 *  thing standing between the board's save queue and an automated test. Importing
 *  them by name also meant a test runner could not load the file at all (the `@/`
 *  paths don't resolve outside the Next build). use-persistence.ts passes the real
 *  ones; write-queue.test.mjs passes fakes and drives the retries, the ordering and
 *  the create gate.
 *
 *  Deliberately structural, not `typeof updatePlacement` etc.: a test's fake should
 *  have to satisfy the SHAPE the queue actually uses, not import the db module to
 *  get it. */
export type WriteDoors = {
  updatePlacement: (s: SupabaseClient, placementId: string, patch: PlacementPatch) => Promise<void>;
  updateBitBody: (s: SupabaseClient, bitId: string, body: string) => Promise<void>;
  updateBitContent: (s: SupabaseClient, bitId: string, content: string) => Promise<void>;
  reconcileReferences: (s: SupabaseClient, bitId: string, ids: string[]) => Promise<void>;
  extractRefIds: (html: string) => string[];
};

/** One card's coalesced, not-yet-written change. */
export type PendingWrite = { bitId: string; placement: PlacementPatch; body?: string; content?: string };

/** THE FIVE MAPS. Created once per board and held in a ref by usePersistence, so they
 *  survive every render while the closures around them are rebuilt. */
export type QueueState = {
  pending: Map<string, PendingWrite>;
  timers: Map<string, ReturnType<typeof setTimeout>>;
  creates: Map<string, Promise<unknown>>;
  // Call-in may reconcile a card's optimistic placement id to the server's real one
  // (a revive reuses the departed row's own id). Remember the rename so a flush that
  // already captured the old key still writes to the real row — never a lost move.
  renamed: Map<string, string>;
  // Per-ROW write ordering (review R1.4): the tail of the last write chained for each
  // REAL row id. Without it, a stalled earlier flush can land after a later one and
  // silently revert the DB (reload teleports a card / reverts typed text).
  chains: Map<string, Promise<void>>;
};

export function newQueueState(): QueueState {
  return {
    pending: new Map(),
    timers: new Map(),
    creates: new Map(),
    renamed: new Map(),
    chains: new Map(),
  };
}

// Debounced persistence for the board: coalesce a card's rapid moves/keystrokes
// into one write per ~350ms, per card — and make a move wait for the card's
// create to land first (a placement update to a not-yet-created row silently
// updates 0 rows, so the move would be lost). Optimistic state + DB, one door.
export function makeWriteQueue(
  state: QueueState,
  supabase: SupabaseClient,
  setCards: Dispatch<SetStateAction<CardVM[]>>,
  onErr: (e: unknown) => void,
  doors: WriteDoors,
  debounceMs = 350,
) {
  // Remember each card's create so writes can wait for the row to exist. Stored
  // settled-safe (.catch): a REJECTED create must not detonate inside flush or a
  // destructive act — the creator's own .catch already surfaced the error.
  function trackCreate(placementId: string, p: Promise<unknown>) {
    const safe = p.catch(() => {});
    state.creates.set(placementId, safe);
    // Delete only OUR entry (P5). A placement id can get a SECOND create — un-place a
    // card, then undo, and remove-acts revives it under the same id — and the old
    // unconditional delete let the first create's cleanup evict the second. `settled()`
    // then returned immediately, and the write hit a row that did not exist yet: 0 rows,
    // act silently lost. `chains` carries this same guard in two places; this map was
    // missed when that hazard was fixed there.
    safe.finally(() => {
      if (state.creates.get(placementId) === safe) state.creates.delete(placementId);
    });
  }

  /** Wait for this card's create (if in flight) and resolve the REAL placement id
   * (a call-in revive renames the optimistic one). EVERY write against a card —
   * flush, un-place, trash, content — goes through here: a write that skips it can
   * hit a not-yet-created row, match 0 rows, and silently lose the act. */
  async function settled(placementId: string): Promise<string> {
    const create = state.creates.get(placementId);
    if (create) await create;
    return state.renamed.get(placementId) ?? placementId;
  }

  function schedule(placementId: string, bitId: string, patch: Partial<CardVM>) {
    const cur = state.pending.get(placementId) ?? { bitId, placement: {} };
    if (patch.x !== undefined) cur.placement.x = patch.x;
    if (patch.y !== undefined) cur.placement.y = patch.y;
    if (patch.w !== undefined) cur.placement.width = patch.w;
    if (patch.h !== undefined) cur.placement.height = patch.h;
    if (patch.z !== undefined) cur.placement.z = patch.z;
    if (patch.angle !== undefined) cur.placement.angle = patch.angle;
    if (patch.body !== undefined) cur.body = patch.body;
    if (patch.content !== undefined) cur.content = patch.content;
    state.pending.set(placementId, cur);
    const existing = state.timers.get(placementId);
    if (existing) clearTimeout(existing);
    state.timers.set(placementId, setTimeout(() => flush(placementId), debounceMs));
  }

  /** Returns TRUE when the owner's words/positions are safely in the DB — the
   *  boundary hunt's #3: every "flush before you leave/remove" gate used to resolve
   *  indistinguishably on failure, so removes forgot restored patches and opens
   *  navigated onto stale pages. Gates now refuse their destructive step on false.
   *  (A failed reference-reconcile does NOT count as failure — hunt #7: the body IS
   *  saved; the index self-heals on the next save, and the old behavior restored the
   *  whole patch and showed a banner about words that had landed.) */
  async function flush(placementId: string): Promise<boolean> {
    const p = state.pending.get(placementId);
    // Cancel the debounce timer, don't merely forget it (P6). Forgetting left a stray
    // timer that re-fired a failed write later — contradicting the stated policy that a
    // failure is retried only by your next edit or by flushAll.
    const armed = state.timers.get(placementId);
    if (armed) clearTimeout(armed);
    state.timers.delete(placementId);
    if (!p) return true;
    // SNAPSHOT — the entry STAYS QUEUED until the database confirms it (P1 · P2).
    // The old shape removed it here, before any await, and tried to put it back on
    // failure; in the gap a newer edit could be captured and land, and the put-back
    // then re-queued the older values over it. Nothing is put back now because
    // nothing is taken out — see clearWritten for the other half.
    const snap: PendingWrite = {
      bitId: p.bitId,
      placement: { ...p.placement },
      body: p.body,
      content: p.content,
    };
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
    const prev = state.chains.get(realId) ?? Promise.resolve();
    const tail = prev
      .then(async () => {
        if (Object.keys(snap.placement).length)
          await doors.updatePlacement(supabase, realId, snap.placement);
        // The TITLE / CAPTION joins the queue (2026-09-03). It used to be written
        // directly, outside `pending`, which cost it two things every other write has:
        // a failed title was reported and then DROPPED, with no retry, while the banner
        // said "your work is still here" — and flushNow's "the words landed" promise,
        // which every remove act gates on, did not cover it at all.
        if (snap.content !== undefined)
          await doors.updateBitContent(supabase, snap.bitId, snap.content);
        if (snap.body !== undefined) {
          await doors.updateBitBody(supabase, snap.bitId, snap.body);
          bodyLanded = true; // the WORDS are safe from here (hunt #7 carve)
          // Reconcile the note's `[[` chips into `reference` rows (self-heals on a
          // later save/read if this leg fails — plan risk 1).
          await doors.reconcileReferences(supabase, snap.bitId, doors.extractRefIds(snap.body));
        }
        clearWritten(placementId, realId, snap);
      })
      .catch((e) => {
        if (bodyLanded) {
          // Only the reconcile leg failed: everything the owner typed DID land, so it
          // comes off the queue exactly as a success would. No banner (it would lie).
          // The index self-heals on the next save.
          clearWritten(placementId, realId, snap);
          console.error("reference reconcile failed (self-heals on next save):", e);
          return;
        }
        ok = false;
        // Nothing to put back: the patch never left `pending`. The next edit to this
        // card, or flushAll when you leave the board, writes it. Deliberately does NOT
        // re-arm a timer — an offline board would become a request storm re-firing the
        // error banner every debounce.
        onErr(e);
      });
    state.chains.set(realId, tail);
    void tail.finally(() => {
      if (state.chains.get(realId) === tail) state.chains.delete(realId);
    });
    await tail;
    return ok;
  }

  /** Take off the queue exactly what this write put in the database — and ONLY where the
   *  queued value is still the one that was written. If you edited the card again while
   *  the write was in the air, the queued value now differs, so it STAYS and the next
   *  flush writes it. That comparison is the whole of P2's fix: a slow write can no longer
   *  revert a newer one that already landed, because it can only ever clear its own value.
   *
   *  Clears under BOTH ids: a call-in revive can rename the card mid-write, and a value
   *  left under the dead key would be re-written on every later flush, forever.
   *
   *  The queue's rule, in one line: **it holds what is not yet safely saved.** */
  function clearWritten(key: string, realId: string, snap: PendingWrite) {
    for (const k of new Set([key, realId])) {
      const cur = state.pending.get(k);
      if (!cur) continue;
      for (const f of Object.keys(snap.placement) as (keyof PlacementPatch)[]) {
        if (cur.placement[f] === snap.placement[f]) delete cur.placement[f];
      }
      if (snap.body !== undefined && cur.body === snap.body) delete cur.body;
      if (snap.content !== undefined && cur.content === snap.content) delete cur.content;
      const empty =
        !Object.keys(cur.placement).length && cur.body === undefined && cur.content === undefined;
      if (empty) state.pending.delete(k);
    }
  }

  /** Drop everything queued for a card — called by the remove acts once the removal
   *  LANDS. Without it a restored patch could outlive the card: un-place it, call it
   *  back in later (callInBit's revive rewrites position), and a stale flush would
   *  teleport it to where it used to be. */
  function forget(placementId: string) {
    const key = state.renamed.get(placementId) ?? placementId;
    for (const k of new Set([placementId, key])) {
      const t = state.timers.get(k);
      if (t) clearTimeout(t);
      state.timers.delete(k);
      state.pending.delete(k);
    }
  }

  // Re-point a card's in-flight persistence from its optimistic id to the real one.
  function reconcileId(oldId: string, newId: string) {
    if (oldId === newId) return;
    state.renamed.set(oldId, newId);
    const p = state.pending.get(oldId);
    if (p) {
      state.pending.delete(oldId);
      state.pending.set(newId, p);
    }
    const t = state.timers.get(oldId);
    if (t) {
      clearTimeout(t);
      state.timers.delete(oldId);
      state.timers.set(newId, setTimeout(() => flush(newId), debounceMs));
    }
  }

  function patchCard(placementId: string, bitId: string, patch: Partial<CardVM>) {
    setCards((cs) => cs.map((c) => (c.placementId === placementId ? { ...c, ...patch } : c)));
    schedule(placementId, bitId, patch);
  }

  /** A card's title or caption. Goes through the SAME queue as positions and the body:
   *  one debounce, one write chain, one retry policy. It used to write directly, which
   *  quietly made these words less durable than every other word on the board — a failed
   *  write was surfaced and then dropped, where a failed body write is put back and
   *  retried by flushAll. Queuing it also brings it under flushNow, so "the words landed"
   *  now actually means all of them before a card is removed or a page is opened. */
  function saveContent(placementId: string, bitId: string, value: string) {
    const content = value.trim();
    setCards((cs) =>
      cs.map((c) => (c.placementId === placementId ? { ...c, content: content || undefined } : c)),
    );
    schedule(placementId, bitId, { content });
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
    for (const id of new Set([...state.timers.keys(), ...state.pending.keys()])) {
      const t = state.timers.get(id);
      if (t) clearTimeout(t);
      fired.push(flush(id));
    }
    const inFlight = [...state.chains.values()];
    return Promise.allSettled([...fired, ...inFlight]).then(() => {});
  }

  /** Every in-flight CREATE (uploads + inserts). Duplicate-board awaits this so a
   *  just-dropped card's row exists before the copy reads the board. Entries are
   *  settled-safe and self-cleaning (trackCreate), so this can never hang. */
  function pendingCreates(): Promise<void> {
    return Promise.allSettled([...state.creates.values()]).then(() => {});
  }

  /** Run a DISCRETE row write behind the same per-row chain the debounced flushes
   *  use (undo plan §3 / senior review §2c): a revive, a lock re-apply, or a
   *  forced move on a row must never reorder against an in-flight flush for that
   *  SAME row — two writes ~100ms apart would otherwise co-fire on the wire.
   *  `realId` must be the POST-reconcile id (resolve via settled() first). The
   *  caller sees the write's own success/failure and classifies it; the STORED
   *  tail is settled-safe so a failure never blocks the row's next write. */
  function chain(realId: string, fn: () => Promise<void>): Promise<void> {
    const prev = state.chains.get(realId) ?? Promise.resolve();
    const run = prev.then(fn);
    const stored = run.catch(() => {});
    state.chains.set(realId, stored);
    void stored.finally(() => {
      if (state.chains.get(realId) === stored) state.chains.delete(realId);
    });
    return run;
  }

  return { patchCard, saveContent, trackCreate, reconcileId, settled, forget, flushNow: flush, flushAll, pendingCreates, chain };
}
