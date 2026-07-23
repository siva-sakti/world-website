# Vetting the technical layer — does it deliver the concept? (the process + the ledger)

**What this is:** the working process for proving the *translation* from concept (the owner's head, `philosophy.md`) to technical (schema / plans / code) — plus the live **ledger** of what's proven, at what strength. We build *alongside* this doc; it gates the build. Written 2026-07-19.

Born from the owner's step-back: *"are we missing something in the schema… did we even have the right **set** of things to plan out… when it plays out, will it work?"* Three distinct worries — this doc gives each one a check.

## The failure this prevents

Declaring "done" at the wrong level of proof. A schema that applies is not a model that fits; plans that read well are not a set that's complete; a feature that builds is not a tool that works. So: **every claim of progress names its evidence.**

## The three levels of proof

| Level | The claim | Proven by | What it CANNOT catch |
|---|---|---|---|
| **L1 — mechanically valid** | the SQL applies, constraints behave, build passes | migrations run + verify scripts | a missing column, a missing feature, a missing *idea* |
| **L2 — faithful translation** | real content and real moments fit the model without contortion | the promise audit + scenario walkthroughs (below) | whether you'll actually *live* in it |
| **L3 — works as a tool** | real use produces the grow/return experience | the owner using it on real notes, over weeks (the D-053 "return unprompted" test) | nothing — this is the real thing |

**Rule: every "done" names its level.** "Tags: L1" is not "tags work." Paper can never prove L3 — the process's job is to make L3 failure *cheap and early*, not impossible.

## The two questions — completeness before correctness

**1. Coverage — "do we even have a piece for this?"** *(the step-back question)*. Asked from two directions so gaps can't hide:

- **Top-down — the promise audit.** Every promise in `philosophy.md` (grow-not-store, spatial+memory together, handwriting+typing on one page, re-combinable by meaning, backlinks+graph, a place worth returning to, the maturity/exposure gradient, instant capture, everything findable *including pieces*, "I can export everything, always", home-not-platform) is traced to the planned piece(s) that deliver it — or flagged **UNMAPPED**. An unmapped promise = a missing thing to plan, found *before* building.
- **Bottom-up — the scenario walkthrough.** 6–8 **real moments from the owner's life** with this tool, traced end-to-end through the exact tables and rows (this bit, these placements, this tag join, this link). A moment nothing serves = a missing piece, not a flawed one.

Scenarios are drawn from the philosophy and the owner's real life — **never from the plans** (scenarios derived from plans can only confirm the plans).

**2. Fidelity — "does the piece handle it right?"** The row-by-row trace itself, with a verdict per scenario: **fits cleanly / fits awkwardly / doesn't fit**.

## The loop

0. **Promise audit** — once, now; re-run whenever the philosophy changes.
1. **Scenario walkthrough** → verdicts + a punch-list of model changes and open decisions.
2. **Owner review — the owner is the oracle.** Their conceptual clarity is ahead of the technical translation, so they judge each item: *"yes, that's what I mean / no."* Claude never self-certifies L2 or L3.
3. **Fix the model first** — punch-list becomes a new migration *before* the port, so the port targets the corrected model instead of discovering its flaws mid-build.
4. **Port + seed with real content** (the retreat notes). From here on, every piece is tested against real notes, never toy data.
5. **Rung-by-rung with use-gates.** Build a piece → the owner uses it on real notes for a few days → the owner's verdict gates the next rung. Each next piece's detailed plan gets a **mini-walkthrough** (1–2 scenarios) before its build.

**A gate that fails means stop and re-plan** — never push the broken approach through.

## The ledger (live — update whenever proof changes)

| Piece | L1 | L2 | L3 | Notes |
|---|---|---|---|---|
| Schema (init migration) | ✅ applied to cloud; constraints re-validated (D-028) | ❌ known gaps already: doodle `strokes` + text `fontSize` have no home | — | fix lands via the walkthrough punch-list |
| Compose canvas (text / image / doodle as movable cards) | ✅ | feel validated on the Daylight (D-052) — but on **localStorage, not the schema** | partial: the *feel*, not grow/return | the port re-earns L1/L2 on the real model |
| Transclusion live-sync (one bit on many boards, edit once → updates everywhere) | — | — | — | **the differentiator (D-036) and the hardest piece; never exercised at all** |
| Tags | — | plan only (`draft-plan-tags.md`) | — | gated on the port |
| Links (forward/back) | table exists | plan only (`draft-plan-links.md`) | — | drag-to-connect overlay unproven |
| Find / search | `search_tsv` exists | plan TBD | — | |
| Topic-pages · Graph | — | idea-level only | — | detailed plans written just-in-time |
| Privacy gradient | `visibility` enums exist | seam rules unwritten (public board / private bit, cross-visibility backlinks) | — | phase 7 |
| Capture · Browse feed | — | deliberately unplanned in detail | — | later phases by design (D-053) |

*Already-visible coverage red flags, for the audit to confirm:* the philosophy promises **"I can export everything, always"** — only a *backup* (D-029) is planned, which is disaster-recovery, not owner-facing export; and **"pieces as findable as fragments"** — boards carry no `search_tsv`, so a composed board is currently *less* findable than a bit.

## Rules

- Never claim above the evidence; name the level.
- The owner is the oracle at every L2/L3 gate.
- A new piece enters the ledger *before* its build; the ledger updates in the same session as the proof.
- If spec/plans contradict the philosophy, that's a flag to raise, not a decision to make silently (the philosophy's own rule).

*Where things live:* scenarios + traces + verdicts → `draft-walkthrough.md` (created at step 1) · punch-list decisions → the `PROGRESS.md` D-log · this doc holds only the process + the ledger.
