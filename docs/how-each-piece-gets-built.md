# How each piece gets built — the runbook
> **What this is** *(owner-asked, 2026-09-04: "I wanna see that in a document, so as we get into the details I can say — OK, let's run through this for this specific feature")*. The build plan says **what** gets built and **when**; this says **how any one piece gets done**, the same way every time. Point at it per feature.
> **Why a runbook at all:** every step below exists because skipping it cost something real in this project. None of it is ceremony.

## 0 · Find its home *(before anything)*
- **Which spec section rules this piece?** If none — **stop.** An unruled piece is not a build task; it is a question for the owner.
- **Which stage owns it?** (`composition-build-plan.md`'s carry-through map.) If none — the map has a gap; fix the map first.

## 1 · Say what "done" looks like — *before* building
Written in **plain language, from her chair**: *"I can do X, and Y happens."* Not "the function returns" — **what she can do afterward that she couldn't before.** If "done" can't be stated this way, the piece isn't understood yet.

## 2 · Name what it could break
- **Which invariants does it touch?** (`invariants.md`.) Any new always-true rule gets added there, same pass.
- **Trace the whole life:** create · edit · trash · restore · archive · destroy. **No blank cells** — a blank is the finding.
- **Push each rule to the lowest layer that can hold it:** a database constraint beats a type, which beats one function, which beats app logic.
- **Derive, don't duplicate** — one source of truth per fact.

## 3 · Adversary first, for anything non-trivial
A fresh agent attacks **the plan, not the code**, with a *specific* brief ("find what's missing / argue the opposite / check every citation"). Vague briefs flatter; specific ones bite. **Every adversary run in this project has found something real.** Findings get folded before building, and material changes go to the owner.

## 4 · Build small, stay green
Small pieces, each ending green. Match the surrounding code's style. **No refactoring you weren't asked for**; no dead code, no TODOs.

## 5 · Prove it — never claim it
- Run it. **Show raw output**, not a summary of raw output.
- Anything data-shaped: a throwaway database, never the real one; the proof file and its output get committed so it can be re-run forever.
- **"Working code" is not "code you think works."** The gap is tests.

## 6 · Clear the floor *(every piece, every time)*
- **The three states** — empty · loading · broken, for each new screen.
- **No hover-only acts** — a non-hover path, or an explicit written "not on phone."
- **Keyboard and phone** — key paths for new controls; holds together at phone width.
- **Green before done** — build + typecheck pass, new logic has a test, nothing contradicts the model or the guardrails.

## 7 · The owner uses it — for something real
⭐ **The step that decides whether it was worth building.** Tests prove it doesn't break; only she can say it's good. Not a demo — a real task, on her own material.

## 8 · Record, in the same session
- The ruling → the spec (**amend in place**; mark what it supersedes, both directions).
- New always-true rule → `invariants.md`. New word → `lexicon.md`. Touches another feature → `cross-feature-rulings.md`.
- **A row in the carry-through map** — a ruling with no build home is the same defect as a stage with no ruling.
- A short receipt in `PROGRESS.md` — the ruling and its pointers, never an essay.

## The standing rule over all of it
**When the spec doesn't answer it: stop and route** — to the spec, then to the owner. Never invent a decision mid-build and record it as settled. *(This project's named failure mode is fluent plausible detail; the guard is citation, never care.)*

## 9 · The loop with the owner — the follow-up procedure *(owner-asked, 2026-09-06: "I want a follow-up procedure. I want to be kept in the loop.")*
**The principle: she never has to ask "where are we?" — the report arrives on its own, at fixed moments, in the same shape every time.**

**Before a piece — one short paragraph, unprompted:** what I'm about to build · what "done" looks like **from her chair** (§1) · what it could break (§2) · anything I had to assume. She can redirect in one line, or ignore it and I proceed. *(Small pieces inside an approved stage don't each need a yes — this is notice, not a permission request. Anything that changes scope, schema, or a public signature DOES need her word.)*

**During — silence, with exactly three interrupts:** ① the spec doesn't answer something → **stop and route** (never invent) ② an idea arrives → **file-and-price**, her call ③ the approach goes sideways → **stop and re-plan**, don't push a broken approach through.

