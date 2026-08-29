# The organize phase + the feature queue — THE live plan

**What this is:** the single place that holds (1) the app's surface map + terminology, (2) the reorganize work, and (3) the ordered queue of every feature on deck. **When the owner has a scattered idea-dump, it gets filed HERE and reflected back — this doc absorbs the mess so the owner never has to manage it.** Owner + Claude, 2026-08-20.

---

## 1 · The map (the app's whole shape — record of the 2026-08-20 sort)

| Kind | Surfaces |
|---|---|
| **Rooms** — where your things live | **boards** · **notes** (the bits view) · **✎ write** (the text-forward room) |
| **Lenses** — ways to look across everything | **find** (the ledger + the pull) · **graph** |
| **Housekeeping** — rarely visited | tags manager · sources manager · trash · export · sign out |
| **Detail pages** — each thing's own page | a board's canvas · a note's page · a source's page |
| **Acts** — verbs placed *next to their room* | new board · ✎ write · jot (notes' quick box) · sign out |
| **Future rooms** (IA holds space; don't rebuild home for them) | the feed (Phase 6) · public/shared views (publishing) · document mode |

**The three flows:** catch (jot · write · drop on a board) → arrange & grow (boards · gather) → return (find · graph · browsing notes).

**Grouping — three different jobs, three tools (owner's insight, ruled):**
- **Groups + pins** = *the shelf* — how home is arranged (a board lives in ONE group; pin floats to top). Arrangement, like x/y on a canvas — NOT a knowledge primitive.
- **Tags** = *meaning* — many per thing, cross-cutting bits AND boards; the pull retrieves.
- **Hub boards** = *craft* — a canvas holding board-doorways + notes, arranged by hand (board-cards exist in schema, UI dormant).

## 2 · Terminology (swept 2026-08-20; lexicon is the authority)
- **gather** = the `[[` act (never "linking"/"document mode").
- **document mode** = RESERVED, unbuilt: the future board-as-flowing-text (its design round is the entry gate).
- **notes** = the surface (D-113); `the_inbox` stays the view's technical name.
- **The atom's everyday word = "note"; "bit" = the model/technical word.** *(Assumed default — owner may flip to "bit"/"fragment" anytime; sweep labels then.)*

## 3 · Phase O — ORGANIZE (now, in order)
- **O1 · Home = the shelf.** *(Owner's clarify rulings 2026-08-21: a **quiet picker per board** — pick-or-type-new, no manage screen, groups exist because boards name them · pins on **boards AND notes** in one pass · **owner-ordered groups**.)* **Built 2026-08-22 (from the GitHub working copy — Documents locked again):** migration `20260822000001_shelf.sql` — a tiny `shelf_group` table (name unique-per-owner · owner-ordered `position` · owner RLS) + `board.group_id` (ON DELETE SET NULL — deleting a section strands nothing) + `board.pinned_at` + `bit.pinned_at` + the `home` view recreated so `b.*` carries the new columns. **Proven on a throwaway: `run-shelf-native.sh` — 10/10** (create/unique · assign · set-null survival · pins stick · home carries · stranger sees zero/writes land on zero/cross-owner insert refused · anon blind). App: `lib/db/shelf.ts` (one door) · home renders the **Shelf** (★ pinned → groups in your order with ↑/↓ → ungrouped; per-row group picker with "+ new group…" · ★/☆ pin · trash) · notes float pinned first + ★/☆ on cards and rows · `shelf_group` joins the export lockstep (I-G1). **⛔ GATED: cloud apply (backup → atomic → verify) needs the DB URL (in the locked .env.local) — then the app code ships.** Deploy order matters: migration FIRST (the app queries `shelf_group`; deploying early would 500 home).
- **O2 · Notes = the bit-first view.** *(Owner ruled 2026-08-21: FULL view — search + type filters like the board panel; sorts = newest · oldest · recently edited.)* **Detailed plan (code-proofed):** the page stays server-rendered but fetches `listAllBits` (the loose page already derives from it — F19, one definition) + pre-signs image thumbs, and hands everything to a new client `NotesBrowser`: **tabs loose (default, the current grid unchanged) | all** (`?view=all`, linkable) · in-memory **search** (face + body + source + tag words — the panel's ruled A22 pattern) · **type filters** (notes / images / sketches) · **sorts** newest (default) / oldest / recently-edited (`updated_at`). On "all," placed bits show **"on 〈board〉" links**; **place-on shows only for loose bits** (offering it on placed bits = the multi-board door, deliberately parked A20); trash works everywhere; the jot box stays on top of both tabs. Reuses `InboxCard` (a `showBoards` prop) + the panel's tab CSS. *Scale note: images pre-signed for the whole set — fine at one-writer scale, revisit with A22.*
- **O3 · ✎ write shows its superpower.** The quiet `[[` hint + verify the gather button is in the toolbar (thumb-reachable on the Daylight).
- **O4 · Terminology sweep** — every label/confirm/empty-state consistent with §2; per-page navs mirror the home hierarchy.
- **O5 · Internal-health check** — verify "the mess is only surface-level" (file ceilings, dead code, doc drift) rather than assert it.

## 4 · PHASE V — the VISION BUILD (re-sequenced after D-118; supersedes the old F-queue head)

- **V1 · Home mocks — the desk & the cabinet.** 2 static variants of the D-118 home: the **desk** (what's ALIVE — boards + notes your hand marked — then your folders, starred first) + the **cabinet** (a quiet sidebar/drawer: bits · all boards · all notes · find · graph · tags · sources · trash · export · sign out). Rows quiet (controls on hover/tap). Screenshot → the owner picks. NOTHING builds unmocked.
- **V2 · The kind marker + terminology.** Migration `bit.kind` ('bit' default · 'note'); ✎ write births notes; ~~a quiet kind-toggle on the thing's page (promote old writings)~~ **← the toggle was RETIRED by D-121 (a thing never changes type; kind is fixed at birth).** Renames: the browse surface → **bits** (`/notes`→`/bits`, redirects kept), **notes** becomes the pieces room, UI says **alive** (the owner's word) where it said pinned. Throwaway-proven → owner's go → cloud. Absorbs **O4** (the sweep rides the renames).
- **V3 · Build the picked home** — desk + cabinet + notes room, per the winning mock, through the loop.
- **V4 · The rail + the broom (planned 2026-08-26, from the O5 audit).** Order safest-first, each step build-verified before the next:
  1. **(b) `lib/dates.ts`** — one `fmt` + `ago`; replaces 4 hand-rolled copies (desk · bit page · notes room · note-row).
  2. **(c) `signThumbs()`** in `lib/storage` — replaces the copy-pasted thumb-signing loops where the shape is identical (bits page · group page; board pages checked first, left if their shape differs).
  3. **(d) ONE folder-picker** — `components/folder-picker.tsx` (presentational: groups · value · onChange(idOrNull) · "+ new group…" prompt); the Shelf (boards) and note-card (bits) both use it; their db calls stay their own.
  4. **(a) THE EVERYWHERE-RAIL** — `components/rail.tsx` + an `AppShell` in the root layout (skipped on /login): the cabinet everywhere, **collapsible** (⟨/⟩; localStorage; default collapsed on /board · /bit · /write routes so canvases breathe, expanded on browse routes). Then the **11 duplicated page headers slim** to title + page-specific actions only (nav rows deleted — the rail owns navigation). Home switches to the shared rail.
  5. **(e) the board-surface surgery LAST** — 699 → ~350: extract `use-create-doors` (spawns · findClearSpot · evaporate · paste) + `use-bulk-acts` (bulk/trash/unplace); orchestration + render stay. Proven by build + the named flow-traces (create · double-tap · paste-text · image doors · evaporate · bulk trash/remove · pinch · move-together). Remaining overage noted honestly.
  - **NOT included (awaiting the owner's ruling, not silently folded):** filtering written notes out of `/bits`.
  Then **O5 signs off** + docs re-synced, closing the phase.
- **Then, owner-ordered:** the **privacy/publishing session** (urgent-ish per the product ruling) · the owner's **re-voice pass** on philosophy + the language book · then the surviving F-queue: collections/board-tagging · voice+PDF (B7) · papers · fonts · the big rooms.

## 4b · PHASE N — the note as a surface + the flows' gaps (sequenced 2026-08-26)

Ordered so each item lands on ground the previous one cleared. Each gets its own **detailed plan → owner nod → build** (the loop) when reached; the notes below are *just enough to justify the sequence*. Full flows + technical background: `user-flows.md`; the whole model: `model.md`.

- **N1 · Note re-surfacing (FIRST — the headline correctness fix). ✅ BUILT + deployed (owner feel-test passed 2026-08-26).** New `/note/[id]` writing-surface page (action-bar off the writing · title + editor central · quiet footer) · both-way guards (`/bit`↔`/note` by kind) · note links repointed (notes room · desk tiles + folders) · write-end collapsed to "saved · open →" (mid-write place door dropped) · **trash a note from the notes room** · rail tucks on `/note`. **No schema.** Kills "a note feels like a bit" + the delete gap in one pass. Plan: `note-as-surface-plan.md`.
- **N2 · `board-surface.tsx` breakdown. ✅ DONE + deployed (owner: "things work", 2026-08-26).** 699→362: extracted `use-create-doors` (335) + `use-board-acts` (98), logic verbatim, behavior unchanged (owner canvas-tested). *Alongside (owner-driven offshoots, same day):* a board **terminology sweep** ("note"→bit/card/text where it meant a fragment) and the side column **redesigned into the "drawer"** — one panel, primary tabs **bits · notes · all** (by `bit.kind`), placement filtering kept as a "where" dropdown (default unplaced). **Terminology mode set:** owner spot-checks their screen + flags, Claude fixes; new work uses correct terms from the start (no token-heavy app-wide greps). *(Was task #8.)*
- **N3 · Note-on-board = a document doorway card. ✅ BUILT + deployed 2026-08-27.** A `kind==='note'` branch in `card.tsx`: a page-shaped doorway (~200×260 default, resizable, aspect-locked) → opens `/note`; `kind` reaches the card via `getBitMeta` (board-load) / `bringIn` / born-as-bit. No schema (uses `placement`). Owner-tested ("yes it seems to work").
- **N4 · Find: kind filters + labels. ✅ BUILT + deployed 2026-08-28 (owner: "all good").** `/find` now spans bits · notes · boards — a kind-tab row (all/bits/notes/boards) + a per-result badge (board · note · text/image/doodle). `findItems` merges bit-search (words, kind-filterable) + board-search (title, via `board.search_tsv`); tags polymorphic. **Refined same day (owner UX):** search made **instant** (load-once → client-side filter, `find-live.tsx`; ~1000-item server-search trigger noted) · tag chips **toggle** to clear · placeholder fixed. Search covers a thing's **full text** (a note's whole body/writing + captions), not just titles; **not** tags (those are the chips) and **not** a board's contained bits (title-only, by design). **No schema.**
- **N5 · Notes: archive decision + build.** ⚑ Decide *archive = a distinct resting state vs. just trash*; if distinct, a small schema add (`archived_at`) + a room control. Owner rules the concept first.
- **N6 · Gather a board / a source inline.** Extend `reference` to point at a board (`to_board_id` + CHECK — the A15 shape) and/or a source; the `[[` picker + chip render the new targets. **Schema add**, throwaway-proven, owner-gated.
- **N7 · Onboarding (design-heavy, own round).** First-run: detect empty owner → a seeded starter board or a guided intro; `onboarded` flag. Uses `user-flows.md` Arc 0 as the curriculum. After the surfaces are correct.
- **Parked, each its own phase:** phone capture (5) · the reference-threaded graph (evidence-gated) · document-mode (design round) · publishing/guest layer. **Design track runs in parallel** (`aesthetics-phase.md`: the bold indigo/Gzhel identity + papers into the app).

## 4c · PHASE S — HOME = YOUR SURFACES (the landing redesign; settled 2026-08-29)

**The idea, plainly:** when you land, you're in your studio — you see the surfaces you compose on (your **boards** and **notes**) together, with what you're actively working on floated to the top. No more split between a curated "desk" and separate "all boards" / "all notes" rooms — they merge into one home. **Bits** (your material) stay their own room; **find** stays the content search.

**Why this revises the V-phase:** V1–V3 made home the *desk* (only what's alive), with completeness pushed to the cabinet's two separate lists. The owner's call: home should show *everything*, with curation as the **ordering** (alive first) — not a separate screen. So home now carries the full list too. The cabinet rail stays; it just stops holding "all boards" / "all notes" as separate rooms.

**Two kinds of looking, kept distinct** (names RULED 2026-08-29; full plan: `find-and-search-plan.md`):
- **Search** (renamed from "Find") — the *broad* look: content-level, global ("which thing *has* X in it") — over bits + notes' full text. **Not** board titles, **not** a board's contained bits.
- **Jump to** — the *targeted* look: title-level, on a list ("take me to the board named X"). Instant, titles only, box reads "Jump to a board…". *Not "filter" (= category-narrowing by tag/kind), not "sort" (= ordering).*
- **Filtering** (tags · notes/boards) is a *refinement*, not a third look — already exists, unchanged.

**Two organizing axes, kept distinct (don't blur them):**
- **Alive** (★) — top-of-mind; you mark it, it floats to the top (later: onto the home canvas).
- **Folders** — how things are filed; the categorical grouping in the list.

### S1 · Search & Jump-to (FIRST — done + bowed before home) — plan: `find-and-search-plan.md`
The owner's priority: finish *both kinds of looking* cleanly before touching home. Two parts:
- **Search = content only** — boards drop out (tabs → **all · bits · notes**); plus the **find→search rename** (route + nav label, redirect kept). `lib/db/find.ts` + `find/page.tsx` + `find-live.tsx`. Trim proofed clean against the code.
- **Jump to** — one *shared* title-matcher mounted on today's boards list (`shelf.tsx`) and notes list (new `notes-list.tsx`); the home surfaces list inherits the same piece in S2 (no new code then). Reuse arch: Search = one home (`lib/db/find.ts`); Jump-to = one shared piece across all lists (owner deferred to Claude).
Full technical steps, proof, and the naming ruling live in `find-and-search-plan.md`.

### S2 · The surfaces list = home (the structural core)
Home (`/`) becomes ONE list of boards + notes together: **alive first**, then the rest, with a **filter (all · boards · notes)** and a **title search**. Folders group the list. `/boards` and `/notes` redirect into it. The rail's "all boards" + "all notes" collapse to home-is-surfaces (+ keep **bits**). Bits stay their own room (material, not a surface). Each row carries its kind's own controls (board: folder-picker · ★ · trash; note: ★ · trash) — both action sets already exist.
- **Open forks for the owner (settle before building S2):** (a) folders shown as **sections** (Shelf-style) or **chips you open** (Desk-style)? · (b) keep a direct "just boards" / "just notes" via `/?view=…` so old links land pre-filtered?

### S3 · The alive canvas on top (LATER — its own build)
A spatial top strip: star a surface → it lands on the home board → drag to arrange. Needs three named pieces first: **board-as-a-card doorways** (activates the dormant hub-board UI — §1) · the **BoardThumbnail** (v1 = titled card, no visual; live re-render later — never stored screenshots) · the **"alive = placed on the home board"** model decision. Designed now so there are no surprises; built after S1–S2. Both boards and notes are draggable cards up there (owner's pick).

**Empty home = the first impression.** A brand-new user has no surfaces, so home is empty on first run — that's onboarding's job (**N7**), and this arc feeds it: home's empty state should invite the first board / first note.

## 5 · The item loop (the workflow — owner-defined, 2026-08-21)
For EVERY queue item, in order, no skipping:
1. **Pull** the next item from this doc.
2. **State the CONCEPTUAL GOAL first, and check it** (owner-added 2026-08-26): before any planning, say plainly *what we're trying to do and why* — the goal and the concept, NOT the implementation — and get the owner's confirmation. Nothing proceeds until the goal is agreed.
3. **Clarify** — ask the owner the questions that change the build (only real forks, not paint shades).
4. **Plan in detail** — written down (here or the item's own doc).
5. **Check the plan** — proof it against the current code (read, don't assume).
6. **Clarify again** — anything the proof surfaced.
7. **Build per plan** — improvise nothing.
8. **Check the build** — tsc + lint + build green + trace the flows; schema = throwaway-proven first, cloud on the owner's "go."
9. **Hand to the owner to test** — deploy + a concrete feel-test list. Then record (D-log + docs same-session).

The owner's only standing jobs: answer clarifying questions + "needs owner" calls, feel-test, and dump ideas — filing them is Claude's job.
