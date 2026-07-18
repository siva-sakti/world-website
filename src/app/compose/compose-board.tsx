"use client";

import { useEffect, useRef, useState } from "react";
import { loadBoard, saveBoard } from "./store";
import type { PBit, Stroke } from "./types";
import { strokesBounds } from "./stroke";
import { Card } from "./card";
import { DrawOverlay } from "./draw-overlay";

function uid() {
  return Math.random().toString(36).slice(2, 10);
}
function maxZ(bs: PBit[]) {
  return bs.reduce((m, b) => Math.max(m, b.z), 0);
}

// Image import: cap stored resolution (keeps localStorage sane) and pick a
// sensible on-board display width — both aspect-preserving.
const MAX_SRC = 1400;
const MAX_DISP = 320;

export function ComposeBoard() {
  const [bits, setBits] = useState<PBit[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [drawMode, setDrawMode] = useState(false);
  const boardRef = useRef<HTMLDivElement>(null);
  const loaded = useRef(false);
  const lastTap = useRef<{ t: number; x: number; y: number } | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setBits(loadBoard().bits);
    loaded.current = true;
  }, []);

  useEffect(() => {
    if (!loaded.current) return;
    const t = setTimeout(() => saveBoard({ bits }), 250);
    return () => clearTimeout(t);
  }, [bits]);

  function update(id: string, patch: Partial<PBit>) {
    setBits((bs) => bs.map((b) => (b.id === id ? { ...b, ...patch } : b)));
  }
  function bringFront(id: string) {
    setBits((bs) => {
      const top = maxZ(bs) + 1;
      return bs.map((b) => (b.id === id ? { ...b, z: top } : b));
    });
  }
  function select(id: string) {
    setSelectedId(id);
    bringFront(id);
  }

  function createNote(x: number, y: number) {
    const id = uid();
    setBits((bs) => [
      ...bs,
      { id, type: "text", x, y, w: 240, h: 60, z: maxZ(bs) + 1, html: "<p></p>" },
    ]);
    setSelectedId(id);
    setEditingId(id);
  }

  function createImage(src: string, w: number, h: number, x: number, y: number) {
    const id = uid();
    setBits((bs) => [
      ...bs,
      { id, type: "image", x, y, w, h, z: maxZ(bs) + 1, src },
    ]);
    setSelectedId(id);
    setEditingId(null);
  }

  // Pen "Done": bundle the whole session's strokes into ONE doodle bit at their
  // bounding box, storing strokes relative to the bit's top-left (so the bit
  // moves/scales on its own). Empty (Done with nothing drawn) → no bit.
  function finishDoodle(strokes: Stroke[]) {
    setDrawMode(false);
    if (!strokes.length) return;
    const b = strokesBounds(strokes);
    const w = Math.max(1, b.w);
    const h = Math.max(1, b.h);
    const rel = strokes.map((s) =>
      s.map(([px, py, pr]) => [px - b.minX, py - b.minY, pr]),
    );
    const id = uid();
    setBits((bs) => [
      ...bs,
      { id, type: "doodle", x: b.minX, y: b.minY, w, h, z: maxZ(bs) + 1, strokes: rel },
    ]);
    setSelectedId(id);
    setEditingId(null);
  }

  // Read an image file, downscale it (canvas → JPEG), and place it on the board
  // at (x, y) as an aspect-locked image bit. Non-images and read/decode
  // failures are ignored (never throws into the drop handler).
  function importImageFile(file: File, x: number, y: number) {
    if (!file.type.startsWith("image/")) return;
    const reader = new FileReader();
    reader.onerror = () => console.warn("compose: could not read image file");
    reader.onload = () => {
      const img = new Image();
      img.onerror = () => console.warn("compose: could not decode image");
      img.onload = () => {
        const srcScale = Math.min(1, MAX_SRC / Math.max(img.width, img.height));
        const cw = Math.max(1, Math.round(img.width * srcScale));
        const ch = Math.max(1, Math.round(img.height * srcScale));
        const canvas = document.createElement("canvas");
        canvas.width = cw;
        canvas.height = ch;
        const ctx = canvas.getContext("2d");
        if (!ctx) return;
        ctx.drawImage(img, 0, 0, cw, ch);
        const src = canvas.toDataURL("image/jpeg", 0.82);
        const dispScale = Math.min(1, MAX_DISP / img.width);
        const w = Math.max(1, Math.round(img.width * dispScale));
        const h = Math.max(1, Math.round(img.height * dispScale));
        createImage(src, w, h, x, y);
      };
      img.src = reader.result as string;
    };
    reader.readAsDataURL(file);
  }

  function onBoardDrop(e: React.DragEvent) {
    e.preventDefault();
    const r = boardRef.current?.getBoundingClientRect();
    const file = e.dataTransfer.files?.[0];
    if (r && file) importImageFile(file, e.clientX - r.left, e.clientY - r.top);
  }

  function onPickImage(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (file) importImageFile(file, 60, 120);
    e.target.value = ""; // allow re-picking the same file
  }

  function onBoardPointerDown(e: React.PointerEvent) {
    if (e.target === boardRef.current) {
      setSelectedId(null);
      setEditingId(null);
    }
  }

  // Double-tap / double-click on empty board → create a note there (works on touch + mouse).
  function onBoardPointerUp(e: React.PointerEvent) {
    if (e.target !== boardRef.current) return;
    const r = boardRef.current!.getBoundingClientRect();
    const x = e.clientX - r.left;
    const y = e.clientY - r.top;
    const now = performance.now();
    const prev = lastTap.current;
    if (prev && now - prev.t < 340 && Math.hypot(x - prev.x, y - prev.y) < 28) {
      lastTap.current = null;
      createNote(x, y);
    } else {
      lastTap.current = { t: now, x, y };
    }
  }

  function addNote() {
    const r = boardRef.current?.getBoundingClientRect();
    createNote(r ? Math.max(20, r.width / 2 - 110) : 40, 84);
  }

  return (
    <>
      <div className="compose-toolbar">
        <button className="compose-btn" onClick={addNote}>
          + note
        </button>
        <button className="compose-btn" onClick={() => fileRef.current?.click()}>
          + image
        </button>
        <button className="compose-btn" onClick={() => setDrawMode(true)}>
          ✎ pen
        </button>
        <input
          ref={fileRef}
          type="file"
          accept="image/*"
          hidden
          onChange={onPickImage}
        />
      </div>
      <div
        ref={boardRef}
        className="compose-board"
        onPointerDown={onBoardPointerDown}
        onPointerUp={onBoardPointerUp}
        onDragOver={(e) => e.preventDefault()}
        onDrop={onBoardDrop}
      >
        {bits.length === 0 && (
          <p className="compose-empty">Tap &ldquo;+ note&rdquo;, or double-tap anywhere, to start.</p>
        )}
        {bits.map((b) => (
          <Card
            key={b.id}
            bit={b}
            selected={selectedId === b.id}
            editing={editingId === b.id}
            onSelect={() => select(b.id)}
            onEdit={() => {
              setSelectedId(b.id);
              setEditingId(b.id);
            }}
            onChange={(patch) => update(b.id, patch)}
          />
        ))}
        {drawMode && (
          <DrawOverlay onDone={finishDoodle} onCancel={() => setDrawMode(false)} />
        )}
      </div>
    </>
  );
}
