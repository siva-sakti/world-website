import type { SupabaseClient } from "@supabase/supabase-js";

// The single access point for file storage (SPEC O2/§9). Never call the Supabase
// storage SDK from a component — go through here, so the backend can move to R2
// later without touching feature code. Columns store object PATHS, never signed
// URLs (they expire); resolve to a URL at read time via signedUrl. v1 is entirely
// private; the public tier arrives with the sharing gradient.

const PRIVATE_BUCKET = "private";

type UploadArgs = {
  path: string; // object key, e.g. `images/<uuid>.webp`
  body: Blob | File | ArrayBuffer;
  contentType: string;
};

export async function uploadObject(supabase: SupabaseClient, args: UploadArgs) {
  const { error } = await supabase.storage
    .from(PRIVATE_BUCKET)
    .upload(args.path, args.body, {
      contentType: args.contentType,
      upsert: false,
    });
  if (error) throw error;
  return { bucket: PRIVATE_BUCKET, path: args.path };
}

/** Sign MANY private objects in a few round-trips (createSignedUrls, chunked ~100 —
 *  the export's per-file loop was thousands of sequential calls; review R2.7). Returns
 *  path → url (null where signing failed); order-independent. */
export async function signedUrls(
  supabase: SupabaseClient,
  paths: string[],
  expiresInSeconds = 3600,
): Promise<Map<string, string | null>> {
  const out = new Map<string, string | null>();
  for (let i = 0; i < paths.length; i += 100) {
    const slice = paths.slice(i, i + 100);
    try {
      const { data, error } = await supabase.storage
        .from(PRIVATE_BUCKET)
        .createSignedUrls(slice, expiresInSeconds);
      if (error) throw error;
      for (const r of data ?? []) out.set(r.path ?? "", r.signedUrl ?? null);
    } catch {
      for (const p of slice) if (!out.has(p)) out.set(p, null); // a failed batch → null urls, never a thrown export
    }
  }
  return out;
}

/** A time-limited URL for reading a private object. */
export async function signedUrl(
  supabase: SupabaseClient,
  path: string,
  expiresIn = 3600,
) {
  const { data, error } = await supabase.storage
    .from(PRIVATE_BUCKET)
    .createSignedUrl(path, expiresIn);
  if (error) throw error;
  return data.signedUrl;
}

/** Sign display thumbnails for a set of bits — anything with a `thumb_path` (image
 * + pdf's first-page render; a future thumbnailed type lights up with no re-edit).
 * An image with no thumb still falls back to its full object; audio (thumb null,
 * storage_path is not an image) is skipped. The V4 broom for the copy-pasted
 * per-page loops. Failures skip quietly. */
export async function signThumbs(
  supabase: Parameters<typeof signedUrl>[0],
  bits: { id: string; type: string; thumb_path: string | null; storage_path: string | null }[],
): Promise<Record<string, string>> {
  const out: Record<string, string> = {};
  await Promise.all(
    bits.map(async (b) => {
      // Sign a thumb_path for any type; for an image with none, fall back to the
      // full object (a PDF/audio never falls back — their storage_path is not an image).
      const path = b.thumb_path ?? (b.type === "image" ? b.storage_path : null);
      if (!path) return;
      try {
        out[b.id] = await signedUrl(supabase, path);
      } catch {
        /* skip */
      }
    }),
  );
  return out;
}

/** PERMANENTLY remove objects from the private bucket — the destroy path (I-L10:
 *  "its media — file bytes and derived artifacts"). Nulls filtered; storage errors
 *  are logged, never thrown — a failed/missing file must not block the row delete
 *  (the row is the source of truth; a stray file is minor and cleanable). */
export async function removeObjects(
  supabase: SupabaseClient,
  paths: (string | null | undefined)[],
): Promise<void> {
  const real = paths.filter((p): p is string => !!p);
  if (real.length === 0) return;
  const { error } = await supabase.storage.from(PRIVATE_BUCKET).remove(real);
  if (error) console.error("storage remove failed (continuing):", error);
}

// WHERE A BIT'S FILES LIVE — one definition, sixteen call sites.
//
// These four shapes were spelled out by hand in three files: the board's create doors,
// the loose intake, and the server-side link capture. A path typed in one place and
// swept in another is how orphaned objects happen — and the sweep already had a real
// gap, because `audioPaths` below is the ONLY way to know every extension an audio
// upload might have taken.
//
// The paths are DERIVED FROM THE BIT ID, deliberately: nothing has to be remembered
// between upload and cleanup, and a retry after a failure mints a fresh id rather than
// colliding. Removing a path that was never written is a no-op, which is what makes the
// blunt sweeps safe.

/** An image: the full object, plus its 600px thumbnail. */
export function imagePaths(bitId: string): { full: string; thumb: string } {
  return { full: `images/${bitId}.jpg`, thumb: `thumbs/${bitId}.jpg` };
}

/** A PDF: the original bytes, plus (when page 1 rendered) its thumbnail. */
export function pdfPaths(bitId: string): { file: string; thumb: string } {
  return { file: `pdfs/${bitId}.pdf`, thumb: `thumbs/${bitId}.jpg` };
}

/** A link's stored page-card image — a thumbnail with no original beside it. */
export function linkThumbPath(bitId: string): string {
  return `thumbs/${bitId}.jpg`;
}

/** The audio object, at a known extension. */
export function audioPath(bitId: string, ext: string): string {
  return `audio/${bitId}.${ext}`;
}

/** EVERY extension an audio upload could have used — the orphan sweep's input when the
 *  real one is unknown (a failure before the extension was captured). Blunt on purpose:
 *  removing paths that were never written costs nothing, and missing the one that WAS
 *  written leaves a file behind forever. */
export const AUDIO_EXTS = ["m4a", "mp3", "mp4", "aac", "wav", "ogg", "oga", "opus", "webm", "flac"];
export function audioPathsAllExts(bitId: string): string[] {
  return AUDIO_EXTS.map((ext) => audioPath(bitId, ext));
}
