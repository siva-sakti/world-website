# The feature inventory — what exists, and how well

**What this is:** every feature in the app, walked one at a time, with an honest mark on how finished it actually is and what's wrong with it. Not a plan (that's `build-queue.md`), not a technical manual (`SPEC.md`), not the words (`lexicon.md`) — **this one answers "what's there right now, and where are the rough edges."**

Written 2026-08-28 by walking each surface in the code. Re-walk it after any phase closes; a stale inventory is worse than none.

**Marks:** ✅ built and whole · ⚠️ built with a named gap · 🚧 half-wired · ❌ known missing

---

## How to read the findings

Findings are numbered **F1…** and collected at the bottom with severity. Two of them (**F1**, **F3**) are **classes**, not instances — the same mistake in several places. Those matter most: fixing one instance and calling it done is how they survive.

**F7–F12 came from two adversarial audits** run against the code on 2026-08-28 (one technical, one logical — reasoning in `deliberations.md`). They found things a walkthrough by the author did not, including a claim in *this document* that was simply false (F7). Re-run that kind of audit rather than trusting a self-review.

---

## 1 · Rooms — where things live

### The desk (`/`) ✅⚠️
Home. What's **alive right now** (starred boards + notes) followed by your folders. Rail on the left for everything else.
- ⚠️ **F1** — archived notes still appear inside folders here. The desk queries `kind='note'`, `deleted_at null` and nothing else.

### A board (`/board/[id]`) ✅⚠️
The infinite canvas: pan/zoom, cards (text · image · doodle · note-doorway), pen, multi-select, marquee, move-together, paste-to-create, image drop. **Six create doors**, not one (+ text · double-tap empty canvas · paste text · paste image · + image · drag-drop file · pen Done). The most developed surface in the app.
- Save on leaving is now covered (F6 fixed this session).
- ⚠️ **F8 — reading writes.** Selecting a card to look at it calls `patchCard` with a new z (`board-surface.tsx:130`) — it writes `placement.z` and re-stacks your board. Clicking to read changes your data.
- ⚠️ **F9 — typing resizes, permanently.** When rendered text gets tall enough the card auto-widens 80px and persists `placement.width` (`card.tsx:129-136`), with no gesture the owner would recognise as a resize.

### The drawer (on a board, and now on a note) ✅
One component, two homes. Tabs bits · notes · all; a "where" scope on boards; search; type/tag/source filters; lazy thumbnails. Click **places** (board) or **gathers** (note).
- ⚠️ **F1** — shows archived notes.

### The notes room (`/notes`) ✅
Your written pieces, newest-edited first. Title · opening words · date. Hides archived, with one link to see them.
- The **only** surface that respects archive.

### The bits browser (`/bits`) ✅⚠️
Every bit, card or list view, search + filters + sorts, jot box on top.
- ⚠️ **F1** — shows archived.
- ⚠️ **F2** — written notes are not filtered out of `/bits`; the plan records this as **awaiting your ruling**, not an oversight.

### ✎ write (`/write`) ✅
Born-on-first-content. Title + rich text + `[[` gather. Saves at 600ms; now flushes on leaving and on the page being hidden.

---

## 2 · Detail pages

### A note's page (`/note/[id]`) ✅
The writing surface: action bar (★ · place on a board · **put away** · trash), title, editor, quiet footer (dates · source · tags · "gathered into" · boards). **New this session:** the drawer, and "saving… / saved".

### A bit's page (`/bit/[id]`) ✅
A fragment's sheet: its face, tags, boards it's on, where it's been. Guards both ways with `/note` by kind.

### A source's page (`/source/[id]`) ✅ · A folder's page (`/group/[id]`) ✅
Both handle a missing record with `notFound()` — checked.

---

## 3 · Lenses

### Find (`/find`) ✅
Across bits · notes · boards. Kind tabs, toggling tag chips, instant client-side filtering, full text, partial words.
- Correctly does **not** hide archived — that's the point of archive.
- Note results route via `/bit/[id]`, which redirects to `/note/[id]`. Works, one extra hop.

### Graph (`/graph`) ❓
Read-only reference graph. **Not walked this session** — I have not verified it against the current schema. Marked unknown rather than assumed fine.

---

## 4 · Acts

### Gather (`[[` and the drawer) ✅
A chip in the body is the truth; `reference` rows are a derived index reconciled on save. Two doors, one act. Duplicate ties refused at the DB. Backward "gathered into" reads live gatherers only.

### Capture / jot ✅ · Tag ⚠️ · Source ⚠️
Jot box (notes + bits rooms), intake with source + tags. Tag bar on bits and boards; tag manager with rename/merge/delete. Source manager with rename/edit-URL/delete/merge. All show their errors.
- ⚠️ **F10 — bulk mutation of your bits, hidden behind vocabulary management.** Merging two sources rewrites `bit.source_id` across an unbounded set of bits (`sources.ts:206`); deleting or merging a tag cascades `tag_application` rows off every carrier **including trashed bits**. None of this is visible from any bit's own page, and the scale isn't stated at the moment of the act.

### Place / call-in ✅
Loose notes onto a board, via the drawer or the inbox door. Insert-or-revive; travel survives a return.

