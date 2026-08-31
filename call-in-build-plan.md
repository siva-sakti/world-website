# Call-in — bring a loose note onto a board (build plan)

**Status:** ✅ **built + deployed** — stages ① core loop · ② search · ③ filters (tag/source/type) · ④ polish · ⑤ inbox "place on a board…" door. Re-place regression green (`run-1d-native.sh`); `pnpm build` green. Receipt: **D-104**.
**Review-hardened (2026-07-27, D-106):** the deep review confirmed and same-night fixed — un-place/trash/content now route through the **settled-create door** (no 0-row silent loss); `callInBit` gained a **liveness guard** (refuses a trashed bit/board — TRASHED_BIT/TRASHED_BOARD, honest messages at door B) and a **departed-only revive** (a live placement is returned untouched, never repositioned; the optimistic twin deduped); door-B landings spread by bit-id; the column invalidates stale loads and reads the face from the view. Named later doors → `parked.md` A19–A23.
**Shape:** **app code only — no schema change.** The timestamps, the `placement` table, the "one row per (note, board)" rule, and the inbox view all already exist; call-in just feeds them.
**Supersedes:** the thin call-in sketch in the old capture plan (`old/`). Owner-driven design session + review, 2026-07-27.
**Reviewed:** a second-window review was folded in — findings 1–3, a scope note, and six smaller items. Its three checkable claims were **verified against the code** (see §0 and inline).

## 0. Gate zero — the prerequisite, verified

The whole revive story depends on **"remove a card from a board" stamping `left_at`, not deleting the placement row** — otherwise there's no departed row to revive and `arrived_at` is already gone. **Verified in the current code:** the board's "remove from board" (`board-surface.tsx → unplaceSelected → unplaceBit`) runs `update placement set left_at = now()`; there is **no hard-delete of placements** anywhere. Prerequisite holds — no gate-zero fix needed.

---

## 1. What it is (plain)

A note you jotted **loose** — sitting in the inbox — finds a home: you put it **onto a board**. From then on it lives there like any card, and it drops out of the inbox because it's no longer loose. Take it off that board later and it comes **back** to the inbox. Send it **back to a board it used to be on** and it returns to its old membership row — never a duplicate.

Two front doors, **one action underneath**:

- **A — the loose-notes column, on a board** (the primary, spatial gesture). You're building a board and reach into your caught pile.
- **B — "place on a board", from the inbox** (a cheap appendix). You're in the pile and think "this belongs on board X."

---

## 2. The two front doors

### A — the loose-notes column (primary)

A **collapsible column** docked to the board:

```
┌── loose notes ──────────┐
│ 🔍 search…               │
│ tags: [idea][tea] ⌄      │   ← filter chips
│ from: [ any source ⌄ ]   │
│ type: [ all ⌄ ]          │
│ ┌─────────────────────┐ │
│ │ "a quote…"           │ │
│ │ from Deep Work       │ │   click → lands where
│ │─────────────────────│ │   you're looking, and
│ │ an idea about tea    │ │   leaves the column
│ │ #tea                 │ │
│ └─────────────────────┘ │
└─────────────────────────┘
```

- Collapsed = a thin "loose notes" tab so it never crowds the canvas; expanded = the panel above.
- Shows your **loose notes** (that's literally the inbox, reachable from inside a board), **newest-first**.
- **Search** the notes' words; **filter by tag**, **by source**, **by type**.
- **Click** a note → it lands at the **center of your current view** (a small cascade so several don't stack); it leaves the column.
- **Drag-to-drop-exactly** is a deliberate *later* polish (see §12).

### B — "place on a board", from the inbox (appendix)

On each inbox note, a quiet **"place on a board… ▾"** dropdown of your live boards → pick one → the note lands there at a default spot; the board's **fit** button frames it and you position it afterward. Lands *blind* (you're not on the board), which is why it's the secondary door.

---

## 3. The data story (timestamps) — already the house rule

Every table already carries `created_at` **and** `updated_at`, and one shared trigger auto-stamps `updated_at = now()` on any change. For a placement the design is a touch smarter, and it matches the "keep both" instinct exactly:

| stamp | meaning | on a return trip (re-place) |
|---|---|---|
| `arrived_at` | **first** arrival — this row's birth ("created at") | **kept**, untouched |
| `left_at` | when it left (empty = here now) | **cleared** |
| `updated_at` | last touched (auto, via the trigger) | **refreshed to now**, for free |

- **The full data story is always stored**; what any screen *displays* is a free, separate choice.
- **The one discipline:** call-in's revive path must **never overwrite `arrived_at`**. (The schema documents this as the rule; §13's regression check guards it.)
- **Honest footnote:** `updated_at` means *last touched* — a move or resize bumps it too, not only a return. Standard created/updated pattern. Isolating the *return moment* as its own fact would be a new column — **out of scope** (§12).
- **No separate `created_at` on `placement`** on purpose: `arrived_at` *is* it (the two could never differ, so a twin would be a duplicate — gate 4).

