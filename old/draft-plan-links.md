# Plan — Links (knowledge layer, part 2)

**Status: planned in detail; build *after* tags (part 1).** Both need Phase 1 (cloud). Companions: `research-knowledge-layer.md` (D-054), the layer map `draft-plan-knowledge.md`, the tags plan `draft-plan-tags.md`. Roadmap home: Phase 2. Written 2026-07-19.

---

## The model (what a link IS — and what it isn't)

- **A link is ONE thing:** a row in `links` — `from_bit_id → to_bit_id`, meaning "this bit relates to that bit."
- **"Forward-link" and "backlink" are NOT two features — they're the same row read from either end.** From bit A, `A→B` is a *forward* link (outgoing); from bit B, the same row is a *backlink* (incoming). One primitive, two directions.
- **Optional, directional, bit↔bit** for v1. (Board↔board links = later.)
- Table already exists: `links(id, from_bit_id, to_bit_id, created_at, unique(from,to), check(from ≠ to), cascade, index on to_bit_id)`.

## Where links sit in the fuller connection model (so we don't conflate them)

Connections come in a few forms — a `link` is just the **explicit** one:
- **Explicit link** *(this plan)* — you deliberately connect bit↔bit.
- **Implicit, via a shared tag** — two bits with the same tag are related *by topic*; no link row, a query-time relationship; feeds the graph.
- **Spatial, via boards/placements** — bits placed together on a board "belong together" (grouping).

Keep `links` for *deliberate* connections only. The **graph** (piece 5) later draws all three as edges.
**Later, no rework:** a `label` column on `links` for **typed links** ("supports" / "contradicts" / "example-of"); **unlinked mentions** (auto-suggested from text). The table grows; nothing built now is undone.

## Blast radius

- **Data:** the `links` table already exists → likely **zero schema change** (the `unique(from,to)` index already covers `from_bit_id`-prefix queries, so forward-link lookups are indexed; add a dedicated `from_bit_id` index only if profiling shows a need).
- **UI:** additive — a link picker (reuses the tag-picker search pattern, but over *bits*), a canvas drag-connector overlay, a backlinks/forward panel. Compose behavior unchanged.

## `lib/db/links.ts` (one module = the whole API)

- `link(fromBitId, toBitId)` — idempotent (`on conflict do nothing`); self-link rejected by the check.
- `unlink(fromBitId, toBitId)`.
- `forwardLinks(bitId)` → bits this points to · `backlinks(bitId)` → bits pointing here · `linksFor(bitId)` → both (for the panel).
- *(later)* `setLinkLabel(...)`.

## The interaction — two gestures, no typed `[[]]` required (D-054)

- **Tap / `@` picker** — a "link" affordance opens a **search-over-bits** picker (reuse `<TagPicker>`'s search UI, but matching bit text/titles). Pick a bit → a `links` row. Lives on the bit detail page, and inside Tiptap via an `@` trigger (keyboard bonus, D-055).
- **Drag-to-connect (canvas — the novel one)** — a small **bespoke SVG overlay** over the `react-rnd` board: hover a bit's edge → a connector handle appears → drag it onto another bit → a `links` row is written. Copy tldraw's *binding model* (anchor point + reroute-when-either-bit-moves) — **NOT** the tldraw library (not in the approved stack; too heavy for one feature). The overlay re-reads bit positions each drag/resize tick and redraws SVG `<path>` curves (the same pattern the doodle overlay already uses).

## Surfacing (also the "grow an idea over time" lineage — D-054)

- **Bit detail:** a panel — *Links* (forward) + *Linked from* (backlinks) — each a small clickable list.
- **On the canvas:** rendered connector lines between linked bits that share a board, rerouting as bits move — the visible Obsidian-web *on the canvas* (the fusion). 
- Empty states = one quiet sentence.

## Steps (build order, each verifiable — after tags)

- **A. `lib/db/links.ts`** + a round-trip verify script (link → forward/back → unlink; self-link rejected; dup ignored).
- **B. Tap link picker + the backlinks/forward panel on the bit detail page** — link two bits, see it both ways.
- **C. Canvas drag-connector + rendered lines** — hover-edge → drag → link; lines reroute on move. **Touch-tested on the Daylight.**
- **D. `@` typed trigger** inside Tiptap (D-055).

## Verification / success

- Build + typecheck per step; drag-connect usable **by touch on the Daylight**.
- The real test: linking two real notes and later *following the link back* makes the idea feel connected and alive (the D-053 return test).

## Open (decide while building, owner's call)

- Connector lines always visible, or only when a bit is selected? (default: subtle, always, for linked bits on the same board.)
- Typed/labeled links — defer to a later pass? (default: yes, defer.)
- Board↔board links — later.
- Unlinked mentions ("you mentioned X — link it?") — later; needs name/text matching.
