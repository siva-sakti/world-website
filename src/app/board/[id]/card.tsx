"use client";

import { useEffect, useRef, useState } from "react";
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
  sourceName?: string; // "from …" — the bit's source (travels with it, P8)
  sourceUrl?: string; // the source's optional clickable link
};

// Resize dots in two sizes: 11px for a mouse, 22px for a coarse (touch) pointer —
// a fingertip can't grab an 11px dot (writing-experience-plan v1.4). Offsets scale
// with the size so the dots stay centered on the edge (plan review finding 9).
function handleStyles(size: number) {
  const dot = {
    width: size,
    height: size,
    borderRadius: size < 16 ? 3 : 6,
    background: "#fffdfa",
    border: "1.5px solid #365a8c",
    boxShadow: "0 1px 2px rgba(0,0,0,0.2)",
  };
  const off = -Math.round(size / 2) - 1;
  const mid = -(size / 2);
  return {
    topLeft: { ...dot, left: off, top: off },
    topRight: { ...dot, right: off, top: off },
    bottomLeft: { ...dot, left: off, bottom: off },
    bottomRight: { ...dot, right: off, bottom: off },
    left: { ...dot, left: off, top: "50%", marginTop: mid },
    right: { ...dot, right: off, top: "50%", marginTop: mid },
  };
}
const HANDLE_STYLES = handleStyles(11);
const HANDLE_STYLES_COARSE = handleStyles(22);
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
  selectMode,
  scale,
  offeringWords,
  onSelect,
  onEdit,
  onChange,
  onContentSave,
  onDragStart,
  onDragMove,
  onDragEnd,
}: {
  card: CardVM;
  selected: boolean;
  editing: boolean;
  selectMode: boolean; // when on, a tap toggles selection (touch-friendly multi-select)
  scale: number; // the canvas zoom — react-rnd needs it so drag/resize deltas stay true
  offeringWords?: boolean; // the "add a few words?" prompt owns the caption right now
  onSelect: (additive: boolean) => void;
  onEdit: () => void;
  onChange: (patch: Partial<CardVM>) => void;
  onContentSave: (value: string) => void;
  // Drag reporting for move-together: the board moves the OTHER selected cards; this
  // card stays entirely with react-rnd until onDragEnd (so it never jumps/stutters).
  onDragStart?: () => void;
  onDragMove?: (x: number, y: number) => void;
  onDragEnd?: (x: number, y: number) => void;
}) {
  // Two-step: a fresh click selects (shows the resize frame); clicking an
  // already-selected text card enters edit mode.
  const wasSelected = useRef(false);
  // Coarse pointer (touch) → the fat resize dots. Read after mount: handles only
  // render once selected (client state), so there's no hydration risk.
  const [coarse, setCoarse] = useState(false);
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- one-time device capability read
    setCoarse(window.matchMedia("(pointer: coarse)").matches);
  }, []);
  const isText = card.type === "text";
  // Auto-widen while typing (writing-experience plan v1.1): a receipt-shaped note
  // grows WIDER first — stepwise, up to a comfortable measure — then taller as
  // today. The owner's own resize always wins (userSized, set on resize-stop).
  // Stored h is stale by design for text (height:auto), so measure the DOM after
  // each keystroke commits; the same onChange({w}) path as a hand-resize persists it.
  const userSized = useRef(false);
  const innerRef = useRef<HTMLDivElement | null>(null);
  useEffect(() => {
    if (!editing || !isText || userSized.current) return;
    const el = innerRef.current;
    if (!el) return;
    if (el.offsetHeight > card.w * 1.5 && card.w < 560) {
      onChange({ w: Math.min(560, card.w + 80) });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps -- re-measure per keystroke/width only
  }, [card.body, card.w, editing, isText]);
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
      resizeHandleStyles={coarse ? HANDLE_STYLES_COARSE : HANDLE_STYLES}
      lockAspectRatio={!isText}
      scale={scale}
      minWidth={70}
      minHeight={28}
      style={{ zIndex: card.z }}
      className={`compose-card${selected ? " is-selected" : ""}`}
      onDragStart={() => onDragStart?.()}
      onDrag={(_e, d) => onDragMove?.(d.x, d.y)}
      onDragStop={(_e, d) => {
        onChange({ x: d.x, y: d.y });
        onDragEnd?.(d.x, d.y);
      }}
      onResizeStop={(_e, _dir, ref, _delta, pos) => {
        userSized.current = true; // the owner set this width — auto-widen backs off
        onChange(
          isText
            ? { x: pos.x, y: pos.y, w: ref.offsetWidth }
            : { x: pos.x, y: pos.y, w: ref.offsetWidth, h: ref.offsetHeight },
        );
      }}
    >
      <div
        ref={innerRef}
        data-pid={card.placementId}
        className={`compose-card-inner${
          card.type === "image"
            ? " is-image"
            : card.type === "drawing"
              ? " is-doodle"
              : ""
        }`}
        onPointerDown={(e) => {
          wasSelected.current = selected;
          const additive = selectMode || e.shiftKey || e.metaKey || e.ctrlKey;
          // Non-additive: select on grab so a drag works in one gesture. Additive:
          // wait for the click (a tap), so dragging a selected card moves, not toggles.
          if (!additive && !selected) onSelect(false);
        }}
        onClick={(e) => {
          const additive = selectMode || e.shiftKey || e.metaKey || e.ctrlKey;
          if (additive) {
            onSelect(true); // toggle (react-rnd suppresses click after a drag, so a drag won't toggle)
            return;
          }
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
        {/* "from …" — the bit's source travels with it (P8). Quiet, below the
            words; hidden while editing to keep the writing surface clean. */}
        {isText && !editing && card.sourceName && (
          <div className="compose-source-line">
            from {card.sourceName}
            {card.sourceUrl && (
              <a
                href={card.sourceUrl}
                target="_blank"
                rel="noreferrer"
                className="compose-source-open"
                onPointerDown={(e) => e.stopPropagation()}
                onClick={(e) => e.stopPropagation()}
              >
                ↗
              </a>
            )}
          </div>
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
        {!isText && selected && !offeringWords && (
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
  const focused = useRef(false);
  // Keep the field in sync when the saved value changes elsewhere (e.g. the
  // "add a few words?" prompt saving the same caption) — but never overwrite what
  // the owner is actively typing here.
  useEffect(() => {
    if (!focused.current) setDraft(value);
  }, [value]);
  return (
    <input
      value={draft}
      placeholder={placeholder}
      className={className}
      onChange={(e) => setDraft(e.target.value)}
      onFocus={() => (focused.current = true)}
      onPointerDown={(e) => e.stopPropagation()} // don't start a drag from the input
      onBlur={() => {
        focused.current = false;
        if (draft.trim() !== value.trim()) onSave(draft);
      }}
      onKeyDown={(e) => {
        if (e.key === "Enter") (e.target as HTMLInputElement).blur();
        if (e.key === "Escape") setDraft(value);
      }}
    />
  );
}
