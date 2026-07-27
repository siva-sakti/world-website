"use client";

import { useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { editSource, mergeSources, deleteSource, type ManagedSource } from "@/lib/db/sources";

// The source manager (mirrors the tag manager, §3e — single-valued): rename +
// re-URL a source in place (id-referenced, every note follows — I-Src3), merge
// two into one (bits re-stamped), delete (notes survive, lose only the stamp —
// I-Src4). Editing targets one field at a time; both save through editSource.
type Editing = { id: string; field: "name" | "url" } | null;

export function SourceManager({ initial }: { initial: ManagedSource[] }) {
  const [sources, setSources] = useState<ManagedSource[]>(initial);
  const [editing, setEditing] = useState<Editing>(null);
  const [draft, setDraft] = useState("");
  const [note, setNote] = useState<string | null>(null);
  const [supabase] = useState(() => createClient());

  const isEditing = (id: string, field: "name" | "url") =>
    editing?.id === id && editing.field === field;

  // A destructive confirm states its FULL loss — frozen carriers included (I-T2):
  // merge/delete reach trashed notes exactly like live ones.
  function carriers(s: ManagedSource): string {
    const parts = [`${s.count} ${s.count === 1 ? "note" : "notes"}`];
    if (s.trash > 0) parts.push(`${s.trash} in the trash`);
    return parts.join(" + ");
  }

  function begin(id: string, field: "name" | "url", value: string) {
    setEditing({ id, field });
    setDraft(value);
  }

  async function saveEdit(s: ManagedSource, field: "name" | "url") {
    const val = draft.trim();
    const name = field === "name" ? val : s.name;
    const url = field === "url" ? val : s.url;
    // No change → just close, nothing to save.
    if ((field === "name" && (!val || val === s.name)) || (field === "url" && val === (s.url ?? ""))) {
      setEditing(null);
      return;
    }
    try {
      await editSource(supabase, s.id, name, url);
      setSources((xs) =>
        xs.map((x) => (x.id === s.id ? { ...x, name, url: url?.trim() || null } : x)),
      );
      setEditing(null); // close only after a successful save
    } catch (e) {
      const code = (e as { code?: string })?.code;
      setNote(
        code === "23505"
          ? `“${name}” already exists — use “merge into” instead.`
          : "Couldn't save that source.",
      );
      // keep the field open so the typed value survives the error
    }
  }

  async function doMerge(from: ManagedSource, intoId: string) {
    const into = sources.find((s) => s.id === intoId);
    if (!into) return;
    if (
      !confirm(
        `Merge “${from.name}” into “${into.name}”? Its ${carriers(from)} become “${into.name}”. This can't be undone.`,
      )
    )
      return;
    try {
      await mergeSources(supabase, from.id, into.id);
      setSources((xs) =>
        xs
          .filter((s) => s.id !== from.id)
          .map((s) =>
            s.id === into.id
              ? { ...s, count: s.count + from.count, trash: s.trash + from.trash }
              : s,
          ),
      );
      setNote(`Merged “${from.name}” into “${into.name}”.`);
    } catch {
      setNote("Couldn't merge those sources.");
    }
  }

  async function doDelete(s: ManagedSource) {
    if (
      !confirm(
        `Delete this source? Its ${carriers(s)} ${s.count + s.trash === 1 ? "stays" : "stay"} — they just lose the “from …” stamp.`,
      )
    )
      return;
    try {
      await deleteSource(supabase, s.id);
      setSources((xs) => xs.filter((x) => x.id !== s.id));
      setNote(`Deleted “${s.name}”.`);
    } catch {
      setNote("Couldn't delete that source.");
    }
  }

  if (sources.length === 0) {
    return (
      <p className="text-neutral-500">
        {"No sources yet — set a source on a bit's page (its “from …”), and it shows up here."}
      </p>
    );
  }

  const fieldClass =
    "border-b border-neutral-300 bg-transparent outline-none focus:border-neutral-900";

  return (
    <div>
      {note && (
        <p className="mb-4 text-sm text-neutral-600">
          {note}{" "}
          <button className="underline" onClick={() => setNote(null)}>
            ok
          </button>
        </p>
      )}
      <ul className="divide-y divide-neutral-100">
        {sources.map((s) => (
          <li key={s.id} className="py-3">
            <div className="flex flex-wrap items-baseline justify-between gap-3">
              <span className="flex items-baseline gap-3">
                {isEditing(s.id, "name") ? (
                  <input
                    autoFocus
                    value={draft}
                    onChange={(e) => setDraft(e.target.value)}
                    onBlur={() => saveEdit(s, "name")}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") saveEdit(s, "name");
                      if (e.key === "Escape") setEditing(null);
                    }}
                    className={`w-48 ${fieldClass}`}
                  />
                ) : (
                  <button
                    className="font-medium hover:underline underline-offset-4"
                    title="rename"
                    onClick={() => begin(s.id, "name", s.name)}
                  >
                    {s.name}
                  </button>
                )}
                <Link
                  href={`/source/${s.id}`}
                  className="text-xs text-neutral-400 hover:underline underline-offset-4"
                >
                  {s.count} {s.count === 1 ? "bit" : "bits"}
                </Link>
              </span>
              <span className="flex items-baseline gap-3 text-sm">
                <select
                  value=""
                  onChange={(e) => e.target.value && doMerge(s, e.target.value)}
                  className="border-b border-neutral-200 bg-transparent text-neutral-500 outline-none"
                  title="merge into another source"
                >
                  <option value="">merge into…</option>
                  {sources
                    .filter((o) => o.id !== s.id)
                    .map((o) => (
                      <option key={o.id} value={o.id}>
                        {o.name}
                      </option>
                    ))}
                </select>
                <button
                  onClick={() => doDelete(s)}
                  className="text-neutral-400 underline underline-offset-4 hover:text-red-700"
                >
                  delete
                </button>
              </span>
            </div>
            <div className="mt-1 flex items-baseline gap-2 text-xs">
              {isEditing(s.id, "url") ? (
                <input
                  autoFocus
                  type="url"
                  placeholder="https://…"
                  value={draft}
                  onChange={(e) => setDraft(e.target.value)}
                  onBlur={() => saveEdit(s, "url")}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") saveEdit(s, "url");
                    if (e.key === "Escape") setEditing(null);
                  }}
                  className={`w-72 max-w-full ${fieldClass}`}
                />
              ) : (
                <>
                  <button
                    className="truncate text-neutral-400 hover:text-neutral-700 hover:underline underline-offset-4"
                    title={s.url ? "edit link" : "add a link"}
                    onClick={() => begin(s.id, "url", s.url ?? "")}
                  >
                    {s.url ?? "+ link"}
                  </button>
                  {s.url && (
                    <a
                      href={s.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="shrink-0 text-[#365a8c] hover:underline"
                      title="open source"
                    >
                      ↗
                    </a>
                  )}
                </>
              )}
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
