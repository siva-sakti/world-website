"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { uploadObject, removeObjects } from "@/lib/storage";
import { createAudioBit, createPdfBit, updateBitContent } from "@/lib/db/bits";
import { importAudio } from "@/lib/media-audio";
import { importPdf } from "@/lib/media-pdf";
import { MediaError } from "@/lib/media";

// The LOOSE file-upload doors (voice-memo-plan.md / pdf-plan.md): drop a voice memo
// OR a PDF straight into the pile — no board needed ("loose OR on a board, the
// same"). Client-side, exactly like the board's doors: import → upload → create the
// file bit with NO placement (a loose bit → the inbox). A fresh upload then offers
// an inline caption (consistent with the board's WordsOffer), editable later on the
// bit page too. Both funnel through the SAME createFileBit as the board doors.
export function LooseFileIntake() {
  const [supabase] = useState(() => createClient());
  const router = useRouter();
  const audioRef = useRef<HTMLInputElement>(null);
  const pdfRef = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState<null | "recording" | "PDF">(null);
  const [err, setErr] = useState<string | null>(null);
  const [captionFor, setCaptionFor] = useState<string | null>(null); // the just-added bit's id
  const [captionNoun, setCaptionNoun] = useState<"recording" | "PDF">("recording");
  const [caption, setCaption] = useState("");

  async function onPickAudio(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file || busy) return;
    setBusy("recording");
    setErr(null);
    const bitId = crypto.randomUUID();
    let uploadedPath: string | null = null;
    try {
      const audio = await importAudio(file);
      const storagePath = `audio/${bitId}.${audio.ext}`;
      await uploadObject(supabase, { path: storagePath, body: audio.blob, contentType: audio.mime });
      uploadedPath = storagePath;
      await createAudioBit(supabase, {
        bitId, storagePath, // no placementId/boardId → a LOOSE bit (the inbox)
        mediaWidth: audio.durationSec != null ? Math.round(audio.durationSec) : undefined,
        mime: audio.mime, byteSize: audio.byteSize, fileName: audio.fileName,
      });
      offerCaption(bitId, "recording");
    } catch (e2) {
      // The upload may have landed before the insert failed — remove it or it's an
      // orphan forever (a retry mints a fresh bitId; the server intake sets the precedent).
      if (uploadedPath) removeObjects(supabase, [uploadedPath]).catch(() => {});
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
    const uploaded: string[] = [];
    try {
      const pdf = await importPdf(file);
      const storagePath = `pdfs/${bitId}.pdf`;
      const thumbPath = pdf.thumb ? `thumbs/${bitId}.jpg` : undefined;
      // The original PDF, plus (when page 1 rendered) its first-page thumbnail.
      const uploads = [
        uploadObject(supabase, { path: storagePath, body: pdf.file, contentType: "application/pdf" }),
      ];
      if (pdf.thumb && thumbPath) {
        uploads.push(uploadObject(supabase, { path: thumbPath, body: pdf.thumb, contentType: "image/jpeg" }));
      }
      await Promise.all(uploads);
      uploaded.push(storagePath);
      if (thumbPath) uploaded.push(thumbPath);
      await createPdfBit(supabase, {
        bitId, storagePath, thumbPath, // no placementId/boardId → a LOOSE bit (the inbox)
        mediaWidth: pdf.width ?? undefined, mediaHeight: pdf.height ?? undefined,
        mime: pdf.mime, byteSize: pdf.byteSize, fileName: pdf.fileName,
      });
      offerCaption(bitId, "PDF");
    } catch (e2) {
      // Orphan sweep (a failed insert after the uploads landed) — deterministic paths from bitId.
      removeObjects(supabase, uploaded.length ? uploaded : [`pdfs/${bitId}.pdf`, `thumbs/${bitId}.jpg`]).catch(() => {});
      setErr(e2 instanceof MediaError ? e2.message : "Couldn't add that PDF — check your connection.");
    } finally {
      setBusy(null);
    }
  }

  function offerCaption(bitId: string, noun: "recording" | "PDF") {
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

  return (
    <div className="loose-file-intake">
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
