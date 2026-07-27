import { useRef } from "react";
import type { Dispatch, SetStateAction } from "react";
import type { SupabaseClient } from "@supabase/supabase-js";
import { updatePlacement, updateBitBody, updateBitContent } from "@/lib/db/bits";
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

  // Remember each card's create so flush can wait for the row to exist.
  function trackCreate(placementId: string, p: Promise<unknown>) {
    creates.current.set(placementId, p);
    p.finally(() => creates.current.delete(placementId));
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

  async function flush(placementId: string) {
    const p = pending.current.get(placementId);
    pending.current.delete(placementId);
    timers.current.delete(placementId);
    if (!p) return;
    const create = creates.current.get(placementId);
    if (create) await create; // the row must exist before we update it
    // Resolve the id AFTER the await: a reconcile may have landed while we waited.
    const realId = renamed.current.get(placementId) ?? placementId;
    try {
      if (Object.keys(p.placement).length)
        await updatePlacement(supabase, realId, p.placement);
      if (p.body !== undefined) await updateBitBody(supabase, p.bitId, p.body);
    } catch (e) {
      onErr(e);
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
    updateBitContent(supabase, bitId, value).catch(onErr);
  }

  return { patchCard, saveContent, trackCreate, reconcileId };
}
