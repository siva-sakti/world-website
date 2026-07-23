"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { createBoard, trashBoard, restoreBoard } from "@/lib/db/boards";
import { restoreBit } from "@/lib/db/bits";

/** Create a new (untitled) board and open it. */
export async function newBoard() {
  const supabase = await createClient();
  const board = await createBoard(supabase, null);
  redirect(`/board/${board.id}`);
}

/** Trash a board (a freeze; restorable). Its bits are untouched. */
export async function trashBoardAction(formData: FormData) {
  const id = String(formData.get("id"));
  const supabase = await createClient();
  await trashBoard(supabase, id);
  revalidatePath("/");
}

/** Restore a trashed bit from the trash listing. */
export async function restoreBitAction(formData: FormData) {
  const id = String(formData.get("id"));
  const supabase = await createClient();
  await restoreBit(supabase, id);
  revalidatePath("/trash");
}

/** Restore a trashed board from the trash listing. */
export async function restoreBoardAction(formData: FormData) {
  const id = String(formData.get("id"));
  const supabase = await createClient();
  await restoreBoard(supabase, id);
  revalidatePath("/trash");
  revalidatePath("/");
}
