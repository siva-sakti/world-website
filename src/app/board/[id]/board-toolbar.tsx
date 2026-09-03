import type { AlignEdge, Axis } from "./board-arrange";
import type { RefObject } from "react";

// The board's top toolbar — create acts (+ text / + image / pen), the select toggle,
// the bulk acts that appear with a multi-selection, fit + zoom %, and the error line.
// Presentational: every action is a prop, so board-surface keeps all the logic.
export function BoardToolbar({
  onAddNote,
  onPen,
  selectMode,
  onToggleSelect,
  selectedCount,
  alignableCount,
  onBulkUnplace,
  onBulkTrash,
  onBulkArchive,
  onTidy,
  onAlign,
  onDistribute,
  onDuplicate,
  duplicating,
  onFit,
  onZoomIn,
  onZoomOut,
  zoomPct,
  onUndo,
  onRedo,
  undoLabel,
  redoLabel,
  undoNote,
  fileRef,
  onPickImage,
  audioRef,
  onPickAudio,
  pdfRef,
  onPickPdf,
  error,
  onDismissError,
}: {
  onAddNote: () => void;
  onPen: () => void;
  selectMode: boolean;
  onToggleSelect: () => void;
  selectedCount: number;
  /** How many of the selection can actually be aligned — locked cards are excluded by
   *  the acts, so the BUTTONS must count the same way or they offer a no-op. */
  alignableCount: number;
  onBulkUnplace: () => void;
  onBulkTrash: () => void;
  onBulkArchive: () => void;
  onTidy: () => void;
  onAlign: (edge: AlignEdge) => void;
  onDistribute: (axis: Axis) => void; // arrange the selection in a neat grid (owner-approved tidy-up)
  onDuplicate: () => void; // a copy arranging the same bits; the dialog offers open-or-stay
  duplicating: boolean;
  onFit: () => void;
  onZoomIn: () => void;
  onZoomOut: () => void;
  zoomPct: number;
  // Undo/redo (stage 5): the label IS the tooltip — the button always names its
  // next act ("undo: move 3 cards"), so nothing ever reverses invisibly. Null →
  // disabled. undoNote is the transient "undid: …" receipt (the ruled substitute
  // for moving the view — undo never pans/zooms).
  onUndo: () => void;
  onRedo: () => void;
  undoLabel: string | null;
  redoLabel: string | null;
  undoNote: string | null;
  fileRef: RefObject<HTMLInputElement | null>;
  onPickImage: (e: React.ChangeEvent<HTMLInputElement>) => void;
  audioRef: RefObject<HTMLInputElement | null>;
  onPickAudio: (e: React.ChangeEvent<HTMLInputElement>) => void;
  pdfRef: RefObject<HTMLInputElement | null>;
  onPickPdf: (e: React.ChangeEvent<HTMLInputElement>) => void;
  error: string | null;
  onDismissError: () => void;
}) {
  return (
    <div className="compose-toolbar">
      <button className="compose-btn" onClick={onAddNote}>+ text</button>
      <button className="compose-btn" onClick={() => fileRef.current?.click()}>+ image</button>
      <button className="compose-btn" onClick={() => audioRef.current?.click()}>+ audio</button>
      <button className="compose-btn" onClick={() => pdfRef.current?.click()}>+ pdf</button>
      <button className="compose-btn" onClick={onPen}>✎ pen</button>
      <button
        className={`compose-btn${selectMode ? " is-on" : ""}`}
        onClick={onToggleSelect}
        title="Select several cards to move or remove them together"
      >
        ⛶ select
      </button>
      <button
        className="compose-btn"
        disabled={duplicating}
        onClick={onDuplicate}
        title="Duplicate this board — a copy arranging the same bits"
      >
        ⧉ {duplicating ? "duplicating…" : "duplicate"}
      </button>
      {selectedCount > 1 && (
        <span className="compose-bulk">
          <span className="compose-selected">{selectedCount} selected</span>
          <button className="compose-btn subtle" onClick={onTidy} title="Arrange the selected cards in a neat grid">
            tidy up
          </button>
          {/* CARD ALIGNMENT. WORDS, not glyphs: the first cut used arrows (⇤ ⇹ ⇥ …) with the
              meaning hidden in tooltips, and the owner's verdict was "I'm honestly confused by
              what buttons do what". A control you must hover to decode is not labelled. Words
              also match this toolbar's existing buttons (tidy up · remove from board · trash).
              The compact alternative is real alignment ICONS (a line with bars flush to it) —
              that is a visual decision for the design pass, not one to invent here.
              Distribute needs three: with two there is no gap between them to even out. */}
          {alignableCount > 1 && (
          <span className="compose-align" role="group" aria-label="Line the selected cards up">
            <span className="compose-align-label">line up</span>
            <button className="compose-btn subtle" onClick={() => onAlign("left")} title="Line up their left edges">left</button>
            <button className="compose-btn subtle" onClick={() => onAlign("hcenter")} title="Line up their centres, side to side">centre</button>
            <button className="compose-btn subtle" onClick={() => onAlign("right")} title="Line up their right edges">right</button>
            <button className="compose-btn subtle" onClick={() => onAlign("top")} title="Line up their top edges">top</button>
            <button className="compose-btn subtle" onClick={() => onAlign("vmiddle")} title="Line up their middles, top to bottom">middle</button>
            <button className="compose-btn subtle" onClick={() => onAlign("bottom")} title="Line up their bottom edges">bottom</button>
          </span>
          )}
          {alignableCount > 2 && (
            <span className="compose-align" role="group" aria-label="Even out the gaps">
              <span className="compose-align-label">even gaps</span>
              <button className="compose-btn subtle" onClick={() => onDistribute("h")} title="Even out the gaps, left to right">across</button>
              <button className="compose-btn subtle" onClick={() => onDistribute("v")} title="Even out the gaps, top to bottom">down</button>
            </span>
          )}
          <button className="compose-btn subtle" onClick={onBulkUnplace} title="Remove all selected cards from this board">
            remove from board
          </button>
          <button className="compose-btn subtle" onClick={onBulkArchive} title="Archive all selected cards">
            archive
          </button>
          <button className="compose-btn subtle" onClick={onBulkTrash} title="Trash all selected cards">
            trash
          </button>
        </span>
      )}
      <span className="compose-zoom">
        <button className="compose-btn" onClick={onZoomOut} title="Zoom out (⌘−)">
          −
        </button>
        <button className="compose-btn" onClick={onZoomIn} title="Zoom in (⌘=)">
          +
        </button>
        <button className="compose-btn" onClick={onFit} title="Bring all your cards into view — press again to go back">
          ⊹ fit
        </button>
        <span className="compose-zoom-pct" title="current zoom">
          {Math.round(zoomPct * 100)}%
        </span>
      </span>
      <span className="compose-zoom">
        <button
          className="compose-btn"
          disabled={!undoLabel}
          onClick={onUndo}
          title={undoLabel ? `undo: ${undoLabel}` : "nothing to undo"}
          aria-label={undoLabel ? `undo: ${undoLabel}` : "nothing to undo"}
        >
          ↶
        </button>
        <button
          className="compose-btn"
          disabled={!redoLabel}
          onClick={onRedo}
          title={redoLabel ? `redo: ${redoLabel}` : "nothing to redo"}
          aria-label={redoLabel ? `redo: ${redoLabel}` : "nothing to redo"}
        >
          ↷
        </button>
        {undoNote && (
          <span className="compose-undone" role="status">
            {undoNote}
          </span>
        )}
      </span>
      <input ref={fileRef} type="file" multiple accept="image/*,.heic,.heif,image/heic,image/heif" hidden onChange={onPickImage} />
      <input ref={audioRef} type="file" multiple accept="audio/*" hidden onChange={onPickAudio} />
      <input ref={pdfRef} type="file" multiple accept="application/pdf,.pdf" hidden onChange={onPickPdf} />
      {error && (
        <span className="text-sm text-red-700">
          {error} <button className="underline" onClick={onDismissError}>ok</button>
        </span>
      )}
    </div>
  );
}
