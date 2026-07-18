"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { createBoard } from "@/lib/db/boards";

/** Create a new (untitled) board and open it. */
export async function newBoard() {
  const supabase = await createClient();
  const board = await createBoard(supabase, null);
  redirect(`/board/${board.id}`);
}
