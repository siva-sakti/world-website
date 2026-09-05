# The convergent surfaces — the whole picture

> # 📜 SUPERSEDED — DO NOT BUILD FROM THIS
> **Superseded 2026-09-04 by `composition-spec.md`** (VERIFIED, D-146 — four verification passes run and folded). This is the convergence session's overview (2026-08-31), written *before* that spec existed. Read as history.
> ⚠ **NOT yet merge-checked:** whether every still-current line here reached the verified spec has **not** been verified. A small "is anything lost?" pass is owed before this file is archived to `old/`. Until then: history only.

> ## STATUS · written 2026-08-31, end of the convergence session · 🟡 NOTHING HERE IS RULED
> **The one clean read** of where the convergence thinking stands — for the owner's morning. Every section points at the doc that holds its full detail and trail. When something below gets ruled, it graduates; until then this is the live synthesis.
>
> **The governing intent (the owner, 2026-08-31):** *"My goal is to get as much surface area, as many features as sensible in our model — and accommodate all of it."* 🟢
> **The method that serves it (Claude's stance, owner-checked):** *compress the MACHINERY, never the POSSIBILITY.* Fewer primitives ≠ fewer features — fewer primitives is how everything becomes possible without sprawl.

**Detail docs:** `product-concept-promise.md` (the full trail + corrections) · `composition-surface-spec.md` (the doc surface) · `tables-and-structured-data.md` (the engine) · `research-block-editors.md` · `research-structured-data.md` (both landed, sourced).

---

## 00 · ⭐ THE TOP-DOWN PICTURE (the owner's rethink, 2026-09-01) — read before everything

**Why things felt tangled:** four questions at four layers were open at once, all wearing the word "note." Untangled:

| layer | the question | state | moves when |
|---|---|---|---|
| **1 · concept** | what IS a composition? | 🟢 near-ruled: **a different LAYER of the creative process — the convergent one. Not on par with bits** (the owner, repeatedly). Taggable ✅ · folderable ✅ · placeable on boards ✅ — all already true today | needs saying once, on purpose |
| **2 · links** | what can reference what? | 🟡 **composition→bit built both ways.** ⚪ **composition→composition UNDECIDED — and it is the Obsidian primitive** (in Obsidian the whole fabric is note→note; we filed our equivalent as an edge case all week). comp→board ❌ small (A15) · comp→source ❌ small | one-line rulings each — **next** |
| **3 · capability** | what can you DO in one? | 🟡 spec'd (`composition-surface-spec.md`); waits on ⚑ the owner's Notion feel-session | after the session |
| **4 · storage** | where does it live in the DB? | 🟠 **AUDITED 2026-09-01 (`note-storage-audit.md`): the seam is ~30 files, not small** — ⚠ an earlier "5 occurrences/3 files" claim here was a broken grep. The app code is AHEAD of storage; every kind-branch is a bridge. D-121's bet was real and **has finished paying** | **ONE narrow ruling gates it** (one `surface` table with a form marker, or notes' own table) — and that ruling **unifies the link fabric** (comp→comp and comp→board become the same row; A15 dissolves). Rule it WITH layer 2 |

**The fabric, plainly:** a reference is one row — *"this writing reached for that thing."* The `[[` chip is the forward link · "gathered into" is the backlink · the graph reads the rows · **placement is the fabric's other half** (linking by space instead of by writing).

**The way forward: rule top-down, build bottom-up.** Say the layer-1 sentence → rule the link cells (esp. comp→comp) → capabilities per spec → storage decides itself last. Bugs from the storage seam get fixed locally, never with a migration.

## 0 · ⚠⚠ READ THIS FIRST — an independent stress-test (2026-09-01) challenges most of what follows

Full findings + sources: **`convergent-surfaces-stress-test.md`**. Headline:

> **Convergence is TEN operations. This app serves two. The trio of surfaces addresses ONE of them.**

| # | operation | today | | # | operation | today |
|---|---|---|---|---|---|---|
| 1 | **frame** (commit to a target) | ❌ | | 6 | **group** (cluster *and name*) | ❌ |
| 2 | **gather** | ✅ | | 7 | **merge** | ½ |
| 3 | **select / cull** (in-out **per piece**) | ❌ | | 8 | **commit** (a version) | ❌ |
| 4 | **excerpt / split** | ❌ | | 9 | **revise** | — |
| 5 | **order** (authored) | ❌ | | 10 | **emit** (a file for a person) | ❌ |

