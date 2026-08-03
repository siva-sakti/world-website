"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";

// A quiet in-app confirm / text-prompt, replacing the native window.confirm and
// window.prompt (the jarring, unstyleable browser dialogs). One <ConfirmHost/>
// mounts once in the root layout; feature code calls confirm()/promptText()
// imperatively and awaits the result — so the call sites read almost as before,
// just without the chrome dialog.

type ConfirmSpec = { message: string; confirmLabel?: string; cancelLabel?: string; danger?: boolean };
type PromptSpec = { message: string; initial?: string; placeholder?: string; confirmLabel?: string };
type Pending =
  | (ConfirmSpec & { kind: "confirm"; resolve: (ok: boolean) => void })
  | (PromptSpec & { kind: "prompt"; resolve: (value: string | null) => void });

let register: ((p: Pending) => void) | null = null;

/** Confirm a (usually destructive) act. Resolves true / false; safe default false
 *  if the host isn't mounted. */
export function confirm(spec: ConfirmSpec): Promise<boolean> {
  if (!register) return Promise.resolve(false);
  return new Promise((resolve) => register!({ kind: "confirm", ...spec, resolve }));
}

/** Ask for a line of text (e.g. a URL). Resolves the string, or null if cancelled. */
export function promptText(spec: PromptSpec): Promise<string | null> {
  if (!register) return Promise.resolve(null);
  return new Promise((resolve) => register!({ kind: "prompt", ...spec, resolve }));
}

export function ConfirmHost() {
  const [pending, setPending] = useState<Pending | null>(null);
  const [draft, setDraft] = useState("");

  useEffect(() => {
    register = (p) => {
      if (p.kind === "prompt") setDraft(p.initial ?? "");
      setPending(p);
    };
    return () => {
      register = null;
    };
  }, []);

  useEffect(() => {
    if (!pending) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        if (pending.kind === "confirm") pending.resolve(false);
        else pending.resolve(null);
        setPending(null);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [pending]);

  if (!pending || typeof document === "undefined") return null;

  const cancel = () => {
    if (pending.kind === "confirm") pending.resolve(false);
    else pending.resolve(null);
    setPending(null);
  };
  const accept = () => {
    if (pending.kind === "confirm") pending.resolve(true);
    else pending.resolve(draft);
    setPending(null);
  };

  return createPortal(
    <div className="confirm-scrim" onClick={cancel} onPointerDown={(e) => e.stopPropagation()}>
      <div className="confirm-card" onClick={(e) => e.stopPropagation()}>
        <p className="confirm-msg">{pending.message}</p>
        {pending.kind === "prompt" && (
          <input
            className="confirm-input"
            value={draft}
            placeholder={pending.placeholder}
            autoFocus
            onChange={(e) => setDraft(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") accept();
            }}
          />
        )}
        <div className="confirm-actions">
          <button className="confirm-btn" onClick={cancel}>
            {pending.kind === "confirm" ? pending.cancelLabel ?? "Cancel" : "Cancel"}
          </button>
          <button
            className={`confirm-btn confirm-primary${
              pending.kind === "confirm" && pending.danger ? " is-danger" : ""
            }`}
            onClick={accept}
            autoFocus={pending.kind === "confirm"}
          >
            {pending.confirmLabel ?? (pending.kind === "confirm" ? "OK" : "Save")}
          </button>
        </div>
      </div>
    </div>,
    document.body,
  );
}
