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

// heic2any is an old UMD library that Turbopack's module interop mangles (the
// `import()` came back as the wrong shape). It works flawlessly loaded as a
// plain script (verified: it converts a real HEIC in ~280ms), so we load the
// vendored dist on demand — only when a HEIC actually appears — via window.
type Heic2Any = (o: { blob: Blob; toType?: string; quality?: number }) => Promise<Blob | Blob[]>;
let heic2anyLoad: Promise<Heic2Any> | null = null;
function loadHeic2any(): Promise<Heic2Any> {
  const w = window as unknown as { heic2any?: Heic2Any };
  if (w.heic2any) return Promise.resolve(w.heic2any);
  if (heic2anyLoad) return heic2anyLoad;
  heic2anyLoad = new Promise((resolve, reject) => {
    const s = document.createElement("script");
    s.src = "/vendor/heic2any.min.js";
    s.async = true;
    s.onload = () =>
      w.heic2any ? resolve(w.heic2any) : reject(new Error("heic2any not present after load"));
    s.onerror = () => reject(new Error("could not load the HEIC decoder script"));
    document.head.appendChild(s);
  });
  return heic2anyLoad;
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
// natively) is first converted to JPEG by heic2any — loaded ONLY when a HEIC
// actually appears (dynamic import, so its ~1.4MB never weighs on normal use).
// Anything still undecodable throws the plain one-line message (C2).
async function decodeToBitmap(file: File): Promise<ImageBitmap> {
  const isHeic = HEIC.test(file.type) || /\.(heic|heif)$/i.test(file.name);
  let source: Blob = file;
  if (isHeic) {
    try {
      const convert = await loadHeic2any();
      const out = await convert({ blob: file, toType: "image/jpeg", quality: 0.92 });
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
