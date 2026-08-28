# The drawer on the note page + gather from it — the detailed plan (N4b)

**What this is:** the item plan for **N4b** in `organize-phase-plan.md` — the drawer reaching the note page, clicking a row **gathering** into the writing, and the one-drawer extraction that makes it honest. Owner-asked 2026-08-28; sequenced before N5. Written against the code at `origin/main` (8f4ac0d), read not assumed.

---

## 1 · The goal (the concept, before any implementation)

**A note being written gets the same drawer a board has, and clicking a row gathers that thing into the writing.**

It is the **browsable second door to `[[`**. The two doors are two different moods, not two buttons for one thing:

- **`[[`** — *you know what you want.* Type it, stay in the sentence, never leave the writing.
- **the drawer** — *you want to look.* You don't remember the words; you want to see what you have.

This is the same pair the board already has (drag a bit onto the canvas, *or* pull one from the drawer). The note page is the surface that's missing its half.

**The owner's build ruling:** reuse first, small emendations. The drawer and `find-live.tsx` are already two hand-rolled implementations of one idea, and they have **already drifted**. The note page would be the third copy. So extract *now* — at the second copy, not before it, and not after three.

---

## 2 · What's already true (verified in code, not assumed)

| Claim | Where | Verdict |
|---|---|---|
| Partial-word search already works | `find-live.tsx` + `loose-column.tsx` both filter with `.includes()` | ✅ already live |
| Find covers bits · notes · boards, full text | `findItems` / `FindItem.searchText` = content + body + face | ✅ N4 |
| The drawer has kind tabs + a "where" scope | `loose-column.tsx` KINDS / SCOPES | ✅ N2 offshoot |
| The drawer handles loading + error + empty + no-match | `loading` · `error` ("Couldn't load your drawer.") · two empty states | ✅ |
| A note can gather | a note is born `createLooseTextBit(…, kind:'note')` → `type='text'`; `reconcileReferences` requires `type==='text'` | ✅ passes |
| Self-gather is guarded at the db | `reconcileReferences`: `wanted` drops `id === fromBitId` | ✅ |
| Trashed things never appear | `listAllBits` filters `deleted_at is null` | ✅ |
| The rail sits left and tucks on `/note/` | `rail.tsx` `TUCKED_ROUTES` | ✅ no collision with a right-hand drawer |
| The note page has a live editor to gather into | `/note/[id]` → `TextWorkspace` → `TextBit` (always editing) | ✅ |

**The two-tier reach stays exactly as built** — the owner described it and it is already the shape:

| | reach |
|---|---|
| **the drawer** (board, and now the note page) | face + source name + tag words — quick narrowing of what's near you |
| **find** (its own tab) | full text — a note's whole body, captions |

---

## 3 · The doors

### 3a · Doors IN — how the drawer opens

| home | closed state | opens by |
|---|---|---|
| board | the `loose-tab` pill, top-right, reading **drawer** | tap |
| **note page (new)** | the same pill, top-right | tap |
| find | — the page *is* the surface, always open | — |

Closed by the `×` in `loose-col-head`, both homes. State is per-mount (not remembered) — matches the board today; leave it.

### 3b · Doors OUT — what clicking a row does

| home | the act | the guard |
|---|---|---|
| board | **places** it on this board (`onBringIn` → `callInBit`) | rows already here render `is-here` |
| **note page (new)** | **gathers** it into the writing, at the caret | the note itself excluded; already-gathered rows marked |
| find | **goes** to the thing | a note's `/bit/{id}` redirects to `/note/{id}` (N1 guard) |

### 3c · Doors deliberately NOT opened in v1 — each with its reason

- **No "open the thing" link from a drawer row.** The primary click is the act. On the note page you gather, then **peek the chip** — the peek already exists (D-110). A second affordance on every row buys little and costs quiet.
- **No create-from-the-drawer.** The `[[` picker doesn't create either (`listGatherCandidates`: "existing bits only — v1 doesn't create from `[[`"). Same rule, same reason.
- **No gathering a board or a source.** `reference.to_bit_id` points at a **bit only**. Extending it is **N6** (`to_board_id` + CHECK, a schema add, owner-gated). So the note page's drawer shows **bits · notes · all** — no boards tab. Find keeps its boards tab because find *navigates*, it doesn't gather.
- **No multi-select gather.** One row, one chip. Bulk is unasked-for.

---

## 4 · The faces — what a row shows for each kind of thing

