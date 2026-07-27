import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { listInbox, type InboxItem } from "@/lib/db/inbox";
import { listBoards } from "@/lib/db/boards";
import { signedUrl } from "@/lib/storage";
import { logout } from "@/app/login/actions";
import { trashFromInbox } from "./actions";
import { Intake } from "./intake";
import { InboxTags } from "./inbox-tags";
import { PlaceOnBoard } from "./place-on-board";

export const dynamic = "force-dynamic";

export default async function InboxPage() {
  const supabase = await createClient();
  const bits = await listInbox(supabase);
  const boards = (await listBoards(supabase)).map((b) => ({ id: b.id, title: b.title }));

  // Resolve display images for image bits (thumb preferred, full as a fallback).
  const imageUrl = new Map<string, string>();
  await Promise.all(
    bits.map(async (b) => {
      if (b.type !== "image") return;
      const path = b.thumb_path ?? b.storage_path;
      if (!path) return;
      try { imageUrl.set(b.id, await signedUrl(supabase, path)); } catch { /* skip */ }
    }),
  );

  return (
    <main className="mx-auto max-w-5xl px-6 py-10">
      <header className="mb-6 flex items-baseline justify-between">
        <div className="flex items-baseline gap-5 text-sm">
          <Link href="/" className="underline underline-offset-4 hover:no-underline">← boards</Link>
          <span className="font-semibold">inbox</span>
          <Link href="/find" className="text-neutral-500 underline underline-offset-4 hover:no-underline">find</Link>
          <Link href="/tags" className="text-neutral-500 underline underline-offset-4 hover:no-underline">tags</Link>
          <Link href="/sources" className="text-neutral-500 underline underline-offset-4 hover:no-underline">sources</Link>
        </div>
        <form action={logout}>
          <button className="text-sm text-neutral-500 underline underline-offset-4 hover:no-underline">sign out</button>
        </form>
      </header>

      <p className="mb-4 text-sm text-neutral-500">
        Your loose pile — anything not on a board yet. Catch it here; arrange it later.
      </p>

      {/* Intake: pick a source (sticky across adds), jot pieces under it — each a
          loose text bit carrying that source. A pasted link stays a clickable-link
          note; "as a quote" formats it as a blockquote. Full editing → the workspace. */}
      <Intake />

      {bits.length === 0 ? (
        <p className="mt-10 text-neutral-500">
          Nothing loose right now. Paste a link or jot a note above, and it lands here.
        </p>
      ) : (
        <>
          <p className="mt-7 mb-3 text-sm text-neutral-500">
            {bits.length} {bits.length === 1 ? "loose bit" : "loose bits"}, newest first
          </p>
          <ul className="inbox-grid">
            {bits.map((b) => (
              <InboxCard key={b.id} item={b} img={imageUrl.get(b.id)} boards={boards} />
            ))}
          </ul>
        </>
      )}
    </main>
  );
}

function InboxCard({
  item,
  img,
  boards,
}: {
  item: InboxItem;
  img?: string;
  boards: { id: string; title: string | null }[];
}) {
  const title = item.face; // first words (text) · label (drawing) · content (image)
  const source = item.source;

  return (
    <li className={`inbox-card inbox-card--${item.type}`}>
      {/* Open → the workspace, where full editing / tagging / source live. */}
      <Link href={`/bit/${item.id}`} className="inbox-card-body" title="open">
        {item.type === "image" ? (
          img ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={img} alt={title ?? ""} className="inbox-card-media" />
          ) : (
            <span className="inbox-card-media inbox-card-media--empty">image</span>
          )
        ) : item.type === "drawing" ? (
          <span className="inbox-card-note inbox-card-note--drawing">
            <span className="inbox-card-kind">✎ sketch</span>
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

      {/* Meta — provenance + a light tag affordance. Interactive, so OUTSIDE the
          open-link (a bit's "from …" travels with it, P8). */}
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
        <InboxTags bitId={item.id} initialTags={item.tags} />
      </div>

      <div className="inbox-card-foot">
        <span className="inbox-card-kind-tag">{item.type}</span>
        <span className="inbox-card-actions">
          <PlaceOnBoard bitId={item.id} boards={boards} />
          <form action={trashFromInbox}>
            <input type="hidden" name="id" value={item.id} />
            <button className="inbox-card-trash" title="move to trash" aria-label="move to trash">trash</button>
          </form>
        </span>
      </div>
    </li>
  );
}
