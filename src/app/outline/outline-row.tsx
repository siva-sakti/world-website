import Link from "next/link";
import type { PanelBit } from "@/lib/db/inbox";
import { bitLabel } from "@/lib/labels";

// A single outline entry — READ-ONLY (no place/pin/trash doors; those live on the
// board & inbox surfaces). Marker · face/title · link to its page · source · tags.
// A note opens /note/[id], a bit /bit/[id]; the marker stays kind-neutral (type).
export function OutlineRow({ item }: { item: PanelBit }) {
  const href = item.kind === "note" ? `/note/${item.id}` : `/bit/${item.id}`;
  const marker = item.type === "drawing" ? "sketch" : item.type;
  const label = item.content?.trim() || item.face?.trim() || null;

  return (
    <li className="notes-row">
      <span className="inbox-card-kind-tag">{marker}</span>
      <Link href={href} className="notes-row-title" title="open">
        {label ? <span>{label}</span> : <span className="notes-row-empty">{bitLabel(item.type, null)}</span>}
      </Link>
      {item.source && (
        <Link href={`/source/${item.source.id}`} className="notes-row-source" title="everything from this source">
          from {item.source.name}
        </Link>
      )}
      {item.tags.length > 0 && (
        <span className="inbox-card-tags">
          {item.tags.map((t) => (
            <span key={t.id} className="tag-chip">
              {t.word}
            </span>
          ))}
        </span>
      )}
    </li>
  );
}
