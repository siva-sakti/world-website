import { MediaError } from "./media";

// Client-side PDF intake (the file-bit foundation, pdf-plan.md): validate mime +
// size, then render PAGE 1 to a canvas with pdf.js and export it as a 600px JPEG
// thumbnail — so a PDF looks like itself on a board (its first page), the thumb
// flowing into thumb_path exactly like an image's. The ORIGINAL bytes are stored
// verbatim (storage_path) for the bit-page viewer.
//
// pdf.js is browser-only + ESM, so it is loaded with a client-only dynamic import
// INSIDE the handler, never at module top (this file is only ever imported from
// client components — like media-audio.ts). Graceful: if page 1 can't render
// (corrupt/encrypted/font-less), thumb resolves to null and we still create the
// bit — a missing thumbnail must never block the upload (the error-state norm).

const MAX_BYTES = 50 * 1024 * 1024; // reject > 50MB (the private bucket's cap; raise it in Supabase for bigger)
const THUMB_EDGE = 600; // first-page thumbnail long edge (matches media.ts's image thumb)
// pdf.js drives its render continuation with requestAnimationFrame, which the browser
// PAUSES in a hidden/backgrounded tab — so a render started and then backgrounded can
// stall until the tab is refocused. Cap the wait (mirrors media-audio.ts's readDuration
// timeout): on timeout we store the PDF WITHOUT a thumbnail rather than block the upload
// forever (a normal, visible-tab render finishes in well under a second).
const RENDER_TIMEOUT_MS = 20000;

export type ImportedPdf = {
  file: Blob; // the original PDF bytes, stored verbatim → storage_path
  thumb: Blob | null; // page-1 JPEG → thumb_path (null when page 1 can't be rendered)
  width: number | null; // the thumbnail's pixel dims (page-1 aspect), for on-board sizing
  height: number | null;
  mime: string; // always "application/pdf"
  fileName: string;
  byteSize: number;
};

/** Is this a PDF? EXPORTED for the same reason as looksAudio — router and validator
 *  must agree, and they were separately typed copies. */
export function looksPdf(file: File): boolean {
  return file.type === "application/pdf" || /\.pdf$/i.test(file.name);
}

export async function importPdf(file: File): Promise<ImportedPdf> {
  if (!looksPdf(file)) {
    throw new MediaError("That file isn't a PDF.");
  }
  if (file.size > MAX_BYTES) {
    throw new MediaError("That PDF is over 50MB — try a smaller file.");
  }
  const thumb = await renderFirstPageThumb(file).catch((e) => {
    // A corrupt/encrypted/font-less PDF can't render page 1 — store it anyway; the
    // card falls back to a document glyph + filename. Never block the upload.
    console.error("[media-pdf] first-page render failed (storing without a thumbnail):", e);
    return null;
  });
  return {
    file,
    thumb: thumb?.blob ?? null,
    width: thumb?.width ?? null,
    height: thumb?.height ?? null,
    mime: "application/pdf",
    fileName: file.name,
    byteSize: file.size,
  };
}

// Render page 1 with pdf.js to an offscreen canvas, then JPEG it. The worker is a
// REAL file shipped to /public (mirrors /public/vendor/heic-to.js): the copied
// pdf.worker.min.mjs MUST stay the same pdfjs-dist version as the pinned dep, or
// pdf.js throws an API/Worker version mismatch. Re-copy it on any pdfjs-dist bump:
//   cp node_modules/pdfjs-dist/build/pdf.worker.min.mjs public/vendor/
let workerSet = false;
async function renderFirstPageThumb(
  file: File,
): Promise<{ blob: Blob; width: number; height: number }> {
  const pdfjs = await import("pdfjs-dist");
  if (!workerSet) {
    pdfjs.GlobalWorkerOptions.workerSrc = "/vendor/pdf.worker.min.mjs";
    workerSet = true;
  }
  const buf = await file.arrayBuffer();
  const doc = await pdfjs.getDocument({ data: new Uint8Array(buf) }).promise;
  try {
    const page = await doc.getPage(1);
    const base = page.getViewport({ scale: 1 });
    const scale = THUMB_EDGE / Math.max(base.width, base.height);
    const viewport = page.getViewport({ scale });
    const canvas = document.createElement("canvas");
    canvas.width = Math.max(1, Math.round(viewport.width));
    canvas.height = Math.max(1, Math.round(viewport.height));
    const ctx = canvas.getContext("2d");
    if (!ctx) throw new Error("no 2d canvas context");
    const task = page.render({ canvasContext: ctx, viewport });
    let timer: ReturnType<typeof setTimeout>;
    const timeout = new Promise<never>((_, reject) => {
      timer = setTimeout(() => reject(new Error("pdf render timed out")), RENDER_TIMEOUT_MS);
    });
    try {
      await Promise.race([task.promise, timeout]);
    } finally {
      clearTimeout(timer!);
    }
    const blob = await canvasToJpeg(canvas, 0.8);
    return { blob, width: canvas.width, height: canvas.height };
  } finally {
    doc.destroy();
  }
}

// Canvas → JPEG blob. media.ts's scaleToJpeg is not exported and takes an
// ImageBitmap; a PDF page renders straight to a canvas, so this small sibling
// exports the canvas directly (the plan's `canvasToJpeg`).
async function canvasToJpeg(canvas: HTMLCanvasElement, quality: number): Promise<Blob> {
  const blob = await new Promise<Blob | null>((resolve) =>
    canvas.toBlob(resolve, "image/jpeg", quality),
  );
  if (!blob) throw new Error("canvas.toBlob returned null");
  return blob;
}
