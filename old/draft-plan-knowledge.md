# Plan — the Knowledge layer (high-level, per piece)

**What this is:** the knowledge layer — *"Obsidian, on the canvas"* — broken into its pieces, each with a **high-level plan**. We then write a **detailed plan per piece** right before we build it (tags already has one → `draft-plan-tags.md`). So: this doc = the map of the layer; each piece gets its own deep plan when we reach it.

Grounded in the research (`research-knowledge-layer.md` / D-054). Roadmap home: Phase 2–3. **Gated on Phase 1** (cloud + login) — every piece needs real persistence. Written 2026-07-19.

**Build order (each rung enables the next):**
`Tags → Links (forward+back) → Find/search → Topic-pages → Graph`
The graph is the payoff — it just *renders* the connections the earlier pieces create.

---

## The full model — how things *categorize* & *connect* (the "Obsidian-at-the-data-level" picture)

**Categorize** — *what a thing is / is about:*
- **Open tags** (`tags`) — free, unlimited topical labels; *"what it's about."*
- **Standardized labels** — a *small fixed* vocabulary: `kind` on bits (learned / noticed / wondered / theorized), `stage` on boards (a maturity gradient); *"what it is / how mature."*

**Connect** — *how things relate:*
- **Explicit links** (`links` table) — deliberate bit↔bit. **One row; "forward" & "back" are just the two directions of reading it** — not two features.
- **Implicit, shared tags** — two bits on the same topic are related (query-time, no stored row).
- **Spatial, boards/placements** — bits placed together are grouped.

The **graph** (piece 5) draws every *connect* form as an edge — that's what makes it feel Obsidian-like. *Later, no rework:* **typed links** (a `label` on the row — "supports"/"contradicts"), **embeds/transclusion**, **unlinked mentions**.

---

## 1. Tags — *"what is this about"*
- **Goal:** flat, optional, topical labels — the entry point to the whole web.
- **Model:** flat `tags` (id-referenced → renames are free); joins `bit_tags` / `board_tags` (already in the schema). `kind`/`stage` stay the "typed" structure; tags are pure open topic vocabulary.
- **Interaction:** one shared **tap-to-pick / create-new** picker (recent-first, touch-sized for the Daylight); a typed `#` trigger as a keyboard bonus (D-055). Chips on a selected card.
- **Depends on:** cloud (Phase 1).
- **Detailed plan:** ✅ **`draft-plan-tags.md`** (steps A–G).

## 2. Links — forward + back — *"this idea relates to that one"*
- **Goal:** connect any bit to any bit, both directions — the heart of the Obsidian web.
- **Model:** the existing **`links`** table (`from_bit_id → to_bit_id`). *Forward-links* = what this points to; *backlinks* = what points here (same rows, read both ways).
- **Interaction — two gestures, no typed `[[]]` required (D-054):**
  - **Tap/`@` picker** — pick a bit to link, from anywhere (bit detail, inside text).
  - **Drag-to-connect** — hover a bit's edge on the canvas, drag a connector to another bit. A small bespoke SVG overlay over the `react-rnd` positions (copy tldraw's *binding model* — anchor / reroute-on-move — **not** the tldraw library).
  - Typed `[[` / `@` triggers = keyboard bonus (D-055).
- **Surfacing:** a **backlinks / forward-links panel** on each bit (and board). *This panel is also the "grow an idea over time" lineage* — no separate feature needed (D-054).
- **Depends on:** cloud; reuses the tag picker's search UI.
- **Detailed plan:** ✅ **`draft-plan-links.md`**.

## 3. Find / search — *"pull up everything about X"*
- **Goal:** retrieve bits by tag + text, fast and bookmarkable.
- **Model:** filter by tags (include / exclude) + Postgres full-text (the HTML-stripped `search_tsv` already exists). **The URL *is* the query** (`?in=…&out=…&q=…`) — bookmarkable. Filters run in the query (RLS-safe), never client-side.
- **Interaction:** a **find / `/pull`** surface — choose tags in/out + a search box → a grid of results. Empty result = one quiet sentence.
- **Depends on:** tags (for tag-filtering); text bits already carry FTS.
- **Detailed plan:** TBD.

## 4. Topic-pages — *"the home for an idea"*
- **Goal:** everything about a tag/concept in one place — a **living surface an idea grows on** (the "topic-home"), not a passive backlink dump.
- **Model:** a **query-time view** over the existing join tables — *no new table* (D-054). A tag → all bits + boards carrying it, plus your own writing on the topic.
- **Interaction:** `/t/[name]` — header (name + count), the collected bits/boards, and room to **write into it over time** so it accumulates.
- **Depends on:** tags + links.
- **Detailed plan:** TBD.

## 5. Graph — *"see it all connected, and wander"*
- **Goal:** a visual web of your thinking — for **wandering/discovery**, not querying.
- **Model:** nodes = bits + boards; edges = links + placements + shared tags. **Local-neighborhood first** — a global graph turns to a useless hairball past ~200 nodes (D-054).
- **Interaction:** click a node → open it; filter/scope; gentle + legible. **Library: `react-force-graph`** (best React fit for this size — needs a dep approval when we get there).
- **Depends on:** tags + links (it renders the tissue they create).
- **Detailed plan:** TBD.

---

## How we work through it
1. This doc = the **high-level map** of the whole layer (so nothing's built in a vacuum).
2. When we reach a piece, I write its **detailed plan** (like `draft-plan-tags.md`): goal · schema deltas · the `lib/db` module · the UI · verifiable build steps.
3. You glance at the detailed plan, then we build that piece and verify it (touch-tested on the Daylight where it matters).
4. Move to the next rung.

*Where each thing lives:* `ROADMAP.md` = the whole project · **this doc** = the knowledge layer's shape · `research-knowledge-layer.md` = the cited research behind it · `draft-plan-tags.md` (and future `draft-plan-links.md`, etc.) = per-piece detail.
