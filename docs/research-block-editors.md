# Research — block editors: what exists, what feels good, what the alternatives cut

> ## STATUS · 2026-08-31 · 🟢 HALF 1 LANDED (mechanics — Claude's agent) · ⚪ HALF 2 PENDING (the owner's Notion feel-protocol, `old/composition-surface-spec.md` §6b)
> Findings fold into the spec's §4 cut; this doc keeps the full detail + sources. Research findings don't expire with plans.

## Executive summary — what it means for a v1 cut

1. **The v1 block set is ~10 text-first blocks** (paragraph · headings · lists · to-do · quote · callout · divider · toggle · code · image) — every source, official and practitioner, converges here; **databases are a different product**.
2. **The alternatives' cut map is unanimous: everyone cuts the database ENGINE first** (formulas, rollups, views, automations), and the doc-focused personal tools (Craft for 4 years, Bear, Capacities) cut database-as-container entirely — nobody regrets it on record.
3. **Feel comes from ~8 must-have interaction behaviors, not block count.**
4. **The jank traps are documented and avoidable** — including one directly relevant to us: a team abandoned a pre-baked block framework (BlockNote) over rigid schemas and rebuilt on raw tiptap/ProseMirror. We'd be on raw tiptap from the start.
5. Paste-URL menus, nested drag-drop, synced blocks: all safely deferrable.

## R1 · Notion's block set — core vs long-tail

**Core (~10, the writing set):** paragraph · H1–H3 · bulleted list · numbered list · **to-do** · **toggle** · callout · divider, plus **image** and **code**. Triangulated from Notion's own taxonomy, practitioner most-common lists, and where Notion invested keyboard shortcuts (shortcut investment tracks real use).
**Long-tail (defer):** all database blocks + linked views · synced blocks · simple table† · columns · equation · template button · breadcrumbs · TOC · bookmark/embed cards · video/audio/file.
**The model insight:** Notion's uniformity is in block *operations* (every block converts, drags, duplicates), not block-type count.
†simple table is borderline — practitioner lists put it just below the core ten; OUR case for it is the tracker (the sheet fork), not Notion precedent.

## R2 · The interaction grammar — the v1 feel checklist

**Must-have (8):**
1. **Enter = clean split** — a new empty paragraph, nothing else; no menu auto-opens
2. **Enter in a list = sibling item**; children nest below
3. **Slash menu on explicitly typed `/` ONLY** — never re-triggered by paste or undo/redo; filters as you type
4. **Turn-into is schema-aware** — offer only conversions the schema allows
5. **Hover drag-handle (⋮⋮)** — drag moves with a drop-indicator line; *click* opens the block menu (turn into · duplicate · delete)
6. **Paste preserves block structure** — multi-paragraph text splits into blocks, never flattens
7. **Cross-block partial text selection** works (noted broken on Firefox in Notion — test)
8. **Never-empty invariant** — deleting the last block inserts a fresh paragraph; the editor can't reach an invalid state
Plus: floating selection toolbar · full undo/redo.
**Nice (defer):** paste-URL 3-way menu (v1: plain link) · nested drag-drop indicators · recents-on-top slash menu.

**Jank traps on record:** rigid pre-baked schemas (the BlockNote abandonment) · slash menus re-opening on paste/undo · `draggable` on the text node itself (fights text selection — use tiptap's `extension-drag-handle`, hover-revealed) · toggles that hide anchor targets (auto-open on navigation).

## R3 · What the alternatives deliberately cut — the informed-cut map

- **Craft:** shipped ~4 years with NO databases; Collections (Craft 3) are in-document tables pitched as "no overhead"; still no relations/formulas/rollups/views/automations. Positioning: "a writing instrument for individuals."
- **Bear:** cuts the block model itself — plain Markdown in open formats, tags instead of folders/databases. "We don't want it to be everything to everyone."
- **Anytype:** cuts database-as-container — Sets are "a live filter or query" over the graph, they don't *store* objects.
- **Capacities:** cuts freeform database-building — typed objects with fixed properties; their own migration doc names the cuts (no formulas/automations/collab). "An opinionated tool that does fewer things brilliantly."

> **The map's conclusion:** no alternative cut the core writing blocks; every one cut the database engine; the personal tools replaced databases with something **native to their own model** (embedded tables · tags · graph queries · typed objects). **For us, bits/boards/tags already fill that slot: the v1 document surface needs ZERO database blocks.**

## Caveats
Notion publishes no block-usage stats — the core tier is triangulated (converging, but editorial). Craft's no-database reasoning is inferred from shipping history, not a founder statement. One Anytype docs URL is stale; the quote is verified against the docs mirror.

## Sources
Notion: [types of content blocks](https://www.notion.com/help/guides/types-of-content-blocks) · [what is a block](https://www.notion.com/help/what-is-a-block) · [writing & editing basics](https://www.notion.com/help/writing-and-editing-basics) · [embeds](https://www.notion.com/help/embed-and-connect-other-apps) — practitioner: [Notionto common-blocks guide](https://blog.notionto.com/notion-guides/a-practical-guide-to-notions-most-common-blocks-2026-with-examples/) · [Thomas Frank blocks guide](https://thomasjfrank.com/notion-blocks-guide/) · [Sparxno bookmarks](https://www.sparxno.com/blog/notion-bookmarks) — builders: [tiptap Notion-like template](https://tiptap.dev/docs/ui-components/templates/notion-like-editor) · [tiptap #4746](https://github.com/ueberdosis/tiptap/discussions/4746) · [Domternal build-log](https://domternal.dev/blog/notion-style-block-editor-headless-framework-agnostic/) · [Cybermind build-log](https://blog.cybermindworks.com/post/how-we-built-a-notion-like-editor-with-real-time-editing) — alternatives: [Craft Collections](https://www.craft.do/blog/introducing-collections) · [2sync Craft-vs-Notion](https://2sync.com/blog/craft-vs-notion) · [Atlas](https://www.atlasworkspace.ai/blog/notion-vs-craft) · [Bear](https://blog.bear.app/2018/05/the-who-what-and-why-of-bear/) · [Anytype Sets](https://doc.anytype.io/anytype-docs/getting-started/sets) · [mirror](https://github.com/steffantucker/anytype-docs/blob/main/basics/sets-and-collections/sets.md) · [Fabric](https://fabric.so/comparison/anytype-vs-notion) · [Capacities objects](https://capacities.io/blog/not-all-notes-are-created-equal) · [Capacities migration](https://docs.capacities.io/migration/switching-from-notion) · [principles](https://capacities.io/about/principles/)
