"use client";

import Link from "next/link";
import { useState } from "react";
import { TagBar } from "@/app/board/[id]/tag-bar";
import type { Tag } from "@/lib/db/tags";

// A light tag affordance for an inbox card (Stage 3): glance the bit's tags, and
// tap "＋ tag" to open the full picker inline. The workspace (/bit/[id]) is for
// heavy editing — the inbox stays a pile you route, so collapsed we show only the
// current chips (each word a PULL link) + one small button; opening mounts TagBar
// (add / remove / suggest), no card becomes a dense editor until you ask.
export function InboxTags({
  bitId,
  initialTags,
}: {
  bitId: string;
  initialTags: Tag[];
}) {
  const [open, setOpen] = useState(false);
  if (open) return <TagBar target={{ bitId }} />;

  return (
    <div className="inbox-card-tags">
      {/* The word pulls (F1) — these were inert text, so a tag on a bit card was the
          one place the gesture did nothing at all. Removing still lives inside the
          full TagBar, one tap away via ＋ tag. */}
      {initialTags.map((t) => (
        <Link key={t.id} href={`/search?tag=${t.id}`} className="tag-chip" title={`everything tagged “${t.word}”`}>
          {t.word}
        </Link>
      ))}
      <button type="button" className="inbox-tag-add" onClick={() => setOpen(true)}>
        ＋ tag
      </button>
    </div>
  );
}
