# Multi-select — build plan (Part ②)

**Status:** 📜 **✅ BUILT (multi-select ②a–c). HISTORICAL plan — do not build from; the current model is `model.md`.** Follows ① (all-bits panel + multi-board, D-109, shipped).
**No schema change** — multi-select is board-canvas interaction: card positions + the existing remove/trash acts, looped. Owner session 2026-07-28.

---

## The feature list (check for gaps)
- **MS1.** **Select several cards** — a **select-mode toggle** in the board toolbar (works on touch *and* mouse), plus **shift/⌘-click** as a mouse shortcut, add/remove a card from the selection.
- **MS2.** **Selection box (marquee)** — in select-mode, drag on empty space → a rectangle that grabs the cards inside it.
- **MS3.** Selected cards show a **selection outline**; the toolbar shows **"N selected."**
- **MS4.** **Move together** — drag any selected card → all selected move by the same delta, live.
- **MS5.** **Bulk acts** — with >1 selected: **"remove N from this board"** and **"trash N"**. The **trash confirm keeps ①'s multi-board honesty even when aggregated** (review): it counts how many of the N *also* live on other boards and says so — e.g. *"Trash 3 notes? 2 of them also live on other boards — this removes them from all,"* never a flat "trash 3."
- **MS6.** **Clear** — click/tap empty space, or **Escape**, clears the selection.
- **MS7.** **Touch/stylus (the Daylight)** — the select-mode toggle makes all of the above work without a shift key: tap to add, drag-box, move-together.

*(Multi-**resize** is out — single-card resize stays; multi-**move** is the ask.)*

## Decisions (recommendations — need your nod)
1. **Trigger = a select-mode toggle** (recommended) — a toolbar button (e.g. "⛶ select"); ON = tap/click adds to selection · drag-empty = marquee · drag-a-selected = move-all; OFF = today's single-select + pan. **Works on mouse AND the Daylight's touch/stylus** (shift-drag alone would be mouse-only). Shift/⌘-click stays as a mouse convenience on top.
2. **Move-together only**, no multi-resize.
3. **Bulk trash reuses ①'s honest per-note "on N boards" confirm**, aggregated into one.

## Technical
- **Selection state:** `selectedId: string | null` → **`selectedIds: Set<string>`** (placement ids); single-select is a one-element set.
- **Select mode:** a `selectMode` boolean + the toolbar toggle. A card's `onSelect` **toggles membership** when in select-mode or shift/⌘-held; otherwise single-select (today's behavior).
- **Move-together:** react-rnd is **controlled** (`position={{x:card.x,y:card.y}}`, `onDragStop → onChange`). On a selected card's **`onDrag`**, compute the delta from its drag-start and apply it to **only the *other* selected cards'** positions via `setCards`. **⚠ The specific hazard (review):** that `onDrag` `setCards` must **not touch the dragged card's own position/object** — if the array update changes the dragged card's controlled `position` prop mid-drag, react-rnd's internal drag fights it and the dragged card **jumps/stutters**. So: move the *others*, leave the **dragged card entirely to react-rnd** until `onDragStop`. On stop, persist every moved card through the **debounced settled-create door**, which is **keyed per placement id** (verified — `pending`/`timers` are `Map<placementId,…>`), so N cards get **N independent saves**, not one last-write-wins. Persistence is **per-card independent**: a partial failure is a **partial rollback** (the failed card snaps back, the rest stay) — intended, not a silent all-or-nothing.
- **Marquee:** a drag-rectangle on empty space, **only in select-mode** (so it doesn't fight panning), hit-testing card world-bounds via `screenToWorld`.
- **Bulk remove/trash:** loop `unplaceBit` / `trashBit` over `selectedIds`, each through the **settled-create door** (the review's lost-write fix); one aggregated confirm.
- **Files:** `board-surface.tsx` (the set, select-mode, the marquee, move-together, the bulk toolbar), `card.tsx` (multi-select `onSelect` + the drag-delta hook + the selection outline), `globals.css`.

## The five gates
1. **Invariants:** moving = position updates (no risk); bulk trash/unplace = the same single acts, looped; **nothing new**.
2. **Trace:** select N → move → all persist · marquee → grabs exactly the enclosed set · bulk trash → all gone (confirm honest, others untouched) · a selected card still mid-create → the settled door protects it · Escape/empty-click → clean deselect.
3–4. **Lowest layer / derive:** no new storage; selection is transient client state.
5. **Prove the flow:** select 3, move, reload → all three moved *and* saved; **and the thing that only breaks *in motion*** — the **dragged card stays smooth (no jump)** while the others track it live (review); marquee-select 2, trash → both trashed, the rest untouched.

## Stages (each shippable, verified before the next)
- **②a** — `selectedIds` + select-mode toggle + shift/⌘-click + **move-together**.
- **②b** — the **marquee** box.
- **②c** — **bulk** remove / trash.
- **②d** — **touch/stylus** refinement (feel-tested on the Daylight — the fiddliest, so last).

Each: `pnpm build` green → deploy → owner feel-test before the next. Built on a git branch; production untouched until a merge you okay.

## Review folded (2026-07-28)
Cross-window review: *"build it as staged; fix nothing conceptual."* Verified + folded:
- **Affirmed correct:** `selectedIds` = **placement ids** (not bit ids) — so multi-board Just Works (a bit on two boards is two cards; moving on board A never disturbs board B, Principle 8); the I-W1 remove-vs-trash distinction survives at bulk scale; the mid-create edge is in the trace (settled door).
- **The drag hazard named + proven in motion** (Move-together + gate 5): don't touch the dragged card's controlled position mid-`onDrag`; prove it stays smooth *while dragging*, not just correct on reload.
- **Bulk persist:** per-card independent (partial failure = partial rollback); the door **keyed per placement** (verified).
- **Aggregated trash confirm keeps the multi-board honesty** (MS5).
- **Undo, eyes open:** board undo is parked (Phase 4). Bulk-**trash** is recoverable (trash restores); bulk-**move** has **no undo** — fat-finger a 6-card drag and you hand-fix 6 positions. Not a blocker, but **bulk raises the stakes on undo** — a reason it may deserve to come sooner. Accepted eyes-open for ②.

### Interaction rules (review disambiguations)
- **Tap vs drag on empty space (in select-mode):** a **tap** (movement under the board's existing ~4px pan/tap threshold) **clears** the selection; a **drag** past it starts the **marquee**. Reuses the existing threshold; matters most on touch.
- **Clearing:** the selection **clears after a bulk act** (cards gone/changed), **on toggling select-mode off**, and on **Escape** or an **empty-tap**.

## Out of scope for ② (named, not dropped)
Multi-**resize** · a saved **"group"** (group/ungroup) · **dragging a selection into the panel** (cross-surface). Two the review named to keep on record:
- **Bulk-tag** (select N → apply #idea to all) — the *same machinery* as bulk remove/trash, a genuine arrange-time want; **a cheap fast-follow after ②**, logged here.
- **Panel bulk-call-in** (select several *loose notes* in the panel → place all) is a **different** multi-select on a different surface (parked A19). This ② is **canvas-card** multi-select; "②: done" must **not** imply panel bulk-call-in is done.
