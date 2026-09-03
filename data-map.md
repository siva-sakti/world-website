# The data map — every action, and what it does to the stored data

**What this is:** the owner's-eye map of the data model as it ACTUALLY is (verified against
the migrations + `src/lib/db/*` on 2026-09-03, not from memory). One job: for each stored
thing — what actions exist, what gets written when, which dates mean what, and what is
deliberately NOT recorded. **Derived, never authoritative:** the schema
(`supabase/migrations/`) and `model.md` govern; if this file disagrees with them, this file
is wrong — fix it, not them.

---

## 1 · The three stored things (plus two small ones)

| thing | what it is | its own clocks |
|---|---|---|
| **bit** | the material itself — text, image, drawing, audio, pdf, link; `kind` says bit or note | `created_at` (birth) · `updated_at` (last edit) · `deleted_at` (in trash since) · `archived_at` (in archive since) · `pinned_at` (starred since) |
| **board** | a canvas | same five clocks as a bit |
| **placement** | the JOIN — "this bit sits on this board, here" — one row per bit-per-board | `arrived_at` (first landed) · `left_at` (departed; null = still on) · `updated_at` |
| tag / bit_tag | a word, and which bits carry it | trivial |
| **opening** | "the owner opened this board/note" — the recent trail | `opened_at` only — deliberately NO trigger, so opening something never looks like editing it |

**The one derived state:** a bit/board's `state` (live · archived · trashed) is COMPUTED by
the database from `deleted_at`/`archived_at` — never stored separately, so it can't drift.
Trash beats archive: trashing an archived thing clears `archived_at` (one resting place).

## 2 · A bit — every action, and what it writes

| action | what is written | placements touched? |
|---|---|---|
| create (jot, /write, board double-tap, paste, file drop) | new bit row; `created_at` = now | board-born: one placement too |
| edit words / title / caption | `body`/`content`; `updated_at` bumps (the schema's ONE trigger) | no |
| tag / untag | a `bit_tag` row added/removed | no |
| set / clear source | `source_id` | no |
| pin / unpin | `pinned_at` set/cleared | no |
| **archive** | `archived_at` = now; `pinned_at` cleared (archived ≠ alive, a DB CHECK) | **no — untouched.** Cards vanish from every board via the view filter only |
| un-archive | `archived_at` = null (the star does NOT come back — deliberate) | no — cards reappear at their exact old spots/dates |
| **trash** | `deleted_at` = now; `archived_at` cleared (trash wins) | **no — untouched** (and a lock survives trash→restore) |
| restore | `deleted_at` = null → back to LIVE (never back to archive) | no — everything reappears as it was |
| **destroy** (only from trash — DB-enforced) | row hard-deleted + media files removed | **yes — all its placements erased** (the one true erase) |
| duplicate | a NEW bit (own id, own copied file); if on a board, a NEW placement, `arrived_at` = now | the original's are untouched |

## 3 · A placement — the card-on-a-board actions

| action | what is written |
|---|---|
| place on a board (first time) | new row; `arrived_at` = now |
| move / resize / restack / lock | `x y width height z locked_at` on the SAME row — `arrived_at` never moves |
| **remove from this board** | `left_at` = now; lock cleared. The row is KEPT (departed, not erased) — this is the bit's travel history |
| **return to a board it once left** | the SAME departed row is revived (`left_at` = null) — so it keeps its ORIGINAL `arrived_at`. Never a duplicate row (DB-unique per bit-per-board) |
| undo of a remove | exactly the revive above — travel intact, lock re-applied |

## 4 · A board

| action | what is written |
|---|---|
| create / rename / describe / group / pin | its own row; renames bump `updated_at` |
| archive · trash · restore · destroy | same mechanism as a bit (§2) — destroy cascades: its placements, and its card-on-other-boards placements, go with it |
| **duplicate** | new board row + a FRESH placement per live card — same geometry + lock, but `arrived_at` = now. **Chosen:** travel history is the original's story; the copy's timeline honestly starts today. Departed legs and the ★ are not copied |
| open it | an `opening` row upserts (`opened_at` = now) — feeds "where you were"; touches nothing else |
| the frame (migration ready, feature next) | four numbers on the board row — pure furniture, no placement interaction |

## 5 · Which surface reads which date

| surface | reads | so it shows |
|---|---|---|
| board timeline | live placements' `arrived_at` | when each card landed on THIS board |
| a bit's journey | ALL its placements incl. departed (`arrived_at`+`left_at`) | everywhere it's been, with both ends of each stay |
| home "recently modified" | bit/board `updated_at` | what you last worked on |
| "where you were" | `opening.opened_at` | what you last looked at (distinct from edited — the whole point of the separate table) |
| /archive · /trash | `archived_at` · `deleted_at` | when it was put away |

## 6 · What is deliberately NOT recorded (honesty section)

- **No per-move history.** A card's position is one current value; drag it ten times, only
  the last x/y exists. Undo's memory is per-visit and in-memory only — never stored.
- **No edit history / versions.** `body` is one current value; `updated_at` says WHEN last
  touched, never what changed. (Version history is a named owner want — not built.)
- **`updated_at` is coarse.** Any edit bumps it — moving a card bumps the placement's, and
  board activity bumps the board's `updated_at` via app writes, which is what home's
  "recently modified" sorts by. Opening alone bumps nothing (§1's opening table exists
  precisely to keep that true).
- **Camera position and the jot draft are device-local** (browser storage), not in the DB.
- **`visibility` (public/private) is stored on every bit/board but dormant** — no
  publishing surface exists yet; everything is effectively private behind login.
- **Duplicates don't know their original.** A copy is free-standing — no stored link back
  (the owner's open model question in `duplicate-a-bit-spec.md`; ruled free-standing for now).
