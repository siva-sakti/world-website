import type { SupabaseClient } from "@supabase/supabase-js";

// The single access point for file storage (SPEC O2/§9). Never call the Supabase
// storage SDK from a component — go through here, so the backend can move to R2
// later without touching feature code. Columns store object PATHS, never signed
// URLs (they expire); resolve to a URL at read time via signedUrl. v1 is entirely
// private; the public tier arrives with the sharing gradient.

export const PRIVATE_BUCKET = "private";

export type UploadArgs = {
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
