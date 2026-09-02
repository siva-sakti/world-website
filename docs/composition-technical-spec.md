# The composition — technical spec

> ## STATUS · 2026-09-03 · 🟠 BUILD-GRADE CONSOLIDATION — every ruling in build language; ⚪ marks are the honest open register
> **What this is:** the technical consolidation of everything ruled (concept lives in `composition-definition.md`; trails in `composition-base-spec.md`). Written per the owner's ask: *"make this into an actual technical spec, and in that process capture anything else we need to check."* §7 lists what the writing itself caught.
> **Nothing builds from this until:** the ⚪ register clears · the naming session lands · the migration is throwaway-proven per house method.

---

## 1 · DATA LAYER

**1.1 The surface table** *(⚪ Q1 pending — the shape below assumes the recommended ONE-table answer; a two-table answer changes mechanics, not behavior)*
Boards' table gains: `form text not null check (form in ('canvas','document'))` default `'canvas'` · `body text` (HTML; **CHECK: document ⇒ body allowed, canvas ⇒ body null**) · compositions copy over from `bit(kind='note')`.
Carried columns (already on board): title(nullable) · visibility · group_id · pinned_at · state/archived/deleted (D-127 resting model) · timestamps · search_tsv (**extend: title + body when document-form**).
Dropped from the old note-rows: `source_id` (ruled out) · face machinery (title + derived preview at read) · `bit.kind` **dropped entirely — the bit table returns to pure material.**

