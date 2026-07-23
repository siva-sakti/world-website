# Translation guidelines — turning the conceptual model into the technical one

**What this is:** the agreed procedure and rules for the **translation step** (agreements §8.3): taking the closed, verified conceptual model and producing the real technical foundation — the schema, the rebuilt SPEC and ROADMAP, and the proofs that the translation is faithful. Written with the owner, 2026-07-21 (D-081). The executing session follows this file and improvises nothing.

**The goal, in one sentence:** after translation, every mechanic we designed exists as real tables and rules a database enforces, *proven* by replaying the owner's own scenarios against real rows — leaving *feel* as the only untested thing in the project.

---

## 1. The rules (the charter)

1. **Translation decides nothing.** Every model decision is already made. A question the inputs don't answer is never resolved inline — it is routed by the decision boundary (rule 2) or parked.
2. **The decision boundary.** *Behavior-visible* questions (anything the owner would ever see or feel — e.g. "newest first" by created vs by last-edited) → go to the owner, phrased as a scenario, **and as a thing to try whenever testable** (the owner has claimed the tester role: show both behaviors when possible, don't describe them). *Technical-with-tradeoffs* (index types, storage details — invisible from the owner's chair) → Claude decides, logs in `deliberations.md`, owner can veto. *Mechanical* (column order, lexicon-given names) → just done.
3. **Every line cites its sentence; every sentence lands.** Each table/column/constraint in the migration carries a comment citing its `agreements.md` section. Checked both directions: nothing invented (every element names its source), nothing lost (every ruled clause lands somewhere — the check that once nearly lost `category`).
4. **The invariants are the checklist.** Every invariant in `invariants.md` is realized at its "kept by" level — a database constraint, a computed rule, or the single db-module chokepoint — and each constraint is *attacked once* to watch the database refuse.
5. **The owner's scenarios are the test fixtures.** The seven scenes in `model-scenarios.md` are seeded as real rows; every computed surface (the pull, find, the ledger, a bit's page, travel, board load) runs as its real query; outputs must match the scenario doc line-by-line.
6. **Fresh derivation; the old schema is only a countercheck.** The schema derives from the agreements, never by editing the old migration. Afterward, diff against the old one: **every disappearance must name the ruling that killed it** (catches both contamination and silent loss).
7. **The lexicon names everything.** Tables, columns, and types take their words from `lexicon.md` (its ruled role as code-naming authority). A needed name that's missing goes *into the lexicon first*, same pass.
8. **One derivation chain, no siblings:** agreements → schema → SPEC → ROADMAP. Downstream documents *describe* what's upstream; they never re-derive.
9. **Nothing is proven by prose.** "It works" means: the migration applied to a real database; the constraints refused illegal writes; the race probe ran; the scenario replays matched. Evidence recorded, claims banned.
10. **The owner gates on behavior, never SQL.** Every owner-facing checkpoint is outcomes and plain language.

**Standing inputs (frozen at start):** `agreements.md` · `invariants.md` · `lexicon.md` · `parked.md` (the five foreclosure notes + A-list doors) · `model-scenarios.md` (fixtures + build notes + I-W1) · SPEC's still-load-bearing technical sections (§9 media · §10 ops · §4b capture; §3 privacy is ruled WRONG and is rewritten, not consulted) · `research-knowledge-layer.md` · `research-canvas.md`.

## 2. The procedure, in order

1. **Derive the schema** from the inputs (rules 3, 6, 7; foreclosure notes honored).
2. **Prove it mechanically (L1):** apply the migration to a throwaway Postgres; attack each constraint and record the refusal; run the two-session race probe (I-D1: reproduce the silent land without `FOR SHARE`, show it blocked with it).
3. **Prove it faithful (L2):** seed the seven scenarios as rows; run every surface as its query; match outputs against `model-scenarios.md`; run the export and check every record kind appears (I-G1).
4. **Diff against the old schema** — every dropped/changed element names its ruling.
5. **Rebuild SPEC** describing the proven schema (structure in §3 below).
6. **Rebuild ROADMAP** from the closed model (structure in §3 below).
7. **Independent verification pass** — a separate session samples the citation trace both directions, re-runs the scenario replays, and sweeps the three new artifacts for contradictions with each other and with the agreements.
8. **Owner gate:** the owner receives (a) the seven scenario replays in plain language ("you tap #retreat → these come back, here they are"), and (b) the decision log of every boundary-rule-2 call made, with vetoes open. Owner approves outcomes → translation closed, the port unblocked.

**Roles:** author = a fresh session executing this file (also a live test that our documents suffice to build from) · verifier = the advisor window (step 7) · owner = decisions at rule-2 boundaries + the step-8 gate, hands-on testing from the port onward.

## 3. The artifacts — structure, goals, acceptance (per file)

### 3a. `supabase/migrations/<date>_init.sql` — the schema
- **Structure, in order:** (1) the eight record-kind tables — things (bit · board), acts (tag_application · placement · connector), vocabulary (tag · category · subtype) — each column commented with its agreements citation; (2) the dormant ninth table (§6 — present, unused); (3) constraints (uniques, foreign keys, checks — each naming its invariant); (4) indexes for the common questions (by tag · by board · newest-first · text search); (5) RLS policies (owner-only for v1; written gradient-ready per the §2a composition — AND, never OR); (6) triggers (the `updated_at` stamps — one clock).
- **Goals:** every invariant enforceable at the lowest possible layer; the five foreclosure doors held open (extensible `visibility`/`type` · client-suppliable born-at · dormant table ships · the visit-log-foreclosing UNIQUE commented as such).
- **Accepted when:** applies clean to an empty database · every attacked constraint refuses · race probe passes · citation comments complete both directions.

