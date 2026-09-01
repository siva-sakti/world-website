"use client";

import type { SupabaseClient } from "@supabase/supabase-js";
import { applyTag, removeTag } from "@/lib/db/tags";
import { setBitSourceId, type Source } from "@/lib/db/sources";
import type { CardVM } from "./card";
import type { useUndo } from "./use-undo";

// The MEANING acts' recording layer (undo plan §6) — dark until stage 5. Tags and
// sources are GLOBAL (they change the bit on every board and in search) while the
// stack is per-board-visit — the labels say so honestly ("everywhere").
//
// The bars keep their own state and their own write styles (stage 4 records, it
// does NOT convert policies — behavior-identical holds). Reverses write the DB,
// patch the card VM where it carries copies (the source stamp), and bump the
// per-bit refresh signal so mounted bars refetch — the reverse can repaint a
// component it doesn't own (the boundary hunt's D5/risk-5 answer).

export function useMeaningActs(deps: {
  supabase: SupabaseClient;
  cardsRef: React.RefObject<CardVM[]>;
  record: ReturnType<typeof useUndo>["record"];
  setCards: React.Dispatch<React.SetStateAction<CardVM[]>>;
  bumpMeta: () => void; // the refresh signal the bars refetch on
}) {
  const { supabase, cardsRef, record, setCards, bumpMeta } = deps;

  /** A removed-then-reapplied tag can come back under a FRESH id (the word was
   *  renamed/merged/deleted in the manager meanwhile — narrow, named, accepted).
   *  The mutable box carries the CURRENT id across undo/redo cycles so each
   *  reverse targets the row that actually exists. */
  function recordTagAdd(bitId: string, tag: { id: string; word: string }) {
    const box = { id: tag.id };
    record(
      `tag “${tag.word}” (everywhere)`,
      [bitId],
      async () => {
        // Undo of add = remove. If the add CREATED the word, this strands a
        // zero-count word in suggestions — accepted (deleting vocabulary as an
        // undo side effect would violate "destroy never"; ruled default).
        await removeTag(supabase, { bitId, tagId: box.id });
        bumpMeta();
      },
      async () => {
        const t = await applyTag(supabase, { bitId, word: tag.word }); // idempotent, re-finds by word
        box.id = t.id;
        bumpMeta();
      },
    );
  }

  function recordTagRemove(bitId: string, tag: { id: string; word: string }) {
    const box = { id: tag.id };
    record(
      `untag “${tag.word}” (everywhere)`,
      [bitId],
      async () => {
        const t = await applyTag(supabase, { bitId, word: tag.word }); // id-stable while the word survives
        box.id = t.id;
        bumpMeta();
      },
      async () => {
        await removeTag(supabase, { bitId, tagId: box.id });
        bumpMeta();
      },
    );
  }

  /** Source set/clear. `prev`/`next` are the FULL Source objects (not ids — the
   *  card VM carries its own name/url stamp and an id can't repaint it; the
   *  boundary hunt's D5). Reverses go through the narrow by-id door — exactly
   *  reversible, no find-or-create side effects. */
  function recordSourceChange(bitId: string, prev: Source | null, next: Source | null) {
    if ((prev?.id ?? null) === (next?.id ?? null)) return; // picking the same source is not an act
    const apply = async (src: Source | null) => {
      await setBitSourceId(supabase, bitId, src?.id ?? null);
      const cur = cardsRef.current?.find((c) => c.bitId === bitId);
      if (cur) {
        setCards((cs) =>
          cs.map((c) =>
            c.bitId === bitId ? { ...c, sourceName: src?.name, sourceUrl: src?.url ?? undefined } : c,
          ),
        );
      }
      bumpMeta();
    };
    record(
      next ? `set source “${next.name}” (everywhere)` : "clear source (everywhere)",
      [bitId],
      () => apply(prev),
      () => apply(next),
    );
  }

  return { recordTagAdd, recordTagRemove, recordSourceChange };
}
