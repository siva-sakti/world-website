# Board basics + cleanup — plan (the two review prongs, owner-approved)

**Status:** planned → independent check → build in three batches, each verified + committed
separately. Sources: the 2026-09-01 feature review (25 verdicts + noticed gaps) and code-health
survey (B+ · 5 ranked cleanups). Owner rulings (via questions): **Delete = remove-from-board** ·
**click-to-front stays** (send-to-back is the relief) · **card lock AND board description both
build** (one gated migration). Tidy-up approved. Excluded (ruled elsewhere): undo (Phase 4) ·
colors/paper (aesthetics phase) · board-doorways (S3) · bulk move-to-board (A19's re-entry).

---

## Batch A — cleanup (mechanical, low-risk; build first)

1. **Delete dead code:** `src/lib/search.ts` (orphaned; contradicts the live starts-with ruling —
   fix `scripts/test-port.mjs:228`'s stale comment too) · `src/lib/supabase/admin.ts` (orphaned) ·
   dead CSS: `.inbox-card-bookmark` `.inbox-card-site` `.inbox-card-favicon` `.inbox-card-open`
   (bookmark-era) · `.desk-chips/.desk-chip/.desk-chip-n/.desk-open*` (superseded by desk-tile) ·
   `.gather-suggest-type` — **re-verify zero users before each removal.**
2. **Fix stale comments:** `types.ts:3` ("eight record kinds" → nine) · `types.ts:28-29`
   ("bookmark's url/title" → the link bit's, D-129) · `bit/[id]/page.tsx:117-119` ("no such
   branch" sits above the link branch). Add `source_id` to the `BoardCard` type (the view exposes it).
3. **Consolidate the proven-drifting small dupes:** one `escapeHtml` (a tiny `lib/html.ts`; the two
   copies have already diverged — keep the 5-entity version) + the pasted-text→`<p>` transform ·
   one `hostOf` (guarded; fixes `bit/[id]/page.tsx:146`'s UNGUARDED `new URL()` that can throw at
   render) · `addToInbox`'s link branch calls the same internals as `captureLink` (one capture
   sequence in one place).
4. **db-module strays:** `page.tsx` home notes query → `listNotes()` in lib/db · `group/[id]`'s
   direct `shelf_group` query → `getGroup()` in shelf.ts · its double `listBoards` call → one.
5. **Silent failures surfaced:** `act()` in home-surfaces + `GroupPicker.run`/`PinToggle` in
   note-card get a visible error line ("Couldn't save that — try again", the board's pattern) ·
   `getBit`/`getBitMeta` STOP discarding query errors (throw — a network blip must not 404 a live
   bit or render a note as editable text; that's model-visible wrongness) · `destroyBit`'s
   best-effort select gets its explanatory comment · `word-graph.tsx` dynamic import gains `.catch`
   → error state · `outline-view` localStorage catches get the house comment.

## Batch B — the board basics (features + bug fixes)

**Keyboard (one handler, one guard):** a single board-level keydown that IGNORES events when
`editingId` is set or the target is an input/textarea/contenteditable (the paste handler's guard) —
- **Delete/Backspace** → remove selected from THIS board (unplace; single + bulk — the ruled
  meaning; bits live on, loose).
- **Arrow keys** nudge the whole selection (1px; Shift = 10px), persisted via the debounced
  `patchCard` path like a drag.
- **Cmd/Ctrl+A** selects all cards (enters the same selection state as marquee).
- **Cmd/Ctrl + = / − / 0**: zoom in / out / to 100% (preventDefault so the browser doesn't zoom the
  page; zoom centered on the viewport center, the wheel handler's math). **Esc**: see two-step below.
**Toolbar/UI:**
- **+ / − zoom buttons** beside ⊹ fit (same centered-zoom math; touch users get buttons, not just pinch).
- **Send-to-back** in the selected-bar (z = min(all z) − 1 via `patchCard`); with click-to-front
  kept (ruled), this is the demote valve.
- **Tidy up** (selection ≥ 2): arrange the selected cards in a neat grid at their bounding-box
  top-left — row-major by current position (reading order preserved), columns ≈ ceil(√n), cell =
  max measured card size + 16px gap (measure real heights via data-pid, the fitView fix's lesson).
  One `patchCard` per card — so it rides the normal save path and a future undo.
- **Jump-to-card:** the drawer's "this board" rows stop being dead ends — click → `centerOn` that
  card (readable scale, cap 1) + select it. (Delivers find-on-this-board free.)
**Intake:**
- **Multi-file drop/paste/pick:** loop ALL files (drop + paste + the three pickers get `multiple`),
  cascading spawn offsets so they don't stack; unknown types skipped with the error line naming the
  count ("2 of 5 weren't images/recordings/PDFs").
**Bug fixes (from the review):**
- **Failed removes roll back:** `unplaceSelected`/`bulkUnplace`/`bulkTrash` snapshot the removed
  cards and restore them on a failed write (bringIn's existing pattern applied to removes) — the
  screen must never lie about the board.
- **Escape two-step:** editing → Esc → *selected* (the selected-bar back); second Esc → clear.

## Batch B+ — the two columns (gated migration `20260902000001_lock_and_description.sql`)

- `placement.locked_at timestamptz` (null = unlocked; the house timestamp-not-boolean style, like
  pinned_at) — `board_cards` view gains the column via CREATE OR REPLACE (appending a column at the
  END of the select is legal without a drop; the bit views are untouched).
- `board.description text` (null = none). NOT searchable — /search excludes boards (ruled, D-122);
  the home jump matches titles only (unchanged).
- **Lock UI:** a 🔒 toggle in the selected-bar. Locked = drag/resize/nudge/tidy skip it (Rnd
  `disableDragging` + resizing off); select/open/tags still work; unplace/trash still allowed (lock
  guards *position*, not existence). Delete-key and bulk acts still apply — flag in the check.
- **Description UI:** a quiet editable line under the board title (BitTitle's pattern), saved
  through one db fn.
- Proof: throwaway run (columns exist · view exposes locked_at · nothing else changed) → owner
  cloud paste → only then the UI deploys. Trace: lock survives trash/restore (it's placement
  state); duplicate-board copies geometry — **copy locked_at too?** (a faithful copy: yes — flag
  for the check); destroy cascades fine.

## Model-safety gates
Nothing touches bit substance. The migration adds two nullable columns (no constraint semantics);
locked is placement-state like x/y (per-board, not per-bit ✓ derive-don't-duplicate). All state
writes ride the existing debounced/settled door. Invariants list: no new always-true rule beyond
"locked_at is placement state" (goes in the migration comment).

## Verify
tsc/lint/build per batch · the migration's throwaway proof shown raw · owner feel-test per batch
(keyboard feel, tidy-up feel, lock feel) · both unit suites still green.

## Build order
A (cleanup) → commit · B (basics) → commit → owner feel-test · B+ (migration proof → owner paste →
lock/description UI) → commit · deploy on the owner's word.
