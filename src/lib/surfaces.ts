import type { HomeBoard, Bit } from "@/lib/types";
import { boardLabel } from "@/lib/labels";

// A SURFACE = a board or a note, flattened into one shape the home list can render
// and sort uniformly. Built once on the server (page.tsx); the list dispatches each
// row's controls by `kind`. `modified_at` = a board's touched_at / a note's updated_at.

export type Surface = {
  kind: "board" | "note";
  id: string;
  title: string;
  href: string;
  group_id: string | null;
  pinned_at: string | null;
  created_at: string;
  modified_at: string;
};

export function toSurfaces(boards: HomeBoard[], notes: Bit[]): Surface[] {
  const b: Surface[] = boards.map((x) => ({
    kind: "board",
    id: x.id,
    title: boardLabel(x.title),
    href: `/board/${x.id}`,
    group_id: x.group_id,
    pinned_at: x.pinned_at,
    created_at: x.created_at,
    modified_at: x.touched_at,
  }));
  const n: Surface[] = notes.map((x) => ({
    kind: "note",
    id: x.id,
    title: x.content?.trim() || x.face || "untitled",
    href: `/note/${x.id}`,
    group_id: x.group_id,
    pinned_at: x.pinned_at,
    created_at: x.created_at,
    modified_at: x.updated_at,
  }));
  return [...b, ...n];
}
