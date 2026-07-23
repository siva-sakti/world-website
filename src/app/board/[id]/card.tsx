"use client";

import { useRef, useState } from "react";
import { Rnd } from "react-rnd";
import { TextBit } from "./text-bit";
import { DoodleBit } from "./doodle-bit";
import type { Drawing } from "@/lib/types";

// The client view-model for a card on the board: a placement joined to its bit's
// renderable bits. (Font-zoom from the prototype is deferred — the proven schema
// keeps placement to x/y/w/h/z, so per-note font size has no home yet; text still
// reflows by width. A font_scale column is an additive future call.)
export type CardVM = {
  placementId: string;
  bitId: string;
  type: "text" | "drawing" | "image";
  x: number;
  y: number;
  w: number;
  h: number;
  z: number;
  body?: string; // text (tiptap html → bit.body)
  drawing?: Drawing; // drawing (strokes + per-stroke pen width)
  imageUrl?: string; // image (resolved storage URL)
  content?: string; // owner words: a text bit's optional title (D-087) / a media caption (§2b)
};

const DOT = {
  width: 11,
  height: 11,
  borderRadius: 3,
  background: "#fffdfa",
  border: "1.5px solid #365a8c",
  boxShadow: "0 1px 2px rgba(0,0,0,0.2)",
};
const HANDLE_STYLES = {
  topLeft: { ...DOT, left: -6, top: -6 },
  topRight: { ...DOT, right: -6, top: -6 },
  bottomLeft: { ...DOT, left: -6, bottom: -6 },
  bottomRight: { ...DOT, right: -6, bottom: -6 },
  left: { ...DOT, left: -6, top: "50%", marginTop: -5.5 },
  right: { ...DOT, right: -6, top: "50%", marginTop: -5.5 },
};
// text → LEFT/RIGHT handles reflow (width); height follows the text.
// image/drawing → CORNER handles scale, aspect-locked.
const RESIZE_TEXT = { left: true, right: true };
const RESIZE_SCALE = {
  topLeft: true,
  topRight: true,
  bottomLeft: true,
  bottomRight: true,
};

// The universal card: a draggable/resizable wrapper reused by every bit type.
export function Card({
  card,
  selected,
  editing,
  scale,
  onSelect,
  onEdit,
  onChange,
  onContentSave,
}: {
  card: CardVM;
  selected: boolean;
  editing: boolean;
  scale: number; // the canvas zoom — react-rnd needs it so drag/resize deltas stay true
  onSelect: () => void;
  onEdit: () => void;
  onChange: (patch: Partial<CardVM>) => void;
  onContentSave: (value: string) => void;
}) {
  // Two-step: a fresh click selects (shows the resize frame); clicking an
  // already-selected text card enters edit mode.
  const wasSelected = useRef(false);
  const isText = card.type === "text";
  const size = isText
    ? { width: card.w, height: "auto" as const }
    : { width: card.w, height: card.h };

  return (
    <Rnd
      position={{ x: card.x, y: card.y }}
      size={size as { width: number | string; height: number | string }}
      disableDragging={editing}
      enableResizing={
        selected && !editing ? (isText ? RESIZE_TEXT : RESIZE_SCALE) : false
      }
      resizeHandleStyles={HANDLE_STYLES}
      lockAspectRatio={!isText}
      scale={scale}
      minWidth={70}
      minHeight={28}
      style={{ zIndex: card.z }}
      className={`compose-card${selected ? " is-selected" : ""}`}
      onDragStop={(_e, d) => onChange({ x: d.x, y: d.y })}
      onResizeStop={(_e, _dir, ref, _delta, pos) =>
        onChange(
          isText
            ? { x: pos.x, y: pos.y, w: ref.offsetWidth }
            : { x: pos.x, y: pos.y, w: ref.offsetWidth, h: ref.offsetHeight },
        )
      }
    >
      <div
        className={`compose-card-inner${
          card.type === "image"
            ? " is-image"
            : card.type === "drawing"
              ? " is-doodle"
              : ""
        }`}
        onPointerDown={() => {
          wasSelected.current = selected;
          if (!selected) onSelect();
        }}
        onClick={() => {
          if (isText && !editing && wasSelected.current) onEdit();
        }}
      >
        {/* Owner words (§2b): a text bit's optional TITLE above its body (D-087);
            a media bit's CAPTION below it. Editable while selected, not editing. */}
        {isText && selected && !editing && (
          <ContentLine
            value={card.content ?? ""}
            placeholder="title — optional"
            className="compose-title-input"
            onSave={onContentSave}
          />
        )}
        {isText && !(selected && !editing) && card.content && (
          <div className="compose-title-line">{card.content}</div>
        )}
        {isText && (
          <TextBit
            html={card.body || ""}
            editing={editing}
            onChange={(body) => onChange({ body })}
          />
        )}
        {card.type === "image" && card.imageUrl && (
          <img
            src={card.imageUrl}
            alt={card.content ?? ""}
            className="compose-img"
            draggable={false}
          />
        )}
        {card.type === "drawing" && card.drawing && (
          <DoodleBit drawing={card.drawing} />
        )}
        {!isText && selected && (
          <ContentLine
            value={card.content ?? ""}
            placeholder="add a few words — optional"
            className="compose-caption-input"
            onSave={onContentSave}
          />
        )}
        {!isText && !selected && card.content && (
          <div className="compose-caption-line">{card.content}</div>
        )}
      </div>
    </Rnd>
  );
}

// A quiet single-line editor for a bit's owner words. Saves on Enter/blur;
// Esc reverts. Never forced — empty saves as "no words" (P5).
function ContentLine({
  value,
  placeholder,
  className,
  onSave,
}: {
  value: string;
  placeholder: string;
  className: string;
  onSave: (v: string) => void;
}) {
  const [draft, setDraft] = useState(value);
  return (
    <input
      value={draft}
      placeholder={placeholder}
      className={className}
      onChange={(e) => setDraft(e.target.value)}
      onPointerDown={(e) => e.stopPropagation()} // don't start a drag from the input
      onBlur={() => draft.trim() !== value.trim() && onSave(draft)}
      onKeyDown={(e) => {
        if (e.key === "Enter") (e.target as HTMLInputElement).blur();
        if (e.key === "Escape") setDraft(value);
      }}
    />
  );
}
