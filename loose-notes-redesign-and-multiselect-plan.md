# The all-bits panel + multi-board (Part ①) — build plan · FINAL

**Status:** ✅ decisions locked (owner design session, 2026-07-28). Ready to build **on a branch**.
**No schema change** — a `placement` is per (board, bit), so a bit on many boards is already legal; this exposes it. Board-history is already stored (verified: un-place keeps the row, stamped `left_at`; `bit_travel` surfaces it).
**Part ② (multi-select) is HELD** — its own plan, built after ① (short note at the end).

---

## The full feature list — *check this for anything we forgot*

**The panel (on a board):**
- **F1.** Lists **all your live bits**, not just loose ones.
- **F2.** **Loose bits first** (not on any board), then the rest; newest-first within each group.
- **F3.** Quick filter row: **loose · this board · other boards · all** (loose is the default emphasis).
- **F4.** **Full-text search** across every bit (its words + source name + tag words).
- **F5.** Filter by **tag · source · type** (text/image/drawing) — kept from today.
- **F6.** Each bit shows a **preview per type** (text snippet · image thumbnail · drawing mini) + its **"from …"** + its tags.
- **F7.** Each bit wears an **"on N boards"** label (plain text in v1) — counting only **live, non-trashed** boards (Finding 1).
- **F8.** Image thumbnails **lazy-signed as you scroll** (a signed URL per image isn't free).
- **F9.** Empty / loading / error states; the collapse-to-a-tab behavior stays.

**Bringing a bit onto the board (multi-board):**
- **F10.** **Click a bit → it lands on the current board** (center of your view), then it's a normal card you drag/resize like any other.
- **F11.** A **loose** bit brought in → becomes placed (leaves the loose group).
- **F12.** A bit already on **other** boards brought in → now on **this** board **too** (multi-board).
- **F13.** A bit already on **this** board → **client-side no-op**: flash/scroll to the existing card, **skip the server call** (via the panel's membership data). `callInBit`'s live-row branch is a **verified** true no-op backstop (a `SELECT` of the existing row, never a reposition — confirmed in code, D-106).
- **F14.** A placed bit is a **reference** — editing it anywhere updates it on **every** board it's on, reflected on each board's **next open** (single-writer: consistent-on-load, *not* a real-time cross-tab push). "Meaning travels with the bit; position stays with the board" (Principle 8).

**Removal — the two acts, made unmistakable now that a bit can be on many boards:**
- **F15.** **"Remove from this board"** → off *this* board only; still lives on its others (and becomes loose if this was its last). No warning — it's gentle.
- **F16.** **"Trash"** → the whole bit off **all** boards, into the trash (restorable). Confirm is honest: *"this note is on N boards — trash takes it off all of them."*
- **F17.** **Board history preserved** — removal stamps `left_at`, never deletes the row (already true; no change).

**The inbox page (kept, per your call):**
- **F18.** The standalone **`/inbox`** stays a view of your **loose** (unplaced) bits — a real surface, not just triage; its "place on a board…" door stays loose-only.
- **F19.** The board panel and the inbox page **share one bits-query + filter module** — two presentations, no drift.

**Fix along the way:**
- **F20.** Verify/repair **"remove from board returns the note to the pile"** (your disappearing-note report — likely the 1 real departed placement we found; it's safe, just wasn't surfaced). The all-bits panel makes it moot regardless.

---

## The idea (one line)
The on-board side panel becomes a **searchable browser of every note**, loose-first — so nothing is ever "lost," and you can drop **any** note onto the board you're on, which is how one note comes to live on **several boards at once** (your differentiator).

## Decisions — LOCKED
1. **Multi-board = reference** — one note, many boards, edits ripple; "on N boards" as a *quiet* label, not a warning (you already expect propagation — it's the feature).
2. **Click-to-place**, then drag on the board with the existing card drag. (No panel-drag — it sidesteps the finicky cross-canvas drag; a *later* fast-follow if ever wanted.)
3. **The inbox page stays** as the loose-bits view, sharing the query.
4. **"on N boards" = plain label in v1**; tappable-jump-to-those-boards is a fast-follow.
5. **Load-all-now, paginate-later** — client-side filter/search at your scale; server-side search + paging is the named trigger for hundreds+.

## Technical considerations (for your / a reviewer's evaluation)

### Data & queries
- **`listAllBits(supabase)`** — the panel's one read, in a shared `lib/db` module (F19). Returns every live bit (`deleted_at is null`) with: its render payload (`body` for text · `strokes` for drawing · `storage_path` for image — signed lazily, below) · its `source` · its `tags` · and its **live board memberships**. Newest-first; the panel groups loose-first in JS.
- **Board memberships / "on N boards" / the loose flag** — one extra round-trip, using **the render-rule `the_inbox` already uses** (verified): `select p.target_bit_id, p.board_id from placement p join board bo on bo.id = p.board_id where p.left_at is null and bo.deleted_at is null and p.target_bit_id is not null`, grouped in JS to `{ bitId → [live, non-trashed boardIds] }`. A bit is **loose** iff that list is empty. **Excluding trashed boards is load-bearing (review Finding 1):** a placement on a *trashed* board keeps `left_at` null (trash records no departure, §2g), so a bare `left_at is null` would call such a bit "on 1 board" pointing at a board that renders nothing — and would **drift from `the_inbox`**. Matching `the_inbox`'s conjunction keeps F19 (one definition) true and F7's count honest. F2/F3/F7 derive from this, never a stored flag.
- Source + tags attach in one round-trip each — exactly as `listInbox` does now; the shared module generalizes that.

### Performance & scale (the honest ceiling)
- **Now:** 24 bits · 30 placements — load-all + client-side filter/search is instant.
- **The named trigger:** past ~a few hundred bits we move search + filtering to a server query and paginate the list. The **DB is never the bottleneck** (indexed); the cost is *rendering + signing*, not the query. Called out as out-of-scope-until-then, not a silent cliff.
- **Images:** a signed URL per image is a storage round-trip, so thumbnails are **lazy-signed** — only for bits actually rendered (as they scroll in), never all upfront. (Today's loose-column signs *all* loose images on load; at "all bits" that's too many — hence lazy, F8.)

### Rendering
- Per-type preview reuses today's approach: text = the HTML-stripped `face`; drawing = a mini via `normalizeDrawing`; image = the lazily-signed thumb. Same `CardVM`-shaped payload the board already builds.

### Bring-in / multi-board (mostly already built)
- **`callInBit` is reused unchanged** — it already inserts a fresh placement per (board, bit), **refuses to duplicate on the same board** (returns the live row untouched — the D-106 review hardened exactly this), and returns the true placement so the optimistic card reconciles its id. **Multi-board needs no new DB path** — the panel just stops filtering to loose bits.
- The optimistic-add → `callInBit` → reconcile → rollback flow is the board's existing path; the panel additionally moves the bit from its "loose" group to "on this board" on success.

### Reference / edit-propagation — no new mechanism
- A bit is **one row**; every board renders it via its placement + the `board_cards` view's computed `face`. Editing the bit (`updateBitBody`/`updateBitContent`) changes that one row → **every** board reflects it on next load. This already works today (a bit *could* be on many boards); multi-board just makes it common. So **F14 is free** — only the "on N boards" label (F7) to make it legible.

### Removal & the trash confirm
- `unplaceBit` (remove-from-this-board) unchanged (stamps `left_at`). The **trash confirm** (F16) needs the bit's live-board count — already in the panel's membership data; on the board's selected-card path it's a one-line count (or passed from the panel).

### Code structure & files
- **New:** a shared `lib/db` bits-list module (`listAllBits` + filter helpers) that both the panel and `/inbox` call (F19).
- **Grown:** `board/[id]/loose-column.tsx` → the all-bits panel (filter row, search, "on N boards", lazy thumbs).
- **Touched lightly:** `board-surface.tsx` (bring-in exists; the trash-confirm line), `inbox/page.tsx` (point at the shared module), `globals.css`.
- **Unchanged:** `callInBit`, `unplaceBit`, the schema.

### Risks / watch-items
- **Panel initial load** = bits + memberships + tags + sources = a few round-trips (like `listInbox` now). Fine at scale; lazy images keep it light.
- **"on N boards" freshness** — recomputed on each panel load/refresh; a bit placed/removed elsewhere shows right on next open (same as the loose column's existing refresh signal).
- **Everything destructive routes through the settled-create door** (the review's lost-write fix) — no regressions there.
- **No new invariants, no schema change** — the model already permits many placements per bit; this is pure app-layer surfacing.

## The five safety gates
1. **Invariants:** I-L1 (one placement per board+bit) upheld by F13's no-op; multi-board = several placements across boards (native); Principle 8 honored by reference.
2. **Trace every state:** loose→here · other-board→also-here · already-here→no-op · edit→ripples to all boards · remove-from-one→stays on others · trash→off all · departed placement→remembered.
3. **Lowest layer:** one-per-pair stays the DB index; loose-ness + board-memberships stay computed from placements.
4. **Derive, don't duplicate:** one shared bits-query (F19); "on N boards" derived, never stored.
5. **Prove the flow:** place a bit on two boards → edit on one → it changes on the other → remove from one → still on the other → no duplicate anywhere. **Plus the multi-board revive cases (review Finding 2):** bring in a bit that *departed* this board while living on others → `callInBit`'s insert → 23505 → **revive-departed** returns the row and the client reconciles the id (no error, no bounce); bring in a bit *already live* here → the client no-op fires (no server call), and if a race reaches the server, `callInBit`'s live-row branch returns it **unmoved**. **Plus the trashed-board case:** a bit whose only board is trashed reads as **loose**, not "on 1 board" (F7/§Data render-rule).

## Stages (each shippable, verified before the next)
- **①a** — `listAllBits` + the panel showing all bits, loose-first, with the loose/this/other/all filter (F1–F3, F6, F9, F19).
- **①b** — search + tag/source/type filters + lazy thumbnails (F4, F5, F8).
- **①c** — bring-any / multi-board + the "on N boards" label (F10–F14, F7).
- **①d** — the two removal acts made clear (F15, F16, F17) + verify F20.

Each: `pnpm build` green → deploy → owner feel-test before the next. Built on a git branch; production untouched until you okay a merge.

## Review folded (2026-07-28)
A cross-window review verdict: *"build it, after fixing Finding 1 and verifying 2–3."* Verified against the real code, then folded:
- **Finding 1 (the real one) — loose/membership must be the render-rule, not bare `left_at is null`.** Correct: a placement on a *trashed* board keeps `left_at` null, so bare `left_at is null` mis-counts it. **Fixed** in §Data + F7 (join board, exclude `deleted_at`). **Verified `the_inbox` *already* uses this rule** — so **no live `/inbox` bug** (the review's worry), F19 holds once `listAllBits` matches, and **F20 is a UI/refresh matter, root-caused separately** (confirm the panel refreshes after un-place — not the trashed-board cousin).
- **Finding 2 (multi-board widens the revive gap)** — **verified `callInBit` already handles it** (insert → 23505 → revive-departed, no roll-back, no bounce) + the client reconciles the id, so the panel needs **no** departed-id up front. Scenario added to gate 5.
- **Finding 3 (F13 must not move the card)** — **verified `callInBit`'s live-row branch is a true no-op** (SELECT, untouched — the review's D-106 memory was off). Also adopting the cleaner **client-side** no-op (F13).
- **Finding 4 (search at scale)** — named: `bit_search_text` is content+body+url only, **not** source/tag. Client-side search (now) covers source/tag from loaded fields; **server-side search at the scale trigger must widen the search column or it silently narrows to words-only.** Caveat recorded; not a blocker now.
- **Smaller:** F14 reworded (next-load-consistent, not real-time); **F8 signing via a batched intersection observer** (not per scroll-pixel); the panel's search must **share `/find`'s semantics** (one "search," not two that drift); **board-on-a-board placement stays a ruled (§5) parked feature with its own later path**, not dropped; **"on N boards" at the sharing phase** could reveal a board a guest can't see (cousin of gather A17) — owner-only now, flagged for sharing.

## Out of scope for ①
Panel-drag-onto-canvas · tappable "on N boards" jump · placing a *board* onto a board (board-cards — bits only here) · server-side search/paging · **multi-select (Part ②)**.

---

## Part ② — Multi-select · HELD (built after ①, planned then)
Select several cards (shift/⌘-click or a drag-box) → move them together, bulk remove/trash. Decisions still open when we get to it: the box-select trigger (lean: shift-drag) and the touch/stylus path. **Not planned in full here — one at a time.**
