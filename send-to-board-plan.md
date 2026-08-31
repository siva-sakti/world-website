# Send to board (Batch 2) — plan

**Status:** planned, not built. Touches **placement data** but needs **NO migration** (position
columns already exist; `callInBit` already accepts any x/y). This is the pre-ruled **parked A19**
re-entry (loose-page bulk-place). Part of the placement/camera work (Batch 2 of 2).
**Lane:** code (this window).

---

## Part 1 — Conceptual

### The problem
Sending a bit to a board from the loose page drops it at a **fixed spot near the world origin**
(`actions.ts:97-99` hashes the bit's id into a top-left grid), far from wherever your actual cards
are. Send several → they pile in that corner. Open the board → "fit" must zoom way out to include
the lonely corner newcomer, so everything shrinks. And there's no feedback — the bit just vanishes
from the loose list.

### The feature
From the loose-bits page: pick **one** bit — or **select several** — and **send to board X**. Each
lands **near your existing work** on that board (not the far corner). You **stay on the loose page**
and see a **"sent ✓ · open it"** link; you arrange the arrivals when you next open the board.

### The decided model
- Single **and** multi-select (both).
- Lands **near the board's existing content**, not the origin corner.
- **Stay** on the loose page (no auto-jump) + a **"sent ✓ · open it"** quick link.
- New bits made *on* the board already land in your view (Batch 1) — unchanged here.

### How it feels
- One bit: the "place on…" picker → sent → **"sent to [board] ✓ · open it →"**.
- Several: turn on **select** → tap the bits → **"N selected · send to [board ▾]"** → sent → the
  same confirmation.
- Open the board later: your cluster + the arrivals sit **together**; fit frames them sensibly.

### The one choice for you (landing geometry)
Since you're not looking at the board, it can't land "in your view." **My default:** land the
arrivals **just to the right of your existing cluster**, cascading gently down-right for several —
so they're adjacent, visible, and never on top of your work. *(Alternative: land them in a row
**below** the cluster.)* Either way you then arrange them. Flagging so you can pick the feel.

---

## Part 2 — Technical

### No migration (confirmed against the schema)
`placement.x/y` are already nullable `double precision`; `callInBit` already takes an arbitrary
`{x, y}`; the `placement_position_whole` constraint (both-present-or-both-absent) is satisfied by a
computed point exactly as by today's hash point. Multi-select is transient **client** state. Pure
app-layer change — no column, constraint, index, or view touched.

### Land-near-content (server-side, the heart)
- Read the board's live cards **once** per send via `getBoardCards(supabase, boardId)`
  (`src/lib/db/boards.ts:47` → the `board_cards` view; each carries `x, y, width, height`).
