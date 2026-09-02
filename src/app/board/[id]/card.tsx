"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Rnd } from "react-rnd";
import { registerSave } from "@/lib/save-guard";
import { TextBit } from "./text-bit";
import { DoodleBit } from "./doodle-bit";
import { SourcePicker } from "./source-picker";
import { hostOf } from "@/lib/page-meta";
import type { Source } from "@/lib/db/sources";
import type { Drawing } from "@/lib/types";

// The client view-model for a card on the board: a placement joined to its bit's
// renderable bits. (Font-zoom from the prototype is deferred — the proven schema
// keeps placement to x/y/w/h/z, so per-note font size has no home yet; text still
// reflows by width. A font_scale column is an additive future call.)
export type CardVM = {
  placementId: string;
  bitId: string;
  type: "text" | "drawing" | "image" | "audio" | "pdf" | "link";
  kind: "bit" | "note"; // a note (a written PIECE) renders as a page-shaped DOORWAY, not editable text (N3)
  x: number;
  y: number;
  w: number;
  h: number;
  z: number;
  body?: string; // text (tiptap html → bit.body)
  drawing?: Drawing; // drawing (strokes + per-stroke pen width)
  imageUrl?: string; // image thumbnail/full URL — also a PDF's first-page thumbnail (signed thumb_path)
  fileUrl?: string; // audio (resolved storage URL for the <audio> player)
  content?: string; // owner words: a text bit's optional title (D-087) / a media caption (§2b)
  locked?: boolean; // position frozen (B+): drag/resize/nudge/tidy skip it
  url?: string; // a LINK bit's substance — the card's open-↗ target
  label?: string; // a link bit's computed face (caption → read-once title → url) for the title strip
  sourceName?: string; // "from …" — the bit's source (travels with it, P8)
  sourceUrl?: string; // the source's optional clickable link
};

// Resize dots in two sizes: 11px for a mouse, 22px for a coarse (touch) pointer —
// a fingertip can't grab an 11px dot (writing-experience-plan v1.4). Offsets scale
// with the size so the dots stay centered on the edge (plan review finding 9).
function handleStyles(size: number, hit = size) {
  // The GRAB zone is `hit`; the visible dot (size `size`) is DRAWN centered in it
  // with a radial gradient (soak finding, 2026-09-01: an 11px dot was also an 11px
  // target — "a very narrow window" between resize and move). The hit area grows,
  // the quiet look stays.
  const r = size / 2;
  const dot = {
    width: hit,
    height: hit,
    background: `radial-gradient(circle, #fffdfa 0 ${r - 1.5}px, #365a8c ${r - 1.5}px ${r}px, transparent ${r}px)`,
  };
  const off = -Math.round(hit / 2) - 1;
  const mid = -(hit / 2);
  return {
    topLeft: { ...dot, left: off, top: off },
    topRight: { ...dot, right: off, top: off },
    bottomLeft: { ...dot, left: off, bottom: off },
    bottomRight: { ...dot, right: off, bottom: off },
    left: { ...dot, left: off, top: "50%", marginTop: mid },
    right: { ...dot, right: off, top: "50%", marginTop: mid },
  };
}
// A note doorway shows plain text drawn from its rich-text body (tags stripped).
function plainText(html: string | undefined): string {
  return (html ?? "").replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
}

