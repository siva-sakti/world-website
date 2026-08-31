import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { listBoards } from "@/lib/db/boards";
import { listAllBits } from "@/lib/db/inbox";
import { toOutline } from "@/lib/outline";
import { OutlineView } from "./outline-view";

export const dynamic = "force-dynamic";

// OUTLINE — a scannable, non-spatial lens on the whole world: every board as a
// collapsible header with the bits & notes placed on it, plus loose/unplaced.
// Thin server shell (mirrors graph/page.tsx): two existing reads → invert → hand
// to the client. NO new queries, NO new db fns, NO schema change. listAllBits is
// NOT kind-filtered here, so notes appear alongside bits.
export default async function OutlinePage() {
  const supabase = await createClient();
  // The two reads are independent — run them together so the round-trips
  // overlap instead of stacking (shape unchanged; toOutline joins them below).
  const [boards, items] = await Promise.all([
    listBoards(supabase),
    listAllBits(supabase),
  ]);
  const outline = toOutline(boards, items);

  return (
    <main className="mx-auto max-w-4xl px-6 py-10">
      <header className="mb-6 flex items-baseline justify-between">
        <span className="text-sm font-semibold">outline</span>
      </header>

      <p className="mb-4 text-sm text-neutral-500">
        Your whole world as a list — every board and what&rsquo;s placed on it, plus what&rsquo;s
        still loose. Search, filter, and scan; click through to open anything.
      </p>

      {boards.length === 0 && items.length === 0 ? (
        <p className="text-neutral-500">
          Nothing yet — make your first board, or{" "}
          <Link href="/write" className="underline underline-offset-4 hover:no-underline">
            ✎ write something
          </Link>
          .
        </p>
      ) : (
        <OutlineView outline={outline} />
      )}
    </main>
  );
}
