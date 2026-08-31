import { createClient } from "@/lib/supabase/server";
import { listManagedTags } from "@/lib/db/tags";
import { TagManager } from "./tag-manager";

export const dynamic = "force-dynamic";

export default async function TagsPage() {
  const supabase = await createClient();
  const tags = await listManagedTags(supabase);

  return (
    <main className="mx-auto max-w-2xl px-6 py-10">
      <header className="mb-6 flex items-baseline justify-between">
        <span className="text-sm font-semibold">tags</span>
      </header>

      <p className="mb-6 text-sm text-neutral-500">
        Your whole vocabulary. Click a word to rename it (every use follows), merge two into
        one, or prune what you don&rsquo;t need — counts include anything in the trash.
      </p>

      <TagManager initial={tags} />
    </main>
  );
}
