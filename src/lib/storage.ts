import type { SupabaseClient } from "@supabase/supabase-js";

// The single access point for file storage (SPEC O2/§9). Never call the Supabase
// storage SDK from a component — go through here, so the backend can move to R2
// later without touching feature code. Columns store object PATHS, never signed
// URLs (they expire); resolve to a URL at read time via signedUrl/publicUrl.

export const PRIVATE_BUCKET = "private";
export const PUBLIC_BUCKET = "public";

export type UploadArgs = {
  path: string; // object key, e.g. `images/<uuid>.webp`
  body: Blob | File | ArrayBuffer;
  contentType: string;
  isPublic?: boolean; // default private
};

export async function uploadObject(supabase: SupabaseClient, args: UploadArgs) {
  const bucket = args.isPublic ? PUBLIC_BUCKET : PRIVATE_BUCKET;
  const { error } = await supabase.storage
    .from(bucket)
    .upload(args.path, args.body, {
      contentType: args.contentType,
      upsert: false,
    });
  if (error) throw error;
  return { bucket, path: args.path };
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

/** A stable URL for a public object. */
export function publicUrl(supabase: SupabaseClient, path: string) {
  return supabase.storage.from(PUBLIC_BUCKET).getPublicUrl(path).data.publicUrl;
}
