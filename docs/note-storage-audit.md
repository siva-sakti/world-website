# Audit — the composition is architecturally MATERIAL. Does that hold? (2026-09-01)

> ⭐ **REFRAMED by the owner, same day:** this is **not a storage question — it is a DATA-MODEL ARCHITECTURE question.** "Storage" (D-121's own *"invisible plumbing"*) was the minimizing word. In a relational system the table a thing lives in IS its architecture. The true statement: **the data model has ONE entity where the concept has TWO — a composition IS material, not filed beside it.**
>
> **Three verified proofs the architecture assigns material-behavior to the convergent surface:**
> 1. **Compositions default `visibility='public'`** (the atom's default, D-072) **while boards default `'private'`** — a composition is a whole room inheriting a scrap's exposure rule. Latent, not live (no publish act) — but the defaults encode the wrong identity, and publishing would make them real.
> 2. **A composition is gatherable AS material** — `reference.to_bit_id` is kind-unchecked; the ruled hard line "gather material, never a surface" is architecturally unenforceable.
> 3. **A composition is "loose"** — an unplaced essay satisfies the inbox's loose-material definition (I-N1), a scrap awaiting filing.
>
> **The ruling, restated in its true terms:** *does the data model get a second entity — **SURFACE**, architecturally distinct from **MATERIAL** — or does one entity keep playing both parts?* The table choice, the migration, the sweep are **enactment** of that ruling, not the ruling.

> ## STATUS · 🟠 WORKING — an evidence audit, verdict marked 🔵; the ruling is the owner's
> Commissioned by the owner: *"we were looking at notes as underground the same as bits — does that hold? Actually look at this."* Run against the merged codebase (post-media-merge).
> ⚠ **Corrects an earlier false claim:** Claude reported "5 occurrences in 3 files; a small seam." That count used a broken grep. The overview has been corrected.

## 1 · The evidence — the seam, actually counted

**~30 files in `src/` maintain the bit/note distinction in app code.** Heaviest: `home-surfaces.tsx` (20 touchpoints) · `use-create-doors.ts` (12) · `lib/db/bits.ts` (9, incl. a dedicated `listNotes()`) · search (8+7+6) · the drawer (kind-split `bits · notes · all`) · the graph · the outline · the desk. Structural markers, each verified:

| seam | where |
|---|---|
| home fetches notes **separately from bits** | `listNotes()` in `lib/db/bits.ts:454`, called by `page.tsx` |
| the bits room **filters notes out** | `bits/page.tsx:31 — filter(b.kind === "bit")` |
| the bit page **refuses to render a note** | `bit/[id]/page.tsx:34 — redirect to /note` |
| the drawer's **primary split is by kind** | `drawer.tsx:27` |
| a **union type already exists** | `surfaces.ts:9 — kind: "board" \| "note"` |
| the schema enforces **nothing** about noteness | `bit_kind_allowed check (kind in ('bit','note'))` — no rule that a note is text, or a surface, or anything |

## 2 · The honest reframe

**The app code is NOT lagging the concept — the app code is AHEAD of the storage.** The UI migrated to notes-as-surfaces across D-113→N1→N3→D-124; storage is the lone holdout, and **every one of those ~30 files is a bridge over the gap** — each an if-statement re-asserting what the database refuses to say. Two of those bridges have already produced bugs (the ★, the /write door). The other window's diagnosis stands: *a note is, structurally, a text bit wearing a label.*

**But the D-121 bet was real and paid out:** shared storage bought notes tags · folders · search · trash · export · gather **for free** at a time when building them twice would have been the mistake. The question is not "was it wrong" — it's "has it finished paying." The evidence above says: **yes, it has finished.** The free machinery is now all re-implemented as filters and branches anyway.

## 3 · 🔵 The finding that changes the shape of the decision

**The storage question and the links question converge on one answer.**

If notes move to live beside boards — one **surface** table, a `form` marker (`canvas` | `document`), a `body` for the document form — then gather's coupling (`reference`, today bit→bit) becomes **surface → (bit | surface)**. And that single shape delivers, in one mechanism:

| link the model wants | under one-surface-table |
|---|---|
| composition → bit (built today) | surface → bit ✅ same act |
| **composition → composition** (the Obsidian primitive, undecided) | surface → surface — **the same row type** |
| **composition → board** (parked A15) | surface → surface — **A15 dissolves; a board IS a surface** |

**The link fabric becomes uniform instead of three special cases.** This is the strongest argument that the migration target is already knowable — it isn't waiting on blocks, decks, or the Notion-feel question at all (blocks serialize into `body` either way).

## 4 · What actually gates the migration — ONE narrow ruling

Not flow/frame capability. Not the Notion session. Just: **do notes move into the board table (one `surface` table, `form: canvas|document`), or into their own table?** The column evidence leans hard to the first — a board's columns are a note's minus `body`/`source_id`, and `surfaces.ts` already declares the union the storage lacks. ⚪ **Owner rules.** *(Sub-question since ANSWERED: source dropped — owner 2026-09-01, base spec §9b.)*

## 5 · 🔵 Claude's updated recommendation

1. **Rule the one question in §4** — it's concept-sized, not migration-sized, and the layer-2 link rulings (comp→comp etc.) should be decided WITH it, since one answer serves both.
2. **Then the migration happens once, in the code window's lane**: backup → throwaway-proven → applied. The other window sized it honestly: the largest single change since the schema was born; a day or two done properly.
3. **Sequencing vs capabilities:** the doc-surface capability work (blocks etc.) neither blocks nor is blocked by this — but anything NEW that touches notes' storage (the bit-block, typed fields) should land **after** the migration, not before, or it doubles the migration's surface.
4. *(Superseded: my "storage last, after flow/frame fully settles" position — it rested on the false small-seam count and on overstating what the migration target needs to know.)*
