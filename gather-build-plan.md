# Gather — Build Plan (connect a bit into a thought, as you write)

**What this is:** the full technical plan for **gather** — tying one bit to another *from inside your writing*, and seeing those ties from the other end ("gathered into"). This is the **connecting act** half of the parked Connections feature (B9); the **graph picture** stays parked and is picked up separately (its findings preserved below). Reconciled with `connections-review-and-resumption-notes.md` — nothing here is re-derived; the banked findings are folded in and cited.

**Vision:** while you're writing a thought, you reach for another bit you made — a quote, a doodle, a note — and pull it in *without leaving the flow of writing*. The tie is born from the sentence. Later, standing on that gathered bit, you see every thought that reached for it, for free.

**Success feel:** gathering a doodle into a thought takes seconds and feels like **writing, not filing**; the doodle's page then shows "gathered into: [that thought]" with no further act.

---

## What we settled with the owner (2026-07-25)

| # | decision | ruling |
|---|---|---|
| 1 | Direction | **Directional.** A tie goes *from* the writing *to* the bit reached for. Forward (what this thought gathers) and backward ("gathered into") are **one tie seen from both ends** — the backward view is free, never authored by hand. |
| 2 | Where you gather | **A writing act.** You gather by typing `[[` inside a **text bit**; the source of a tie is always writing. The target can be **any** bit (text, image, drawing — *bookmark retired, D-102*). |
| 3 | What the chip shows | the target bit's **face** — resolved **live** on the bit page/cards, **truncated ~30 chars for display only**. The **full face** is also **cached in the chip** (searchable; list labels read it, refreshed lazily on the note's next save/view — Open decision #1). A **pointer, not a paste**: shows the headline + links there, never embeds content. |
| 4 | Storage format | **HTML today** (how a text bit's `body` is already stored). Built **format-agnostic**: the tie derives from the body regardless of format, so a later move to **Markdown** — the portable, Obsidian-native choice for word-forward writing (`[[ ]]` is literally native Markdown) — is cheap. That switch is a **deferred decision tied to document mode** (see Deferred), not made here. |
| 5 | The graph | **deferred, parked** (with the union-not-swap finding, below). Gather ships the connecting act; the picture comes later. |

---

## How it fits the app (the reconciliation — read before building)

- **`reference` is a NEW directed table; the dormant ninth stays parked.** (Finding #1, ruled.) The dormant table was built for a *symmetric* pair-tie (parked A2 — "these two relate," no direction). Gather is *directed*, a different relationship. So `reference` is its own table, and **`dormant` keeps sleeping** — still meaningful for the rare case gather can't reach (two non-text bits that relate, with no writing involved). No silent drift: this is the recorded ruling.
- **`reference` is a *derived artifact*, not an act.** (Finding §6 model-grade, ruled.) Its rows are a **materialized index of the ties expressed in bodies** — reconciled *from* the body on save, never independently authored. The **body is the source of truth**; the rows exist so "gathered into" (and the future graph) are fast reads instead of scanning every body. Consequence: **there is no "delete a reference" act** — you delete the chip in your writing and save; the row falls away, traceless, like un-tagging (finding §6, confirmed).
- **The chip lives inside the body HTML.** A text bit's `body` is already tiptap HTML (`getHTML()`, stored, rendered). A gather-chip serializes as a tagged element carrying only the target id — e.g. `<span data-ref="TARGET_BIT_ID"></span>`. The reference physically sits where you typed it.
- **The id is the source of truth; the full face is cached beside it for search/labels, refreshed lazily.** The chip stores the target id (in `data-ref` — the truth) *and* a cached copy of the target's **full face** as visible text. The bit page/cards resolve the id **live** (always current); the stored `face`/`search_tsv` read the cached text, so list labels read naturally and notes are findable by what they reference. The cache refreshes when its note is next saved or viewed (single-note reconcile-on-read) — **no rename fan-out** (Open decision #1). The id sits in an attribute, so it's stripped from face/search — no UUIDs leak; only the human face text is indexed. *This caches a bit's spelling — a knowing carve to Principle 9.*
- **"Gathered into" is a read from the other side — computed, not stored.** On a bit's page: *"every `reference` whose `to_bit_id` is me → show each source's face."* Read-only, automatic; the payoff surface. (Retired word "backlink" — the surface is **"gathered into"**.)
- **Cleanup is by the database.** `reference` foreign-keys to `bit` with `on delete cascade`: **destroy** a bit and its ties vanish both ways. **Trash** (soft-delete) leaves the rows; the surfaces filter deleted bits, like everywhere else.
- **Export includes it (I-G1).** (Finding #3.) `reference` joins the `/export` table list and the completeness proof — or "you own everything" silently breaks.
- **The save is two writes — named and mitigated.** (Finding #4.) Body save → reference reconcile. If the reconcile fails, "gathered into" lags the body until the next save. Mitigation: **reconcile-on-read** — a bit's page recomputes its gathered-into defensively (cheap), and a failed reconcile is retried on next open. Never a silent permanent disagreement.
- **"From must be text" — app-guarded, not a second trigger.** (Finding #5.) Strategy §4.7 rules *exactly one trigger*; so the "only a text bit originates a reference" rule lives in the **one write door** (the I-R1 precedent), with a proof that attacks it. The DB `check` can't see another row's type without a trigger, so this is app-layer by design, on purpose.
- **Text→text is allowed; cycles are safe *only because chips are pointers*.** (Finding §6, load-bearing.) A thought can gather another thought; A↔B cycles are possible and harmless because a chip renders a **face**, never live content — there is no transclusion to loop. This reasoning is recorded to defend against any future "show the gathered content inline" proposal (which would reintroduce the loop).
- **Gathering ≠ placing.** A reference does **not** put the target on a board; it lives in the thought's text only. (Owner-feel confirm at Checkpoint B, but this is the design.)
- **Gather (reference) ≠ the canvas arrow (connector).** Three distinct ties, kept orthogonal (finding #7): **arrow** = arrangement on a board (connector, plan D) · **reference** = gathered-into · **tag/board** = shared middles. The lexicon draws this three-way line.
- **Document-mode adjacency — watch, don't build.** (Finding #6.) Inline gather is §6b's *call-in* minus ordering/split-merge (safely avoided by staying inside one body). A gathering habit will grow appetite for text-forward composing — but **document mode is now slated as its own Plan E** (this session's v1 reframe) **with a mandatory design round**; gather must not preempt it. Note the adjacency in `deliberations.md`.
- **To gather a doodle, the doodle needs words.** A wordless drawing has an empty face and can't be found by typing `[[fire…`. So the pen "add a few words?" offer is the **price of admission** for weaving doodles into thoughts — not new work, but the reason it matters.

**Net new model:** one new table (`reference`), one line added to the export list. Everything else is app-layer (the editor gesture + chip-aware rendering) and reuse.

---

## The model change

```sql
-- reference — a materialized index of the gather-ties expressed in bodies.
-- Directed: a text bit's writing → any bit. Rows are DERIVED from the body on
-- save (never authored directly); stored so "gathered into" + the future graph
-- are fast reads. Owner-scoped like every table (D-094 RLS).
create table reference (
  id          uuid primary key default gen_random_uuid(),
  from_bit_id uuid not null references bit(id) on delete cascade,  -- the writing (a text bit — app-guarded)
  to_bit_id   uuid not null references bit(id) on delete cascade,  -- the bit reached for (any kind)
  created_at  timestamptz not null default now(),
  constraint reference_not_self check (from_bit_id <> to_bit_id),  -- a bit can't gather itself
  constraint reference_once     unique (from_bit_id, to_bit_id)    -- one tie per pair; mention twice = one row
);
create index reference_from on reference (from_bit_id);   -- forward: what this thought gathers
create index reference_to   on reference (to_bit_id);     -- backward: "gathered into" — the payoff read

alter table reference enable row level security;
create policy reference_owner_all on reference for all
  using (auth.uid() = <owner>) with check (auth.uid() = <owner>);   -- same owner clause as every table
```

- **The target-pair door (finding #8), named not built:** board-gathering isn't v1, so the target is a single `to_bit_id`. If gathering *into a board* ever fires, this becomes the house exactly-one-target shape (`to_bit_id` / `to_board_id` + a CHECK) — a small migration then, flagged now so it isn't a surprise.
- **Export:** add `"reference"` to the `TABLES` array in `src/app/api/export/route.ts` (it's a hardcoded list — omission = silent data loss).
- Additive migration on the proven schema · `verification/` extended (a new `reference` attack + a "from must be text" app-guard proof) · re-proved locally before it touches the cloud.

---

## Open decisions (surfaced, with leans — settle at Gather-Checkpoint A/B)

1. **The stored-face gap — RESOLVED (owner, 2026-07-25; revised after review): the natural, searchable way, with an honest lazy cache.** *Context:* Postgres full-text search indexes each row's *own* text — no view or generated column can pull another bit's words into a note's search. So to make a note findable by "fire doodle," those words **must be materialized in the note's own body**. **Ruling:** the chip **caches the target's full face as its visible text** (`<span data-ref="id">fire doodle</span>`) — so labels read naturally *and* notes are findable by what they reference (the Obsidian feel). This is genuinely unavoidable for the searchable feel, and it is a **knowing carve to Principle 9** ("renames are free — nothing stores a bit's spelling"): a gathered bit's face is now copied into referencing bodies, the price of search-by-referenced-words. Recorded as such at G1 — *not* smoothed into "no-drift."
   - **How the copy stays current — lazily, no fan-out.** A chip re-resolves its cached text whenever its note is next **saved or its page viewed** (a single-note reconcile-on-read — Finding #4's mitigation already runs there). **No rename-propagation.** *(An earlier draft added synchronous propagation — rewriting every referencing note on rename — and the review rightly killed it: it mutates untouched owner bodies, lies about their `updated_at`, is the exact "manually maintain a surface" that compute-don't-maintain forbids, and removed a staleness the owner had already accepted.)*
   - **The true behavior (not "never drifts"):** rich surfaces (bit page, cards) resolve the chip **live**, so what you're looking at is current; the **list labels** (pull · find · the `[[` picker) read the stored cache, so a note you neither open nor edit can show a **renamed target's old name until you next touch it**, and is briefly not findable by the new name. Usually current; always self-heals on touch; may lag on untouched notes — the eventual-consistency the owner accepted.
   - *(Two mechanisms, chosen knowingly — not redundant: the chip-aware renderer resolves live because it *can* (client-side, cross-row); the stored face/search uses the cache because FTS *forces* per-row materialization. Propagation was the redundant, dangerous third — gone.)*
   - *G1 traces the mixed-sentence thought through the pull so the natural label — and its lag window — is seen on paper.*
2. **Tap a chip: navigate away, or peek (popover, stay in flow)?** *Lean: navigate v1* (simpler); peek is a later nicety. Checkpoint-B feel.
3. **Gatheredness on canvas cards** ("part of 3 thoughts") or page-only? *Lean: page-only v1.*
4. **Gathering places nothing** (target stays only in the text) — confirm it matches expectation at Checkpoint B.

---

## The stages (Gather-prefixed to avoid colliding with other plans' letters; finding: numbering)

### G1 — the data layer + model on paper → ◆ Gather-Checkpoint A *(nothing touches the cloud until sign-off)*
- The migration above (the `reference` table + RLS + indexes) and the export-list edit.
- **The §6 reconciliation, drafted for approval:** a stored bit↔bit fact now exists — the sentences that supersede §6's "no stored bit↔bit fact / the dormant table stays nameless," **keeping `dormant` parked for the symmetric A2 case**. Plus the **philosophy line in the owner's voice** (spirit: *"thoughts connect three ways: shared words, shared places, and threads I tie on purpose"*) and the stale "not-coming pairwise link" ROADMAP footnote removed. This is **owner-authority-ahead-of-evidence** (D-087 precedent), recorded honestly as such.
- **Lexicon sweep** (finding #7): verb **gather** · record **reference** (a derived artifact) · surface **"gathered into"** · retire "backlink" and "pull in"; draw the three-way line (arrow / reference / shared middles).
- **The kinds-count + family sweep** (grep-verified; the "six→eight" species, due a third time). `reference` is a **new stored table that fits no existing family** — the **first derived index** (stored in layer A, but layer-E-natured: rebuildable from bodies, exported for completeness). Update the load-bearing prose, phrased to name the new *nature* not just bump a number — "eight record kinds in three families + the dormant ninth **+ one derived index (`reference`)**": lexicon (lines 5, 9) · agreements §7 layer-A storage map (line 251, add a row) · SPEC §2 ("eight record kinds… all **nine** tables" → **ten** tables, name the index; lines 11, 19, 32) · ROADMAP §4 (line 93).
- **Persist the design-rationale essence into `deliberations.md`** (doc-census rule, still open from the resumption notes): the connections "thinking-canvas" lives only as an external artifact — its reasoning (make-then-render · body-as-truth · the directed-vs-symmetric split) must live in the repo. Locate + summarize at G1.
- **Carve Principle 9 explicitly** (the way P10/§2c were carved in the soundness pass): "renames are free — nothing stores a bit's spelling" now has a **named exception** — a gathered bit's face is cached in referencing bodies, the knowing price of search-by-referenced-words. Record it in agreements + invariants as a *trade*, not as "no-drift."
- **Invariants (I-Ref set):** directed · one row per (from,to) · from is a text bit (app-guarded) · rows derived from the body, never authored · removal is traceless (delete chip → reconcile) · cascade on destroy · included in export · **the chip caches the target's full face for search/labels, refreshed lazily (no fan-out) — a knowing carve to Principle 9** (Open decision #1).
- **Scenes traced (every cell):** gather a bit (row appears on save) · edit the writing / remove the chip (row falls away) · rename the target (chip re-faces, row unchanged) · trash the target (chip degrades, gathered-into filters it) · restore · destroy the target (row cascades) · trash/restore the source thought · two-device (rows follow the winning body — free coherence, §2d) · **a mixed-sentence thought ("see `[[fire doodle]]` for the order") through the pull and the `[[` picker** — so the stored-face gap (Open decision #1) is seen on paper, not felt later.
- **Proofs:** reference round-trips · not-self + unique refused · cascade on destroy · the "from must be text" app-guard attacked and holds · export includes reference + the completeness proof passes.

### G2 — the editor: the `[[` gesture → ◆ Gather-Checkpoint B
- A tiptap **custom node** (mention-style) + a **suggestion** on `[[`: a search-as-you-type picker over `search_tsv` (post-D-088 = includes bodies). Pick a bit → the node inserts, carrying `data-ref="<id>"` **and the target's current full face as its text** (the cache — Open decision #1; display truncates to ~30 chars, but the **stored** text is full so search matches past the cap), so labels/search read naturally from the moment it's typed. Survives the `getHTML()` round-trip (proper `parseHTML`/`renderHTML`).
- **Derive-on-save (reconcile):** the editor knows the referenced ids; on save it hands `{body, refIds}` to the one write door, which makes `reference` match — insert new, delete removed, **skip ids whose bit no longer exists** (the FK would reject a dangling target). App-guard: the source must be a text bit.
- Cross-bit paste of a chip creating a reference on save is **intended** (say so).
- **Checkpoint B feel:** the gesture on Daylight (`[[` is typeable; a toolbar gather-button is a thumb-test, not a paper decision); tap-a-chip behavior; that gathering places nothing.

### G3 — the "gathered into" surface + chip-aware rendering → ◆ Gather-Checkpoint C
- **Chip-aware render:** bodies currently render via `dangerouslySetInnerHTML` (static). Replace with a render that swaps each `data-ref` element for a live chip component (current face + link), everywhere a body shows (bit page, board card). Faces batched (one lookup for all ids in view). **The chip truncates its shown face to a sensible cap (~30 chars + "…"), full text on hover** — keeps inline writing readable; the id + resolved face underneath are untouched (display-only).
- **Degradation:** a chip whose target is trashed shows a muted "(removed)" (owner-only; revisit reveal-existence at sharing, finding #8); a chip whose target was destroyed (orphan id left in the HTML until next edit) renders the same, and the next save drops the dead id.
- **The "gathered into" list** on a bit's page: read `reference where to_bit_id = me`, filter live sources, show each source's face, click to navigate. **Reconcile-on-read** here (finding #4 mitigation).
- **Lazy cache refresh (Open decision #1) — no fan-out.** A chip re-resolves its cached text when its note is next **saved or its page viewed** (a single-note reconcile-on-read). Renaming a bit rewrites **nothing** elsewhere; referencing notes self-heal on next touch. Proof: rename a gathered bit → the bit page shows the new name immediately (live); an untouched referencing note's pull-label shows the old name until it's opened, then self-heals.
- **Checkpoint C acceptance:** standing on a doodle, its page shows "gathered into: [the equanimity thought]"; open that thought and the chip shows the doodle's face and links back; delete the chip, save, and the doodle's "gathered into" empties.

### Deferred with the graph (preserved, not lost)
- **The graph is one graph with edge *layers*, not a references-only swap** (finding #2, BLOCKING for graph): reference edges primary, tag + board edges as toggleable layers, off-by-default TBD; default lens (local vs global) is the open question to resume on. A references-only graph would be near-empty on day one and would hide orphans. This is the first thing to reload when graph resumes.

---

## Model-safety gates (run at G1, re-checked each stage)
1. Invariants named (I-Ref). 2. Trace a reference through create · edit · remove-chip · rename-target · un-place · trash · restore · destroy — no blank cells. 3. Lowest layer: not-self + unique + FK-cascade in the DB; "from is text" in the one door (app, by the single-trigger rule) with a proof. 4. One source of truth: the **body**; rows are its derived index, never authored. 5. End-to-end proofs: reference round-trip · reconcile-on-save (add/remove/skip-dead) · cascade · export completeness · the two-write window's reconcile-on-read.

## Edge cases thought through (the "anything else")
- **Dead target id left in body HTML** after a destroy → render degrades; derive-on-save skips it (FK-safe). *Handled.*
- **Twice-mentioned** target → one row (unique); both chips render. *Handled.*
- **Cross-paste** of a chip → a real reference on save. *Intended.*
- **Removal is only via the chip** (delete + save) — no separate act, traceless. *Confirmed.*
- **Cycles** (A gathers B gathers A) → safe; chips are pointers, not live content. *Recorded, load-bearing.*
- **Pure-chip note** → face resolves live (never empty); not searchable by chip words in v1. *Flagged decision.*
- **Two-write save window** → reconcile-on-read + retry; never a permanent silent disagreement. *Mitigated.*
- **Gathering ≠ placing**, **reference ≠ connector**, **doodle needs words to be gatherable.** *All noted.*

## Deferred / not v1
The **graph** (with the layers-not-swap finding) · **live transclusion / inline gathered content** (would reintroduce cycles) · **in-place editing** of a gathered bit from the chip · **peek popover** (navigate v1) · **canvas gatheredness** badges · **board-gathering** (target-pair door named) · **create-a-new-bit from `[[`** (v1 gathers existing bits only) · **active rename-propagation** (eagerly rewrite referencing notes' cached labels on rename) — parked; the lazy cache self-heals on touch, and the fan-out body-rewrites aren't worth the risk unless the staleness ever genuinely annoys · **storage format for word-forward writing (Markdown vs HTML vs JSON)** — Markdown is the portable, Obsidian-native option (`[[ ]]` is native there) and the natural home for long-form notes, but it's a real switch: migrate existing bodies · rework the generated **face/search** columns (they strip HTML today) · a reliable tiptap↔Markdown round-trip. **Re-entry: decide it *with* document mode (A1/E)**, where word-forward writing actually lives; gather is built format-agnostic so it carries over either way.
