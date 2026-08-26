# A note is a surface, not a bit — the re-surfacing plan

**What this is:** the plan to fix the model error the owner caught (2026-08-26): a **note** is a *surface* (a peer of a board), not a *bit* (an atom). Today it's surfaced as a bit. This is a **re-surfacing, not a re-architecture** — the data already supports it. Written to the owner's ask for "current state / ideal state / how you get there." Not built — for review.

---

## The model (settled with the owner)
```
bits           → atoms (fragments: a line, an image, a doodle)
boards, notes  → surfaces (peers); you compose bits into them
   · a bit joins a BOARD by placement  (spatial)
   · a bit joins a NOTE  by gather      (textual inclusion — same act, non-spatial)
```
The plumbing already matches: a board's members = its `placement` rows; a note's members = its `reference` rows.

## 1 · CURRENT STATE (read from the code, 2026-08-26)
- **Storage:** a note is a row in the **`bit` table** with `kind='note'`. Its writing lives in `bit.body`; the bits it gathers are `reference` rows. So structurally it *already is* "a writing surface with member bits" — it's just filed in the atom table.
- **Where a note is a peer today (already right):** born at `/write`; listed in `/notes` (the room) and on the **desk** (alive tiles); can be foldered · starred/alive · tagged · sourced · found · trashed — all free, because it's a bit.
- **Where it's surfaced as an atom (the bug):** **its "own page" is `/bit/[id]`** — the *same detail page every fragment uses*, rendered in this order: `type label → title → source picker → the editor → tags → gathered-into → "on these boards" (+ the place door) → travel`. The writing is buried in the middle of a metadata sheet. **There is no `/note/[id]` route.** A board, by contrast, has `/board/[id]` = a title + the canvas, writing/arranging front-and-center.
- **Net:** a note is *half* a peer (room, tiles, folders) but its detail page and URL present it as a fragment. That mismatch is the entire "it feels like a bit" problem.

## 2 · IDEAL STATE
- A note reads as a **surface, peer of a board, everywhere — especially its own page.**
- **Its own page = a writing surface** (mirror of the board's canvas page): the **writing is the main event**, big and central; its **gathered bits** (members) and **"gathered into"** shown as its connections; the atom-metadata (tags · source · dates · boards it's on) present but **quiet and secondary**. Opening a note should feel like opening a document, the way opening a board feels like opening a canvas.
- **Underneath, a note stays a bit.** This is deliberate: it keeps tags, find, trash, gather, export **for free** (no "two of everything" — the thing we explicitly don't want). `kind='note'` is the correct seam; we just stop *rendering* it as an atom. **The fix is presentation, not storage — no migration.**

## 3 · THE PATH (file by file; the core is small, one real decision flagged)
1. **New route `/note/[id]` — the note's surface page.** A writing-first layout reusing the existing parts (`TextWorkspace`, `TagBar`, `SourcePicker`, `listGatheredInto`, the gather-into read) — no new logic, just re-arranged: title + the editor large and central + its gathered bits + gathered-into, with tags/source/dates/boards as a quiet footer strip. (Matches `/board/[id]`'s shape.)
2. **Point every note link at `/note/[id]`** instead of `/bit/[id]`: the `/notes` room, the desk tiles, a gather chip whose target is a note, `/write`'s "open its page". `/bit/[id]` stays for fragments only.
3. **Guard `/bit/[id]`:** if it's hit for a `kind='note'` row, redirect to `/note/[id]` — old links and the shared page can never show a note as an atom again.
4. **Clean the write-end** (the cluttered status line the owner hit): a note born in `/write` shows a quiet "saved" + one door to its surface page; **drop the atom-flavored "place on a board" dropdown from the writing moment** (placing stays available later, from the board or the note's page — not mid-write).
5. **Note-on-a-board = a document-shaped doorway card (owner ruled 2026-08-26: option b).** A placed note is the *whole note as one unit* — a **stack-of-paper / 8.5×11 portrait** card (that default, resizable — NOT a little index card; it should read as a page) that **opens the note's surface** when clicked. Not raw text, not exploded bits. This is the bigger piece of the pass (the board must render a note-placement distinctly).
6. **Trash + management for notes** — the notes room gets a per-note trash (a note is trashable today, but only from its page); ⚑ decide whether **archive** is a distinct resting state or just trash.
7. **Find: kind filters + labels** — `/find` distinguishes notes · bits · boards (a filter + a small label per result).
8. **Label sweep:** nothing user-facing calls a note a "bit".

**Not needed:** any schema change; any data migration (0 notes exist today anyway). **Verified assumption:** every component the new page reuses already exists.

## 4 · How to verify
Build green + a walk: `/write` → saved → its page is a *writing surface*, not a metadata sheet · `/notes` and desk tiles open the surface page · an old `/bit/<noteId>` link redirects · tags/find/trash still work on a note (the free machinery held) · a gather chip to a note opens the note surface.

---

## N1 — DETAILED BUILD PLAN (goal confirmed + owner: actions housed off the writing, 2026-08-26)

**Design call (owner gave latitude):** a top **action-bar of icons** (not a 2nd sidebar — it'd squeeze the writing), writing full-width below, a quiet footer for read-mostly info. No action ever inside the writing.
```
[★ alive] [# tags] [⬈ place on a board] [⋯]        ← top action-bar (⋯ = source · make-a-bit · trash)
─────────────────────────────────────
Title (large, editable)
The writing  (editor, full-width, central)          ← the surface — no actions in here
─────────────────────────────────────
created · edited   ·   tags   ·   gathered into: …   ·   on boards: … (+ place door)   ← quiet footer
```

**Steps (no schema; reuse everything):**
1. **New `/note/[id]/page.tsx`** (server): load the note (if `kind!=='note'` → `redirect('/bit/'+id)`, the inverse guard) + tags/source/gathered-into/boards. Render `<NoteActions>` (top bar) + `BitTitle` + `TextWorkspace` + a quiet footer (`lib/dates`, `TagBar`, gathered-into, boards + `PlaceOnBoard`). Only new component: a thin `note-actions.tsx` arranging ★(`pinBit`) · tags · `PlaceOnBoard` · ⋯(`SourcePicker`·`KindToggle`·`BitTrash`).
2. **Redirect `/bit/[id]`→`/note/[id]` when `kind==='note'`** — the safety net catching *every* note link (chips, old bookmarks); a note can never render as a bit again.
3. **Point primary links at `/note`**: the `/notes` room · the desk note-tiles · `/write`'s "open its page" · the group page's notes. (Gather chips rely on the redirect — no change.)
4. **Clean the write-end**: QuickWrite → quiet **"saved · open →"**; drop the place-on-board dropdown + two-link clutter from the writing moment.
5. **Trash a note from the room**: a per-note trash control in `/notes/page.tsx` (reuse `trashBit`).

**New files:** `app/note/[id]/page.tsx` · `app/note/[id]/note-actions.tsx`. **Verify:** build green + walk (writing-central · quiet saved · trash from room · `/bit/<note>` redirects · a chip to a note lands on `/note`).
