# The composition, re-derived — base spec

> ## STATUS · 2026-09-01 · 🟠 WORKING — the base entity, bottom-up, awaiting the owner's answers to §9
> **What this is:** the owner-commissioned re-derivation: *"what is a composition, mechanically — conceptually, technically, all inputs, outputs, cases — the base needs to be functional and sensible before added features."* Supersedes the bit-inherited answers; nothing is carried over unexamined.
> **Relation to other docs:** `composition-surface-spec.md` = the CAPABILITY layer (blocks, Notion-feel) that builds ON this base later · `note-storage-audit.md` = the evidence this responds to · `convergent-surfaces-overview.md` §00 = the layer map.
> **The gate:** §9's questions answered by the owner → this doc goes 🟢 → enactment (the migration) in the code window's lane.

---

## 1 · The model after the split

```
MATERIAL     bit ........... what you caught. tags · source · can be loose. UNTOUCHED by this change.
SURFACES     board ......... material arranged in space        (canvas form)
             composition ... material woven into writing       (document form)
THE ACT      bring material onto a surface — PLACED (space) or GATHERED (flow)
THE LINKS    surface ↔ surface — always a door, never exploded contents; one mechanism
CROSS-CUT    tags · folders · find · states — on everything, carried by the thing itself
```

## 2 · The composition, defined

