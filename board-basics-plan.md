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

## CORRECTIONS FROM THE INDEPENDENT CHECK — fold ALL in

**Critical:**
1. **The keyboard guard must be ORDERED, not flat** (the flat spec contradicted the Escape
   two-step): ① target is an INPUT/TEXTAREA (drawer search, ContentLine, TagBar, pickers,
   WordsOffer, BoardTitle) → ignore everything, Escape included (they run their own Esc-revert) ·
   ② inside the confirm dialog (`.confirm-scrim`, incl. its autofocused button) → ignore everything
   · ③ `editingId` set / target contenteditable → handle **Escape only** (exit edit, KEEP
   selection); ignore the rest · ④ drawMode on → bail · ⑤ else the full key set. Tiptap binds no
   Escape (verified), so the window listener still receives it — today's exit-edit works only
   because the current listener is unguarded.
2. **The view replace must repeat `with (security_invoker = true)`** — CREATE OR REPLACE resets
   unspecified reloptions; omitting it flips board_cards to definer rights, a SILENT RLS
   REGRESSION with the guest door live. Full verbatim select (resting_state:58-83) + `p.locked_at`
   appended after `source_url`. The throwaway proof must assert the view still has security_invoker.
3. **Stale closures:** the handler reads cards/selectedIds/editingId and calls bulkUnplace —
   registered `[]` it acts on a stale board. Re-bind on deps (the paste handler's precedent) or the
   house latest-callback-ref. New code lives in its own `use-board-keys.ts` (board-surface is at
   427 lines already).
4. **Rollback must NOT restore on the "no longer exists" error class** (unplaceBit/trashBit throw
   on 0 rows) — else a failed-create's leftover card becomes an un-removable zombie. AND fix the
   root: `createTextCard`'s failed create must remove its optimistic card (the image/audio/pdf
   doors already do; text doesn't). Bulk rollback is per-failure, not all-or-nothing.

**Medium:** confirm-scrim guard (above) · multi-file loop needs CALLER-computed offsets AND an
explicit per-file z (`z0 + i` — the import fns' internal nextZ ties in a same-tick loop) ·
`setConverting` becomes a COUNTER (first-of-3 HEICs finishing must not hide the notice) · tidy-up
needs a Y-BAND row rule (sort y; new row when y > rowStart + band ≈ 40 world px; x within) — raw
(y,x) flips visually-same-row cards · `looseRefresh` bumps only after the write lands (or re-bumps
on rollback) · the lock needs a real write path (`setPlacementLock` db fn through settled; CardVM +
BoardCard + page mapping carry `locked_at`) · **duplicateBoard copies locked_at — ruled yes** (lock
is arrangement state like x/y/z) · move-together skips locked cards at ONE point (the starts map in
onCardDragStart; move/end gate on starts.has() free) · Rnd: `disableDragging = editing || locked`,
resizing off when locked.

**Confirmed + adopted details:** window-level listener (board div has no focus) · nudge rides the
per-placement-keyed debounce (proven by move-together) · zoom keys accept `=`/`+` in, `-`/`_` out,
`0` reset (meta||ctrl), preventDefault; button/key zoom calls scheduleSave explicitly (also clears
the fit snap-back — correct) · send-to-back: z int, no constraint, negatives legal, no renumbering
(skip the cleverness) · jump-to maps bitId→card (unique per board), `centerOn(min(1,…))` + select;
drawer stays open v1 · description UI clones **BitTitle's debounced+save-guard** pattern (BoardTitle's
blur-only save lost text once) · `home` view won't expose description (frozen b.*) — harmless,
title-only jump · lock-toggle floats the board on home via the updated_at trigger — expected, noted ·
one more stale comment: `references.ts:99` "through lib/search" → search-query (fold into B's commit).

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
