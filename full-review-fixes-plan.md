# The full code review → the fix plan (overnight, owner-authorized 2026-09-01)

**Source:** four adversarial reviews (machinery · data integrity · security · client/architecture),
every finding evidence-cited. **Owner authorization:** "any and all fixes — arrange, plan, check
with an antagonist, enact, verify." **Standing limits tonight:** NO deploy · NO cloud schema
changes (migrations are written + throwaway-proven + QUEUED for the owner's morning paste).

**Overall verdicts:** machinery core (settled/reconcile) sound under six-angle attack · security
boundary sound today (must-do list before accounts) · architecture healthy (B+) · no path found
that deterministically loses owner-authored words. The fixes below close what WAS found.

---

## Batch R1 — machinery correctness (the two HIGHs + the escape hatches)

1. **`flushAll` returns a real promise** (today it fire-and-forgets while `duplicateThis` awaits it
   — the copy can miss the last drag/edit, the exact claim the code makes). `flushAll()` →
   `Promise.all` of the per-id flushes. **The save-guard/pagehide callers stay fire-and-forget**
   (they can't await; unchanged behavior). And `duplicateThis` must also await **in-flight
   creates**: add `pendingCreates(): Promise<void>` (allSettled over the creates map) to
   usePersistence; duplicate awaits both before copying.
2. **`editingId` gets an owner.** Clicking another card while editing strands it (keyboard dead,
   two cards in contradictory states): `select()` clears `editingId` when selection moves off the
   editing card. `createTextCard`'s failure catch also clears it (the ghost-edit instance) **and
   aborts the bit row** (a text create inserts bit THEN placement — a placement-side failure
   otherwise leaves an invisible blank loose bit; data-review L6).
3. **Evaporate's two escape hatches close.** (a) remove/trash on a never-had-content board-born bit
   currently mints a blank loose/trashed bit: the remove acts check `freshEmpty` first and ABORT
   the bit instead (needs pid→bitId noted before the card leaves state — pass `freshEmpty` +
   `abortFresh(pid)` from use-create-doors into use-board-acts, or expose an `isFreshEmpty(pid)` +
   abort door). (b) navigating away mid-edit of a fresh empty bit leaves permanent litter: the
   unmount path (leaveBoard) sweeps `freshEmpty` — abort any still-empty fresh bits.
4. **Per-id write ordering** (the quiet reorder class: a stalled earlier flush lands after a later
   one → DB reverts, reload teleports/reverts): usePersistence gains a per-id promise chain — each
   flush for a key awaits the previous flush for that key. Kills scenarios (a)-(d) outright.
5. Small machinery: marquee measures real heights via data-pid (fitView's fix, same reason) ·
   `bulkUnplace` bumps looseRefresh on FIRST success (not all-landed) · `toggleLock` rollback and
   the group-drag `starts` map key by **bitId** (never renamed by reconcile; placementId can be) ·
   `openSelected` flushes under the settled id (`.then((id) => flushNow(id))`).

## Batch R2 — data integrity

6. **The archive invariant, honestly.** The DB check `bit_archived_not_alive` the code cites DOES
   NOT EXIST (fell out in the resting-state rewrite); the two archive doors diverge (bits.ts
   clears the star; resting.ts/archiveItemAction keeps it). Tonight: **unify app-side** — the
   resting door also clears `pinned_at` on archive (bit AND board), comments corrected to say
   app-enforced. **Queued for morning:** the constraint migration (with a `pinned_at=null`
   backfill for already-archived rows first), throwaway-proven; archive-proofs refreshed to the
   live chain. → needs-owner paste.
7. **Export tells the whole truth.** (a) Page every table with `.range()` loops until a short page
   (the silent 1,000-row cap breaches I-G1). (b) Sign a link bit's `thumb_path` when
   `storage_path` is null (captured-once artifacts, not refetchable). (c) Use `lib/storage`'s
   signedUrl (the one bypass).
8. **Destroy-path sequencing.** `emptyTrash`: CHECK the file-paths read error (abort on failure —
   never delete rows whose file paths were unreadable) and reorder **rows-first-then-files** (a
   failed file-remove leaves an orphan object — the explicitly-accepted lesser evil — instead of
   files-gone-rows-restorable = broken restore). `destroyBit`: same reorder + assert the delete
   touched a row (closes the restore-race that removed a live bit's media).
9. **The `locked_at` sweep** (the new column never met the older paths): `unplaceBit` clears
   `locked_at` (a re-placed card must not arrive frozen by a past life) · `setPlacementLock`
   guards `left_at is null` · `updatePlacement` geometry patches filter `.is("locked_at", null)`
   (the DB now refuses a second device's drag-through; NO 0-row assert here — the silent no-op on
   removed rows is load-bearing for late flushes, comment says so).
10. **Upload doors clean up after themselves** (server link door already does; the five client
    doors don't): image/audio/pdf board doors + both loose-file-intake doors get `removeObjects`
    of their uploaded objects in the create-failure catch.
11. **`abortBitCreate` stops lying**: surface its error; `addToInbox` removes the thumb only after
    a CONFIRMED row abort (else a live link bit loses its card image).
12. **Restore asserts**: `restoreBit`/`restoreBoard` assert the row count like trashBit (a restore
    against an emptied trash must say so, not silently no-op).
13. Smaller: `duplicateBoard` copies `description` + logs (doesn't swallow) a failed cleanup ·
    `listAllBits` pages its bit read AND its placement sub-read past 1,000 (a paged-select helper;
    placed bits misclassified as loose invites wrong bulk acts) · the missing `revalidatePath`
    lines (restore→/bits, trashBoard→/bits, archive→/bits, trashBits board pages) · delete dead
    `countBitsPerGroup` · a comment on `unplaceBit` re: I-L5 connectors (dormant door, remembered).

## Batch R3 — client truth + cheap security

14. **The silent-failure class (six controls):** BitTrash · BitArchive · DestroyButton ·
    EmptyTrashButton · ArchiveButton · UnarchiveButton all get the visible-error pattern the pin
    toggle already uses (the codebase's own written standard).
15. **HEIC dead-latch**: reset the cached loader promise on rejection (one transient failure
    currently bricks HEIC until reload).
16. **`fmt()` hydration mismatch**: pin locale ("en-US") + `timeZone: "UTC"` — server and client
    render identical strings; the /bits-vs-bit-page date disagreement goes too.
17. Truthfulness smalls: the image bit page gets a failure message (audio/pdf have one) · the
    note-drawer's gather guard (`if (!gather.current) return` before the optimistic mark) ·
    intake reloads its suggestion lists after a successful add · localStorage guards in
    home-surfaces + rail (Safari block-all throws; two of four sites drifted from the house
    pattern) · object-URL note: the board doors' `createObjectURL` are one-per-card and live as
    long as the card renders — revoking on unmount would blank live cards; leave with a comment
    (deliberate, bounded).
18. **Security-cheap:** `getUser()` first line of every mutating/fetching server action (the
    before-accounts non-negotiable — do it now, it's free) · `fetchImageBlob` allowlists raster
    types (jpeg|png|webp|gif|avif — no scripted SVG in the bucket) · `next.config` gains
    `X-Content-Type-Options: nosniff` + `Referrer-Policy: strict-origin-when-cross-origin`
    (modest set; CSP deliberately deferred to the guest-page pass).
19. **Derive-don't-duplicate + word drift:** `searchItems` uses the DB's `b.face` (the JS
    re-derivation already disagrees for links; the "face isn't a column" comment is false) · the
    three "whole word by default" comments corrected to the live grammar · the archive tooltips/
    comments that promise "stays findable in find" corrected (I-L8 rules archived OUT of find).

## Batch R4 — structural (last, mechanical, tsc-verified)

20. Hot pages go `Promise.all` (home · /bits · group — the pattern the other pages already use).
21. Shared-control promotion: GroupPicker/PinToggle out of note-card.tsx into
    `src/components/` (they render on four routes); `captureLink` noted as the one two-way dir
    dependency (moving it = a follow-up, not tonight — server-action module moves ripple).

## Deliberately NOT fixed tonight (each with its reason)
- The storage-policies migration + signups check → **needs-owner** (dashboard state only they can
  read/confirm). The archive CHECK migration → **written + proven, needs-owner paste**.
- Signed-thumb 1h expiry in a marathon session (LOW; re-sign-on-error is a design choice) · merge
  races (single-owner, tiny windows, noted) · SSRF intermediate hops (accepted + documented;
  blast radius ≈ nil on Vercel) · tag_counts label drift (model wording, owner's call) ·
  copy-trashed-targets in duplicate (defensible "faithful copy") · search/graph /bit redirect hop.

## Verification per batch
tsc · lint(src) · build · both unit suites · targeted greps proving each class is closed (e.g. no
bare `catch { console.error` in the six controls; no `locale`-less fmt) · the archive migration's
throwaway run. Commits per batch, separately revertable. Deploy + cloud paste queued for morning.

## ANTAGONIST CORRECTIONS (all folded into the build — the plan above is amended by these)
1. **flushAll** must allSettle over the NEW flush promises AND a snapshot of in-flight chain tails
   (fire-time pending-delete means timers-only misses in-flight writes — the headline scenario
   would have survived). Save-guard callers stay fire-and-forget; unmount cleanup wrapped `void`.
2. **The per-id chain is keyed POST-reconcile** (register after `await settled()`, keyed by the
   real id) — else the reorder class survives a call-in revive. Tail stored settled-safe.
3. **Evaporate wiring**: reorder useCreateDoors ABOVE useBoardActs (dependency graphs disjoint —
   no ref bridge needed); pass `isFreshEmpty`/`clearFresh`; the acts abort inline via the snapped
   CardVM. **The sweep is unmount-ONLY inside use-create-doors** — riding the save-guard would
   abort live cards on tab-hide (rejected). Fresh-empty trash skips the "restorable" confirm; no
   looseRefresh bump on aborts. Hard tab-close litter stays (commented, accepted).
4. **destroyBit/emptyTrash use DELETE…RETURNING** (paths from the returning set) — closes the
   bulk-path restore race the read-then-delete shape left open; no separate read to fail.
   emptyTrash order: bit delete → remove bit files → board delete.
5. **The lock guard scopes to x/y only** (`.is("locked_at",null)` when the patch has x or y) —
   the blanket filter would break click-to-front, send-to-back, and auto-widen on locked cards.
6. **Archive**: the pinned_at clear lives INSIDE setResting (one line, both tables, every door);
   bits.ts archiveBit collapses onto the resting door (keeps its assert); the queued migration
   covers bit AND board + backfills both.
7. **Export paging** adds `.order("id")` (stable pages) + `createSignedUrls` batched ~100;
   the listAllBits paging helper also CHUNKS `.in()` lists (~200 ids — URL-length limit).
8. **getUser()** as one `requireUser()` helper; login/logout EXCLUDED; honest note: it's a
   network call (~doubles the per-action auth cost — acceptable single-owner, `getClaims()` is
   the future cheap upgrade). fmt() pins UTC tonight; "UTC or your timezone?" → needs-owner.
   select() editingId clear guarded `placementId !== editingId`. Marquee measures ONCE at
   drag-start (60fps layout thrash avoided). bulkUnplace bumps first-success AND all-settled.