- New pure helper `anchorNearContent(cards): {x, y}`:
  - Filter to cards with **non-null** x/y (skip pile-mode cards).
  - **Empty board** → default `{ x: 40, y: 40 }`.
  - **Else** → `{ x: max(c.x + c.width) + GAP, y: min(c.y) }` — just right of the cluster, aligned to
    its top. (Landing *outside* the bounding box means no overlap even though stored text heights are
    stale — the same staleness Batch 1 hit; we deliberately don't depend on precise heights here.)
- **Fan-out** for several: bit `i` → `{ x: anchor.x + i*CASCADE, y: anchor.y + i*CASCADE }` (a visible
  diagonal stack, ~40px each). Single bit → just the anchor. `GAP` ~48, `CASCADE` ~40 (constants).

### The server action (`src/app/bits/actions.ts`)
- New core `placeBitsOnBoard(bitIds: string[], boardId: string): Promise<{ error?: string }>`:
  1. `getBoardCards(boardId)` → `anchorNearContent`.
  2. For each `bitId` (index `i`): `callInBit(...)` with the fanned `{x, y}` — **`callInBit` is
     UNCHANGED** (insert-or-revive-departed · liveness guard I-D1 · keeps `arrived_at` I-L1 · live-row
     no-op). Default width/height as today's single place uses.
  3. `revalidatePath("/bits")` + `revalidatePath(\`/board/${boardId}\`)` (pre-warm so the board shows
     the arrivals when the link is followed).
  4. Aggregate errors: if any bit fails (trashed bit/board), surface a clear message; the rest still
     land (best-effort, report the failures).
- `placeOnBoard(bitId, boardId)` becomes a **thin wrapper** → `placeBitsOnBoard([bitId], boardId)`, so
  the existing 4 call sites (note-card, note-row, bit/[id], note/[id]) keep working unchanged.

### Multi-select UI (greenfield — loose page)
- In `notes-browser.tsx`: add `selectedBitIds: Set<string>` + a `selectMode` toggle. **Reuse the
  board's *pattern*** (a Set of ids · a select toggle · Escape-to-clear · bulk-act-then-clear) — **not
  the marquee code** (`use-marquee-select.ts` needs world-space coords; wrong idiom for a DOM grid).
- A **select** toggle in the notes-browser toolbar; in select mode, clicking a card/row toggles it
  (a selected outline); **Escape** clears.
- A **bulk bar** when ≥1 selected: `"N selected · send to [board ▾] · clear"` → the board picker
  (reuse the `boards` list already passed in) → `placeBitsOnBoard(selectedIds, boardId)` → on success:
  clear the selection + show **"sent to [board] ✓ · open it →"**.
- **Scope:** loose bits only (consistent with the loose-only per-card door; the placed-bit "multi-
  board door" stays parked A20).

### The "sent ✓ · open it" feedback
- Single (`place-on-board.tsx`): on pick success, render **"sent to [board] ✓ · open it →"** (a link
  to `/board/[boardId]`) instead of the bit silently vanishing. Keep the existing revalidate.
- Bulk (the bar): the same confirmation + link.
- The link is a `next/link` / `router.push` to `/board/[boardId]`; the board renders fresh (revalidated).

### Files touched
- `src/app/bits/actions.ts` — `placeBitsOnBoard` (new core) · `placeOnBoard` (wrapper) ·
  `anchorNearContent` (pure helper, or a tiny `placement-anchor.ts` so it's unit-testable) · import
  `getBoardCards`.
- `src/app/bits/place-on-board.tsx` — the "sent ✓ · open it" link on success.
- `src/app/bits/notes-browser.tsx` — selection state, select-mode toggle, bulk bar (picker+send+confirm).
- `src/app/bits/note-card.tsx` / `note-row.tsx` — a selected style + click-to-toggle in select mode.
- No DB / schema / migration.

### Model-safety gates
1. **Invariants** — I-L1 (`arrived_at` kept on re-place) and I-D1 (liveness guard) live in `callInBit`
   and are **untouched**; Batch 2 only feeds it a smarter x/y. No new always-true rule.
2. **Trace all states** — create (insert) · revive (a *departed* bit re-sent → `callInBit` revives,
   keeps `arrived_at`) · live-row (already on the board → no-op; but loose bits are on **no** board, so
   this can't arise from the loose page) · un-place / trash / restore / destroy (unchanged — Batch 2
   only *adds* a placement). No blank cells.
3. **Lowest layer** — placement invariants stay at `callInBit`/DB (unchanged); the x/y is a heuristic,
   so it lives in app logic (can't be a DB constraint).
4. **Derive, don't duplicate** — the anchor is derived from `getBoardCards` (the source of truth), not
   stored.
5. **Prove the flow** — end-to-end, below.

### Verification
- **Unit-test** `anchorNearContent` (pure, no DB): empty → `{40,40}`; a cluster → just right of its
  bounding box, aligned to its top; two+ bits cascade to distinct points; null-x cards skipped.
- **Flow** (me + owner): send one loose bit → lands right of the cluster, visible, "sent ✓ · open it"
  works → send several → they cascade near the cluster (not the corner) → open the board → fit frames
  cluster + arrivals sensibly → re-send a previously-**departed** bit → it revives (arrived_at kept).
- `tsc --noEmit` + lint + `pnpm build` green.

## CORRECTIONS FROM THE INDEPENDENT CHECK — fold ALL of these in

1. **Confirmation must NOT live inside `PlaceOnBoard` (HIGH).** On success, `revalidatePath("/bits")`
   drops the just-sent bit from the loose view → its `NoteCard`/`NoteRow` (and the `PlaceOnBoard`
   inside) **unmounts**, so any success flag there flashes and vanishes. **Host the confirmation in
   `notes-browser`** (never filtered out) via a threaded `onPlaced(boardId, boardTitle)` callback:
   PlaceOnBoard → NoteCard/NoteRow → notes-browser. Note `onPlaced` is currently **dead** (no caller;
   the "/write uses this" comment is stale) — wire it. The bulk bar hosts both single + bulk confirms.
2. **`anchorNearContent` width bug (HIGH).** `placement.width` is nullable and **every loose-placed
   card stores `width = null`** (the size default is render-layer only, `board/[id]/page.tsx:77`), so
   `c.x + c.width` reads a real card as **zero-width** → the anchor lands **on top of** it. **Coalesce:
   `c.x + (c.width ?? 240)`.** And guard the **filtered** (non-null-x) array being empty (`Math.max()`
   of nothing = `-Infinity`) — the empty check is `placed.length === 0`, NOT `cards.length === 0`.
3. **Click-vs-navigate + loose-only (MED).** `NoteCard`/`NoteRow` bodies are full `<Link>`s that
   navigate on click; they take no select props today. Add `selectMode` / `selected` / `onToggle`
   and, in select mode, **suppress the Link** (don't render as a link / preventDefault). **Gate select
   to LOOSE bits only** — selecting a placed bit in the "all" tab and sending it elsewhere would ship
   the parked **A20** multi-board door. (Only offer select in the loose view / make non-loose
   unselectable.)
4. **Fresh `randomUUID()` placement id PER loop iteration (must-do).** A reused id collides on the
   placement PK (`23505`) → the revive branch (departed-only) matches nothing → throws for every bit
   after the first. Generate the id inside the loop.
5. **Keep revalidate-on-error (LOW).** Today `placeOnBoard` revalidates `/bits` + `/bit/[id]` even on
   the error path ("a stale pile is often the cause"). `placeBitsOnBoard` must do the same before
   returning an error.

Confirmed sound by the check: no migration · `callInBit` reuse · `{error?}` return shape · boards list
available in notes-browser · mirror-not-reuse the marquee pattern · the model-safety trace (given #3's
loose-only enforced). Landing geometry: **owner chose "to the right"** (matches the plan default).

### Build order (small pieces, each verified)
1. `anchorNearContent` + `placeBitsOnBoard` + `placeOnBoard` wrapper + **unit test** — prove the
   landing math. No UI change yet (existing single-send now lands near content).
2. The **"sent ✓ · open it"** link on the existing single-bit `place-on-board` (smallest visible win;
   owner feel-tests single-send landing + the link).
3. **Multi-select + bulk bar** on the loose page (owner feel-tests bulk send).
