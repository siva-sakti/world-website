"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { createBoard, trashBoard, restoreBoard, destroyBoard, emptyTrash } from "@/lib/db/boards";
import { restoreBit, destroyBit } from "@/lib/db/bits";

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

/** DESTROY one trashed thing permanently (I-L10/I-L6). The db layer guards it to
 *  trashed-only; the double-confirm lives in the UI (this is the point of no return). */
export async function destroyItemAction(thing: "bit" | "board", id: string) {
  const supabase = await createClient();
  if (thing === "board") await destroyBoard(supabase, id);
  else await destroyBit(supabase, id);
  revalidatePath("/trash");
  revalidatePath("/");
}

/** Empty the entire trash — destroy every trashed thing (I-L2). */
export async function emptyTrashAction() {
  const supabase = await createClient();
  await emptyTrash(supabase);
  revalidatePath("/trash");
  revalidatePath("/");
}
