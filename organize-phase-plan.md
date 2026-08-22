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

## 4 · Phase F — the FEATURE QUEUE (after O; owner may reorder anytime)
1. **F1 · Collections + board-tagging + hub-board doors** — tags get a folder-face (open #buddhism → its boards + writings together); the UI finally lets a board be tagged (a model promise never surfaced); a "place board on board" door for hubs.
2. **F2 · Voice memos + PDFs (B7)** — ruled IN by the owner 2026-07-25 and never built (the forgotten one). Media-types round: two new types + faces + search-by-source.
3. **F3 · Papers into the real app** — washi/linen/vellum + color on real cards (`placement.card_style/card_color/card_frame`, throwaway-proven, owner "go" gate). The designed studies are the spec (`aesthetics-phase.md`).
4. **F4 · Fonts mechanism** — curated faces, per-note choice, quiet picker (which faces = the design track's call).
5. **F5+ · The big rooms, owner-ordered when their moment comes:** publishing app-layer (still no way to publish) · phone capture loop (Phase 5) · the feed (Phase 6, deliberately designed) · document mode (design round first) · graph investment (evidence-gated). Small treats anytime: bulk-tag · crop · empty-the-trash · nightly-backup secret (owner's GitHub step).

**The design track runs in parallel** (aesthetics-phase.md): bold ONE-direction identity (owner leans indigo/Gzhel; awaiting her pick + images); chrome design in her design window.

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
