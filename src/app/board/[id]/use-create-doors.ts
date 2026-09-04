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
import { uploadObject, removeObjects, imagePaths, pdfPaths, audioPath } from "@/lib/storage";
import { importImage, isHeic } from "@/lib/media";
import { importAudio, looksAudio } from "@/lib/media-audio";
import { importPdf, looksPdf } from "@/lib/media-pdf";
import { looksLikeUrl } from "@/lib/page-meta";
import { textToParagraphs } from "@/lib/html";
import { captureLink } from "@/app/bits/actions";
import { strokesBounds, normalizeDrawing } from "@/lib/stroke";
import type { Drawing } from "@/lib/types";
import type { PanelBit } from "@/lib/db/inbox";
import type { CardVM } from "./card-vm";
import { isCardType, isFlexSized } from "./card-vm";
import { defaultCardSize, resolveCardMedia } from "./card-defaults";
import type { Camera } from "./use-camera";
import { firstClearSpot } from "./board-arrange";

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
    trackCreate, reconcileId, setConverting, setCapturing, setWordsFor, onErr, sizeOf,
  } = deps;

  const spawnStep = useRef(0); // last-resort cascade when no clear spot is found
  // EVAPORATE RETIRED (owner ruling, 2026-09-01 / D-138): an empty card PERSISTS —
  // "hold a card that's empty; it's the person's responsibility to delete, archive,
  // or type inside it." The old rule (a board-born bit that never held content
  // quietly un-exists on edit-end/unmount) kept deleting cards the owner had just
  // made while they panned or resized. Blank-litter from a stray double-tap is the
  // accepted cost, chosen eyes-open. abortBitCreate remains ONLY as failed-create
  // cleanup — never as content judgment.


  // Look-then-place (plan v1.1): start at the natural spot, hit-test the candidate
  // against every card on the board, step down-right until clear — preferring a
  // spot fully IN VIEW (a new thing must never seem to not-appear). True sizes come
  // from THE LEDGER (registry stage 3; state fallback where unmeasured) — a NAMED
  // improvement over the old text-only DOM query: audio cards now measure too.
  function findClearSpot(w0: number, h0: number): { x: number; y: number } {
    const r = boardRef.current?.getBoundingClientRect();
    if (!r) {
      // No board rect yet (pre-paint): nothing to hit-test against, so cascade blind.
      const s = (spawnStep.current++ % 8) * 28;
      return { x: 40 + s, y: 84 + s };
    }
    // The IMPURE half stays here — the board's rect, the world transform, and the
    // geometry ledger's true sizes (state fallback where a card is unmeasured). The
    // RULE itself is firstClearSpot in board-arrange, where it is tested.
    const anchor = screenToWorld(r.left + r.width / 2, r.top + Math.min(200, r.height / 2));
    const tl = screenToWorld(r.left, r.top);
    const br = screenToWorld(r.left + r.width, r.top + r.height);
    const taken = cards.map((c) => {
      const m = sizeOf(c.placementId);
      return { x: c.x, y: c.y, w: m?.w ?? c.w, h: m?.h ?? c.h };
    });
    const start = { x: anchor.x - w0 / 2, y: anchor.y };
    const spot = firstClearSpot({ w: w0, h: h0 }, start, taken, {
      minX: tl.x, minY: tl.y, maxX: br.x, maxY: br.y,
    });
    if (spot) return spot;
    // Nothing clear in 24 steps — the last-resort cascade, so two rapid spawns on a
    // crowded board still don't land exactly on top of each other.
    const s = (spawnStep.current++ % 8) * 28;
    return { x: start.x + s, y: start.y + s };
  }

  function createTextCard(x: number, y: number, opts?: { body?: string; edit?: boolean }) {
    const body = opts?.body ?? "<p></p>";
    const edit = opts?.edit ?? true;
    const bitId = crypto.randomUUID();
    const placementId = crypto.randomUUID();
    const z = nextZ();
    const size = defaultCardSize("text", "bit"); // one table — see card-defaults
    setCards((cs) => [
      ...cs,
      { placementId, bitId, type: "text", kind: "bit", x, y, w: size.w, h: size.h, z, body },
    ]);
    selectOne(placementId);
    if (edit) setEditingId(placementId);
    const p = createTextBit(supabase, { bitId, placementId, boardId, body, x, y, width: size.w, z }).catch((e) => {
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
    // Every path we ATTEMPT to upload, recorded BEFORE the attempt — see the sweep note
    // in the catch. Same shape in all six upload doors (board + loose x image/audio/pdf).
    const attempted: string[] = [];
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
        const { full: storagePath, thumb: thumbPath } = imagePaths(bitId);
        attempted.push(storagePath, thumbPath);
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
        // Sweep what we TRIED to upload. Recording the intent BEFORE the attempt is the
        // whole trick: a half-landed upload (the object stored, the response lost) is
        // exactly the case a "record it after it succeeds" sweep misses. Removing a
        // never-written path is a no-op; a failed cleanup must not mask the real error.
        removeObjects(supabase, attempted).catch(() => {});
        onErr(e);
      })
      .finally(() => {
        if (heic) setConverting((n) => n - 1);
      });
    trackCreate(placementId, chain);
  }

  // Straight from the one size table — declaring 300/56 here again is exactly how the
  // server's copy and this one drifted apart in the first place.
  const { w: AUDIO_W, h: AUDIO_H } = defaultCardSize("audio", "bit");

  // Voice memo → an audio card. The original bytes are stored as-is (no transform,
  // no thumbnail); the optimistic card plays immediately from a local object URL.
  function importAudioFile(file: File, wx: number, wy: number, zOverride?: number) {
    const bitId = crypto.randomUUID();
    const placementId = crypto.randomUUID();
    const z = zOverride ?? nextZ();
    const attempted: string[] = [];
    const localUrl = URL.createObjectURL(file);
    setCards((cs) => [
      ...cs,
      { placementId, bitId, type: "audio", kind: "bit", x: wx, y: wy, w: AUDIO_W, h: AUDIO_H, z, fileUrl: localUrl },
    ]);
    selectOne(placementId);
    const chain = importAudio(file)
      .then(async (audio) => {
        const storagePath = audioPath(bitId, audio.ext);
        attempted.push(storagePath);
        await uploadObject(supabase, { path: storagePath, body: audio.blob, contentType: audio.mime });
        await createAudioBit(supabase, {
          bitId, placementId, boardId, storagePath,
          // duration (seconds, rounded) rides in media_width — audio has no real width
          mediaWidth: audio.durationSec != null ? Math.round(audio.durationSec) : undefined,
          mime: audio.mime, byteSize: audio.byteSize, fileName: audio.fileName,
          // No height stored (S8): an audio card is the player's own height. AUDIO_H
          // is still the card's size on screen — it is just not a fact worth keeping.
          x: wx, y: wy, width: AUDIO_W, z,
        });
        setWordsFor({ bitId, kind: "audio" });
      })
      .catch((e) => {
        setCards((cs) => cs.filter((c) => c.placementId !== placementId));
        // Sweep what we tried. This used to guess at all ten possible audio extensions,
        // because the real one was trapped in the .then's closure — recording it before
        // the upload makes the guess unnecessary.
        removeObjects(supabase, attempted).catch(() => {});
        onErr(e);
      });
    trackCreate(placementId, chain);
  }

  const PDF_W = 240; // an unrenderable pdf card's default width (portrait sheet)
  const PDF_H = 300; //  ... and height, when there is no page-1 thumbnail to size to

  // PDF → a card showing its first page. The original bytes store as-is (for the
  // viewer); a 600px page-1 JPEG stores as the thumbnail (like an image's). The card
  // is added AFTER page 1 renders (so it can size to the page aspect), like the image
  // door. An unrenderable PDF still uploads — a document sheet, no thumbnail.
  function importPdfFile(file: File, wx: number, wy: number, zOverride?: number) {
    const bitId = crypto.randomUUID();
    const placementId = crypto.randomUUID();
    const z = zOverride ?? nextZ();
    const attempted: string[] = [];
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
        const { file: storagePath, thumb: pdfThumb } = pdfPaths(bitId);
        const thumbPath = pdf.thumb ? pdfThumb : undefined;
        // The uploads are independent — the PDF plus (when present) its page-1 thumb.
        attempted.push(storagePath);
        if (thumbPath) attempted.push(thumbPath);
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
        removeObjects(supabase, attempted).catch(() => {}); // orphan sweep — see the image door
        onErr(e);
      });
    trackCreate(placementId, chain);
  }

  // Route a dropped/pasted file to the right door (audio → recording, pdf → PDF,
  // else image).
  function placeDroppedFile(file: File, wx: number, wy: number, zOverride?: number) {
    if (looksAudio(file)) importAudioFile(file, wx, wy, zOverride);
    else if (looksPdf(file)) importPdfFile(file, wx, wy, zOverride);
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

  /** The three file pickers are ONE handler. They differed only in the size estimate
   *  passed to findClearSpot and which importer ran — the other 7 lines were identical
   *  three times over. `estimate` is what to reserve before the real dimensions are
   *  known (an image's arrive after decode, a PDF's after page 1 renders).
   *
   *  The batch cascade (36 across, 28 down, z0 + i) is the same one placeFiles uses:
   *  a same-tick loop can't call nextZ() per file, because every call reads the same
   *  stale render array and they would all z-tie. */
  function pickFiles(
    e: React.ChangeEvent<HTMLInputElement>,
    estimate: { w: number; h: number },
    importFile: (file: File, wx: number, wy: number, z: number) => void,
  ) {
    const files = Array.from(e.target.files ?? []);
    if (files.length) {
      const p = findClearSpot(estimate.w, estimate.h);
      const z0 = nextZ();
      files.forEach((f, i) => importFile(f, p.x + i * 36, p.y + i * 28, z0 + i));
    }
    e.target.value = ""; // always — re-picking the SAME file must fire change again
  }

  const onPickImage = (e: React.ChangeEvent<HTMLInputElement>) =>
    pickFiles(e, { w: 320, h: 260 }, importImageFile);
  const onPickAudio = (e: React.ChangeEvent<HTMLInputElement>) =>
    pickFiles(e, { w: AUDIO_W, h: 90 }, importAudioFile);
  const onPickPdf = (e: React.ChangeEvent<HTMLInputElement>) =>
    pickFiles(e, { w: PDF_W, h: PDF_H }, importPdfFile);

  // Paste onto the board: an image → an image card; TEXT → a bit holding it
  // (plan v1.1-D — one paste, one bit, no cleverness). Never while an editor or
  // input has focus: those own their own paste.
  useEffect(() => {
    function onPaste(e: ClipboardEvent) {
      const t = e.target as HTMLElement | null;
      if (t && (t.isContentEditable || t.tagName === "INPUT" || t.tagName === "TEXTAREA")) return;
      const all = Array.from(e.clipboardData?.files ?? []);
      const media = all.filter((f) => f.type.startsWith("image/") || looksAudio(f) || looksPdf(f));
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
    if (!isCardType(type)) return;
    const isNote = bit.kind === "note"; // a note lands page-shaped (a doorway), not receipt-shaped
    // Size and signed media BOTH come from the shared tables (card-defaults) — the
    // server's board load uses the same two. They used to be written out here and in
    // page.tsx, and had already drifted apart.
    const { w: width, h: height } = defaultCardSize(type, bit.kind);
    // Look-then-place, like every non-deliberate spawn (the old 6-step cascade
    // cycled — the 7th landed exactly on the 1st). Text rendered-height estimate;
    // a note has a real fixed height, so use it directly.
    const spot = findClearSpot(width, isNote ? height : type === "text" ? 120 : height);
    const placementId = crypto.randomUUID();
    const z = nextZ();
    const { imageUrl, fileUrl } = await resolveCardMedia(supabase, {
      type,
      thumb_path: bit.thumb_path,
      storage_path: bit.storage_path,
    });
    setCards((cs) => [
      ...cs,
      {
        placementId, bitId: bit.id, type, kind: bit.kind,
        x: spot.x, y: spot.y, w: width, h: height, z,
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
    const p = callInBit(supabase, {
      bitId: bit.id, boardId, placementId, x: spot.x, y: spot.y, width, z,
      height: isFlexSized(type) ? null : height, // S8 — text and audio have no true height
    })
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
