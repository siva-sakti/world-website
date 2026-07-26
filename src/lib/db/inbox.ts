import type { SupabaseClient } from "@supabase/supabase-js";
import type { Bit } from "@/lib/types";

// The inbox = the loose pile (D-100). A bit is loose when it is live AND no board
// actually shows it — computed by the `the_inbox` view (security_invoker; the
// exact render conjunction board_cards uses, plus the bit's own deleted_at).
// Reads only: a loose bit is BORN by creating a bit with no placement
// (createLooseTextBit / createBookmarkBit), or RETURNS here when un-placed from
// its last board. Newest-first.
export async function listInbox(supabase: SupabaseClient): Promise<Bit[]> {
  const { data, error } = await supabase
    .from("the_inbox")
    .select("*")
    .order("created_at", { ascending: false });
  if (error) throw error;
  return (data ?? []) as Bit[];
}
