import type { SupabaseClient } from "@supabase/supabase-js";
import type { Bit, Placement } from "@/lib/types";

// Data access for bits and their placements. A bit is independent; a placement
// positions it on a board. Deleting a placement never deletes the bit (SPEC I3).

/** Create a text bit and place it on a board. */
export async function createTextBit(
  supabase: SupabaseClient,
  args: { boardId: string; text: string; x?: number; y?: number },
): Promise<{ bit: Bit; placement: Placement }> {
  const { data: bit, error: bitErr } = await supabase
    .from("bits")
    .insert({ type: "text", text: args.text })
    .select("*")
    .single();
  if (bitErr) throw bitErr;

  const { data: placement, error: placeErr } = await supabase
    .from("placements")
    .insert({
      board_id: args.boardId,
      bit_id: bit.id,
      x: args.x ?? 40,
      y: args.y ?? 40,
      w: 300,
      h: 160,
    })
    .select("*")
    .single();
  if (placeErr) throw placeErr;

  return { bit, placement };
}

export async function updatePlacement(
  supabase: SupabaseClient,
  id: string,
  patch: Partial<Pick<Placement, "x" | "y" | "w" | "h" | "z">>,
): Promise<void> {
  const { error } = await supabase.from("placements").update(patch).eq("id", id);
  if (error) throw error;
}

export async function updateBitText(
  supabase: SupabaseClient,
  id: string,
  text: string,
): Promise<void> {
  const { error } = await supabase.from("bits").update({ text }).eq("id", id);
  if (error) throw error;
}

/** Remove a placement from its board. The bit itself survives (SPEC I3). */
export async function deletePlacement(
  supabase: SupabaseClient,
  id: string,
): Promise<void> {
  const { error } = await supabase.from("placements").delete().eq("id", id);
  if (error) throw error;
}
