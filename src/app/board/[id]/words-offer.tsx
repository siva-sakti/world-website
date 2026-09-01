"use client";

import { useState } from "react";

// The one-line, one-tap-to-skip words offer (S5 — the highest-leverage
// findability surface for a screenshot-heavy owner). Enter saves; skip is a tap.
export function WordsOffer({
  kind,
  onSave,
  onSkip,
}: {
  kind: "image" | "drawing" | "audio" | "pdf" | "link";
  onSave: (v: string) => void;
  onSkip: () => void;
}) {
  const [value, setValue] = useState("");
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
        onChange={(e) => setValue(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Enter") value.trim() ? onSave(value) : onSkip();
          if (e.key === "Escape") onSkip();
        }}
      />
      <button className="compose-btn" onClick={() => (value.trim() ? onSave(value) : onSkip())}>
        {value.trim() ? "save" : "skip"}
      </button>
    </div>
  );
}
