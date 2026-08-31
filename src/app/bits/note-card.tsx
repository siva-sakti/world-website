"use client";

import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { pinBit, setBitGroup, createGroup, type ShelfGroup } from "@/lib/db/shelf";
import { FolderPicker } from "@/components/folder-picker";
import type { PanelBit } from "@/lib/db/inbox";
import { trashFromInbox } from "./actions";
import { InboxTags } from "./inbox-tags";
import { PlaceOnBoard } from "./place-on-board";

// The quiet folder picker (O1b → V4: one shared control) — a note shelves like a board.
export function GroupPicker({
  bitId,
  groupId,
  groups,
}: {
  bitId: string;
  groupId: string | null;
  groups: ShelfGroup[];
}) {
  const [supabase] = useState(() => createClient());
  const [busy, setBusy] = useState(false);
  const router = useRouter();
  async function run(fn: () => Promise<unknown>) {
    setBusy(true);
    try {
      await fn();
      router.refresh();
    } catch (e) {
      console.error(e);
    } finally {
      setBusy(false);
    }
  }
  return (
    <FolderPicker
      value={groupId}
      groups={groups}
      busy={busy}
      title="which folder"
      onPick={(gid) => run(() => setBitGroup(supabase, bitId, gid))}
      onNew={(name) =>
        run(async () => {
          const g = await createGroup(supabase, name);
          await setBitGroup(supabase, bitId, g.id);
        })
      }
    />
  );
}

// The ★/☆ pin toggle (O1) — shared by the card and the row.
export function PinToggle({ bitId, pinned }: { bitId: string; pinned: boolean }) {
  const [supabase] = useState(() => createClient());
  const [busy, setBusy] = useState(false);
  const router = useRouter();
  return (
    <button
      className="shelf-pin"
      disabled={busy}
      title={pinned ? "no longer alive" : "mark alive — it greets you on home"}
      onClick={async () => {
        setBusy(true);
        try {
          await pinBit(supabase, bitId, !pinned);
          router.refresh();
        } catch (e) {
          console.error(e);
        } finally {
          setBusy(false);
        }
      }}
    >
      {pinned ? "★" : "☆"}
    </button>
  );
}

// One bit in the notes grid (client — the browser filters/sorts around it).
// On the "all" tab (showBoards) a placed bit shows its board links; place-on
// stays LOOSE-ONLY — offering it on a placed bit is the multi-board door,
// deliberately parked (A20).
export function NoteCard({
  item,
  img,
  boards,
  groups,
  showBoards,
}: {
  item: PanelBit;
  img?: string;
  boards: { id: string; title: string | null }[];
  groups: ShelfGroup[];
  showBoards: boolean;
}) {
  const title = item.face; // first words (text) · label (drawing) · content (image)
  const source = item.source;
  const isLoose = item.boards.length === 0;

  return (
    <li className={`inbox-card inbox-card--${item.type}`}>
      {/* Open → the workspace, where full editing / tagging / source live. */}
      <Link href={`/bit/${item.id}`} className="inbox-card-body" title="open">
        {item.type === "image" || item.type === "pdf" ? (
          img ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={img} alt={title ?? ""} className="inbox-card-media" />
          ) : (
            <span className="inbox-card-media inbox-card-media--empty">
              {item.type === "pdf" ? "PDF" : "image"}
            </span>
          )
        ) : item.type === "drawing" ? (
          <span className="inbox-card-note inbox-card-note--drawing">
            <span className="inbox-card-kind">✎ sketch</span>
            {title && <span className="inbox-card-title">{title}</span>}
          </span>
        ) : item.type === "audio" ? (
          <span className="inbox-card-note inbox-card-note--audio">
            <span className="inbox-card-kind">♪ recording</span>
            {title && <span className="inbox-card-title">{title}</span>}
          </span>
        ) : (
          <span className="inbox-card-note">
            {title ? (
              <span className="inbox-card-text">{title}</span>
            ) : (
              <span className="inbox-card-text inbox-card-text--empty">empty note</span>
            )}
          </span>
        )}
      </Link>

      {/* Meta — provenance + tags; on "all", where the bit lives. Interactive,
          so OUTSIDE the open-link (a bit's "from …" travels with it, P8). */}
      <div className="inbox-card-meta">
        {source && (
          <span className="inbox-card-from">
            <Link
              href={`/source/${source.id}`}
              className="inbox-card-from-name"
              title="everything from this source"
            >
              from {source.name}
            </Link>
            {source.url && (
              <a
                href={source.url}
                target="_blank"
                rel="noopener noreferrer"
                className="inbox-card-from-open"
                title="open source"
              >
                ↗
              </a>
            )}
          </span>
        )}
        {showBoards && item.boards.length > 0 && (
          <span className="inbox-card-boards">
            on{" "}
            {item.boards.map((bd, i) => (
              <span key={bd.id}>
                {i > 0 && " · "}
                <Link
                  href={`/board/${bd.id}`}
                  className="inbox-card-board-link"
                  title="open this board"
                >
                  {bd.title || "untitled board"}
                </Link>
              </span>
            ))}
          </span>
        )}
        <InboxTags bitId={item.id} initialTags={item.tags} />
      </div>

      <div className="inbox-card-foot">
        <span className="inbox-card-kind-tag">{item.type === "drawing" ? "sketch" : item.type === "audio" ? "recording" : item.type}</span>
        <span className="inbox-card-actions">
          <GroupPicker bitId={item.id} groupId={item.group_id} groups={groups} />
          <PinToggle bitId={item.id} pinned={Boolean(item.pinned_at)} />
          {isLoose && <PlaceOnBoard bitId={item.id} boards={boards} />}
          <form action={trashFromInbox}>
            <input type="hidden" name="id" value={item.id} />
            <button className="inbox-card-trash" title="move to trash" aria-label="move to trash">trash</button>
          </form>
        </span>
      </div>
    </li>
  );
}
