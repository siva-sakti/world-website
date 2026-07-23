# Plan — Tags (knowledge layer, part 1)

**Status: planned in detail; build starts right after Phase 1 (cloud + login)** — every step below needs real persistence, so cloud is the gate. Written 2026-07-18. Companion research: `research-knowledge-layer.md` (D-054). Roadmap home: Phase 2, steps 1–2 (+ parts of 4–6).

---

## The model (what a tag *is* here)

- **Flat, open vocabulary**, topical — "what is this about." The typed structure ("what is this / how mature") stays with `kind`/`stage` (D-020, D-054). No nesting until the flat manager proves insufficient.
- **Optional everywhere** — tagging marks significance; untagged marks just live on their board (D-039).
- **Referenced by id only** (invariant I1) → renames are free, no data migration ever.
- A tag *becomes* a topic-page (step E) and feeds the graph — but the tag itself stays `{id, name}`.
- **What's taggable:** every bit + every board. A bit's tags travel with it to every board it's placed on (placements carry no tags of their own).

## Blast radius (owner asked: "does it touch everything?")

- **Data:** two join tables already in the schema (`bit_tags`, `board_tags`) — zero restructuring of `bits`/`boards`/`placements`.
- **UI:** additive only — one shared `<TagPicker>`, chips on a selected card, a topic-page route, a tag-manager route, a find filter. Existing compose interactions unchanged.

## Schema deltas (amend the init migration — legitimate while no persistent DB exists, same reasoning as D-028)

1. `created_at timestamptz not null default now()` on **`bit_tags`** and **`board_tags`** → enables recent-first pickers + "when did I tag this" provenance.
2. **Case-insensitive uniqueness** on tag names: `create unique index tags_name_lower_idx on tags (lower(name));` — display keeps first-typed casing; prevents Astrology/astrology dupes.
3. Nothing else changes.

**Normalization rule** (enforced in `lib/db`, not the DB): trim; collapse internal whitespace; strip a leading `#`; max ~60 chars; reject empty.

## `lib/db/tags.ts` (one module = the whole API; no component touches Supabase directly)

- `listTags({query})` → `{id, name, count, lastUsed}`; order: exact/prefix match first → recent-first (max join `created_at`) → alphabetical.
- `createTag(name)` → normalize; case-insensitive **get-or-create** (race-safe via the unique index).
- `tagBit` / `untagBit`, `tagBoard` / `untagBoard` — idempotent (`on conflict do nothing`).
- `tagsForBit(bitId)`, `tagsForBoard(boardId)`.
- `renameTag(id, name)` — case-insensitive collision → offer **merge** instead.
- `mergeTags(fromId, intoId)` — one transaction: repoint both join tables (`on conflict do nothing`), delete the source.
- `deleteTag(id)` — UI confirms with usage count; join rows cascade.

## The picker (the heart — must feel effortless, tap-not-type first)

One shared `<TagPicker>` used everywhere tags can be applied:
- Opens with a search box + the item's current chips.
- Type → prefix/fuzzy match over existing tags (recent-first); when no exact match, top row = **“Create ‘x’”**. Enter = top result; tap = toggle on/off.
- **Touch-first** (Daylight): ≥40px targets, no hover-dependence. Fully keyboard-drivable too (arrows/enter/esc).
- **Quiet visual:** small paper-toned chips, one ink, no per-tag colors.

Entry points (v1):
- **Compose:** select a card → a small `#` affordance beside the selection frame → picker as a floating panel. Chips show **only while selected** (quiet board — owner can revisit this taste call).
- **Board:** a "tag board" affordance in the toolbar.

## Steps (build order, each independently verifiable — after cloud)

- **A. Schema** — amend init migration (join `created_at`, lower-name unique); apply to cloud; verify (dupe casing rejected, provenance populated).
- **B. `lib/db/tags.ts`** — plus a small round-trip verification script (create → apply → list → rename-collision → merge → delete) against the real DB.
- **C. `<TagPicker>` + compose integration** — select card → tag it; verified by touch on the Daylight, not just desktop.
- **D. Chips on the selected card** + remove (×).
- **E. Topic-page `/t/[name]`** — header (name + count), grid of tagged bits + boards carrying the tag; empty state = one quiet sentence. **Query-time view — no new table** (D-054).
- **F. Tag manager `/tags`** — list with counts, inline rename, merge (pick target), delete-with-count.
- **G. Typed triggers (now welcome, D-055)** — in Tiptap text, `#` opens this same picker inline (and `[[` / `@` will open the *link* picker when we build links). Keyboard bonus; after C–F.

## Verification / success

- Build + typecheck clean per step; the picker usable **by touch on the Daylight**.
- The real test (D-053): with a seeded cluster of real notes — does tagging feel like a joy, and do topic-pages start pulling you back?

## Open taste questions (decide while building, owner's call)

- Chips always visible on cards vs only-when-selected (default: only-when-selected).
- Where board-tagging lives (toolbar vs a board header).
- Any cap on tags per bit (default: none).
