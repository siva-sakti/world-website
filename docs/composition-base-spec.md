# The composition — the feature, whole

> ## STATUS · updated 2026-09-02 (morning session) · 🟠 WORKING — the single document for this feature
> **The process (owner-set):** Part 1 is the **ideal future state**, drafted whole and refined **additively** — new rulings amend it in place, so nothing lives only in chat. Then Part 2 (today), Part 3 (the gap → plan). ⚪ marks the spots still unruled.
> **Companions:** `note-storage-audit.md` (the evidence) · `composition-surface-spec.md` (the capability layer — blocks/Notion-feel — built AFTER this base) · `convergent-surfaces-overview.md` §00 (the layer map).

---

# PART 1 · THE IDEAL STATE — the COMPLETE feature (owner: "the total end state, all the ways we want to see it")

> ⭐ **THE NORTH STAR, the owner verbatim (2026-09-02):** *"**Notion, with Obsidian-like knowledge connection and graph capabilities** — is the ideal."* Notion's editing; Obsidian's fabric. Part 1 now holds the WHOLE ideal — base + capabilities — one picture. *(The capability detail worked out in `composition-surface-spec.md` is folded in as §1.10; that doc remains the working-out.)*

**Word pins (be exact, always):** **composition** = the writing surface only (formerly "note") — never a board. **board** = board. **link** = a `[[` reference in writing. **tag** = a word-label — a different mechanism entirely.

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
Settled cells: a bit into a composition (the `[[` chip) · a bit onto a board (placed) · a composition onto a board (the card) · a board onto a board (doorway). ⚪ Open cells: composition→composition · board→composition · what the `[[` picker offers · where backlinks show per target · whether the pull mixes all three kinds.

### 1.7a The sit-down agenda (nine cells, three questions each: makes sense? looks like? exists?)
| bring → into | a composition | a board |
|---|---|---|
| a bit | ✅ chip (+ the full block, capability layer) | ✅ placed |
| a composition | ⚪ a link-chip? its backlink? | ✅ the card (look ⚪) |
| a board | ⚪ a door in the sentence? | ✅ doorway (UI dormant) |
Plus: ⚪ the picker's contents (falls out of the yes-cells) · ⚪ backlink surfaces (a bit has "gathered into"; a board needs a "linked from"?) · ⚪ the pull with three kinds.

## 1.10 The capabilities (the Notion half — summarized from `composition-surface-spec.md`)
Blocks: ~10 text-first (paragraph · headings · lists · **checklist** · quote · divider · code · **a table in the writing** · image) — **zero database blocks** (the unanimous informed cut) · drag-handle reorder · `/` insert menu · turn-into · structure-preserving paste · never-empty · **the bit-block**: a gathered bit shown in full (quote/image itself, source attached — the provenance dividend) as the grown form of the chip. Word count. *(The 8-behavior feel checklist + jank traps live in the spec; the owner's Notion feel-session still feeds the fine cut.)*

## 1.8 In its room and in the world
Listed beside boards (home, its room) · starred/alive · found by full text · pulled by tag · exported always (I-G1) · *(later: published; handed over as a file — tracked, not here)*.

## 1.9 What it explicitly is not
Not material · not a container you place things ON (*"text-forward, like Notion"*) · not convertible to/from a bit · not public by default · never auto-created.

---

# PART 2 · WHAT EXISTS TODAY (honest, short)
A "note": a bit-row wearing `kind='note'` — architecturally material (public-default, gatherable-as-scrap, "loose"; the ~30-file seam — `note-storage-audit.md`). The editor: rich text + `[[` + drawer + save-guard, on its own page. The card on a board: a title-only door that navigates away. No floater, no panel, no deliberate board-door (paste births notes today — contradicting §1.2).

# PART 3 · THE GAP → THE PLAN
1. **Settle Part 1's ⚪ marks** (the fabric sit-down + Q1 storage shape + the card mock + naming).
2. **The migration** (code window's lane, house method): the surface shape · repoint relations · the sweep — sketch in `note-storage-audit.md` + the superseded §8 below.
3. **The board-side re-aim:** paste/type births bits · the deliberate compose door · the floater + panel + chain.
4. **Then the capability layer** (`composition-surface-spec.md`) on the corrected base.

## Settled-rulings log (additive)
2026-09-01: source dropped · titles auto-fill (both surfaces) · nothing placed on a composition · board catches material/surfaces on purpose · panel+floater ruled. 2026-09-02: **default-open = the floater; chain floater→panel→page** · compose-from-selection **dropped** (the board is atmosphere, not a checklist — gather covers the specific case).
## Open (only these)
Q1 storage drawer (shared/own — plain words asked, unanswered) · card look (mock it) · comp→comp one-word confirm (pin 2) · **the graph's lines** (own round) · auto-place on birth-board · floater count · drawer docking · **the words (Q9)**.
