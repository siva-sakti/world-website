# The composition surface — preliminary spec

> # 📜 SUPERSEDED — DO NOT BUILD FROM THIS
> **Superseded 2026-09-04 by `composition-spec.md`** (VERIFIED, D-146 — four verification passes run and folded). This is preliminary thinking-spec (2026-08-31), written *before* that spec existed. Read as history.
> ⚠ **NOT yet merge-checked:** whether every still-current line here reached the verified spec has **not** been verified. A small "is anything lost?" pass is owed before this file is archived to `old/`. Until then: history only.

> ## STATUS · 2026-08-31 · 🟡 PRELIMINARY — a thinking spec, NOT a build plan
> Written mid-discussion at the owner's ask (*"this is not like 'here's the specs and we're gonna do it'"*). **Nothing here is ruled.** It gathers the convergence thread from `product-concept-promise.md` (§2c-bis → §The joint) into one buildable-shaped picture, plus quick research, so the owner can react to a whole instead of fragments.
> **Gates before this becomes real:** the owner's check-in (§8) → the naming session (every word here is a placeholder) → then a real plan through the item loop (`build-queue.md` §5), with step 2b first.

**Related:** `product-concept-promise.md` (the argument + the full trail) · `tables-and-structured-data.md` (the sheet/table fork) · `model.md` (the current model — unchanged by this doc) · `lexicon.md` (naming authority; "doc/deck/flow/frame/block" all unruled).

---

## 1 · The concept, drawn

```
                    DIVERGE                        CONVERGE
                 (free, spatial)                (formatted, shaped)

                  ┌───────────┐          ┌─────────────────────────────┐
   catch          │           │          │  FLOW      one throughline   │
  ┌──────┐        │   BOARD   │  ──────► │  (doc)     words w/ blocks   │
  │ bits │ ─────► │           │          ├─────────────────────────────┤
  └──────┘        │  spread · │  ◄────── │  FRAME     arranged, bounded │
   material       │  arrange  │          │  (deck)    sequenced pages   │
                  │  · draw   │          ├─────────────────────────────┤
                  └───────────┘          │  GRID      rows & fields     │
                                         │  (sheet)   — fork open       │
                                         └─────────────────────────────┘

        it is a CYCLE, not a line — either direction, any entry point
```

**The owner's frame:** *free to diverge, formatted to converge.* The board's freedom is the divergent surface's job; the convergent surfaces get their power from **format** — converging IS accepting structure (what order · what fits · what's cut). The trio maps to the tools creatives already keep open (Docs/Notion · Canva/Figma · Sheets) — familiar surfaces, novel supply line.

**The identity (the north star, grown):** the Obsidian fabric (links · backlinks · graph) stays underneath everything; the surfaces sit ON it. *Link fabric + free board + formatted surfaces.*

## 2 · The conceptual foundation — how everything enters, and the link matrix

**The two membership mechanics already exist** (`model.md`: *"placement is to a board what a reference is to a note"*):
- **gather** (`reference`) — a thing joins a **flow**, inline, linked. Today: the `[[` chip.
- **placement** — a thing joins a **space**, side-by-side. Today: the board.

