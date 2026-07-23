// Client-side image intake (SPEC §4 media pipeline): validate → decode →
// downscale ≤2400px JPEG + 600px thumb, reading intrinsic dimensions. Decode
// failures throw a MediaError with a plain one-line message (the HEIC rule,
// parked C2 — a silent failure violates the error-state norm). JPEG everywhere
// for v1 (boring + universal; WebP is a later nicety).

const MAX_BYTES = 25 * 1024 * 1024; // reject > 25MB (SPEC)
const MAX_EDGE = 2400; // stored image long edge
const THUMB_EDGE = 600; // thumbnail long edge

export class MediaError extends Error {}

export type ImportedImage = {
  blob: Blob; // downscaled JPEG
  thumb: Blob; // 600px JPEG
  width: number; // stored (downscaled) dimensions
  height: number;
};

const HEIC = /image\/hei[cf]/i;
const IMAGE_EXT = /\.(jpe?g|png|gif|webp|bmp|heic|heif|avif)$/i;

// Is this a HEIC/HEIF? Sync check (name + MIME, which HEICs often leave blank) —
// the one source of truth for both the decoder path and the UI's "converting…"
// notice, so they can never disagree.
export function isHeic(file: File): boolean {
  return HEIC.test(file.type) || /\.(heic|heif)$/i.test(file.name);
}

// heic-to (a maintained wrapper over a CURRENT libheif) is the decoder. The old
// heic2any bundled an ancient libheif that threw "ERR_LIBHEIF format not
// supported" on ordinary iPhone HEVC HEICs — every real photo failed. We load
// heic-to's IIFE build as a plain script (verified: it converts a real 12MP
// iPhone HEIC to JPEG), on demand — only when a HEIC actually appears, so its
// ~3MB never weighs on normal use. Its worker uses eval; fine with no CSP today.
type HeicTo = (o: { blob: Blob; type?: string; quality?: number }) => Promise<Blob | Blob[]>;
let heicLoad: Promise<HeicTo> | null = null;
function loadHeicDecoder(): Promise<HeicTo> {
  const w = window as unknown as { HeicTo?: HeicTo };
  if (w.HeicTo) return Promise.resolve(w.HeicTo);
  if (heicLoad) return heicLoad;
  heicLoad = new Promise((resolve, reject) => {
    const s = document.createElement("script");
    s.src = "/vendor/heic-to.js";
    s.async = true;
    s.onload = () =>
      w.HeicTo ? resolve(w.HeicTo) : reject(new Error("HeicTo not present after load"));
    s.onerror = () => reject(new Error("could not load the HEIC decoder script"));
    document.head.appendChild(s);
  });
  return heicLoad;
}

export async function importImage(file: File): Promise<ImportedImage> {
  // HEIC often arrives with a blank MIME type, so accept by extension too.
  const looksImage = file.type.startsWith("image/") || IMAGE_EXT.test(file.name);
  if (!looksImage) {
    throw new MediaError("That file isn't an image.");
  }
  if (file.size > MAX_BYTES) {
    throw new MediaError("That image is over 25MB — export a smaller copy and try again.");
  }

  const bitmap = await decodeToBitmap(file);
  try {
    const blobFull = await scaleToJpeg(bitmap, MAX_EDGE, 0.85);
    const thumb = await scaleToJpeg(bitmap, THUMB_EDGE, 0.8);
    return { blob: blobFull.blob, thumb: thumb.blob, width: blobFull.width, height: blobFull.height };
  } finally {
    bitmap.close();
  }
}

// Decode a file to a bitmap. HEIC (which Chrome + the Daylight can't read
// natively) is first converted to JPEG by heic-to — loaded ONLY when a HEIC
// actually appears (on-demand script, so its ~3MB never weighs on normal use).
// Anything still undecodable throws the plain one-line message (C2).
async function decodeToBitmap(file: File): Promise<ImageBitmap> {
  let source: Blob = file;
  if (isHeic(file)) {
    try {
      const convert = await loadHeicDecoder();
      const out = await convert({ blob: file, type: "image/jpeg", quality: 0.92 });
      source = Array.isArray(out) ? out[0] : (out as Blob);
    } catch (e) {
      console.error("[media] HEIC conversion failed:", e); // real error in the browser console
      throw new MediaError(
        "This HEIC photo couldn't be converted — export it as JPG and try again.",
      );
    }
  }
  try {
    // EXIF orientation honored by the browser during decode.
    return await createImageBitmap(source, { imageOrientation: "from-image" });
  } catch {
    throw new MediaError(
      "This image format can't be read here — export it as JPG or PNG and try again.",
    );
  }
}

async function scaleToJpeg(bitmap: ImageBitmap, maxEdge: number, quality: number) {
  const scale = Math.min(1, maxEdge / Math.max(bitmap.width, bitmap.height));
  const width = Math.max(1, Math.round(bitmap.width * scale));
  const height = Math.max(1, Math.round(bitmap.height * scale));
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new MediaError("Couldn't process the image (no canvas).");
  ctx.drawImage(bitmap, 0, 0, width, height);
  const blob = await new Promise<Blob | null>((resolve) =>
    canvas.toBlob(resolve, "image/jpeg", quality),
  );
  if (!blob) throw new MediaError("Couldn't process the image.");
  return { blob, width, height };
}
