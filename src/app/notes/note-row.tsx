"use client";

import Link from "next/link";
import type { PanelBit } from "@/lib/db/inbox";
import { trashFromInbox } from "./actions";
import { PlaceOnBoard } from "./place-on-board";
import { PinToggle } from "./note-card";

// The list-view row (O2 extension): one line per bit — denser than the card,
// same doors. Place-on stays loose-only (A20), trash everywhere.
export function NoteRow({
  item,
  img,
  boards,
  showBoards,
}: {
  item: PanelBit;
  img?: string;
  boards: { id: string; title: string | null }[];
  showBoards: boolean;
}) {
  const title = item.face;
  const isLoose = item.boards.length === 0;
  const date = new Date(item.created_at).toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
  });

  return (
    <li className="notes-row">
      <span className="inbox-card-kind-tag">{item.type === "drawing" ? "sketch" : item.type}</span>
      <Link href={`/bit/${item.id}`} className="notes-row-title" title="open">
        {item.type === "image" && img && (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={img} alt="" className="notes-row-thumb" />
        )}
        {title ? (
          <span>{title}</span>
        ) : (
          <span className="notes-row-empty">{item.type === "image" ? "image" : "empty note"}</span>
        )}
      </Link>
      {item.source && (
        <Link href={`/source/${item.source.id}`} className="notes-row-source" title="everything from this source">
          from {item.source.name}
        </Link>
      )}
      {showBoards && item.boards.length > 0 && (
        <span className="inbox-card-boards">
          on{" "}
          {item.boards.map((bd, i) => (
            <span key={bd.id}>
              {i > 0 && " · "}
              <Link href={`/board/${bd.id}`} className="inbox-card-board-link">
                {bd.title || "untitled board"}
              </Link>
            </span>
          ))}
        </span>
      )}
      <span className="notes-row-date">{date}</span>
      <span className="notes-row-actions">
        <PinToggle bitId={item.id} pinned={Boolean(item.pinned_at)} />
        {isLoose && <PlaceOnBoard bitId={item.id} boards={boards} />}
        <form action={trashFromInbox}>
          <input type="hidden" name="id" value={item.id} />
          <button className="inbox-card-trash" title="move to trash" aria-label="move to trash">trash</button>
        </form>
      </span>
    </li>
  );
}
