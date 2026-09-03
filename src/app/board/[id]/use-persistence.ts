import { useRef } from "react";
import type { Dispatch, SetStateAction } from "react";
import type { SupabaseClient } from "@supabase/supabase-js";
import { updatePlacement, updateBitBody, updateBitContent } from "@/lib/db/bits";
import { reconcileReferences, extractRefIds } from "@/lib/db/references";
import type { CardVM } from "./card-vm";
import { makeWriteQueue, newQueueState, type WriteDoors } from "./write-queue";

/** The real doors. They live HERE, not in write-queue.ts, for the same reason
 *  remove-acts.ts has no defaults of its own: a module that statically imports `@/`
 *  paths cannot be loaded by the test runner at all. This file is the React shell —
 *  never loaded by a test — so it is where the app's real calls belong. */
const defaultWriteDoors: WriteDoors = {
  updatePlacement,
  updateBitBody,
  updateBitContent,
  reconcileReferences,
  extractRefIds,
};

/** The board's debounced save queue (see write-queue.ts for what it does and why).
 *  The five maps live in the ref, so they survive every render; the closures around
 *  them are REBUILT each render, so they always capture the latest supabase/setCards/
 *  onErr — `onErr` in particular is an inline closure at the call site, and memoizing
 *  the returned object would silently freeze a stale one. */
export function usePersistence(
  supabase: SupabaseClient,
  setCards: Dispatch<SetStateAction<CardVM[]>>,
  onErr: (e: unknown) => void,
) {
  const state = useRef(newQueueState());
  return makeWriteQueue(state.current, supabase, setCards, onErr, defaultWriteDoors);
}
