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
- **V2 · The kind marker + terminology.** Migration `bit.kind` ('bit' default · 'note'); ✎ write births notes; a quiet kind-toggle on the thing's page (promote old writings). Renames: the browse surface → **bits** (`/notes`→`/bits`, redirects kept), **notes** becomes the pieces room, UI says **alive** (the owner's word) where it said pinned. Throwaway-proven → owner's go → cloud. Absorbs **O4** (the sweep rides the renames).
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

- **N1 · Note re-surfacing (FIRST — the headline correctness fix).** New `/note/[id]` writing-surface page (reuse `TextWorkspace`/`TagBar`/`SourcePicker`/`listGatheredInto`, re-arranged writing-first) · point all note links at it · redirect `/bit/[id]`→`/note` for `kind='note'` · clean the write-end · **trash a note from the notes room**. **No schema.** Kills "a note feels like a bit" + the delete gap in one pass. Plan: `note-as-surface-plan.md` (steps 1–4, 6, 8).
- **N2 · `board-surface.tsx` breakdown (the deferred hygiene item — sequenced HERE).** 699→~350: extract `use-create-doors` + `use-bulk-acts`. Pure refactor, plan-first, full flow-trace. Done *before* N3 so the note-on-board render lands in clean board code. *(Was task #8.)*
- **N3 · Note-on-board = a document doorway card.** A `kind==='note'` branch in `card.tsx`: an 8.5×11 paper-shaped doorway (default, resizable) → opens `/note`. **No schema** (uses `placement`). Builds on N2.
- **N4 · Find: kind filters + labels.** `/find` gains notes·bits·boards filters + a per-result label. **No schema.** Small, independent, high-value.
- **N5 · Notes: archive decision + build.** ⚑ Decide *archive = a distinct resting state vs. just trash*; if distinct, a small schema add (`archived_at`) + a room control. Owner rules the concept first.
- **N6 · Gather a board / a source inline.** Extend `reference` to point at a board (`to_board_id` + CHECK — the A15 shape) and/or a source; the `[[` picker + chip render the new targets. **Schema add**, throwaway-proven, owner-gated.
- **N7 · Onboarding (design-heavy, own round).** First-run: detect empty owner → a seeded starter board or a guided intro; `onboarded` flag. Uses `user-flows.md` Arc 0 as the curriculum. After the surfaces are correct.
- **Parked, each its own phase:** phone capture (5) · the reference-threaded graph (evidence-gated) · document-mode (design round) · publishing/guest layer. **Design track runs in parallel** (`aesthetics-phase.md`: the bold indigo/Gzhel identity + papers into the app).

## 5 · The item loop (the workflow — owner-defined, 2026-08-21)
For EVERY queue item, in order, no skipping:
1. **Pull** the next item from this doc.
2. **Clarify** — ask the owner the questions that change the build (only real forks, not paint shades).
3. **Plan in detail** — written down (here or the item's own doc).
4. **Check the plan** — proof it against the current code (read, don't assume).
5. **Clarify again** — anything the proof surfaced.
6. **Build per plan** — improvise nothing.
7. **Check the build** — tsc + lint + build green + trace the flows; schema = throwaway-proven first, cloud on the owner's "go."
8. **Hand to the owner to test** — deploy + a concrete feel-test list. Then record (D-log + docs same-session).

The owner's only standing jobs: answer clarifying questions + "needs owner" calls, feel-test, and dump ideas — filing them is Claude's job.
