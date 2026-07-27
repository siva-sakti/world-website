"use client";

import { useEffect, useRef, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import {
  createTextBit,
  createDrawingBit,
  createImageBit,
  updateBitContent,
  unplaceBit,
  trashBit,
  callInBit,
} from "@/lib/db/bits";
import { uploadObject, signedUrl } from "@/lib/storage";
import { importImage, isHeic, MediaError } from "@/lib/media";
import { strokesBounds, normalizeDrawing } from "@/lib/stroke";
import type { Drawing } from "@/lib/types";
import type { InboxItem } from "@/lib/db/inbox";
import { Card, type CardVM } from "./card";
import { DrawOverlay } from "./draw-overlay";
import { TagBar } from "./tag-bar";
import { WordsOffer } from "./words-offer";
import { LooseColumn } from "./loose-column";
import { usePersistence } from "./use-persistence";

const MAX_DISP = 320; // an image card's initial on-board width
const MIN_ZOOM = 0.2;
const MAX_ZOOM = 3;

type Camera = { x: number; y: number; scale: number };

// The board's compose surface, on real data, on an infinite canvas. Local state
// drives the canvas for a snappy feel; every change mirrors to the database
// (debounced) through the one door. A camera (pan + zoom) sits over an endless
// world of cards — drag empty space to pan, scroll to zoom. Card coordinates are
// world-space; creation/pen map screen → world so things land where you point.
export function BoardSurface({
  boardId,
  initialCards,
}: {
  boardId: string;
  initialCards: CardVM[];
}) {
  const [cards, setCards] = useState<CardVM[]>(initialCards);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [drawMode, setDrawMode] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [converting, setConverting] = useState(false); // HEIC decode is slow — tell the user
  const [wordsFor, setWordsFor] = useState<{ bitId: string; kind: "image" | "drawing" } | null>(null);
  const [looseRefresh, setLooseRefresh] = useState(0); // bump → the loose column reloads
  const [cam, setCam] = useState<Camera>({ x: 0, y: 0, scale: 1 });
  const camRef = useRef(cam);
  camRef.current = cam; // latest camera for imperative reads (wheel, pen)

  const boardRef = useRef<HTMLDivElement>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const lastTap = useRef<{ t: number; x: number; y: number } | null>(null);
  const bringInStep = useRef(0); // small cascade so repeated bring-ins don't stack
  const pan = useRef<{ sx: number; sy: number; cx: number; cy: number; moved: boolean } | null>(null);
  const [supabase] = useState(() => createClient());

  function onErr(e: unknown) {
    console.error("board save failed:", e);
    setError(
      e instanceof MediaError
        ? e.message
        : "Couldn't save that — check your connection. Your work is still here.",
    );
  }

  // Debounced persistence through the one door (moves/edits coalesced; a move
  // waits for its card's create to land before writing).
  const { patchCard, saveContent, trackCreate, reconcileId } = usePersistence(supabase, setCards, onErr);

  // ---- camera ----
  function screenToWorld(clientX: number, clientY: number) {
    const r = boardRef.current!.getBoundingClientRect();
    const c = camRef.current;
    return { x: (clientX - r.left - c.x) / c.scale, y: (clientY - r.top - c.y) / c.scale };
  }

  // Zoom toward the cursor (native listener so we can preventDefault the scroll).
  useEffect(() => {
    const el = boardRef.current;
    if (!el) return;
    function onWheel(e: WheelEvent) {
      e.preventDefault();
      const r = el!.getBoundingClientRect();
      const px = e.clientX - r.left;
      const py = e.clientY - r.top;
      setCam((c) => {
        const scale = Math.min(MAX_ZOOM, Math.max(MIN_ZOOM, c.scale * Math.exp(-e.deltaY * 0.0015)));
        const k = scale / c.scale;
        return { scale, x: px - (px - c.x) * k, y: py - (py - c.y) * k };
      });
    }
    el.addEventListener("wheel", onWheel, { passive: false });
    return () => el.removeEventListener("wheel", onWheel);
  }, []);

  // Frame every card in view — the "where am I?" rescue on an endless canvas.
  // No cards → home to the origin. Never magnifies past 100%.
  function fitView() {
    const el = boardRef.current;
    if (!el) return;
    const r = el.getBoundingClientRect();
    if (!cards.length) {
      setCam({ x: 0, y: 0, scale: 1 });
      return;
    }
    let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
    for (const c of cards) {
      minX = Math.min(minX, c.x);
      minY = Math.min(minY, c.y);
      maxX = Math.max(maxX, c.x + c.w);
      maxY = Math.max(maxY, c.y + c.h);
    }
    const bw = Math.max(1, maxX - minX);
    const bh = Math.max(1, maxY - minY);
    const pad = 80;
    const scale = Math.max(MIN_ZOOM, Math.min(1, (r.width - pad) / bw, (r.height - pad) / bh));
    const cx = minX + bw / 2;
    const cy = minY + bh / 2;
    setCam({ x: r.width / 2 - cx * scale, y: r.height / 2 - cy * scale, scale });
  }

  // On open, frame the board's content so you never land on blank canvas.
  useEffect(() => {
    if (initialCards.length) fitView();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function nextZ() {
    return cards.reduce((m, c) => Math.max(m, c.z), 0) + 1;
  }

  function select(placementId: string, bitId: string) {
    setSelectedId(placementId);
    patchCard(placementId, bitId, { z: nextZ() });
  }

  // ---- create ----
  function createNote(x: number, y: number) {
    const bitId = crypto.randomUUID();
    const placementId = crypto.randomUUID();
    const z = nextZ();
    setCards((cs) => [
      ...cs,
      { placementId, bitId, type: "text", x, y, w: 240, h: 60, z, body: "<p></p>" },
    ]);
    setSelectedId(placementId);
    setEditingId(placementId);
    const p = createTextBit(supabase, { bitId, placementId, boardId, body: "<p></p>", x, y, width: 240, z }).catch(onErr);
    trackCreate(placementId, p);
  }

  // Pen "Done": convert the session's strokes (screen space) into world space,
  // bundle into ONE drawing bit at their bounding box (widths kept). Empty → nothing.
  function finishDoodle(drawing: Drawing) {
    setDrawMode(false);
    if (!drawing.strokes.length) return;
    const c = camRef.current;
    const world = drawing.strokes.map((s) =>
      s.map(([px, py, pr]) => [(px - c.x) / c.scale, (py - c.y) / c.scale, pr]),
    );
    const b = strokesBounds(world);
    const w = Math.max(1, b.w);
    const h = Math.max(1, b.h);
    const rel = world.map((s) => s.map(([px, py, pr]) => [px - b.minX, py - b.minY, pr]));
    const relDrawing: Drawing = { strokes: rel, sizes: drawing.sizes, colors: drawing.colors };
    const bitId = crypto.randomUUID();
    const placementId = crypto.randomUUID();
    const z = nextZ();
    setCards((cs) => [
      ...cs,
      { placementId, bitId, type: "drawing", x: b.minX, y: b.minY, w, h, z, drawing: relDrawing },
    ]);
    setSelectedId(placementId);
    const p = createDrawingBit(supabase, {
      bitId, placementId, boardId, drawing: relDrawing,
      x: b.minX, y: b.minY, width: w, height: h, z,
    })
      .then(() => setWordsFor({ bitId, kind: "drawing" }))
      .catch(onErr);
    trackCreate(placementId, p);
  }

  function importImageFile(file: File, wx: number, wy: number) {
    const bitId = crypto.randomUUID();
    const placementId = crypto.randomUUID();
    // HEIC decoding takes a few seconds; only then does it show a notice.
    const heic = isHeic(file);
    if (heic) setConverting(true);
    const chain = importImage(file)
      .then(async (img) => {
        const dispScale = Math.min(1, MAX_DISP / img.width);
        const w = Math.max(1, Math.round(img.width * dispScale));
        const h = Math.max(1, Math.round(img.height * dispScale));
        const z = nextZ();
        const localUrl = URL.createObjectURL(img.blob);
        setCards((cs) => [
          ...cs,
          { placementId, bitId, type: "image", x: wx, y: wy, w, h, z, imageUrl: localUrl },
        ]);
        setSelectedId(placementId);
        const storagePath = `images/${bitId}.jpg`;
        const thumbPath = `thumbs/${bitId}.jpg`;
        // The two uploads are independent — send them together, not one-then-two.
        await Promise.all([
          uploadObject(supabase, { path: storagePath, body: img.blob, contentType: "image/jpeg" }),
          uploadObject(supabase, { path: thumbPath, body: img.thumb, contentType: "image/jpeg" }),
        ]);
        await createImageBit(supabase, {
          bitId, placementId, boardId, storagePath, thumbPath,
          mediaWidth: img.width, mediaHeight: img.height,
          mime: "image/jpeg", byteSize: img.blob.size, fileName: file.name,
          x: wx, y: wy, width: w, height: h, z,
        });
        setWordsFor({ bitId, kind: "image" });
      })
      .catch((e) => {
        setCards((cs) => cs.filter((c) => c.placementId !== placementId));
        onErr(e);
      })
      .finally(() => {
        if (heic) setConverting(false);
      });
    trackCreate(placementId, chain);
  }

  function onBoardDrop(e: React.DragEvent) {
    e.preventDefault();
    const file = e.dataTransfer.files?.[0];
    if (file) {
      const w = screenToWorld(e.clientX, e.clientY);
      importImageFile(file, w.x, w.y);
    }
  }

  function onPickImage(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (file) {
      const r = boardRef.current!.getBoundingClientRect();
      const w = screenToWorld(r.left + 80, r.top + 120);
      importImageFile(file, w.x, w.y);
    }
    e.target.value = "";
  }

  useEffect(() => {
    function onPaste(e: ClipboardEvent) {
      const file = Array.from(e.clipboardData?.files ?? []).find((f) => f.type.startsWith("image/"));
      if (file) {
        const r = boardRef.current!.getBoundingClientRect();
        const w = screenToWorld(r.left + 100, r.top + 140);
        importImageFile(file, w.x, w.y);
      }
    }
    window.addEventListener("paste", onPaste);
    return () => window.removeEventListener("paste", onPaste);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cards.length]);

  // ---- pan + tap on empty space ----
  function onBoardPointerDown(e: React.PointerEvent) {
    if (e.target !== boardRef.current) return; // empty space only (cards handle their own)
    pan.current = { sx: e.clientX, sy: e.clientY, cx: cam.x, cy: cam.y, moved: false };
    setSelectedId(null);
    setEditingId(null);
  }

  function onBoardPointerMove(e: React.PointerEvent) {
    const p = pan.current;
    if (!p) return;
    const dx = e.clientX - p.sx;
    const dy = e.clientY - p.sy;
    if (!p.moved && Math.hypot(dx, dy) < 4) return;
    p.moved = true;
    setCam((c) => ({ ...c, x: p.cx + dx, y: p.cy + dy }));
  }

  function onBoardPointerUp(e: React.PointerEvent) {
    const p = pan.current;
    pan.current = null;
    if (!p || p.moved) return; // a pan, not a tap
    const w = screenToWorld(e.clientX, e.clientY);
    const now = performance.now();
    const prev = lastTap.current;
    if (prev && now - prev.t < 340 && Math.hypot(w.x - prev.x, w.y - prev.y) < 28 / cam.scale) {
      lastTap.current = null;
      createNote(w.x, w.y);
    } else {
      lastTap.current = { t: now, x: w.x, y: w.y };
    }
  }

  // ---- remove (I-W1: two distinct, labeled acts) ----
  function clearCard(placementId: string) {
    setCards((cs) => cs.filter((c) => c.placementId !== placementId));
    setSelectedId(null);
    setEditingId(null);
  }
  // Take the card off THIS board only; the bit lives on (its travel keeps the leg).
  function unplaceSelected(placementId: string) {
    clearCard(placementId);
    unplaceBit(supabase, placementId).catch(onErr);
    setLooseRefresh((n) => n + 1); // it's loose again — let the column show it
  }
  // Trash the whole bit — hidden everywhere, restorable from /trash.
  function trashSelected(bitId: string) {
    setCards((cs) => cs.filter((c) => c.bitId !== bitId));
    setSelectedId(null);
    setEditingId(null);
    trashBit(supabase, bitId).catch(onErr);
  }

  function addNote() {
    const r = boardRef.current?.getBoundingClientRect();
    const w = r
      ? screenToWorld(r.left + r.width / 2, r.top + Math.min(160, r.height / 2))
      : { x: 40, y: 84 };
    createNote(w.x, w.y);
  }

  // Call-in: bring a loose note onto THIS board, where you're looking. Optimistic like
  // createNote; callInBit inserts-or-revives and returns the TRUE placement, so we
  // reconcile the card's id when the server revived a departed row (plan §5.4, finding 1).
  async function bringIn(bit: InboxItem) {
    const type = bit.type;
    if (type !== "text" && type !== "drawing" && type !== "image") return;
    const step = (bringInStep.current++ % 6) * 24;
    const r = boardRef.current?.getBoundingClientRect();
    const w = r
      ? screenToWorld(r.left + r.width / 2 + step, r.top + Math.min(200, r.height / 2) + step)
      : { x: 40 + step, y: 84 + step };
    const placementId = crypto.randomUUID();
    const z = nextZ();
    const width = type === "text" ? 240 : 220;
    const height = type === "text" ? 60 : 220;
    let imageUrl: string | undefined;
    if (type === "image") {
      const path = bit.thumb_path ?? bit.storage_path;
      if (path) {
        try { imageUrl = await signedUrl(supabase, path); } catch {}
      }
    }
    setCards((cs) => [
      ...cs,
      {
        placementId, bitId: bit.id, type,
        x: w.x, y: w.y, w: width, h: height, z,
        body: bit.body ?? undefined,
        drawing: type === "drawing" ? normalizeDrawing(bit.strokes) : undefined,
        imageUrl,
        content: bit.content ?? undefined,
        sourceName: bit.source?.name ?? undefined,
        sourceUrl: bit.source?.url ?? undefined,
      },
    ]);
    setSelectedId(placementId);
    const p = callInBit(supabase, { bitId: bit.id, boardId, placementId, x: w.x, y: w.y, width, height, z })
      .then((placement) => {
        if (placement.id !== placementId) {
          setCards((cs) =>
            cs.map((c) => (c.placementId === placementId ? { ...c, placementId: placement.id } : c)),
          );
          setSelectedId((s) => (s === placementId ? placement.id : s));
          reconcileId(placementId, placement.id);
        }
      })
      .catch((e) => {
        setCards((cs) => cs.filter((c) => c.placementId !== placementId));
        setSelectedId((s) => (s === placementId ? null : s));
        onErr(e);
        throw e; // let the column restore the note to the pile
      });
    trackCreate(placementId, p);
    return p;
  }

  const selectedBit = cards.find((c) => c.placementId === selectedId);

  return (
    <>
      <div className="compose-toolbar">
        <button className="compose-btn" onClick={addNote}>+ note</button>
        <button className="compose-btn" onClick={() => fileRef.current?.click()}>+ image</button>
        <button className="compose-btn" onClick={() => setDrawMode(true)}>✎ pen</button>
        <span className="compose-zoom">
          <button className="compose-btn" onClick={fitView} title="Bring all your cards into view">
            ⊹ fit
          </button>
          <span className="compose-zoom-pct" title="current zoom">
            {Math.round(cam.scale * 100)}%
          </span>
        </span>
        <input ref={fileRef} type="file" accept="image/*" hidden onChange={onPickImage} />
        {error && (
          <span className="text-sm text-red-700">
            {error} <button className="underline" onClick={() => setError(null)}>ok</button>
          </span>
        )}
      </div>
      <div className="compose-stage">
      {selectedBit && (
        <div className="selected-bar">
          <TagBar key={selectedBit.bitId} target={{ bitId: selectedBit.bitId }} />
          <div className="selected-actions">
            <button
              className="compose-btn subtle"
              onClick={() => unplaceSelected(selectedBit.placementId)}
              title="Take this card off this board — the note itself stays in your collection"
            >
              remove from board
            </button>
            <button
              className="compose-btn subtle"
              onClick={() => trashSelected(selectedBit.bitId)}
              title="Move this note to the trash — hidden everywhere, restorable"
            >
              trash
            </button>
          </div>
        </div>
      )}
      <div
        ref={boardRef}
        className={`compose-board${pan.current ? " is-panning" : ""}`}
        onPointerDown={onBoardPointerDown}
        onPointerMove={onBoardPointerMove}
        onPointerUp={onBoardPointerUp}
        onDragOver={(e) => e.preventDefault()}
        onDrop={onBoardDrop}
      >
        {cards.length === 0 && !converting && (
          <p className="compose-empty">Tap &ldquo;+ note&rdquo;, or double-tap anywhere, to start.</p>
        )}
        {converting && (
          <div className="compose-converting" role="status">
            Converting your photo…
            <span>HEICs take a few seconds</span>
          </div>
        )}
        <div
          className="compose-world"
          style={{
            transform: `translate(${cam.x}px, ${cam.y}px) scale(${cam.scale})`,
            transformOrigin: "0 0",
          }}
        >
          {cards.map((c) => (
            <Card
              key={c.placementId}
              card={c}
              selected={selectedId === c.placementId}
              editing={editingId === c.placementId}
              scale={cam.scale}
              offeringWords={wordsFor?.bitId === c.bitId}
              onSelect={() => select(c.placementId, c.bitId)}
              onEdit={() => {
                setSelectedId(c.placementId);
                setEditingId(c.placementId);
              }}
              onChange={(patch) => patchCard(c.placementId, c.bitId, patch)}
              onContentSave={(v) => saveContent(c.placementId, c.bitId, v)}
            />
          ))}
        </div>
        <LooseColumn onBringIn={bringIn} refreshSignal={looseRefresh} />
        {drawMode && <DrawOverlay onDone={finishDoodle} onCancel={() => setDrawMode(false)} />}
        {wordsFor && (
          <WordsOffer
            key={wordsFor.bitId}
            kind={wordsFor.kind}
            onSave={(v) => {
              const card = cards.find((c) => c.bitId === wordsFor.bitId);
              if (card) saveContent(card.placementId, card.bitId, v);
              else updateBitContent(supabase, wordsFor.bitId, v).catch(onErr);
              setWordsFor(null);
            }}
            onSkip={() => setWordsFor(null)}
          />
        )}
      </div>
      </div>
    </>
  );
}
