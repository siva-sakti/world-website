"use client";

import Link from "next/link";
import { typeLabel } from "@/lib/labels";
import type { ShelfGroup } from "@/lib/db/shelf";
import { GroupPicker, PinToggle } from "@/components/shelf-controls";
import type { PanelBit } from "@/lib/db/inbox";
import { InboxTrash } from "./inbox-trash";
import { InboxTags } from "./inbox-tags";
import { PlaceOnBoard } from "./place-on-board";

// One bit in the notes grid (client — the browser filters/sorts around it).
// On the "all" tab (showBoards) a placed bit shows its board links; place-on
// stays LOOSE-ONLY — offering it on a placed bit is the multi-board door,
// deliberately parked (A20).
export function NoteCard({
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
  selectMode?: boolean; // loose-page multi-select: the whole card becomes a selection toggle
  selected?: boolean;
  onToggle?: () => void;
}) {
  const title = item.face; // first words (text) · label (drawing) · content (image)
  const source = item.source;
  const isLoose = item.boards.length === 0;

  return (
    <li
      className={`inbox-card inbox-card--${item.type}${selectMode ? " inbox-card--selecting" : ""}${selected ? " inbox-card--selected" : ""}`}
      // Capture the click at the card BEFORE it can reach the inner open-link, and toggle instead —
      // reliable regardless of CSS (pointer-events alone let the link's navigation slip through).
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
      {/* In select mode the whole card toggles selection; a CSS rule makes inner links/controls
          click-through (.inbox-card--selecting *), so a click anywhere selects instead of opening. */}
      {/* Open → the workspace, where full editing / tagging / source live. */}
      <Link href={`/bit/${item.id}`} className="inbox-card-body" title="open">
        {item.type === "image" || item.type === "pdf" || (item.type === "link" && img) ? (
          img ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={img} alt={title ?? ""} className="inbox-card-media" />
          ) : (
            <span className="inbox-card-media inbox-card-media--empty">
              {item.type === "pdf" ? "PDF" : "image"}
            </span>
          )
        ) : item.type === "drawing" ? (
          <span className="inbox-card-note inbox-card-note--drawing">
            <span className="inbox-card-kind">✎ sketch</span>
            {title && <span className="inbox-card-title">{title}</span>}
          </span>
        ) : item.type === "audio" ? (
          <span className="inbox-card-note inbox-card-note--audio">
            <span className="inbox-card-kind">♪ recording</span>
            {title && <span className="inbox-card-title">{title}</span>}
          </span>
        ) : (
          <span className="inbox-card-note">
            {title ? (
              <span className="inbox-card-text">{title}</span>
            ) : (
              <span className="inbox-card-text inbox-card-text--empty">empty note</span>
            )}
          </span>
        )}
      </Link>

      {/* Meta — provenance + tags; on "all", where the bit lives. Interactive,
          so OUTSIDE the open-link (a bit's "from …" travels with it, P8). */}
      <div className="inbox-card-meta">
        {source && (
          <span className="inbox-card-from">
            <Link
              href={`/source/${source.id}`}
              className="inbox-card-from-name"
              title="everything from this source"
            >
              from {source.name}
            </Link>
            {source.url && (
              <a
                href={source.url}
                target="_blank"
                rel="noopener noreferrer"
                className="inbox-card-from-open"
                title="open source"
              >
                ↗
              </a>
            )}
          </span>
        )}
        {showBoards && item.boards.length > 0 && (
          <span className="inbox-card-boards">
            on{" "}
            {item.boards.map((bd, i) => (
              <span key={bd.id}>
                {i > 0 && " · "}
                <Link
                  href={`/board/${bd.id}`}
                  className="inbox-card-board-link"
                  title="open this board"
                >
                  {bd.title || "untitled board"}
                </Link>
              </span>
            ))}
          </span>
        )}
        <InboxTags bitId={item.id} initialTags={item.tags} />
      </div>

      <div className="inbox-card-foot">
        <span className="inbox-card-kind-tag">{typeLabel(item.type)}</span>
        <span className="inbox-card-actions">
          <GroupPicker bitId={item.id} groupId={item.group_id} groups={groups} />
          <PinToggle bitId={item.id} pinned={Boolean(item.pinned_at)} />
          {isLoose && <PlaceOnBoard bitId={item.id} boards={boards} onPlaced={onPlaced} />}
          <InboxTrash bitId={item.id} onBoards={item.boards.length} className="inbox-card-trash" />
        </span>
      </div>
    </li>
  );
}
