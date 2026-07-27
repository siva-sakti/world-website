import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { listManagedSources } from "@/lib/db/sources";
import { logout } from "@/app/login/actions";

export const dynamic = "force-dynamic";

export default async function SourcesPage() {
  const supabase = await createClient();
  const sources = await listManagedSources(supabase);

  return (
    <main className="mx-auto max-w-2xl px-6 py-10">
      <header className="mb-6 flex items-baseline justify-between text-sm">
        <div className="flex items-baseline gap-5">
          <Link href="/" className="underline underline-offset-4 hover:no-underline">
            ← boards
          </Link>
          <Link href="/inbox" className="text-neutral-500 underline underline-offset-4 hover:no-underline">
            inbox
          </Link>
          <Link href="/find" className="text-neutral-500 underline underline-offset-4 hover:no-underline">
            find
          </Link>
          <Link href="/tags" className="text-neutral-500 underline underline-offset-4 hover:no-underline">
            tags
          </Link>
          <span className="font-semibold">sources</span>
        </div>
        <form action={logout}>
          <button className="text-neutral-500 underline underline-offset-4 hover:no-underline">
            sign out
          </button>
        </form>
      </header>

      <p className="mb-6 text-sm text-neutral-500">
        Your reading list — every source you&rsquo;ve noted from, most-used first. Open one to
        see everything from it.
      </p>

      {sources.length === 0 ? (
        <p className="text-neutral-500">
          No sources yet — set a source on a bit&rsquo;s page (its &ldquo;from …&rdquo;), and it
          shows up here.
        </p>
      ) : (
        <ul className="divide-y divide-neutral-100">
          {sources.map((s) => (
            <li key={s.id} className="flex items-baseline justify-between gap-4 py-3">
              <Link href={`/source/${s.id}`} className="hover:underline underline-offset-4">
                {s.name}
              </Link>
              <span className="flex shrink-0 items-baseline gap-3">
                {s.url && (
                  <a
                    href={s.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs text-[#365a8c] hover:underline"
                    title="open source"
                  >
                    ↗
                  </a>
                )}
                <span className="text-xs text-neutral-400">
                  {s.count} {s.count === 1 ? "bit" : "bits"}
                </span>
              </span>
            </li>
          ))}
        </ul>
      )}
    </main>
  );
}
