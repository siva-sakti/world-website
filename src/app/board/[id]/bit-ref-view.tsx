"use client";

import { NodeViewWrapper, type NodeViewProps } from "@tiptap/react";
import { useEffect, useMemo, useState } from "react";
import { createPortal } from "react-dom";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { signedUrl } from "@/lib/storage";
import { normalizeDrawing, strokesBounds } from "@/lib/stroke";
import { DoodleBit } from "./doodle-bit";
import type { Drawing } from "@/lib/types";

// The gather chip's LOOK + PEEK (gather-build-plan.md G3). A chip pointing at an
// image or drawing shows a tiny THUMBNAIL inline — a picture, not "untitled". Tapping
// ANY chip opens a PEEK by the chip: the target's name + a glimpse (text snippet ·
// image · doodle) + an "open →". Tap = peek, never navigate-by-default (ruled
// 2026-07-28) — you're calling a thought in, not leaving your sentence; "open →"
// takes you there if you truly want to.
//
// Display ONLY: this NodeView never changes what is saved. `BitRef.renderHTML` still
// serializes `<span data-ref="id">label</span>` (the id is truth, the label a search
// cache — the P9 carve), so extractRefIds, reconcile, search_tsv, and export are all
// untouched.

type Target = {
  face: string; // the target's headline (its name)
  type: string;
  snippet: string; // a text glimpse (stripped body/content)
  imageUrl: string | null; // a signed thumb, if an image
  drawing: Drawing | null; // normalized ink, if a drawing
  gone: boolean; // trashed or destroyed
};

// Resolve a target id once (cached) — enough to draw the inline chip AND the peek. A
// signed image URL lasts ~1h, fine for a note session.
const cache = new Map<string, Promise<Target>>();

function stripHtml(html: string | null): string {
  if (!html) return "";
  return html.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
}

function resolveTarget(refId: string): Promise<Target> {
  const hit = cache.get(refId);
  if (hit) return hit;
  const p = (async (): Promise<Target> => {
    const supabase = createClient();
    const { data, error } = await supabase
      .from("bit")
      .select("type, content, body, thumb_path, storage_path, strokes, face, deleted_at")
      .eq("id", refId)
      .maybeSingle();
    const dead: Target = { face: "", type: "text", snippet: "", imageUrl: null, drawing: null, gone: true };
    if (error || !data) return dead;
    const face = (data.face as string | null) ?? "";
    const type = (data.type as string) ?? "text";
    if (data.deleted_at) return { ...dead, face, type };
    let imageUrl: string | null = null;
    let drawing: Drawing | null = null;
    if (type === "image" && (data.thumb_path || data.storage_path)) {
      try {
        imageUrl = await signedUrl(supabase, (data.thumb_path ?? data.storage_path) as string);
      } catch {
        imageUrl = null;
      }
    }
    if (type === "drawing") {
      // The column holds { strokes, sizes, colors } (or an old bare array) —
      // normalizeDrawing reads both; only a real, non-empty drawing renders.
      const d = normalizeDrawing(data.strokes);
      if (d.strokes.length > 0) drawing = d;
    }
    const snippet = stripHtml((data.body as string | null) ?? (data.content as string | null));
    return { face, type, snippet, imageUrl, drawing, gone: false };
  })();
  cache.set(refId, p);
  return p;
}

