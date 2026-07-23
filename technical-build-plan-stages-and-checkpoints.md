# Technical build plan — stages, checkpoints, and model assignments

**What this is:** the execution plan for the technical build — from translation through the knowledge layer (agreements §8.3–4 · ROADMAP Phases 1–2) — written with the owner, 2026-07-21 (D-082). Stage 1's detailed rulebook is `translation-guidelines-conceptual-to-technical.md` (referenced, never repeated). ROADMAP stays the product sequence; this is the work campaign for its next stretch and gets reconciled into the rebuilt ROADMAP during Stage 1.

**The owner's vision this serves:** an awesome space for their notes — to learn, dream, and think in. Every stage below is measured against that, and the final measure is Stage 4.

---

## 0. Doctrine (how this campaign runs)

- **Plan-just-in-time.** Full detail exists only for stages whose inputs are frozen (1–2). Stage 3 gets shape + an entry gate here; its detailed plan is written fresh the day it starts. *Evidence: `old/draft-plan-tags.md` — written far ahead, rotted before build.*
- **Model assignments (the owner's arbitrage):** planning + every verification gate = the strongest model (Fable). Build execution = Opus — safe *because* the docs are decision-complete (the builder improvises nothing by design). Proof-running is delegated to subagents wherever mechanical.
- **The cleverness standard (owner refinement, 2026-07-21):** as clever as genuinely better — never simplified *for* the owner, always explainable *to* the owner on demand. Every non-obvious choice answers the **cleverness triple-check**: (1) **proven** — a test exists that fails if it breaks; (2) **load-bearing** — it buys something nameable (fewer moving parts, fewer failure modes, a door held open); clever that *adds* machinery is suspect; (3) **explainable on demand**.
- **Checkpoints are the rhythm, not the calendar.** No dates. A stage is done when its acceptance list is green and its checkpoint passed.

## 1. The verifier's checklist (what "checking" specifically looks for — never vibes)

1. **Citations both directions** — every schema element names its agreements sentence; every ruled clause landed somewhere.
2. **Invariant coverage** — every rule in `invariants.md` realized at its "kept by" level, each attacked once and the refusal recorded.
3. **Scenario replays match** — the seven scenes of `model-scenarios.md`, line-by-line.
4. **Old-schema diff** — every disappearance names the ruling that killed it.
5. **Foreclosure doors held** — `parked.md`'s five migration notes + the A-list doors still openable by pure addition.
6. **Retired-words sweep** — nothing from the lexicon's dead list appears in any new artifact.
7. **Cross-doc contradiction sweep** — new artifacts vs the agreements and each other.
8. **The cleverness triple-check** on every non-obvious design choice.
9. **Doc census** — every root doc has a CLAUDE.md hub row (no orphans); docs whose job is complete are retired to `old/`, never left ambient.

---

## Stage 1 — Translation (paper → proven foundation)

**Rulebook:** `translation-guidelines-conceptual-to-technical.md` (10 rules · 8 steps · per-artifact acceptance · §4 engineering strategy). **Models:** Fable authors and verifies; subagents run mechanical proofs.

| substage | what happens | done when |
|---|---|---|
| 1a | Derive the schema (guidelines step 1) | drafted with full citations |
| 1b | **CHECKPOINT A — the tour** *(owner + Claude, conversational)*: table by table in the owner's words, before proofs; owner interrupts and vetoes freely; the explainable-on-demand check exercised live | owner says "that's my model" |
| 1c | Mechanical proofs (step 2): apply to throwaway DB · attack every constraint · the two-session race probe — subagent-run | every refusal recorded |
| 1d | Faithfulness proofs (step 3): scenario seed + surface replays · export completeness (I-G1) | replays match the doc |
| 1e | Old-schema diff (step 4) | every difference names its ruling |
| 1f | SPEC + ROADMAP rebuilt (steps 5–6; ROADMAP absorbs this plan's stages) · **doc retirement sweep:** `audit-agreements.md` + `agreements-review-brief.md` (jobs complete) move to `old/`, hub rows updated | per-artifact acceptance in guidelines §3 · doc census clean |
| 1g | Independent verification (step 7) — the §1 checklist above, run by the verifier | zero unexplained findings |
| 1h | **CHECKPOINT B — the replayed week** *(owner gate, step 8)*: the seven scenes re-run against real rows, plain words, plus the log of every boundary call with vetoes open | owner approves outcomes |

## Stage 2 — The port (foundation → real app; real notes become safe)

**Models:** Opus builds; Fable verifies 2b–2c (the model-touching substages); owner owns 2g.

| substage | what happens | accepted when |
|---|---|---|
| 2a | **Login wall** — auth on every route; the public-open prototype state closed; **no signup path exists** (the whole privacy wall rests on "only the owner ever has an account" — an explicit line, not an ambient fact) | owner logs in/out **on desktop**; logged-out sees nothing; **no route creates a second account.** *(Daylight login is verified at 2e/2g — it needs the deployed URL; LAN dev can't hydrate the Daylight)* |
| 2b | **Schema to cloud** — the proven migration applied to the cloud project (empty-DB replace, ruled); storage buckets created | Stage-1 proofs re-run green against the cloud DB |
| 2c | **Compose rewired** — localStorage out; every read/write through the one door (`lib/db`) onto real bits/placements; home = your boards. **The pen → a drawing bit, strokes persisted through the new save path** — *the hardest-won feature (3 real device bugs); the port changes its save path, so this is Stage 2's riskiest silent regression — name it and re-verify.* Includes **delete-a-bit honoring I-W1** ("Remove from this board" vs "Move to trash", visually distinct) + trash/restore + **the optional text-bit title (D-087 — blank-default, first-line-stands-in, the `content` unlock; zero schema change)** + **the content-line offer at pen-Done** (S5) | prototype behaviors reproduced on real rows **incl. the pen (strokes captured → saved → reloaded)**; I-W1 visible on every removal surface; an optional title writable on a text bit, blank by default; the "add a few words?" offer present at pen-Done, one tap to skip |
| 2d | **Media pipeline** — images client→storage direct, downscale, thumbnails; **the HEIC message** (parked C2 — no more silent failure); **the content-line offer at image-drop** — *S5's highest-leverage note: this screenshot-heavy owner's single biggest findability surface; make it effortless + dictation-friendly, one tap to skip* | photo drop works on desktop + Daylight; a HEIC gets a message, not silence; **the "add a few words?" offer fires at image-drop and is one tap to skip** |
| 2e | **Deploy** — env vars on Vercel (owner supplies access), redeploy, custom domain if the owner wants it now | live URL; logged-out blocked |
| 2f | **Backup + export** — nightly backup action; `/export` = one tap → every row + every file (I-G1) | one restore drill passes; an export opened and inspected |
| 2g | **CHECKPOINT C — the two-device day** *(owner, hands-on)*: log in on both devices **(the Daylight's first real login — needs 2e's URL)**; make, edit, move, trash, restore across them; drop wifi mid-edit and see the honest failure; **re-validate the Daylight pen end-to-end** (strokes captured → saved → reloaded — the save path changed in 2c). **Owner decides by trying:** import the prototype board's content, or start clean | owner satisfied on both devices; the Daylight pen works through the real save path |
| 2h | **Real notes in** — the retreat notes, for real (scene S1 comes true). The space stops being a test | the owner's first real board exists behind the login |

## Stage 3 — Knowledge layer (shape + entry gate only — detailed plan written fresh at stage start)

**Build order of the pieces:** **quick-add (paste-a-note → a bit) — build early; it's the seeding mechanism for the real Apple-Notes cluster, and the "build the knowledge layer WITH real content" guardrail depends on it** → tags + the picker (chips, pre-lit at board birth — §3; **the subtype chips live here too, being vocabulary UI — so Stage-2 bit-creation has no subtype picker: chosen, not accidental**) → **the pull** → find + the ledger (empty query) → the tag manager (rename · merge · delete, counts including frozen) → the bit's page + travel → the **connector batch** (canvas arrows — §6a's post-port enrichment).

**Also name in the fresh plan — a boardless-bit creation path.** The model allows born-free bits and the ledger displays them, but every creation path so far is *on a board*; without a surface that makes a loose bit, they never exist in practice. A "**+ jot**" on the ledger page is the natural home. Build-or-defer is a conscious Stage-3 call — name it, don't let it fall through the cracks.

**Entry gate:** Stage 2 fully accepted **+** a fresh detailed plan derived that day from agreements §3/§4/§7 + `research-knowledge-layer.md` (the standing anti-staleness rule: per-piece plans are written right before their build, never earlier) **+ a presentation-intentionality call (the one place this plan can *raise* the odds, not just verify them).** The design stance names the feed (deferred to Phase 6) as the *one* deliberately-designed surface — but with the feed deferred, **the pull and the ledger are the de-facto return surfaces the whole campaign's success (Stage 4) hinges on.** The fresh plan must **either extend feed-level presentation care to the pull/ledger, or decline it consciously** — never let the soul surface get quiet-chrome-by-default treatment.

**CHECKPOINT D — living** *(owner, daily)*: tagging and pulling real notes; every behavior question arrives as a thing to try, not a paragraph to imagine.

## Stage 4 — The return test (no build; the tool must earn it)

Three weeks of ordinary life with real notes and the knowledge layer. The D-053 metric, unchanged: **does the owner open it unprompted — to connect and develop ideas?** Yes → the vision is real; everything further (graph, phone capture, the feed) builds on proven ground. No → we learn why before building more.

---

## The owner's complete to-do list, all stages

- **Checkpoints:** A (the tour) · B (the replayed week) · C (the two-device day + the import-or-clean decision) · D (living in it)
- **Owner-only ops in Stage 2:** Vercel access/env confirmation; the custom domain if wanted
- **Boundary questions** as they arise — always as things to try when testable
- Nothing else. Everything else is Claude-side, verified per §1, recorded per the standing routine.
