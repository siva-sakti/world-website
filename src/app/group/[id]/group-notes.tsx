"use client";

import type { PanelBit } from "@/lib/db/inbox";
import type { ShelfGroup } from "@/lib/db/shelf";
import { NoteCard } from "@/app/notes/note-card";

// The notes shelved in this group, as the familiar card grid (client because
// the card's doors — pin, tags, place-on, trash — are interactive).
export function GroupNotes({
  items,
  imgs,
  boards,
  groups,
}: {
  items: PanelBit[];
  imgs: Record<string, string>;
  boards: { id: string; title: string | null }[];
  groups: ShelfGroup[];
}) {
  return (
    <ul className="inbox-grid">
      {items.map((b) => (
        <NoteCard key={b.id} item={b} img={imgs[b.id]} boards={boards} groups={groups} showBoards />
      ))}
    </ul>
  );
}
