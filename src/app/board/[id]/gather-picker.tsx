"use client";

import { useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import type { SupabaseClient } from "@supabase/supabase-js";
import { signedUrl } from "@/lib/storage";
import { normalizeDrawing, strokesBounds } from "@/lib/stroke";
import { DoodleBit } from "./doodle-bit";
import { computePlacement, type Placement } from "@/lib/floating";
import type { BitHit } from "@/lib/db/references";

// The `[[` gather picker — a SMART ORGANIZED dropdown (gather-picker-plan.md).
// Two sections split by TYPE: `notes` (text, found by their words) on top, and
// `images & drawings` (found by sight, as thumbnails) below. Typing narrows each;
// a section with no matches collapses — and because most doodles/screenshots have
// no caption to match, typing words is really a note search, so the images row
// steps aside to a slim "N images — tap to browse" line (your pictures stay one tap
// away) rather than vanishing. The only bit excluded is a truly empty note.
// Floats at the cursor, portaled (board zoom can't move it), flips up when there's
// no room below. Tap to select. Pure display — nothing here writes.

type Anchor = { left: number; caretTop: number; caretBottom: number };

const NOTES_CAP = 6; // a few notes, then scroll
const THUMBS_CAP = 24; // a browsable row, then scroll
const THUMB_H = 44; // thumbnail height (px); drawings fit a THUMB box, ratio-true

export function GatherPicker({
  supabase,
  candidates,
  query,
  anchor,
  onPick,
}: {
  supabase: SupabaseClient;
  candidates: BitHit[];
  query: string;
  anchor: Anchor;
  onPick: (hit: BitHit) => void;
}) {
  const q = query.trim().toLowerCase();

  // Split by TYPE first (unambiguous — a captioned screenshot is still an image, so
  // it stays with the pictures). Notes drop a truly-empty face; media always shows.
  const notes = useMemo(
    () => candidates.filter((c) => c.type === "text" && c.face.trim() !== ""),
    [candidates],
  );
  const visual = useMemo(
    () => candidates.filter((c) => c.type === "image" || c.type === "drawing"),
    [candidates],
  );

  const match = (c: BitHit) => c.face.toLowerCase().includes(q);
  const notesShown = (q ? notes.filter(match) : notes).slice(0, NOTES_CAP);
  const visualMatches = q ? visual.filter(match) : visual;

  // Tapping "N images — browse" opens the row FOR THE CURRENT QUERY; typing more
  // changes q, so it re-collapses on its own (no reset effect, no cascading render).
  const [openFor, setOpenFor] = useState<string | null>(null);
  const imagesOpen = openFor === q;
  const collapsedImages = q !== "" && !imagesOpen && visualMatches.length === 0 && visual.length > 0;
  const visualShown = (!q || imagesOpen ? visual : visualMatches).slice(0, THUMBS_CAP);

  // "no bits match" only when there's genuinely nothing — no note matches AND no
  // images at all (if images exist, the row or its slim line always shows).
  const empty = notesShown.length === 0 && visual.length === 0;

  // Lazy-sign only the image thumbnails actually rendered (never the whole list).
  const [thumbs, setThumbs] = useState<Map<string, string>>(new Map());
  const need = visualShown.filter(
    (c) => c.type === "image" && (c.thumbPath || c.storagePath) && !thumbs.has(c.id),
  );
  const needKey = need.map((c) => c.id).join(",");
  useEffect(() => {
    if (!needKey) return;
    let alive = true;
    Promise.all(
      need.map(async (c) => {
        try {
          return [c.id, await signedUrl(supabase, (c.thumbPath ?? c.storagePath)!)] as const;
        } catch {
          return null;
        }
      }),
    ).then((pairs) => {
      if (!alive) return;
      const good = pairs.filter(Boolean) as (readonly [string, string])[];
      if (good.length) setThumbs((m) => new Map([...m, ...good]));
    });
    return () => {
      alive = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [needKey]);

  // Screen-edge-aware placement (the shared placer): flip up when the bottom is
  // tight, slide so no side is cut off, cap+scroll if too tall. Measured before paint
  // (useLayoutEffect), guarded so it settles rather than loops.
  const menuRef = useRef<HTMLDivElement>(null);
  const [place, setPlace] = useState<Placement>({
    left: anchor.left,
    top: anchor.caretBottom + 4,
    maxHeight: 240,
  });
  useLayoutEffect(() => {
    const el = menuRef.current;
    if (!el) return;
    const p = computePlacement(
      { left: anchor.left, top: anchor.caretTop, right: anchor.left, bottom: anchor.caretBottom },
      { width: el.offsetWidth, height: el.offsetHeight },
    );
    setPlace((prev) =>
      prev.left === p.left && prev.top === p.top && prev.maxHeight === p.maxHeight ? prev : p,
    );
  }, [anchor.left, anchor.caretTop, anchor.caretBottom, notesShown.length, visualShown.length, collapsedImages, empty]);

  if (typeof document === "undefined") return null;

  return createPortal(
    <div
      ref={menuRef}
      className="gather-suggest"
      style={{ position: "fixed", left: place.left, top: place.top, maxHeight: place.maxHeight, zIndex: 60 }}
      onPointerDown={(e) => e.stopPropagation()}
    >
      {empty ? (
        <div className="gather-suggest-empty">no bits match</div>
      ) : (
        <>
          {notesShown.length > 0 && (
            <div className="gather-sect">
              <div className="gather-sect-head">notes</div>
              {notesShown.map((h) => (
                <button
                  key={h.id}
                  type="button"
                  className="gather-suggest-item"
                  onMouseDown={(e) => e.preventDefault()} // keep the editor's selection
                  onClick={() => onPick(h)}
                  title="gather this note"
                >
                  <span className="gather-suggest-face">{h.face}</span>
                </button>
              ))}
            </div>
          )}

          {visual.length > 0 && (
            <div className="gather-sect">
              <div className="gather-sect-head">images &amp; drawings</div>
              {collapsedImages ? (
                <button
                  type="button"
                  className="gather-more"
                  onMouseDown={(e) => e.preventDefault()}
                  onClick={() => setOpenFor(q)}
                >
                  {visual.length} image{visual.length === 1 ? "" : "s"} — tap to browse
                </button>
              ) : (
                <div className="gather-thumbs">
                  {visualShown.map((h) => (
                    <button
                      key={h.id}
                      type="button"
                      className="gather-thumb-btn"
                      onMouseDown={(e) => e.preventDefault()}
                      onClick={() => onPick(h)}
                      title={h.face || (h.type === "drawing" ? "drawing" : "image")}
                    >
                      <Thumb hit={h} url={thumbs.get(h.id)} />
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}
        </>
      )}
    </div>,
    document.body,
  );
}

// One thumbnail: an image (signed URL, cover-cropped square) or a drawing (its ink
// rendered ratio-true inside a THUMB_H box — no distortion). A not-yet-signed image
// is a quiet placeholder box until its URL lands.
function Thumb({ hit, url }: { hit: BitHit; url?: string }) {
  if (hit.type === "drawing" && hit.strokes) {
    return <DrawingThumb raw={hit.strokes} />;
  }
  if (hit.type === "image" && url) {
    // eslint-disable-next-line @next/next/no-img-element
    return <img className="gather-thumb gather-thumb-img" src={url} alt="" />;
  }
  return <span className="gather-thumb gather-thumb-blank" />;
}

// A drawing mini: normalize the stored strokes first (the column holds the object
// shape { strokes, sizes, colors }, or an old bare array — normalizeDrawing reads
// both), then reuse DoodleBit sized to the ink's native ratio so its
// preserveAspectRatio="none" fills the box without stretching. Fit inside a THUMB_H
// box (like "meet") so nothing exceeds the row height.
function DrawingThumb({ raw }: { raw: unknown }) {
  const drawing = useMemo(() => normalizeDrawing(raw), [raw]);
  const { w, h } = useMemo(() => {
    const b = strokesBounds(drawing.strokes);
    return { w: Math.max(1, b.maxX), h: Math.max(1, b.maxY) };
  }, [drawing]);
  if (drawing.strokes.length === 0) {
    return <span className="gather-thumb gather-thumb-blank" />;
  }
  const scale = Math.min((THUMB_H * 1.6) / w, THUMB_H / h); // box up to 1.6:1
  const bw = Math.max(8, Math.round(w * scale));
  const bh = Math.max(8, Math.round(h * scale));
  return (
    <span className="gather-thumb gather-thumb-doodle" style={{ width: bw, height: bh }}>
      <DoodleBit drawing={drawing} />
    </span>
  );
}
