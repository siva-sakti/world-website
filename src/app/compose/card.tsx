"use client";

import { useRef } from "react";
import { Rnd } from "react-rnd";
import type { PBit } from "./types";
import { TextBit } from "./text-bit";
import { DoodleBit } from "./doodle-bit";

// Visible resize handles: small dots on the frame's grab points, shown by
// react-rnd only while resizing is enabled (selected-but-not-editing).
// Two distinct gestures, per bit type:
//   • text  → LEFT/RIGHT side handles = reflow (change wrap width; height
//             follows the text, so no top/bottom handles → no jumpy snap).
//   • image → CORNER handles = scale, aspect-locked.
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
const RESIZE_TEXT = { left: true, right: true };
const RESIZE_IMAGE = {
  topLeft: true,
  topRight: true,
  bottomLeft: true,
  bottomRight: true,
};

// The universal card: a draggable/resizable wrapper reused by EVERY bit type.
// Only the content inside differs (text now; image/doodle later).
export function Card({
  bit,
  selected,
  editing,
  onSelect,
  onEdit,
  onChange,
}: {
  bit: PBit;
  selected: boolean;
  editing: boolean;
  onSelect: () => void;
  onEdit: () => void;
  onChange: (patch: Partial<PBit>) => void;
}) {
  // Was this card already selected when the pointer went down? Drives the
  // click-to-select-then-edit two-step: a fresh click on a card selects it
  // (showing its resize frame); clicking an already-selected card edits.
  const wasSelected = useRef(false);
  const isText = bit.type === "text";
  // text: fixed width, height follows content (wraps + grows down). others: fixed w/h.
  const size = isText
    ? { width: bit.w, height: "auto" }
    : { width: bit.w, height: bit.h };

  // Corner-scale (text only): drag the bottom-right handle to zoom the whole
  // note — width and font size grow together by one factor, so the text gets
  // bigger while the wrap stays put. Custom (not react-rnd's corner), so there's
  // no fight with the auto height. Anchored at the top-left (x/y don't move).
  function startScale(e: React.PointerEvent) {
    e.preventDefault();
    e.stopPropagation();
    const startX = e.clientX;
    const startW = bit.w;
    const startFont = bit.fontSize ?? 16;
    const onMove = (ev: PointerEvent) => {
      const f = Math.min(6, Math.max(0.4, (startW + (ev.clientX - startX)) / startW));
      onChange({
        w: Math.round(startW * f),
        fontSize: Math.round(startFont * f * 10) / 10,
      });
    };
    const onUp = () => {
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerup", onUp);
    };
    window.addEventListener("pointermove", onMove);
    window.addEventListener("pointerup", onUp);
  }

  return (
    <Rnd
      position={{ x: bit.x, y: bit.y }}
      size={size as { width: number | string; height: number | string }}
      disableDragging={editing}
      enableResizing={
        selected && !editing ? (isText ? RESIZE_TEXT : RESIZE_IMAGE) : false
      }
      resizeHandleStyles={HANDLE_STYLES}
      lockAspectRatio={!isText}
      cancel=".compose-scale-handle"
      bounds="parent"
      minWidth={70}
      minHeight={28}
      style={{ zIndex: bit.z }}
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
          bit.type === "image"
            ? " is-image"
            : bit.type === "doodle"
              ? " is-doodle"
              : ""
        }`}
        style={isText && bit.fontSize ? { fontSize: bit.fontSize } : undefined}
        onPointerDown={() => {
          wasSelected.current = selected;
          if (!selected) onSelect();
        }}
        onClick={() => {
          // Only text has an edit mode; a second click on an image is a no-op
          // (it stays selected with its resize frame).
          if (isText && !editing && wasSelected.current) onEdit();
        }}
      >
        {isText && (
          <TextBit
            html={bit.html || ""}
            editing={editing}
            onChange={(html) => onChange({ html })}
          />
        )}
        {bit.type === "image" && bit.src && (
          <img src={bit.src} alt="" className="compose-img" draggable={false} />
        )}
        {bit.type === "doodle" && bit.strokes && (
          <DoodleBit strokes={bit.strokes} />
        )}
        {isText && selected && !editing && (
          <div
            className="compose-scale-handle"
            onPointerDown={startScale}
            onClick={(e) => e.stopPropagation()}
          />
        )}
      </div>
    </Rnd>
  );
}