| thing | its face | badge |
|---|---|---|
| text bit | its `face` (the first words) | `text` |
| **note** (`kind='note'`) | its title (`content`), else its first words | `note` |
| image | the **signed thumbnail**, lazily signed, only for rows actually shown | `image` |
| doodle | its strokes, else the word "drawing" | `doodle` |
| faceless anything | the fallback ladder — an image's `file_name`, else "drawing", else italic "untitled" | its kind |
| board | its title | `board` — **find only** |

Under the face, the quiet meta line: **`from 〈source〉`** · **`on N boards`**. Tags as chips.

**A real drift to fix while here:** the drawer's `faceOf()` and find's `bitLabel()` are two different fallback ladders for the same job. They must become **one**.

## 5 · The states

| state | copy | already built? |
|---|---|---|
| closed | the "drawer" pill | ✅ board |
| loading | first open fetches | ✅ |
| error | "Couldn't load your drawer." | ✅ |
| empty overall | "No bits yet." | ✅ |
| nothing matches | "Nothing matches." | ✅ |
| **already acted on** | board: `is-here`. **Note page: "gathered" — NEW** | ⚠ new |

**The new one:** on the note page a row for something already gathered must say so — the mirror of the board's "on this board." Read it from the body's own chips via `extractRefIds(body)`, the existing one helper, so it can never drift from the truth. It updates as you gather.

---

## 6 · The guards — the model-safety trace, no blank cells

1. **Self-gather.** `listAllBits` does **not** exclude the current note (unlike `listGatherCandidates`, which takes `excludeId`). The note-page drawer **must filter its own id out** of the list. The db already refuses it; this keeps it off the screen.
2. **Only a text bit gathers.** `reconcileReferences` throws otherwise. A note is `type='text'` — verified above. Passes.
3. **Trashed things.** Excluded by `listAllBits`. A trashed *gatherer* is excluded from "gathered into" by the render rule. Covered.
4. **The same thing gathered twice.** Two chips in the body, one `reference` row (`extractRefIds` dedupes; the row is unique on from+to). **Allowed by design** — you may cite the same note twice in one piece of writing. Not a bug.
5. **A destroyed target.** Reconcile skips FK violations (`23503`). Covered.
6. **The caret — solved, not open.** The drawer sits outside tiptap. Two mechanisms, both already proven in this codebase:
   - the row does `onMouseDown={e => e.preventDefault()}` — the exact trick the rich-text `Toolbar` uses so the editor never blurs and keeps its selection;
   - `TextBit` focuses `"end"` on mount while editing, so a caret **always** exists even if the writer never clicked into the text. Worst case a chip lands at the end — never nowhere.
7. **A second insert path, not a reuse of the first.** `insertRef` replaces the typed `[[query` range (`{from: picker.from, to}`) and **requires an open picker**. Drawer-gather has no picker and replaces nothing — it inserts at the current selection. So: same `bitRef` node, same label-cache rule, **two callers**. Do not try to force one function.
8. **Reconcile timing.** Chip lands → `onChange` → 350ms debounce → `updateBitBody` then `reconcileReferences`. Leaving the page flushes on unmount (`TextWorkspace`). Covered.
9. **The board's wheel-stop is board-only.** The drawer stops `wheel` so the canvas doesn't zoom under it. Harmless but meaningless on the note page — keep it at the board call site, out of the shared shell.
10. **⚠ Layout — the one real unknown.** `.loose-col` and `.loose-tab` are `position: absolute`. On the board they resolve against the positioned viewport. The note page's `<main class="mx-auto max-w-2xl">` is **not positioned**, so absolute would resolve against the initial containing block and **scroll away with the writing**. The note page needs a **fixed** variant: right edge, full height (`100dvh`), safe-area aware (the app sets `viewport-fit=cover`).
11. **Mobile.** `.loose-col` is `260px / max-width 70%`. On a phone it must **overlay** the writing, not squeeze it. Check at build.
12. **The rail.** Left, tucked on `/note/`. The drawer is right. No collision.

---

## 7 · The shared pieces (what "reuse" concretely means here)

**Extract:**

