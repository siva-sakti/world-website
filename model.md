# The model — the whole picture, top to bottom

**What this is:** ⭐ **THE current conceptual model — the authority for what's true now** (CLAUDE.md hub; supersedes `agreements.md`, which is the *historical* pre-notes record). The whole shape in one read — atoms, surfaces, how they join, everything cross-cutting. Written 2026-08-26, kept current through D-121, **fact-checked against the real schema**. Complements: `philosophy.md` = *why* · `lexicon.md` = *exact words* (naming authority) · `invariants.md` = *always-true rules* · `PROGRESS.md` D-log = *the rulings* (D-118–D-121) · `agreements.md` = *historical D-019→D-102 record, do not build from*.

---

## The one premise: two levels
```
ATOMS      →  bits            the fragments — the smallest unit of thought/consumption
SURFACES   →  boards · notes  where you compose bits into something
```
A **bit** is only ever an atom. A **board** and a **note** are *peers* — both surfaces — and a surface can *also* be a unit (a doorway) on another surface. A bit can never be a surface; a surface is never an atom. **A thing never changes type** — `kind` is set at birth (catch/jot → bit · ✎ write → note) and is never flipped (D-121; no bit↔note toggle).

## The three things

**bit** (table: `bit`) — the atom. One unit: text, drawing, image (audio·pdf later). Needs nothing to exist — no title, board, or tag. Carries: its content (`body`), the owner's optional words (`content` = a title/caption), a `source` (where it came from), a `kind` ('bit' | 'note'), tags, a folder, alive-status, dates, visibility. Its computed headline is its **face**.

**board** (table: `board`) — a **spatial** surface. Bits join it by **placement** (a position). A board has no body of its own — its composition *is* the arrangement. Carries: title, folder, alive, visibility, dates.

**note** — a **textual** surface (a written *piece*). Bits join it by **gather**. Its composition *is* the writing. **Storage reality:** today a note is a `bit` row with `kind='note'` (its writing = `bit.body`, its gathered bits = `reference` rows) — filed as an atom, which is why it keeps all bit-machinery for free (tags/find/trash/gather/export). **Built (N1):** presented as a surface — its own writing page (`/note/[id]`), listed beside boards, never as a fragment.

## How a bit joins a surface (the same act, two mediums)
- **placement** (table: `placement`) — a bit **on a board**, in *space* (x·y·w·h·z, per-board). Un-placing stamps `left_at` (its travel history is kept, never deleted). *This is a board's membership record.*
- **gather → reference** (table: `reference`) — a bit **included in a note**, in the *writing* (`[[` drops a chip; the row is `from_bit_id`=the note → `to_bit_id`=the gathered bit). *This is a note's membership record.*
- **The symmetry:** placement is to a board what a reference is to a note. Both records already exist in the database.

## Surfaces as units (doorways)
A surface can also be *one unit* placed on another surface — a **doorway** (a titled card → click to open it), not its contents exploded.
- A **board on a board** = a board-card (a hub/doorway). *(schema supports it: a placement can target a board.)*
- A **note on a board** = a page-shaped **doorway card** → opens the note's surface (**built, N3**; option b — a note is placed on a board like a PDF will be).

## The cross-cutting dimensions (apply to bits and/or surfaces)
- **tags** (`tag`, `tag_application`) — shared *words*; "what it's about." On **bits and boards** (polymorphic). Pull a word → everything that ever carried it (`the_pull`). Words referenced by id, so renames are free (Principle 9).
- **source** (`source`) — provenance; the "from…". One per bit, travels with it. Has its own page (everything from this source).
- **folders** (`shelf_group` + `group_id` on board/bit) — the *shelf*: how home is arranged. Cut across **boards and notes** (one group per thing; deleting a group strands nothing). Not a rival to tags — arrangement, not meaning.
- **alive** (`pinned_at` on board/bit/shelf_group) — the owner's hand marking what's top-of-mind. Boards · notes · folders can all be alive. The **desk** (home) greets you with alive things.
- **trash** (`deleted_at` on bit/board) — a freeze; hidden everywhere, restorable (`trash_listing`). *(Gap: notes have no trash/archive UI in the notes room yet — owner-flagged.)*
- **travel** (`bit_travel`) — a bit's board history (arrived/left per board).
- **connector** (`connector`) — hand-drawn arrows between cards on a board.
- **visibility** — public | private (shared later). A public read-door exists at the DB (anon reads public+placed+live); **nothing is published yet** — all private, and there's no publish act built.

## The web (the founding "how thoughts connect")
Three ways, all computed from the above: **shared words** (tags) · **shared space** (boards/placements) · **deliberate threads** (gather/references). The **graph** draws these; today's `/graph` predates gather (tag/board only) — the reference-threaded graph is parked, evidence-gated.

## Stored vs computed (never confuse them)
**Stored** (the truth): the tables above. **Computed on the fly** (views/pages): `home`, the **desk**, `the_inbox`(loose bits→`/bits`), the notes room(`/notes`), `the_ledger`(`/find`), `the_pull`, `trash_listing`, `board_cards`, `bit_travel`, `tag_counts`, the graph, a bit's **face**. A surface you see is a *view* of stored things, not a second copy.

## Three layers that are ALLOWED to differ (the note lesson)
- **Model** — what a thing *is* (a note is a surface). ← the truth.
- **Storage** — how it's *filed* (a note is a `bit` row, `kind='note'`) — reuse, to inherit the machinery; fine to differ from the model.
- **Presentation** — what the user *sees* (must match the **model**: a note looks like a surface). ✓ fixed — N1 (note page) + N3 (note-on-board doorway).

## Open threads the full picture surfaces (beyond the note re-surfacing)
1. ~~**Note-on-board = doorway** (ruled b)~~ **✓ BUILT (N3)** — a placed note renders as a page-shaped doorway card that opens its surface.
2. **Gather beyond bits** — today `[[` gathers only bits. Owner asked about **gathering a board into a note**, and **linking sources inline**. Both are small additions (a reference that can point at a board / a source), not built.
3. **Notes management** — trash + (maybe) a distinct **archive** state, surfaced in the notes room. Missing.
4. **Find shows notes as text bits** — should the notes room / find distinguish notes as surfaces? Minor, worth a pass.
5. **A note has a body; a board doesn't** — the one real asymmetry between the two surfaces (a note carries authored prose; a board is pure arrangement). Not a problem — just true.
6. **Discipline cost of note-as-bit** — because notes live in the `bit` table, every bit-oriented surface must consciously choose "bits, notes, or both" (we filter by `kind`). A standing tax, acceptable, worth remembering.
