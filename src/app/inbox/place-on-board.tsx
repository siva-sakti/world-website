"use client";

import { useState } from "react";
import { placeOnBoard } from "./actions";

// Door B (call-in plan §2/⑤): from the inbox, send a loose note to a board. A quiet
// "place on…" dropdown of your live boards; picking one lands the note there (blind —
// its "fit" frames it) and revalidate drops it from the pile. Same callInBit underneath.
export function PlaceOnBoard({
  bitId,
  boards,
}: {
  bitId: string;
  boards: { id: string; title: string | null }[];
}) {
  const [pending, setPending] = useState(false);
  const [err, setErr] = useState(false);

  if (boards.length === 0) return null;

  async function pick(boardId: string) {
    if (!boardId || pending) return;
    setPending(true);
    setErr(false);
    const res = await placeOnBoard(bitId, boardId);
    setPending(false);
    if (res.error) setErr(true);
    // On success, revalidatePath re-renders the inbox without this note.
  }

  return (
    <select
      className="inbox-card-place"
      value=""
      disabled={pending}
      onChange={(e) => pick(e.target.value)}
      title="place on a board"
      aria-label="Place on a board"
    >
      <option value="">{err ? "try again…" : pending ? "placing…" : "place on…"}</option>
      {boards.map((b) => (
        <option key={b.id} value={b.id}>
          {b.title || "untitled board"}
        </option>
      ))}
    </select>
  );
}
