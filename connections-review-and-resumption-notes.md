# Connections (gather + graph) — full review feedback & resumption notes

**What this is:** the complete, consolidated verifier feedback on `connections-build-plan.md` (the "pull a bit into a thought" + reference-graph feature), given across the owner–advisor review conversations of 2026-07-24 — preserved top-to-bottom because the owner **parked the feature the same day** (D-098). **Revision state at parking (verified against the plan's final text, 2026-07-24):** the revision substantially LANDED before the pause — **all five asks ✓** (vision + success criteria · naming locked: gather/reference/"gathered into", pull-in/embed/backlink banned · Stage 5 as a real spec: read-only ruled, local-first lens, concrete Checkpoint-C acceptance · the §6 draft supersession written for Checkpoint A + the philosophy edit flagged owner's-voice) · **findings #1/#3/#5 folded** (dormant ≠ reference, separate ruling · export/I-G1 in Stage 1 · app-guard lean over a 2nd trigger) · **finding #2 = the plan's own flagged open decision** (layers vs swap; the plan records the owner's in-conversation lean "tags stay OUT" vs the philosophy's shared-words-and-places graph; advisor + author lean: layers, off by default — *resume here first*) · the reference-family question (act vs derived artifact) promoted to a Stage-1 ruling. **Still carried ONLY by these notes (not yet in the plan):** finding #4 (the two-write save window + mitigation) · #6 (document-mode adjacency note for deliberations) · #8 (the target-pair door for future board-gathering; the "(removed)"-reveals-existence sharing-phase note) · the text→text cycles-safety reasoning (safe only while chips render faces, never live content) · the all-chips empty-face fallback · the stage/checkpoint numbering collision with the campaign plan · the three owner-feel questions. When the feature is picked back up, this doc + the plan are the complete starting state: nothing needs re-deriving. **Status of the model: §6 ("no stored bit↔bit fact") was NEVER actually reopened** — the plan *proposed* reopening it; no ruling was recorded, nothing was built, the schema is untouched. The owner's stated intent stands on record: *"I do want this for sure — that's philosophically; we'd have to change some things up."*

---

## 1. The vision, clarified (owner-aligned 2026-07-24)

- **Obsidian's graph:** every note a dot, every link a line; clusters condense around undeclared themes; bridges appear between clusters; orphans drift visibly. You see the shape of your own mind.
- **Why it's gold:** serendipity (lines you never consciously drew) · orientation (dense vs starved themes) · invitation (an orphan asks to be connected).
- **The honest catch (D-054 research):** the *global* graph is admired and rarely used — hairball past ~200 nodes; the *local* graph (1–2 hops from here) is the workhorse. **The gold isn't the picture — it's the daily practice of deliberate connecting that the picture renders.** The plan's best structural property: it builds the connecting act first (gather), the rendering second (graph). Keep that order on resumption.
- **Global vs local = one feature, two lenses** — same data, a scope slider, not two builds. Only open question: which lens greets you.
- **RULED by the owner (2026-07-24): the graph is READ-ONLY in v1** — look, see where things tie, click a dot to navigate. No tying/tagging/arranging from inside the graph.
- **The philosophical fit that lightens the change:** gathering is a *fact you write*; the graph is *organization computed from it* — principle 3's exact shape. The feature feeds the architecture a new kind of fact rather than fighting it. What actually changes: §6's ruling, one lexicon pass, and one philosophy line (below).

## 2. Process & legitimacy (settled framing)

- Reopening §6 is **owner-authority-ahead-of-evidence** (the D-087 title precedent) — legal, latest ruling wins — *not* the §6 evidence gate firing in real use. The record must say so honestly when it happens.
- The trade, named once: every week building this is a week the return test (Stage 4) isn't running on the simpler system. Owner's call, made knowingly.
- **The philosophy line that must be rewritten in the owner's voice at resumption:** *"A direct thread from one thought to another may come someday — the first time I genuinely miss it. I haven't yet."* Outgrown. Spirit of the replacement (owner's to write): *"thoughts connect three ways: shared words, shared places, and threads I tie on purpose."*

## 3. What the plan already gets right (banked — don't redo)

Make-then-render order · body-as-source-of-truth with rows derived on save · one edge per (from,to) pair, N renders legal · complete trash tracing (1c) · destroy cascades · the model-safety gate checklist actually run · proofs extended not claimed · three owner checkpoints well-placed · disciplined not-v1 list (no live transclusion, no in-place editing) · **free two-device coherence**: rows derive from the body and body conflicts are last-arrival-wins (§2d), so references can never disagree with the winning body — record this in deliberations when built.

## 4. The ranked technical findings (blocking = must fix in revision)

