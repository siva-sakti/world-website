import { confirm } from "@/components/confirm";
import { archiveConfirmMessage } from "./archive-message";

// THE ARCHIVE CONFIRM — one door, every archive path.
//
// Owner ruling (2026-09-02), and the reason this exists rather than a second copy of the
// sentence: *"if these are calling for the same confirmation, shouldn't they be wired so
// that if I decide I want to remove the confirmation for archiving, it removes it in all
// places?"* Yes. Both doors — the single ArchiveButton and the bulk act on /bits — come
// through here.
//
// To change what archiving ASKS → edit archive-message.ts (its wording is under test).
// To stop archiving asking AT ALL → make this return Promise.resolve(true).
// Either way it is one edit, and every archive path follows.

export { archiveConfirmMessage };

/** Ask before archiving. The single place that answers "does archiving ask?" */
export function confirmArchive(args: {
  count?: number;
  noun?: string;
  onBoards?: number;
}): Promise<boolean> {
  return confirm({ message: archiveConfirmMessage(args), confirmLabel: "Archive" });
}
