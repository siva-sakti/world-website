# The composition — the feature, whole

> ## STATUS · updated 2026-09-02 (morning session) · 🟠 WORKING — the single document for this feature
> **The process (owner-set):** Part 1 is the **ideal future state**, drafted whole and refined **additively** — new rulings amend it in place, so nothing lives only in chat. Then Part 2 (today), Part 3 (the gap → plan). ⚪ marks the spots still unruled.
> **Companions:** `note-storage-audit.md` (the evidence) · `composition-surface-spec.md` (the capability layer — blocks/Notion-feel — built AFTER this base) · `convergent-surfaces-overview.md` §00 (the layer map).

---

# PART 1 · THE IDEAL STATE — the COMPLETE feature (owner: "the total end state, all the ways we want to see it")

> ⭐ **THE NORTH STAR, the owner verbatim (2026-09-02):** *"**Notion, with Obsidian-like knowledge connection and graph capabilities** — is the ideal."* Notion's editing; Obsidian's fabric. Part 1 now holds the WHOLE ideal — base + capabilities — one picture. *(The capability detail worked out in `composition-surface-spec.md` is folded in as §1.10; that doc remains the working-out.)*

**Word pins (be exact, always):** **composition** = the writing surface only (formerly "note") — never a board. **board** = board. **a `[[` tie** = the in-writing reference — ⚠ deliberately NOT called "link": the lexicon (D-129, repo root) gives *link* exactly one live meaning — **the `link` bit type the other window shipped** — and keeps the relationship-sense dead. What Obsidian calls backlinks = our **"gathered into."** All placeholders until Q9. **tag** = a word-label — a different mechanism entirely.

## 1.1 What a composition is
A **surface where you weave material into writing** — one made whole with a throughline. A peer of the board: the board arranges material in space; the composition weaves it into words. **Never material itself** — never loose, never in the inbox, never gatherable *as* a scrap. Born a composition, always a composition (no conversion, ever).

## 1.2 The principle that governs the board's side
> **The board catches material; surfaces are made on purpose.**

Everything that lands on a board by quick gesture — paste, drop, typing a card — is **a bit**. Starting a composition is always **a deliberate act**. (An empty just-born text bit still evaporates; uncontroversial now that it's a bit.)

## 1.3 Birth — three doors, all deliberate
1. **`/write`** — the composing room itself.
2. **From a board** — a "compose" door on the board. What you get is §1.4's floater, over the board you were looking at. ⚪ *is it auto-placed on that board?* (lean: yes — you made it here)
3. **Opening an existing one from a board** — same experience as 2.

## 1.4 The three frames — one editor, and the open chain (ruled)
The same editor lives in three frames, because *the entire point is looking at the board while you compose*:
- **the FLOATER** — a draggable mini compose window over the canvas. **The default**: tapping a placed composition opens this.
- **the SIDE PANEL** — the floater can dock into a right-side pane; board still visible.
- **the FULL PAGE** — one click from either; the composing room.

**The chain: tap → floater → (dock) panel → (open) page.** Escalating commitment, never forced. ⚪ one floater at a time (lean: yes, v1) · ⚪ the panel and the drawer both want the right side (lean: the drawer docks inside the compose context — browse material, drop it into the writing, see the board, all at once).

## 1.5 Its shape
**Title:** auto-fills with date/time when blank — a replaceable stand-in, never locked. *(Boards get the same rule; "untitled board" retires.)* **Body:** the writing. **Private by default.** **No source** — *"think of it like a board: there's multiple things happening there"*; citing something is a link, which is richer. **Tags · folder · star · states** (live/archived/trashed) — identical to a board's, one consistent machinery.

## 1.6 On a board
A placed composition appears as a card. ⚪ **its look: a door (title only) or a window (title + opening lines, resizable)** — decide by mock, not argument. Tap-behavior: §1.4's chain.

## 1.7 The fabric — what links to what (the sit-down, in progress 2026-09-02)
- bit → composition: ✅ the chip (and the full bit-block, §1.10)
- **composition → composition: 🟡 leaning YES** (the owner: `[[` "could tag another note" — read as link; pin 2 pending confirm). A chip **visually distinct** from a bit-chip.
- **board → composition: ❌ RULED OUT (owner, 2026-09-02)** — via ⭐ **THE DIRECTION PRINCIPLE:** *containment flows one way — the board HOLDS the composition; the composition never holds the board.* A piece that belongs with a board sits ON it; "click and see the board quickly" is served by the piece's existing **"on these boards"** list. `[[` reaches material and compositions; never boards. *(Closed TWICE over: the project's founding question — "gather a board into a note?" — reached the same no weeks ago by a different route: "you don't paste a room into a sentence." Independent re-derivation = the model's strongest truth signal.)* **Refinement (checked by the owner's ask, 2026-09-02): MENTION IS NOT CONTAINMENT.** The principle governs the **fabric** (gather · chips · reference rows · backlinks · graph). A **plain hyperlink** to a board in the writing stays legal — it exists today, writes no rows, earns no backlink, appears in no graph: a dumb door, the weight a passing mention deserves. The cross-project reflection piece ("my rebirth board taught me X…") is served by plain links; the hub case is a board of board-doorways, never a writing job. **Compositional inclusion is directional; navigation is free.** ⚑ **Deck flag:** a frame showing a live board-miniature is surface-showing-surface — the deck round must consciously RE-ASK this for frames, never inherit today's answer silently.
**Consequence: the board-backlink wrinkle dissolves** — boards receive no writing-links, so they need no "linked from"; placement is their relation and the canvas already shows it.
- `[[` behavior: ✅ **opens by search — type, results come up — in two sections** (material · surfaces).
- **backlinks: ✅ the FULL treatment** — a clickable backlink panel + **a graph view, the way Obsidian does it**. ⚪ **the graph's lines** — the owner: *"what are the lines — I'm not sure actually."* Parked for its own round (options/mocks, not argument). Dots almost certainly all three kinds; lines = links only vs. links+placements+shared-tags is the open choice.
Settled cells: a bit into a composition (the `[[` chip) · a bit onto a board (placed) · a composition onto a board (the card) · a board onto a board (doorway). ⚪ Open cells: composition→composition · what the `[[` picker offers · where backlinks show per target · whether the pull mixes all three kinds.

