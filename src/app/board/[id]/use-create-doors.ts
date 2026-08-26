import { useEffect, useRef } from "react";
import type { Dispatch, SetStateAction, RefObject } from "react";
import type { SupabaseClient } from "@supabase/supabase-js";
import {
  createTextBit,
  createDrawingBit,
  createImageBit,
  callInBit,
  abortBitCreate,
} from "@/lib/db/bits";
import { uploadObject, signedUrl } from "@/lib/storage";
import { importImage, isHeic } from "@/lib/media";
import { strokesBounds, normalizeDrawing } from "@/lib/stroke";
import type { Drawing } from "@/lib/types";
import type { PanelBit } from "@/lib/db/inbox";
import type { CardVM } from "./card";
import type { Camera } from "./use-camera";

const MAX_DISP = 320; // an image card's initial on-board width

// The board's CREATE doors — every way a card is born onto the surface, plus the
// board-born note's lifecycle (evaporate-if-empty). Kept together because they all
// share the same optimistic pattern: paint the card locally, then land the row and
// track its create so later writes wait for it (usePersistence's settled door).
//  · createNote / addNote — a blank (or pasted) note
//  · finishDoodle — the pen session → one drawing bit
//  · importImageFile / onBoardDrop / onPickImage — an image
//  · bringIn — call a loose bit onto THIS board (insert-or-revive, no dup)
//  · the paste + evaporate effects, and markContentIfReal for the editor's onChange
export function useCreateDoors(deps: {
  supabase: SupabaseClient;
  boardId: string;
  boardRef: RefObject<HTMLDivElement | null>;
  screenToWorld: (clientX: number, clientY: number) => { x: number; y: number };
  camRef: RefObject<Camera>;
  cards: CardVM[];
  setCards: Dispatch<SetStateAction<CardVM[]>>;
  setSelectedIds: Dispatch<SetStateAction<Set<string>>>;
  selectOne: (id: string) => void;
  setEditingId: Dispatch<SetStateAction<string | null>>;
  editingId: string | null;
  setDrawMode: Dispatch<SetStateAction<boolean>>;
  nextZ: () => number;
  trackCreate: (placementId: string, p: Promise<unknown>) => void;
  settled: (placementId: string) => Promise<string>;
  reconcileId: (oldId: string, newId: string) => void;
  setConverting: Dispatch<SetStateAction<boolean>>;
  setWordsFor: Dispatch<SetStateAction<{ bitId: string; kind: "image" | "drawing" } | null>>;
  onErr: (e: unknown) => void;
}) {
  const {
    supabase, boardId, boardRef, screenToWorld, camRef, cards, setCards,
    setSelectedIds, selectOne, setEditingId, editingId, setDrawMode, nextZ,
    trackCreate, settled, reconcileId, setConverting, setWordsFor, onErr,
  } = deps;

  const spawnStep = useRef(0); // last-resort cascade when no clear spot is found
  const freshEmpty = useRef(new Set<string>()); // board-born notes that never held content (evaporate on edit-end)
  const prevEditing = useRef<string | null>(null);

  // The /write test, board-side: real content = visible text or a gather chip.
  function hasRealContent(html: string): boolean {
    return html.replace(/<[^>]+>/g, "").trim() !== "" || html.includes("data-ref");
  }
  function escapeHtml(s: string): string {
    return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&#39;");
  }

  // Look-then-place (plan v1.1): start at the natural spot, hit-test the candidate
  // against every card on the board, step down-right until clear — preferring a
  // spot fully IN VIEW (a new thing must never seem to not-appear). Text heights
  // in state are stale by design (height:auto), so measure the rendered card via
  // data-pid and fall back to state. Deterministic; last resort = plain cascade.
  function findClearSpot(w0: number, h0: number): { x: number; y: number } {
    const r = boardRef.current?.getBoundingClientRect();
    if (!r) {
      const s = (spawnStep.current++ % 8) * 28;
      return { x: 40 + s, y: 84 + s };
    }
    const anchor = screenToWorld(r.left + r.width / 2, r.top + Math.min(200, r.height / 2));
    const tl = screenToWorld(r.left, r.top);
    const br = screenToWorld(r.left + r.width, r.top + r.height);
    const rects = cards.map((c) => {
      const el = c.type === "text" ? document.querySelector(`[data-pid="${c.placementId}"]`) : null;
      return { x: c.x, y: c.y, w: c.w, h: el instanceof HTMLElement ? el.offsetHeight : c.h };
    });
    const MARGIN = 12;
    const start = { x: anchor.x - w0 / 2, y: anchor.y };
    let firstClear: { x: number; y: number } | null = null;
    for (let i = 0; i < 24; i++) {
      const x = start.x + i * 36;
      const y = start.y + i * 36;
      const taken = rects.some(
        (q) => x < q.x + q.w + MARGIN && x + w0 + MARGIN > q.x && y < q.y + q.h + MARGIN && y + h0 + MARGIN > q.y,
      );
      if (taken) continue;
      if (x >= tl.x && y >= tl.y && x + w0 <= br.x && y + h0 <= br.y) return { x, y }; // clear AND visible
      if (!firstClear) firstClear = { x, y };
    }
    if (firstClear) return firstClear;
    const s = (spawnStep.current++ % 8) * 28;
    return { x: start.x + s, y: start.y + s };
  }

  function createNote(x: number, y: number, opts?: { body?: string; edit?: boolean }) {
    const body = opts?.body ?? "<p></p>";
    const edit = opts?.edit ?? true;
    const bitId = crypto.randomUUID();
    const placementId = crypto.randomUUID();
    const z = nextZ();
    setCards((cs) => [
      ...cs,
      { placementId, bitId, type: "text", x, y, w: 400, h: 60, z, body },
    ]);
    selectOne(placementId);
    if (edit) setEditingId(placementId);
    if (!hasRealContent(body)) freshEmpty.current.add(placementId); // evaporates if it stays empty
    const p = createTextBit(supabase, { bitId, placementId, boardId, body, x, y, width: 400, z }).catch(onErr);
    trackCreate(placementId, p);
  }

  // Evaporate (plan v1.1-A): a board-born note whose edit ends with still-no-real-
  // content quietly un-exists — no blank-note litter from a stray double-tap. Once
  // it has ever held content it stays (matches /write's born-on-first-content).
  // Through the settled door: the create may still be in flight.
  useEffect(() => {
    const prev = prevEditing.current;
    if (prev === editingId) return;
    prevEditing.current = editingId;
    if (!prev || !freshEmpty.current.has(prev)) return;
    freshEmpty.current.delete(prev);
    const c = cards.find((x) => x.placementId === prev);
    if (!c || hasRealContent(c.body ?? "")) return;
    setCards((cs) => cs.filter((x) => x.placementId !== prev));
    setSelectedIds((s) => {
      if (!s.has(prev)) return s;
      const nx = new Set(s);
      nx.delete(prev);
      return nx;
    });
    settled(prev)
      .then(() => abortBitCreate(supabase, c.bitId))
      .catch(onErr);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- fires on edit-end only; guarded against re-entry
  }, [editingId, cards]);

  // First real content → the note is truly born; it no longer evaporates. The
  // editor's onChange calls this before persisting the patch.
  function markContentIfReal(placementId: string, body: string | undefined) {
    if (body !== undefined && freshEmpty.current.has(placementId) && hasRealContent(body))
      freshEmpty.current.delete(placementId);
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
    selectOne(placementId);
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
        selectOne(placementId);
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
      const p = findClearSpot(320, 260); // dims unknown until decode — a sensible estimate
      importImageFile(file, p.x, p.y);
    }
    e.target.value = "";
  }

  // Paste onto the board: an image → an image card; TEXT → a note holding it
  // (plan v1.1-D — one paste, one note, no cleverness). Never while an editor or
  // input has focus: those own their own paste.
  useEffect(() => {
    function onPaste(e: ClipboardEvent) {
      const t = e.target as HTMLElement | null;
      if (t && (t.isContentEditable || t.tagName === "INPUT" || t.tagName === "TEXTAREA")) return;
      const file = Array.from(e.clipboardData?.files ?? []).find((f) => f.type.startsWith("image/"));
      if (file) {
        const p = findClearSpot(320, 260);
        importImageFile(file, p.x, p.y);
        return;
      }
      const text = e.clipboardData?.getData("text/plain") ?? "";
      if (!text.trim()) return;
      const html = text.split(/\r?\n/).map((ln) => `<p>${escapeHtml(ln)}</p>`).join("");
      const p = findClearSpot(400, 160);
      createNote(p.x, p.y, { body: html, edit: false }); // select it, but don't grab the keyboard
    }
    window.addEventListener("paste", onPaste);
    return () => window.removeEventListener("paste", onPaste);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- re-bind on cards so findClearSpot sees live positions
  }, [cards]);

  function addNote() {
    const p = findClearSpot(400, 140);
    createNote(p.x, p.y);
  }

  // Call-in: bring a loose note onto THIS board, where you're looking. Optimistic like
  // createNote; callInBit inserts-or-revives and returns the TRUE placement, so we
  // reconcile the card's id when the server revived a departed row (plan §5.4, finding 1).
  async function bringIn(bit: PanelBit) {
    const type = bit.type;
    if (type !== "text" && type !== "drawing" && type !== "image") return;
    const width = type === "text" ? 400 : 220;
    const height = type === "text" ? 60 : 220;
    // Look-then-place, like every non-deliberate spawn (the old 6-step cascade
    // cycled — the 7th landed exactly on the 1st). Text rendered-height estimate.
    const w = findClearSpot(width, type === "text" ? 120 : height);
    const placementId = crypto.randomUUID();
    const z = nextZ();
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
    selectOne(placementId);
    const p = callInBit(supabase, { bitId: bit.id, boardId, placementId, x: w.x, y: w.y, width, height, z })
      .then((placement) => {
        if (placement.id !== placementId) {
          reconcileId(placementId, placement.id);
          // If a card already renders under the real id (the bit was ALREADY live
          // here — a stale column), drop the optimistic twin instead of renaming:
          // two cards must never share a placement id.
          setCards((cs) =>
            cs.some((c) => c.placementId === placement.id)
              ? cs.filter((c) => c.placementId !== placementId)
              : cs.map((c) => (c.placementId === placementId ? { ...c, placementId: placement.id } : c)),
          );
          setSelectedIds((prev) => { if (!prev.has(placementId)) return prev; const nx = new Set(prev); nx.delete(placementId); nx.add(placement.id); return nx; });
        }
      })
      .catch((e) => {
        setCards((cs) => cs.filter((c) => c.placementId !== placementId));
        setSelectedIds((prev) => { if (!prev.has(placementId)) return prev; const nx = new Set(prev); nx.delete(placementId); return nx; });
        onErr(e);
        throw e; // let the column restore the note to the pile
      });
    trackCreate(placementId, p);
    return p;
  }

  return { addNote, createNote, finishDoodle, onBoardDrop, onPickImage, bringIn, markContentIfReal };
}
