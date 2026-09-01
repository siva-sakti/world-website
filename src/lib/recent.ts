import type { Surface } from "./surfaces";
import type { Opening } from "./db/openings";

// "Where you were" — turning the owner's raw openings into the few surfaces home
// shows. Kept pure and dependency-free so it's unit-testable (the camera-storage /
// placement-anchor precedent); type-only imports so nothing is loaded at runtime.

/** The newest openings, resolved against the surfaces home already holds.
 *
 *  DERIVE, DON'T DUPLICATE: titles and hrefs come from `surfaces` alone, so a
 *  renamed board is never stale here — an opening carries an id, never a name.
 *
 *  AND THE DROP-OUT IS FREE: home's `surfaces` are built from lists that filter
 *  `state = 'live'` (the `home` view; `listNotes`), so anything trashed or
 *  archived simply isn't there to match and falls out with no filtering of its
 *  own. Destroyed targets are already gone by FK cascade.
 *
 *  Keyed `kind:id` rather than bare id — a board id and a bit id are different
 *  spaces, and the house already keys surfaces this way (desk-alive.tsx:21). */
export function recentSurfaces(
  openings: Opening[],
  surfaces: Surface[],
  take = 5,
): Surface[] {
  const by = new Map(surfaces.map((s) => [`${s.kind}:${s.id}`, s]));
  const out: Surface[] = [];
  for (const o of openings) {
    // exactly one target is set — the DB refuses anything else (opening_exactly_one_target)
    const key = o.board_id ? `board:${o.board_id}` : `note:${o.bit_id}`;
    const s = by.get(key);
    if (s) out.push(s);
    if (out.length === take) break;
  }
  return out;
}
