import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { listManagedSources } from "@/lib/db/sources";
import { logout } from "@/app/login/actions";
import { SourceManager } from "./source-manager";

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
        Your reading list — every source you&rsquo;ve noted from, most-used first. Click a name to
        rename it (every note follows), give it a link, merge two into one, or delete one — its
        notes stay, they just lose the &ldquo;from …&rdquo; stamp. Open a count to see everything
        from that source.
      </p>

      <SourceManager initial={sources} />
    </main>
  );
}