**After every piece — the report card, always these five, always in this order:**
1. **What you can now do that you couldn't** — plain language, her chair.
2. **The proof** — raw output pasted, not summarized. Tests, build, typecheck.
3. **What I did NOT do** — the deliberate omissions, so absence is never mistaken for oversight.
4. **What I'm unsure about** — labeled uncertainty, or the word "none."
5. **Your steps, if it's testable** — numbered, literal, on the real app *("open X, click Y, expect Z")*; **her result is the evidence.** She is the hands; a click is never simulated and a surface is never declared working from reading code.

**After every stage — the checkpoint:** she uses it for something real on her own material (§7) · her snags become the fix list · the receipt lands in `PROGRESS.md` **the same session** (§8) · then, and only then, the next stage starts.

**If a piece takes longer than expected:** say so at the point of noticing, with the reason. A silent overrun is the loop breaking.

### The referencing discipline *(the second half of her ask: "be careful with what you reference")*
- **Open the file before saying what it says.** Never characterize a document from memory. *(Earned twice over: this project's own sealed line turned out to be a late unwalked swap, and only a grep found it — `PROGRESS.md` D-151.)*
- **Quote, then interpret** — the words first, the reading second, so she can disagree with the reading.
- **Cite by name:** doc + section for rulings, `file.ts:line` for code, D-number for decisions. A claim with no citation is an opinion and gets labeled one.
- **Never assert how another product works** without a fetched source in the same message, or the word "inference" in the same sentence. **Never invent a confidence number.**
- **Cross-window facts come from the shared docs or a direct message** — never assumed, never inferred from what a lane "probably" did.
- **Superseded is not deleted:** when something changes, mark what it supersedes in both directions and move the old to `old/` — no silent overwrites of the record.

---
## The norms, hardened by use *(added 2026-09-04 — each earned in this project, none theoretical)*
- **The adversary pattern is not optional.** Every single adversarial pass in this project found something real — including one RETHINK that stopped a procedure that would have failed on first contact. Brief them SPECIFICALLY ("argue the opposite; check every citation; hunt the seams between late edits"); vague briefs flatter.
- **"Recorded" means the edit RAN.** Twice, an edit was claimed in prose and never executed. Saying it is not doing it; the grep after is part of the doing.
- **Confidence decomposes or it's vibes.** Never one number; per-layer, each with the evidence it rests on and the risk that remains named. Never invent a percentage.
- **Findings get demoted-and-returned, not resolved by momentum.** Anything that turns out to be the owner's call goes back to her as a full question (scenario + options), never a compressed label she can't recognize.
- **Rehearse against REAL data, not just fixtures.** The real-data run found what five adversaries could not (the backup's migration-position trap). And a restore that has never been performed is not a back-out plan.
- **Golden outputs + counted refusals.** A proof runner asserts its own numbers (n truths, n refusals, zero false in ANY column) and diffs against a committed golden file — the runner that "printed green" over missing refusals was caught by its own hardening.
- **Cross-window contracts live in BOTH lanes' documents,** named files, so no later session can miss them. Lanes: new files where possible; one named owner per shared file.
- **The owner is the hands.** Never simulate a click; never claim a surface works from reading code. Numbered literal steps → her result is the evidence. Machine-checkable things still get proven with raw output.
- **Two documents = a carry-through map.** Whenever truth and sequence live in different files, a both-directions map with a re-run rule — or they drift (found four homeless sections on its first run).
- **Plain words beat codes in anything the owner reads.** Migration/S1–S4/trough/paper each cost a round-trip. Define terms at first use; when a word confuses, rename the artifact, not the owner.
- **Hold the sequencing the owner set.** Anxious-and-curious is not a reason to start; her words: *"not at the cost of messing anything up."* Position ahead (paper, rehearsals, adversaries) — never build ahead.
- **Mid-stage ideas: file-and-price, never fold unbidden — SHE decides (owner amendment, 2026-09-06).** When an idea arrives mid-stage: file it in the queue AND tell her the cost of folding now vs after. *"If something makes sense mid-stage, we could allow it"* — her call, every time; the discipline binds Claude, not her.