const HANDLE_STYLES = handleStyles(11, 26); // 26px to grab, 11px to see
const HANDLE_STYLES_COARSE = handleStyles(22, 34);
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
  onOpen,
  onChange,
  onContentSave,
  onSourceChange,
  onSourceAct,
  metaRefresh,
  onDragStart,
  onResizeStart,
  measureRef,
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
  onOpen?: () => void; // a note doorway → open the note's page (N3)
  /** The one shared write wire, now carrying INTENT (undo plan §4): "move"/"resize"
   *  are the owner's hand (recorded as acts); "grow" (auto-widen) and "write" (body
   *  keystrokes — the text editor's own flow-undo owns those) are never recorded. */
  onChange: (patch: Partial<CardVM>, how?: "move" | "resize" | "grow" | "write") => void;
  onContentSave: (value: string) => void;
  // The card's editable source picker changed the bit's source — patch the resting
  // "from …" stamp into this card's VM so it appears without a reload (SourcePicker
  // already persisted bit.source_id; this only refreshes the local view).
  onSourceChange?: (source: Source | null) => void;
  /** undo §6: forwarded to the SourcePicker — the board records landed source acts. */
  onSourceAct?: (prev: Source | null, next: Source | null) => void;
  /** Bumped by an undo/redo reverse — the pickers refetch so the reverse repaints. */
  metaRefresh?: number;
  // Drag reporting for move-together: the board moves the OTHER selected cards; this
  // card stays entirely with react-rnd until onDragEnd (so it never jumps/stutters).
  onDragStart?: () => void;
  onResizeStart?: () => void; // the board captures before-geometry from STATE here (rnd's callback carries none)
  /** The geometry registry's ref-callback (use-geometry): seeds + observes this
   *  card's true size. Stable per placementId — passed from the one call site. */
  measureRef?: (el: HTMLElement | null) => void | (() => void);
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
  const isNote = card.kind === "note";
  const isText = card.type === "text" && !isNote; // a note renders as a doorway, not editable text
  // An <audio> player sizes like TEXT, not like an image: width-resizable, height
  // follows the (fixed) player — NEVER aspect-locked/corner-scaled (that would stretch
  // the controls). pdf will size the same way. `flexSized` = "width-flex, height-auto".
  const isAudio = card.type === "audio";
  const flexSized = isText || isAudio;
  // The doorway's face: the note's title (its `content`, else its first words) + a
  // faint preview of the body — read-only; clicking opens the note's page.
  const noteBody = isNote ? plainText(card.body) : "";
  const noteTitle = isNote ? (card.content?.trim() || noteBody.slice(0, 48) || "untitled") : "";
  const notePreview = isNote ? (card.content?.trim() ? noteBody : noteBody.slice(48)) : "";
  // Auto-widen while typing (writing-experience plan v1.1): a receipt-shaped note
  // grows WIDER first — stepwise, up to a comfortable measure — then taller as
  // today. The owner's own resize always wins (userSized, set on resize-stop).
  // Stored h is stale by design for text (height:auto), so measure the DOM after
  // each keystroke commits; the same onChange({w}) path as a hand-resize persists it.
  const userSized = useRef(false);
  const innerRef = useRef<HTMLDivElement | null>(null);
  // MEMOIZED composed ref (health check S1): an inline arrow re-attaches on every
  // render — Card re-renders on every pan/drag frame, so that was ~1800 forced
  // reflows/sec on a 30-card board. measureRef is stable per placementId; so is this.
  const setInner = useCallback(
    (el: HTMLDivElement | null) => {
      innerRef.current = el;
      const cleanup = measureRef?.(el);
      return () => {
        innerRef.current = null;
        cleanup?.();
      };
    },
    [measureRef],
  );
  useEffect(() => {
    if (!editing || !isText || userSized.current) return;
    const el = innerRef.current;
    if (!el) return;
    if (el.offsetHeight > card.w * 1.5 && card.w < 560) {
      onChange({ w: Math.min(560, card.w + 80) }, "grow"); // the board's reflex, not a hand
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps -- re-measure per keystroke/width only
  }, [card.body, card.w, editing, isText]);
  const size = flexSized
    ? { width: card.w, height: "auto" as const }
    : { width: card.w, height: card.h };

  return (
    <Rnd
      position={{ x: card.x, y: card.y }}
      size={size as { width: number | string; height: number | string }}
      disableDragging={editing || Boolean(card.locked)}
      enableResizing={
        selected && !editing && !card.locked ? (flexSized ? RESIZE_TEXT : RESIZE_SCALE) : false
      }
      resizeHandleStyles={coarse ? HANDLE_STYLES_COARSE : HANDLE_STYLES}
      lockAspectRatio={!flexSized}
      scale={scale}
      minWidth={70}
      minHeight={28}
      style={{ zIndex: card.z }}
      className={`compose-card${selected ? " is-selected" : ""}`}
      onDragStart={() => onDragStart?.()}
      onDrag={(_e, d) => onDragMove?.(d.x, d.y)}
      onDragStop={(_e, d) => {
        onChange({ x: d.x, y: d.y }, "move");
        onDragEnd?.(d.x, d.y);
      }}
      onResizeStart={() => onResizeStart?.()}
      onResizeStop={(_e, _dir, ref, _delta, pos) => {
        userSized.current = true; // the owner set this width — auto-widen backs off
        onChange(
          flexSized
            ? { x: pos.x, y: pos.y, w: ref.offsetWidth }
            : { x: pos.x, y: pos.y, w: ref.offsetWidth, h: ref.offsetHeight },
          "resize",
        );
      }}
    >
      <div
        ref={setInner}
        data-pid={card.placementId}
        className={`compose-card-inner${
          isNote
            ? " is-note"
            : card.type === "image" || card.type === "pdf" || card.type === "link"
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
          if (isNote && wasSelected.current) onOpen?.(); // a doorway opens the note's page
        }}
      >
        {/* Owner words (§2b): a text bit's optional TITLE above its body (D-087);
            a media bit's CAPTION below it. Editable the moment you're on the bit —
            selected, whether or not you're writing the body. */}
        {isText && selected && (
          <ContentLine
            value={card.content ?? ""}
            placeholder="title — optional"
            className="compose-title-input"
            onSave={onContentSave}
          />
        )}
        {isText && !selected && card.content && (
          <div className="compose-title-line">{card.content}</div>
        )}
        {isText && (
          <TextBit
            html={card.body || ""}
            editing={editing}
            selected={selected}
            onChange={(body) => onChange({ body }, "write")}
          />
        )}
        {/* "from …" — the bit's source travels with it (P8). RESTING: a quiet
            read-only stamp below the words (only when a source exists). */}
        {isText && !selected && card.sourceName && (
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
        {/* ACTIVE: an editable source picker at the bottom of the card — add or
            change the "from …" in place (writes bit.source_id via SourcePicker). */}
        {isText && selected && (
          <SourcePicker
            bitId={card.bitId}
            initial={null}
            label="source"
            onChange={onSourceChange}
            onSourceAct={onSourceAct}
            refreshSignal={metaRefresh}
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
        {card.type === "audio" && card.fileUrl && (
          <audio
            className="compose-audio"
            controls
            preload="metadata"
            src={card.fileUrl}
            onPointerDown={(e) => e.stopPropagation()} // let the play scrubber work, don't start a drag
          />
        )}
        {/* A PDF looks like itself — its first-page thumbnail, with a small "PDF"
            badge. An unrenderable PDF (no thumb) falls back to a document sheet. */}
        {card.type === "pdf" &&
          (card.imageUrl ? (
            <div className="compose-pdf">
              <img
                src={card.imageUrl}
                alt={card.content ?? ""}
                className="compose-img"
                draggable={false}
              />
              <span className="compose-pdf-badge">PDF</span>
            </div>
          ) : (
            <div className="compose-pdf compose-pdf--empty">
              <span className="compose-pdf-mark">PDF</span>
              {card.content && <span className="compose-pdf-name">{card.content}</span>}
            </div>
          ))}
        {/* A LINK looks like the thing it points at (link-bit-plan): its page-card
            image, cover-fit, with a quiet title strip — the ladder degrades to a
            title card, then a bare URL card. The ↗ opens the real page. */}
        {card.type === "link" &&
          (card.imageUrl ? (
            <div className="compose-linkcard">
              <img src={card.imageUrl} alt={card.label ?? ""} className="compose-img compose-linkcard-img" draggable={false} />
              <div className="compose-linkcard-strip">
                <span className="compose-linkcard-title">{card.label}</span>
                <LinkOut url={card.url} />
              </div>
            </div>
          ) : (
            <div className="compose-linkcard compose-linkcard--bare">
              <span className="compose-linkcard-site">{hostOf(card.url)}</span>
              <span className="compose-linkcard-title">{card.label}</span>
              <LinkOut url={card.url} />
            </div>
          ))}
        {card.type === "drawing" && card.drawing && (
          <DoodleBit drawing={card.drawing} />
        )}
        {/* A NOTE on a board = a page-shaped DOORWAY (N3): its title + a faint preview
            of its words, read-only. A click (once selected) opens the note's own page. */}
        {isNote && (
          <div className="compose-note-doorway">
            <div className="compose-note-title">{noteTitle}</div>
            {notePreview && <p className="compose-note-preview">{notePreview}</p>}
          </div>
        )}
        {/* Media meta (§2b): the caption + source strip BELOW the image — its own,
            never-clipped area (review M2). Editable the moment you're on the card;
            a quiet stamp at rest. Held back while the WordsOffer prompt owns a
            freshly-added image/drawing's caption (offeringWords). */}
        {!isText &&
          !isNote &&
          (selected ? !offeringWords : !!(card.content || card.sourceName)) && (
            <div className="compose-media-meta">
              {selected ? (
                <>
                  <ContentLine
                    value={card.content ?? ""}
                    placeholder="add a few words — optional"
                    className="compose-caption-input"
                    onSave={onContentSave}
                  />
                  <SourcePicker
                    bitId={card.bitId}
                    initial={null}
                    label="source"
                    onChange={onSourceChange}
                    onSourceAct={onSourceAct}
                    refreshSignal={metaRefresh}
                  />
                </>
              ) : (
                <>
                  {card.content && (
                    <div className="compose-caption-line">{card.content}</div>
                  )}
                  {card.sourceName && (
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
                </>
              )}
            </div>
          )}
      </div>
    </Rnd>
  );
}

// A link card's ↗ — opens the real page; stops propagation so it never starts a drag.
function LinkOut({ url }: { url?: string }) {
  if (!url) return null;
  return (
    <a
      href={url}
      target="_blank"
      rel="noopener noreferrer"
      className="compose-linkcard-out"
      title="open the page"
      onPointerDown={(e) => e.stopPropagation()}
      onClick={(e) => e.stopPropagation()}
    >
      ↗
    </a>
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
  // Unmount + page-hide commit (boundary hunt #2/#8): unmounting a focused input
  // fires NO blur — so a caption typed while its upload finished (the WordsOffer
  // swap), or before a click-away deselect, or before a phone backgrounding, was
  // silently dropped. Same rule as blur: commit only while focused-and-dirty.
  const commitRef = useRef<() => void>(() => {});
  // eslint-disable-next-line react-hooks/refs -- latest-callback ref: the effects below commit the current draft
  commitRef.current = () => {
    if (focused.current && draft.trim() !== value.trim()) onSave(draft);
  };
  useEffect(() => {
    const un = registerSave(() => commitRef.current());
    return () => {
      un();
      commitRef.current();
    };
  }, []);
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
