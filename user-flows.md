# User flows — the whole journey, end to end (+ technical background)

**What this is:** every path a user takes, arc by arc, **each grounded in its technical mechanism** so UX and engineering are thought about together. Complements `model.md` (static shape). ✅ built · 🔲 not yet · ⚑ decision open · ⚙ = the technical mechanism. Written 2026-08-26.

**The person:** a multi-mind — many interests at once. The whole arc: **catch → arrange & write → connect → return → develop into pieces**, nothing lost.

---

## Arc 0 · ONBOARDING (first run — how a new mind learns the app) 🔲 NOT BUILT
Teach the model *by doing*, not a slideshow. A new user arrives empty.
- **Welcome:** one warm line of *what this is* (from `vision-and-language.md`) + **one** first action — "catch your first thing" (jot/paste/image) **or** a pre-seeded example board to poke at.
- **Progressive reveal, one move at a time:** catch a **bit** → put it on a **board** → **write** a note → mark something **alive** so the desk greets you. Each step introduced only when it's the natural next thing.
- ⚙ **technically:** detect first-run = *this owner has 0 boards and 0 bits*; either a scripted **starter board** seeded on first login, or a light guided-overlay; persist an `onboarded` flag (an owner setting row, or `localStorage` v1). Design-heavy → its **own round**, but the *curriculum is this doc* (the arcs, in order). Ties to the eventual **product** goal (others get onboarded too).

## Arc 1 · CATCH (something enters your world)
- ✅ Jot a line (quick box) → loose **bit** · ✅ paste link/quote (source attaches) · ✅ drop/paste image · ✅ pen on a board → doodle · ✅ write a piece (`✎ write`) → **note**
- 🔲 Phone capture (instant, offline)
- ⚙ **technically:** `createLooseTextBit(kind='bit')` · image → `lib/media` (decode→downscale→thumb) → `createImageBit` · source auto-title via `fetchPageMeta` · pen → `createDrawingBit`. Note-write → `createLooseTextBit(kind='note')`. Phone = a **PWA + offline outbox + iOS Shortcut** (Phase 5) — real infra, not built.

## Arc 2 · ARRANGE (compose in space — a board)
- ✅ make a board · bring loose bits in (side-panel/call-in) · drag·resize·stack · multi-select move-together · arrows (connectors)
- 🔲 board-on-board doorway · ✅ **note-on-board = a page-shaped doorway** (N3 — ~200×260 default, resizable)
- ⚙ **technically:** `board` + `placement` (x·y·w·h·z, per-board); `callInBit` (insert-or-revive a departed leg, no dup); `board-surface.tsx` (the canvas — **broken up in N2: 699→362, via `use-create-doors` + `use-board-acts`**); `connector` rows. Note-doorway = a `kind==='note'` branch in `card.tsx` rendering a page-shaped card → `/note/[id]` (`kind` reaches the card via `getBitMeta`).

## Arc 3 · WRITE & GATHER (compose in words — a note)
- ✅ write (`✎ write` / the note's page) · gather bits (`[[` → chip, tap=peek) · see **"gathered into"**
- 🔲 gather a **board** / **link a source** inline
- ⚙ **technically:** the note = a `bit(kind='note')` with `body`; gather = `reference` rows (`from_bit→to_bit`), reconciled on save from the `[[` chips in the HTML; `listGatheredInto` reads them backward. Gather-a-board = extend `reference` with `to_board_id` + a CHECK (the parked A15 shape) + the picker/chip; gather-a-source = a reference that points at a `source`.

## Arc 4 · CONNECT (relate across everything — the web)
- ✅ tag a bit/board/note · pull a tag (`the_pull`) · wander the graph
- 🔲 the **reference-threaded** graph (today's is tags/boards only)
- ⚙ **technically:** `tag` + `tag_application` (polymorphic: bit **or** board); the pull = filter the ledger by tag; graph = `react-force-graph` over co-occurrence — the reference-layer is parked, evidence-gated.

## Arc 5 · ORGANIZE (the shelf)
- ✅ folder boards & notes · mark boards/notes/folders **alive** (★) → the **desk**
- ⚙ **technically:** `shelf_group` (owner-ordered) + `group_id` on board/bit (set-null on delete); `pinned_at` on board/bit/shelf_group; home reads `home` view + a notes query, splits alive/foldered/rest client-side.

## Arc 6 · RETURN (come back — the point)
- ✅ desk (alive + folders) · open a folder · browse the cabinet (all boards·notes·bits) via the rail · **find** (search all)
- 🔲 find **kind filters + labels** (N4, not built) · ✅ a note's **writing-surface page** (N1 — `/note/[id]`, no longer the bit page)
- ⚙ **technically:** `home`/`the_inbox`/`the_ledger` views; `/find` = `lib/db/find.ts` (empty=ledger, +full-text over the face, +tag filter). Note page = new `/note/[id]` reusing `TextWorkspace`/`TagBar`/etc., writing-first; redirect `/bit/[id]`→`/note` for `kind='note'`. Find-filter = a `kind`/`type` branch in the find query + labels.

## Arc 7 · DEVELOP (raw → fragment → piece — the reason)
- ✅ jot → tag → arrange on a board → **synthesize into a note** (gather its bits) → a finished piece · ✅ a board **feeds** a note (the Substack flow). **A thing never changes type (D-121):** you don't promote a fragment into a note — you *write* a note and gather fragments in.
- 🔲 document-mode (a whole board as flowing text) — parked, own design round
- ⚙ **technically:** the whole gradient is already the existing machinery (bits · placements · `kind` · references) — no new storage; document-mode is the one genuine addition (bit-boundaries in a flowing editor).

## Arc 8 · MANAGE (housekeeping)
- ✅ trash/restore a bit·board · rename · change source · **export all**
- ✅ trash a **note from the room** (N1) · ⚑ **archive** as a distinct state? · 🔲 publish/share
- ⚙ **technically:** `deleted_at` freeze + `trash_listing` + `restoreBit/Board`; export = `/api/export` (all tables). Note-trash from the room = reuse `trashBit` + a per-row control. Archive = a new state (`archived_at`?) — decide first. Publish = the whole guest layer (DB door open, no act built).

---

## The gaps, in one place (the to-do the flows expose)
See `organize-phase-plan.md` §Phase N for the *sequenced* version. Summary: note writing-page · note-on-board doorway · notes trash/archive · find filters · gather board/source · onboarding · (parked) phone capture · reference-graph · document-mode · publishing. Plus the standing code item: `board-surface.tsx` breakdown.
