import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { listManagedTags } from "@/lib/db/tags";
import { logout } from "@/app/login/actions";
import { TagManager } from "./tag-manager";

export const dynamic = "force-dynamic";

export default async function TagsPage() {
  const supabase = await createClient();
  const tags = await listManagedTags(supabase);

  return (
    <main className="mx-auto max-w-2xl px-6 py-10">
      <header className="mb-6 flex items-baseline justify-between text-sm">
        <div className="flex items-baseline gap-5">
          <Link href="/" className="underline underline-offset-4 hover:no-underline">
            ← boards
          </Link>
          <Link href="/find" className="text-neutral-500 underline underline-offset-4 hover:no-underline">
            find
          </Link>
          <span className="font-semibold">tags</span>
        </div>
        <form action={logout}>
          <button className="text-neutral-500 underline underline-offset-4 hover:no-underline">
            sign out
          </button>
        </form>
      </header>

      <p className="mb-6 text-sm text-neutral-500">
        Your whole vocabulary. Click a word to rename it (every use follows), merge two into
        one, or prune what you don&rsquo;t need — counts include anything in the trash.
      </p>

      <TagManager initial={tags} />
    </main>
  );
}
