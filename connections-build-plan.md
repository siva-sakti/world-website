# Connections — Build Plan

> ## ⏸ PICK UP HERE (paused 2026-07-24 — owner tired; do NOT build yet)
> The design conversation went deep and good; this doc now holds it. **Resume at the ONE open decision** in §"Stage 5 — the graph": *tags & boards as optional graph layers, or fully out?* Resolve that, then I write **Stage 1 (the model, on paper)** for Checkpoint A. **Nothing touches the cloud schema until you sign off at A.**
>
> **Also settled today (unrelated to the pause):** the app is **safe to start using for real content now** — connections/graph are purely *additive* (a new table + a read-only view; existing notes/boards/tags are never rewritten), your data is RLS-locked to you + exportable, and there's no "delete forever" anywhere. Go put real notes in.
>
> **The complete verifier review travels with this plan: `connections-review-and-resumption-notes.md` (D-098)** — the ranked findings (3 blocking: dormant-table fate · graph union-vs-swap, i.e. the same open decision above · export/I-G1), the five revision asks and which landed, all open questions, owner rulings so far (graph = **read-only**; verb = **gather**), and the locked resumption procedure. Resume with both docs open.

---

## The vision (the WHY — leads the doc, per project convention)

The owner can lay out one topic in space beautifully (that's the board — their strength), but **struggles with the Obsidian move**: collecting fragments over time and *seeing a web emerge*. The tool's job is to be the part of their thinking that doesn't come naturally.

The discovery that reframes everything: **the owner connects at *thinking-time*, not capture-time — text-first, topic-first.** They catch a doodle un-tagged; the connection comes later, when they sit with a topic and *gather* the bits that belong to it. So a link, for them, isn't "point bit at bit" — it's **"write a thought, and gather bits into it."**

> *"links are when you're thinking about a topic and there's idea connection, which is why it's usually text-first."* — owner

**What the feature is for:** weave ideas together *while thinking* · the shape assembles itself · **organization you never do by hand.** *(This must be the plan's opening framing, not the mechanism — earlier draft opened with mechanism; reviewer §1 was right.)*

---

## The model we landed on

**Three ways ideas connect — each with a home** (owner's own carve):

| Way | | Home |
|---|---|---|
| **Collect** — a set that belongs together | spatial | a **board** — ✅ have it |
| **Flow** — this leads to that, a sequence | sequential | **arrows** (connectors) — coming |
| **Compose** — a written thought that gathers bits | verbal | **gather-into-text** — 🔨 the missing one, this build |

**Text is the organizing function.** Only text (and boards) can *hold* other bits; doodles/images/bookmarks are **atoms** — they get gathered, they can't gather. Relatedness always takes one of the three forms above — there is **no "link in the void"** (so no separate undirected-association feature is needed).

---

## The feature: **gather a bit into a thought**

In a text bit, type **`[[`** → a picker lists your bits by their **face** → type to filter, or tap a thumbnail → pick → it lands **inline** (a small thumbnail for a doodle/photo, a chip for a note/bookmark; tap to open the full thing). It's stored as a **`reference`**, and the gathered bit shows **"gathered into: [thought]."** These references become the primary graph.

**Naming — LOCKED** *(reviewer §2, verified against lexicon):*
- verb = **gather** · record = **`reference`** · surface = **"gathered into"**
- **Do not use:** *pull / pull-in* (collides with **the pull**, a ruled word) · *embed* · *backlink* (lexicon-retired). *(Lexicon pass: confirm "gather into a thought" reads distinct from collection-mode's "a gathered pile.")*

**Not in v1:** two-way/undirected links · arrows-as-links · live transclusion (v1 renders face + thumbnail, not the source's live content) · editing a gathered bit in place · gathering into a non-text bit.

**Success criteria (what "good" feels like — reviewer §1):**
- Gathering a doodle into a thought takes **seconds** and feels like **writing, not filing.**
- The tie **shows in the graph with no further act.**

---

## The reopened ruling — this was FORESEEN (not a panic reversal)

`agreements.md` §6 says *"no bit↔bit fact is ever stored"* — but it **parked "the pairwise link (§6)"** (A2) with a *named re-entry* (philosophy: *"a direct thread… may come someday — the first time I genuinely miss it. I haven't yet"*) and **reserved a dormant table** for it. So the §6 *door* — a stored bit↔bit fact — was foreseen, and the owner has now reached for it. **But this reopening is owner-authority-ahead-of-evidence** (the D-087 title precedent), *not* the §6 evidence gate firing in real use — the record must say so honestly.

**⚠ Corrected by the review (finding #1, BLOCKING):** that dormant table was reserved for A2's **symmetric** pair-tie; `reference` here is **directed** (thought → bit) — a *different* relationship. So `reference` is most likely a **new table**, and the **dormant table's fate is a separate Stage-1 ruling** (keep it waiting for A2, or retire it because references cover the want — silence = drift). Do **not** conflate them; any earlier "give the dormant slot the reference shape" wording is superseded.

**DRAFT supersession of §6** *(owner approves/edits at Checkpoint A):*
> *A bit may be **gathered into** a text bit — a stored, directional reference (thought → bit). This is the one bit↔bit fact the model keeps, reserved from the start (the dormant §6 slot). Relatedness by shared tag or shared board remains as-is; this adds **deliberate, composed** connection on top. The graph is built on these references.*

**PHILOSOPHY EDIT — owner writes** *(reviewer §5; philosophy is in the owner's voice):* the line *"a direct thread… I haven't yet"* is outgrown. Only you can write its replacement — the gather model, in your words.

---

## Technical plan — Stages + Checkpoints

### The record — `reference` (likely a NEW table; dormant §6 slot's fate ruled separately, finding #1)
```sql
-- reference is DIRECTED (thought → bit) ≠ the symmetric dormant §6 slot (A2). New table.
reference (
  id          uuid primary key default gen_random_uuid(),
  from_bit_id uuid not null references bit(id) on delete cascade,  -- the text thought
  to_bit_id   uuid not null references bit(id) on delete cascade,  -- the gathered bit
  created_at  timestamptz not null default now(),
  constraint reference_not_self check (from_bit_id <> to_bit_id),
  constraint reference_once     unique (from_bit_id, to_bit_id)     -- one edge per pair
)
```
- **Source of truth = the tiptap body.** On save, derive the referenced `to_bit_id`s from the body's `bitRef` nodes and reconcile `reference` rows (the row is a *derived index* that makes "gathered into" + the graph queryable; body stays truth → one-source-of-truth gate holds).
- **Trash** hides (reads filter `deleted_at`), never destroys; restore brings back. **Hard-delete** cascades. **RLS** owner-scoped (D-094).

### Stage 1 — Define the model, on paper → ◆ Checkpoint A
Write: the `reference` table (new; dormant §6 slot's fate ruled separately — finding #1) · **rule reference's family** (an *act*, or a *derived artifact*? — rows derive from the body, so arguably not an act; determines export + the nine-kinds story — review §6) · **add `reference` to `/export` + the I-G1 completeness proof** (blocking finding #3) · invariants (only *text* gathers [**lean app-guard in the one door** — the strategy §4.7 "exactly one trigger" house rule beats a 2nd trigger; finding #5] · one edge per pair · trash hides not destroys · derived-from-body · feeds render+"gathered into"+graph) · trace 2–3 real owner scenes (equanimity gathers doodle+quote+note; same doodle into "impermanence" → bridge; trash the doodle) · the drafted §6 supersession + philosophy note · the proofs (`verification/` extension).
**Accept-when:** owner reads the model + the §6 sentence + the traced scenes and signs off. **No schema applied to cloud yet.**

### Stage 2 — Data layer (`src/lib/db/references.ts`)
`syncReferences(fromBitId, toBitIds[])` (reconcile on save) · `getGatheredInto(bitId)` ("gathered into" surface) · `pickBits(q?)` (the `[[` picker's data — recent by face / search_tsv; image thumbs) · `getReferenceGraph()`.
**Accept-when:** `test-port` extension green — create a reference · "gathered into" resolves · trash the to_bit → hidden, restore → back · RLS 2nd-account sees zero references.

### Stage 3 — The editor (tiptap — the meaty part) → ◆ Checkpoint B
`BitRef` node (inline, atom, attr `bitId`) · the `[[` picker (@tiptap/suggestion → `pickBits` → insert node, never type a title) · inline render (thumbnail/chip from a server-loaded `referencedBits` map; tap → `/bit/[id]`) · sync-on-save.
**Accept-when (owner):** on the live app, `[[` in a note opens the picker; picking a doodle drops its thumbnail inline in ≤2 taps; tapping it opens the doodle; it feels like *writing, not filing.*

### Stage 4 — The "gathered into" surface
`/bit/[id]` gains a **"gathered into"** section (chips/thumbnails of the thoughts, linking through). Empty state handled. *(Later: the same on the selected-bit tray on a board — for in-canvas wandering.)*
**Accept-when:** a bit's page shows the thoughts it's gathered into, and each links through.

### Stage 5 — The graph → ◆ Checkpoint C
**RULED TODAY: the graph is READ-ONLY in v1** — you look, see where things tie, click a dot to go there. **No tying, tagging, or arranging from the graph.** *(Record with the D-entry.)*
- **Nodes = bits. Edges = references (threads).** Text-thoughts become the natural hubs; **bridge-bits** (gathered into 2+ thoughts) stand out.
- **Default lens: local-first** (a bit's neighborhood / where you're standing); whole-web available.
- **⚠ OPEN DECISION — resolve first when we resume:** **layers vs. swap.**
  - Owner's *current philosophy* says the graph is *"bits and boards joined through the words and places they share"* → argues for **layers**: threads **bold** (default) + shared-boards + shared-words as **optional togglable layers, off/faint by default.** Never empty (a swap = an empty graph on day one, since references start at zero); more depth on demand.
  - Owner's in-conversation lean: *"tags stay OUT."*
  - **Reconciliation to confirm with owner:** threads are the star; tags/boards available as toggles, **off by default.** (My lean.) **← this is the decision to pick up at.**
- Interaction: zoom/pan · hover→label (fade on zoom) · hover-highlight neighbors · click→open. *(react-force-graph-2d already wired for the tag version — reuse the shell + swap the data source.)*
**Accept-when (owner):** standing on the equanimity thought, the local view shows the doodle, the quote, and the note **one hop away**; the doodle gathered into two thoughts renders as a **bridge**; an unconnected bit is still visible as an **orphan.**

---

## Model-safety gates (run before Stage 2 code)
1. **Invariants named** (Stage 1). 2. **Every related record traced** — reference create · body-edit re-sync · to_bit + from_bit trash/restore/destroy. 3. **Lowest-layer enforcement** — DB constraints + (trigger?) + RLS; app only orchestrates. 4. **One source of truth** — body is truth, rows derived; face/thumb read from the existing `bit`. 5. **Flow proven end-to-end** — `verification/` + `test-port` extensions.

## Open decisions when we resume (in order)
1. **⚠ Stage 5: tags/boards as optional layers, or fully out?** ← *first.* (My lean: optional, off by default.)
2. Technical: trigger vs app-guard for "only text gathers" · picker thumbnail scope · `BitRef` stores `bitId`-only vs `+cached face`.
3. **Philosophy edit** — owner writes the new gather/thread line (replaces "I haven't yet").
4. **A real scene from the owner's week** to trace Stage 1 against (else use equanimity + the lake doodle and owner corrects).

## Where we are
Design closed enough to build. **PAUSED before Stage 1** (owner tired, 2026-07-24). Next session: resolve open-decision #1, then I write Stage 1 (the model on paper) → Checkpoint A; **no code until owner sign-off.** Meanwhile the owner uses the live app for real content — safe.

*(Fuller design narrative + visuals: the "how ideas connect" thinking-canvas artifact.)*
