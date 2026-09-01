import Link from "next/link";
import type { Surface } from "@/lib/surfaces";

// WHERE YOU WERE — the last few surfaces the owner OPENED, newest first
// (plan `recent-section-plan.md`). Home could already say what you MADE
// ("recently modified"); this says where you WENT — read a board and move
// nothing, and nothing else remembers you were there.
//
// Deliberately lighter than the desk above it: the desk is what you CHOSE to
// keep alive, this is incidental. Plain text links, no tiles, no timestamps —
// the ORDER is the information, and `ago()` bottoms out at "today", so every
// row would read the same anyway.
export function WhereYouWere({ recent }: { recent: Surface[] }) {
  if (recent.length === 0) return null; // nothing yet → no section, not an empty box

  return (
    <section className="mb-10">
      <h2 className="desk-h">where you were</h2>
      <ul className="trail">
        {recent.map((s) => (
          <li key={`${s.kind}-${s.id}`}>
            <Link href={s.href} className="trail-link">
              <span className="trail-name">{s.title}</span>
              <span className="trail-kind">{s.kind}</span>
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}
