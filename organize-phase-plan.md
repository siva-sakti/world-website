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

- **N1 · Note re-surfacing (FIRST — the headline correctness fix). ✅ BUILT + deployed (owner feel-test passed 2026-08-26).** New `/note/[id]` writing-surface page (action-bar off the writing · title + editor central · quiet footer) · both-way guards (`/bit`↔`/note` by kind) · note links repointed (notes room · desk tiles + folders) · write-end collapsed to "saved · open →" (mid-write place door dropped) — ⚠ **the "saved · open →" half never actually shipped; recorded here as done for a year. Caught by the flow review 2026-09-02 (F6) and built then** · **trash a note from the notes room** · rail tucks on `/note`. **No schema.** Kills "a note feels like a bit" + the delete gap in one pass. Plan: `note-as-surface-plan.md`.
- **N2 · `board-surface.tsx` breakdown. ✅ DONE + deployed (owner: "things work", 2026-08-26).** 699→362: extracted `use-create-doors` (335) + `use-board-acts` (98), logic verbatim, behavior unchanged (owner canvas-tested). *Alongside (owner-driven offshoots, same day):* a board **terminology sweep** ("note"→bit/card/text where it meant a fragment) and the side column **redesigned into the "drawer"** — one panel, primary tabs **bits · notes · all** (by `bit.kind`), placement filtering kept as a "where" dropdown (default unplaced). **Terminology mode set:** owner spot-checks their screen + flags, Claude fixes; new work uses correct terms from the start (no token-heavy app-wide greps). *(Was task #8.)*
- **N3 · Note-on-board = a document doorway card. ✅ BUILT + deployed 2026-08-27.** A `kind==='note'` branch in `card.tsx`: a page-shaped doorway (~200×260 default, resizable, aspect-locked) → opens `/note`; `kind` reaches the card via `getBitMeta` (board-load) / `bringIn` / born-as-bit. No schema (uses `placement`). Owner-tested ("yes it seems to work").
- **N4 · Find: kind filters + labels. ✅ BUILT + deployed 2026-08-28 (owner: "all good").** `/find` now spans bits · notes · boards — a kind-tab row (all/bits/notes/boards) + a per-result badge (board · note · text/image/doodle). `findItems` merges bit-search (words, kind-filterable) + board-search (title, via `board.search_tsv`); tags polymorphic. **Refined same day (owner UX):** search made **instant** (load-once → client-side filter, `find-live.tsx`; ~1000-item server-search trigger noted) · tag chips **toggle** to clear · placeholder fixed. Search covers a thing's **full text** (a note's whole body/writing + captions), not just titles; **not** tags (those are the chips) and **not** a board's contained bits (title-only, by design). **No schema.**
- **N4b · The drawer on the note page + gather from it (one drawer, three homes).** *(Owner-asked 2026-08-28; sequenced before N5.)* **The goal:** a note being written gets the same drawer a board has, and clicking a row **gathers** that thing into the writing — the browsable second door to `[[` (`[[` = you know what you want and stay in the sentence; the drawer = you want to *look*). **The reuse (the owner's ruling — reuse first, small emendations):** the drawer and `find-live.tsx` are already two hand-rolled implementations of one idea and have drifted (the drawer matches face+source+tags, find matches full text; both hand-roll `.includes()`); the note page would be the third. So extract at the second-copy moment, not before: (1) **`lib/search.ts`** — ONE `matches(text, q)`, the single definition of partial-word matching, called by the drawer, find, and the gather picker (which today matches face only); (2) **one row component** — face-or-thumbnail + "from 〈source〉" + "on N boards" + kind badge; (3) **one `<Drawer>` shell** shared by board + note page (identical shape), parameterized on the tabs, the "where" scope, and `onPick`. **Find keeps its own page chrome** (full width, tag chips, boards in scope) and shares the matcher + the row — forcing find into an aside would contort it; the *feel* is shared, not the layout. **Two tiers stay as built:** drawer = title+source+tags where you are · find = full text across everything. **The one real risk:** gathering from the drawer must insert the chip **at the caret** — the drawer sits outside the tiptap instance, so the editor handle has to be lifted (or a small insert callback passed down); solve it in the detailed plan before building. **No schema.** **⚑ BUILT 2026-08-28, awaiting the owner's feel-test** (branch `worktree-find-and-search-plan`): one `lib/search.ts` for every box (partial words + **full text everywhere** — owner ruled, which deleted the planned reach-dial) · the drawer **moved** to `components/drawer.tsx` with a board|note variant · gather-from-the-drawer on `/note/[id]`. A planned shared-row step was **dropped** (drawer and find rows share zero markup — abstraction with no second copy). Typecheck/lint/build green; the caret feel + the fixed drawer's look are the owner's test. **Full plan + build record: `drawer-on-the-note-page-plan.md`.**
- **N4c · The last save gap — a hard tab-close.** *(Opened 2026-08-28, after the save-guard work; LOW urgency, listed so it isn't forgotten.)* **What's already fixed:** every debounced writer (a note's body · titles · board cards · `/write`) now flushes on unmount and on `visibilitychange:hidden` + `pagehide` (`lib/save-guard.ts`), and the note says "saving… / saved". **What remains:** on a genuine tab-close the browser may kill the in-flight request — exposure is now *milliseconds*, not the old 350–600ms, and only on that one path. **The fix if we take it:** give the browser Supabase client a custom `fetch` (`createBrowserClient(url, key, { global: { fetch } })`) that adds `keepalive: true` **only while the save guard is firing** — a module flag the guard raises and lowers. It must stay conditional: `keepalive` caps the body at **64KB**, so a long note would fail outright if it were always on; the wrapper falls back to a normal fetch above that. *(Rejected: `navigator.sendBeacon` — it can't carry the auth headers cleanly and would mean hitting the REST endpoint raw, around the one db door.)* **Recommendation: don't build this yet.** The residual risk is small, the fix adds a fetch wrapper with a size gotcha to every request in the app, and the cheaper mitigations (a shorter debounce, a flush on editor blur) are available if it ever actually bites. Re-enter if the owner loses writing to a tab-close.
- **N5 · Archive — CONCEPT RULED (owner, 2026-08-29).** Archive = **hide-but-keep**: it clears clutter but **never deletes**; it goes to its **own archive area** you can pull things back out of. **Distinct from trash** (trash = weeding, its own place, *can* be emptied → D-125). Build (its own): `archived_at` on bit/board · hide archived things from the live surfaces (home · search · the pull) · an **archive** area (like `/trash`) · archive/unarchive controls. Small schema, throwaway-proven, owner-gated.
- **Functional-gaps queue (owner: functional first, then the spatial desk — 2026-08-29):** ✅ **empty-trash / destroy (D-125)** → ✅ **`/write` trash (D-126)** → **archive** (N5, above) → **gather a board / source into a note** (N6; owner leaning yes) → *search covers source names/URLs* (small; today search misses the `source` attached to a bit) → **publishing/sharing** (its own design-heavy session — the public/private plumbing exists at the DB, no publish act built). Then the **spatial desk** (H4).
- **THE GAPS ROUND (owner-ruled 2026-09-02, from Claude's inside-the-code observations — all owner-accepted):**
  1. **PHONE CAPTURE** — *"something we need to have for sure."* The app exists to catch what you
     consume, and consuming happens on a phone; today the likely only path is open-site → log in →
     find the box. Wants: a real capture door (share-sheet / installable / shortcut — the flow
     review is naming what exists). **The highest-value gap in the app.**
  2. **LOST SIGNAL** — *"we need to think about"*: nothing survives a dropped connection today; for
     a capture tool, losing a thought in a tunnel is the worst failure. Offline/draft-safety.
  3. ✅ **UNDO — SHIPPED (D-137, 2026-09-01).** ↶ ↷ on the board toolbar + ⌘Z/⌘⇧Z: every
     deliberate act (moves · resizes · nudges · tidy · send-to-back · lock · remove · trash ·
     tags · source) reversible, capped 20, per-visit, buttons name their next act. Built dark
     floor-by-floor with two antagonist rounds + the owner's soak before any button existed.
     Plan + full record: `board-undo-technical-plan.md`. OWED: the owner's label-wording pass.
  4. ✅ **A RECENT SECTION — BUILT (D-134), migration owed to the owner.** "where you were": the
     last 5 surfaces you OPENED, on home, across devices. New `opening` table (its own — the
     `updated_at` trigger on bit/board would have made opening look like editing). **The A7 check
     came back CLEAR:** A7 is a *bit's* travel between boards; this is where the *owner* has been —
     no overlap, nothing spent. Words in `lexicon.md` (an opening · where you were).
     **Owner: paste `20260903000001_opening.sql`, then deploy.**
  5. **THE FOUR-DOORS TAX** — four capture doors (`/write` · `/bits` intake · board paste · file
     door) force a "which door?" decision. Owner: *"you're right about the tax and I think the UI
     can help solve that"* — a UI answer, not a model change.
  6. **SEARCH's ceiling** — client-side over everything, instant now, a known cliff. Owner asked for
     the approach; Claude's answer: cheap step (load less per bit) → real fix (use the `search_tsv`
     GIN index already built and maintained; the query grammar translates to tsquery). Trigger:
     ~1000 bits or a slow /search load. Not now.
  *(Note→bit division: the owner is working it in the OTHER window — not this track.)*

- **OLD EMPTY BITS — tracked (owner, 2026-09-01, post-D-138):** with evaporate retired, empty
  cards persist by ruling — but bits from BEFORE the change (or edge leftovers of the old
  sweeps) may sit in the DB as blank strays. Owed: a small audit (count empty-bodied text bits;
  loose vs placed), then the owner decides — leave them (they're legitimate cards now), surface
  them for hand-cleaning, or a one-time offered cleanup. Can wait; tracked so it can't be lost.

- **THE FRAME (owner idea, 2026-09-01 — filed from the reference-screenshots conversation):**
  an **optional page-shaped frame summonable onto any board** — NOT a second board mode. The
  board stays the free infinite canvas; the frame is a fixture on it: its edges/margins/center
  join the snap-guide candidates (the geometry-registry machinery, trivially composable), cards
  drift in/out freely, per-board and stored (tiny owner-gated migration), and someday the
  natural boundary for EXPORTING a board as a finished image (what the reference artist is
  literally making). Key fact that shaped it: object-to-object snapping needs NO page — the
  frame adds *edges to compose against*, which is the real thing the owner saw in the
  references ("alignment exists, but the composition is deliberately loose"). **Sequence:**
  after the guides land; either side of the input-engine phase. **Owner rulings for its loop:**
  size presets vs freeform pull-to-size · one frame or several · visibility toggle wording.
  **Adjacency flag:** runs near the other window's composition thread (notes as composition
  surfaces) — board-territory, doesn't touch that model, but the windows must not drift.
  **Owner also re-affirmed (same conversation): magnetic stickiness matters → the input engine
  (own the drag) stays the committed next phase after registry+guides.**

- **ACCOUNTS + PRIVACY + STORAGE — the owner's shape (2026-09-02), input to the other window's
  privacy/publishing session (its ④, the great unblocker) — NOT built here until that session rules:**
  the owner sees accounts as *part of* the convergent-surfaces thread — *"if we have accounts, people
  can be editors on each other's convergent surfaces and share stuff with each other simply and
  easily and send stuff to each other."* So the sharing model is **collaborative-adjacent** (editors
  on a surface + person-to-person sending), not just publish-to-web. **Business shape ruled:** self
  first · accounts · **freemium — free until a limit, then premium** (candidate limits: total
  storage, and/or a per-file cap); the actual numbers are open and want real usage data
  (`positioning.md` §8 holds the storage-cost thinking). **Claude's standing note:** the DB is
  already structurally multi-user (per-row ownership + a proven guest door), so accounts is a signup
  door + product decisions, not a rebuild.

- **Basic-acts queue (owner idea-dump, 2026-09-01 → settled + built same day):** **duplicate a board** ✅.
  The model fork RULED: the copy's cards point at the **same bits** — a second arrangement of the
  same material (bits are the atoms; placements are cheap; deep-copying would double material and
  pollute search/tags). **What copies:** title + " copy" · visibility · folder (sits beside the
  original) · every LIVE placement's x/y/w/h/z/display-size, with **fresh arrived_at** (the new
  arrangement's own birth — travel history is the original's story, not copied). **What doesn't:**
  the ★ (a copy isn't alive until you say so) · departed legs · connectors (no create-UI exists yet —
  when arrows arrive, duplicate must learn placement-id remapping). Failure cleanup: placements
  failing after the board row lands → the half-copy is deleted, error surfaced. Door: the home row's
  quiet ⧉ (board rows only). I-L1 safe by construction (fresh rows on a fresh board; the source's
  live placements are already one-per-bit). **The survey the owner asked for:** boards already have
  rename · pin/alive · folder · archive · trash/restore/destroy · fit/zoom · multi-select · the
  drawer — with duplicate, the table-stakes set is genuinely complete; board-tagging/collections
  and board→template are already queued elsewhere (V-queue · the ideation window's templates
  thread), nothing else missing found. Boards: bowed.

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

