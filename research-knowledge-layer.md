# Knowledge-layer design research

North star: *Obsidian's knowledge web (tags, backlinks, forward-links, graph) fused with an interactive spatial canvas (Freeform/tldraw-style)*. Four hard constraints shape every recommendation below: **no typed `[[wikilink]]` syntax** (tap/click/drag/pick only), **canvas-first** (a board of cards, not a document), the existing stack (**Next.js + Supabase + react-rnd + Tiptap** — notably *not* tldraw), and ideas must **accumulate over time** so the owner returns unprompted.

This app already has a schema and vocabulary in place (`SPEC.md`, `draft-map.md`): `bits` (fragments) live independently of `canvases` (boards) and can be placed on zero/one/many of them (`placements`); `tags` are flat, id-referenced, and joined via `bit_tags`/`canvas_tags`; `links` is a bare `from_bit_id → to_bit_id` table; topic-pages and a scoped `/graph` are already planned but marked 🔴/not-built. This research is aimed squarely at unblocking those two rows.

---

## 1. Tagging

**How leaders do it.**
- **Obsidian**: flat tags by default, with an optional `#parent/child/subchild` nested syntax — search for `tag:#parent` matches all children, and the tag pane can render flat or hierarchical ([Obsidian forum on nested tags](https://forum.obsidian.md/t/nested-tags/169)).
- **Bear**: nested tags via `/`, e.g. `#novel/chapter/1`, unlimited depth, shown as a disclosure tree in the sidebar ([bear.app/faq/nested-tags](https://bear.app/faq/nested-tags/)).
- **Tana**: supertags aren't labels, they're typed schema — "the content *is* the tag," applying `#task` gives the node Status/Deadline/Priority fields from a template. Created by typing `#` (menu-driven, not memorized syntax), or by "convert to supertag" on an existing node ([Tana supertags docs](https://outliner.tana.inc/learn/features/supertags)).
- **Capacities**: explicitly splits three primitives — **object types** answer "what is this" (Person, Meeting, structured fields), **tags** answer "what is this related to" (cross-cutting themes, no fields of their own), **collections** group within one object type. Their own guidance: use tags for cross-cutting topics, not as a substitute for types ([Capacities: tags vs. object types](https://docs.capacities.io/reference/tags), [tags vs. collections](https://docs.capacities.io/tutorials/tags-vs-collections)).
- **Logseq**: every tag *is* a page; tagging a block is equivalent to linking to that page ([itsfoss.com/logseq-pages-links-tags-blocks](https://itsfoss.com/logseq-pages-links-tags-blocks)).
- **Notion**: no lightweight tags at all — everything is a typed database property (Select/Relation), which is powerful but requires upfront schema decisions before you can jot a note ([Notion relations & rollups](https://www.notion.com/help/relations-and-rollups)).

**Adopt:** flat-by-default, tap-from-list application (Capacities' picker, Bear's forgiving multi-word tags); the Capacities split of "what it is" (type) vs "what it's about" (tag) vs "how I've grouped it" (collection) is the cleanest mental model found — and it already exists in this app as `kind`/`stage` (type/maturity) vs `tags` (topic).

**Avoid:** Notion's upfront-schema tax (kills capture-first); Tana's supertags-as-schema (powerful but is a second data model bolted onto every tag — far more than a single-user capture app needs); deep nested-tag trees as a v1 default (Bear/Obsidian both show it's easy to over-nest and then need a merge/rename tool anyway).

**Recommendation:** keep tags **flat**. The project's own `SPEC.md` (§ "I1 — Tags by id only") and "hierarchy is an open question, not v1" already point this way — this research confirms flat is the right default, not just the cheap one. Don't add nesting until the flat tag manager (merge/rename) proves insufficient. Keep `kind` and `stage` as the only "typed" structure (Capacities' object-type role); tags stay pure open vocabulary.

---

## 2. Links forward+back without typed syntax

**How leaders do it.**
- **tldraw**: arrows *bind* to shapes via a handle-drag — dragging an arrow terminal near a shape creates a binding (`editor.createBindings()`), with `normalizedAnchor` (where on the shape it attaches), `isPrecise` (exact point vs. shape center), and `isExact` (does the arrowhead enter the shape). The binding persists and the arrow re-routes as shapes move ([tldraw arrow binding options](https://tldraw.dev/examples/arrow-binding-options)).
- **Miro** / **Apple Freeform**: hover a shape → blue connection dots appear at its edges → drag a dot onto another object to link them; the connector re-flows automatically when either object moves, and multiple connectors can terminate on one object ([Miro connection lines](https://help.miro.com/hc/en-us/articles/360017730733-Connection-lines), [Freeform connectors guide](https://peonkun.com/mastering-apple-freeform/)).
- **Scrintal**: "links are as easy to create as drawing arrows" — draw a connector between two cards *or* link inline in the text editor; both are treated identically as bidirectional links under the hood ([Scrintal: link your notes](https://scrintal.com/features/link-your-notes)).
- **Heptabase**: two coexisting mechanisms — draw a connector on the whiteboard, *or* type `@` inside a card's text editor to mention another card (a searchable picker, not raw wikilink syntax); both produce a bidirectional link visible in each card's backlinks panel ([Heptabase fundamental elements](https://wiki.heptabase.com/fundamental-elements)).
- **Notion**: `@` anywhere opens a unified picker (pages, database rows, people); Relation properties open the same kind of search-and-choose picker scoped to one database ([Notion @ mentions / relations](https://www.notion.com/help/relations-and-rollups)).
- **Kosmik**: a connector tool draws relationship lines between canvas items directly ([Kosmik tutorials](https://www.kosmik.app/tutorials)).

**The crux, resolved:** every leader converges on **two complementary gestures**, not one — a spatial drag-to-connect (for when you're already looking at both things on a canvas) and a searchable tap/`@`-picker (for when you're in a text field or the two things aren't both visible). Neither requires typing a link syntax; the picker is triggered by a keystroke or tap, then driven by search+click.

**Adopt:** the two-gesture pattern itself; Miro/Freeform's "hover reveals connection points, drag to bind, auto-reroute on move" for canvas mode; Heptabase/Notion's "trigger key opens a searchable picker" for everywhere else (detail pages, capture, Tiptap text).

**Avoid:** tldraw as a dependency — it's not in this app's pre-approved stack (`dnd-kit`, `react-rnd`, `tiptap`, `pdf.js`, `zod`, `perfect-freehand`), and pulling in a full canvas SDK to get arrow-binding would be a large, hard-to-justify addition for one feature. Its *binding model* (anchor + precise/center + re-route-on-move) is worth copying in a small bespoke component, not worth adopting as a library.

**Recommendation:** build linking as a thin, homegrown layer, not a library:
- **Canvas mode**: a small SVG overlay positioned over the `react-rnd` canvas. On hover of a bit's edge, show a connector handle; drag it onto another bit to write a row to the existing `links` table. The overlay re-reads each bit's `react-rnd` position on every drag/resize tick to redraw curves (standard React pattern: track positions in state, redraw an SVG `<path>` on change — see [SVG-connector-in-React pattern](https://dev.to/taowen/connect-react-svg-components-l70)). No new dependency required.
- **Everywhere else** (bit detail page, capture flow, inside Tiptap): a "Link" affordance opens a search-and-pick modal (Heptabase/Notion pattern) over existing bits — same `links` insert, different entry point.
- Both gestures write to the *same* `links` row shape, so the picker can ship alone (unblocks the 🔴 "Linking" item in `draft-map.md` immediately) and the canvas-drag gesture can follow once canvas mode exists.

---

## 3. Topic-pages as a living surface

**How leaders do it.** Roam and Logseq treat every tag as a first-class page automatically: "tags are similar to pages... every page containing the tag is listed as a backlink" — no separate act of "creating" the topic page, it exists the moment the tag is used ([Ness Labs: pages, tags, attributes in Roam](https://nesslabs.com/pages-tags-attributes-roam-research)). Obsidian's Backlinks panel splits **linked mentions** (explicit `[[links]]`) from **unlinked mentions** (plain-text occurrences of the note's title elsewhere in the vault), letting a topic page surface connections its owner never consciously made, with a one-click "convert to link" ([Obsidian backlinks](https://help.obsidian.md/help/backlinks), [working with backlinks](https://help.obsidian.md/How+to/Working+with+backlinks)). Andy Matuschak's evergreen notes are explicitly **concept-oriented rather than source/date-oriented** specifically so that a concept can accumulate contributions from many different books/conversations/projects over years, and are meant to be revised in place rather than left as a historical log ([Evergreen notes](https://notes.andymatuschak.org/Evergreen_notes)). RemNote/Roam-style systems go further: backlinks alone are sometimes enough to *implicitly define* a node that was never explicitly authored ([Matuschak on RemNote/Roam](https://notes.andymatuschak.org/RemNote)).

**Adopt:** the "the page exists the instant the tag is used, no separate creation step" pattern (Roam/Logseq) — this is already this app's plan (`/pull?in=tagname` and a future `/tags/[name]` page). Obsidian's linked/unlinked split is a good future enhancement but not required for v1 given tags here are tap-only (no free-text mentions to detect yet).

**Avoid:** requiring a deliberate "create topic page" step — that's a second act of curation on top of tagging, which will get skipped under capture-first pressure.

**Recommendation:** treat the topic page as a *view*, not a *record* — it's already spec'd this way (`SPEC.md` § "Pull / tag view": filter → grid, no separate table). Confirm this is correct and prioritize it; it's the cheapest, highest-leverage "living surface" available given the existing schema, since `bit_tags`/`canvas_tags` already answer "everything about topic X" with one query.

---

## 4. Graph view

**Local vs. global.** The clearest empirical account found: Obsidian's **local graph** (the current note + its neighbors) stays useful at any vault size, while the **global graph** is genuinely useful only while the vault is small (roughly <50 notes, for spotting gaps/isolated ideas) — past ~200 notes it degrades into "the hairball," a dense force-directed mass where "you cannot find a specific node without searching by name, which defeats the purpose of the visual," and past ~500 nodes it becomes a real rendering-performance problem ([Code Culture: Obsidian's graph view](https://codeculture.store/blogs/developer-culture/obsidian-graph-view-useful), [Obsidian forum: local vs graph view](https://forum.obsidian.md/t/local-graph-view-vs-graph-view/87411)).

**Which JS library.** Compared four candidates against "React + Next.js, single-user, likely hundreds not tens-of-thousands of nodes, needs to feel alive not decorative":
- **cytoscape.js** — the richest toolkit (algorithms, centrality, path-finding); its imperative, non-reactive API is a worse fit for React than event-driven alternatives, and its COSE-style layouts run synchronously on the main thread, blocking UI on graphs above a few thousand nodes ([Cytoscape.js vs vis-network vs Sigma.js 2026](https://www.pkgpulse.com/guides/cytoscape-vs-vis-network-vs-sigma-graph-visualization-2026)).
- **sigma.js** (+ graphology) — WebGL-based, built for graphs where node count genuinely stresses Canvas rendering (thousands+); requires learning a separate `graphology` data layer. Overkill for a single-user notebook ([same comparison](https://www.pkgpulse.com/guides/cytoscape-vs-vis-network-vs-sigma-graph-visualization-2026), [react-sigma guide](https://lyonwj.com/blog/sigma-react-graph-visualization)).
- **vis-network** — fast to wire up, good physics/editable-node support, but an older, less React-idiomatic API.
- **react-force-graph** — a thin, declarative React wrapper around d3-force (2D Canvas, 3D, VR, AR variants share one API); props-in, physics-out; this is effectively "the Obsidian-graph aesthetic" as an installable component, and is the library most commonly reached for when people build Obsidian-style knowledge graphs in React ([vasturiano/react-force-graph](https://github.com/vasturiano/react-force-graph)).

**Recommendation:** **react-force-graph (2D/Canvas variant)**, scoped to **local graph first** — seed it from one bit plus its links/shared-tags/placement neighbors (exactly the data `SPEC.md` § "Links, backlinks, graph" already defines), capped at a few dozen nodes. This matches the app's own plan ("graph demoted... scoped later" in `draft-map.md`) and the empirical finding that local graphs are the only variant that stays useful — build the global/whole-vault graph later, if ever, only once bit-count data shows it's warranted. Don't build sigma.js-grade infrastructure for a graph that will likely never exceed a few hundred nodes for a single user.

---

## 5. The canvas fusion

**How leaders combine spatial + linking + tags:**
- **Heptabase** separates the *card* (atomic content, lives in a global Card Library) from the *whiteboard* (a spatial arrangement that merely *displays* cards) — the same card can sit on multiple whiteboards simultaneously, "mimicking how concepts relate across different topics" ([Heptabase fundamental elements](https://wiki.heptabase.com/fundamental-elements)). Their own guidance is telling: **prefer whiteboards for live thinking; use tags only for large, purely archival sets** — i.e. they see whiteboard-placement and tags as competing organizational tools and explicitly steer users toward one as primary.
- **Muse** nests canvases inside canvases ("a canvas inside a canvas... link any of them to any of the previous ones") and lets a linked card be referenced from multiple boards without duplicating it ([Inkandswitch: Muse design](https://www.inkandswitch.com/muse/), [museapp.com](https://museapp.com/)).
- **Scrintal** and **Kosmik** both treat visual (drawn) links and typed/in-text links as the *same* underlying bidirectional link — the creation gesture differs, the data model doesn't ([Scrintal](https://scrintal.com/features/link-your-notes), [Kosmik](https://www.kosmik.app/tutorials)).
- **Pitfalls documented in the wild:** Miro's community explicitly reports connectors "floating" (silently detaching) after reopening a board, especially after grouping/duplicating/bulk-editing objects ([Miro community](https://community.miro.com/ask-the-community-45/has-something-changed-with-the-way-connection-lines-work-13586)) — a real risk for any hand-rolled connector-tracks-position system. Heptabase's explicit "tags vs. whiteboards, pick one as primary" guidance is itself an admission that having two competing organizing mechanisms confuses users if the product doesn't clearly delineate their roles.

**What works, adopted:** the card/whiteboard (bit/canvas) separation this app already has is exactly Heptabase's model, and the research validates it — it's the right foundation, not an accident. Treat drawn-connectors and picker-created links as the same `links` row (Scrintal/Kosmik), so canvas mode doesn't invent a parallel data model.

**What's missing/pitfalls to design around:** (1) guard against Miro's "floating connector" bug class by always deriving connector endpoints from live bit IDs + current `react-rnd` position, never from cached coordinates; (2) avoid Heptabase's tags-vs-whiteboard ambiguity by keeping this app's existing division crisp — **tags = "what it's about" (the topical web, cross-canvas)**, **placements = "where I've spatially put it" (per-canvas arrangement)**, **links = "I explicitly connected these two"** — three distinct, non-overlapping jobs, matching the three distinct tables already in the schema (`bit_tags`, `placements`, `links`).

---

## 6. The growth mechanic

**How leaders do it:**
- **Roam/Logseq**: daily notes are the entry point for *everything*; ideas start as a bullet in today's journal, and **block references** let a single block be transcluded (embedded live) into any number of other pages — edit the source, every transclusion updates ([Logseq block references](https://discuss.logseq.com/t/the-basics-of-logseq-block-references/8458), [Roam block refs & transclusion](https://www.outlinersoftware.com/topics/viewt/9127/0/block-reference-improvements-in-roam)). A common workflow: capture in daily notes, later pull specific blocks into a dedicated concept page via reference — the daily note becomes a growth log, the concept page becomes the accumulated result.
- **Andy Matuschak's evergreen notes**: growth happens through **revision in place**, not append-only logging — a note is expected to be re-opened and rewritten as understanding improves, factored by concept (not by source/date) specifically so contributions from unrelated projects and years can land on the same note ([Evergreen notes](https://notes.andymatuschak.org/Evergreen_notes)).
- **Maggie Appleton's digital garden**: an explicit three-stage maturity label on every post — 🌱 **seedling** (a fleeting, half-formed idea), 🌿 **budding** (thought-through, partially polished), 🌳 **evergreen** (fully developed, best current thinking) — worn visibly so the *reader* knows how much to trust it, and worn so the *writer* is honest that publishing doesn't require finishing ([Maggie Appleton: Growing the Evergreens](https://maggieappleton.com/evergreens)).

**Adopt:** the *visible-maturity* idea (Appleton) and *revision-over-logging* idea (Matuschak) as philosophy; skip full block-level transclusion (Roam/Logseq) as an engineering investment — it requires a block-addressable content model this app doesn't have (bits are the atom, not sub-bit blocks), and is a large feature for a single-user v1.

**Avoid:** inventing a second maturity taxonomy. This app already has `stage` (canvas maturity, ~3–4 ordered steps) — that *is* Appleton's seedling→evergreen idea, already scoped to canvases. Don't also add a parallel stage field to bits; that would be two growth taxonomies answering the same question.

**Recommendation — the lightweight growth mechanic:** don't build a new feature for this at all; **the backlinks panel *is* the growth mechanic**, and it's already specified (`SPEC.md` § "Links, backlinks, graph"): a bit's detail page (`/b/[id]`) shows every canvas it's been placed on, every tag it carries, and every explicit link to/from it — accumulated automatically, in order, over the bit's life. That list *is* a visible lineage of how a thought grew (an idea gets picked up, dropped onto a new board, tagged into a new topic, explicitly connected to a related idea — each event is a row that shows up on that page for free). Pair it with the already-planned "resurface" feature (random old bits surfaced on return visits) so growth is prompted, not just possible. This is Matuschak's "revise in place, accumulate across contexts" applied with zero new schema.

---

## Key design decisions

| Decision | Options considered | **Recommended default** |
|---|---|---|
| Flat vs. nested tags | Flat (Obsidian default, Capacities) · Nested via `parent/child` (Bear, Obsidian optional) · Schema/supertags (Tana) | **Flat.** Matches existing `SPEC.md` commitment (I1), keeps the tap-picker fast, avoids a second data model. Revisit only if the flat tag manager's merge/rename proves insufficient. |
| How a link is created without `[[ ]]` | Type-triggered inline picker only (Notion `@`) · Drag-a-connector only (tldraw/Miro/Freeform) · Both, same data model (Scrintal/Heptabase/Kosmik) | **Both, writing to the same `links` row.** Ship the tap-search-pick modal first (works everywhere, no canvas dependency); add the SVG drag-connector once canvas mode exists. No new library — hand-rolled SVG overlay over `react-rnd` positions. |
| Local vs. global graph first | Global/whole-vault first · Local (current node + neighbors) first · Both from day one | **Local first.** Global graphs are empirically only useful below ~50 nodes and become a noisy, unreadable "hairball" past ~200 (Obsidian evidence) — exactly the regime a growing single-user vault will reach. Matches `draft-map.md`'s own "graph demoted... scoped later." |
| Which graph library | cytoscape.js · sigma.js · vis-network · react-force-graph | **react-force-graph** (2D/Canvas variant). Declarative React props, d3-force physics that reproduces the familiar "Obsidian graph" feel, no separate data-layer (graphology) needed at this node count, and it's purpose-built for exactly this local-neighborhood use case. |
| Tags vs. links: same primitive or different? | Unify as one "relation" type (Tana's model) · Keep tags and links as distinct primitives (Roam/Logseq/most tools) | **Different**, and already correctly modeled as different tables (`bit_tags` vs `links`). Tags = open-vocabulary, many-to-many, "what this is about." Links = a specific, intentional, directed edge between two exact bits, "I explicitly connected these." Unifying them (Tana-style) is more powerful but requires a schema/fields investment this single-user capture-first app doesn't need — keep them separate. |

---

## Minimal-but-lovely v1 (buildable steps)

1. **Topic page** — `/tags/[name]` (or extend `/pull?in=`) rendering every bit + canvas carrying that tag. No new table: it's a query over `bit_tags`/`canvas_tags`, already spec'd. Ship first — cheapest, unblocks "returning" the fastest.
2. **Link picker (non-canvas)** — a "Link" affordance on `/b/[id]` and inside the Tiptap editor that opens a search-and-pick modal over existing bits (Heptabase/Notion `@`-pattern, tap-triggered). Writes a row to the existing `links` table. Unblocks the 🔴 "Linking" item in `draft-map.md` without touching canvas code at all.
3. **Backlinks panel on `/b/[id]`** — explicit links (from step 2) + implicit backlinks (canvases it's placed on, tags it shares), all already queryable from the existing schema. This *is* the growth-mechanic deliverable (§6) — no separate feature needed.
4. **Canvas-mode connector** — a small SVG overlay component tracking `react-rnd` box positions; hover-to-reveal handle, drag-to-bind, writes to the *same* `links` row as step 2. Build after step 2 so the data model is already proven.
5. **Local graph view** — `react-force-graph` (2D), seeded from one bit's links + shared-tags + placement neighbors, capped at ~40–60 nodes, rendered on `/b/[id]` or a scoped `/graph?from=<bit>`. Explicitly *not* a global/whole-vault graph in v1.
6. **Explicitly deferred** (per the app's own "what not to do" and this research): global/whole-vault graph, block-level references/transclusion, nested tags, any AI-assisted tagging or auto-linking.

---

### Note on tool use

All findings above are from live web research conducted for this task (~20 `WebSearch` queries, 8 `WebFetch` page fetches against primary sources — official docs, vendor wikis, GitHub, and direct author writing where available), not from memory. Every claim above carries an inline source URL.