### 3b. Rebuilt `SPEC.md` — the technical manual
- **Structure:** (1) the five moving pieces and how the pipes connect (screen → `lib/db` the one door → database; + file store; + RLS) · (2) the schema, described (tables in lexicon words, what each holds, the enforced rules) · (3) privacy/RLS — the ruled composition, replacing the old wrong §3 · (4) media pipeline (client→storage direct, downscale, thumbnails; the HEIC message per the port batch) · (5) ops (backup, keep-alive, export) · (6) capture (§4b carried forward for Phase 5) · (7) the invariant→enforcement map (which rule lives where).
- **Goals:** a builder can implement any feature from SPEC without reopening the agreements; SPEC never contradicts them.
- **Accepted when:** the verifier pass finds zero contradictions with agreements/schema; every load-bearing claim traces.

### 3c. Rebuilt `ROADMAP.md` — the sequence
- **Structure:** the point + success metric (unchanged) · phases rewritten in the ruled model's language (no links, no stage, no kind; export in Phase 1; connector batch placed; I-W1 and the scenario build-notes attached to their phases) · parked reconciliation (B/C items match phases exactly; A items pointed at, never listed as coming).
- **Accepted when:** zero retired words (lexicon check); every phase buildable from agreements + SPEC alone; parked B/C rows and phases agree one-to-one.

### 3d. The proof record
- **Structure:** the probe scripts + scenario seed data (named after the owner's real content — the retreat board, the TCM screenshot) + captured outputs, kept under `verification/`; a short summary of results (what ran, what refused, what matched) recorded in PROGRESS.
- **Goal:** any future session can re-run the whole proof after any schema change — the proofs are the model's regression test from now on.

## 4. The engineering strategy — the smart moves and the outcomes we want (D-081, owner ask: "not just rules — actual things")

**The outcomes that define "strategically smart" here:**
- **The database does the work.** Every rule that *can* be physics *is* physics — constraints, generated columns, views — leaving minimal app code to get wrong.
- **One pattern, reused** beats many clever ones. **Boring-and-proven** beats sophisticated: this schema must serve one owner for decades.
- **Every parked door opens with ADD, never rework** (the foreclosure notes, generalized into a stance).
- **As clever as genuinely better — every cleverness answers three checks** (owner refinement 2026-07-21, D-082 — supersedes the earlier "simple enough to explain = the ceiling"): **(1) proven** — a test exists that fails if it breaks; **(2) load-bearing** — it buys something nameable (fewer moving parts, fewer failure modes, a door held open; clever that *adds* machinery is suspect); **(3) explainable on demand** — the design is never simplified *for* the owner, but every part must survive being explained *to* them when they ask. The table-by-table tour (checkpoint A, `technical-build-plan-stages-and-checkpoints.md`) is where that's exercised live.

**The named moves (the author's starting positions — rule 2 still routes anything owner-feelable):**
1. **The target pair.** "Points at a bit OR a board" (tag application, placement) is one shape used identically both times: two slots + a CHECK that exactly one is filled. Board-on-board nesting costs nothing new — it's the same paid-for pattern. *(Considered & rejected: a "thing" supertable unifying bit/board IDs — adds a join everywhere for a things-family that is closed at two by design.)*
2. **Combine the pattern, never the tables.** The three vocabularies (tag · category · subtype) stay **three small tables of identical shape** — so foreign keys make wrong references *impossible* (can't tag with a subtype word; can't nest categories), and near-duplicate uniqueness stays per-role. A merged words-table with a type column would trade physics for app-remembering.
3. **State lives in timestamps.** `left_at` empty = here now · `deleted_at` empty = alive · `arrived_at` orders travel. Never a boolean beside a date — a flag and its timestamp can never disagree if they are the same column.
4. **The face is a generated column.** Postgres computes the face (content ∥ per-type fallback) and its search tsvector *itself* — self-maintaining by physics, no sync code, the D-074 drift-risk structurally dead.
5. **Surfaces are named views.** `the_pull` · `the_ledger` · `bit_travel` · what's-on-a-board — each computed surface is one saved question in the schema: written once, tested by the scenario replays, called by every screen. "Retrieval is computed" becomes a list of inspectable objects.
6. **A column must earn its existence** — only values a question or rule needs become columns; everything else is opaque payload (strokes = one package inside the bit; media bytes = the file store). Small, sharp schema over a sprawling one.
7. **Exactly one trigger** (the `updated_at` stamp). All other behavior is *visible* physics — constraints and views you can read. A database with no secrets.
8. **RLS written once, gradient-ready:** v1 = owner-only on every table; the future guest policies (reachability AND visibility, §2a) get drafted now as comments beside them — sharing lands later as pure addition, zero rewrites.

## 5. What translation is NOT

No app code, no screens, no picker, no canvas work, no UI choices, no deploys. It pours and proves the foundation; the **port** (next step) builds on it — starting with the login wall, after which the owner's real notes come in as the living test layer.