**The full matrix — what can enter what, and how** *(the owner's "do we now play with all of this?" — laid out so it can be ruled cell by cell)*:

| from ↓ enters → | a DOC (flow) | a DECK frame | a BOARD |
|---|---|---|---|
| **a bit** | ✅ exists — gather chip; **grows into the bit-block** (§4.2) | 🔲 placement of the bit in the frame (board mechanics) | ✅ exists — placement |
| **a board** | 🟡 **a DOOR in the sentence** — chip → tap to open. *"You don't paste a room into a sentence"* holds; a door is fine | 🟡 **a live MINIATURE** — side-by-side gives a board room to be *seen*. The version where board-linking is genuinely good | ✅ exists — board-on-board doorway |
| **a composition** | ⚪ **composition→composition — the pitching case** (reuse chunks of an old pitch). Currently UNDECIDED in the model (notes-in-notes, parked at D-121). This spec forces the question | 🔲 a page-shaped doorway (N3 pattern) | ✅ exists — N3 doorway card |
| **a sheet/table** | 🟡 a table **block** (the working assumption; full-page view later) | 🔲 placed table | 🔲 doorway |

### ⭐⭐ THE NESTING (owner-directed, 2026-08-31): Obsidian's capabilities, nested under the grown model

**The owner:** *"I was really thinking in terms of Obsidian — links, backlinks. But if we're migrating from just-Obsidian into Obsidian-plus-more, I want to nest the Obsidian capabilities under the bigger picture."*

**The collapse: everything is TWO MECHANICS × THREE DISPLAY LEVELS.** The mechanics exist (`reference` = tied into flow · `placement` = set in space); the new axis is only *how much of the thing shows*:

| how much shows | in a composition (flow) | on a board / frame (space) |
|---|---|---|
| **POINTER** — a name you tap | the `[[` chip ✅ *(= Obsidian wikilink · Notion mention)* | the doorway card ✅ |
| **SHOWN IN FULL** — content, in place | **the bit-block** (§4.2, planned) *(= Notion embed · transclusion)* | the placed bit ✅ — the board always worked at this level |
| **LIVE VIEW** — a query rendered in place | **a saved-view block** — *the pull, embedded in writing* (engine territory, later — `tables-and-structured-data.md` §1b) | a board is nearly this, hand-arranged |

**The nesting itself:** **Obsidian = the pointer column + backlinks.** Notion adds the embed and view rows — bolted onto trapped content. **Ours: every cell writes a `reference` or `placement` row, so backlinks and the graph fall out of ALL cells automatically** — "gathered into" and the graph thread are the *reverse read of the whole grid*, not a feature beside it. Links/backlinks are thereby **promoted**: from the product's organizing idea to the connective tissue of a bigger organism (the north-star growth, D-053 → 2026-08-31).

**Still open, unchanged:** composition-in-composition (the pitch-reuse case) — every display level of it is unruled because notes-in-notes is unruled.

**Backlinks ride along free:** "gathered into" already reads `reference` backwards for bits. Every new arrow above is a `reference` or `placement` row, so **every one is backlink-able and graph-visible by construction** — the Obsidian fabric extends to the new surfaces without new machinery. *(The reference-threaded graph stays parked/evidence-gated; the data accrues either way.)*

⚑ **The one genuinely new model question this opens: composition→composition.** Everything else reuses ruled mechanics. This cell needs its own small ruling (the owner's own pitching flow needs it).

## 3 · The existing base — what the doc surface already is

Honest inventory (this is an *upgrade*, not a greenfield):
- **tiptap** is already the editor (`text-workspace.tsx` / `text-bit.tsx`) — rich text, the `[[` gather picker, chips with peek, reconcile-on-save references
- a real writing page (`/note/[id]`), the drawer with gather-from-a-row, titles, dates, tags, source, save-guard (flush on leave/hide), "gathered into"
- **What it is NOT yet:** blocks you can grab and reorder · checklists · tables · headings-as-structure · the bit rendered as more than a chip

## 4 · The capability spec — the doc surface (prelim, ①-first per the owner's lean)

### 4.1 Blocks (the Notion form factor, scoped)
**In:** paragraph · headings (2 levels) · bulleted + numbered lists · **checklist** · quote · divider · image (a bit) · **the bit-block** (§4.2) · **table block** (simple: typed-ish columns, sort; the full fork lives in `tables-and-structured-data.md`) · callout *(maybe)*
**Explicitly out (v1):** formulas · databases/views · toggles · columns-layout · embeds · equation · **anything collaborative**
**Interactions:** drag-handle to reorder · slash-or-`+` to insert · turn-into between text-ish blocks. *(Blocks are a doc-internal structure — they do NOT change what a bit is. The two-sentence story holds: bits are kept; writing is said.)*

### 4.2 The bit-block — gather, matured (the differentiator)
Today `[[` drops a **chip** (a word-sized reference). The grown-up version: the same gathered bit can render as a **block** — its full content (text · image · doodle) in the flow, with its source and tags one tap away. **Two display modes of ONE mechanic** (chip = inline mention · block = shown in full), owner-switchable per instance. ⚠ Unlike Notion's synced blocks — their content is *trapped in pages* and syncing is a bolt-on (see §6) — **our bits already live independently**; showing one in two places is native, not a hack. The seam, literal.

### 4.2b Text behavior the surface still owes (owner, 2026-09-03)
*"None of this is there right now — we were just making it as an elaboration of a text bit. For it to really be a TEXT INTERFACE it needs this and all the other Notion-like things."*
- **Text wrap around images** — ruled conceptually (*wrap yes, float no* — anchored, book-page style); the implementation (wrap positions: left/right of image, size interplay) is real editor work, listed here so it's costed.
- **Text alignment** (left/center/right at least) — absent today, expected of any real text interface; add to the v1 cut.
- The standing reminder: today's composition editor is a text *bit's* editor wearing a page — the whole §4.1 cut is what turns it into a text *interface*.

### 4.3 What "functional" means here (the owner's bar)
A working document you'd actually draft in: structure you can rearrange, lists that check off, a table that holds a tracker, the material of your world droppable into the text. **Not**: a Notion replacement, a database, or a collaboration surface.

## 4.4 · ⭐ THE SPEC AGAINST OUR BASE — what v1 actually is, in our code (read, not assumed; 2026-08-31)

**The base, verified:** one shared tiptap **v3.28** editor (`text-bit.tsx`: StarterKit + Link + the custom `BitRef` atom node), used by board cards AND the note page (`TextWorkspace` → `/note/[id]`). Body = HTML in `bit.body`; `[[` chips carry `data-ref`; references reconciled on save; 350ms debounce + the 3-way save-guard flush. `BitRefView` already fetches the target's content to render thumbnails + the tap-peek.

**The headline: v1 needs ZERO schema changes.** Everything below serializes into `bit.body` HTML — so `search_tsv` indexes tables and checklists for free, export carries them untouched, and `extractRefIds`/reconcile are unaffected. **The doc surface is the note page, upgraded — not a new thing.**

**Second headline: half the "blocks" already exist.** StarterKit v3 already ships headings · bullet/numbered lists · blockquote · code block · divider · undo/redo. They're in the editor today with no UI exposing them. Much of v1 is **surfacing what's installed**, not adding.

| v1 feature | how, concretely | size |
|---|---|---|
| headings · lists · quote · divider · code | **already in StarterKit** — expose in UI | UI only |
| **checklist** | `@tiptap/extension-task-list` + `task-item` (official, MIT) | S |
| **slash menu** (`/`) | the `@tiptap/suggestion` utility — **the same pattern as our `[[` watcher**; explicit-trigger rule from §6a applies | M |
| **turn-into** | the commands exist (`setNode`/`toggleList`); needs the block-menu UI | S–M |
| **table block** | `@tiptap/extension-table` (+row/cell/header, official) — serializes as HTML into body | M |
| **image-in-doc** | a small atom block reusing the `signedUrl`/thumb machinery `bit-ref-view.tsx` already has | M |
| **⭐ the bit-block** (§4.2) | a `display: 'chip'│'block'` attribute on the existing `BitRef` node — **`BitRefView`'s peek already fetches and renders the target's content; block mode ≈ "the peek, made permanent."** Serializes as one more data-attr on the same span; `extractRefIds` untouched | **S–M — the peek code is most of it** |
| **drag handles** | tiptap's drag-handle extension — ⚠ **VERIFY free-vs-Pro tier before planning**; community fallback exists (§6a jank rule: hover-revealed, never `draggable` on the text node) | M + verify |
| Enter-split · paste-structure · never-empty | largely ProseMirror defaults — **verify each against §6a's 8-point checklist**, don't assume | S |

**Scoping note:** the block UX (handles · slash menu · turn-into) belongs to the **page context** (`/note/[id]`, `/write`) — not inside little board cards. `TextBit` likely grows a `variant: 'card' │ 'page'` prop; the card keeps today's light editor.

**What her feel-test settles in this table:** toggle in/out (§6a) · how much table is enough (the sheet fork) · whether chip-vs-block wants a per-instance switch or a default.

## 5 · The frame surface (deck) — second, lighter (the owner: "less intense" for now)
One idea carries it: **a deck = a SEQUENCE of frames; each frame's interior is a small bounded board** — placement mechanics we already own, inside edges. Ordered (the format) · free inside (the Canva pattern) · printable/exportable because bounded. Everything else about it waits. 🔵 unruled.

## 6 · Research notes (quick pass, 2026-08-31 — sources in the session log)
1. **tiptap officially ships a Notion-like editor template + UI components** (drag handles · slash menu · blocks). **We are already on tiptap** — the form factor is substantially assembleable from the ecosystem we use, not a from-scratch build. *(Feasibility finding of the day.)*
2. **Notion's synced blocks are their retrofit of transclusion** (Ted Nelson's term — content living in multiple places, bi-directionally). It's their newest-ish, most bolted-on primitive, and access-permission-bound. **Our model has transclusion natively** — a bit is independent by birth; `reference`/`placement` ARE the transclusion records. Validation that §4.2 is architecturally downhill for us and uphill for them.
3. Block taxonomy baseline (Notion's block set) informed §4.1's in/out cut.

## 6a · ⭐ MECHANICS RESEARCH LANDED (2026-08-31 — full report + sources: `research-block-editors.md`)

**What it changes in this spec:**
1. **§4.1's cut is validated almost exactly** — ~10 text-first blocks is the converged core; **zero database blocks in v1** is not just our instinct, it's the unanimous informed-cut of every personal-tool alternative (Craft · Bear · Anytype · Capacities). And the report's sharpest line for us: *the personal tools replaced databases with something native to their own model —* **bits/boards/tags already fill that slot here.**
2. **⚠ One disagreement with §4.1's draft: TOGGLE.** The research puts toggle in Notion's core tier (practitioner lists + Notion's shortcut investment); our draft had it out. **Left to the owner's feel-test** — if toggles land on her never-touched list, out stands; if she reaches for them, in.
3. **§4.1's interactions become a concrete 8-point must-have checklist** (Enter-split · list-sibling · explicit-`/`-only slash menu · schema-aware turn-into · hover drag-handle · structure-preserving paste · cross-block selection · never-empty invariant) **+ 4 named jank traps to design against** — incl. the BlockNote lesson: a team abandoned the pre-baked framework over rigid schemas and rebuilt on raw tiptap. We start on raw tiptap.
4. **Deferrable, confirmed:** paste-URL menus · nested drag-drop · synced-block-style anything.

## 6b · ⚑ THE OWNER'S FEEL-RESEARCH PROTOCOL (offered 2026-08-31 — she volunteered; each task feeds a named spec section)

Hands-on in Notion, ~45 min total. **Write real content, never lorem** — feel-data is only real when the stakes are.

| task | do | answer while doing it | feeds |
|---|---|---|---|
| **A · Draft (20 min)** | write a real piece — something you actually want to write | what do you *reach for*? what *interrupts* you? what does Enter do that you like/hate? what happens when you paste? | §4.1 in/out cut |
| **B · Blocks (5 min)** | make a checklist; drag blocks around; turn one thing into another | does grabbing blocks feel like *arranging* or like *fighting*? | §4.1 interactions |
| **C · Tracker (10 min)** | build a 5-row table — galleries or publications, real ones | at what moment does the simple table stop being enough — sorting? a date? a status? | the sheet fork (`tables-and-structured-data.md`) |
| **D · Reuse (5 min)** | put the same content in two pages (synced block: select → ⋮⋮ → Turn into → Synced block) | does content-in-two-places feel natural or like a trick? | §4.2 the bit-block |
| **E · The A/B (5 min)** | make the same small page in Google Docs | what do you miss in each direction? | the form-factor question itself |
| **throughout** | — | **3 delights · 3 frictions · the blocks you never touched** | the v1 cut |

Findings land here in §6c when she reports. **Her never-touched list is the strongest v1-out evidence we can get.**

## 7 · What this spec deliberately does NOT do
Rule anything · name anything (step 2b owed on: doc · deck · sheet · block · flow · frame · bit-block) · sequence the build (the doc-first lean is the owner's, unruled) · touch schema · decide composition→composition · decide the sheet's fate.

## 8 · ⚑ THE CHECK-IN — what the owner reacts to next
1. **The matrix (§2):** right cells? Especially **composition→composition** — the one new model question.
2. **The bit-block (§4.2):** chip AND block as two displays of one gather — does that match your instinct?
3. **The v1 in/out cut (§4.1):** anything in that should be out, or out that you need in v1?
4. **The deck-as-framed-boards idea (§5):** park it as written, or is it wrong?
5. **Naming session before any build** — this doc added ~6 unruled words to the batch.
