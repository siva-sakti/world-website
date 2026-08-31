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
  onBulkUnplace,
  onBulkTrash,
  onFit,
  zoomPct,
  fileRef,
  onPickImage,
  audioRef,
  onPickAudio,
  error,
  onDismissError,
}: {
  onAddNote: () => void;
  onPen: () => void;
  selectMode: boolean;
  onToggleSelect: () => void;
  selectedCount: number;
  onBulkUnplace: () => void;
  onBulkTrash: () => void;
  onFit: () => void;
  zoomPct: number;
  fileRef: RefObject<HTMLInputElement | null>;
  onPickImage: (e: React.ChangeEvent<HTMLInputElement>) => void;
  audioRef: RefObject<HTMLInputElement | null>;
  onPickAudio: (e: React.ChangeEvent<HTMLInputElement>) => void;
  error: string | null;
  onDismissError: () => void;
}) {
  return (
    <div className="compose-toolbar">
      <button className="compose-btn" onClick={onAddNote}>+ text</button>
      <button className="compose-btn" onClick={() => fileRef.current?.click()}>+ image</button>
      <button className="compose-btn" onClick={() => audioRef.current?.click()}>+ audio</button>
      <button className="compose-btn" onClick={onPen}>✎ pen</button>
      <button
        className={`compose-btn${selectMode ? " is-on" : ""}`}
        onClick={onToggleSelect}
        title="Select several cards to move or remove them together"
      >
        ⛶ select
      </button>
      {selectedCount > 1 && (
        <span className="compose-bulk">
          <span className="compose-selected">{selectedCount} selected</span>
          <button className="compose-btn subtle" onClick={onBulkUnplace} title="Remove all selected cards from this board">
            remove from board
          </button>
          <button className="compose-btn subtle" onClick={onBulkTrash} title="Trash all selected cards">
            trash
          </button>
        </span>
      )}
      <span className="compose-zoom">
        <button className="compose-btn" onClick={onFit} title="Bring all your cards into view">
          ⊹ fit
        </button>
        <span className="compose-zoom-pct" title="current zoom">
          {Math.round(zoomPct * 100)}%
        </span>
      </span>
      <input ref={fileRef} type="file" accept="image/*" hidden onChange={onPickImage} />
      <input ref={audioRef} type="file" accept="audio/*" hidden onChange={onPickAudio} />
      {error && (
        <span className="text-sm text-red-700">
          {error} <button className="underline" onClick={onDismissError}>ok</button>
        </span>
      )}
    </div>
  );
}