**1.2 Relations**
- `reference`: **`from_surface_id` (document-form only — app-guarded or trigger) → `to_bit_id` | `to_surface_id`, CHECK exactly-one.** Delivers comp→bit ✅ comp→comp ✅; comp→board expressible but **excluded by rule** (direction principle — enforce in app; the picker never offers boards). UNIQUE(from, to-either). `reference_not_self` carries (a piece can't reference itself).
- `placement`: host `board_id` → **`surface_id` (canvas-form hosts only — CHECK or app)**; target `target_bit_id` | `target_surface_id`, CHECK exactly-one. **🆕 guard: no self-door** (`target_surface_id <> surface_id`). Un-place keeps rows (I-L2); travel records carry.
- `tag_application`: `target_bit_id` | `target_surface_id`. Existing note-tags repoint in migration.

**1.3 The migration** *(code window's lane; backup → throwaway-proven → owner's go)*
① schema (1.1–1.2) · ② copy note-rows → surface rows (**visibility flipped to `private`** — every stored value was a default, never a choice) · ③ repoint placements/references/tags/travel · ④ **grandfather bit-authored references** (count first; convert or report) · ⑤ delete note-rows; drop `kind` · ⑥ regenerate views · **export lockstep (I-G1)** · search · ⑦ sweep ~30 app files (mostly deletions) · ⑧ re-run `verification/`.

## 2 · INVARIANTS (the map — gate 1, paid)
| id | rule | enforced by |
|---|---|---|
| I-C1 | **Material is flat: only document-surfaces author references** | app (one door) → trigger later |
| I-C2 | **Blocks render ONE level deep** — nested chips never expand | render rule |
| I-C3 | **A composition is never auto-born**; empty-at-click-out **evaporates** (compositions only; D-138 persist is bit-card law) | app (create doors) |
| I-C4 | **Archive is read-only**; editing requires the explicit revive tap | app + UI |
| I-C5 | A surface's form is **fixed at birth** (canvas ⇄ document never converts) | CHECK + app |
| I-C6 | The chip's body-text is a **shadow** (search/export); **display is always live** | render + reconcile-on-save |
| carried | I-L1/L2 (placement unique/durable) · I-G1 (export lockstep) · I-G4 · reference_not_self · D-127 state exclusivity | as today |
| retired | I-K1/I-K2's bit-kind forms (superseded by table separation — **stronger now: enforced by architecture**) | — |

## 3 · BEHAVIORS (build language; all owner-stamped unless ⚪)
**Birth:** /write · board compose-door → **floater**, born-on-first-content, **auto-placed on birth board**; title minted (fixed date-time format ⚪ format string TBD at build) **only at exit-without-title**, never on autosave. Templates = a *mode* at any door (T3).
**Open chain:** card → floater (default) → panel (dock) → page. List/search/chip-peek → page. Phone → page only.
**Editing frames:** floater = basic toolkit · panel + page = full. **Many floaters allowed** (⚪ display/management design) · ⚪ same piece in two frames = the handoff design debt (Claude's).
**Pull-in:** `[[` (search picker: **two sections — material · compositions; archived excluded; boards never**) + the drawer (+ **"in this piece" tab**, reads whole). **Born as chip; images/drawings born as blocks.** Chip ⇄ block via peek's "show in place" / block's tuck control. Copy-paste carries chips; destination mints own rows on save.
**Display:** chip = live face (caption→first words→thumbnail; link-bits: headline→domain) · peek on tap · block preview-sized, full only when small; **wrap yes, float no**; ⚪ wrap + alignment implementation (the "real text interface" work, surface-spec §4.2b).
**States:** trash = frozen everywhere, card vanishes, restore returns whole (star intact) · archive = **read-only**, greyed chips/cards remain enterable, "bring back to edit" revives · destroy (empty-trash only) cascades both directions; chips degrade to plain text.
**Board side:** distinct piece-card (⚪ look = the mock) · **hide-pieces toggle per board** (presentation-only) · multi-board placements independent.

## 4 · UI INVENTORY (station 3b-screens, paid) — screens touched + their states
| screen | changes | empty/error/loading |
|---|---|---|
| the compositions list (today `/notes`) | lists surfaces(document); sorts; ⚪ route renamed post-naming | empty: invite line · errors surfaced (no silent-fail — the F3 class) |
| `/write` | unchanged door; births document-form | — |
| the piece page (today `/note/[id]`) | + drawer w/ in-this-piece tab · archive read-only mode + revive tap · "pulled into" section | loading skeleton · save-error banner (exists) |
| the board | + compose door · piece-cards (distinct) · hide toggle · **floater + panel** | floater save-status (⚪ mirror the page's) |
| a bit's page | "pulled into" (exists) | — |
| search | **⚪ FOUND: must include document-surface bodies post-migration** — today's search reads bits; surfaces need indexing in | — |
| trash / archive listings | both kinds listed; restore paths | empty states exist |
| export | surface table joins (I-G1) | — |
**Phone:** page-only editing; boards as today; floater/panel absent.

## 5 · ACCEPTANCE (how "done" is known)
**Provable by test:** migration counts (rows in = rows out; refs repointed; zero orphans) · evaporate (create-empty-close ⇒ no row) · title-at-exit minting · reference rules (I-C1: bit-authored insert refused; self refused; board-target refused) · archive read-only (write refused until revive) · export completeness · search hits a body phrase post-migration.
**Owner feel-test list:** the floater feel over a board · the chain (tap→float→dock→page) · chip⇄block gestures · the hide toggle · archived grey-and-enterable · the drawer's in-this-piece reading · list at many-small-pieces scale.

## 5b · ⭐ CLOSED IN THE 09-02 SWEEP
- **Existing note-rows' sources + old chips inside bit bodies: ✅ RESOLVED** — the owner: *"I'm OK if we actually break what I've been playing with… I've just been using it very casually."* → migration **cleans both up**; no special preservation, no grandfathering machinery. (Report counts in the migration log for the record; nothing more.)
- **The "reference system whole-block" stamp: ✅ CLOSED AS ALREADY-STAMPED** — the owner has since ruled every one of its eight rules individually (who references · what's referenceable · front-links-are-the-writing · backlinks-everywhere-alike · chip/peek/block · resting behavior · the graph later · migration handling). No further stamp needed; the block was bookkeeping, not a question.
- **The legibility line: moved out of the build register** — the owner: *"that was a way for us to do teaching; I don't think it affects how we build stuff."* → belongs to `teaching-the-user.md`, not here.
- **⭐ S7 — "WHAT THIS PIECE IS FOR" — RULED IN (owner, 2026-09-02):** a composition can hold facts about its own assignment — **a word-count target · a due date · who it's for.** Her words: *"those sound like good features… that kind of project management layer."* The last live scene of the walk, closed by wanting it. **Does NOT reopen the to-do objection** — she rejected building a task manager; a piece knowing its own job is a different thing. ⚪ design detail (where they live on the page, whether the count is live) at build.
- **⚠ THE EIGHT RULES — honest correction:** Claude claimed all eight were owner-ruled; **six were.** Two — *front-links are the writing itself* · *backlinks look the same everywhere* — are **descriptions, not decisions**, and were Claude's. Uncontroversial, but not stamped, and now marked as such.
- **⚑ STORAGE (Q1) PROMOTED to its own session** — the owner pushed back on a lean: *"wouldn't compositions be their own thing… we need to make sure that is very straight with our three components — bit, boards and compositions."* **The backend session covers all three components, not just this fork.**
**⭐ The owner's architectural objection RESHAPED the options (2026-09-02):** *"just because a composition can appear on a board analogous to a bit doesn't mean they are similar… I don't want the board to become the main way we store everything and have compositions conform to it."* **Correct — that kills what Claude proposed.** The honest option space:
| | shape | cost |
|---|---|---|
| **A** | compositions join the BOARDS' table (marker column) | ⛔ **ruled out by the owner** — board-ness becomes the default, composition the exception; storage conforming = the exact lie this redesign undid |
| **B** | a NEW `surface` table neither owns; boards AND compositions both move in as equal citizens | shared columns belong to *surface-ness*, not to boards; **bigger migration** (boards move too) |
| **C** | compositions get their OWN table, each shaped optimally | every shared behavior (tag · folder · star · place · reference) needs **two code paths, forever** |
**B and C are both honest; A is not.** The session's question, in the owner's own framing: *what is genuinely shared between a board and a composition, and is that enough to be a real thing?*

## 5c · 🌱 SEED FOR THE BACKEND SESSION (planted 2026-09-02 — read this first when the session starts)

**The owner's lean, stated:** *"there should probably be a new way that we store compositions, and it's kind of like the same level of authority that we've been storing boards."* → **Option C: compositions get their own storage, as PEERS of boards.** Neither subordinate, neither conforming to the other's shape. *(She has now arrived here twice from different directions — first killing option A, then stating C positively.)*

### What the session must decide (in order)
1. **Confirm C** (or move to B — a shared `surface` table both boards and compositions move into as equals). C is the lean.
2. **If C: what does a composition's table actually hold?** Designed from the composition's own needs, not copied from board: id · owner · title (nullable) · body · state (live/archived/trashed) · folder · star · visibility · timestamps · **the job facts (word target · due date · who it's for — S7)** · search index. *(Ask of each: does a composition need this because it's a composition, or because a board has it?)*
3. **The relation columns — the real cost of C, and where it must be paid carefully:**
   - `reference`: from = a composition. **to = a bit OR a composition** (two nullable columns + exactly-one CHECK).
   - `placement`: target = a bit OR a board OR **a composition** (three nullable columns + exactly-one CHECK — this is the one that grows).
   - `tag_application`: target = bit OR board OR **composition**.
   *Under B these would each be one column fewer. That is the entire price of C — and it may be worth paying for honest shape.*
3b. **SEARCH — plumbing, on this session's agenda (not its own session).** *Search's **behavior** is already decided because it already works this way: one list, tabs to narrow (all · bits · notes → compositions). No redesign.* What the storage choice decides: **where the word-list (search index) lives for compositions, and how the query reads both homes.** Under C (own table) that is a second generated index + a query that unions two sources; under B (shared surface table) it is one index on that table. **⚠ If this is not handled in the same migration, every composition silently disappears from search.**
4. **The shared behaviors and how they stay one thing, not two:** tag · folder · star · trash/archive/restore · search · export. **Decide the pattern once** (a shared helper layer? per-kind functions with one door?) rather than letting two code paths grow by accident. **This is where C fails if it fails.**
5. **What the bit table returns to:** pure material — `kind` dropped entirely.
6. **The migration order + the export lockstep (I-G1)** and which invariants change fate (see §2).

### The principle to hold through it (the owner's)
> *"Just because a composition can appear on a board analogous to a bit doesn't mean they are similar."* **Storage must reflect what each thing IS — never what it can appear inside.**

## 6 · ⚪ THE OPEN REGISTER (everything, honestly)
**Owner:** **the backend/storage session** (all three components; supersedes the Q1 one-vs-two fork) · **the naming session** (the sweep list: route `/note`→? · "composition" vs the collision · chip/block blessing · the tie-word · drawer scopes) · her Notion feel-session (final toolkit cut).
**Claude:** the card mock · frame-handoff design · floater mechanics detail (size/z/persistence) · drawer-docking detail · the enactment plan doc (from §1.3, for the code window).
**Deferred by design:** privacy/visibility session · the graph round · T3 shelf · deck · sheet/engine.

## 6b · ⭐ STATION 5 — THE DELIBERATE ABSENCES, READ BACK AND STAMPED (owner, 2026-09-02)

**Stand as absent, confirmed:** a board referenced inside writing (visited, not read) · **floating things on a composition** (*"we do not want that"* — the board is for that) · **pasted content auto-becoming bits** — confirmed with the owner's better reasoning: *we can't reliably tell someone pasting their own paragraphs around from someone pasting something new*; the highlight-to-make-a-bit button stays, nothing automatic · formulas/linked-tables/database-views (parked) · **a piece converting to a bit, or back** (*"they just stay as pieces"*) · anything auto-creating a composition · the never-list (collaboration · AI · analytics · audience).

**⚠ CHANGED BY THE OWNER AT STATION 5 — two:**
1. **VERSION HISTORY IS WANTED** (reversing "duplicate covers it" — Claude's position, overruled): *"I don't think duplicating a piece covers version history; I think it actually makes sense to have a good version history system."* Duplicating gives forks, not history — it can't say what this piece looked like Tuesday. → filed **F-8**.
2. **CREATE-ON-MISS: REOPENED as a candidate.** Claude had ruled it out for lacking a designed pathway; **the owner supplied the pathway** — *"provide people more options to know if they want to create a bit or a board"* → typing a name that doesn't exist offers **"create as: a bit · a composition."** Not ruled in; no longer ruled out.

**⚑ THE BIT↔BIT WORRY, resolved as a STEERING problem (owner-raised, Claude-answered, owner to confirm):** her worry — the Obsidian-minded person whose unit is the bit finds they can't link bits. **The resolution:** in Obsidian a note is both captured-thing and writing; this model split them, so "linking my bits" is really linking *small written units* — which here **are compositions**. Literal bit-linking (a screenshot to a screenshot) carries no *why*; the sentence explaining the relation is the link. And structurally: **anything that can point at other things IS a weaving surface** — a bit referencing three bits is a small composition wearing the wrong label, the exact confusion this redesign undid. **The real risk is steering, and the fix is a DOOR not a mechanism:** from any bit, *"write about this"* → a small composition opens with that bit already pulled in. One tap from impulse to the right surface; no rule to learn. → filed **F-9**.

**✅ EVAPORATE — ONE RULE, SIMPLIFIED BY THE OWNER (2026-09-02):**
> **Nothing exists until you put something in it. Once it exists, it is real — and it stays until you trash it.**
Cases, all covered by that one line: open+type-nothing+leave → never existed, gone · same on a board → gone, **and its auto-placement with it** (there was never a piece to have a card) · title but no words → never existed (born-on-first-content) · typed-then-deleted-then-closed → **it exists, it stays** (trash it deliberately) · **rearranging a board with an empty composition card → it exists, NOTHING vanishes under the user's hands** (the owner's architecture principle, carried from bits/D-138) · emptied later → stays.
**Claude had split this into three "cases" needing rulings; the owner cut it to one rule.** Acceptance: create-empty-close ⇒ zero rows (surface + placement); create-with-content-then-empty-close ⇒ rows persist.
**(superseded phrasing:)**  the plain case is the whole case — *open a composition, do nothing, click away, it's gone.* **And the edge resolves by the same logic: if it was born from a board (auto-placed at birth), evaporation takes its birth-placement with it** — a named, ruled exception to I-L2 (placements never deleted outside empty-trash), justified because nothing real ever existed. Acceptance test: create-from-board → close empty → **zero rows anywhere** (no surface row, no placement row).

## 7 · CAUGHT BY WRITING THIS (new, previously unasked)
1. **Search must learn surfaces** — post-migration, `/search` reads the bit table; document bodies need indexing in or **pieces vanish from search**. Real work item, now §4.
2. **Board-trash cascade for piece-cards:** a trashed *board* makes bits loose — but **pieces are never loose**; their cards simply vanish with the board (placement rows survive frozen), the piece unaffected in its list. Needs one explicit line in the migration tests. ⚪ confirm this reading.
3. **The `/write` door's fate** post-naming: stays as the room, or becomes "new composition" everywhere? Route decision rides the naming session.
4. **The date-title's fixed format** — owner said fixed; the string itself (e.g. "Sep 3, 9:41") picked at build. Minor, listed so it's chosen not defaulted.
5. **The floater's save indicator** — the page says "saving…/saved"; the floater needs its mirror or silent-fail returns (the F3 lesson).
