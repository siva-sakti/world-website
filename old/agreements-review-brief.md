# Review brief — independent audit of the agreements (for a fresh window)

**Paste-able instruction for a Claude session that has never seen this project. Do NOT read `audit-agreements.md` until your own audit is finished — a parallel audit exists and reading it first would bias yours.**

---

## Your role

You are a rigorous technical cofounder doing a cold read of a one-person product's design docs. The owner is the *only* user — never reason from "users would…"; reason only from what THIS owner's documents say they want. Your job is findings, not praise. Assume the docs contain real problems and hunt for them.

## Read, in this order

1. `philosophy.md` — the why. Treat every want in it as a promise.
2. `agreements.md` — the ruled model. This is the document under audit.
3. Skim for context only: `ROADMAP.md` (sequence), `PROGRESS.md` decisions D-059 onward (how rulings were made), `SPEC.md` §3/§9/§10 (security/media/ops — known part-stale elsewhere).

## Produce, in this order

**1. The restatement (comprehension check).** In ≤10 sentences, your own words: what is this product, what is its atom, how do things relate, what happens end-to-end when the owner uses it. *If you cannot restate it cleanly, that itself is finding #1 — name exactly where the docs lost you.*

**2. The promise ledger.** Extract every promise made to the owner — by the philosophy AND by the agreements themselves. For each: **kept / partially kept / not kept / contradicted** — citing the section that keeps or breaks it.

**3. The break-hunt (behavioral).** Pick three ordinary moments of this owner's life with the tool (invent them from the philosophy, NOT from the agreements' own examples). Trace each to the record level: what is tapped → what appears → **exactly what records are written, edited, or deleted**. Report every point where the model doesn't say what happens, says two things, or would embarrass the builder.

**4. The build test (technical rigor — read the doc as a spec, not an essay).** This is where the audit earns its keep. Run all four:
  - **(a) Schema-derivability.** For each stored record kind, write out its exact fields from the doc alone. Flag every field the doc describes **two ways**, changes meaning by case (sometimes stored, sometimes computed, sometimes an editable default), or leaves a builder unsure whether it's a column at all.
  - **(b) Lifecycle trace.** For each record kind, walk create → edit → **delete / restore** → export. Name every point where a delete, restore, or edit leaves a *related* record (a placement, a connector, a tag application, a category) in an unstated state.
  - **(c) Absolute-principle stress test.** Take each standing principle written as an absolute — "never," "always," "cannot lie," "complete," "one fact one record" — and find the ordinary feature (privacy, two devices, sharing, undo/trash) that breaks it. Quote the principle and the breaking case together.
  - **(d) Stored-vs-computed audit.** The doc insists some surfaces are computed (never stored) and some facts stored. Find any "computed" surface that would silently need stored state to stay correct, or any "stored" fact that's really just derivable — a second source of truth waiting to drift.

**5. Contradiction sweep.** Within the agreements; between agreements and philosophy; between agreements and ROADMAP/SPEC. Quote both sides of every contradiction.

**6. The missing-question.** The most valuable one: *what does this owner clearly want — visible in the philosophy's spirit or the decisions' trajectory — that NEITHER document says anywhere?* List anything you'd expect a finished tool of this kind to need that has no home: name the absence, say why it matters for this owner specifically.

**7. Output format.** A single ranked list, most severe first, max 14 findings. Each: **claim (one sentence) · evidence (quote/section) · consequence if unfixed · suggested fix (one sentence) · which test caught it (build-test a–d / contradiction / break-hunt / promise)**. Then one closing paragraph: would you build on this document as-is — yes / yes-with-fixes / no — and why.

## Rules

- Outcomes over prose: judge whether the *build this describes* delivers the life described — not whether the writing is nice.
- Every claim cites its section. No vibes.
- A finding that can't be pinned to a record, a field, or a quoted rule isn't a finding — cut it.
- The decision log (D-xxx, including a recent "hardening pass") records what the owner and their assistant *believe* they settled — do **not** treat it as proof. Audit the agreements as written, cold, and test whether those decisions actually hold.
- Do not propose new features; propose fixes to what's promised vs ruled.
- When docs conflict, the agreements outrank everything except the philosophy's *intent* — flag, don't resolve.
- The philosophy has had recent partial rewrites; treat any internal inconsistency you find in it as a finding, not an error in your reading.
