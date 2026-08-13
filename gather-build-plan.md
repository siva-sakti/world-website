# Gather — the complete plan (connect a bit into a thought, as you write)

**Status:** **G1 (the data layer) is DONE and applied to the cloud** — the `reference` table exists, empty (D-101). What's left is the *build*: **G2** (the `[[` gesture) and **G3** (chip rendering · peek · "gathered into"). **No further schema change** — the table's already there.
**Reviewed:** an advisor pass folded in (findings cited inline); the **peek** ruling (2026-07-28) supersedes the old navigate lean.

---

## Part 1 — The concept (in plain language)

**What it is:** while you're writing a note, you reach for another bit you made — a quote, a doodle, a note — and pull it into your sentence *without leaving the flow of writing*. The tie is born from the sentence. Later, standing on that pulled-in bit, you see every thought that reached for it — for free.

**Success feel:** gathering a doodle into a thought takes seconds and feels like **writing, not filing.**

**The model, and the nuances we worked through:**

- **You gather by writing.** You type `[[` inside a **text note**, a picker opens, you pick a bit, and a **chip** drops into your sentence (*"see [fire doodle] for the order"*). The link physically lives in your words.
- **One tie, two ends.** *Forward* (in your writing): the chip is *"I reached for this."* *Backward* (on that bit's own page): a **"gathered into"** list — every thought that reached for it. You author it once, by writing; the backward view is **free**.
- **Tap a chip = PEEK, never navigate.** A small preview shows the pulled-in bit (its name + a glimpse of its content) *without leaving your sentence* — you're calling a thought in, not going to it. A tiny **"open →"** navigates if you truly want to. *(Ruled 2026-07-28; supersedes navigate-v1.)*
- **A thread through content, not space.** A gather tie does **not** put the two bits on the same board or connect them visually on a canvas. It lives in the writing + the "gathered into" page. This is a *third, distinct* way things relate:
  - **gather** = *"I tied this on purpose, in my writing"* (deliberate, semantic)
  - **tags** = *"these share a topic"* (topical)
  - **boards** = *"these are arranged together in space"* (spatial)
  - *(and the parked canvas **arrow** = arrangement on one board — a fourth, separate thing.)*
- **Only *writing* gathers; anything can *be* gathered.** The source is always a text note (that's where `[[` is typed); the target can be a note, image, or doodle. A doodle can't gather, but it can be gathered — so **a doodle needs a caption** to show up in the picker and to read as a chip.
- **The bit's page is the relationship hub.** Every bit already has a page (`/bit/[id]`). It shows the bit, its tags, its source, the boards it's on — and now **"gathered into."** One place to see all of a bit's threads.
- **v1 shows one hop.** "Gathered into" = who links *directly* here. The *full web* (A→B→C) is the **graph**, deferred.
- **Removing a link is just editing.** Delete the chip from your writing and save; the tie falls away, traceless — like un-tagging. There's no separate "delete a reference" act.
- **Cycles are safe.** A can gather B can gather A — harmless, because a chip is a **pointer/preview**, never embedded live content. Nothing recurses. (This is *why* peek, not inline-transclusion.)

---

## Part 2 — The feature list (*scan this for anything missing*)

- **G-F1.** Open the picker **two ways** → a **search-as-you-type picker** over all your bits (matches names + bodies) → pick one → a **chip** inserts at the cursor:
  - a **toolbar "⟢ gather" button** — the **primary, touch/stylus path** (works by thumb on the Daylight, where `[[` behind the symbols layer would be a mode-switch = *filing, not writing*);
  - typing **`[[`** — the keyboard shortcut for typists.
  *(Review, 2026-08-01: the gather gesture on the Daylight is a first-class design question, not `[[`-and-move-on; proven by the owner's thumb at the G2 checkpoint.)*
- **G-F2.** The chip shows the target's **name/face**, truncated ~30 chars for display; the **full name is stored** in the chip so search matches past the cap.
- **G-F3.** Tap a chip → a **PEEK** (popover preview: the target's name + a glimpse — text snippet · image · doodle) with an **"open →"**; tap-away dismisses. (Hover peeks on desktop.)
- **G-F4.** The target bit's page shows **"gathered into"** — every note that links to it, each clickable.
- **G-F5.** Delete the chip + save → the link is gone (traceless).
- **G-F6.** **Reconcile-on-save:** saving a note makes its `reference` rows match the chips in its body (add new · drop removed · skip dead targets).
- **G-F7.** **Reconcile-on-read:** a bit's page recomputes "gathered into" defensively, so a failed save-reconcile self-corrects on next open (never a permanent silent disagreement).
- **G-F8.** **Degradation:** a chip whose target is *trashed* shows a muted **"(removed)"**; a *destroyed* target's leftover id renders the same and is dropped on the note's next save.
- **G-F9.** **Lazy self-heal, no fan-out:** the chip's cached name re-resolves when its note is next saved or viewed. Renaming a target rewrites **nothing** elsewhere; referencing notes catch up on next touch.
- **G-F10.** **Export includes `reference`** (already done — I-G1).
- **G-F11.** A note is **findable by what it references** (the cached target name is in the note's search text) — the Obsidian feel.
- **G-F12.** A wordless doodle isn't gatherable until it has a caption (its face is what the picker searches + the chip shows).

---

## Part 3 — Decisions

**Settled / ruled:**
1. **Directional** — writing → target; forward + backward are one tie.
2. **Born from writing** — `[[` in a text note; the source is always text (app-guarded).
3. **Target = any bit.**
4. **The chip is a pointer** — shows a face, links/peeks; never embeds content (keeps cycles safe).
5. **Tap = PEEK, not navigate** *(2026-07-28)* — stay in the flow; "open →" to leave.
6. **The stored-face cache — a knowing carve to Principle 9.** To make a note *findable by what it references*, the chip caches the target's name as its visible text. So a rename doesn't update everywhere instantly — live surfaces are always current, but an **untouched** note's list-label lags until next touch, then self-heals. Eventual-consistency, accepted. *(The reviewer killed the alternative — rewriting every referencing note on rename — as worse.)*
7. **Gathering places nothing** — the target isn't added to any board; the tie lives in the text.
8. **v1 = one hop** — direct links both ways; the graph is deferred.

**Remaining (small, feel-calls at the checkpoints):**
- **Peek presentation** — popover-by-the-chip (lean) vs a fixed corner panel.
- **Gatheredness on canvas cards** ("part of 3 thoughts") — page-only in v1 (lean).

---

## Part 4 — Technical

### The data layer (DONE, on cloud)
```sql
create table reference (
  id          uuid primary key default gen_random_uuid(),
  from_bit_id uuid not null references bit(id) on delete cascade,  -- the writing (a text note — app-guarded)
  to_bit_id   uuid not null references bit(id) on delete cascade,  -- the bit reached for (any kind)
  owner_id    uuid not null default auth.uid(),                    -- per-row ownership (D-107)
  created_at  timestamptz not null default now(),
  constraint reference_not_self check (from_bit_id <> to_bit_id),
  constraint reference_once     unique (from_bit_id, to_bit_id)     -- one tie per pair
);
-- indexed both ways (from = forward, to = "gathered into"); RLS owner-scoped.
```
`reference` is a **derived index** of the ties expressed in bodies — never authored directly; the **body is the source of truth**. That's why removal is traceless and there's no "delete a reference" act.

### G2 — the editor (the `[[` gesture)
- **A tiptap custom node** (mention-style) + a **suggestion** triggered on `[[`: a search picker over your bits (uses `search_tsv`, which includes bodies post-D-088). Pick a bit → the node inserts, carrying **`data-ref="<id>"`** (the truth) **and the target's current name as its visible text** (the cache — G-F2/F11). Must survive the `getHTML()` round-trip (proper `parseHTML`/`renderHTML`).
- **Reconcile-on-save:** the editor already knows the referenced ids; on save it hands `{ body, refIds }` to **one write door** (`lib/db/references`) that makes `reference` match — insert new, delete removed, **skip ids whose bit no longer exists** (the FK would reject a dangling target). **App-guard:** the source must be a text bit (the single-trigger rule — enforced in this one door, with a proof).
- Cross-bit paste of a chip → a real reference on save. **Intended.**

### G3 — rendering, peek, "gathered into"
- **Chip-aware rendering.** Bodies render today via static `dangerouslySetInnerHTML`. Replace with a render that swaps each `data-ref` element for a **live chip component** (current name + tap-to-peek), everywhere a body shows (bit page, board card). Faces **batched** — one lookup for all ids in view.
- **The peek** (G-F3): tapping a chip opens a **popover** that fetches + previews the target (name + a content glimpse — text snippet · signed-thumb image · mini doodle) with an **"open →"**. On-demand, one at a time — a preview, not transclusion (cycle-safe).
- **"Gathered into"** (G-F4): on a bit's page, read `reference where to_bit_id = me`, filter live sources, show each source's name, click to navigate. **Reconcile-on-read** here (G-F7).
- **Lazy cache refresh** (G-F9): a chip re-resolves its cached text on the note's next save/view — no rename fan-out.
- **Degradation** (G-F8): trashed target → muted "(removed)"; destroyed target's dead id → same, dropped on next save.

### Files
- **New:** `lib/db/references.ts` (reconcile-on-save · list gathered-into · list-forward), the tiptap **node + suggestion**, the **chip component + peek popover**.
- **Grown:** the bit page (`/bit/[id]`) gains "gathered into"; the body renderers (bit page + card) become chip-aware; the intake/workspace editor mounts the `[[` extension.
- **Unchanged:** the schema (`reference` exists); export (already lists it).

### Risks (named)
- **The two-write save window** (body save → reference reconcile): if the reconcile fails, "gathered into" lags until the next save — **mitigated by reconcile-on-read + retry-on-open.** Never a permanent silent disagreement.
- **Cache staleness** (a renamed target's old name on untouched notes) — **accepted**, self-heals on touch (decision 6).
- **tiptap node round-trip** — the node must serialize/parse through `getHTML()` cleanly (a real but standard tiptap concern; proven at G2).
- **Peek fetch** — one extra read when you tap a chip; cheap, and only on demand.

---

## Part 5 — Model-safety gates
1. **Invariants (I-Ref):** directed · one row per (from,to) · from is a text bit (app-guarded) · rows **derived** from the body, never authored · removal traceless · cascade on destroy · in export · the chip caches the target face (the P9 carve).
2. **Trace every state:** gather · edit/remove-chip · rename-target (chip re-faces live; cache lazily) · trash-target (chip "(removed)", gathered-into filters it) · restore · destroy-target (row cascades) · trash/restore the source note · two-device (rows follow the winning body).
3. **Lowest layer:** not-self + unique + FK-cascade in the DB; "from is text" in the one write door (with a proof).
4. **One source of truth:** the **body**; `reference` rows are its derived index.
5. **Prove:** reference round-trip · reconcile-on-save (add/remove/skip-dead) · cascade · export completeness · the two-write reconcile-on-read.

## Part 6 — Stages (each: build → `pnpm build` → deploy → your feel-test)
- **G2** — the `[[` picker + chip node + reconcile-on-save → *Checkpoint: type `[[`, pick, save; a `reference` row appears.*
- **G3** — chip-aware rendering + the **peek** popover + "gathered into" + lazy refresh → *Checkpoint: stand on a doodle → "gathered into: [the thought]"; open the thought → the chip peeks the doodle; delete the chip + save → the doodle's "gathered into" empties.*

## Part 7 — Edge cases (thought through)
Dead id left in HTML after destroy → renders muted, dropped on next save · twice-mentioned target → one row, both chips render · cross-paste → a real reference (intended) · cycles → safe (pointers/peek) · pure-chip note → face resolves live, not searchable by chip words in v1 · doodle needs words to be gatherable.

## Review folded (2026-08-01) — the product-strategy pass
A cross-window review stress-tested *whether to build this*, not for bugs. Verdict: build G2+G3, but treat two things as **gates, not details**:
- **The habit gate (the headline risk).** Gather serves a mode that isn't natural to a *spatial* thinker — its whole payoff (the "gathered into" web, the graph) renders only what the *habit* creates. So: **build the cheap core (G2+G3, no schema change), live in it for real weeks, and gate the GRAPH strictly on evidence — the owner's own `reference` table proving they gather habitually.** Never build the graph on faith; the deferred-graph is the safety valve, kept deferred until use earns it. *(The honest question is the owner's to sit with: reach for `[[` while writing, or arrange spatially?)*
- **The Daylight-gesture gate.** `[[` is a keyboard gesture; on the stylus/touch Daylight it's a mode-switch = filing, not writing = fails the thesis. **Folded (G-F1): a first-class toolbar "⟢ gather" button** (touch/stylus) + `[[` (keyboard). Proven fluid on the real device at the G2 checkpoint; willing to lead with the button.
- **gather vs tags — the one overload gut-check.** Distinct by granularity: a **tag** = "belongs to a topic"; a **gather** = "*this* bit belongs in *this* thought." Crisp on paper; owner confirms it doesn't feel redundant.
- **The integration to own before G3:** the chip must **render, peek, AND survive editing in ONE pipeline** — one tiptap node, one rendering definition, used by both the editable editor and the read-only render, so a static renderer and the editable body can't clobber each other on `/bit/[id]`.
- **Complexity verdict:** the reconcile machinery is *forced* by "the tie lives in your writing" + "gathered into," not gold-plating. Peek-over-navigate and lazy-self-heal-over-fan-out confirmed right.

## Part 8 — Deferred (named, not lost)
- **The graph is EVIDENCE-GATED (review):** don't build it until the owner's own `reference` table shows habitual gathering. It's one graph with edge *layers* — reference primary, tag/board as toggleable layers (a references-only graph would be near-empty + hide orphans) — the first thing to reload when graph resumes.
The **graph** (one graph with edge *layers* — reference primary, tag/board as toggleable layers; a references-only graph would be near-empty + hide orphans — the first thing to reload when graph resumes) · **live transclusion / inline content** (would reintroduce cycles) · **edit-a-target-from-the-chip** · **canvas gatheredness badges** · **board-gathering** (target-pair door named: `to_bit_id`/`to_board_id` + a CHECK, a small migration if it fires) · **create-a-new-bit from `[[`** (v1 gathers existing bits only) · **active rename-propagation** (the lazy self-heal replaces it) · **Markdown storage for word-forward writing** (decide *with* document mode; gather is built format-agnostic so it carries over).
