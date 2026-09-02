# Aerial review — findings on the composition stack (2026-09-03)

> ## STATUS · 🔵 independent review, verified-with-citations · **VERDICT: close, but NOT consolidation-ready**
> Commissioned by the owner with an explicit charter (contradictions · drift · untraceable stamps · unknown ambiguities · factual checks · principle violations; findings-only). Every finding verified against file text, the D-log, the schema, and the editor code. **This document drives the consolidation pass** (after the walk finishes, per the owner's sequence). The full report is preserved below-verbatim in the session log; this file holds the working summary.

## The worst findings
1. **[HIGH] Three coexisting answers to "can a text bit author ties":** base §1.7b's "definitive" table says *yes-live* · the flatness call says *no, stamp pending* · tech I-C1 bakes *no* in as a paid invariant. §1.7b was never amended in place — the amend-in-place rule was broken by its own author.
2. **[HIGH] The definition (the blessed source of truth) answers ruled questions as open** — comp→comp "pending", the block "*Ruled, unbuilt*" vs three other docs' "under discussion".
3. **[HIGH] Evaporate has THREE readings** (never-born · born-then-emptied · unqualified empty-at-click-out) — and base §1.2 still claims empty text bits evaporate, contradicting D-138 (ruled the day before). Acceptance tests only cover one reading.
4. **[HIGH · ambiguity] Evaporate × auto-place × I-L2:** a board-born piece is auto-placed at birth; born-then-emptied evaporation must then hard-delete a placement row outside empty-trash — violating carried I-L2 — or orphan it. **No lifecycle trace exists. Needs a ruling.**
5. **[MED] Silent invariant fates:** I-Ref3 (from = text bit), I-Ref8 (lazy cache), I-R1's exit-title exception — all superseded by new rulings, none marked; a builder reading `invariants.md` enforces the old law.
6. **[MED] Note-sources at migration:** `source_id` dropped with no count/convert/report — existing notes silently lose provenance (references get grandfathering; sources get nothing).
7. **[MED] Chips already inside bit bodies, post-flatness:** bits keep the shared editor; their existing chips can't mint rows under I-C1 — render dead? stripped? Unnamed.

## Claude's own errors, caught
- **The "missing self-door guard" was never missing** — `placement_not_on_itself` has been in the init schema all along. The backwards-check "found" a closed hole. (Good news wearing an embarrassing hat.)
- **The link-chip face was misquoted:** the ruled rule is captured title **else the URL** — not the domain.
- **Tech §3's blanket "all owner-stamped unless ⚪"** overclaims — it covers items still ⚑-pending (block display, flatness, the recursion guard).

## Drift to strike at consolidation
Surface-spec §4.2/"shown in full" (superseded by preview-sized) · §4.4 "zero schema changes" (false post-migration) · §2's stale matrix cells (board-door 🟡, comp→comp ⚪) + its "every cell writes a row" line (violates the direction principle as written) · base's closing Open list (still lists ruled items) · the cache's old "stale-acceptable" note six lines above its own re-architecture · definition §3 omits archive from the lifecycle · picker "surfaces" vs "compositions" · F-6 owes its direction-principle re-ask.

## KEEP verbatim (the reviewer's five)
1. The direction principle + mention-is-not-containment + the re-derivation note & deck tripwire (base §1.7).
2. Silent bit-hood + the paste-fresh resolution (the owner's saying/keeping asymmetry, verbatim).
3. The N-answers table — the cleanest provenance-per-ruling block in the stack.
4. Tech §5's provable-vs-feel-test split + §7's caught-by-writing list.
5. `integration-scenes.md` as a method — ⚑-inside-the-moment; S12's banked evidence; S13's honest edges.

## The consolidation recipe (the reviewer's, adopted)
Make the **technical spec the single live layer**; demote the base spec to history in ONE pass (every ⭐ layer lands cited or gets a superseded-by mark) · **re-issue the definition against the 09-03 stamps** before it carries "source of truth" · tech §2 enumerates the fate of EVERY touched invariant (carry/amend/retire — incl. I-Ref3, I-Ref8, I-R1, I-L2-vs-evaporate) · per-line ⚪/⚑ marks replace blanket stamp claims · strike superseded surface-spec cells · move the scenes' answered ⚑s to their answers.