### S2 · The surfaces list = home (the structural core) — full plan: `home-surfaces-plan.md`
Home (`/`) becomes ONE place: **alive** on top, then **all your surfaces** (boards + notes) as one list — kind tabs (all·boards·notes) · **folders ⇄ flat** · a **sort** (alive-first · A→Z · created · modified) · the shared **Jump-to** · per-row controls (reused from the Shelf). Boards & notes **dissolve into tabs** — no separate rooms; `/boards` `/notes` redirect to home; the rail drops them. Folders **drill in inline** (accordion; `/group/[id]` kept as a deep-link). The list is **collapsible + remembered** (collapse = just your desk). Bits stay their own room. **Forks resolved** (owner, 2026-08-29): tabs not separate rooms · folders drill-in inline · sorts added. Ordered build H1 (merged home) → H2 (collapse) → H3 (fold in the rooms); the **spatial desk is H4 / the next phase** (S3).

### S3 · The alive canvas on top (LATER — its own build)
A spatial top strip: star a surface → it lands on the home board → drag to arrange. Needs three named pieces first: **board-as-a-card doorways** (activates the dormant hub-board UI — §1) · the **BoardThumbnail** (v1 = titled card, no visual; live re-render later — never stored screenshots) · the **"alive = placed on the home board"** model decision. Designed now so there are no surprises; built after S1–S2. Both boards and notes are draggable cards up there (owner's pick).

**Empty home = the first impression.** A brand-new user has no surfaces, so home is empty on first run — that's onboarding's job (**N7**), and this arc feeds it: home's empty state should invite the first board / first note.

## 4d · ARCHIVE REACHES EVERY BIT (owner-flagged 2026-09-02, while testing the archive fix)

**The owner's words:** *"I was just checking the archive and I'm guessing by home you mean from the
loose bits page — the problem is I don't think we have a way to archive directly from the loose bits
page. We have trash, we have multi-select, we have all that, but we don't have archive."*
Earlier ruling, same day: *"every bit should be able to be put away — and by put away we mean
archiving and/or trash. They should all be treated the same way… simple, moving throughout the whole
app, for it to be the same way."*

**Verified first — the data path ALREADY WORKS end to end. This is a missing button, not a missing
mechanism, and needs no migration:**
`archiveBit` stamps `archived_at` → the generated `state` column becomes `'archived'` →
`listAllBits` filters `.eq("state","live")` (`db/inbox.ts:28`) so the bit LEAVES `/bits` →
`archive_listing` selects `state='archived'` (`20260830000002_archive.sql:7`) so it APPEARS in
`/archive` → `unarchiveItemAction` reverses it. Nothing else to build underneath.

**What is actually missing — the control, in two places:**

| # | Where | Work |
|---|---|---|
| 1 | **Bulk on `/bits`** — beside the existing bulk trash in the selected-bar (`notes-browser.tsx:271-287`) | a server action `archiveBits(ids)` mirroring `trashBits` (`bits/actions.ts:198-215`) line for line, + one button |
| 2 | **`/bit/[id]`** — the bit's own page has NO archive control at all | one line: `<ArchiveButton thing="bit" id={b.id} returnTo="/" />`, exactly as `/note/[id]:60` already does |

(A *per-row* control on the list is deliberately NOT proposed: multi-select already covers it, and
every row gaining a third verb makes the list noisier for no new power.)

**Terminology finding, owner's call.** The app had TWO words for this act: the live control says
**"archive"** (`archive-controls.tsx:70`); the dead `BitArchive` deleted in this session's stage A
said **"put away" / "take back out"**. With the dead one gone the live vocabulary is "archive" —
used here unless the owner rules otherwise. (`lexicon.md` governs; worth a line there either way.)

**No confirm dialog**, matching the existing single archive button: archive is reversible and
non-destructive, unlike trash (which does confirm, and should). Flagged as a choice, not an oversight.

**Risk: low.** No schema change, no migration, no new pattern — the server action is a copy of a
proven one, and the button already exists as a component. **Proof:** the four gates, then the owner:
select bits on `/bits` → archive → they leave the list → they appear in `/archive` → take one back
out → it returns.

## 4e · ALIGN & DISTRIBUTE BUTTONS (owner-raised 2026-09-02)

**→ Now specified as part of the whole family in `card-alignment-spec.md` (§1 piece 3, §9 step 4).** The
owner widened the ask the same day to include a background grid; the spec covers tidy · guides ·
align/distribute · the grid together, because they compete for the same drop and needed one
precedence rule. What follows is the original capture.


**The owner:** *"usually what I see, like for example PowerPoint, they have like a range vertical,
range horizontal, center — you know what I mean, you press those buttons so we don't have to guess."*

**It is a THIRD thing, and the board has neither of its siblings covering it:**
| | what it does | who drives |
|---|---|---|
| **tidy up** (built) | rearranges a selection into a uniform grid | the button decides everything |
| **snap guides** (stage 4, next) | helps YOUR HAND land straight while dragging one card | the hand |
| **align / distribute** (MISSING) | takes cards already placed and makes an edge or centre match — no grid, no dragging | the button, but non-destructively |

**Why it is cheap:** the maths is far simpler than snapping (min / max / mean of the measured
edges), it reuses the geometry ledger that already exists, and it records as ONE undo entry
exactly the way `recordTidy` already does. The likely set: align left · centre (vertical axis) ·
right · top · middle · bottom, plus distribute-evenly horizontally and vertically.

**Open questions for when it is planned:** where the controls live (the selected-bar only shows
for a SINGLE card today — this needs the multi-select toolbar); whether "centre" means the
selection's own bounding box or the average; whether locked cards are anchors or excluded.

**Sequencing note:** it shares the ledger and the undo shape with stage 4, so it is cheapest
built right AFTER the guides while that code is open — but it is genuinely independent, and
nothing in stage 4 depends on it.

## 5 · The item loop (the workflow — owner-defined, 2026-08-21)
For EVERY queue item, in order, no skipping:
1. **Pull** the next item from this doc.
2. **State the CONCEPTUAL GOAL first, and check it** (owner-added 2026-08-26): before any planning, say plainly *what we're trying to do and why* — the goal and the concept, NOT the implementation — and get the owner's confirmation. Nothing proceeds until the goal is agreed.
2b. **NAME IT, before any planning** (owner-ruled 2026-08-28, after archive was built unnamed): the concept gets **clear language first**, and that language then carries — *concept → the word → the docs → what is actually built* — one chain, the same words at every link.
   - The word goes into **`lexicon.md`**, the ruling into **`agreements.md`**, the always-true rules into **`invariants.md`**, the reasoning into **`deliberations.md`**. Not afterwards; *before* the code.
   - **No word gets invented in a button label.** ("put away" was — it reached a UI, a migration comment and two plan docs without ever being ruled, and the feature was unclear precisely because nobody had decided it.)
   - The test that this step actually happened: **grep the lexicon for the concept.** `gather` scores 9; `archive` and `drawer` scored 0 while both were already built and deployed-adjacent.
   - The build then uses those words verbatim — in the UI, the db functions, the comments. Step 8 checks it.
3. **Clarify** — ask the owner the questions that change the build (only real forks, not paint shades). A question about implementation is not a question about the concept; don't let one wear the other's costume.
4. **Plan in detail** — written down (here or the item's own doc).
5. **Check the plan** — proof it against the current code (read, don't assume).
6. **Clarify again** — anything the proof surfaced.
7. **Build per plan** — improvise nothing.
8. **Check the build** — tsc + lint + build green + trace the flows; schema = throwaway-proven first, cloud on the owner's "go." **Plus the language check: do the UI, the db functions and the comments use the ruled word from 2b, or did a synonym creep in?**
9. **Hand to the owner to test** — deploy + a concrete feel-test list. Then record (D-log + docs same-session).

The owner's only standing jobs: answer clarifying questions + "needs owner" calls, feel-test, and dump ideas — filing them is Claude's job.
