"use client";

import { TagBar } from "./tag-bar";
import type { CardVM } from "./card-vm";
import type { Tag } from "@/lib/db/tags";

// THE SELECTED CARD'S BAR — what you can do to the one card you have picked: its tags,
// and the five acts. Shown only for a SINGLE selection (a multi-selection is the
// toolbar's business, which owns the bulk acts).
//
// Pure presentation. Every act is passed in already bound to the board's machinery —
// nothing here decides anything, holds state, or touches the database, which is why it
// could leave board-surface.tsx without carrying any coupling with it.

export function SelectedBar({
  card,
  metaRefresh,
  onTagAdd,
  onTagRemove,
  onOpen,
  onToggleLock,
  onSendToBack,
  onUnplace,
  onTrash,
}: {
  card: CardVM;
  /** Bumped when an undo/redo reverses a tag act, so the bar repaints itself. */
  metaRefresh: number;
  onTagAdd: (tag: Tag) => void;
  onTagRemove: (tag: Tag) => void;
  onOpen: () => void;
  onToggleLock: () => void;
  onSendToBack: () => void;
  onUnplace: () => void;
  onTrash: () => void;
}) {
  return (
    <div className="selected-bar">
      <TagBar
        key={card.bitId}
        target={{ bitId: card.bitId }}
        refreshSignal={metaRefresh}
        onTagAct={(kind, tag) => (kind === "add" ? onTagAdd(tag) : onTagRemove(tag))}
      />
      <div className="selected-actions">
        <button
          className="compose-btn subtle"
          onClick={onOpen}
          title="Open this card full-page — comfortable writing"
        >
          open
        </button>
        <button
          className="compose-btn subtle"
          onClick={onToggleLock}
          title={
            card.locked
              ? "Unlock — this card can move again"
              : "Lock this card in place — a stray drag can't move it (removing it still works)"
          }
        >
          {card.locked ? "🔓 unlock" : "🔒 lock"}
        </button>
        <button
          className="compose-btn subtle"
          onClick={onSendToBack}
          title="Send this card behind everything else"
        >
          send to back
        </button>
        <button
          className="compose-btn subtle"
          onClick={onUnplace}
          title="Take this card off THIS board — it lives on (its other boards, and loose in your bits)"
        >
          remove from this board
        </button>
        <button
          className="compose-btn subtle"
          onClick={onTrash}
          title="Move this card to the trash — hidden everywhere, restorable"
        >
          trash
        </button>
      </div>
    </div>
  );
}
