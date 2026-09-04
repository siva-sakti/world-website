// "WHICH BOARDS IS THIS BIT ON?" — the one definition.
//
// It was answered three different ways. The inbox filtered out trashed and archived
// boards; getBitBoards did not, and getBitBoards is what the TRASH CONFIRM reads — so
// the dialog for the app's most destructive act could tell you "this is on 2 boards"
// when one of them was sitting in the trash. A confirm stating something false is worse
// than no confirm.
//
// The rule, once: a bit is ON a board when its placement is still present (`left_at` is
// null) AND that board is LIVE. A trashed or archived board renders nothing, so a
// membership on it is not a membership you could see — the same reasoning as
// `board_cards`, which is the render rule for the other direction.

/** The embed both callers need. The FK is named because a placement links to `board`
 *  twice (`board_id` = the board it sits on; `target_board_id` = a board placed AS a
 *  card) and an unnamed embed is ambiguous. We always want the board it sits on. */
export const MEMBERSHIP_SELECT = "board:board!placement_board_id_fkey(id, title, state)";

export type BoardRef = { id: string; title: string | null };

/** The board a placement row sits on, or null when that board is not live. */
export function liveBoardOf(row: { board?: unknown }): BoardRef | null {
  const b = row.board as { id: string; title: string | null; state: string } | null | undefined;
  if (!b || b.state !== "live") return null;
  return { id: b.id, title: b.title };
}
