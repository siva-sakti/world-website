# Source & the full bit — build plan

**Supersedes `capture-build-plan.md`** (bookmark-centric — retire to `old/` at Stage 0). Consolidates every decision from the owner–Claude working session of **2026-07-26**. Grounded in the current codebase throughout (§"How it fits").

**Status (2026-07-27): ✅ Stages 0–3 + the source manager DONE + deployed** — Stage 0 (the model fix) = D-102; Stages 1–3 + the manager = D-103. Both owed items since closed: a source's URL at *intake*-creation ✅ (smart source links — a pasted link fetches its page title, D-105) · place-on-a-board ✅ (call-in, D-104).
**Superseded detail (D-105):** this plan's *sticky* intake source ("stays across adds") was replaced at the owner's ask by a **full reset after each add** (source + tags + note all clear; whatever's typed is *applied*, never dropped) — the plan text above is history, the reset is the live behavior.

---

## 1. What this is — the reframe

We are **not** building "capture" or "an inbox feature." We're doing two things, and everything else falls out of them:

1. **Make a *regular bit* fully itself, everywhere** — every bit can carry a **source**, **tags**, and **rich text**, whether it's loose or on a board. *(Principle 8: meaning travels with the bit; position stays with the board.)*
2. **The inbox is simply the *view* of loose bits** — not a special place with special powers; just "your bits that aren't on a board yet."

**Vision:** you read something, jot several pieces from it (quotes, your own thoughts) — each its own full bit, all sharing the **source** — and they land loose, ready to route onto boards when a home emerges.

**Success feel:** intake feels like *writing, not filing*; a loose note has every power a placed note has except *where it sits*; "everything from this source" assembles itself; nothing is auto-filed for you.

---

## 2. What we settled (owner, 2026-07-26)

| # | decision | ruling |
|---|---|---|
| 1 | **Bookmark retired** | A URL is a **source**, not a saved page. There is no "bookmark" object and **no auto-bookmark ever**. "Save a page to revisit / give extra attention" is a **deliberate act** — expressed as a **tag** (consistent with the rejected favorites/star), never a default. |
| 2 | **Source = a first-class citizen** | A real named thing, **tag-shaped**: its own `source` table, **pick-or-create autosuggest**, rename-once, a **sources-list**. **Universal** — on *every* bit (`bit.source_id`), any type. **One source per bit** (a bit has *many* tags but *one* "where it came from"). A source = a **name** + an **optional URL** (a book has a name, no link; a web page has both). |
| 3 | **Source travels with the bit** | It lives on the bit, so placing a bit onto a board carries its "from …" with it (Principle 8). |
| 4 | **Loose bits = full bits** | Source, tags, rich text — everything a placed bit has **except arrangement** (position, size, connectors — those *are* the board). True from the instant of capture, not unlocked by placing. |
| 5 | **The inbox = the view of loose bits** | The `the_inbox` view (D-100). Not a feature with its own powers. |
| 6 | **Rich text** | On notes: **bold · italic · lists · quotes · links** — one typeface, quiet (un-parks C3). Headings / colors / multiple fonts held back v1 (owner may un-hold). |
| 7 | **Tag anywhere** | Any bit, loose or placed — reusing the existing tag editor. |
| 8 | **Intake = a source + notes under it** | Pick/enter a source, jot pieces; each piece = its own loose text bit carrying that source. **Quote vs. your thought is *formatting* (a blockquote), not a new kind of thing.** |

**⚠ This is a *pivot*, not an addition — the load-bearing confirmation.** The plan reverses three-day-old applied work (it migrates away D-100's `source_url`/`source_title` columns, supersedes `capture-build-plan.md` after only Slice 1, and reverses that plan's decision 1 — the *visual bookmark card*). Its soundness rests on one conscious owner ruling: **there is no "saved web page (or video) as its own kept thing."** You keep **notes *from* sources**, never the resource itself — *grow thoughts, don't hoard consumption* (the founding philosophy). Consequence to re-home: **A14** (video = "a bookmark to Drive/YouTube") loses its mechanism → a video becomes a **source** on a note, or a **rich-text link inside** a note, not a saved object. **Owner confirmation required before Stage 0.**

---

## 3. How it fits the app (the reconciliation — grounded in the current code)

Almost every part **clones a pattern already working in the repo**; the genuinely-new surface is bounded.

- **Source clones the vocabulary family.** The `source` table = the **`subtype_word`/`tag` shape** verbatim (`id · name · url · created_at · updated_at`, a **case-insensitive unique index** on `lower(name)`, owner RLS). `bit.source_id` = **`bit.subtype_word_id`** exactly — a nullable FK, `on delete set null`. It's the **simpler half** of the tag pattern: single-valued (a FK), so **no join table** (tags need `tag_application`; source doesn't).
- **The source db-layer clones `lib/db/tags.ts`.** `listSources` · `setSource(bit, source)` (pick-or-create + set `source_id`) · `clearSource` · `renameSource` · `mergeSources` · `deleteSource` · `listManagedSources` — the same functions as tags, single-valued.
- **The source picker clones `TagBar`.** `TagBar` already does *"pick an existing one or type a new one,"* suggestions collapsing until focused, works on any target. `SourcePicker` = that, **single-select** (one source, not many).
- **The sources-list clones the tags page** (`src/app/tags/` + `tag-manager.tsx`) — your reading list.
- **Rich text extends the existing note editor.** `TextBit` (tiptap `StarterKit`) already stores **HTML** (`getHTML()` → `bit.body`). We add formatting **controls** (a toolbar/bubble menu + a few tiptap marks) — **storage unchanged, nothing existing breaks.** Applies on the board card, the workspace, and intake (one component).
- **Tagging anywhere reuses `TagBar`.** It already accepts any `TagTarget` (a bit or a board). We place it on the inbox and the bit page. *(The bit page shows tags **read-only** today — `getThingTags` → static chips, lines 100–114; we swap those for the editable `TagBar`.)*
- **The workspace extends the existing bit page** (`/bit/[id]`). Today it's **read-only** (text via `dangerouslySetInnerHTML` line 79; static tag chips). We make text **editable** (`TextBit` + rich text), tags **editable** (`TagBar`), and add **source** (display + `SourcePicker`). Serves *any* bit, loose or placed.
- **The bit page is a two-plan surface — coordinate with Gather (review finding #6).** This plan makes the bit page *editable*; Gather G3 replaces its `dangerouslySetInnerHTML` with chip-aware rendering. Both touch the same file. So the editable workspace **must render its body through the tiptap pipeline** (which handles rich-text links *and* gather chips) — **never raw HTML**. Done right this is a *win*, not just a risk: building the workspace on tiptap sets Gather's chips up for free instead of clobbering them.
- **The inbox = the `the_inbox` view** (D-100, already live + proven). We rework its **rendering** (bookmark-centric → notes-with-source + triage), not its data.
- **Retiring bookmark is contained.** It touches: `bit_type_allowed` + `bit_substance_matches_type` (drop the bookmark branch), the bit page's bookmark branch (lines 93–97), `createBookmarkBit` + the inbox's auto-detect (remove). No bookmark rendering exists on board cards yet, so nothing there.
- **Orthogonal to Gather.** Source = **provenance** (single, "where from," semi-automatic at capture). Gather (`reference`, D-101) = a **deliberate** bit→bit tie (the `[[` feature). Different facts, no interaction.
- **A fourth organizing axis.** Source ("where from") sits beside **tags** ("what about"), **boards** ("where placed"), **dates** ("when") — a real dimension, which is *why* it earns first-class status.

**Net new model:** one new table (`source`) + one FK (`bit.source_id`); retire the `bookmark` type; migrate the D-100 `source_url`/`source_title` fields into `source` records and drop them. Everything else is app-layer, mostly cloned.

---

## 4. The model change (schema)

**Ordering is load-bearing** (review finding #2): create source → migrate the fields → **convert every bookmark bit** → *only then* tighten the type CHECK. Convert-before-tighten, or surviving bookmark rows violate the new CHECK and the whole migration aborts. The attack suite must prove **zero bookmark rows survive**.

```sql
-- 1. THE SOURCE TABLE — clones subtype_word (§3b/§5c vocabulary shape), owner-scoped (D-094).
create table source (
  id         uuid primary key default gen_random_uuid(),
  name       text not null,                    -- the display name ("Deep Work", "calnewport.com/…")
  url        text,                             -- optional clickable link; null for a name-only source (a book)
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create unique index source_name_ci on source (lower(name));   -- near-dupes refused at birth (like tags)
alter table source enable row level security;
create policy source_owner_all on source for all to authenticated
  using (auth.uid() = <owner>) with check (auth.uid() = <owner>);   -- the D-094 clause, verbatim

-- 2. bit.source_id — clones bit.subtype_word_id exactly (nullable FK, set null on delete).
alter table bit add column source_id uuid references source(id) on delete set null;
create index bit_source on bit (source_id);

-- 3. MIGRATE the D-100 fields → source records. NAME FALLBACK (finding #3): source.name is
--    NOT NULL, but a clip whose title-fetch failed has a url and a null source_title. So
--    name = coalesce(source_title, url). One `source` per distinct name; point those bits' source_id.

-- 4. CONVERT every bookmark bit → a note-with-source, BEFORE step 5. A text bit requires
--    body NOT NULL (finding #1), so SYNTHESIZE a body — a rich-text link:
--       body = '<p><a href="' || url || '">' || coalesce(captured_title, url) || '</a></p>'
--    set type = 'text'; give it a source (name = coalesce(captured_title, url), url = url).
--    (In practice this is the one test bookmark; it converts cleanly.)

-- 5. RETIRE bookmark — now that ZERO bookmark rows remain: remove 'bookmark' from
--    bit_type_allowed; drop the bookmark branch from bit_substance_matches_type (this reverts
--    the D-100 "bookmark may carry preview" relax — moot now).

-- 6. DROP the old columns + VIEW REFRESH.
alter table bit drop column source_url;
alter table bit drop column source_title;
--    Recreate board_cards + the_ledger to JOIN source (so "from …" shows on cards + lists — the
--    flagged Slice-4 refresh, landed here). captured_title is now unused on live rows (harmless;
--    later cleanup).
```

- **Kinds-count sweep — precisely** (finding #4, the lesson that's bitten three times): `source` is a **new record kind** → **eight → nine kinds** (the *vocabulary* family grows to four: `tag · category · subtype_word · source`). `bookmark` is a **`type` value removed**, *not* a kind — the type list goes **4 → 3** (`text · drawing · image`). **Two distinct edits;** grep-verify both across lexicon / agreements §7 / SPEC / ROADMAP. The now-dead `when 'bookmark'` branches in `bit_face`/`bit_search_text` are **left as-is — dead, not wrong** (they never match) → **no generated-column edit.**
- **Attack-suite SURGERY, not just extension** (finding #5): **remove** the bookmark-specific proofs (the urlless-bookmark refusal; the D-100 bookmark-with-file *accept*, `verification/capture-proofs.sql`) and **add** "`type='bookmark'` is refused." New proofs: zero bookmark rows survive · source `name_ci` uniqueness · `source_id` FK + `set null` on source-delete · owner RLS · grouping returns exactly a source's bits · the migration converts the test bookmark (**non-null body**) and a null-title source (**name-fallback**) cleanly.
- Migration **proven on a throwaway copy before it touches cloud**; owner approves the apply.

---

## 5. The build, in stages (each ships value; owner checkpoint where feel matters)

### Stage 0 — Replan + fix the model (docs + database) → ◆ Checkpoint
- **Docs (the replan):** this plan (done) · correct the seed-of-truth: **agreements** (retire bookmark as a concept; source = first-class vocabulary citizen; "revisit = a deliberate tag") · **lexicon** (drop bookmark; add source · sources-list · the fourth axis) · **invariants** (the I-Src set) · the **kinds-count sweep**. Move `capture-build-plan.md` + superseded bookmark rulings → `old/`.
- **Schema:** the §4 migration. Proven on a throwaway DB — attack suite: bookmark refused · source `name_ci` uniqueness · `source_id` FK + `set null` on source-delete · owner RLS · the **migration converts the test bookmark + the source fields correctly**.
- **Records:** agreements ruling · lexicon · invariants (I-Src) · model-scenarios (a captured piece; a renamed source) · D-log.

### Stage 1 — The bit becomes fully itself → ◆ Checkpoint (feel: rich text + the workspace)
- **Rich text** on `TextBit`: bold · italic · lists · quote · link (tiptap marks + a toolbar). One typeface. Board + workspace + intake all get it (one component).
- **The source db-layer + `SourcePicker`** (clone `tags.ts` + `TagBar`, single-select).
- **The bit page → the workspace:** editable text (`TextBit` + rich text) · editable tags (`TagBar`) · **source** (display + `SourcePicker`), for any bit. *This is where "full functionality for boardless bits" actually lives.*
- **Source display** "from *[name]* ↗" on the bit + board cards (the view refresh).

### Stage 2 — Intake (a source + notes under it) → ◆ Checkpoint (feel)
- The intake flow: pick/enter a **source** (`SourcePicker` autosuggest), jot pieces under it — **each a loose text bit carrying that `source_id`**; a quote is formatted as a blockquote, a thought as prose (rich text does it).
- Rework `inbox/actions.ts` (`quickAdd` → source-aware) · **remove** the bookmark auto-behavior + `createBookmarkBit`.
- Each captured piece is a **full loose bit** — taggable, rich text, sourced — from birth.

### Stage 3 — The views → ◆ Checkpoint (the inbox is a *designed* browse surface)
- **The inbox:** rework its rendering (bookmark-centric → notes-with-source cards; **triage**: `TagBar` inline · open→workspace · trash). Still the `the_inbox` view.
- **The source view:** "everything from this source" — group by `source_id` (a per-source page, and/or grouped in the inbox).
- **The sources-list:** your reading list (clone the tags page).

### Later (own tracks)
- **Place-on-a-board (call-in)** — route a loose bit onto a board (the pipeline; the earlier Slice 3).
- **Gather** — the `[[` feature (data layer live, D-101).

---

## 6. Model-safety gates (run at each data-touching stage)
1. **Invariants named** (I-Src: source optional · one per bit · a named citizen · rename-once · grouping by id). 2. **Trace** a source through create · edit · **rename-source** · **delete-source** (`set null` — bits survive, lose the source) · trash/restore/destroy the bit — no blank cells. 3. **Lowest layer:** the FK + `name_ci` unique in the DB; single-set logic in one db-module fn. 4. **One source of truth:** the `source` record (bits point by id — rename-once, no duplication). 5. **End-to-end proofs:** migration converts existing data · source round-trip · RLS · grouping returns exactly the bits with that source.

## 7. Honest scope & sequencing
**This is a pivot, not an addition** (§2 callout): it re-architects capture over three-day-old applied work — migrating away D-100's columns, superseding `capture-build-plan.md` after Slice 1, and reversing its visual-bookmark decision. That's a legitimate refinement, but it needs the owner's conscious yes on the deliberate loss (§2) first. Bigger than one slice (source-first-class + rich text + tag-anywhere + the workspace + intake + the views) — but **mostly cloning proven code** (tags, the editor, `TagBar`, the bit page). **The migration is where the real risk lives** (§4, the six review findings) — all of it caught on paper at Stage 0, then on the throwaway copy, before real data. **Docs first (replan), then rebuild.** The schema change goes through **prove-on-a-copy → you approve**; code through `pnpm build` + typecheck; you feel-test on the deploy.

## 8. Deferred / open
Rich formatting beyond quiet (headings · colors · fonts) — held, owner may un-hold · **image-as-source** (noting from an image — URL/name sources first) · **search-by-source** (grouping by `source_id` is cheap and *is* in scope; full-text search *over* source strings is the deferred search-column work, still deferred) · place-on-a-board · Gather — own tracks.
