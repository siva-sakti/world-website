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

## 6 · ⚪ THE OPEN REGISTER (everything, honestly)
**Owner:** reference-system whole-block (under discussion, her pace) · Q1 one-vs-two tables (rec: one) · the card mock verdict · station-1 legibility re-confirm · **the naming session** (the sweep list: route `/note`→? · "composition" vs the collision · chip/block blessing · the tie-word · drawer scopes) · her Notion feel-session (final toolkit cut).
**Claude:** the card mock · frame-handoff design · floater mechanics detail (size/z/persistence) · drawer-docking detail · the enactment plan doc (from §1.3, for the code window).
**Deferred by design:** privacy/visibility session · the graph round · T3 shelf · deck · sheet/engine.

## 6b · ⭐ STATION 5 — THE DELIBERATE ABSENCES, READ BACK AND STAMPED (owner, 2026-09-02)

**Stand as absent, confirmed:** a board referenced inside writing (visited, not read) · **floating things on a composition** (*"we do not want that"* — the board is for that) · **pasted content auto-becoming bits** — confirmed with the owner's better reasoning: *we can't reliably tell someone pasting their own paragraphs around from someone pasting something new*; the highlight-to-make-a-bit button stays, nothing automatic · formulas/linked-tables/database-views (parked) · **a piece converting to a bit, or back** (*"they just stay as pieces"*) · anything auto-creating a composition · the never-list (collaboration · AI · analytics · audience).

**⚠ CHANGED BY THE OWNER AT STATION 5 — two:**
1. **VERSION HISTORY IS WANTED** (reversing "duplicate covers it" — Claude's position, overruled): *"I don't think duplicating a piece covers version history; I think it actually makes sense to have a good version history system."* Duplicating gives forks, not history — it can't say what this piece looked like Tuesday. → filed **F-8**.
2. **CREATE-ON-MISS: REOPENED as a candidate.** Claude had ruled it out for lacking a designed pathway; **the owner supplied the pathway** — *"provide people more options to know if they want to create a bit or a board"* → typing a name that doesn't exist offers **"create as: a bit · a composition."** Not ruled in; no longer ruled out.

**⚑ THE BIT↔BIT WORRY, resolved as a STEERING problem (owner-raised, Claude-answered, owner to confirm):** her worry — the Obsidian-minded person whose unit is the bit finds they can't link bits. **The resolution:** in Obsidian a note is both captured-thing and writing; this model split them, so "linking my bits" is really linking *small written units* — which here **are compositions**. Literal bit-linking (a screenshot to a screenshot) carries no *why*; the sentence explaining the relation is the link. And structurally: **anything that can point at other things IS a weaving surface** — a bit referencing three bits is a small composition wearing the wrong label, the exact confusion this redesign undid. **The real risk is steering, and the fix is a DOOR not a mechanism:** from any bit, *"write about this"* → a small composition opens with that bit already pulled in. One tap from impulse to the right surface; no rule to learn. → filed **F-9**.

**✅ EVAPORATE — SCOPE PINNED (owner, 2026-09-02):** the plain case is the whole case — *open a composition, do nothing, click away, it's gone.* **And the edge resolves by the same logic: if it was born from a board (auto-placed at birth), evaporation takes its birth-placement with it** — a named, ruled exception to I-L2 (placements never deleted outside empty-trash), justified because nothing real ever existed. Acceptance test: create-from-board → close empty → **zero rows anywhere** (no surface row, no placement row).

## 7 · CAUGHT BY WRITING THIS (new, previously unasked)
1. **Search must learn surfaces** — post-migration, `/search` reads the bit table; document bodies need indexing in or **pieces vanish from search**. Real work item, now §4.
2. **Board-trash cascade for piece-cards:** a trashed *board* makes bits loose — but **pieces are never loose**; their cards simply vanish with the board (placement rows survive frozen), the piece unaffected in its list. Needs one explicit line in the migration tests. ⚪ confirm this reading.
3. **The `/write` door's fate** post-naming: stays as the room, or becomes "new composition" everywhere? Route decision rides the naming session.
4. **The date-title's fixed format** — owner said fixed; the string itself (e.g. "Sep 3, 9:41") picked at build. Minor, listed so it's chosen not defaulted.
5. **The floater's save indicator** — the page says "saving…/saved"; the floater needs its mirror or silent-fail returns (the F3 lesson).
