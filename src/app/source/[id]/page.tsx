import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getSource } from "@/lib/db/sources";
import { bitsFromSource } from "@/lib/db/find";
import { bitLabel } from "@/lib/labels";

export const dynamic = "force-dynamic";

export default async function SourcePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();

  const source = await getSource(supabase, id);
  if (!source) notFound();
  const bits = await bitsFromSource(supabase, id);

  return (
    <main className="mx-auto max-w-3xl px-6 py-10">
      <header className="mb-6 flex items-baseline justify-between text-sm">
        <span className="font-semibold text-neutral-400">source</span>
      </header>

      <p className="text-xs uppercase tracking-wide text-neutral-400">source</p>
      <h1 className="mt-1 flex items-baseline gap-2 text-2xl font-semibold tracking-tight">
        {source.name}
        {source.url && (
          <a
            href={source.url}
            target="_blank"
            rel="noopener noreferrer"
            className="text-base font-normal text-[#365a8c] hover:underline"
            title="open source"
          >
            ↗
          </a>
        )}
      </h1>

      <p className="mt-2 mb-4 text-sm text-neutral-500">
        {bits.length === 0
          ? "everything from this source"
          : `${bits.length} ${bits.length === 1 ? "bit" : "bits"} from this source, newest first`}
      </p>

      {bits.length === 0 ? (
        <p className="text-neutral-500">
          Nothing from this source yet — set it on a bit&rsquo;s page (its &ldquo;from …&rdquo;).
        </p>
      ) : (
        <ul className="divide-y divide-neutral-100">
          {bits.map((b) => (
            <li key={b.id} className="flex items-baseline justify-between gap-4 py-3">
              <Link
                href={`/bit/${b.id}`}
                className={`hover:underline underline-offset-4 ${b.face ? "" : "italic text-neutral-500"}`}
              >
                {bitLabel(b.type, b.face)}
              </Link>
              <span className="flex shrink-0 items-baseline gap-2">
                {b.tags.map((t) => (
                  <Link key={t.id} href={`/find?tag=${t.id}`} className="tag-chip">
                    {t.word}
                  </Link>
                ))}
                <span className="text-xs text-neutral-400">{b.type}</span>
              </span>
            </li>
          ))}
        </ul>
      )}
    </main>
  );
}
