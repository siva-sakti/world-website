"use client";

import { useState } from "react";
import { placeOnBoard } from "./actions";
import { SearchablePicker } from "@/components/searchable-picker";

// Door B (call-in plan §2/⑤): from the inbox, send a loose note to a board. A quiet
// "place on…" dropdown of your live boards; picking one lands the note there (blind —
// its "fit" frames it) and revalidate drops it from the pile. Same callInBit underneath.
export function PlaceOnBoard({
  bitId,
  boards,
  onPlaced,
}: {
  bitId: string;
  boards: { id: string; title: string | null }[];
  onPlaced?: (boardId: string, boardTitle: string | null) => void; // the LIST hosts the "sent ✓ · open it"
  // banner — this card unmounts on the revalidate that drops the now-placed bit, so it can't host it itself.
}) {
  const [pending, setPending] = useState(false);
  const [err, setErr] = useState(false);

  if (boards.length === 0) return null;

  async function pick(boardId: string) {
    if (!boardId || pending) return;
    setPending(true);
    setErr(false);
    try {
      const res = await placeOnBoard(bitId, boardId);
      if (res.error) setErr(true);
      else onPlaced?.(boardId, boards.find((b) => b.id === boardId)?.title ?? null);
      // On success, revalidatePath re-renders the notes page without this note.
    } catch {
      setErr(true); // network rejection — without this, `pending` sticks forever
    } finally {
      setPending(false);
    }
  }

  return (
    <SearchablePicker
      options={boards.map((b) => ({ id: b.id, label: b.title || "untitled board" }))}
      onPick={pick}
      placeholder={err ? "try again…" : pending ? "placing…" : "place on…"}
      disabled={pending}
    />
  );
}
