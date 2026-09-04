"use client";

import Link from "next/link";
import { typeLabel } from "@/lib/labels";
import type { PanelBit } from "@/lib/db/inbox";
import { InboxTrash } from "./inbox-trash";
import { PlaceOnBoard } from "./place-on-board";
import { PinToggle, GroupPicker } from "@/components/shelf-controls";
import type { ShelfGroup } from "@/lib/db/shelf";
import { Stamp } from "@/components/stamp";

// The list-view row (O2 extension): one line per bit — denser than the card,
// same doors. Place-on stays loose-only (A20), trash everywhere.
export function NoteRow({
  item,
  img,
  boards,
  groups,
  showBoards,
  onPlaced,
  selectMode,
  selected,
  onToggle,
}: {
  item: PanelBit;
  img?: string;
  boards: { id: string; title: string | null }[];
  groups: ShelfGroup[];
  showBoards: boolean;
  onPlaced?: (boardId: string, boardTitle: string | null) => void;
  selectMode?: boolean;
  selected?: boolean;
  onToggle?: () => void;
}) {
  const title = item.face;
  const isLoose = item.boards.length === 0;

  return (
    <li
      className={`notes-row${selectMode ? " notes-row--selecting" : ""}${selected ? " notes-row--selected" : ""}`}
      // Capture the click before it reaches the inner open-link, and toggle instead (reliable
      // regardless of CSS — pointer-events alone let the link's navigation slip through).
      onClickCapture={
        selectMode
          ? (e) => {
              e.preventDefault();
              e.stopPropagation();
              onToggle?.();
            }
          : undefined
      }
    >
      <span className="inbox-card-kind-tag">{typeLabel(item.type)}</span>
      <Link href={`/bit/${item.id}`} className="notes-row-title" title="open">
        {(item.type === "image" || item.type === "pdf" || item.type === "link") && img && (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={img} alt="" className="notes-row-thumb" />
        )}
        {title ? (
          <span>{title}</span>
        ) : (
          <span className="notes-row-empty">{item.type === "text" ? "empty note" : typeLabel(item.type)}</span>
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
      <Stamp iso={item.created_at} className="notes-row-date" />
      <span className="notes-row-actions">
        <GroupPicker bitId={item.id} groupId={item.group_id} groups={groups} />
        <PinToggle bitId={item.id} pinned={Boolean(item.pinned_at)} />
        {isLoose && <PlaceOnBoard bitId={item.id} boards={boards} onPlaced={onPlaced} />}
        <InboxTrash bitId={item.id} onBoards={item.boards.length} className="inbox-card-trash" />
      </span>
    </li>
  );
}
