"use client";

import { useEffect, useRef, useState } from "react";

// The one-line, one-tap-to-skip words offer (S5 — the highest-leverage
// findability surface for a screenshot-heavy owner). Enter saves; skip is a tap.
export function WordsOffer({
  kind,
  initial,
  onSave,
  onSkip,
}: {
  kind: "image" | "drawing" | "audio" | "pdf" | "link";
  initial?: string; // a caption already saved (e.g. ContentLine's unmount commit) — offered back, never blanked
  onSave: (v: string) => void;
  onSkip: () => void;
}) {
  const [value, setValue] = useState(initial ?? "");
  const touched = useRef(false);
  // The unmount-committed caption lands AFTER this mounts (same commit's passive
  // phase) — accept it unless the owner already typed here (health check S3).
  useEffect(() => {
    if (!touched.current) setValue(initial ?? "");
  }, [initial]);
  return (
    <div className="compose-words-offer">
      <input
        autoFocus
        value={value}
        placeholder={
          kind === "image"
            ? "add a few words so you can find this image later?"
            : kind === "audio"
              ? "add a few words so you can find this recording later?"
              : kind === "pdf"
                ? "add a few words so you can find this PDF later?"
                : kind === "link"
                  ? "add a few words so you can find this link later?"
                  : "add a few words to make this drawing findable?"
        }
        onChange={(e) => {
          touched.current = true;
          setValue(e.target.value);
        }}
        onKeyDown={(e) => {
          if (e.key === "Enter") {
            if (value.trim()) onSave(value);
            else onSkip();
          }
          if (e.key === "Escape") onSkip();
        }}
      />
      <button className="compose-btn" onClick={() => (value.trim() ? onSave(value) : onSkip())}>
        {value.trim() ? "save" : "skip"}
      </button>
    </div>
  );
}
