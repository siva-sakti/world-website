# The composition surface — preliminary spec

> ## STATUS · 2026-08-31 · 🟡 PRELIMINARY — a thinking spec, NOT a build plan
> Written mid-discussion at the owner's ask (*"this is not like 'here's the specs and we're gonna do it'"*). **Nothing here is ruled.** It gathers the convergence thread from `product-concept-promise.md` (§2c-bis → §The joint) into one buildable-shaped picture, plus quick research, so the owner can react to a whole instead of fragments.
> **Gates before this becomes real:** the owner's check-in (§8) → the naming session (every word here is a placeholder) → then a real plan through the item loop (`organize-phase-plan.md` §5), with step 2b first.

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

### 4.3 What "functional" means here (the owner's bar)
A working document you'd actually draft in: structure you can rearrange, lists that check off, a table that holds a tracker, the material of your world droppable into the text. **Not**: a Notion replacement, a database, or a collaboration surface.

## 5 · The frame surface (deck) — second, lighter (the owner: "less intense" for now)
One idea carries it: **a deck = a SEQUENCE of frames; each frame's interior is a small bounded board** — placement mechanics we already own, inside edges. Ordered (the format) · free inside (the Canva pattern) · printable/exportable because bounded. Everything else about it waits. 🔵 unruled.

## 6 · Research notes (quick pass, 2026-08-31 — sources in the session log)
1. **tiptap officially ships a Notion-like editor template + UI components** (drag handles · slash menu · blocks). **We are already on tiptap** — the form factor is substantially assembleable from the ecosystem we use, not a from-scratch build. *(Feasibility finding of the day.)*
2. **Notion's synced blocks are their retrofit of transclusion** (Ted Nelson's term — content living in multiple places, bi-directionally). It's their newest-ish, most bolted-on primitive, and access-permission-bound. **Our model has transclusion natively** — a bit is independent by birth; `reference`/`placement` ARE the transclusion records. Validation that §4.2 is architecturally downhill for us and uphill for them.
3. Block taxonomy baseline (Notion's block set) informed §4.1's in/out cut.

## 7 · What this spec deliberately does NOT do
Rule anything · name anything (step 2b owed on: doc · deck · sheet · block · flow · frame · bit-block) · sequence the build (the doc-first lean is the owner's, unruled) · touch schema · decide composition→composition · decide the sheet's fate.

## 8 · ⚑ THE CHECK-IN — what the owner reacts to next
1. **The matrix (§2):** right cells? Especially **composition→composition** — the one new model question.
2. **The bit-block (§4.2):** chip AND block as two displays of one gather — does that match your instinct?
3. **The v1 in/out cut (§4.1):** anything in that should be out, or out that you need in v1?
4. **The deck-as-framed-boards idea (§5):** park it as written, or is it wrong?
5. **Naming session before any build** — this doc added ~6 unruled words to the batch.
