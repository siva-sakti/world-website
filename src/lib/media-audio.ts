import { MediaError } from "./media";

// Client-side audio intake (the file-bit foundation, voice-memo-plan.md): validate
// mime + size, then read the recording's DURATION off an offscreen <audio> element's
// `loadedmetadata` event. Unlike images there is NO transform and NO thumbnail — the
// original bytes are stored as-is (voice memos are small). A file that can't be read
// throws a MediaError with a plain one-line message (the error-state norm).

const MAX_BYTES = 50 * 1024 * 1024; // reject > 50MB (a long voice memo is still well under this)

// The iPhone Voice Memos export (.m4a) plus the common web/portable audio types.
// A .m4a often arrives with a blank OR "audio/x-m4a" MIME, so accept by extension too.
const AUDIO_EXT = /\.(m4a|mp3|mp4|aac|wav|ogg|oga|opus|webm|flac)$/i;

// mime → storage extension, when the filename has none we trust.
const MIME_EXT: Record<string, string> = {
  "audio/mp4": "m4a",
  "audio/x-m4a": "m4a",
  "audio/aac": "aac",
  "audio/mpeg": "mp3",
  "audio/mp3": "mp3",
  "audio/wav": "wav",
  "audio/x-wav": "wav",
  "audio/ogg": "ogg",
  "audio/webm": "webm",
  "audio/flac": "flac",
};

export type ImportedAudio = {
  blob: Blob; // the original file bytes, stored verbatim
  mime: string; // the file's MIME (falls back to audio/mp4 for a blank .m4a)
  ext: string; // the storage-path extension
  fileName: string;
  byteSize: number;
  durationSec: number | null; // read via loadedmetadata; null when unreadable
};

/** Is this an audio file? EXPORTED because the board's drop-router needs the same
 *  answer this importer will give — they used to be two hand-typed copies of the
 *  regex, so adding a format here would have silently misrouted that format there. */
export function looksAudio(file: File): boolean {
  return file.type.startsWith("audio/") || AUDIO_EXT.test(file.name);
}

function extFor(file: File, mime: string): string {
  const m = file.name.match(/\.([a-z0-9]+)$/i);
  if (m) return m[1].toLowerCase();
  return MIME_EXT[mime.toLowerCase()] ?? "m4a";
}

export async function importAudio(file: File): Promise<ImportedAudio> {
  if (!looksAudio(file)) {
    throw new MediaError("That file isn't audio — a voice memo (.m4a), mp3, or wav.");
  }
  if (file.size > MAX_BYTES) {
    throw new MediaError("That recording is over 50MB — trim it and try again.");
  }
  // A blank MIME (common on .m4a) → assume the iPhone export container.
  const mime = file.type || "audio/mp4";
  const ext = extFor(file, mime);
  const durationSec = await readDuration(file);
  return { blob: file, mime, ext, fileName: file.name, byteSize: file.size, durationSec };
}

// Read the recording's duration off an offscreen <audio> element. Best-effort: any
// failure (undecodable, a browser that won't read the container's metadata, the
// safety timeout) resolves to null rather than throwing — a missing duration must
// never block the upload; the file still plays via its own <audio controls>.
function readDuration(file: File): Promise<number | null> {
  return new Promise((resolve) => {
    const url = URL.createObjectURL(file);
    const el = document.createElement("audio");
    el.preload = "metadata";
    let done = false;
    const finish = (v: number | null) => {
      if (done) return;
      done = true;
      URL.revokeObjectURL(url);
      resolve(v);
    };
    el.addEventListener("loadedmetadata", () => {
      const d = el.duration;
      finish(Number.isFinite(d) && d > 0 ? d : null);
    });
    el.addEventListener("error", () => finish(null));
    // Some browsers never fire either event for an unsupported container — cap the wait.
    setTimeout(() => finish(null), 5000);
    el.src = url;
  });
}
