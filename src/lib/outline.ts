import type { HomeBoard } from "@/lib/types";
import type { PanelBit } from "@/lib/db/inbox";

// OUTLINE = the world inverted for scanning: each board with the bits & notes
// currently placed on it, plus a loose/unplaced bucket. A pure inversion of
// listBoards + listAllBits — mirrors surfaces.ts (built once, rendered dumb).
//
// The loose rule is F19's single definition, identical to listInbox: an item is
// loose ⇔ it sits on no live, non-trashed board (boards.length === 0). An item on
// several boards appears under each — correct for "what's where".

export type OutlineBoard = { id: string; title: string | null; items: PanelBit[] };
export type Outline = { boards: OutlineBoard[]; loose: PanelBit[] };

export function toOutline(boards: HomeBoard[], items: PanelBit[]): Outline {
  const byBoard = new Map<string, PanelBit[]>();
  const loose: PanelBit[] = [];
  for (const it of items) {
    if (it.boards.length === 0) {
      loose.push(it);
      continue;
    }
    for (const b of it.boards) {
      const arr = byBoard.get(b.id) ?? [];
      arr.push(it);
      byBoard.set(b.id, arr);
    }
  }
  // Join against listBoards so empty boards appear (with []), in home order.
  const outBoards: OutlineBoard[] = boards.map((b) => ({
    id: b.id,
    title: b.title,
    items: byBoard.get(b.id) ?? [],
  }));
  return { boards: outBoards, loose };
}
