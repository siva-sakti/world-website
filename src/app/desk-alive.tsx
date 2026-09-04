import Link from "next/link";
import type { Surface } from "@/lib/surfaces";
import { Stamp } from "@/components/stamp";

// THE DESK — what's ALIVE right now, on top of home (the few you're working on).
// A linear list for now; the spatial ⇄ list toggle arrives with the spatial desk
// (its own phase). Curated by the owner's hand (★); the complete list lives below.
export function DeskAlive({ alive }: { alive: Surface[] }) {
  return (
    <section className="mb-10">
      <h2 className="desk-h">alive right now</h2>
      {alive.length === 0 ? (
        <p className="text-sm text-neutral-500">
          Nothing marked alive yet — tap ★ on a board or note you&rsquo;re working on, and it greets
          you here.
        </p>
      ) : (
        <div className="desk-tiles">
          {alive.map((t) => (
            <Link
              key={`${t.kind}-${t.id}`}
              href={t.href}
              className={`desk-tile${t.kind === "note" ? " is-note" : ""}`}
            >
              <span className="desk-tile-kind">{t.kind}</span>
              <span className="desk-tile-name">{t.title}</span>
              <span className="desk-tile-meta">
                {t.kind === "board" ? "touched" : "edited"} <Stamp iso={t.modified_at} relative />
              </span>
            </Link>
          ))}
        </div>
      )}
    </section>
  );
}
