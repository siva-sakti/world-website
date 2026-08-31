"use client";

import { useState } from "react";
import { TagBar } from "@/app/board/[id]/tag-bar";
import type { Tag } from "@/lib/db/tags";

// A light tag affordance for an inbox card (Stage 3): glance the bit's tags, and
// tap "＋ tag" to open the full picker inline. The workspace (/bit/[id]) is for
// heavy editing — the inbox stays a pile you route, so collapsed we show only the
// current chips (static) + one small button; opening mounts the shared TagBar
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
      {initialTags.map((t) => (
        <span key={t.id} className="tag-chip">
          {t.word}
        </span>
      ))}
      <button type="button" className="inbox-tag-add" onClick={() => setOpen(true)}>
        ＋ tag
      </button>
    </div>
  );
}
