"use client";

import { useEffect, useRef, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { listInbox, type InboxItem } from "@/lib/db/inbox";
import { signedUrl } from "@/lib/storage";

// The loose-notes column (call-in plan §6, stage ①): your inbox, reachable from
// inside a board. Collapsed to a tab by default; open it, click a loose note, and
// the board brings it in where you're looking. Search + filters arrive in stages 2–3.

function faceOf(it: InboxItem): string {
  if (it.type === "text")
    return (it.body ?? "").replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim();
  if (it.type === "image") return it.file_name ?? "image";
  return "drawing";
}

export function LooseColumn({
  onBringIn,
  refreshSignal,
}: {
  onBringIn: (bit: InboxItem) => Promise<void>;
  refreshSignal: number;
}) {
  const [supabase] = useState(() => createClient());
  const [open, setOpen] = useState(false);
  const [notes, setNotes] = useState<InboxItem[] | null>(null); // null = not loaded yet
  const [thumbs, setThumbs] = useState<Map<string, string>>(new Map());
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const loadId = useRef(0);
  const colRef = useRef<HTMLElement>(null);

  // Keep wheel events inside the column — the board's native wheel listener (an
  // ancestor) would otherwise zoom the canvas while you scroll the pile.
  useEffect(() => {
    const el = colRef.current;
    if (!el) return;
    const stop = (e: WheelEvent) => e.stopPropagation();
    el.addEventListener("wheel", stop);
    return () => el.removeEventListener("wheel", stop);
  }, [open]);

  async function load() {
    const my = ++loadId.current;
    setLoading(true);
    setError(null);
    try {
      const items = await listInbox(supabase);
      if (my !== loadId.current) return;
      setNotes(items);
      // Sign image thumbs (fresh ~1h URLs) so the column shows real previews.
      const imgs = items.filter((i) => i.type === "image" && (i.thumb_path || i.storage_path));
      const pairs = await Promise.all(
        imgs.map(async (i) => {
          try {
            return [i.id, await signedUrl(supabase, (i.thumb_path ?? i.storage_path)!)] as const;
          } catch {
            return null;
          }
        }),
      );
      if (my !== loadId.current) return;
      setThumbs(new Map(pairs.filter(Boolean) as (readonly [string, string])[]));
    } catch {
      if (my === loadId.current) setError("Couldn't load your loose notes.");
    } finally {
      if (my === loadId.current) setLoading(false);
    }
  }

  // Load when first opened, and whenever the board signals the loose set changed
  // (a card was removed → it's loose again) while the column is open.
  useEffect(() => {
    if (open) load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, refreshSignal]);

  async function bring(bit: InboxItem) {
    setNotes((ns) => (ns ? ns.filter((n) => n.id !== bit.id) : ns));
    try {
      await onBringIn(bit);
    } catch {
      // Bring-in failed — put it back where it was (newest-first).
      setNotes((ns) =>
        ns ? [bit, ...ns].sort((a, b) => (a.created_at < b.created_at ? 1 : -1)) : ns,
      );
    }
  }

  if (!open) {
    return (
      <button className="loose-tab" onClick={() => setOpen(true)} title="Your loose notes">
        loose notes
      </button>
    );
  }

  return (
    <aside className="loose-col" ref={colRef}>
      <div className="loose-col-head">
        <span>loose notes{notes ? ` (${notes.length})` : ""}</span>
        <button className="loose-col-close" onClick={() => setOpen(false)} title="collapse">
          ×
        </button>
      </div>
      {loading && !notes && <p className="loose-col-msg">Loading…</p>}
      {error && (
        <p className="loose-col-msg">
          {error}{" "}
          <button className="underline" onClick={load}>
            retry
          </button>
        </p>
      )}
      {notes && notes.length === 0 && <p className="loose-col-msg">Nothing loose right now.</p>}
      {notes && notes.length > 0 && (
        <ul className="loose-list">
          {notes.map((it) => (
            <li key={it.id}>
              <button className="loose-card" onClick={() => bring(it)} title="place on this board">
                {it.type === "image" && thumbs.get(it.id) ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img className="loose-thumb" src={thumbs.get(it.id)} alt="" />
                ) : (
                  <span className="loose-face">{faceOf(it) || "…"}</span>
                )}
                {it.source && <span className="loose-from">from {it.source.name}</span>}
              </button>
            </li>
          ))}
        </ul>
      )}
    </aside>
  );
}
