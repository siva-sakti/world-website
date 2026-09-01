"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { requireUser } from "@/lib/supabase/require-user";
import { createBoard, trashBoard, restoreBoard, destroyBoard, emptyTrash } from "@/lib/db/boards";
import { restoreBit, destroyBit } from "@/lib/db/bits";
import { archiveBit, unarchiveBit, archiveBoard, unarchiveBoard } from "@/lib/db/resting";

/** Create a new (untitled) board and open it. */
export async function newBoard() {
  const supabase = await createClient();
  await requireUser(supabase);
  const board = await createBoard(supabase, null);
  redirect(`/board/${board.id}`);
}

/** Trash a board (a freeze; restorable). Its bits are untouched. */
export async function trashBoardAction(formData: FormData) {
  const id = String(formData.get("id"));
  const supabase = await createClient();
  await requireUser(supabase);
  await trashBoard(supabase, id);
  revalidatePath("/");
  revalidatePath("/bits"); // its bits may now read as loose there
}

/** Restore a trashed bit from the trash listing. */
export async function restoreBitAction(formData: FormData) {
  const id = String(formData.get("id"));
  const supabase = await createClient();
  await requireUser(supabase);
  await restoreBit(supabase, id);
  revalidatePath("/trash");
  revalidatePath("/bits"); // the restored bit reappears loose (or on its boards)
  revalidatePath("/");
}

/** Restore a trashed board from the trash listing. */
export async function restoreBoardAction(formData: FormData) {
  const id = String(formData.get("id"));
  const supabase = await createClient();
  await requireUser(supabase);
  await restoreBoard(supabase, id);
  revalidatePath("/trash");
  revalidatePath("/");
}

/** DESTROY one trashed thing permanently (I-L10/I-L6). The db layer guards it to
 *  trashed-only; the double-confirm lives in the UI (this is the point of no return). */
export async function destroyItemAction(thing: "bit" | "board", id: string) {
  const supabase = await createClient();
  await requireUser(supabase);
  if (thing === "board") await destroyBoard(supabase, id);
  else await destroyBit(supabase, id);
  revalidatePath("/trash");
  revalidatePath("/");
}

/** Empty the entire trash — destroy every trashed thing (I-L2). */
export async function emptyTrashAction() {
  const supabase = await createClient();
  await requireUser(supabase);
  await emptyTrash(supabase);
  revalidatePath("/trash");
  revalidatePath("/");
}

/** Archive a thing — set aside (hide-but-keep, its own area); reversible, never deletes. */
export async function archiveItemAction(thing: "bit" | "board", id: string) {
  const supabase = await createClient();
  await requireUser(supabase);
  if (thing === "board") await archiveBoard(supabase, id);
  else await archiveBit(supabase, id);
  revalidatePath("/");
  revalidatePath("/archive");
  revalidatePath("/bits"); // an archived bit leaves the loose pile too
}

/** Un-archive — return a thing to the world, exactly where it was. */
export async function unarchiveItemAction(thing: "bit" | "board", id: string) {
  const supabase = await createClient();
  await requireUser(supabase);
  if (thing === "board") await unarchiveBoard(supabase, id);
  else await unarchiveBit(supabase, id);
  revalidatePath("/");
  revalidatePath("/archive");
}
