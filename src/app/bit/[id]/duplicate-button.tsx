"use client";

import { useRouter } from "next/navigation";
import { duplicateBitAction } from "@/app/bits/actions";
import { useAct, FailedNote } from "@/components/use-act";

// DUPLICATE THIS BIT, off a board. The copy is LOOSE — no board is showing it, so it has
// no position to have, which is exactly what loose means (owner ruled duplication should
// work outside a board too).
//
// It goes TO the copy afterwards: you asked for a second one, and the reason is almost
// always that you want to change it. Landing on the original would leave you wondering
// whether anything happened.
export function DuplicateBit({ bitId, noun = "bit" }: { bitId: string; noun?: string }) {
  const router = useRouter();
  const { busy, failed, run } = useAct({ keepBusyOnSuccess: true }); // it navigates away

  return (
    <span>
      <button
        className="text-neutral-500 underline underline-offset-4 hover:no-underline disabled:opacity-50"
        disabled={busy}
        onClick={() =>
          void run(async () => {
            const res = await duplicateBitAction(bitId);
            if (res.error || !res.bitId) throw new Error(res.error ?? "duplicate failed");
            router.push(`/bit/${res.bitId}`);
          })
        }
        title="Make a copy — its own bit, with its own file; changing or trashing one leaves the other alone"
      >
        {busy ? "duplicating…" : `duplicate this ${noun}`}
      </button>
      <FailedNote failed={failed} />
    </span>
  );
}
