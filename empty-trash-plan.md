# Empty the trash — permanent delete (plan)

**Status: BUILT + deployed (D-125, 2026-08-29).** The app's **first irreversible act**. Implements the already-ruled I-L10 / I-L6 / I-L2 / I-T2 (no new invariant).

## Conceptual
- **Two-stage delete:** **trash** = reversible, hides everywhere (exists today) → **destroy** = permanent, gone forever (this build). Destroy is reachable **only from `/trash`** — you can never destroy a live thing directly; you trash it first.
- **Destroy removes the thing AND everything attached** (its placements, tags, gather ties both ways, travel, connectors, the dormant link — the schema cascades) **AND its stored image files.** **Empty trash** = destroy everything in the trash at once.
- **Double confirm** on every destroy (per-item and empty-all) — two explicit steps, because it can't be undone.
- This is **not** archive. Archive (separate, ruled: hide-but-keep, its own area) is a different feature.

## Checked against the real code
- **Cascade — verified in the migrations:** `tag_application`, `placement`, `connector`, `dormant`, and `reference` (from_ **and** to_bit_id) are all `ON DELETE CASCADE` on bit/board; `bit_travel`/board-cards cascade on board. The reference migration even comments *"gathered into never points at a ghost."* So a single row `DELETE` cleans everything; **no orphans, no FK blocks.** Destroying a bit gathered into a *live* note removes the tie; the note's chip goes stale and self-heals (as designed, I-Ref8).
- **RLS — verified:** every `*_owner_all` policy is `for all`, so the owner may hard-delete.
- **Storage — verified:** image bits carry `storage_path` + `thumb_path` in `PRIVATE_BUCKET`. There is **no remove helper yet** — add one, or destroying an image orphans files. Boards have no files.
- **Confirm — verified:** `confirm({message, danger, confirmLabel})` is an imperative client dialog → chain **two** for the double-confirm.
- **Trash page:** server component, `listTrash` → items with restore server-action forms; intro line currently says "emptying comes later" — update it.

## Technical build
1. **`lib/storage.ts` → `removeObjects(supabase, paths)`** — filters nulls, `storage.from(PRIVATE_BUCKET).remove(real)`; **logs + swallows** storage errors (a missing/failed file must not block the row delete — the row is the source of truth; an orphaned file is minor + cleanable).
2. **`lib/db/bits.ts` → `destroyBit(supabase, id)`** — fetch `storage_path`/`thumb_path` (**guarded `deleted_at is not null`**), `removeObjects`, then `delete().eq(id).not(deleted_at,is,null)`. Guard at the DB layer = can't destroy a live bit even if mis-called.
3. **`lib/db/boards.ts` → `destroyBoard(supabase, id)`** (guarded delete) + **`emptyTrash(supabase)`** — remove storage for all trashed image bits, then `delete` all trashed bits + boards (`not(deleted_at,is,null)`).
4. **`app/actions.ts`** — server actions `destroyItemAction(thing, id)` + `emptyTrashAction()` → call the db fns → `revalidatePath("/trash")` + `revalidatePath("/")`.
5. **`app/trash/page.tsx`** — a client **`DestroyButton`** per item (double-confirm → `destroyItemAction` → `router.refresh`) beside restore; a client **`EmptyTrashButton`** at the top (double-confirm → `emptyTrashAction`) when non-empty; rewrite the intro line.
6. **Invariant** (`invariants.md`): *destroy is the only irreversible act · trash-only (guarded) · cascades through every bit/board-owned row · clears storage.*

## Verify (no schema change → no throwaway DB proof; cascade is already schema-proven in `verification/`)
tsc + build + lint (0 errors) · trace: destroy a note carrying tags + a placement + a gather tie → gone, ties gone, chip self-heals · destroy an image → its files leave the bucket · empty-all → trash empties, live things untouched · the guard (a live id is a no-op) · **both** confirm steps must pass. Owner feel-test on `/trash`.
