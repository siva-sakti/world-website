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