---

## 4. The one function underneath

```
callInBit(supabase, { bitId, boardId, x, y, width, height, z }) → returns the true placement
```

**Authoritative find-or-insert** — the *server* decides insert vs. revive; the client never assumes:

- **Insert** a new placement for `(board_id, target_bit_id)` with a fresh id.
- **On `23505`** (the row already exists — always a *departed* one, see gate 2) → **revive it**: look it up, `update` that row to `left_at = null` and the new `x/y/z/width/height`. Keeps `arrived_at`; the trigger refreshes `updated_at`.
- Always sets `x/y` (arranged mode — "no positionless card on an arranged board").
- **Always returns the true placement** (the minted id on insert, or the revived row's own id) so the caller can reconcile.

**Why insert-then-catch, not a blind upsert or a bare insert:** the unique index **`placement_bit_once` covers departed rows too** — it's on *all* rows with a `target_bit_id`, regardless of `left_at` (verified: its `where` is only `target_bit_id is not null`). So a plain insert against a note that once lived here **fails with `23505`**, and an `ON CONFLICT` upsert can't cleanly target a *partial* index. Insert-then-revive-on-`23505` is race-safe even if a departed row appears between any lookup and the write (finding 1).

---

## 5. How a brought-in note appears + saves (the technical heart)

Mirrors the board's existing optimistic create (`createNote` / `importImageFile`):

1. **Compute the spot** — `screenToWorld(viewport-center)`, plus a small per-bring-in cascade so repeats don't stack.
2. **Add a `CardVM` to local `cards` immediately** — `{ placementId, bitId, type, x, y, w, h, z, …render payload }`, default size per type (text 240×60, matching `createNote`; image/drawing from their stored dims). The note vanishes from the column in the same tick.
3. **Persist** via `callInBit`, tracked through the same `trackCreate(placementId, promise)` door new cards use.
4. **Reconcile the id (mandatory — finding 1).** The optimistic card's `placementId` is a *guess* — right on an insert, but on a **revive** the true id is the departed row's own. `callInBit` returns the authoritative placement; **swap the card's `placementId` to it before any later move/resize** writes against it. A stale departed-id (the note was un-placed elsewhere after the column loaded) is **not** a failure — `callInBit` revives and returns the real id; the card just reconciles.
5. **On a real failure, roll back** — drop the card, restore it to the column, show the standard "couldn't save… your work is still here" notice (the image path's pattern). A `23505` is **not** a real failure — it means "revive," handled inside `callInBit`.

**What the column query must return per loose note** (so a brought-in card renders instantly, no refetch): its type, the render payload (`body` for text · `strokes` for drawing · a **freshly-signed URL** for image, minted at bring-in since signed URLs expire ~1h — §6), its `source` + `tags` (for filtering + the "from…" line), and its searchable text. The insert-vs-revive decision is `callInBit`'s (server-authoritative), so the column need not pre-compute a prior-placement id.

---

## 6. The column, specified

- **Data:** the loose-notes list = the inbox's list (§7), extended with the per-type render payload.
- **Sort:** **newest-first** (`created_at desc`) — matches the inbox/ledger; named so it isn't accidental.
- **Search:** matches the note's words — grounded in the existing HTML-stripped `bit_search_text` generated column.
- **Filter by tag** (`tag_application`), **by source** (`bit.source_id`), and **by type** (text / image / drawing — free, the list already carries type; "show my loose images" is a natural arrange-time move for a visual thinker). Chips + dropdowns from the existing lists.
- **Filtering runs in-memory** to start (load the loose set once when the column opens; filter locally — snappy at a single writer's inbox size). Moves server-side *only* if the pile ever gets large (§12).
- **Signed image URLs** expire ~1h; refresh a note's URL **on bring-in** (the placed card needs a fresh one regardless) so a long-open column never drops a broken thumbnail onto the board.
- **Empty states:** no loose notes → "nothing loose right now"; a filter with no matches → "no loose notes match"; every list can be empty, every load can fail.

---

## 7. The shared surface (don't build two browsers)

The on-board column **and** the inbox page both show "loose notes." They derive from **one** loose-notes query + filter module, in two presentations (full page vs side column) — never two lists that drift apart. This is gate 4 earning its keep before we start.

---

## 8. The five safety gates (walked with the owner — cleared)

1. **Invariants it could break.** *One placement per (note, board) pair* (the DB's partial-unique index) and *placing a note never changes the note itself* (call-in writes only the placement). Nothing new to add to the rulebook.
2. **Trace every state.** A note in the column is *loose* = **no live placement anywhere**. So bringing it onto a board is only ever: **never been here → insert**, or **was here and left → revive that row**. The "already on this board" case is unreachable for a single writer (it wouldn't be loose), and **handled safely** if two tabs race — `callInBit`'s find-or-insert just re-places (§4). Return-trip resolution: keep `arrived_at`, clear `left_at`, refresh `updated_at` (§3).
3. **Lowest layer.** "One per pair" stays the DB index; `updated_at` stays the trigger. Call-in leans on both, re-polices neither.
4. **Derive, don't duplicate.** "Loose / in the inbox" stays *computed* from placements — call-in writes nothing to say "it left the inbox." Column + inbox page share one list (§7).
5. **Prove the flow.** See §13.

### Documented consequence — a returning note comes back arrow-less

Connectors (arrows between cards) are **not built yet** in the app — schema-only, parked (D-098); the only trace is the export route listing the table. So today there are no arrows to lose. **When connectors do ship:** reviving a placement will *not* restore the arrows the card had before it left — un-placing kills them (D-073, kill-with-confirm, the ruling chosen over revive-on-replace). A note that returns to a board returns **arrow-less, by design.** Recorded here so it reads as a documented consequence, not a future surprise.

---

## 9. Build stages (each works on its own, each verified before the next)

Plan reaches **all of it** (owner approved 2026-07-27). Order chosen so every step is independently shippable:

1. **① Core loop** — `callInBit` (find-or-insert, **`23505`→revive**, returns the true id) + **the optimistic-id reconcile** (§5.4 — the card adopts the server's returned placement id before any move/resize) + the column skeleton (lists loose notes, click brings one onto the board where you're looking, it leaves the column). This alone completes the capture→arrange loop; **the reconcile is its one hard part — proven in §13.**
2. **② Search** — the search box over the loose set.
3. **③ Filter by tag / source / type** — the chips + dropdowns.
4. **④ Polish** — sort, empty states, signed-URL refresh, the collapse/expand feel.
5. **⑤ Door B** — the inbox "place on a board…" push (same `callInBit`).

Each stage: `pnpm build` green → deploy → owner feel-test before the next. Stage ① ships and is felt on its own first (it's the moment the caught pile becomes usable).

---

## 10. Files touched (anticipated)

- `src/lib/db/bits.ts` — add **`callInBit`** (find-or-insert; `23505`→revive; returns the placement).
- `src/lib/db/inbox.ts` (or a sibling `loose-notes` module) — the **shared loose-notes query + filter logic** (§7).
- `src/app/board/[id]/board-surface.tsx` — mount the column; the bring-in handler (optimistic `CardVM` + `callInBit` + `trackCreate` + **id reconcile** + rollback); `screenToWorld` view-center + cascade.
- `src/app/board/[id]/loose-column.tsx` *(new; **now `src/components/drawer.tsx`** — moved at N4b, when the note page gained the same drawer)* — the collapsible column UI (list · search · tag/source/type filters · empty states).
- `src/app/inbox/*` — door B: a "place on a board…" control + its server action (Stage ⑤).
- `src/app/globals.css` — column + control styles (quiet, matches existing).

## 11. Defaults (stated so they're not silent — owner okayed)

Column **docked right**, **collapsed by default**; **click-to-bring-in** first; **in-memory** filtering to start; column **newest-first**.

## 12. Out of scope / later

Drag-to-drop-exactly · server-side filtering (only if the pile grows huge) · a literal `created_at` on `placement` (arrived_at serves) · a "last returned" stamp isolated from `updated_at` · **bulk call-in** (select several loose notes → place together — the natural next want once a big pile builds) · **live multi-board placement** (the conscious scope note below).

### Conscious scope — this builds *call-in*, not the multi-board differentiator

Both doors surface **only loose notes** (no live placement anywhere). Your model's differentiator (D-036) is a bit living on **several boards at once, live** — and `callInBit` is *capable* of it (find-or-insert would add board-X's row while board-Y's stays live). The doors just don't *expose* it: there's no entry point to reach an already-placed bit and also put it on a second board. **That's a deliberate v1 scoping** — arranging the caught pile is the daily need — but it means **"call-in: done" ≠ "the differentiator: done."** The later door is cheap and already gestured at in the gather/source plans ("from find and the bit page, the same affordance") — a call-in entry that isn't loose-restricted. **Flagged for the owner:** say if you'd want it in-scope now; otherwise it's a named later door.

## 13. Verification / proof

- `pnpm build` (compile + typecheck) green at every stage.
- **The re-place regression** (the correctness heart): bring a note in → it's on the board *and* gone from the column → remove it from the board → it's back in the column → bring it in again → **the same placement row is revived** (row identity preserved), **original `arrived_at` survived**, **`updated_at` refreshed**, **no duplicate row**. Exactly the check the schema was written to expect.
- **The stale-departed-id race** (finding 1's proof): with a departed row for this board that appeared *after* the column loaded, bringing the note in **revives and reconciles** (the card ends on the true placement id, `arrived_at` survives) — it does **not** error or roll back.
- **Feel-item at the checkpoint:** a returning note lands at your **cursor / view-center**, not its old spot (revive overwrites position, consistent with D-073) — confirm that reads right, since one might expect it to snap back.
- Deploy → owner feel-test (the DB-touching paths can't be tested without the owner's login).
