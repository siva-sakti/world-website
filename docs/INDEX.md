# INDEX — every document, what's in it, and what it links to

**What this is:** the **map of the whole project's thinking.** One entry per file: *what it contains* · *what it deliberately does NOT cover* (so you stop looking in the wrong place) · *what it links to*. Built 2026-08-30 to the owner's ask — every file referenced in one place, explicit enough to search, and cross-linked like a tree.

**🟡 A note on phase:** there is an active workstream **above features** — the **product concept** (what the app is, who for, what it promises, what it owns, how we talk about it). It lives in the **`product-concept-*.md`** files and is deliberately **not** folded into the settled docs (`model.md`, `lexicon.md`, `invariants.md`, `philosophy.md`, `PROGRESS.md`) — those read exactly as they did on 2026-08-28. Each product-concept file opens with a **status banner** (🟢 settled · 🟡 leaning · 🔵 Claude's framing · ⚪ open). **Nothing graduates until the owner rules it.** Start at **`product-concept-map.md`**.

**The house rule this serves:** every fact lives in exactly ONE place. If two docs seem to cover the same thing, one of them is wrong — fix it, don't pick.

**Keep it current:** a new doc gets a row here **in the same session it's created.** A stale index is worse than none.

---

## ⭐ HOW WE WORK WITH THESE DOCS (owner-ruled 2026-09-01)

**The owner's rule, and it is the app's own model applied to us:**

> *"You don't have to delete documents — they just have to be referenced, or you have to know what you're doing with them. It's OK to take notes and have them in a document, or have temporary documents, or list things out. **I encourage this.** I want to keep track of where you go — but there should be points, after we do the divergence and the research and all that, to actually **converge** and say: OK, this is the outcome."*

**Diverge freely in docs. Then converge deliberately. Never delete the material.** *(Exactly as a board's cards survive the piece made from them.)*

### The five rules

1. **DIVERGE FREELY.** Notes, working lists, temporary docs, half-thoughts, parallel attempts — **encouraged**, not tolerated. The scratch *is* the thinking; suppressing it hides where we went.
2. **NEVER DELETE. Always reference.** Superseded work is marked and pointed at, never removed. Every doc must be reachable from this index — *knowing what a doc is for* is the requirement, not tidiness.
3. **NAME THE CONVERGENCE POINT.** After a stretch of divergence/research there is an **explicit step**: *this is the outcome.* It is a decision to hold, not something that happens by drift.
4. **AT CONVERGENCE:** write or update **the outcome doc**, and mark every upstream doc as *"working-out that led to X"* with a pointer. The material stays; its role changes.
5. **EVERY DOC DECLARES WHICH IT IS** — 🟠 **WORKING** (diverging; may be redundant, half-right, superseded) or 🟢 **OUTCOME** (converged; the current answer). ⚠ A reader must never have to guess.

*(⛔ Superseded, same day: an earlier draft of these rules said "replace, don't add" and "two docs per topic, maximum." **Both were anti-divergence** and the owner corrected them. The real fault they were aiming at — three docs at three altitudes with no marked outcome — is fixed by rules 3–5, not by writing fewer docs.)*

### Where a thing goes
- *what are we building?* → **`app-things-inventory.md`** (🟢 the current answer)
- *why / what's still open?* → the topic doc that owns it (`product-concept-*`)
- *what's next?* → **`product-concept-queue.md`**
- *where is anything?* → **this file**
- *a finding with sources* → a `research-*.md` — 🟢 findings don't expire with plans
- *scratch, a list, a parallel attempt* → **a new doc is fine** — mark it 🟠 and index it

### Doc status right now — convergence OWED on the convergent-surfaces thread

| doc | status |
|---|---|
| `app-things-inventory.md` | 🟢 the current answer to *what are we building* |
| `research-block-editors.md` · `research-structured-data.md` | 🟢 findings, sourced, settled |
| `convergent-surfaces-overview.md` | 🟠 working — its §0 is now under challenge |
| `convergent-surfaces-stress-test.md` | 🟠 working — a reviewer's opinion, not ruled |
| `composition-surface-spec.md` | 🟠 working — the doc-surface detail |
| `tables-and-structured-data.md` | 🟠 working — an open question |
| all `product-concept-*.md` | 🟠 working — thinking in progress, status-banners inside |

> ⚑ **The convergent-surfaces thread has diverged for two days and has NO convergence point yet.** Research (×2) landed, the stress-test reopened the picture, nothing is ruled. **The owed step: an owner sitting that produces the outcome** — what survives, what's cut, what's next. Until then everything on it stays 🟠.

## 🔎 "I'm looking for…" — straight to the answer

| I want to know… | go to |
|---|---|
| what to build next, in what order | **`organize-phase-plan.md`** |
| what a word means / is this term taken | **`lexicon.md`** |
| what's true about the model right now | **`model.md`** |
| what we promise the world & why anyone cares | **`product-concept-promise.md`** |
| where the concept work stands / what's still open | ⭐ **`product-concept-map.md`** |
| who it's for and how we teach it | **`product-concept-people.md`** |
| the open naming questions (note→composition, board) | **`product-concept-language.md`** |
| why the project exists at all | **`philosophy.md`** |
| what was decided, and when | **`PROGRESS.md`** (D-log) |
| *why* it was decided — the arguments and the rejected options | **`deliberations.md`** |
| what's actually built and how broken it is | **`feature-inventory.md`** |
| what we said we'd do later | **`parked.md`** |
| rules that must never break | **`invariants.md`** |
| how the database/app actually works | **`SPEC.md`** |
| every path a user takes | **`user-flows.md`** |
| words to describe the app to a person | **`vision-and-language.md`** (raw material — owner re-voices) |
| how we work together | **`CLAUDE.md`** |

---

## 🌳 The tree

```
CLAUDE.md ............... how we work (START HERE, every session)
INDEX.md ................ this file — where everything is
│
├── THE IDEA ─ why this exists and what it owns
│   ├── philosophy.md ................. the why (owner's voice)
│   ├── product-concept-map.md ........ ⭐ the hub: the goal + all 8 threads
│   ├── product-concept-brand.md ...... the name, identity, voice (empty room)
│   ├── product-concept-privacy.md .... public vs private (own session owed)
│   ├── product-concept-promise.md .... what we're for · the concepts · what we own
│   ├── product-concept-people.md ..... the makers, their flows, onboarding
│   ├── product-concept-language.md ... the words + the open names
│   └── product-concept-frameworks.md . diverge/converge + the research round
│   └── vision-and-language.md ........ words for describing it (raw material)
│
├── THE MODEL ─ what is true
│   ├── model.md ...................... ⭐ THE current model — build from this
│   ├── lexicon.md .................... the exact words (naming authority)
│   ├── invariants.md ................. rules that must never break
│   ├── user-flows.md ................. every user path, arc by arc
│   └── model-scenarios.md ............ 7 real scenes traced to the record
│
├── THE PLAN ─ what happens next
│   ├── organize-phase-plan.md ........ ⭐ THE live queue (Phases O · V · N)
│   ├── aesthetics-phase.md ........... the design track (runs in parallel)
│   └── parked.md ..................... everything deferred, with re-entry conditions
│
├── THE RECORD ─ what happened
│   ├── PROGRESS.md ................... the D-log (decisions) + status + needs-owner
│   ├── deliberations.md .............. the uncompressed WHY behind each ruling
│   └── feature-inventory.md .......... what's built, and how well (findings F1–F12)
│
├── THE TECHNICAL MANUAL
│   ├── SPEC.md ....................... schema · RLS · media · ops
│   ├── supabase/migrations/ .......... the proven schema
│   └── verification/ ................. the proofs + regression suite
│
├── BUILD PLANS ─ mostly historical; see the table below
├── RESEARCH ─ findings don't expire with plans
└── HISTORICAL ─ agreements.md · ROADMAP.md · old/  (never build from these)
```

---

## 1 · START HERE

### `CLAUDE.md` — the operating manual + hub
**Contains:** the session routine (read this, in this order) · the doc-map table · the stack · the working norms (plan before code · no debt · the five model-safety gates · bypass-permissions boundaries) · the design stance · what not to do · decided naming.
**Does NOT cover:** what to build (→ `organize-phase-plan.md`) · what's true (→ `model.md`).
**Links:** everything. It's the hub. → `INDEX.md` (this file) for the full map.

### `INDEX.md` — this file
**Contains:** every document, what's in it, what it isn't, and its cross-links.
**Does NOT cover:** any actual content. It is a map, never a source.

---

## 2 · THE IDEA — why this exists and what it owns

### `philosophy.md` — the **why**
**Contains:** the one idea · what the project is for the owner · the values decisions get checked against. **In the owner's voice.**
**Does NOT cover:** what we own competitively (→ `product-concept-promise.md`) · the model's shape (→ `model.md`).
**Links:** `product-concept-promise.md` · `model.md` · `CLAUDE.md`.
**⚑ Owed:** the owner's re-voice pass (D-118). The 2026-08-30 thinking is **deliberately not folded in** — it's still in brainstorm.

### The `product-concept-*.md` files — the workstream **above features**

**The layer features get pulled down from.** Each opens with a status banner: 🟢 settled (the owner's own words) · 🟡 leaning, not ruled · 🔵 Claude's framing, not adopted · ⚪ open.

- **`product-concept-map.md`** — ⭐ **START HERE.** The goal · all 8 threads and their state · everything settled across the workstream · **how this touches the existing docs** · the open feature questions waiting on it · where we stopped.
- **`product-concept-promise.md`** — what the app is *for* (everything **around** the making; the six areas) · the one-primitive discipline · the concepts (material vs surfaces; peers, either direction) · **the seams** as the edge · the honest competitive read with its caveats · return demoted to amplifier.
- **`product-concept-people.md`** — who it's for · why we show instead of define · the flow template and the seam rule · **the persona slots, ⚑ empty — the owner writes the characters** · what it means for onboarding.
- **`product-concept-language.md`** — `note`→`composition` (leaning, **blocked on a word collision**) · is `board` right · the framings under discussion · the enactment scope · ⚠ the `vision-and-language.md` overlap to resolve.
- **`product-concept-frameworks.md`** — diverge↔converge · extended mind → *context over isolation* · recombination → *arrangement is the connection* · the practice examples · ⚪ **the research round's draft questions**, to sharpen before running.

- **`product-concept-brand.md`** — ⚪ **the empty room.** What exists (the in-app look: *Japanese · ethereal · analog*) vs what doesn't (**the app's name** · a mark · a voice · a landing · any first-contact). Blocked on privacy, and on the promise settling.
- **`product-concept-privacy.md`** — ⚪ public-by-default (the founding dream) vs all-private (what's built). The guest door **exists and is proven at the database**; the publish act and the product decision do not. **Brand is blocked on this.**

**A third document category, drawn by the owner 2026-08-30:** besides *thinking in progress* (these files) and *settled records* (`model.md`, `lexicon.md`, `invariants.md`, `PROGRESS.md`, `SPEC.md`), there are **near-final outputs** — meant to be finished, not there yet, ⚑ **written by the owner**: `vision-and-language.md` (the language book) and `philosophy.md` (owes a re-voice). Thinking graduates *into* settled records; it never merges into an output — those get **re-voiced** when the argument beneath them moves.

**Does NOT cover:** anything settled. These files never edit `model.md`, `lexicon.md`, `invariants.md`, `philosophy.md` or `PROGRESS.md`.

### `vision-and-language.md` — the language book
**Contains:** what it is plainly · the **multi-mind** · the problem taught three ways (the consumer-of-things · the Are.na person · the Obsidian person) · the gradient story · inspiration × clarity · positioning one-liners vs Are.na/Sublime/Obsidian/Notion/paper · a phrase bank.
**Does NOT cover:** strategy (→ `product-concept-promise.md`, which supersedes its competitive lines).
**Status:** ⚑ **Claude-drafted raw material — the owner re-voices it.** Predates : its "multi-mind" framing was deepened into *home base for a creative practice*.
**Links:** `product-concept-promise.md` · `philosophy.md`.

---

## 3 · THE MODEL — what is true right now

### `model.md` — ⭐ **THE current conceptual model. Build from this.**
**Contains:** the one premise (material vs surfaces) · the three things (**bit · note · board**) · how a bit joins a surface · surfaces as doorways · the cross-cutting dimensions (tags · source · folders · alive · trash · travel · connectors · visibility) · stored vs computed · the three layers allowed to differ · open threads.
**Does NOT cover:** the words themselves (→ `lexicon.md`) · why (→ `philosophy.md`) · how it's built (→ `SPEC.md`).
**Supersedes:** `agreements.md` (historical).
**Links:** `lexicon.md` · `invariants.md` · `product-concept-promise.md` · `user-flows.md` · `PROGRESS.md` D-log.

### `lexicon.md` — the precise words (**naming authority for code**)
**Contains:** stored vs computed · the nine stored things · the parts of a bit · display words · the three surface domains · the acts (verbs) · **RETIRED words that cause drift**.
**Does NOT cover:** what things *are* (→ `model.md`).
**Check this before naming anything.** Step 2b of the item loop lives or dies here.
**Links:** `model.md` · `invariants.md` · `organize-phase-plan.md` §5 (the loop).

### `invariants.md` — the always-true rules
**Contains:** every rule that must hold no matter what the owner does, each tagged with where it's enforced (`constraint` > `computed` > `app`). Global rules + one cluster per closed area.
**Does NOT cover:** anything negotiable.
**Links:** `model.md` · `SPEC.md` (the invariant→enforcement map) · `verification/`.

### `user-flows.md` — every path, arc by arc
**Contains:** Arcs 0–8 (onboarding · catch · arrange · write & gather · connect · organize · return · develop · manage), each with ✅/🔲 status **and its technical mechanism** · the gaps in one place.
**Does NOT cover:** the sequenced build order (→ `organize-phase-plan.md`) · the persona flows that teach it (→ `product-concept-promise.md` §7).
**Links:** `model.md` · `product-concept-promise.md` · `organize-phase-plan.md`.

### `model-scenarios.md` — seven real scenes traced to the record
**Contains:** real moments from the owner's life traced through the model at record level; verdicts FITS / AWKWARD / MISSING. **Doubles as the translation test fixtures.**
**Does NOT cover:** the current post-notes model — written 2026-07-21 against `agreements.md`.
**Links:** `model.md` · `verification/`.

---

## 4 · THE PLAN — what happens next

### `organize-phase-plan.md` — ⭐ **THE live plan + feature queue**
**Contains:** the surface map (rooms · lenses · housekeeping) · terminology rulings · **Phase O** (reorganize) · **Phase V** (the vision build) · **Phase N** (the note as a surface + the flows' gaps, N1–N7) · **§5 the item loop** — the 9-step workflow every item runs through, including **step 2b: name it before you build**.
**Does NOT cover:** why (→ `product-concept-promise.md` / `philosophy.md`) · what's already broken (→ `feature-inventory.md`).
**⭐ The owner's idea-dumps get filed HERE.** Read before proposing or sequencing anything.
**Links:** `user-flows.md` · `model.md` · `parked.md` · `PROGRESS.md`.

### `aesthetics-phase.md` — the design track (parallel)
**Contains:** the north star (bold, ONE dominant direction; owner leaning indigo/Gzhel) · the working method for anything aesthetic · the design↔data bridge · surfaces × sub-elements · the staged build + gates · open decisions.
**Does NOT cover:** brand identity, name, logo, or landing surface — **none of those exist anywhere yet** (see `product-concept-promise.md` §9).
**Links:** `organize-phase-plan.md` · `philosophy.md`.

### `parked.md` — the deferral ledger
**Contains:** everything consciously deferred, each with a **named re-entry condition** and a pointer to where the ruling lives. An **index, never a source.**
**Check it before proposing anything new** — it may be pre-ruled or rejected outright.
**Links:** every doc that ever deferred something.

---

## 5 · THE RECORD — what happened

### `PROGRESS.md` — the decisions log
**Contains:** the status block (where we are now) · **the D-log, D-001→D-128** (each a short receipt: the ruling + supersessions + pointers) · "needs owner" · work done.
**Does NOT cover:** the reasoning (→ `deliberations.md`, deliberately — the log is a receipt, not an essay).
**Links:** `deliberations.md` · `model.md` · `parked.md`.

### `deliberations.md` — the uncompressed **why**
**Contains:** per ruling — the arguments, **the rejected options**, advisor catches, record-level traces, and the lessons. The substance the D-log compresses away.
**Links:** `PROGRESS.md` · `product-concept-promise.md` · `model.md`.

### `feature-inventory.md` — what's built, honestly
**Contains:** every feature walked with a mark (✅ whole · ⚠️ named gap · 🚧 half-wired · ❌ missing) · **findings F1–F12** with severity, two of them *classes* not instances · the ruling F1 waits on.
**Does NOT cover:** plans (→ `organize-phase-plan.md`).
**Re-walk it after any phase closes** — a stale inventory is worse than none.
**Links:** `organize-phase-plan.md` · `deliberations.md` · `parked.md`.

---

## 6 · THE TECHNICAL MANUAL

### `note-storage-audit.md` — 🟠 the evidence audit: does note-as-bit still hold? (2026-09-01)
**Contains:** the real seam count (~30 files; corrects Claude's earlier false "5 in 3") · the reframe (app code is AHEAD of storage) · 🔵 the convergence finding (one surface table unifies the whole link fabric — comp→comp and comp→board become one row type; A15 dissolves) · the ONE ruling that gates the migration · Claude's updated recommendation.

### `app-things-inventory.md` — ⭐ THE CONCRETE LIST (2026-09-01)
**Contains:** every finding from the convergence work translated into **things you'd see or click** — writing a piece · linking (what can point at what) · getting things out · ordering · tables/fields · about a piece · and which lines have real evidence.
**Is:** the plain-language output layer. Written after the owner named the translation loss: *"what are the actual things I need to see in an app."* Read this instead of the frameworks; the frameworks are the working-out.

### `convergent-surfaces-stress-test.md` — 🔵 independent review of the convergence direction (2026-09-01)
**Contains:** convergence as **ten operations** (we serve two) · six verdicts on our conclusions (what's weak, what's wrong, what to keep) · the excerpt problem with four costed stances · spatial→linear: the only four mechanisms that exist · seven ranked gaps · flagged uncertainty · heavy sourcing.
**Is:** a reviewer's opinion, **not a ruling** — commissioned to attack, not validate. Read WITH the overview.

### `convergent-surfaces-overview.md` — ⭐ THE ONE CLEAN READ of the convergence picture (2026-08-31)
**Contains:** the frame (free to diverge, formatted to converge) · the grown north star · the three surfaces' state · the 2×3 connective grid (Obsidian/Notion nested) · the engine digest · the story for people · **everything unruled, listed** · standing cautions.
**Is:** the synthesis layer — every section points at its detail doc. Read this FIRST on the convergence topic; the trail lives in `product-concept-promise.md`.

### `composition-surface-spec.md` — 🟡 preliminary thinking-spec (2026-08-31)
**Contains:** the diverge/converge picture drawn · the full entry/link **matrix** (what can enter what, incl. the one new model question: composition→composition) · the existing tiptap base · the doc-surface capability cut (blocks · the **bit-block** = gather matured) · the deck sketched lightly · quick research (tiptap ships a Notion-like template; Notion's synced blocks vs our native transclusion) · the owner's check-in list.
**Does NOT:** rule, name, sequence, or touch schema. Gated on the owner's check-in → naming session → the item loop.

### `tables-and-structured-data.md` — ⚪ parked handoff, not a plan
**Contains:** why structured data serves the surround claim (adjacency) · **the central fork** (is a row a *bit* or a new record?) · what a bit already provides vs the one real gap (**a user-set date**) · the honest 21-item feature inventory across three tiers · the model-safety flags · six open questions · a read-in order.
**Does NOT cover:** any decision. Nothing planned, nothing built, nothing ruled.
**Written as a cold handoff** so another window can pick it up without re-deriving.
**Links:** `product-concept-promise.md` §2b/§2c · `invariants.md` · `lexicon.md`.

### `SPEC.md` — how it's actually built
**Contains:** the five moving pieces · the schema described · privacy/RLS (the ruled **AND-composition** — ⚑ a name that collides with the pending `composition` rename, see `lexicon.md`) · media pipeline · ops · capture · the invariant→enforcement map.
**Does NOT cover:** why any of it is that way (→ `model.md`). It describes what's upstream and never re-derives it.
**Links:** `model.md` · `invariants.md` · `supabase/migrations/` · `verification/`.

### `supabase/migrations/` — the proven schema · `verification/` — the proofs
**Contains:** `20260721000001_init.sql` (the proven base) and every applied migration · the attack suite, the race probe, the seven-scene replay, the old-schema diff.
**Re-run `verification/` after any schema change.** It is the model's regression test.

---

## 7 · BUILD PLANS

📜 = historical, built, **do not build from**. The current model is always `model.md`.

| doc | what it planned | status |
|---|---|---|
| `drawer-on-the-note-page-plan.md` | N4b — the drawer on the note page + gather from it; one `lib/search.ts` for every box | ⚑ **built, awaiting owner feel-test** |
| `note-as-surface-plan.md` | N1/N3 — a note is a surface, not a bit | 📜 built |
| `writing-experience-plan.md` | the real writing experience (`/write`, note-shaped notes, evaporate) | 📜 built (D-111/D-112) |
| `call-in-build-plan.md` | bring a loose bit onto a board | 📜 built (D-104, hardened D-106) |
| `gather-build-plan.md` · `gather-picker-plan.md` | gather end-to-end: `[[`, chips, peek | 📜 built (D-110) |
| `gather-g1-checkpoint-A.md` · `capture-slice1-checkpoint-A.md` · `source-stage0-checkpoint.md` | the signed-off owner checkpoints for each applied data layer | 📜 signed |
| `source-and-full-bit-build-plan.md` | source made first-class, bookmark retired | 📜 built (D-102/D-103) |
| `loose-notes-redesign-and-multiselect-plan.md` · `multiselect-plan.md` | the all-bits panel + multi-select | 📜 built (D-109) ⚠ uses "note" to mean *bit* — read accordingly |
| `layout-foundation-plan.md` · `board-touch-zoom-plan.md` | responsive foundation · pinch-zoom | 📜 built |
| `connections-build-plan.md` · `connections-review-and-resumption-notes.md` | the gather + reference-graph feature | ⏸ **PARKED (D-098)** — resume from the *notes*, never the plan alone |
| `technical-build-plan-stages-and-checkpoints.md` · `translation-guidelines-conceptual-to-technical.md` | the conceptual→technical translation campaign and its rulebook | 📜 complete (D-085) |

---

## 8 · RESEARCH — findings don't expire with plans

- **`research-structured-data.md`** — ⚪ landing doc for the engine research (Notion's data model · the common property/view architecture · Postgres field patterns). Folds into `tables-and-structured-data.md` §1b.
- **`research-block-editors.md`** — ⚪ the landing doc for the composition-surface research (Claude's 3-question mechanics agent + the owner's Notion feel-protocol). Folds into `composition-surface-spec.md` when both halves land.

- **`research-knowledge-layer.md`** — tags, backlinks, forward-links, graph; the connector's binding model came from here. Reference at build time.
- **`research-canvas.md`** — how canvas apps are built (JSON Canvas · tldraw · Heptabase · Excalidraw), marked ADOPT / SKIP.
- ⚑ **Not yet run:** the **creative-frameworks round.** Diverge/converge landed and the owner asked for more of that caliber. Questions to be defined jointly first. → `product-concept-promise.md` §9.

---

## 9 · HISTORICAL — never build from these

- **`agreements.md`** 📜 — the D-019→D-102 era rulings. **Predates the notes era entirely**; where it conflicts with `model.md`, `model.md` wins. Kept as the record of how the early model was reasoned.
- **`ROADMAP.md`** 📜 — the older product-phase sketch, frozen pre-notes. **Superseded as the live plan by `organize-phase-plan.md`.**
- **`old/`** — everything superseded. Never edited, never followed. Includes the completed audit docs.
- **`README.md`** — stock Next.js boilerplate. Not a project doc.

---

## 10 · CODE & FOLDERS

```
src/app/          the rooms — /(desk) · /board/[id] · /note/[id] · /bit/[id] · /notes · /bits
                  /write · /find · /graph · /tags · /sources · /group/[id] · /trash
src/lib/db/       THE ONE DOOR to the database — never call Supabase from a component
src/lib/          search.ts · save-guard.ts · media.ts · storage.ts · floating.ts · dates.ts
src/components/   shared UI — drawer.tsx · confirm.tsx
scripts/          test-port.mjs (the live integration harness) · cloud apply/backup
supabase/         migrations (the proven schema)
verification/     the proof record + regression suite
design-studies/   aesthetic specimens
backups/          local db dumps (gitignored)
```
