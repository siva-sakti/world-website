# Home = your surfaces (the merged home) — plan

**STATUS: H1–H3 BUILT + deployed (D-124, 2026-08-29).** The linear merged home is live; `/boards` `/notes` redirect in; old pages retired. **H4 (the spatial desk) is the next phase.**

**What/why:** the concept + rulings live in `organize-phase-plan.md` → Phase S and `model.md`; this is the *build* plan. Home stops being a separate "desk" **plus** two list rooms — it becomes ONE place: your **alive** things on top, then **all your surfaces** (boards + notes) as one list — filterable, sortable, searchable, in folders. Bits stay their own room. **Settled with the owner 2026-08-29.**

## The shape (top to bottom)
```
home
 ├─ DESK — what's alive        (linear now; spatial ⇄ list toggle is the NEXT phase)
 └─ YOUR SURFACES   (the list — collapsible + remembered; collapse = just your desk)
     controls:  all · boards · notes  |  folders ⇄ flat  |  sort ▾  |  [ Jump to a board or note… ]
     FOLDERS view: folders (starred first · ↑↓ · ★ · click to drill in, inline) → unfiled below
     FLAT view:    one stream, sorted
```

## Settled decisions (owner)
- Boards & notes **dissolve into home as tabs** — not separate rooms, not click-in pages. `/boards` `/notes` → redirect to home.
- **Alive** shows in **both** the desk and the list (alive-first) — so the list stays genuinely complete.
- **Drill into a folder = expand inline** on home (accordion); the folder's page `/group/[id]` stays as a deep-link.
- **Sort (owner ask):** **alive-first** (default) · **A→Z** · **newest created** · **newest modified** — a small sort control.
- Each surface keeps its **own controls in the row**: board → FolderPicker · ★ pin · trash; note → FolderPicker · ★ pin · trash.
- **This build is the LINEAR home.** The spatial desk (drag cards · board thumbnails · star-to-place · "alive = on the home board") is the NEXT phase — not now.
- Collapse the list → just the desk; **default expanded, remembered per person** (the rail's pattern). Bits stay off home.
- UX is deliberately **flexible** (owner: controls are fine as long as they're functional) — the toggles stay, quiet and working.

## Reuse (all confirmed present in the code)
- `lib/db/shelf.ts`: `pinBoard`/`pinBit` · `setBoardGroup`/`setBitGroup` · `moveGroup`/`deleteGroup` · `pinGroup` · `createGroup` · `listGroups`.
- `components/folder-picker.tsx` — presentational, kind-agnostic (parent owns the db write).
- `components/jump-to.tsx` — the shared name-jump; **home wraps its list in it** (the reuse we promised — home inherits Jump-to; word-start title match).
- `lib/db/boards.ts` `listBoards` (HomeBoard: `title` · `group_id` · `pinned_at` · `touched_at`); notes = `bit` where `kind='note'` & not deleted (`content` · `face` · `group_id` · `pinned_at` · `updated_at` · `created_at`).
- Trash: the board trash action (Shelf's `trashBoardAction`) + `BitTrash` for notes.

## A unified row type (client)
`Surface = { kind:'board'|'note', id, title, href, group_id, pinned_at, created_at, modified_at }` — `page.tsx` maps boards+notes → `Surface[]`; the list **dispatches each row's controls by `kind`** (board vs bit actions).

## The ordered build (each shippable + verified)
**H1 — the merged home.**
- New `app/home-surfaces.tsx` (client): the controls row (kind tabs · folders⇄flat · sort · reuses `<JumpTo>` wrapping the list) · FOLDERS view (folder header: name→drill-in accordion, count, ★ `pinGroup`, ↑↓ `moveGroup` · members sorted) → **unfiled** below · FLAT view (one sorted stream) · each row = title link + per-kind controls (FolderPicker→`setBoardGroup`/`setBitGroup` · ★→`pinBoard`/`pinBit` · trash).
- New `app/desk-alive.tsx`: trim `desk.tsx` to the **alive** section only (folders leave for the list); a linear list now (spatial toggle = next phase).
- `app/page.tsx`: fetch boards+notes+groups → build `Surface[]` → render `<DeskAlive/>` + `<JumpTo items=… placeholder="Jump to a board or note…"><HomeSurfaces/></JumpTo>`.
- **Keep `/boards` `/notes` untouched in parallel** (safety net until the list is proven).
- Verify: home shows alive + the full list; tabs · sort · folders/flat · drill-in · jump all work; every control fires; empty states.

**H2 — collapse + remember.** Wrap the list in a remembered collapse (localStorage — the rail's exact pattern); header `your surfaces · N ⌄` / collapsed `› your surfaces · N`; **when the desk is empty, keep the list open** (never a blank home). Verify.

**H3 — fold in the rooms.** Redirect `/boards` `/notes` → `/` (`next.config.ts`); rail drops "all boards"/"all notes" (home is it now); retire `app/boards/page.tsx` + `app/notes/page.tsx` + `app/shelf.tsx` (its logic now lives in `home-surfaces.tsx`). **Keep `/group/[id]`** (deep-link). Verify: no dead links/imports · typecheck + build.

**H4 — LATER (its own phase):** the spatial desk (drag · thumbnails · star-to-place · the "alive = on the home board" model decision).

## Empty states
- **No surfaces** (new owner): a gentle "make your first board / ✎ write your first note".
- **Nothing alive**: the desk says so; the list still carries everything (and stays open, H2).

## Verify each step
tsc + build + lint (0 errors) + **trace every control** (pin · folder move · group ↑↓/★/delete · trash · drill-in · tab · sort · jump); owner feel-test; the redirect (H3) lands **only once the list is proven**.
