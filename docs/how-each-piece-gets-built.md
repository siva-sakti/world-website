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