### Star ("alive") ⚠️
Boards, notes, and folders can be starred to the desk.
- ⚠️ **F3** — fails silently (see below).
- ⚠️ **F11 — starring a put-away note is impossible and says nothing.** `pinBit` (`shelf.ts:117`) sets `pinned_at` without clearing `archived_at`, which the DB check refuses; the error is swallowed (`note-card.tsx:70`). The star simply never fills, forever. Both audits named this the sharpest live defect. *(Moot while archive is reverted — returns the moment archive does, so the fix belongs in archive's own loop: starring should mean "I'm working on this," and un-archive.)*

### Put away / archive 🚧 **NEW, and the least finished thing here**
Three states at the DB (live · archived · trashed), proven 8/8 on a throwaway.
- 🚧 **F1** — implemented in **one room out of five**. See the finding.
- ⚠️ **F3** — the control fails silently.
- ❌ Not applied to the cloud; not testable until you apply the migration.
- ❌ Only notes. Bits, images, doodles and boards cannot be put away.

### Trash / restore ✅⚠️
Un-place and trash are distinct, labelled acts. `/trash` lists both kinds with restore.
- ✅ **F7 — CLOSED by D-138 (2026-09-01).** Its own question — "is the copy wrong, or the evaporate?" — was answered: **the evaporate was**; the owner retired it and empty cards persist. Destroy now has exactly ONE caller (`src/app/actions.ts` — /trash only, double-confirmed, D-125), so "nothing is destroyed outside the trash" is true. *(Historical note kept: the 2026-08-28 copy-vs-code catch was real.)*
- ❌ **Empty-the-trash does not exist** — long-standing, deliberate.

### Export ✅
`/api/export` returns every record kind as JSON plus signed URLs. Proven to read all 9 kinds.
- ⚠️ Media is linked, not bundled — a full zip was always "later".

### Folders / groups ✅ **(completed this session)**
Create, rename by naming, reorder ↑↓, star, and now **delete** — with an honest confirm counting boards *and* notes.
- ⚠️ **F3** — every folder control fails silently.
- ⚠️ **F4** — the folder-delete count includes archived notes.

### Save ✅ **(hardened this session)**
Debounced writes everywhere, now flushed on unmount, on tab-hide, on app-switch and on close, via one `lib/save-guard.ts`. The note's writing says "saving… / saved".
- ⚠️ **F5** — a hard tab-close can still drop the last request (filed as N4c, with a recommendation not to fix yet).

### Dead columns ⚠️
**F12** — five columns are carried in the schema and in `/api/export` with **zero write paths anywhere in the UI**: `bit.visibility`, `bit.subtype_word_id`, `bit.url`, `bit.captured_title`, `placement.display_size`. Nothing sets them. Some are known (`captured_title` is documented as dead-but-present since D-102); the rest are not. Worth a deliberate keep-or-drop rather than drift.

### Auth ✅
Login wall, RLS at the boundary. A logged-out client sees zero rows — asserted every harness run.

---

## 5 · The findings

| # | severity | finding |
|---|---|---|
| **F1** | **high** | **Archive leaks — a CLASS.** Only `/notes` filters `archived_at`. A put-away note still appears in: the desk's folders · the board drawer · the `[[` picker · `/bits` · the folder-delete count. "Put away" currently means "hidden from one room out of five." Mine, this session. **Needs your ruling first** (below), because the fix depends on what archive means. |
| **F3** | **medium** | **Silent failure — a CLASS.** Four controls catch their error, `console.error` it, and show the user **nothing**: renaming a board (`board-title.tsx`), starring/foldering a note (`bits/note-card.tsx`), every folder control (`shelf.tsx`), and **putting a note away** (`BitArchive` — mine). Offline or a failed write looks identical to success. Everything else in the app does show its errors, so this is drift, not a house style. |
| **F4** | low | The folder-delete confirm counts archived notes among what "comes out of the folder". Falls out of F1. |
| **F2** | — | `/bits` shows written notes as well as bits. **Awaiting your ruling**, already recorded in the plan. Not a bug. |
| **F5** | low | A hard tab-close can drop the final in-flight save. Filed as N4c with a reasoned recommendation not to fix yet. |
| **F7** | ✅ closed | Answered by D-138: the evaporate was the wrong half — retired; empty cards persist; destroy lives only in /trash behind the double confirm. |
| **F8** | medium | **Reading writes.** Selecting a card to look at it re-stacks the board and writes `placement.z`. |
| **F9** | medium | **Typing resizes.** Text growing past a threshold permanently widens the card, with no resize gesture. |
| **F10** | medium | **Bulk mutation hidden behind vocabulary management** — one dropdown pick rewrites `source_id` across unbounded bits, or cascades tag rows off every carrier including trashed ones. Invisible from any bit's page; the scale is never stated. |
| **F11** | — | Starring a put-away note is impossible and silent. **Moot while archive is reverted**; returns with it, so it belongs in archive's loop. |
| **F12** | low | **Five dead columns** carried in schema and export with zero write paths. Deliberate keep-or-drop rather than drift. |
| **F6** | — | *(Fixed this session — the three save holes.)* |
| **?** | unknown | The **graph** was not walked. Unverified against the current schema. |

## 6 · The ruling F1 is waiting on

**Should "put away" mean gone from every working surface, or gone from the notes room but still reachable when you're deliberately looking for something?**

It matters because it's genuinely two different features:
- **Gone from everywhere** — archive is a real "out of my way". But then you cannot gather a piece you archived, and finding it in `/find` is the only way back.
- **Gone from the notes room only** — archive is "not in my index", and archived work stays available to build on.

I have not guessed. F1 stays open until you rule.
