"use client";

import { useEffect, useRef } from "react";
import type { SupabaseClient } from "@supabase/supabase-js";
import { movePlacementForced } from "@/lib/db/bits";
import type { CardVM } from "./card";
import type { Patch } from "./board-arrange";
import type { useUndo } from "./use-undo";

// The ARRANGING acts' recording layer (undo plan §4) — dark until stage 5: every
// deliberate position gesture pushes an entry; reflexes (click-to-front, auto-grow)
// and the system's repairs never come near this file.
//
// THE REVERSE RULES (the reviews' amendments, all load-bearing):
//  · Entries are keyed by BIT id; the placementId + lock state are resolved from
//    cardsRef at REVERSE time (a call-in reconcile renames placement ids — a
//    captured id goes stale; review amendment 3 / antagonist D2).
//  · A card locked AT REVERSE TIME takes the forced door (owner-ruled: undo moves
//    locked cards, the lock stays on) — through chain(), so the write can never
//    reorder against an in-flight debounced flush. NEVER decided from a snapshot:
//    no position act can even capture a locked card (antagonist F1/D1).
//  · Unlocked reverses go through patchCard — the debounced door coalesces rapid
//    undo/redo per card, and last-value-wins is correct for position.

type Pos = { x: number; y: number };
type Move = { bitId: string; before: Pos; after: Pos };