**The claim:** what's missing is **records and acts**, not surfaces — a per-piece in/out flag · an authored order · a named group · an excerpt. Doc·deck·sheet·outline·board are **five renderers of the same facts.**
**The indictment, from our own §4:** *"the craft goes into the seams… not more board features"* — **and the plan puts all the craft into three destinations.**
**Verdicts:** "formatted to converge" **WEAK** (the variable is *constraint*, not *format* — and **a more capable doc is a more divergent doc**) · the trio **WEAK** (the real axis is *what carries the structure*; it omits **stored nesting**) · the 2×3 grid **WRONG as claimed** (a live-view block writes no row, so backlinks do **not** fall out of every cell) · **rows-are-bits SOUND but unpriced** (I-N1 ⇒ every tracker row loose forever) · sequencing **WEAK** (the sheet is cheapest, the deck heaviest — our estimates were inverted).
**Kept:** the **bit-block** and **rows are bits** — Heptabase's own rule is our model verbatim: *"Whiteboards do not own cards. All cards belong to the Card Library."*
**The unclaimed ground:** Mural/Miro order space but export *pictures*; Longform carries *text* but has no canvas. **Nobody carries text and keeps free space.**

🔵 **This is a reviewer's opinion, not a ruling** — but it is heavily sourced and it corrected itself twice on evidence. **Everything below is now under question.**

## 1 · The frame — one sentence, and the picture