### 1.7a The sit-down agenda (nine cells, three questions each: makes sense? looks like? exists?)
| bring → into | a composition | a board |
|---|---|---|
| a bit | ✅ chip (+ the full block, capability layer) | ✅ placed |
| a composition | ⚪ a link-chip? its backlink? | ✅ the card (look ⚪) |
| a board | ❌ ruled out (the direction principle; a plain hyperlink stays legal) | ✅ doorway (UI dormant) |
Plus: ⚪ the picker's contents (falls out of the yes-cells) · ⚪ backlink surfaces (a bit has "gathered into"; a board needs a "linked from"?) · ⚪ the pull with three kinds.

## 1.7b ⭐ THE WEB, STRAIGHT (owner-ruled through 2026-09-02) — the definitive fabric table

| | can WRITE ties (`[[`) | can be TIED into writing | joins a BOARD | tagged/foldered |
|---|---|---|---|---|
| **bit** (text) | ✅ already live — the tie machinery never cared who writes | ✅ | ✅ placed | ✅ |
| **bit** (image·audio·pdf) | — (no body) | ✅ | ✅ placed | ✅ |
| **composition** | ✅ | ✅ **ruled YES 2026-09-02** — pieces reference each other; chips styled distinctly; "tied into" backlink + graph thread | ✅ as a card | ✅ |
| **board** | — (no body) | ❌ ruled out (direction principle; plain hyperlink legal) | ✅ board-on-board | ✅ |

**The owner's model insight behind it:** *an Obsidian note = our BIT* — Obsidian has one unit doing every job; this model separates small (bit) · big-made (composition) · spatial (board), and **stitching small into big is the product.** The atom-web partly exists already: a text bit's body can `[[` today.

**⚪ IDEATING (owner, 2026-09-02): a LESS-SPATIAL way to connect bits together.** Three candidate shapes: (1) **writing-ties only** — what exists; Claude's lean: a tie with no words carries no meaning six months later; (2) **the wordless pair-tie** — select two → relate; new record; the everyone-builds-nobody-understands-later risk; (3) **tie-with-a-phrase** — labeled; heavy. **Held at 1, with 2 as the evidence-gated candidate**: the moment the owner catches herself wanting to relate two bits with no words for why, 2 has its evidence. NOT ruled.

**Birth/list ruling (2026-09-02):** every composition auto-appears in the compositions list, always; one opened from within a board is additionally connected to that board (⚑ pin: "connected" = placed as a card — one-word confirm). **Floaters: MANY allowed** — display/management = design pass. Right side: panel + drawer share flexibly; details at design.

## 1.7c ⭐ WHAT CONNECTION MEANS — why tie, when the board exists (worked with the owner, 2026-09-02)

**The board gives CO-PRESENCE** (near, in one room, seen at once). **Connection gives four things co-presence can't:**
1. **Crossing rooms** — nearness exists only inside one board; a tie doesn't care where things live. *The board is local; the web is global.*
2. **Walkability** — standing at a thing: *where else does this idea live? what reached for it?* Backlinks · the pull · the graph. A board answers "what's in this room"; connection answers "where does this thread go" — the question that compounds over years.
3. **No layout duty** — placing = deciding where it goes; for the logical mind that's a TAX. A tie is relatedness with the spatial work stripped out.
4. **Undesigned structure** — a board is composed top-down; the web accrues bottom-up from hundreds of small acts and one day shows a shape nobody planned. The Obsidian magic; structurally impossible for a board.