export function useArrangeActs(deps: {
  supabase: SupabaseClient;
  cardsRef: React.RefObject<CardVM[]>;
  record: ReturnType<typeof useUndo>["record"];
  onBeforeRecord: ReturnType<typeof useUndo>["onBeforeRecord"];
  patchCard: (placementId: string, bitId: string, patch: Partial<CardVM>) => void;
  setCards: React.Dispatch<React.SetStateAction<CardVM[]>>;
  settled: (placementId: string) => Promise<string>;
  chain: (realId: string, fn: () => Promise<void>) => Promise<void>;
}) {
  const { supabase, cardsRef, record, onBeforeRecord, patchCard, setCards, settled, chain } = deps;

  /** Write a position onto a card AS IT IS NOW. Missing → terminal (the classify
   *  list matches "no longer exists" — the entry dies honestly, never silently). */
  async function applyPos(bitId: string, pos: Pos): Promise<void> {
    const cur = cardsRef.current?.find((c) => c.bitId === bitId);
    if (!cur) throw new Error("that card no longer exists on this board");
    if (cur.locked) {
      // Screen first (patchCard would schedule into the lock-filtered door and
      // silently no-op at the DB — the named divergence), then the forced door
      // behind the row's write chain. ROLLED BACK on failure (antagonist D2): the
      // forced door is one-shot with no retry queue — a screen left showing the
      // reversed position with nothing behind it would snap back on reload.
      const prev = { x: cur.x, y: cur.y };
      setCards((cs) => cs.map((c) => (c.bitId === bitId ? { ...c, x: pos.x, y: pos.y } : c)));
      try {
        const realId = await settled(cur.placementId);
        await chain(realId, () => movePlacementForced(supabase, realId, pos));
      } catch (e) {
        setCards((cs) => cs.map((c) => (c.bitId === bitId ? { ...c, x: prev.x, y: prev.y } : c)));
        throw e;
      }
      return;
    }
    patchCard(cur.placementId, cur.bitId, { x: pos.x, y: pos.y });
  }

  /** Apply a set of positions, skipping cards that no longer exist (antagonist D4:
   *  aborting mid-way left the board HALF-undone and killed the entry — a gone card
   *  has nothing to reverse and must not block its neighbours). The entry fails
   *  (terminal) only when NOTHING could be applied. */
  async function applyAll(entries: { bitId: string; pos: Pos }[]): Promise<void> {
    let applied = 0;
    let firstErr: unknown = null;
    for (const e of entries) {
      try {
        await applyPos(e.bitId, e.pos);
        applied++;
      } catch (err) {
        if (firstErr === null) firstErr = err;
      }
    }
    if (applied === 0 && firstErr !== null) throw firstErr;
  }

  async function applyMoves(moves: Move[], dir: "before" | "after"): Promise<void> {
    await applyAll(moves.map((m) => ({ bitId: m.bitId, pos: m[dir] })));
  }

  function label(n: number, verb: string): string {
    return n === 1 ? `${verb} card` : `${verb} ${n} cards`;
  }

  /** One finished single-card drag. */
  function recordMove(m: Move) {
    if (m.before.x === m.after.x && m.before.y === m.after.y) return; // a click, not a move
    record(label(1, "move"), [m.bitId], () => applyPos(m.bitId, m.before), () => applyPos(m.bitId, m.after));
  }

  /** One finished group drag — ONE entry for the whole gesture (dragged card included). */
  function recordGroupMove(moves: Move[]) {
    const real = moves.filter((m) => m.before.x !== m.after.x || m.before.y !== m.after.y);
    if (!real.length) return;
    record(
      label(real.length, "move"),
      real.map((m) => m.bitId),
      () => applyMoves(real, "before"),
      () => applyMoves(real, "after"),
    );
  }

  /** One finished resize. x/y ride along (rnd reports position at stop); w/h are
   *  legal on locked cards (the lock filter is x/y-scoped), so the reverse splits:
   *  size via patchCard always, position via applyPos (which handles the lock). */
  function recordResize(bitId: string, before: Pos & { w: number; h?: number }, after: Pos & { w: number; h?: number }) {
    // A handle-click without a drag is not an act (mirrors recordMove's no-op filter).
    if (before.x === after.x && before.y === after.y && before.w === after.w && before.h === after.h) return;
    // A flex card (after.h undefined — height is auto) must ignore its STALE stored
    // before.h too, or undo writes an h the card never truly had (antagonist blemish).
    const flex = after.h === undefined;
    const apply = async (v: Pos & { w: number; h?: number }) => {
      const cur = cardsRef.current?.find((c) => c.bitId === bitId);
      if (!cur) throw new Error("that card no longer exists on this board");
      patchCard(cur.placementId, cur.bitId, flex || v.h === undefined ? { w: v.w } : { w: v.w, h: v.h });
      await applyPos(bitId, { x: v.x, y: v.y });
    };
    record("resize card", [bitId], () => apply(before), () => apply(after));
  }

  // ---- nudge coalescing (antagonist D12, fully specified) ----
  // One entry per BURST: keyed on the selection's bitId set; a nudge within 800ms
  // extends the entry's afters; ANY selection change closes the window; undo/redo
  // must close it first (stage 5 wires closeNudgeWindow before popping).
  const nudgeWindow = useRef<{
    key: string;
    afters: Map<string, Pos>;
    timer: ReturnType<typeof setTimeout>;
  } | null>(null);

  function closeNudgeWindow() {
    if (nudgeWindow.current) clearTimeout(nudgeWindow.current.timer);
    nudgeWindow.current = null;
  }

  /** Called AFTER the board applied one nudge step. `moves` carries each card's
   *  position before THIS step and after it. */
  function noteNudge(moves: Move[]) {
    if (!moves.length) return;
    const key = moves.map((m) => m.bitId).sort().join("|");
    const w = nudgeWindow.current;
    if (w && w.key === key) {
      for (const m of moves) w.afters.set(m.bitId, m.after); // extend the open entry
      clearTimeout(w.timer);
      w.timer = setTimeout(closeNudgeWindow, 800);
      return;
    }
    const afters = new Map(moves.map((m) => [m.bitId, m.after]));
    const befores = new Map(moves.map((m) => [m.bitId, m.before]));
    // record() FIRST — it closes any open window (ours included, via onBeforeRecord);
    // the new window opens AFTER, so it can't be closed by its own act (D1).
    record(
      label(moves.length, "nudge"),
      moves.map((m) => m.bitId),
      () => applyAll([...befores].map(([bitId, pos]) => ({ bitId, pos }))),
      () => applyAll([...afters].map(([bitId, pos]) => ({ bitId, pos }))), // reads the EXTENDED afters
    );
    nudgeWindow.current = { key, afters, timer: setTimeout(closeNudgeWindow, 800) };
  }

  // Every push — from ANY act layer, this one or stages 3-4's — closes an open
  // burst first (the D1 class fix lives in useUndo; this registers our window).
  useEffect(() => onBeforeRecord(closeNudgeWindow), [onBeforeRecord]);
  useEffect(() => closeNudgeWindow, []); // and the timer dies with the board

  /** Tidy-up: the entry replays the STORED patches — never re-runs tidy (it
   *  measures live DOM and would compute a different grid; antagonist catch). */
  function recordTidy(patches: Patch[], befores: Map<string, Pos>) {
    if (!patches.length) return;
    record(
      `tidy up ${patches.length} cards`,
      patches.map((p) => p.bitId),
      () => applyAll(patches.flatMap((p) => { const b = befores.get(p.bitId); return b ? [{ bitId: p.bitId, pos: b }] : []; })),
      () => applyAll(patches.map((p) => ({ bitId: p.bitId, pos: { x: p.x, y: p.y } }))),
    );
  }

  /** Send-to-back (deliberate z). Click-to-front stays raw — a reflex. */
  function recordSendToBack(bitId: string, fromZ: number, toZ: number) {
    const applyZ = async (z: number) => {
      const cur = cardsRef.current?.find((c) => c.bitId === bitId);
      if (!cur) throw new Error("that card no longer exists on this board");
      patchCard(cur.placementId, cur.bitId, { z }); // z is legal on locked cards
    };
    record("send to back", [bitId], () => applyZ(fromZ), () => applyZ(toZ));
  }

  /** Lock/unlock — the toggle reversed is the opposite toggle. Returns the entry so
   *  the caller can fail() it when the act's own write fails (antagonist D3: a
   *  rolled-back lock must never sit live in the stack). The closures AWAIT the
   *  toggle so a failed reverse reaches classify instead of fake-succeeding. */
  function recordLock(bitId: string, on: boolean, doToggle: (bitId: string, on: boolean) => Promise<void>) {
    return record(on ? "lock card" : "unlock card", [bitId],
      () => doToggle(bitId, !on),
      () => doToggle(bitId, on));
  }

  return { recordMove, recordGroupMove, recordResize, noteNudge, closeNudgeWindow, recordTidy, recordSendToBack, recordLock };
}
