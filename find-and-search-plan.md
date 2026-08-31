# Search & Jump-to — the two kinds of looking (plan)

**Status:** NOT built yet. Concept + names + reuse architecture settled with the owner 2026-08-29. **Naming RULED:** the broad content tool is **Search** (renamed from "Find"); the targeted look is **Jump to**. This is the doc to follow when building. Sits under `organize-phase-plan.md` → Phase S.

---

## 1 · The concept — two kinds of looking, plus filtering (a separate thing)

- **Search** — the **broad** look (nav tool; renamed from "Find"). You don't know exactly where it is → search the **content inside** everything (a bit's text, an image/doodle's caption, a note's writing), across the whole collection. A **board never appears** in Search — it has no content of its own.
- **Jump to** — the **targeted** look. You **know** the thing exists and roughly its name → type its **title** to go straight to it ("Jump to a board…"), in the list you're already looking at. Titles only, never content. Scoped to the one list it sits on.
- **Filtering** (NOT one of the two looks — a refinement) — narrowing by a *category*: tags, or notes-vs-boards. Already exists (the board drawer's filters; Search's tag chips + kind tabs). This feature adds no new filtering; it's named here only to keep the three ideas distinct.

## 2 · Naming — RULED 2026-08-29
- **Search** = the broad content tool (nav). **Renamed from "Find"** — "find" retires as the word (the code/route rename rides this build; see §4). Box placeholder: **"search your words…"** (owner, 2026-08-29).
- **Jump to** = the targeted look. "Jump to" (the *act*) is settled. Box placeholder: **"Jump to a board…"** / **"Jump to a note…"** — never "search…" (that muddies it with the Search tool). *(Open: the umbrella **noun** for board+note — see §6 — needed only for the home list's placeholder, not these separate pages.)*
- **Filter** = category-narrowing (tags · notes/boards) — unchanged, a separate concept.
- **Retired words:** "Find" (→ Search), "list search", and "filter" as a name for the Jump-to box.
- These go into `lexicon.md` at build (name before code); DB view names (`the_ledger`, `the_pull`) are internal and stay.

## 3 · Reuse architecture (owner deferred to Claude; recorded so it stays active)
- **Search and Jump-to do NOT share a component** — different jobs (content-everywhere vs title-on-one-list). Owner-ruled.
- **Search has ONE home:** all content-search logic stays in the search db-module (`lib/db/find.ts`, renamed at build). The Search page uses it. Anywhere a content search appears later (a board's side panel, a note page, the graph) routes through that same module — never reimplemented.
- **Jump-to is ONE shared piece:** a single reusable title-matcher (a hook + a small input), used on **every** list — the boards list, the notes list, and the home surfaces list when it's built. The shared piece owns the input + the type-to-narrow-by-title logic; **each page keeps its own layout** (boards inside folders · notes flat · home merged). Justified now (not premature) because there are already ≥3 known consumers.

## 4 · Technical plan

**Part A — Search: trim boards out + rename find→search** (trim proofed clean 2026-08-29):
- *Trim:* `lib/db/find.ts`: `FindKind` → `all|bit|note`; `FindItem.kind` → `bit|note`; remove the `wantBoards` branch + `findBoards()` call from `findItems`; **delete** `findBoards()` + `BoardFindRow`; drop the now-unused `boardLabel` import; fix the three stale "…boards" comments. `app/find/page.tsx`: `kind` param accepts only `bit|note` (else `all`). `app/find/find-live.tsx`: drop the **board** tab from `KINDS`; drop the board branch in `badge()`; results all link `/bit/[id]` (remove the board-href branch). Do the trim + the `FindItem.kind` narrowing as one unit (or TS no-overlap errors).
- *Rename find→search:* the `/find` **route + nav label → "search"**, with a **redirect** `/find`→`/search` for old links; the ~3 internal `/find?tag=` links updated (rail · source page · word-graph). Module/function names swept to "search" where it reads cleanly (the shared db-module also serves the source view, so keep names accurate, not blindly renamed). The proof mapped every reference → surface known, low-risk. Verify with typecheck + build.

**Part B — Jump to** (one shared piece, mounted on the lists):
- New reusable title-matcher — one source of truth for how a typed title narrows a list. Placeholders "Jump to a board…" / "Jump to a note…".
- **Display (owner-ruled 2026-08-29):** while the box has text → a **flat list of matches** (folder grouping drops away — you're hunting by name), each match showing **its folder name in grey to the right** (if in one). **Empty box** → the page's normal view returns.
- `app/shelf.tsx` (boards list, already client): mount it; empty-box = today's Shelf (pins/folders/ungrouped) unchanged; typing = flat matches + grey folder tag; "No boards match" when nothing matches; keep the truly-empty early return distinct.
- `app/notes/page.tsx` (server today): pull the row list into a small client component (`app/notes/notes-list.tsx`) that mounts the matcher; empty-box = today's list; typing = flat matches + grey folder tag (pass the groups in so note→folder name resolves — tiny added fetch); "No notes match" state; keep "Nothing written yet".
- **Home surfaces list** (later): mounts the same matcher — no new code then; needs the umbrella noun (§6) for its placeholder.

## 5 · Proof
The Part-A plan was verified against the codebase (read-only agent, 2026-08-29): boards-in-Find is isolated (only `findItems → findBoards`), no `/find?kind=board` links exist, and export/graph/tests don't depend on it. Corrections it surfaced are folded into §4. Re-verify at build with typecheck + `pnpm build` + the named flow-traces.

## 6b · Follow-up — the search language + a clearer filter (owner feel-test, 2026-08-29)
First feel-test of Search surfaced two asks; both are **client-side only** (no schema, no server — the items are already loaded), so Search stays instant + exact.

**The search language (in the box) — a small operator set, matched in the browser:**
- **whole word by default** — "lit" finds the word *lit*, not "literature"/"split". (As you type, a word matches once complete.)
- **`word*`** — starts-with (the opt-in to broaden; prefix only, never mid/ends).
- **`"exact phrase"`** — words contiguous, in order (the universal convention).
- **`-word`** — exclude.
- **two words = both must appear** (AND).
- **a quiet `?` tips button** by the box → a non-intrusive popover listing the above with examples.
- *Why client-side, not Postgres FTS: the DB stems ("run"="running") — the opposite of the exact matching the owner wants.*

**The ⌗ filter panel (collapsible) — categories, out of the way:**
- Move **kind** (bits/notes) + **tags** off the front and into a panel behind a **⌗ filter** button (a dot on it when a filter is on); collapsed by default so the box is primary.
- Add a **date range** (from/to) — acts on **created** (when made); friendlier than typed date syntax.

**Defaults ruled (owner-informed):** date = created · `*` = prefix-only · the language is Search-only (Jump-to stays a plain title match).
**Files:** `lib/search-query.ts` (parse + compile matcher, pure) · `app/search/search-tips.tsx` · `app/search/search-filters.tsx` · `app/search/search-live.tsx` (orchestration).

## 6 · Open
- **Umbrella noun for board+note** — needed only for the *home* list's Jump-to placeholder ("Jump to a ___…"). Model word = **surface** (feels abstract for a user label); options: adopt "surface" · a warmer word · or spell out "board or note". **Not needed for this feature** (separate board/note pages). Settle with the home feature.
- On build: the word "search"/"jump to" is ruled into `lexicon.md` (authority done; sweep code + `SPEC.md` then), build per §4, record the receipt in `PROGRESS.md` (same session).