**The three minds** (the owner: *"we're a tool for thought for different kinds of minds"*): spatial → the board ✅ · verbal → the composition 🟡 (this spec) · **connective → THE WEB** ⚠ — exists as records, **thin as a PLACE**. The July line again: *"thoughts connect three ways: shared words, shared places, threads tied on purpose."* ⚪ **The named big-open: where does the connective mind LIVE?** ("gathered into" + a pre-ties graph is all the room it has; the reference-threaded graph is parked. Not a build proposal — a flagged hole so it can't be the neglected big thing.)

### ⚪ New cells found by self-check (2026-09-02) — pending the owner's word
| cell | lean |
|---|---|
| a trashed **bit's** chip in writing | same rule as compositions: grey · frozen · restore door — *one rule for any tied thing* |
| an **archived composition's CARD** on a board | greys like its chips, still enterable — the class that broke archive-v1; needs an explicit word |
| the same piece open in **two frames** at once | design debt (frame-handoff) — Claude's to solve, tracked |
| the same piece in **two floaters** | no — one live editor per piece |

## 1.10 The capabilities (the Notion half — summarized from `composition-surface-spec.md`)
Blocks: ~10 text-first (paragraph · headings · lists · **checklist** · quote · divider · code · **a table in the writing** · image) — **zero database blocks** (the unanimous informed cut) · drag-handle reorder · `/` insert menu · turn-into · structure-preserving paste · never-empty · **the bit-block**: a gathered bit shown in full (quote/image itself, source attached — the provenance dividend) as the grown form of the chip. Word count. *(The 8-behavior feel checklist + jank traps live in the spec; the owner's Notion feel-session still feeds the fine cut.)*

## 1.8 In its room and in the world
Listed beside boards (home, its room) · starred/alive · found by full text · pulled by tag · exported always (I-G1) · *(later: published; handed over as a file — tracked, not here)*.

## 1.9 What it explicitly is not
Not material · not a container you place things ON (*"text-forward, like Notion"*) · not convertible to/from a bit · not public by default · never auto-created.

---

# PART 2 · WHAT EXISTS TODAY (honest, short)
A "note": a bit-row wearing `kind='note'` — architecturally material (public-default, gatherable-as-scrap, "loose"; the ~30-file seam — `note-storage-audit.md`). The editor: rich text + `[[` + drawer + save-guard, on its own page. The card on a board: **title + a faint body preview** (N3 — already *between* §1.6's two options; the mock chooses refinement, not direction), and tap navigates away. No floater, no panel, no deliberate compose door. **⭐ Paste and type-a-card ALREADY birth bits** (landed with N3, verified `use-create-doors.ts:120,458`) — §1.2's principle was independently already true in code; the checker caught Part 2 claiming otherwise. ⚪ reconcile at enactment: `model.md` flags notes lacking trash/archive UI in their room vs N1's built claim.

# PART 3 · THE GAP → THE PLAN
1. **Settle Part 1's ⚪ marks** (the fabric sit-down + Q1 storage shape + the card mock + naming).
2. **The migration** (code window's lane, house method): the surface shape · the full repoint list (reference.from · placement targets · tag_application · search_tsv/face · RLS · export · trash listing) · the sweep — base sketch in `note-storage-audit.md` §5; **a real enactment plan doc is owed before any build** (the checker: Part 3 as pointers is not buildable).
3. **The board-side build:** ~~paste/type births bits~~ **already true in code** — what remains is ONLY the deliberate compose door + the floater + panel + chain. *(As previously written an engineer would have re-scoped done work.)*
4. **Then the capability layer** (`composition-surface-spec.md`) on the corrected base.

## Settled-rulings log (additive)
2026-09-01: source dropped · titles auto-fill (both surfaces) · nothing placed on a composition · board catches material/surfaces on purpose · panel+floater ruled. 2026-09-02: **default-open = the floater; chain floater→panel→page** · compose-from-selection **dropped** (the board is atmosphere, not a checklist — gather covers the specific case).
## Open (only these)
Q1 storage drawer (shared/own — plain words asked, unanswered) · card look (mock it) · **the graph's lines** (own round) · auto-place on birth-board · floater count · drawer docking · archived-chip marking (design) · **the words (Q9)**.

---

## ⭐ THE RECONCILIATION (2026-09-02) — the convergence thinking, audited against this spec
Owner-asked: *"what had we thought about before — how do we bring it all together?"* Result: **nine-tenths carried; four items had slipped, now restored to the open list:**
1. **FRAME** — what a piece is FOR (audience · length · deadline). **The owner's own top flag** (*"the most important one, where we're still ideating"*) — had vanished entirely. ⚪ restored, ideation open.
2. **CULL** — in-or-out *for this piece* (the cut pile; include-in-compile; the thing no spatial tool has). ⚪ restored, unruled.
3. **EXCERPT** — quoting *part* of a bit; concretely broken for shipped PDF/audio (filename-only search). ⚪ restored; the stress-test's costed options stand (first-class excerpt-bit with a quote-hint was the reviewer's revised lean).
4. **GROUP-NAMING** — name a cluster on a board. Went down with the (rightly) rejected compose-from-selection; the naming half was never itself rejected. ⚪ restored, unruled.
Also surfaced: ⚑ **the owner's Notion feel-session is still owed** and the final toolkit cut waits on it. Everything else: carried, parked-on-purpose, or deliberately excluded — verified line by line against `convergent-surfaces-stress-test.md`, `convergent-surfaces-overview.md`, `product-concept-promise.md`, `composition-surface-spec.md`.

## Checker findings folded (independent audit, 2026-09-02 — full report in the session log)
**Verdict: comprehensive-with-holes; NOT yet buildable.** Fixed same-day: the ghost §8 pointer · two false Part-2 claims (paste already births bits; the card already previews) · stale board-cell leftovers · the "link" word collision (D-129 shipped a `link` bit type — *link* is now TAKEN; Q9 tightens).
**Owed before enactment (the author's debt):** the explicit **invariant map + full lifecycle trace** (gates 1–2, run and written — incl. what a chip shows when its target composition is *trashed*, what "loose" means post-migration) · floater mechanics + error states · frame-handoff (unsaved edits across floater→panel→page; the same composition open twice) · board-machinery parity (connectors · marquee · tidy-up on a composition's card) · the real migration plan doc.

## ⭐ THE N-ANSWERS (owner-ruled, 2026-09-02 walk-through)

| # | ruling |
|---|---|
| **N1 · visibility** | **Controls exist in the UI at last — on boards and compositions at least; bits get a mark-private control.** Compositions **born private**; existing note-rows **flip private at migration** (every stored value was a default, never a choice). Bits: *follow the board unless marked private; the mark is GLOBAL, never per-board* — ⭐ which re-derives **D-072's AND-rule exactly**; machinery unchanged, only the controls + the composition default are new. |
| **N2 · auto-title** | **Machine-written, fixed date/time format — but ONLY at click-out/save without a title.** Never minted just because you clicked in; background autosave does NOT mint it. ⚠ Amends **I-R1** (machine-never-writes) with one ruled exception: the exit-stamp title, fixed format, recognisably machine-made. Applies to compositions AND boards. |
| **N3 · chips of resting things** | **Trash:** chip greys + freezes; tap → *"this is in your trash — bring it out to see it"* (restore door; no entry while trashed). **Archive:** chip greys but **remains enterable** — it takes you there, clearly marked archived (*how* it's marked = a design pass, open). |
| **N4 · toolkits** | **Floater = basic** (text · marks · `[[`). **Panel ("half screen") and full page = the full toolkit.** |
| **N5 · phone** | **Full page for now** — the floater "wouldn't be as dynamic"; maybe later; revisit, not a blocker. |
| **N7 · arrows** | Dissolved into the prior, already-parked question: connectors exist in schema, **no drawing UI was ever built**, and the recorded lean stands (*arrangement is the connection; lines a rare power-move*). Stays parked; if ever built, compositions are uniform cards. |

**N6 · ✅ RULED (2026-09-02): EVAPORATE.** Clicking out with zero content is the *typical* gesture (a misclick, a changed mind) — nothing persists, no date-titled ghosts. Born-on-first-content everywhere; the born-then-emptied edge evaporates (D-111's rule carried forward).

## ⚑ NEW owner questions (the checker's — it was barred from answering)
| # | question |
|---|---|
| N1 | Existing notes were born `visibility='public'`. At migration: flip all to private, or keep stored values? |
| N2 | The auto-filled date/time title: **written into** the row (a machine write to an owner field — collides with I-R1) or **shown** when blank, like a face? |
| N3 | A composition that other writing ties to gets **trashed** — its chips elsewhere: frozen? greyed? gone? |
| N4 | The floater/panel: the **full block toolkit** (slash menu, drag, tables) or the light editor, full kit page-only? |
| N5 | On a **phone**, what do the floater and docked panel become? |
| N6 | An **empty just-born composition**: evaporate like an empty bit, or persist under its stand-in title? |
| N7 | Do **arrows (connectors)** get to point at a composition's card, like any other card? |