**Conceptually:** a surface where you weave material into writing — one made whole with a throughline. Born by composing (never by conversion — the D-121 hard line survives: an entity's kind is fixed at birth). A peer of the board; never material; never "loose."

**Technically (the proposed shape — Q1):** a row in ONE `surface` table shared with boards:

| column | boards | compositions | note |
|---|---|---|---|
| `form` | `'canvas'` | `'document'` | NEW — the marker; CHECK-constrained |
| `title` | ✅ | ✅ nullable (Q3) | born-untitled stays legal |
| `body` | null | ✅ the writing (HTML) | NEW column; null for canvas |
| `visibility` | private | **private** | the public-bit default dies here |
| `group_id` · `pinned_at` · state (live/archived/trashed) · timestamps | ✅ | ✅ inherited | the board's proven machinery, incl. resting-state D-127 |
| `source_id` | — | **❌ dropped (Q2)** | a made thing's provenance is its gathered material |
| `search_tsv` | title | title + body | extend the generated column by form |
| face · loose-ness · bit.kind | — | **gone** | face → title + derived preview; loose can't apply; `kind` dropped from `bit` entirely |

## 3 · The relations, reshaped

- **`placement`** — host: a **canvas-form surface only** (Q8). Target: `target_bit_id` | `target_surface_id` (CHECK one non-null). One column change covers bits-on-boards ✅, boards-on-boards ✅, **compositions-on-boards** ✅ — three cases, one shape.
- **`reference`** (gather + links) — `from_surface_id` (the writing; document-form) → `to_bit_id` | `to_surface_id` (CHECK one non-null). Delivers comp→bit ✅ · **comp→comp** ✅ · **comp→board** ✅ (A15 dissolves) — one mechanism, uniformly backlinkable, graph-readable.
- **`tag_application`** — `target_bit_id` | `target_surface_id`. Compositions keep their tags through the move.
- **travel/history** — placements of former note-rows repoint to surface ids; history preserved (I-L2 holds).
- **the chip** — serialized `<span data-ref>` gains a target-kind attr (or reconcile resolves by lookup); `extractRefIds` extended, not replaced. *(Enactment detail; flagged so it isn't forgotten.)*

## 4 · Lifecycle — every act traced (gate #2: no blank cells)

| act | what happens | notes |
|---|---|---|
| **create** | `/write` (born on first content, title held until birth) · board paste-text (Q7) · "start a composition from this board"? (future door) | born private, unlisted until it has content |
| **edit** | body via the editor; 350ms debounce + save-guard; reconcile references on save | unchanged mechanics |
| **title / rename** | inline, nullable | preview = opening words when untitled |
| **tag / untag · folder · star** | as today | polymorphic, survives the move |
| **place on a board** | a placement (surface-target); appears per Q4's answer | un-place stamps left_at; travel kept |
| **link into another composition** | a reference (surface-target) via `[[` or the drawer (Q5) | backlink appears on its page |
| **archive** | the board/resting-state model (D-127) | inherited, consistent at last |
| **trash → restore** | state flip; hidden by render rules; restore returns it whole (star intact) | the D-127 symmetry, now uniform |
| **destroy** | takes its references (both directions), placements, tags — cascade | the evaporate door (Q6) is the only automatic destroy |
| **export** | the surface table joins `/api/export` in the same migration — **I-G1 lockstep, non-negotiable** | |

## 5 · Doors in / doors out
**In:** `/write` · paste-text on a board (Q7) · (future: templates · "compose from this board").
**Out:** its own page (`/note/[id]` → renamed route) · listed beside boards (home, its room) · placed on boards · linked from other compositions · found (title+body) · the pull via tags · export · *(future: publish · PDF — the output-artifact thread, untouched here)*.

## 6 · What it sheds from bit-hood — each one CHOSEN
public-default → **private** · loose/inbox membership → **never** · gatherable-as-material → **linkable-as-surface instead** (the I-K2 line becomes enforceable: `reference.to_bit_id` can only be material now) · the computed face → title+preview · `bit.kind` → **dropped entirely; the bit table returns to pure material**.

## 7 · Invariants touched
- **I-K1** (kind fixed at birth) → restated: *an entity's table and form are fixed at birth; no conversion bit↔surface, canvas↔document*.
- **I-K2** (gather takes material) → **finally enforceable at the DB**: material = the bit table; linking surfaces is the separate `to_surface_id` arm.
- **I-N1 / loose** → compositions exit its scope by construction.
- **I-G1** (export completeness) → surface table in the same migration.
- **I-L1/L2** (placement uniqueness/durability) → carried to surface targets.
- NEW: *a document-form surface has a body; a canvas-form surface does not* (CHECK).

## 8 · Migration sketch (enactment — the code window's lane, house method: backup → throwaway-proven → owner's go → cloud)
1. `surface` table (or extend `board`) + form + body · 2. copy `kind='note'` rows over · 3. repoint placements / references / tags / travel · 4. delete note-rows from `bit`; drop `kind` · 5. sweep the ~30 app files (mostly deletions) · 6. views + export + search regenerated · 7. proofs re-run (`verification/`).

## 9 · ⚑ THE QUESTIONS — the owner answers these, then the base is settled
*(each with options + Claude's lean 🔵 — leans are inputs, not defaults)*

| # | question | options | lean |
|---|---|---|---|
| **Q1** | **One `surface` table (form: canvas/document), or a separate composition table?** | one / two | **one** — near-identical columns; the link fabric unifies; the code's union type already says it |
| **Q2** | **Does a composition have a `source`?** | keep · optional · drop | **drop** — a made thing's "from" is its gathered material; citing a source inline is a *link*, richer than a column |
| **Q3** | **Can a composition be untitled?** | yes (preview stands in) · no (title required) | **yes** — born-on-first-content is good; titles shouldn't gate writing |
| **Q4** | **On a board, a composition appears as…** | a) a door (title card — today) · b) a **window** (title + opening words, resizable) · c) owner picks per placement | **b** — your stitching scene showed the closed door fails the board's whole job |
| **Q5** | **What does `[[` offer now?** | a) bits only; surfaces linked another way · b) **one picker, sectioned** (material first, then surfaces), chips visually distinct | **b** — one gesture; the section break teaches the material/surface line |
| **Q6** | **Keep the evaporate rule?** (a board-born composition that ends empty un-exists) | keep · drop | **keep** — but it remains the app's only silent destroy; worth one confirm at enactment |
| **Q7** | **Paste-text on a board births a…?** | composition (today's behavior) · a text **bit** | ⚪ genuinely unsure — pasted text is *caught*, which smells like material; but today's flow makes notes. **Talk through** |
| **Q8** | **Can anything be placed ON a document-form surface?** | no (flow only) · yes | **no for the base** — flow holds things by gather; leaves the freeform door for later without blocking it |
| **Q9** | **The words** — "composition"? the route `/note`? | — | the naming session is now **unavoidable before the UI ships**; this spec uses placeholders throughout |
