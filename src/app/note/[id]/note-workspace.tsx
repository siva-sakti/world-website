"use client";

import { useCallback, useRef, useState } from "react";
import { TextWorkspace } from "@/app/bit/[id]/text-workspace";
import { Drawer } from "@/components/drawer";
import { extractRefIds } from "@/lib/db/references";
import type { GatherTarget } from "@/app/board/[id]/text-bit";
import type { PanelBit } from "@/lib/db/inbox";

// The note page's writing + its DRAWER (N4b). The drawer is the browsable second
// door to `[[`: `[[` is for when you know what you want and stay in the sentence;
// the drawer is for when you want to LOOK. Clicking a row drops the chip at your
// caret — the row prevents mousedown's blur so the editor never loses it.
//
// This wrapper exists only to hold the two things the drawer and the editor must
// share: the gather door, and which bits the writing already names.
export function NoteWorkspace({
  bitId,
  initialBody,
}: {
  bitId: string;
  initialBody: string;
}) {
  const gather = useRef<((t: GatherTarget) => void) | null>(null);
  // Which bits this writing already gathers, read from its own `[[` chips through
  // the one helper — so the marks can never disagree with the text.
  const [gatheredIds, setGatheredIds] = useState<Set<string>>(
    () => new Set(extractRefIds(initialBody)),
  );

  const onReady = useCallback((api: { gather: (t: GatherTarget) => void }) => {
    gather.current = api.gather;
  }, []);

  const onSaved = useCallback((html: string) => {
    setGatheredIds(new Set(extractRefIds(html)));
  }, []);

  const onGather = useCallback((bit: PanelBit) => {
    gather.current?.({ id: bit.id, face: bit.face, type: bit.type });
    // Optimistic: the row reads "gathered" immediately; the next save re-derives
    // the true set from the body (which also catches a chip you delete by hand).
    setGatheredIds((s) => new Set(s).add(bit.id));
  }, []);

  return (
    <>
      <div className="page-editor mt-3">
        <TextWorkspace
          bitId={bitId}
          initialBody={initialBody}
          onReady={onReady}
          onSaved={onSaved}
        />
      </div>
      <Drawer
        variant="note"
        excludeId={bitId}
        gatheredIds={gatheredIds}
        onGather={onGather}
      />
    </>
  );
}
