import type { BoardState } from "./types";

// Prototype persistence: localStorage. Swaps to lib/db + Supabase later.
const KEY = "compose:v1";

export function loadBoard(): BoardState {
  if (typeof window === "undefined") return { bits: [] };
  try {
    const raw = localStorage.getItem(KEY);
    if (raw) return JSON.parse(raw) as BoardState;
  } catch {
    // ignore corrupt/absent state
  }
  return { bits: [] };
}

export function saveBoard(state: BoardState) {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(KEY, JSON.stringify(state));
  } catch {
    // ignore quota errors for the prototype
  }
}
