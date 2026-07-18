"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { createTextBit } from "@/lib/db/bits";
import type { Bit, Board, PlacedBit } from "@/lib/types";

// v1 board: renders bits at their stored positions and can add a text bit.
// Drag / resize / rotate (dnd-kit + react-rnd), undo, and viewport scaling are
// the next step — deliberately not built until the DB is running so they can be
// verified rather than guessed (see PROGRESS.md).
export function BoardSurface({
  board,
  placed,
}: {
  board: Board;
  placed: PlacedBit[];
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [busy, setBusy] = useState(false);

  async function addText() {
    setBusy(true);
    try {
      const supabase = createClient();
      await createTextBit(supabase, { boardId: board.id, text: "new note" });
      startTransition(() => router.refresh());
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="mx-auto max-w-5xl">
      <div className="mb-4">
        <button
          onClick={addText}
          disabled={busy || pending}
          className="text-sm underline underline-offset-4 hover:no-underline disabled:opacity-50"
        >
          add text
        </button>
      </div>

      <div
        className="relative border border-neutral-200"
        style={{ width: board.width, minHeight: 640 }}
      >
        {placed.length === 0 && (
          <p className="p-6 text-neutral-500">Empty board — add a text bit.</p>
        )}
        {placed.map((p) => (
          <div
            key={p.id}
            className="absolute rounded-sm border border-neutral-200 bg-white p-3 text-sm"
            style={{
              // unplaced (collection-mode) placements render at origin for now;
              // the collection view is queue item 6
              left: p.x ?? 0,
              top: p.y ?? 0,
              width: p.w,
              minHeight: p.h,
            }}
          >
            <BitView bit={p.bit} />
          </div>
        ))}
      </div>
    </div>
  );
}

function BitView({ bit }: { bit: Bit }) {
  if (bit.type === "text") {
    return <div className="whitespace-pre-wrap">{bit.text || "…"}</div>;
  }
  return <div className="text-neutral-400">[{bit.type}]</div>;
}