1. **BLOCKING — the dormant ninth table is unaddressed.** It was built for the symmetric pair-tie (A2). `reference` is *directed* (thought → bit), a different relationship — a new table is defensible, but the dormant table's fate must be ruled: keep waiting (A2 distinct), or retire it (references cover the want). Silence = drift.
2. **BLOCKING — Stage 5 must be a union, not a swap.** References-only graph: (a) nearly empty on day one (tags/placements give hundreds of edges; references a handful); (b) orphans vanish (`getReferenceGraph` shows only bits touching a reference — but the drifting orphan is half the invitation-magic); (c) silently demotes the *ruled* graph (D-069; the philosophy's "joined through the words and places they share"). Fix: **one graph, edge-types as toggleable layers** — reference edges bold/primary in styling, tag + board edges as layers.
3. **BLOCKING — export/I-G1.** A new record kind must join `/export` + the completeness proof, or "you own everything" silently breaks. Absent from the plan's 1e/1f.
4. **The save is two writes** (body save → `syncReferences`); if the second fails, backlinks/graph silently disagree with the body until next save. Name it; mitigate (retry on load, or reconcile-on-read of the bit's page).
5. **Trigger-vs-stance collision:** "from must be text" wants the lowest layer (trigger) but strategy §4.7 ruled *exactly one trigger — a database with no secrets*. Both are house rules; pick knowingly. Advisor lean: **app-guard in the one door** (the I-R1 precedent) + a proof that attacks it.
6. **Document-mode adjacency — say so in deliberations.** Inline gather is §6b's *call-in* minus ordering/split-merge (correctly avoided by staying inside one bit's body). A gathering thought will create appetite for text-forward composing — that's A1's gate territory; watch, don't accidentally build document mode without its entry checklist.
7. **Lexicon sweep:** "backlink" is a retired word (used throughout the plan) · **"pull in" collides with THE pull** — verb = **gather**, record = *reference*, surface = *"gathered into"*, everything else deleted · the lexicon must draw the new three-way line: **arrow** = arrangement on a board · **reference** = gathered-into · **tag/board** = shared middles · "link (as relationship)"'s retirement needs a real amendment the day a stored relationship exists again.
8. **Smaller:** consider the house target-pair shape (`to_bit_id`/`to_board_id`, exactly-one) even with board-gathering not-v1 — one CHECK now vs a migration later; at minimum name the door · "(removed)" for a trashed gathered bit *reveals existence* where cards render absent — fine owner-only, revisit at sharing · orphan-visibility handled by finding #2.

## 5. The high-level asks (the five revision requirements, owner-endorsed)

1. **A vision line + named success check** at the top (e.g., *"gathering a doodle into a thought takes seconds and feels like writing, not filing; the tie shows in the graph with no further act"*). The plan currently has zero success criteria.
2. **One verb.** Gather / reference / "gathered into" — the four-names-for-one-thing instability fixed everywhere.
3. **Stage 5 rewritten as an actual spec:** nodes, edge layers (per finding #2), default lens (local vs global — which greets you), and the interaction model (**read-only, click-to-navigate** — ruled).
4. **Checkpoint C gets concrete acceptance** (e.g., *"standing on the equanimity thought, the local view shows the doodle, quote, and note one hop away; the twice-gathered doodle renders as a bridge; an unconnected bit is visible as an orphan"*), replacing the vibe-line "reads as your web."
5. **The reopened §6 ruling drafted in full inside the plan** for owner approval at its Checkpoint A — the actual sentences that will supersede §6, plus the philosophy edit flagged as owner's-voice work.

## 6. Clarifying questions (asked 2026-07-24; answers so far folded in)

**Model-grade (answer before any migration):**
- What family is `reference` — an **act**, or a **derived artifact**? Rows derive from the body on save; no independent act creates them. Determines: export treatment, P6 one-fact-one-record analysis (the fact arguably lives in the body), whether direct row-deletion is ever legal, and the nine-kinds story.
- Text→text gathering (thought-chains) intended? Cycles become possible — safe *only because* v1 renders face-chips, never live content. Confirm + record that reasoning (it's load-bearing against future live-transclusion proposals).
- ROADMAP placement + the not-coming footnote (still lists the pairwise link) goes stale on reopening.

**For the author:**
- The design-rationale artifact ("connection thinking-canvas") isn't in the repo — persist its essence into `deliberations.md` (doc-census rule).
- ~~The Daylight has no `[[`~~ → **softened by owner:** the on-screen keyboard is present while editing; `[[` is typeable (symbols layer, ~3 taps). A toolbar gather-button = Checkpoint-B thumb test, not a paper decision.
- Stage/checkpoint numbering collides with the campaign plan (two "Stage 2"s, two "Checkpoint A"s) — prefix (C1–C5).
- A thought whose body starts with / is only chips: define the face fallback (empty face on a text bit is currently meaningless).
- Picker searches `search_tsv` (post-D-088 = includes bodies) — confirm intended; converse: a thought is *not* findable by its gathered bits' faces (chips store IDs only) — decide, don't inherit.
- Removing a gathered bit = delete the chip → save reconciles — confirmed as the only path? Traceless like un-tagging?
- Cross-bit paste of a chip creates a reference on save by construction — intended feature, say so.

**Owner-feel (still open, fine to answer at the feature's Checkpoint B):**
- Gathering does **not** place the bit anywhere (it lives in the thought's text only) — expected?
- Tap a chip: navigate away vs *peek* (popover, stay in flow)? Shapes the NodeView build.
- Gatheredness visible on canvas cards ("part of 3 thoughts") or page-only?

**Answered by the owner already:** graph = read-only ✓ · Daylight keyboard suffices for `[[` ✓ · doodles need their words field to be searchable ✓ — which raises the stakes on the content-line offer at pen-Done: **a wordless doodle can't be found by typing `[[fire…`** — the words-offer becomes the price of admission for weaving doodles into thoughts.

## 7. The resumption procedure (locked 2026-07-24)

1. **Lock high-level:** author folds §5's five asks + answers §6's model-grade questions → revised plan.
2. **Advisor deep technical review** of the *revised* plan (line-by-line against agreements/invariants; verify findings #1–#8 landed; hunt what only stable text reveals).
3. **The feature's Checkpoint A:** owner approves the model on paper — including the reopened §6 ruling text and the philosophy line in their voice. Only then does a migration exist.
4. Then its build stages as planned (data layer → editor → backlink surface → graph), each with its proofs.

**Re-entry condition: the owner's word — this is want-driven (stated: "I do want this for sure"), not evidence-gated.** Meanwhile §6 stands unmodified, the dormant table sleeps, the tag/board graph (already built at `/graph`) remains the graph, and nothing in the live system references this feature.