> **Free to diverge. Formatted to converge.** *(the owner's model, stated consistently across the whole session)*

```
                    DIVERGE                          CONVERGE
                 (free, spatial)                 (formatted, shaped)

                  ┌───────────┐          ┌──────────────────────────────┐
   catch          │           │          │  DOC     flow — words with    │
  ┌──────┐        │   BOARD   │  ──────► │          a throughline        │
  │ bits │ ─────► │           │          ├──────────────────────────────┤
  └──────┘        │  spread · │  ◄────── │  DECK    frames — arranged,   │
   material       │  arrange  │          │          bounded, sequenced   │
                  │  · draw   │          ├──────────────────────────────┤
                  └───────────┘          │  SHEET   grid — rows, fields, │
                                         │          views                │
                                         └──────────────────────────────┘

              a CYCLE, not a line — either direction, any entry
```

**Why formatted:** a format *forces* the convergent decisions — what order, what fits, what's cut. Structure is not the compromise; it's the convergence. The trio maps to the tools creatives already keep open (Docs/Notion · Canva/Figma · Sheets): **familiar surfaces, novel supply line.**

**The headline diagnosis that started it all:** the app built its divergent half beautifully and converges into a text box — while the positioning line (*"we accommodate the process of getting from divergent to convergent"*) rests on the missing half.

## 2 · The identity — the north star, grown

| era | the statement |
|---|---|
| D-053 (July) | *"Obsidian, but an interactive canvas"* |
| **2026-08-31** | **the link fabric (Obsidian) + the free board (diverge) + the formatted surfaces (converge)** |

Nothing Obsidian-ish is lost — links/backlinks/graph are **promoted from organizing idea to connective tissue** (see §4: they're the reverse-read of every cell).

## 3 · The three surfaces — state of each

| surface | what it is | state | the essentials |
|---|---|---|---|
| **DOC** | flow — blocks in a document | ⭐ **spec'd, first in the owner's lean** | the note page *upgraded*, not a new thing · **zero schema changes** (all serializes into `bit.body`) · half the blocks already installed (StarterKit) · the **bit-block** ≈ the peek made permanent · 8-behavior feel checklist + 4 jank traps from research · v1 = ~10 text-first blocks, **zero database blocks** (unanimous informed-cut of Craft/Bear/Anytype/Capacities) → `composition-surface-spec.md` |
| **DECK** | frames — bounded, sequenced | 🔵 sketched, second, lighter | one idea carries it: *a sequence of frames; each frame's interior a small bounded board* — the Canva pattern on placement machinery we own → spec §5 |
| **SHEET** | grid — rows, fields, views | ⭐ **conceptually checked + technically researched** | see §5, the engine |

## 4 · The connective grid — Obsidian and Notion, nested

**Everything is two mechanics × three display levels.** The mechanics already exist: `reference` (tied into flow) · `placement` (set in space). The axis is *how much of the thing shows*:

| how much shows | in a composition (flow) | on a board / frame (space) |
|---|---|---|
| **POINTER** — a name you tap | the `[[` chip ✅ *(Obsidian wikilink · Notion mention)* | the doorway card ✅ |
| **SHOWN IN FULL** | **the bit-block** (planned) *(Notion embed · transclusion)* | the placed bit ✅ |
| **LIVE VIEW** — a query in place | a **saved-view block** — the pull, embedded in writing (later) | a board is nearly this, hand-arranged |

- **Obsidian = the pointer column + backlinks.** **Notion adds the embed and view rows** — on content trapped in pages.
- **Us: every cell writes a `reference` or `placement` row → backlinks and the graph fall out of ALL cells automatically.** The full grid, on two existing mechanics, with native transclusion (a bit is independent by birth — what Notion's synced blocks retrofit, we have structurally).
- **The build map is the grid:** 4 cells built · 1 planned (bit-block) · 1 later (view-block).

## 5 · The engine (the sheet's insides) — small, and confirmed

**The four jobs of "a database engine," mapped:**

| job | our model today |
|---|---|
| typed properties | ⚠ the real gap — user-defined fields (deadline · status · number) |
| views (filter/sort many ways) | ✅ native — **the pull IS a live view**; stored-vs-computed is house law |
| relations | ✅ `reference` + `placement` are relations, with backlinks + a graph |
| computation (formulas) | ⏸ **parked, owner-confirmed** — re-enters on a real want |

**The technical shape (research-confirmed, all four tools converge):** a property **registry** + **id-keyed values on the row** + **views as saved config with zero data gravity**. For us: **two small tables + one column** — `property_defs` · `saved_views` · `bit.props jsonb`. EAV dominated; JSONB's famous costs are million-row diseases; even the index is optional at first.

**Three outside confirmations:** with one atom table, the *global* registry is the natural scope (a "deadline" works on anything, like a tag) → **rows-are-bits endorsed** · id-keyed-so-renames-are-free **is already house P9** · Anytype's Query-vs-Collection = *the pull vs the board*, named by strangers.

**⭐ THE ONE GATE THAT OUTRANKS EVERYTHING TECHNICAL:** **rows are bits.** Fields land ON the bit; a table is a saved view over your world; never a trapped-row container. Right → more coherent than Notion. Wrong → Notion's bolt-on mistake rebuilt here.

## 6 · The story for people — and the small resolutions

> **A bit is something you're KEEPING** — a life: tagged, findable, on any board, in any piece.
> **Writing is something you're SAYING** — it lives where you said it. *(test: will you want this again, somewhere else?)*

- **Checklists**: a formatting primitive in the doc (like bullets) — the old "where does it go?" ambiguity was a *symptom of the thin doc*, not a model hole. Sticky-note thinkers keep the board. **Capability without prescription** (the owner's Notion principle): both work, we push neither.
- **Templates** are the bridge: the *feature* is one generic thing; discipline knowledge (list of work · EPK · statement) lives IN templates as content. *"You're an artist — here's your list of work,"* opening with the columns in place.
- **The provenance dividend** 🔵: a gathered quote arrives with its **source attached** — the citation writers always lose, kept automatically. Free, from architecture we built.

## 7 · Everything unruled — the honest list

| # | open | waits on |
|---|---|---|
| 1 | **the whole shape** — nothing above is ruled | the owner |
| 2 | **rows are bits** (the engine gate) | the owner |
| 3 | composition→composition (the pitch-reuse case; notes-in-notes) | its own small ruling |
| 4 | toggle in/out · how much table is enough · chip-vs-block default | ⚑ **the owner's Notion feel-session** (spec §6b protocol) |
| 5 | the spec's five reactions | ⚑ **the owner** (spec §8) |
| 6 | **every word** — doc · deck · sheet · block · flow · frame · pointer/view · plus the old batch (composition · board · piece) | **the naming session — now load-bearing** |
| 7 | the deck beyond its one idea | later |
| 8 | sequencing vs other gaps (phone capture!) | ③b, the gap ruling |

## 8 · Standing cautions (so the morning read is honest)
- The **doorstep worry** 🔵: convergence amplifies capture, never replaces it — phone capture has been parked since July and deserves real weighing at ③b, not default-parking.
- The **specimen move** 🔵: before any build plan, a throwaway feel-page on tiptap's Notion template — a day's work that tests the bones.
- **The failure pattern to watch in Claude:** three times this session I cited my own drafts as evidence or stamped thinking-out-loud as ruled. Everything above is marked; trust the marks, not the prose confidence.
