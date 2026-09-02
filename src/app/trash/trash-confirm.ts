import { confirm } from "@/components/confirm";
import { trashConfirmMessage } from "./trash-message";

// THE TRASH CONFIRM — one door, every trash path, mirroring archive-confirm.ts.
//
// To change what trashing ASKS → edit trash-message.ts (its wording is under test).
// To stop trashing asking AT ALL → make this return Promise.resolve(true).
// Either way it is one edit and every path follows — which is the whole point (owner,
// 2026-09-02: "if I decide I want to remove the confirmation, it should remove it in all
// places — that's what I mean by reusing and modular code").
//
// `danger: true` (the red treatment) lives here too, so "is trashing scary-looking?" is
// also answered once. Archive deliberately does NOT pass it: archive is reversible and
// quiet, trash is the heavy act.

export { trashConfirmMessage };

/** Ask before trashing. The single place that answers "does trashing ask?" */
export function confirmTrash(args: {
  count?: number;
  noun?: string;
  onBoards?: number;
  shared?: number;
}): Promise<boolean> {
  return confirm({ message: trashConfirmMessage(args), confirmLabel: "Trash", danger: true });
}
