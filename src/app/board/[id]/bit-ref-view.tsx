"use client";

import { NodeViewWrapper, type NodeViewProps } from "@tiptap/react";
import { useEffect, useMemo, useState } from "react";
import { createPortal } from "react-dom";
import { createClient } from "@/lib/supabase/client";
import { signedUrl } from "@/lib/storage";
import { normalizeDrawing, strokesBounds } from "@/lib/stroke";
import { DoodleBit } from "./doodle-bit";
import type { Drawing, Stroke } from "@/lib/types";

// The gather chip's LOOK (gather-picker-plan.md, stage 3). A chip pointing at an
// image or drawing shows a tiny THUMBNAIL inline — a picture, not the word
// "untitled" — and taps open a PEEK of it larger. A chip pointing at a note (or one
// still loading / whose target is gone) stays the plain word chip, exactly as G2.
//
// Display ONLY: this NodeView never changes what is saved. `BitRef.renderHTML` still
// serializes `<span data-ref="id">label</span>` (the id is truth, the label a search
// cache — the P9 carve), so extractRefIds, reconcile, search_tsv, and export are all
// untouched. The thumbnail is resolved from the target's id at render time and cached.

type Media =
  | { kind: "image"; url: string }
  | { kind: "drawing"; drawing: Drawing }
  | { kind: "text" };

// Resolve a target id to what the chip should show, cached per id so many chips and
// re-renders don't refetch. A signed image URL lasts ~1h — fine for a note session.
const cache = new Map<string, Promise<Media>>();

function resolveMedia(refId: string): Promise<Media> {
  const hit = cache.get(refId);
  if (hit) return hit;
  const p = (async (): Promise<Media> => {
    const supabase = createClient();
    const { data, error } = await supabase
      .from("bit")
      .select("type, thumb_path, storage_path, strokes, deleted_at")
      .eq("id", refId)
      .maybeSingle();
    if (error || !data || data.deleted_at) return { kind: "text" };
    if (data.type === "image" && (data.thumb_path || data.storage_path)) {
      try {
        const url = await signedUrl(supabase, (data.thumb_path ?? data.storage_path) as string);
        return { kind: "image", url };
      } catch {
        return { kind: "text" };
      }
    }
    if (data.type === "drawing") {
      // The column holds the object shape { strokes, sizes, colors } (or an old bare
      // array) — normalizeDrawing reads both; only a real, non-empty drawing peeks.
      const drawing = normalizeDrawing(data.strokes);
      if (drawing.strokes.length > 0) return { kind: "drawing", drawing };
    }
    return { kind: "text" };
  })();
  cache.set(refId, p);
  return p;
}

export function BitRefView({ node, editor }: NodeViewProps) {
  const refId = node.attrs.refId as string | null;
  const label = (node.attrs.label as string) || "?";
  const [media, setMedia] = useState<Media>({ kind: "text" });
  const [peek, setPeek] = useState(false);

  useEffect(() => {
    if (!refId) return;
    let alive = true;
    resolveMedia(refId).then((m) => alive && setMedia(m));
    return () => {
      alive = false;
    };
  }, [refId]);

  // A text target (or still loading / gone) → the plain word chip, unchanged from G2.
  if (media.kind === "text") {
    return (
      <NodeViewWrapper as="span" className="gather-chip">
        {label}
      </NodeViewWrapper>
    );
  }

  // Peek is a READING affordance. While editing, let the click select the atom (so
  // you can delete it) rather than opening a modal over your writing.
  const openPeek = (e: React.MouseEvent) => {
    if (editor.isEditable) return;
    e.preventDefault();
    e.stopPropagation();
    setPeek(true);
  };

  return (
    <NodeViewWrapper as="span" className="gather-chip-thumb" onClick={openPeek} title={label}>
      {media.kind === "image" ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={media.url} alt={label} draggable={false} />
      ) : (
        <ChipDoodle drawing={media.drawing} />
      )}
      {peek && <Peek media={media} onClose={() => setPeek(false)} />}
    </NodeViewWrapper>
  );
}

function ratioOf(strokes: Stroke[]): number {
  const b = strokesBounds(strokes);
  return Math.max(1, b.maxX) / Math.max(1, b.maxY);
}

// The inline doodle chip — DoodleBit at line height, sized to the ink ratio (via
// aspect-ratio) so preserveAspectRatio="none" fills it without stretching.
function ChipDoodle({ drawing }: { drawing: Drawing }) {
  const ratio = useMemo(() => ratioOf(drawing.strokes), [drawing]);
  return (
    <span className="gather-chip-doodle" style={{ aspectRatio: ratio }}>
      <DoodleBit drawing={drawing} />
    </span>
  );
}

// Peek — the media larger, over a dim scrim. Click anywhere or press Escape closes.
function Peek({ media, onClose }: { media: Media; onClose: () => void }) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);
  if (typeof document === "undefined") return null;
  return createPortal(
    <div
      className="gather-peek-scrim"
      onClick={onClose}
      onPointerDown={(e) => e.stopPropagation()}
    >
      <div className="gather-peek" onClick={(e) => e.stopPropagation()}>
        {media.kind === "image" ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={media.url} alt="" />
        ) : media.kind === "drawing" ? (
          <PeekDoodle drawing={media.drawing} />
        ) : null}
      </div>
    </div>,
    document.body,
  );
}

function PeekDoodle({ drawing }: { drawing: Drawing }) {
  const ratio = useMemo(() => ratioOf(drawing.strokes), [drawing]);
  return (
    <span className="gather-peek-doodle" style={{ aspectRatio: ratio }}>
      <DoodleBit drawing={drawing} />
    </span>
  );
}