1. **`lib/search.ts`** — one `matches(text, q)`: lowercase, trim, substring. **The single definition of partial-word matching.** Called by the drawer, by find, and by the **`[[` picker** — which today matches `face` **only**, so it gets a free upgrade.
2. **One label/fallback function** — `faceOf` and `bitLabel` reconciled into one ladder (§4).
3. **One row view-model** both sides map into:
   `{ id, kind, label, mediaType?, thumbUrl?, strokes?, source?, boards?, tags }`
   The row **renders what's present**. This matters: find holds up to 2000 items and deliberately does *not* fetch sources, boards, or thumbnails. Passing fewer fields keeps find cheap — the row degrades gracefully instead of forcing find to fatten.
4. **One `<Drawer>` shell** — shared by **board + note page** (identical shape), parameterized on: the tabs, the "where" scope, `onPick`, `alreadyMarked(id)`, `excludeId`, and whether to stop wheel events.

**Not shared: find's page chrome.** Find is full-width with tag chips and boards in scope; forcing it into a 260px aside would contort it. It shares the **matcher and the row** — the *feel* is shared, the layout isn't. *(This is a judgment call, flagged for the owner.)*

---

## 8 · Build order — each step verified before the next

1. **`lib/search.ts`** + point the drawer, find, and the `[[` picker at it. *Verify:* nothing changes visibly except the picker now matches more than the first line.
2. **The row + view-model.** Drawer and find both render it. *Verify:* board and find look and behave unchanged.
3. **The `<Drawer>` shell**, board switched onto it. *Verify the full board trace, behavior unchanged:* open · close · bits/notes/all tabs · the where-dropdown · type/tag/source filters · search · place-a-bit · `is-here` marking · lazy thumbnails · `refreshSignal` reload · wheel-stop.
4. **`TextBit` gains an optional `onReady(api)`** handing up `insertGather(hit)`. Additive — board cards pass nothing and are untouched.
5. **Mount the drawer on `/note/[id]`** — a small client wrapper holding the editor handle; the fixed-position CSS variant; `excludeId` = this note; already-gathered marking from `extractRefIds(body)`; click = gather at the caret.
6. **`pnpm typecheck` + `pnpm lint` + `pnpm build`**, then the owner's feel-test list.

**File ceiling:** `loose-column.tsx` is ~300 lines against the ~150 norm. The extraction is the moment to land the pieces under it; remaining overage noted honestly rather than hidden.

---

## 9 · The honest risks

1. **Focus/caret behavior can't be proven headless** — it's behind the login and it's a feel thing. The mechanisms are the codebase's own proven ones (§6.6), but the **owner's feel-test is the proof.**
2. **Extracting the drawer touches working board code** that N2 only just stabilized. The §8.3 trace is the guard; behavior-unchanged is the bar, not "it still compiles."
3. **The fixed-position variant** is the one genuinely new CSS. Desktop and phone both need a look.

## 10 · The owner's feel-test list (what to try when it deploys)

