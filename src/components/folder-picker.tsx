"use client";

import type { ShelfGroup } from "@/lib/db/shelf";
import { promptText } from "@/components/confirm";

// THE one folder picker (V4 broom — the Shelf and the bit cards each had their
// own copy). Presentational: the parent owns the db write; this owns the menu
// and the "+ new group…" prompt. onPick(null) = un-shelve; onPick(name-string
// via onNew) = create-then-assign, parent's job.
export function FolderPicker({
  value,
  groups,
  busy,
  title,
  onPick,
  onNew,
}: {
  value: string | null;
  groups: ShelfGroup[];
  busy: boolean;
  title: string;
  onPick: (groupId: string | null) => void;
  onNew: (name: string) => void;
}) {
  async function change(v: string) {
    if (v === "__new__") {
      const name = await promptText({ message: "New group", placeholder: "name the section…" });
      if (name && name.trim()) onNew(name.trim());
      return;
    }
    onPick(v === "" ? null : v);
  }
  return (
    <select
      className="shelf-picker"
      value={value ?? ""}
      disabled={busy}
      onChange={(e) => change(e.target.value)}
      aria-label="group"
      title={title}
    >
      <option value="">no group</option>
      {groups.map((g) => (
        <option key={g.id} value={g.id}>{g.name}</option>
      ))}
      <option value="__new__">+ new group…</option>
    </select>
  );
}