export function BitRefView({ node }: NodeViewProps) {
  const refId = node.attrs.refId as string | null;
  const label = (node.attrs.label as string) || "?";
  const [target, setTarget] = useState<Target | null>(null);
  const [peekAt, setPeekAt] = useState<{ left: number; top: number } | null>(null);

  useEffect(() => {
    if (!refId) return;
    let alive = true;
    resolveTarget(refId).then((t) => alive && setTarget(t));
    return () => {
      alive = false;
    };
  }, [refId]);

  // How the chip looks INLINE: a picture for a live image/drawing, else its word.
  const asImage = !!target && !target.gone && target.type === "image" && !!target.imageUrl;
  const asDoodle = !!target && !target.gone && target.type === "drawing" && !!target.drawing;
  const asMedia = asImage || asDoodle;

  const openPeek = (e: React.MouseEvent) => {
    if (!refId) return;
    e.preventDefault();
    e.stopPropagation(); // don't let a board card select/edit under the chip
    const r = (e.currentTarget as HTMLElement).getBoundingClientRect();
    setPeekAt({ left: r.left, top: r.bottom });
  };

  return (
    <NodeViewWrapper
      as="span"
      className={asMedia ? "gather-chip-thumb" : "gather-chip"}
      onClick={openPeek}
      title={label}
    >
      {asImage ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={target!.imageUrl!} alt={label} draggable={false} />
      ) : asDoodle ? (
        <ChipDoodle drawing={target!.drawing!} />
      ) : (
        label
      )}
      {peekAt && refId && (
        <Peek refId={refId} label={label} target={target} at={peekAt} onClose={() => setPeekAt(null)} />
      )}
    </NodeViewWrapper>
  );
}

// The inline doodle chip — DoodleBit at line height, sized to the ink ratio (via
// aspect-ratio) so preserveAspectRatio="none" fills it without stretching.
function ChipDoodle({ drawing }: { drawing: Drawing }) {
  const ratio = useMemo(() => {
    const b = strokesBounds(drawing.strokes);
    return Math.max(1, b.maxX) / Math.max(1, b.maxY);
  }, [drawing]);
  return (
    <span className="gather-chip-doodle" style={{ aspectRatio: ratio }}>
      <DoodleBit drawing={drawing} />
    </span>
  );
}

// The peek — a small popover by the chip: a glimpse of the target + its name +
// "open →". Tap the backdrop or press Escape to dismiss.
function Peek({
  refId,
  label,
  target,
  at,
  onClose,
}: {
  refId: string;
  label: string;
  target: Target | null;
  at: { left: number; top: number };
  onClose: () => void;
}) {
  const router = useRouter();
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);
  if (typeof document === "undefined") return null;

  const name = target?.face || label;
  const left = Math.max(8, Math.min(at.left, window.innerWidth - 256));

  return createPortal(
    <>
      <div className="gather-peek-backdrop" onClick={onClose} />
      <div
        className="gather-peek"
        style={{ position: "fixed", left, top: at.top + 4, zIndex: 80 }}
        onPointerDown={(e) => e.stopPropagation()}
        onClick={(e) => e.stopPropagation()}
      >
        {!target ? (
          <div className="gather-peek-gone">…</div>
        ) : target.gone ? (
          <div className="gather-peek-gone">this bit was removed</div>
        ) : (
          <>
            {target.type === "text" ? (
              <p className="gather-peek-text">{target.snippet || name || "empty note"}</p>
            ) : (
              <>
                <div className="gather-peek-glimpse">
                  {target.imageUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={target.imageUrl} alt="" />
                  ) : target.drawing ? (
                    <PeekDoodle drawing={target.drawing} />
                  ) : null}
                </div>
                {name && <div className="gather-peek-name">{name}</div>}
              </>
            )}
            <button
              type="button"
              className="gather-peek-open"
              onClick={() => {
                onClose();
                router.push(`/bit/${refId}`);
              }}
            >
              open →
            </button>
          </>
        )}
      </div>
    </>,
    document.body,
  );
}

// A doodle glimpse fit ratio-true inside the peek's box (like the picker mini).
function PeekDoodle({ drawing }: { drawing: Drawing }) {
  const { bw, bh } = useMemo(() => {
    const b = strokesBounds(drawing.strokes);
    const w = Math.max(1, b.maxX);
    const h = Math.max(1, b.maxY);
    const s = Math.min(200 / w, 160 / h);
    return { bw: Math.max(8, Math.round(w * s)), bh: Math.max(8, Math.round(h * s)) };
  }, [drawing]);
  return (
    <span className="gather-peek-doodle" style={{ width: bw, height: bh }}>
      <DoodleBit drawing={drawing} />
    </span>
  );
}
