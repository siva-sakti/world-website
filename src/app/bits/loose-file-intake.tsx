"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { uploadObject } from "@/lib/storage";
import { createAudioBit, updateBitContent } from "@/lib/db/bits";
import { importAudio } from "@/lib/media-audio";
import { MediaError } from "@/lib/media";

// The LOOSE file-upload door (voice-memo-plan.md §5, my caption decision): drop a
// voice memo straight into the pile — no board needed ("loose OR on a board, the
// same"). Client-side, exactly like the board's image door: importAudio → upload →
// createAudioBit with NO placement (a loose bit → the inbox). A fresh upload then
// offers an inline caption (consistent with the board's WordsOffer), editable later
// on the bit page too. Funnels through the SAME createFileBit as the board door.
export function LooseFileIntake() {
  const [supabase] = useState(() => createClient());
  const router = useRouter();
  const audioRef = useRef<HTMLInputElement>(null);
  const [pending, setPending] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [captionFor, setCaptionFor] = useState<string | null>(null); // the just-added bit's id
  const [caption, setCaption] = useState("");

  async function onPick(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file || pending) return;
    setPending(true);
    setErr(null);
    try {
      const audio = await importAudio(file);
      const bitId = crypto.randomUUID();
      const storagePath = `audio/${bitId}.${audio.ext}`;
      await uploadObject(supabase, { path: storagePath, body: audio.blob, contentType: audio.mime });
      await createAudioBit(supabase, {
        bitId, storagePath, // no placementId/boardId → a LOOSE bit (the inbox)
        mediaWidth: audio.durationSec != null ? Math.round(audio.durationSec) : undefined,
        mime: audio.mime, byteSize: audio.byteSize, fileName: audio.fileName,
      });
      setCaptionFor(bitId);
      setCaption("");
      router.refresh(); // the new loose recording joins the pile
    } catch (e2) {
      setErr(e2 instanceof MediaError ? e2.message : "Couldn't add that recording — check your connection.");
    } finally {
      setPending(false);
    }
  }

  async function saveCaption() {
    const id = captionFor;
    if (!id) return;
    const v = caption.trim();
    setCaptionFor(null);
    setCaption("");
    if (!v) return; // empty = no caption (P5)
    try {
      await updateBitContent(supabase, id, v);
      router.refresh();
    } catch {
      setErr("Couldn't save the caption — you can add it later on the recording's page.");
    }
  }

  return (
    <div className="loose-file-intake">
      <button
        type="button"
        className="compose-btn"
        disabled={pending}
        onClick={() => audioRef.current?.click()}
        title="Upload a voice memo — it lands loose in your bits"
      >
        {pending ? "adding…" : "+ recording"}
      </button>
      <input ref={audioRef} type="file" accept="audio/*" hidden onChange={onPick} />
      {err && <span className="intake-err">{err}</span>}
      {captionFor && (
        <span className="loose-file-caption">
          <input
            autoFocus
            className="tag-bar-input"
            value={caption}
            placeholder="add a few words so you can find this recording later?"
            onChange={(e) => setCaption(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") { e.preventDefault(); saveCaption(); }
              if (e.key === "Escape") { setCaptionFor(null); setCaption(""); }
            }}
          />
          <button type="button" className="compose-btn subtle" onClick={saveCaption}>
            {caption.trim() ? "save" : "skip"}
          </button>
        </span>
      )}
    </div>
  );
}
