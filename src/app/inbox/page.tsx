import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { listInbox } from "@/lib/db/inbox";
import { signedUrl } from "@/lib/storage";
import { logout } from "@/app/login/actions";
import { quickAdd, trashFromInbox } from "./actions";
import type { Bit } from "@/lib/types";

export const dynamic = "force-dynamic";

function domainOf(url: string | null): string | null {
  if (!url) return null;
  try { return new URL(url).hostname.replace(/^www\./, ""); } catch { return null; }
}
const faviconOf = (domain: string) =>
  `https://www.google.com/s2/favicons?domain=${encodeURIComponent(domain)}&sz=64`;

export default async function InboxPage() {
  const supabase = await createClient();
  const bits = await listInbox(supabase);

  // Resolve display images for image bits + any bookmark previews (later slices).
  const imageUrl = new Map<string, string>();
  await Promise.all(
    bits.map(async (b) => {
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
        </div>
        <form action={logout}>
          <button className="text-sm text-neutral-500 underline underline-offset-4 hover:no-underline">sign out</button>
        </form>
      </header>

      <p className="mb-4 text-sm text-neutral-500">
        Your loose pile — anything not on a board yet. Catch it here; arrange it later.
      </p>

      {/* Quick-add: one box. A pasted link becomes a bookmark; anything else, a note. */}
      <form action={quickAdd} className="inbox-quickadd">
        <input
          name="text"
          className="inbox-quickadd-input"
          placeholder="Paste a link, or jot a note…"
          autoComplete="off"
          aria-label="Add to inbox"
        />
        <button className="compose-btn is-primary" type="submit">add</button>
      </form>

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
              <InboxCard key={b.id} bit={b} img={imageUrl.get(b.id)} />
            ))}
          </ul>
        </>
      )}
    </main>
  );
}

function InboxCard({ bit, img }: { bit: Bit; img?: string }) {
  const domain = domainOf(bit.url);
  const title = bit.face; // content ?? captured_title ?? url (for a bookmark), first words (text)

  return (
    <li className={`inbox-card inbox-card--${bit.type}`}>
      <Link href={`/bit/${bit.id}`} className="inbox-card-body" title="open">
        {bit.type === "image" || (bit.type === "bookmark" && img) ? (
          img ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={img} alt={title ?? ""} className="inbox-card-media" />
          ) : (
            <span className="inbox-card-media inbox-card-media--empty">image</span>
          )
        ) : bit.type === "bookmark" ? (
          <span className="inbox-card-bookmark">
            {domain && (
              <span className="inbox-card-site">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={faviconOf(domain)} alt="" className="inbox-card-favicon" />
                {domain}
              </span>
            )}
            <span className="inbox-card-title">{title ?? bit.url}</span>
          </span>
        ) : bit.type === "drawing" ? (
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

      <div className="inbox-card-foot">
        {bit.type === "bookmark" && bit.url ? (
          <a href={bit.url} target="_blank" rel="noopener noreferrer" className="inbox-card-open">open ↗</a>
        ) : (
          <span className="inbox-card-kind-tag">{bit.type}</span>
        )}
        <form action={trashFromInbox}>
          <input type="hidden" name="id" value={bit.id} />
          <button className="inbox-card-trash" title="move to trash" aria-label="move to trash">trash</button>
        </form>
      </div>
    </li>
  );
}
