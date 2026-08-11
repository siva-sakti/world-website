import Link from "next/link";
import { QuickWrite } from "./quick-write";

// Dynamic like every authed page — prerendering would run the browser-client
// factory without runtime env (build-time crash) and there's nothing static here.
export const dynamic = "force-dynamic";

// "Just write" (writing-experience-plan v1.1) — a quiet full-page writer, separate
// from arranging. What you write is born LOOSE (a note in your notes, no board);
// place it on a board later, or never. Auth comes from the proxy wall like every
// other page; the client component owns the create-on-first-content flow.
export default function WritePage() {
  return (
    <main className="mx-auto max-w-2xl px-6 py-10">
      <header className="mb-6 flex items-baseline justify-between text-sm">
        <Link href="/" className="underline underline-offset-4 hover:no-underline">
          ← boards
        </Link>
        <span className="text-neutral-400">
          saves to{" "}
          <Link href="/inbox" className="underline underline-offset-4 hover:no-underline">
            your notes
          </Link>
        </span>
      </header>
      <QuickWrite />
    </main>
  );
}
