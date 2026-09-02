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

## ⭐ THE THREE TIERS (owner's criticality triage, 2026-09-03 — the enactment plan lives by this line)
**T1 · the functional floor:** the migration · a real document (headings/lists/checklists/tables — editor work part-handed-off) · pulling-in + piece↔piece `[[` · list/page/cards. *Functional = T1 alone.*
**T2 · the identity:** the floater + panel ("part of our entire thing") · auto-place · the distinct card · the hide toggle · silent bit-hood · the drawer's in-this-piece tab. *The product = T1+T2.*
**T3 · the shelf:** all F-features incl. the board-peek (F-6 — owner: *"doesn't seem like the most critical feature"*, correctly). *Never blocks anything.*

1. **Settle Part 1's ⚪ marks** (the fabric sit-down + Q1 storage shape + the card mock + naming).
2. **The migration** (code window's lane, house method): the surface shape · the full repoint list (reference.from · placement targets · tag_application · search_tsv/face · RLS · export · trash listing) · the sweep — base sketch in `note-storage-audit.md` §5; **a real enactment plan doc is owed before any build** (the checker: Part 3 as pointers is not buildable).
3. **The board-side build:** ~~paste/type births bits~~ **already true in code** — what remains is ONLY the deliberate compose door + the floater + panel + chain. *(As previously written an engineer would have re-scoped done work.)*
4. **Then the capability layer** (`composition-surface-spec.md`) on the corrected base.

## Settled-rulings log (additive)
2026-09-01: source dropped · titles auto-fill (both surfaces) · nothing placed on a composition · board catches material/surfaces on purpose · panel+floater ruled. 2026-09-02: **default-open = the floater; chain floater→panel→page** · compose-from-selection **dropped** (the board is atmosphere, not a checklist — gather covers the specific case).
## ⭐ RULED 2026-09-02 (evening) — three more, plus banked evidence
1. **Auto-place: YES.** A piece started or opened from within a board **appears as a card on that board** — *"wherever it's clicked, it's got to appear somewhere there."* The "connected = placed" pin is closed.
2. **The piece-card must look visibly DIFFERENT from a bit-card** — a design requirement for the mock, not an open question.
3. **🆕 A per-board toggle to HIDE the piece-cards** — *"if you just want to compose but don't want to see them on your surface, and you want them to be linked and related."* Presentation-only: placements untouched, the board shows material only while toggled.

**Evidence banked for S5/S12 (the bit-web):** the owner confirmed she IS the knowledge worker, and her **founding mental model of connection** was *"a note where I'm typing, but I'm bringing bits in"* — the writing-tie is her native gesture, not Claude's lean. The live question narrows to **STEERING**: a faster on-ramp into that motion from deep-in-text, not a different mechanism.

## ⭐ THE TABLE WALK (owner, 2026-09-02, late) — the fabric closed cell by cell
- **piece↔piece: ✅ FORMALLY CONFIRMED** — `[[` referencing between pieces, *"the basic Obsidian."*
- **piece-on-board as a card: ✅ affirmed** (*"I like that quite a lot"*).
- **The bit-block REOPENED and re-shaped by the owner:** not "shown in full" — **preview-sized by default, full only when full is small.** By type and size: an image in full ✅ · short text in full ✅ · long text = first lines + tap-to-expand (the peek, inline). ⚑ awaiting her stamp on this formalization.
- **bit↔bit: the close look, concluded (⚑ awaiting stamp): NO fourth mechanism — deliberately.** The owner's own observation decides it: bits are reused across boards, so bit-relations are *contextual* — and a bare global tie is context-free, the wrong shape ("related how? for which thinking?"). The existing three each carry context: a board (*here*) · a tag (*under this word*) · co-pulled into writing (*for this stated reason* — her founding gesture). What improves instead: **steering** — a fast on-ramp to the connective note (e.g., "write about this" from a bit's page, pre-pulled).
- **board↔board, honest state:** the doorway is a *placement*, not a writing-link (boards don't write). The reverse ("which boards hold a door to me") is **stored but invisible** — no screen shows it; parked with the dormant doorway UI.
- **board→piece: DELIBERATELY single-channel** — a board relates to a piece only by *holding it as a card*; no second mechanism exists or should (every board-relation is a holding; every writing-relation needs a writer). Owner asked for this to be chosen, not accidental — ⚑ her stamp closes it.

## ⭐ STAMPS + ANSWERS (owner, 2026-09-02, closing the fabric)
- **bit↔bit: ✅ STAMPED** — no fourth mechanism, deliberately (*"I guess I agree with you"*).
- **board→piece: ✅ STAMPED** — single-channel, holding-as-card only (*"that makes sense"*).
- **The image in writing:** per-instance sizing (thumbnail ↔ full inline, like any doc editor) — **always carrying its bit-hood** (tap → source · tags · life). The owner re-derived the native-transclusion differentiator herself: *"an image on a composed surface is not just an image sitting there — it's actually a bit."* ⚑ shape set, final word hers.
- **board↔board seeing-side, answered:** shows today only as the doorway card on the holding board; the reverse shows nowhere. Natural spots if wanted: the held board's header ("held by: …") or the outline lens. **Parked WITH the dormant doorway UI** — design the seeing with the doorway, not before.
- **A piece on multiple boards, answered:** placements, exactly like bits — N boards, each card independent (own position), un-place one leaves the rest, born on the birth-board, more from its page; the hide-pieces toggle is per board.

## ⭐ THE SILENT BIT-HOOD RULE + THE BACKWARDS CHECK (2026-09-02, late)
**The design rule (from the owner's "annoying for everything to be bit-shaped" worry):** in the writing, a pulled-in thing **looks like normal content** — an image is an image, a quote reads as a quote; **bit-hood is silent until summoned** (tap/hover → source · tags · life). Annoyance = ceremony; there is none. Docs-calm, superpowers on demand.
**✅ THE PASTE-FRESH FORK — RESOLVED BY THE OWNER'S PRINCIPLE (2026-09-02, late):** *writing on that surface is meant to be seamless* — pasting mid-flow is part of SAYING, not keeping; **auto-minting bits there would make automatic what must stay deliberate.** So: **pasted-into-writing = mere content, never auto-bit** (Claude's quietly-yes lean conceded — wrong by the owner's own two-sentence story). The completion: **"make this a bit"** — the deliberate catch act, selectable from inside writing (filed F-5). The board catches by default (keeping surface); the composition never does (saying surface); the deliberate act works everywhere. **The asymmetry is the two surfaces being true to what they are.**
**⚑ The original open-cell note (superseded above, kept for trail):** content **pasted fresh** into writing (an image dropped straight in, never from your world) — does the composition *catch* it as a bit (one class of content; the bits room slowly gains one-off images, managed by filters — Claude's lean, quietly-yes) or is it mere document content (lighter; two classes of image, one dead)? The board's parallel is ruled ("the board catches material"); the composition's isn't. For the walk.
**The backwards check (all cardinalities):** every relation many-to-many EXCEPT two deliberate singulars — **one folder per thing** · **one source per bit**. Mutual piece↔piece reference allowed (two pointers); self-reference already constraint-blocked. **🆕 Found by the check: no guard stops a board holding a doorway to ITSELF** — absurd, harmless while the UI is dormant, added to the enactment list for a constraint.

## ⭐ LATE ADDITIONS (owner, 2026-09-02, closing the night)
- **The line, her words:** *composition = LINEAR — lines · board = FREE SPACE — drag anywhere.* The cleanest statement of the two surfaces yet.
- **Text WRAPS around images in a composition — "but not as flying":** wrapped and anchored in the flow (book-page style), never free-floating (that's the board's nature). The founding wish ("wrap a paragraph around a sketch") landing right-sized: **wrap yes, float no.** → the document surface's capability cut.
- **The bit roster, explicit:** text · image · drawing · voice recording · PDF · saved link — **+ TABLE as the leading candidate type** (a tracker living loose / on a board / pulled into writing — the sheet question's small end; ties to `tables-and-structured-data.md`).
- **Terminology discipline:** "composition" consistently as the placeholder (Claude had drifted to "piece"); the real word = the naming session.
- **Excerpt + make-this-a-bit + PDF/audio-passages = ONE design, three cases** — a bit born from inside something, remembering its parent. All unbuilt; designed together at enactment.

## ⭐ THE CONTENT LAW + morning rulings (owner, 2026-09-03)
- **⭐ THE LAW (owner's symmetry idea, refined): CONTENT IS BITS; STRUCTURE IS FORMATTING. The two surfaces share ONE content roster.** Everything placeable on a board is pullable into a composition — same objects (text · image · drawing · recording · PDF · link · candidate table/video). The composition's own extras — headings · lists · checklists · dividers — are formatting, never bits. Notion mapped: their content blocks ≈ our bit types; their structure blocks ≈ our formatting. Every new bit type works both surfaces automatically.
- **No floating on the composition: ✅ STAMPED** (*"we already have the board for that"*).
- **Source at minting confirmed:** drop a quote in → make it a bit → add its source then, if you choose; never required.
- **🆕 The drawer's "IN THIS PIECE" scope** (owner's idea): on a composition's page, a drawer tab listing everything pulled into *this* piece, each expandable to read WHOLE beside the writing. Completes the posture pair: *inline = the flow, cropped · drawer = the material, whole* (the board+floater remains the spread-and-look home). Cheap — the pulled-list exists as data.
- **Bit-type candidates named, none queued:** video · generic file. Roster grows by demonstrated want only.

## ⭐ THE FOUR DIMENSIONS + the formatting corollary (owner + Claude, 2026-09-03 morning)
**The vocabulary, complete:** **CONTENT** (bits — one roster) · **STRUCTURE** (surface-native grouping: the board groups by POSITION, the composition by SEQUENCE — headings are the text version of spatial clustering, the owner's analogy confirmed) · **RELATION** (pulling-in · placement · the tie) · **ORGANIZATION** (tags · folders · sorting).
**The formatting corollary (dissolves "checklist bit" and "table bit"):** formatting belongs to the EDITOR, and every surface hosting written text inherits it — so a text bit can BE a checklist or contain a table with zero new types. The typed-fields tracker stays the separate engine question.
**"A linear non-spatial board"** = the outline lens (built) / parked document-mode. Covered.

## ⭐ HANDOFF TO THE CODE WINDOW (owner-directed, 2026-09-03): three builds, safe now
1. **Checklist formatting** (task-list extension, shared editor) — no schema · 2. **Table formatting** (table extension, same) — no schema · 3. **Generic FILE bit type** — schema CHECK + upload (generalize the pdf/audio machinery) + a card; migration-independent (bits stay bits).
**The handoff is written for the code window: `editor-formatting-and-file-bit-plan.md` (repo root)** — full context, three builds, verification, the don't list. **Owner nuance folded in:** the checklist capability is formatting in the ONE shared editor, and the *choosing* is a **"+ checklist" door** on the board (births a pre-shaped text bit; subtype stamping deferred to the owner's vocabulary call).
**⛔ Explicitly NOT yet:** anything touching note/composition behavior (floater · note-page block UX) — lands AFTER the storage migration, per sequencing.

## ⭐ THE WALK (started 2026-09-03) — itinerary + station stamps
Stations: **1 concept ✅** · 2 the four dimensions · 3 the life (every behavior) · 3b screens/controls/states (empty·error·loading·phone) · 4 the scenes S1–S12 · 5 the edges (deliberate absences) · 5b data & invariants · 6 what remains + acceptance criteria on everything.
**Station 1 ✅ (owner):** the motion is a **RHYTHM** (diverge↔converge, repeatedly, never one-way) · **both surfaces are FORMATS** — board = spatial format, composition = linear format, two powers · creation is **absolutely deliberate** ("it could never just happen") · **privacy pulled OUT of the concept** — visibility (everything togglable) is its own later session; the migration's safe-default flip stays as a data matter only. ⚑ one re-confirm pending: the legibility half (a board speaks mostly to its maker; a composition is legible to any reader).

**Station 2 ✅ (owner, with amendments):** CONTENT — the law softened to a **premise, not dogma** (*"the goal is not neglecting functionality, more than being dogmatic"*); default holds, exceptions chosen deliberately · STRUCTURE — sequence at every scale (characters→blocks→sections); order is the composition's dimension as position is the board's · RELATION — board-inline re-stamped NO; **⚪ re-opened softly: *some* way to relate a board inside a composition** — three shapes on the table: the plain link (ruled, ugly) · **the plain link made beautiful** (an unfurled styled door, NO fabric relation — mention dressed well; Claude's lean) · placement as the strong tie (exists). Owner still thinking · ORGANIZATION ✅ unchanged.
**Outside-the-list additions (owner-invited):** **PROVENANCE as the quiet fifth dimension** (source · made-from — designed, not accreted) · **TIME as a parked lens** (F-2/F-3) · **⚠ IMPORT — the missing topic**: how a person's existing mess arrives (Apple Notes · camera roll · **Are.na channels** — the switcher's first moment; nothing exists) · **TYPOGRAPHY named load-bearing** for this surface (the aesthetics track owns it; the spec must not treat it as paint) · **SCALE note for enactment** (the picker/drawer/search at 5,000 bits).

**⭐ THE ITCH, TRULY RESOLVED (2026-09-03): its content was CO-PRESENCE, not relation.** The owner located it: *"when I'm writing I wanna see my vision board(s) in my composition surface — the opposite of seeing compositions in the board space."* Not a link, not a record — **the mirror posture: typing big, boards small.** Filed as **F-6, the board-peek** (`future-features.md`) — the general law: *either surface can host a small window of the other; the variable is who holds the wheel.* The six-servings closure below stands for the *relation* wants; the co-presence want has its own feature now.
**The board-connection itch — CLOSED BY COVERAGE (2026-09-03, with a tripwire):** six nameable wants, six existing servings — placement (whole-to-whole) · **the owner's own hide-toggle** (related-not-visible) · auto-place-at-birth (written-from) · travel history (past relation) · "on these boards" (navigation) · the plain link (mention). **The asymmetry is principled:** pieces are READ (references live in the text, `[[`); boards are VISITED (relations are structural, placement). Tripwire: a real unserved moment reopens it.
**Station 3a delivered (births + openings), pending stamps:** three birth doors (write page · from-a-board→floater+auto-place · later templates), all deliberate, born-on-first-content, evaporate/date-title physics standing · four openings (card→the chain · list/search→full page directly · chip→peek first · phone→page). ⚑ owner's double-check requested: list→full-page-directly.

**Stations 3a–3c (the walk, 2026-09-03):** 3a ✅ (doors 1–2 stamped · **templates = a MODE inside the doors, not a door** — blank-or-preshaped at any entrance, owner's correction · openings ✅ incl. list→page) · 3b ✅ all six · 3c ✅ trash-like-bits · archive-available · card-vanishes-while-trashed · frozen chips · destruction. **Create-on-miss (`[[a-new-name]]` births it): OUT** — owner: *"we wouldn't know what to create it as"*; a shortcut needs a designed pathway; maybe-later only. **The three sizes of presence, pinned for good:** CHIP = the name · PEEK = the glimpse on tap · BLOCK = content in place, preview-sized. ⚑ one stamp left in 3c: the ARCHIVED card = greyed, present, still opens (matching her archived-chip ruling).

## ⭐⭐ THE REFERENCE SYSTEM, WHOLE (designed 2026-09-03 — the owner's "what do we actually want to see happen," answered as one piece; ⚑ whole-block stamp pending)
1. **Who references:** compositions ONLY — material never references (the flatness call absorbed here).
2. **What's referenceable:** bits (any type) + compositions; never boards (direction principle).
3. **Front-links:** the writing IS the list — chips/blocks in context; the drawer's "in this piece" tab gathers them, readable in full.
4. **Backlinks, one pattern everywhere pointable:** a bit's page "pulled into: …" (exists) · a composition's page the identical section (new) · boards need none — dissolved, not designed.
5. **Display, three rungs:** chip (the face: caption→first words→thumbnail; links: headline→domain) · peek on tap · block (preview-sized; full only when small; wrap never float); chip-vs-block per instance; silent bit-hood.
6. **Resting targets:** trashed→frozen grey chips · archived→grey enterable marked · destroyed→plain-text degradation. Writing is never falsified.
7. **The graph** reads all reference+placement rows — own round later; rows accrue correctly from day one.
8. **Migration hygiene:** old bit-authored references counted + converted at enactment, never silently dropped.

## (absorbed) THE FLATNESS CALL (2026-09-03 — owner's instinct + recommendation, ⚑ her stamp pending)
> **Material is flat; only surfaces weave.** After the split, pulling-in (`[[`) is a **composition capability** — text bits lose it (today they technically have it via the shared editor).
**Why:** the differentiation made real (bits get referenced, never reference) · kills the nesting spiral the owner flagged ("a lot of complication") · **the drafted migration schema already says references come from surfaces only** — instinct and schema converged independently · formatting (checklists/tables) stays shared — capability vs formatting split cleanly, the editor variant carries it.
**The named cost (accepted-pending-stamp):** the tiny connective thought (S5's answer) becomes a **small composition** — a thought that weaves IS a small piece of writing; the list sorts. **Migration footnote:** existing text-bit-authored ties get grandfathered/converted at enactment, counted then.
**Link-bit chips:** the face = the captured headline, else the domain — the retired bookmark's own face rule, revived for the link type.

## Open (only these)
Q1 storage drawer (decided LAST, after behavior) · card look (mock it — bit-card vs piece-card distinctly styled) · **the graph's lines** (own round) · auto-place on birth-board · floater count · drawer docking · archived-chip marking (design) · **the words (Q9)**.

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
