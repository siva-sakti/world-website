"use client";

import { useEffect, useRef, useState } from "react";
import { registerSave } from "@/lib/save-guard";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { uploadObject, removeObjects, imagePaths, pdfPaths, audioPath } from "@/lib/storage";
import { createAudioBit, createPdfBit, createFileBit, updateBitContent } from "@/lib/db/bits";
import { importAudio } from "@/lib/media-audio";
import { importPdf } from "@/lib/media-pdf";
import { importImage, MediaError } from "@/lib/media";

// The LOOSE file-upload doors (voice-memo-plan.md / pdf-plan.md + the flow review's
// F7): drop a PHOTO, a voice memo, or a PDF straight into the pile — no board needed ("loose OR on a board, the
// same"). Client-side, exactly like the board's doors: import → upload → create the
// file bit with NO placement (a loose bit → the inbox). A fresh upload then offers
// an inline caption (consistent with the board's WordsOffer), editable later on the
// bit page too. Both funnel through the SAME createFileBit as the board doors.
export function LooseFileIntake() {
  const [supabase] = useState(() => createClient());
  const router = useRouter();
  const imageRef = useRef<HTMLInputElement>(null);
  const audioRef = useRef<HTMLInputElement>(null);
  const pdfRef = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState<null | "image" | "recording" | "PDF">(null);
  const [err, setErr] = useState<string | null>(null);
  const [captionFor, setCaptionFor] = useState<string | null>(null); // the just-added bit's id
  const [captionNoun, setCaptionNoun] = useState<"image" | "recording" | "PDF">("recording");
  const [caption, setCaption] = useState("");

  // A PHOTO, loose (F7): the most phone-native capture, and until now the only one
  // you could NOT do outside a board. Same shape as the two doors below — import
  // (HEIC decoded inside importImage) → the two uploads → createFileBit with NO
  // placement (loose) → offer a caption. Orphan-swept on a failed insert.
  async function onPickImage(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file || busy) return;
    setBusy("image");
    setErr(null);
    const bitId = crypto.randomUUID();
    // Every path we ATTEMPT to upload, recorded BEFORE the attempt — the same shape as
    // the board's three doors. A half-landed upload (object stored, response lost) is
    // exactly what a "record it after it succeeds" sweep misses.
    const attempted: string[] = [];
    try {
      const img = await importImage(file);
      const { full: storagePath, thumb: thumbPath } = imagePaths(bitId);
      attempted.push(storagePath, thumbPath);
      await Promise.all([
        uploadObject(supabase, { path: storagePath, body: img.blob, contentType: "image/jpeg" }),
        uploadObject(supabase, { path: thumbPath, body: img.thumb, contentType: "image/jpeg" }),
      ]);
      await createFileBit(supabase, "image", {
        bitId, storagePath, thumbPath, // no placementId/boardId → a LOOSE bit (the inbox)
        mediaWidth: img.width, mediaHeight: img.height,
        mime: "image/jpeg", byteSize: img.blob.size, fileName: file.name,
      });
      offerCaption(bitId, "image");
    } catch (e2) {
      removeObjects(supabase, attempted).catch(() => {});
      setErr(e2 instanceof MediaError ? e2.message : "Couldn't add that photo — check your connection.");
    } finally {
      setBusy(null);
    }
  }

  async function onPickAudio(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file || busy) return;
    setBusy("recording");
    setErr(null);
    const bitId = crypto.randomUUID();
    const attempted: string[] = [];
    try {
      const audio = await importAudio(file);
      const storagePath = audioPath(bitId, audio.ext);
      attempted.push(storagePath);
      await uploadObject(supabase, { path: storagePath, body: audio.blob, contentType: audio.mime });
      await createAudioBit(supabase, {
        bitId, storagePath, // no placementId/boardId → a LOOSE bit (the inbox)
        mediaWidth: audio.durationSec != null ? Math.round(audio.durationSec) : undefined,
        mime: audio.mime, byteSize: audio.byteSize, fileName: audio.fileName,
      });
      offerCaption(bitId, "recording");
    } catch (e2) {
      // THE GAP THIS CLOSES (owner-flagged, 2026-09-02): this used to record the path
      // only AFTER the upload resolved, so an upload that half-landed and then threw
      // swept nothing and left the file orphaned forever. Its image and pdf siblings in
      // this very file already had a fallback; audio didn't.
      removeObjects(supabase, attempted).catch(() => {});
      setErr(e2 instanceof MediaError ? e2.message : "Couldn't add that recording — check your connection.");
    } finally {
      setBusy(null);
    }
  }

  async function onPickPdf(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file || busy) return;
    setBusy("PDF");
    setErr(null);
    const bitId = crypto.randomUUID();
    const attempted: string[] = [];
    try {
      const pdf = await importPdf(file);
      const { file: storagePath, thumb: pdfThumb } = pdfPaths(bitId);
      const thumbPath = pdf.thumb ? pdfThumb : undefined;
      attempted.push(storagePath);
      if (thumbPath) attempted.push(thumbPath);
      // The original PDF, plus (when page 1 rendered) its first-page thumbnail.
      const uploads = [
        uploadObject(supabase, { path: storagePath, body: pdf.file, contentType: "application/pdf" }),
      ];
      if (pdf.thumb && thumbPath) {
        uploads.push(uploadObject(supabase, { path: thumbPath, body: pdf.thumb, contentType: "image/jpeg" }));
      }
      await Promise.all(uploads);
      await createPdfBit(supabase, {
        bitId, storagePath, thumbPath, // no placementId/boardId → a LOOSE bit (the inbox)
        mediaWidth: pdf.width ?? undefined, mediaHeight: pdf.height ?? undefined,
        mime: pdf.mime, byteSize: pdf.byteSize, fileName: pdf.fileName,
      });
      offerCaption(bitId, "PDF");
    } catch (e2) {
      removeObjects(supabase, attempted).catch(() => {}); // sweep what we tried — see the image door
      setErr(e2 instanceof MediaError ? e2.message : "Couldn't add that PDF — check your connection.");
    } finally {
      setBusy(null);
    }
  }

  function offerCaption(bitId: string, noun: "image" | "recording" | "PDF") {
    setCaptionFor(bitId);
    setCaptionNoun(noun);
    setCaption("");
    router.refresh(); // the new loose file joins the pile
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
      setErr(`Couldn't save the caption — you can add it later on the ${captionNoun}'s page.`);
    }
  }

  // Page-hide commit (hunt #8): backgrounding the phone mid-caption fired nothing —
  // the typed words died with the tab. Commit only when words exist (an empty
  // caption on hide must not auto-skip the offer).
  const captionCommit = useRef<() => void>(() => {});
  // eslint-disable-next-line react-hooks/refs -- latest-callback ref: the effect below commits the current caption
  captionCommit.current = () => {
    if (captionFor && caption.trim()) void saveCaption();
  };
  useEffect(() => registerSave(() => captionCommit.current()), []);

  return (
    <div className="loose-file-intake">
      <button
        type="button"
        className="compose-btn"
        disabled={busy !== null}
        onClick={() => imageRef.current?.click()}
        title="Add a photo — it lands loose in your bits"
      >
        {busy === "image" ? "adding…" : "+ image"}
      </button>
      <button
        type="button"
        className="compose-btn"
        disabled={busy !== null}
        onClick={() => audioRef.current?.click()}
        title="Upload a voice memo — it lands loose in your bits"
      >
        {busy === "recording" ? "adding…" : "+ recording"}
      </button>
      <button
        type="button"
        className="compose-btn"
        disabled={busy !== null}
        onClick={() => pdfRef.current?.click()}
        title="Upload a PDF — it lands loose in your bits"
      >
        {busy === "PDF" ? "adding…" : "+ PDF"}
      </button>
      <input ref={imageRef} type="file" accept="image/*,.heic,.heif,image/heic,image/heif" hidden onChange={onPickImage} />
      <input ref={audioRef} type="file" accept="audio/*" hidden onChange={onPickAudio} />
      <input ref={pdfRef} type="file" accept="application/pdf,.pdf" hidden onChange={onPickPdf} />
      {err && <span className="intake-err">{err}</span>}
      {captionFor && (
        <span className="loose-file-caption">
          <input
            autoFocus
            className="tag-bar-input"
            value={caption}
            placeholder={`add a few words so you can find this ${captionNoun} later?`}
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
