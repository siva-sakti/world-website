import { useEffect, useRef } from "react";
import type { Dispatch, SetStateAction, RefObject } from "react";
import type { SupabaseClient } from "@supabase/supabase-js";
import {
  createTextBit,
  createDrawingBit,
  createImageBit,
  createAudioBit,
  createPdfBit,
  callInBit,
  abortBitCreate,
} from "@/lib/db/bits";
import { uploadObject, signedUrl, removeObjects } from "@/lib/storage";
import { importImage, isHeic } from "@/lib/media";
import { importAudio } from "@/lib/media-audio";
import { importPdf } from "@/lib/media-pdf";
import { looksLikeUrl } from "@/lib/page-meta";
import { textToParagraphs } from "@/lib/html";
import { captureLink } from "@/app/bits/actions";
import { strokesBounds, normalizeDrawing } from "@/lib/stroke";
import type { Drawing } from "@/lib/types";
import type { PanelBit } from "@/lib/db/inbox";
import type { CardVM } from "./card";
import type { Camera } from "./use-camera";

const MAX_DISP = 320; // an image card's initial on-board width

// The board's CREATE doors — every way a card is born onto the surface, plus the
// board-born bit's lifecycle (evaporate-if-empty). Kept together because they all
// share the same optimistic pattern: paint the card locally, then land the row and
// track its create so later writes wait for it (usePersistence's settled door).
//  · createTextCard / addNote — a blank (or pasted) text bit
//  · finishDoodle — the pen session → one drawing bit
//  · importImageFile / onBoardDrop / onPickImage — an image
//  · bringIn — call a loose bit onto THIS board (insert-or-revive, no dup)
//  · the paste effect (evaporate RETIRED by owner ruling D-138 — empty cards persist)
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
  setDrawMode: Dispatch<SetStateAction<boolean>>;
  nextZ: () => number;
  trackCreate: (placementId: string, p: Promise<unknown>) => void;
  settled: (placementId: string) => Promise<string>;
  reconcileId: (oldId: string, newId: string) => void;
  setConverting: Dispatch<SetStateAction<number>>; // COUNT of HEICs mid-decode (a counter — multi-file drops overlap)
  setCapturing: Dispatch<SetStateAction<boolean>>; // the board-paste link capture is slow (~seconds) — show a notice
  // ENQUEUES a words-offer (hunt #4): a second upload finishing must never replace
  // the prompt the owner is typing in — offers wait their turn in board-surface.
  setWordsFor: (v: { bitId: string; kind: "image" | "drawing" | "audio" | "pdf" | "link" }) => void;
  onErr: (e: unknown) => void;
  sizeOf: (placementId: string) => { w: number; h: number } | null; // the geometry ledger (stage 3)
}) {
  const {
    supabase, boardId, boardRef, screenToWorld, camRef, cards, setCards,
    setSelectedIds, selectOne, setEditingId, setDrawMode, nextZ,
    trackCreate, reconcileId, setConverting, setCapturing, setWordsFor, onErr,
  } = deps;

  const spawnStep = useRef(0); // last-resort cascade when no clear spot is found
  // EVAPORATE RETIRED (owner ruling, 2026-09-01 / D-138): an empty card PERSISTS —
  // "hold a card that's empty; it's the person's responsibility to delete, archive,
  // or type inside it." The old rule (a board-born bit that never held content
  // quietly un-exists on edit-end/unmount) kept deleting cards the owner had just
  // made while they panned or resized. Blank-litter from a stray double-tap is the
  // accepted cost, chosen eyes-open. abortBitCreate remains ONLY as failed-create
  // cleanup — never as content judgment.
  const cardsRef = useRef(cards);
  cardsRef.current = cards; // latest-value ref: the unmount sweep must see live cards, not the []-closure

  // The /write test, board-side: real content = visible text or a gather chip.

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

  function createTextCard(x: number, y: number, opts?: { body?: string; edit?: boolean }) {
    const body = opts?.body ?? "<p></p>";
    const edit = opts?.edit ?? true;
    const bitId = crypto.randomUUID();
    const placementId = crypto.randomUUID();
    const z = nextZ();
    setCards((cs) => [
      ...cs,
      { placementId, bitId, type: "text", kind: "bit", x, y, w: 400, h: 60, z, body },
    ]);
    selectOne(placementId);
    if (edit) setEditingId(placementId);
    const p = createTextBit(supabase, { bitId, placementId, boardId, body, x, y, width: 400, z }).catch((e) => {
      // A failed create must not leave a zombie card (the image/audio/pdf doors already do this;
      // a leftover here also poisons later removes — the "no longer exists" class). Also: end the
      // ghost edit (a stranded editingId deadlocks the keyboard — R1.2) and abort the bit row —
      // createTextBit inserts bit THEN placement, so a placement-side failure would otherwise
      // leave an invisible blank loose bit (0-row delete when the bit insert itself failed: harmless).
      setCards((cs) => cs.filter((c) => c.placementId !== placementId));
      setEditingId((cur) => (cur === placementId ? null : cur));
      abortBitCreate(supabase, bitId).catch(console.error); // must not clobber the original error
      onErr(e);
    });
    trackCreate(placementId, p);
  }

  // First real content → the bit is truly born; it no longer evaporates. The
  // editor's onChange calls this before persisting the patch.

  // The remove acts consult these (R1.3a): a remove/trash on a NEVER-had-content
  // board-born bit must ABORT it (evaporate's contract), not mint a blank loose/

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
      { placementId, bitId, type: "drawing", kind: "bit", x: b.minX, y: b.minY, w, h, z, drawing: relDrawing },
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

  function importImageFile(file: File, wx: number, wy: number, zOverride?: number) {
    const bitId = crypto.randomUUID();
    const placementId = crypto.randomUUID();
    // HEIC decoding takes a few seconds; only then does it show a notice.
    const heic = isHeic(file);
    if (heic) setConverting((n) => n + 1);
    const chain = importImage(file)
      .then(async (img) => {
        const dispScale = Math.min(1, MAX_DISP / img.width);
        const w = Math.max(1, Math.round(img.width * dispScale));
        const h = Math.max(1, Math.round(img.height * dispScale));
        const z = zOverride ?? nextZ();
        const localUrl = URL.createObjectURL(img.blob);
        setCards((cs) => [
          ...cs,
          { placementId, bitId, type: "image", kind: "bit", x: wx, y: wy, w, h, z, imageUrl: localUrl },
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
        // The uploads may have landed before the row insert failed — remove them or
        // they're orphans forever (paths are deterministic from bitId; removing a
        // never-uploaded path is a no-op; cleanup failure must not mask the error).
        removeObjects(supabase, [`images/${bitId}.jpg`, `thumbs/${bitId}.jpg`]).catch(() => {});
        onErr(e);
      })
      .finally(() => {
        if (heic) setConverting((n) => n - 1);
      });
    trackCreate(placementId, chain);
  }

  const AUDIO_W = 300; // an audio card's initial on-board width
  const AUDIO_H = 56; //  the native player's height (flex-sized: h follows the player)
  const AUDIO_FILE = /\.(m4a|mp3|mp4|aac|wav|ogg|oga|opus|webm|flac)$/i;
  const isAudioFile = (f: File) => f.type.startsWith("audio/") || AUDIO_FILE.test(f.name);

  // Voice memo → an audio card. The original bytes are stored as-is (no transform,
  // no thumbnail); the optimistic card plays immediately from a local object URL.
  function importAudioFile(file: File, wx: number, wy: number, zOverride?: number) {
    const bitId = crypto.randomUUID();
    const placementId = crypto.randomUUID();
    const z = zOverride ?? nextZ();
    const localUrl = URL.createObjectURL(file);
    setCards((cs) => [
      ...cs,
      { placementId, bitId, type: "audio", kind: "bit", x: wx, y: wy, w: AUDIO_W, h: AUDIO_H, z, fileUrl: localUrl },
    ]);
    selectOne(placementId);
    const chain = importAudio(file)
      .then(async (audio) => {
        const storagePath = `audio/${bitId}.${audio.ext}`;
        await uploadObject(supabase, { path: storagePath, body: audio.blob, contentType: audio.mime });
        await createAudioBit(supabase, {
          bitId, placementId, boardId, storagePath,
          // duration (seconds, rounded) rides in media_width — audio has no real width
          mediaWidth: audio.durationSec != null ? Math.round(audio.durationSec) : undefined,
          mime: audio.mime, byteSize: audio.byteSize, fileName: audio.fileName,
          x: wx, y: wy, width: AUDIO_W, height: AUDIO_H, z,
        });
        setWordsFor({ bitId, kind: "audio" });
      })
      .catch((e) => {
        setCards((cs) => cs.filter((c) => c.placementId !== placementId));
        // The upload may have landed before the insert failed — sweep every possible
        // extension (the real one lives in the .then's closure; removing absent paths
        // is a no-op).
        removeObjects(
          supabase,
          ["m4a", "mp3", "mp4", "aac", "wav", "ogg", "oga", "opus", "webm", "flac"].map((x) => `audio/${bitId}.${x}`),
        ).catch(() => {});
        onErr(e);
      });
    trackCreate(placementId, chain);
  }

  const PDF_W = 240; // an unrenderable pdf card's default width (portrait sheet)
  const PDF_H = 300; //  ... and height, when there is no page-1 thumbnail to size to
  const isPdfFile = (f: File) => f.type === "application/pdf" || /\.pdf$/i.test(f.name);

  // PDF → a card showing its first page. The original bytes store as-is (for the
  // viewer); a 600px page-1 JPEG stores as the thumbnail (like an image's). The card
  // is added AFTER page 1 renders (so it can size to the page aspect), like the image
  // door. An unrenderable PDF still uploads — a document sheet, no thumbnail.
  function importPdfFile(file: File, wx: number, wy: number, zOverride?: number) {
    const bitId = crypto.randomUUID();
    const placementId = crypto.randomUUID();
    const z = zOverride ?? nextZ();
    const chain = importPdf(file)
      .then(async (pdf) => {
        let w = PDF_W;
        let h = PDF_H;
        let localUrl: string | undefined;
        if (pdf.thumb && pdf.width && pdf.height) {
          const dispScale = Math.min(1, MAX_DISP / pdf.width);
          w = Math.max(1, Math.round(pdf.width * dispScale));
          h = Math.max(1, Math.round(pdf.height * dispScale));
          localUrl = URL.createObjectURL(pdf.thumb);
        }
        setCards((cs) => [
          ...cs,
          { placementId, bitId, type: "pdf", kind: "bit", x: wx, y: wy, w, h, z, imageUrl: localUrl },
        ]);
        selectOne(placementId);
        const storagePath = `pdfs/${bitId}.pdf`;
        const thumbPath = pdf.thumb ? `thumbs/${bitId}.jpg` : undefined;
        // The uploads are independent — the PDF plus (when present) its page-1 thumb.
        const uploads = [
          uploadObject(supabase, { path: storagePath, body: pdf.file, contentType: "application/pdf" }),
        ];
        if (pdf.thumb && thumbPath) {
          uploads.push(uploadObject(supabase, { path: thumbPath, body: pdf.thumb, contentType: "image/jpeg" }));
        }
        await Promise.all(uploads);
        await createPdfBit(supabase, {
          bitId, placementId, boardId, storagePath, thumbPath,
          mediaWidth: pdf.width ?? undefined, mediaHeight: pdf.height ?? undefined,
          mime: pdf.mime, byteSize: pdf.byteSize, fileName: pdf.fileName,
          x: wx, y: wy, width: w, height: h, z,
        });
        setWordsFor({ bitId, kind: "pdf" });
      })
      .catch((e) => {
        setCards((cs) => cs.filter((c) => c.placementId !== placementId));
        removeObjects(supabase, [`pdfs/${bitId}.pdf`, `thumbs/${bitId}.jpg`]).catch(() => {}); // orphan sweep
        onErr(e);
      });
    trackCreate(placementId, chain);
  }

  // Route a dropped/pasted file to the right door (audio → recording, pdf → PDF,
  // else image).
  function placeDroppedFile(file: File, wx: number, wy: number, zOverride?: number) {
    if (isAudioFile(file)) importAudioFile(file, wx, wy, zOverride);
    else if (isPdfFile(file)) importPdfFile(file, wx, wy, zOverride);
    else importImageFile(file, wx, wy, zOverride);
  }

  // Every file in a batch lands (the single-file `files[0]` silently discarded the
  // rest — the review's confirmed gap): caller-computed cascade offsets so they don't
  // stack, and one z base + i so a same-tick batch never z-ties (nextZ reads the same
  // stale render array for every file in a sync loop).
  function placeFiles(files: File[], atX: number, atY: number) {
    const z0 = nextZ();
    files.forEach((f, i) => placeDroppedFile(f, atX + i * 36, atY + i * 28, z0 + i));
  }

  function onBoardDrop(e: React.DragEvent) {
    e.preventDefault();
    const files = Array.from(e.dataTransfer.files ?? []);
    if (!files.length) return;
    const w = screenToWorld(e.clientX, e.clientY);
    placeFiles(files, w.x, w.y);
  }

  function onPickImage(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files ?? []);
    if (files.length) {
      const p = findClearSpot(320, 260); // dims unknown until decode — a sensible estimate
      const z0 = nextZ();
      files.forEach((f, i) => importImageFile(f, p.x + i * 36, p.y + i * 28, z0 + i));
    }
    e.target.value = "";
  }

  function onPickAudio(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files ?? []);
    if (files.length) {
      const p = findClearSpot(AUDIO_W, 90);
      const z0 = nextZ();
      files.forEach((f, i) => importAudioFile(f, p.x + i * 36, p.y + i * 28, z0 + i));
    }
    e.target.value = "";
  }

  function onPickPdf(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files ?? []);
    if (files.length) {
      const p = findClearSpot(PDF_W, PDF_H); // real dims arrive after page-1 render
      const z0 = nextZ();
      files.forEach((f, i) => importPdfFile(f, p.x + i * 36, p.y + i * 28, z0 + i));
    }
    e.target.value = "";
  }

  // Paste onto the board: an image → an image card; TEXT → a bit holding it
  // (plan v1.1-D — one paste, one bit, no cleverness). Never while an editor or
  // input has focus: those own their own paste.
  useEffect(() => {
    function onPaste(e: ClipboardEvent) {
      const t = e.target as HTMLElement | null;
      if (t && (t.isContentEditable || t.tagName === "INPUT" || t.tagName === "TEXTAREA")) return;
      const all = Array.from(e.clipboardData?.files ?? []);
      const media = all.filter((f) => f.type.startsWith("image/") || isAudioFile(f) || isPdfFile(f));
      if (media.length) {
        const p = findClearSpot(320, 260);
        placeFiles(media, p.x, p.y);
        if (media.length < all.length) {
          onErr(new Error(`${all.length - media.length} pasted file(s) weren't images, recordings, or PDFs — skipped.`));
        }
        return;
      }
      const text = e.clipboardData?.getData("text/plain") ?? "";
      if (!text.trim()) return;
      // A BARE URL → a link bit (link-bit-plan: "what you give is what it becomes") —
      // captured server-side (read-once title + card image), then placed in view via
      // the normal call-in path. Words with it → an ordinary text bit, as ever.
      if (looksLikeUrl(text)) {
        void captureLinkToBoard(text.trim());
        return;
      }
      const html = textToParagraphs(text);
      const p = findClearSpot(400, 160);
      createTextCard(p.x, p.y, { body: html, edit: false }); // select it, but don't grab the keyboard
    }
    window.addEventListener("paste", onPaste);
    return () => window.removeEventListener("paste", onPaste);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- re-bind on cards so findClearSpot sees live positions
  }, [cards]);

  function addNote() {
    const p = findClearSpot(400, 140);
    createTextCard(p.x, p.y);
  }

  // The board-paste link door: capture server-side (slow — the notice covers the wait),
  // then place the fresh loose bit right here via bringIn, and offer the caption.
  async function captureLinkToBoard(raw: string) {
    setCapturing(true);
    try {
      const res = await captureLink(raw);
      if (!res.bit) {
        onErr(new Error(res.error ?? "Couldn't capture that link."));
        return;
      }
      await bringIn({ ...res.bit, source: null, tags: [], boards: [] });
      setWordsFor({ bitId: res.bit.id, kind: "link" });
    } catch (e) {
      onErr(e);
    } finally {
      setCapturing(false);
    }
  }

  // Call-in: bring a loose bit onto THIS board, where you're looking. Optimistic like
  // createTextCard; callInBit inserts-or-revives and returns the TRUE placement, so we
  // reconcile the card's id when the server revived a departed row (plan §5.4, finding 1).
  async function bringIn(bit: PanelBit) {
    const type = bit.type;
    if (type !== "text" && type !== "drawing" && type !== "image" && type !== "audio" && type !== "pdf" && type !== "link") return;
    const isNote = bit.kind === "note"; // a note lands page-shaped (a doorway), not receipt-shaped
    const width = isNote ? 200 : type === "text" ? 400 : type === "audio" ? AUDIO_W : 220;
    const height = isNote ? 260 : type === "text" ? 60 : type === "audio" ? AUDIO_H : type === "pdf" ? 280 : type === "link" ? 180 : 220;
    // Look-then-place, like every non-deliberate spawn (the old 6-step cascade
    // cycled — the 7th landed exactly on the 1st). Text rendered-height estimate;
    // a note has a real fixed height, so use it directly.
    const w = findClearSpot(width, isNote ? height : type === "text" ? 120 : height);
    const placementId = crypto.randomUUID();
    const z = nextZ();
    // File types resolve a signed URL: image → thumb/full (imageUrl), audio → its
    // stored object (fileUrl, for the player). Without this the placed card is blank.
    let imageUrl: string | undefined;
    let fileUrl: string | undefined;
    if (type === "image") {
      const path = bit.thumb_path ?? bit.storage_path;
      if (path) {
        try { imageUrl = await signedUrl(supabase, path); } catch {}
      }
    } else if (type === "audio" && bit.storage_path) {
      try { fileUrl = await signedUrl(supabase, bit.storage_path); } catch {}
    } else if (type === "pdf" && bit.thumb_path) {
      // A PDF shows its first-page thumbnail (thumb_path only — the storage_path is
      // the PDF binary, not an image). No thumb → the card's document-sheet fallback.
      try { imageUrl = await signedUrl(supabase, bit.thumb_path); } catch {}
    } else if (type === "link" && bit.thumb_path) {
      // A link shows its stored page-card image; no thumb → the title/URL card.
      try { imageUrl = await signedUrl(supabase, bit.thumb_path); } catch {}
    }
    setCards((cs) => [
      ...cs,
      {
        placementId, bitId: bit.id, type, kind: bit.kind,
        x: w.x, y: w.y, w: width, h: height, z,
        body: bit.body ?? undefined,
        drawing: type === "drawing" ? normalizeDrawing(bit.strokes) : undefined,
        imageUrl,
        fileUrl,
        content: bit.content ?? undefined,
        url: type === "link" ? (bit.url ?? undefined) : undefined,
        label: type === "link" ? (bit.face ?? undefined) : undefined,
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
          // The keyboard's owner must follow the rename too (hunt #10): a stranded
          // editingId points at a dead id — the keyed Card remounts un-editing while
          // useBoardKeys still thinks an editor owns the keys → Delete/arrows dead.
          setEditingId((cur) => (cur === placementId ? placement.id : cur));
        }
      })
      .catch((e) => {
        setCards((cs) => cs.filter((c) => c.placementId !== placementId));
        setSelectedIds((prev) => { if (!prev.has(placementId)) return prev; const nx = new Set(prev); nx.delete(placementId); return nx; });
        onErr(e);
        throw e; // let the column restore the bit to the pile
      });
    trackCreate(placementId, p);
    return p;
  }

  return { addNote, createTextCard, finishDoodle, onBoardDrop, onPickImage, onPickAudio, onPickPdf, bringIn };
}
