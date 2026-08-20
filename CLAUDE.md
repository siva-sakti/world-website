# CLAUDE.md

**Operating manual + hub. Read this FIRST, every session.** It defines the working routine, where everything lives, and the norms. (This complements the owner's global `~/.claude/CLAUDE.md`.)

## When you start a session — do this, in order

1. **Read this file.**
2. **Read `ROADMAP.md`** — the canonical phase sequence + steps: **this is what to build next, in what order.** Then **`PROGRESS.md`** — the Status block (where we are *right now*), the decisions log (D-xxx), and **"Needs owner"** for anything blocked on the human.
3. **Read `agreements.md`** — **the ruled model, the seed of truth.** It outranks every other doc where they conflict; nothing predating it is followed without checking it against the agreements first.
4. **Scope the next step** — `SPEC.md` (the **rebuilt** technical manual — the schema, RLS, media, ops, capture, the invariant→enforcement map; D-085) for the technical *what*; `philosophy.md` for the why. The proven schema is `supabase/migrations/20260721000001_init.sql`; its proofs are `verification/`.
5. **Write a specific plan for the step into `PROGRESS.md`.** If it's 3+ steps or touches any open question, **pause and confirm the plan with the owner before building.**
6. **Build** in small pieces.
7. **Verify** each piece — `pnpm build` + typecheck + run what you can. The owner tests what only their devices can (phone / offline / Shortcut / Daylight).
8. **Record** — each in its ONE place, all **in the same session**: the ruling into `agreements.md` · the full reasoning (options, rejections, catches, lessons) into `deliberations.md` · new always-true rules into `invariants.md` · deferrals into `parked.md` · and a **short** D-log entry (the ruling + supersessions + pointers — a receipt, not an essay; the substance lives in deliberations, never duplicated into the log). "Needs owner" updated.
9. **Sync** — **docs must never drift.** Anything superseded goes to `old/` (never edited again); an external review once caught us drifting, and it doesn't happen twice.

## Where to find what

| Doc | Its one job |
|---|---|
| **`CLAUDE.md`** (this) | Operating manual + hub; the routine above |
| **`philosophy.md`** | The *why* / the goal — check decisions serve it. In the owner's voice; rewritten to the live model (D-069; publish-preview line + "link" verbs swept, D-077) |
| **`agreements.md`** | ⭐ **THE ruled model — the seed of truth.** Everything settled in the owner–Claude working sessions (principles · the bit · tags · the pull · boards · connectors · deferred document mode), latest ruling wins; **outranks every other doc until they're rebuilt from it**. Conceptual model CLOSED (D-070) **+ audit-merged 14/14 (D-072–D-076)** |
| **`lexicon.md`** | **The precise words** — the nine stored things (things · acts · vocabulary) vs the computed surfaces, parts of a bit, the acts, and RETIRED words that cause drift. Check terminology here before using a term two ways |
| **`invariants.md`** | **The always-true rules** — the model's invariants, grown as each cluster of the audit-merge closes; at translation they become the DB constraints + SPEC §2.1. The checklist every data-touching feature is run against |
| **`parked.md`** | **The parked ledger** — every deferral and open item in one place, each with its named re-entry + source. An *index, never a source*: rulings live at the cited sections. Update in the same pass as any new deferral or re-entry |
| **`deliberations.md`** | **The uncompressed why** — per cluster: the arguments, rejected options, advisor catches, and traces behind each D-ruling (the D-entry is the compressed form; this is the substance). Updated in the same session a cluster closes |
| **`model-scenarios.md`** | **Seven real-life scenes traced through the model to the record level** (the §8.2 verification, D-079) — verdict per scene, the felt deferrals, the build notes. Read before building any owner-facing flow. **Doubles as the translation test fixtures** |
| **`translation-guidelines-conceptual-to-technical.md`** | **The rules + procedure for the translation step** (D-081): the charter (translation decides nothing · the decision boundary · citations both ways · scenarios as fixtures · proofs not prose), the 8-step procedure, per-artifact structure/goals/acceptance, and §4 the engineering strategy. The executing session follows it and improvises nothing |
| **`technical-build-plan-stages-and-checkpoints.md`** | **The execution plan for the whole technical build** (D-082): Stages 1–4 (translation → port → knowledge layer → return test), the owner's checkpoints A–D, the verifier's checklist, model assignments (Fable plans/verifies · Opus builds), plan-just-in-time doctrine, the cleverness triple-check |
| **`SPEC.md`** | **The technical manual — REBUILT from the proven schema (D-085).** The five moving pieces · the schema described · privacy/RLS (the ruled AND-composition) · media · ops · capture · the invariant→enforcement map. Describes what's upstream, never re-derives it |
| **`source-and-full-bit-build-plan.md`** · **`source-stage0-checkpoint.md`** | ✅ **DONE + deployed** (supersedes `capture-build-plan.md`, in `old/`): a *regular bit* fully itself (source · tags · rich text, loose or placed) + the inbox as the *view* of loose bits. **Stage 0 — the model fix — D-102** (checkpoint holds the full model on paper); **Stages 1–3 + the source manager — D-103** (rich text · the editable workspace · the source intake · inbox/source-view/sources-list · rename/edit-URL/delete/merge). **Formerly owed, both closed:** a source's URL at intake ✅ (smart source links, D-105) · place-on-a-board ✅ (call-in, D-104). Gather G2/G3 stays its own track |
| **`organize-phase-plan.md`** | ⭐ **THE live plan + feature queue** (2026-08-20): the surface map (rooms · lenses · housekeeping · detail pages), terminology rulings, Phase O (reorganize: home-as-shelf w/ groups+pins · notes tabs · write hint · term sweep · health check) and the ordered Phase-F feature queue. **The owner's idea-dumps get filed here** — read it before proposing or sequencing anything |
| **`gather-build-plan.md`** | ✅ Gather built end-to-end (G2 `[[` + chips + peek D-110 · "gathered into" D-112); the graph picture stays parked (evidence-gated). Historical plan |
| **`call-in-build-plan.md`** | ✅ **BUILT — bring a loose note onto a board** (D-104): the loose-notes **column** on every board (search · tag/source/type filters · click → lands where you're looking) + the inbox **"place on…"** door; one `callInBit` underneath (insert-or-**revive**, I-L1 — arrived_at survives a return, proven in `run-1d`). **Review-hardened same week (D-106):** settled-create door · liveness guard · departed-only revive. Named later doors → parked A19–A23 |
| **`capture-slice1-checkpoint-A.md`** · **`gather-g1-checkpoint-A.md`** | ✅ **The signed-off Checkpoint-A packages** for the two applied data layers (D-100 · D-101): plain-language ruling, the green proofs, the invariants + scenes, and the proposed-edits checklist (folded in same-session). The full reasoning behind each |
| **`connections-build-plan.md`** | ⏸ **PARKED (D-098)** — the gather + reference-graph feature plan, pre-revision draft. Never resume from this file alone |
| **`connections-review-and-resumption-notes.md`** | ⏸ **The complete review + resumption package for the parked connections feature** (D-098): vision, findings, the five revision asks, open questions, owner rulings (graph = read-only), and the locked resumption procedure. The pick-up point |
| **`verification/`** | **The proof record + regression suite (D-085):** the migration's attack suite, the FOR SHARE race probe, the seven-scene replay, the old-schema diff. Re-run after any schema change — the model's regression test from now on |
| **`PROGRESS.md`** | Decisions log (D-xxx) · needs-owner · work done |
| **`ROADMAP.md`** | **The product phase sequence — REBUILT in the ruled language (D-085):** port → knowledge layer → graph → richer boards → capture → feed → sharing; parked items reconciled to phases |
| **`research-knowledge-layer.md`** · **`research-canvas.md`** | Cited research — findings don't expire with plans (the connector's binding model came from here); reference at build time |
| **`old/`** | Everything superseded — kept as history, never edited, never followed. **Includes the completed audit docs** (`audit-agreements.md` · `agreements-review-brief.md` — the cold audit + merge ledger, job done) |

**The vetting method survives its retired file:** proof levels (mechanically-valid / faithful / works-as-a-tool), owner-as-oracle, scenarios-from-life-never-from-plans, every "done" names its evidence — carried forward into the walkthrough and the build gates.

## What this is (one line)

A spatial notebook for one writer: catch what you consume and think as **bits**, return to them, and grow them by arranging them on **boards**. Built **canvas-first** (D-067). The *bit* is the atom (it needs no board, no title, no tag). Full why → `philosophy.md`; the ruled model → `agreements.md`.

## Stack

Next.js (App Router, TS strict) + Supabase (Postgres/Storage/Auth) + Tailwind (layout only) + libs in use: `react-rnd`, `tiptap`, `perfect-freehand`, `react-force-graph-2d`; pre-approved but not yet installed: `dnd-kit`, `pdf.js`, `zod`. New deps need approval. **Cloud** Supabase + Vercel for real capture (a phone can't reach localhost).

## How I work (norms)

- **Plan before code**; small, single-purpose files (~150-line ceiling). One `lib/db` module, one `lib/storage` module — never call Supabase from a component.
- **No debt**: verify before claiming; nothing half-built or hacked in; no dead code/TODOs.
- **Model-safety gates — every feature that touches stored data passes all five:**
  1. Name the invariants it could break (`invariants.md`); any new always-true rule gets added there.
  2. Trace it against every related record — create · edit · un-place · trash · restore · destroy — no blank cells.
  3. Push each rule to the lowest layer that enforces it: DB constraint > type > one db-module fn > app logic.
  4. Derive, don't duplicate — one source of truth per fact.
  5. Prove the *flow* end-to-end, not just the unit.
- **Security is the boundary** (RLS), not the query layer. Service-role key server-only.
- **Bypass permissions is on** — act on reversible work; **never** do irreversible/owner things unsupervised (deploy, cloud accounts, publishing, destructive data ops, new deps).
- **When genuinely unsure** (esp. creative/aesthetic/naming): consult a **Fable** subagent, decide, record it, continue. Technical uncertainty → resolve by verification, not guessing.
- **Record every non-trivial decision** in `PROGRESS.md`. **Stop-and-flag** any fork you can't safely default.
- **Terminology is governed by `lexicon.md`** — the single source for the project's words (the nine stored things vs computed surfaces; the retired words that cause drift). Consult it before naming or defining anything; when the model changes, update the lexicon in the same pass. It becomes the **naming authority for code** (table/type/field names) at the translation step. Never duplicate its definitions elsewhere — point to it.

## Design stance

Quiet, white, fast — make **no aesthetic decisions for the owner**, *except the browse/feed surface*, whose presentation (image-forward, density, rhythm) must be deliberately designed or "returning" fails. Considered-quiet, never careless-ugly. One typeface. Expression otherwise comes from the owner's own content and doodles.

## What not to do

- No features outside the plan/spec. No AI, analytics, collaboration, public product, or a full drawing app. **Before proposing or building anything new — including when the owner reports missing something — check `parked.md` first:** it may be parked (its re-entry condition + build order are pre-ruled — honor them) or rejected outright (dead, don't re-propose).
- Don't refactor what you weren't asked to. No commented-out code, no TODOs.
- Handle empty + error states everywhere. Every list can be empty; every upload can fail.

## Naming (decided)

**bit** + **board** (D-034); a board's spatial rendering is "canvas." The owner's word *fragment* = bit. The tap-a-tag view is **the pull** (ruled, D-070). **bookmark** (the saved-URL bit type, D-074) is **retired** (D-102 — a URL is a *source* on a note, not a saved page); "link" has zero live meanings. No open names.
