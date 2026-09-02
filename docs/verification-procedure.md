# The verification procedure — how the spec gets checked

> **Purpose:** turn "is the spec right?" from a judgment into a mechanical pass anyone (or any model) can execute identically. Written because the spec's author cannot reliably check his own work — the failure mode is accepting a plausible near-match as a match.
> **The owner's standard:** *"be way more checking every last detail — confirming what was in our conversation and what made it into the document, so you don't miss anything and you don't hallucinate."*

## Who runs it
**An independent agent, never the spec's author.** Self-checking rationalises near-matches. The author's job is to *fix* what the pass finds, and to state each fix's source.

## The three passes — run in this order, do not merge them

### PASS 1 · TRACE (every spec claim → its source)
For **each numbered claim** in `composition-spec.md`, in document order:
1. State the claim in one line.
2. Find its source in the trail: `composition-base-spec.md` · the walk stations · the N-answers · `integration-scenes.md` · or the code (`src/`, `supabase/migrations/`).
3. Record the verdict — **one of exactly five**:
   - **TRACED** — the source says the same thing. Cite file + line.
   - **DRIFT** — a source exists but says something *materially different*. Quote both.
   - **UNSOURCED** — no source found. *(This is the finding that matters most.)*
   - **MARKED** — the spec already labels it 🔵 or ⚪; verify the label is honest.
   - **CODE** — a claim about what exists today; verify against the repo, cite file + line.
4. ⚠ **A near-match is DRIFT, not TRACED.** If the wording differs in a way a builder could act on differently, it is drift.

### PASS 2 · ABSENCE (every trail ruling → its spec home)
Walk `ruling-register.md` A–K **and** re-read the trail for rulings the register itself may have missed.
1. For each ruling: does it appear in the spec? Where?
2. Verdicts: **PRESENT** (cite section) · **MISSING** · **PARTIAL** (some of it landed).
3. ⚠ **Also list rulings found in the trail that are not in the register at all** — the register is a Claude artifact and may itself have gaps.

### PASS 3 · CONTRADICTION (the spec against itself)
1. Does any section contradict another? *(Especially: states · evaporate · the block's display · the picker's exclusions.)*
2. Does any claim contradict `model.md`, `invariants.md`, or `lexicon.md`?
3. Does any claim contradict the code it describes?

## Output format (required)
A findings list, no prose essay. Each finding: **ID · verdict · the claim · the evidence (file + line) · one line on why it matters.** Group by pass. End with counts per verdict and **the five most serious findings**.
⛔ **The agent does not fix anything, does not redesign, and does not answer open questions.** Findings only.

## Rules for the agent
- **Verify against source text, never against plausibility.** If you cannot cite it, it is UNSOURCED — say so.
- **Do not accept the spec's own citations as proof;** open the cited file and check.
- **Flag uncertainty as uncertainty.** A confident wrong finding is worse than a flagged doubt.
- **Quote, don't paraphrase,** when reporting drift.

## After the pass
The author fixes each finding **and states the source of each fix**. The register is re-run. The DRAFT banner comes off only when Pass 1 has zero UNSOURCED and Pass 2 has zero MISSING.