1. Open a note → the **drawer** pill, top-right. Tap it.
2. Type a few words in the writing, leave the cursor mid-sentence, tap a drawer row → **the chip lands where your cursor was**, and you can keep typing.
3. Tap a row without ever clicking into the writing → the chip lands **at the end**, not nowhere.
4. Gather something, then look at the drawer → that row now reads **gathered**.
5. The note you're in **does not appear** in its own drawer.
6. Search `budd` → "buddhism" things show (partial words).
7. Boards **don't** appear in the note page's drawer (that's N6) — but they still do in **find**.
8. Open a board → the drawer works **exactly as before**: place a bit, the where-dropdown, the tabs, thumbnails.
9. On the phone: the drawer **overlays** the writing rather than squeezing it.

---

# Part II · The engineering plan — exact files, exact signatures

Written against the code as it is. Every signature below is checked against the shapes it has to accept (`PanelBit` = `Bit & {source, tags, boards}`; `FindItem` = `{kind,id,label,mediaType?,tags,created_at,searchText}`; `BitHit` = `{id,face,type,thumbPath,storagePath,strokes}`).

## 11 · The file list

**New (4):**

| file | what it is |
|---|---|
| `src/lib/search.ts` | the one matcher + the one haystack builder |
| `src/components/thing-row.tsx` | the one label ladder + the row's shared inner markup |
| `src/components/drawer.tsx` | the drawer shell — board and note page both mount it |
| `src/app/note/[id]/note-workspace.tsx` | the note page's client wrapper: editor handle + drawer |

**Changed (7):**

| file | change |
|---|---|
| `src/app/board/[id]/loose-column.tsx` | becomes a thin board call-site of `<Drawer>` |
| `src/app/find/find-live.tsx` | uses `matches()` + the shared row body |
| `src/app/board/[id]/gather-picker.tsx` | uses `matches()` (today: `face` substring only) |
| `src/app/board/[id]/text-bit.tsx` | **additive** optional `onReady` handing up `gather()` |
| `src/app/bit/[id]/text-workspace.tsx` | **additive** optional `onReady` + `onSaved` pass-through |
| `src/app/note/[id]/page.tsx` | renders `<NoteWorkspace>` instead of `<TextWorkspace>` directly |
| `src/app/globals.css` | the `is-fixed` drawer variant |

**No schema. No new dependency.**

## 12 · `src/lib/search.ts` — the one matcher

```ts
/** THE definition of a search match, everywhere in the app: case-insensitive
 *  SUBSTRING — `budd` finds "buddhism" (the owner's ruling, 2026-08-28). Not
 *  word-stem: partial typing is how you search your own notes. An empty query
 *  matches everything (the ledger). */
export function matches(text: string, query: string): boolean;

/** Strip tags from rich-text HTML so a body is searchable as words. */
export function stripHtml(html: string | null | undefined): string;

/** What a thing offers up to be searched. Every surface builds one of these —
 *  the shapes differ (PanelBit · FindItem · BitHit), the fields don't. */
export type Searchable = {
  face?: string | null;
  content?: string | null;   // a text bit's title
  body?: string | null;      // rich-text HTML; stripped here
  fileName?: string | null;
  sourceName?: string | null;
  tagWords?: string[];
};

/** The two tiers, as ONE function with a dial (§7 "the knob"):
 *  "near" = face + content + fileName + source + tags — the drawer's quick narrowing
 *  "deep" = all of that + the stripped body — find's full-text reach */
export function haystack(s: Searchable, reach: "near" | "deep"): string;
```

Changing a tier later is now **one argument**, not four hand-written filters.

## 13 · `src/components/thing-row.tsx` — the label ladder + the row body

```ts
/** THE fallback ladder for a thing with no words — replaces the two that
 *  currently disagree (`faceOf` in the drawer, `bitLabel` in find). */
export function thingLabel(t: {
  kind?: "bit" | "note";
  type?: BitType;
  face?: string | null;
  content?: string | null;
  file_name?: string | null;
}): string;

/** What a row shows. Every field optional past the label — the row renders what
 *  it is given, so find can keep NOT fetching sources/boards/thumbs (it holds up
 *  to 2000 items; fattening it to match the drawer would cost real time). */
export type RowThing = {
  id: string;
  label: string;
  thumbUrl?: string;
  sourceName?: string;
  boardCount?: number;
  hereLabel?: string;   // "on this board" / "on this + 2 more"
  badge?: string;       // "note" · "board" · "doodle" — find shows it, the drawer doesn't
  tags?: { id: string; word: string }[];
};

/** The row's INNER markup only — face-or-thumbnail, "from 〈source〉", "on N
 *  boards", the badge. NOT the wrapper: the drawer wraps it in a <button> (it
 *  acts), find wraps it in a <Link> (it navigates). Forcing one wrapper would
 *  contort one of them; the inner shape is what actually repeats. */
export function ThingRowBody({ thing }: { thing: RowThing }): JSX.Element;
```

**Why the body and not the whole row:** the drawer's row is a `<button>` that *does* something; find's is a `<Link>` that *goes* somewhere. That difference is real, not incidental. Sharing the inside gives one look; sharing the outside would fight both.

## 14 · `src/components/drawer.tsx` — the shell

```ts
export function Drawer({
  variant,   // "board" | "note" — the two homes; see below
  exclude,   // (b: PanelBit) => boolean — the note page excludes ITSELF (§6.1)
  mark,      // (b: PanelBit) => string | null — the row's status word:
             //   board → "on this board"; note → "gathered"; null → none
  onPick,    // (b: PanelBit) => void | Promise<void> — place · gather
  refreshSignal?: number, // board only: the canvas says the set changed
}): JSX.Element;
```

**Four props, and `variant` rather than five booleans.** There are exactly *two* homes for this shell, and the differences between them are correlated, not independent:

| | board | note |
|---|---|---|
| position | `absolute` (a positioned canvas ancestor) | **`fixed`** (the note page's `<main>` isn't positioned — §6.10) |
| wheel events | stopped (or the canvas zooms under you) | not stopped |
| the "where" dropdown | shown (unplaced · this board · other · anywhere) | hidden — you're not placing |
| kind tabs · search · type/tag/source · thumbnails · loading · error · empty · no-match | identical | identical |

Inventing independent props for correlated facts would be the abstraction arriving before its second real case. Two homes, one `variant`.

**Everything else moves in unchanged** from `loose-column.tsx`: `listAllBits` load-on-first-open, `loadId` race guard, lazy thumbnail signing for shown rows only, the tag/source option lists derived from the loaded set, all four message states, the `loose-tab` pill.

## 15 · The gather handle — `text-bit.tsx`, additive

```ts
// TextBit gains ONE optional prop. Board cards pass nothing → untouched.
onReady?: (api: { gather: (hit: BitHit) => void }) => void;
```

`gather` is a **second insert path**, deliberately not `insertRef` (§6.7 — that one replaces the typed `[[query` range and needs an open picker):

```ts
// Insert at the CURRENT selection, replacing nothing.
editor.chain().focus()
  .insertContent({ type: "bitRef", attrs: { refId: hit.id, label } })
  .insertContent(" ")   // land the cursor after the chip, same as `[[`
  .run();
```

`label` uses the **same** cache rule as `insertRef` (`hit.face || "drawing" | "image" | "untitled"`) — extract that one-liner so the two callers can't drift.

## 16 · `note-workspace.tsx` — the note page's client wrapper

```
NoteWorkspace (client, new)
├── holds  gatherRef: (hit) => void          ← from TextWorkspace's onReady
├── holds  gatheredIds: Set<string>          ← extractRefIds(body), the existing helper
├── <TextWorkspace onReady onSaved />        ← two additive optional props
└── <Drawer variant="note"
           exclude={b => b.id === noteId}
           mark={b => gatheredIds.has(b.id) ? "gathered" : null}
           onPick={b => { gatherRef.current?.(b); setGathered(add b.id) }} />
```

**How "gathered" stays true without costing a keystroke:** `gatheredIds` refreshes on the body's **save** (the existing 350ms debounced `flush`, via a new optional `onSaved`) — not on every keypress — plus an optimistic add the instant you click a row. So the mark is right immediately and stays right, and the drawer doesn't re-filter while you type.

**The caret** (§6.6): the drawer's row does `onMouseDown={e => e.preventDefault()}` — the exact trick the rich-text `Toolbar` already uses — so the editor never blurs and keeps its selection. `TextBit` focuses `"end"` on mount, so a caret always exists.

## 17 · CSS — the one new rule

```css
.loose-col.is-fixed,  .loose-tab.is-fixed { position: fixed; }
.loose-col.is-fixed { top: 0; right: 0; height: 100dvh;
                      padding-bottom: env(safe-area-inset-bottom); }
```
On a phone the drawer must **overlay** the writing, not squeeze it (`max-width: 70%` already leans that way — confirm at build).

## 18 · The step-by-step, each verified before the next

| # | do | verify |
|---|---|---|
| 1 | `lib/search.ts`; point the drawer, find, **and the `[[` picker** at it | build green; the picker now matches past the first line — nothing else looks different |
| 2 | `thing-row.tsx`; drawer + find render `ThingRowBody`; delete `faceOf`/reconcile `bitLabel` | board rows and find rows **pixel-unchanged** |
| 3 | `components/drawer.tsx`; `loose-column.tsx` becomes the board call-site | **the board trace:** open · close · bits/notes/all · where-dropdown · type/tag/source · search · place a bit · `is-here` · thumbnails · `refreshSignal` · wheel doesn't zoom |
| 4 | `onReady`/`gather` on `TextBit`; `onReady`/`onSaved` on `TextWorkspace` | board cards + `[[` unchanged; typecheck green |
| 5 | `note-workspace.tsx` + the note page renders it + the `is-fixed` CSS | the §10 feel-test list |
| 6 | `pnpm typecheck` · `pnpm lint` · `pnpm build` | all green, then deploy for the owner's feel-test |

**Rollback shape:** steps 1–2 are pure extractions (no behavior); step 3 is the only one that touches working board code, and it is a straight move of `loose-column.tsx`'s body — if the board trace fails, revert that one commit and the note page still has nothing to lose.

**The file ceiling (~150):** `loose-column.tsx` is ~300 today. After the split: `drawer.tsx` carries the shell (the bulk), `thing-row.tsx` the row, `search.ts` the matching, and `loose-column.tsx` shrinks to a small board-specific call-site. Any remaining overage gets named honestly, not hidden.
