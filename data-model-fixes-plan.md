# Data-model fixes — plan

**Status:** written 2026-09-03 → **awaiting antagonist review** → owner's go → build.
Source: the antagonist model review (2026-09-03). Its two A-class holes are already
**fixed and proven** (A1 the trash/archive crossfire; A2 duplicate-board copying invisible
cards). This plan covers **everything that remains**, and nothing else.

**Why it gets a plan at all** (owner: *"if you're fixing stuff in the data model I need
that to be way more carefully planned"*): every item here touches stored truth or the
numbers the owner reads off a screen. One of them (A4) can **destroy data silently**.

---

## 0 · The trap this plan already avoided — recorded so nobody re-introduces it

The obvious fix for A4's insert loop is "replace N inserts with one bulk upsert,
`onConflict: 'tag_id,target_bit_id'`." **That is impossible here, and would ship a silent
failure.** The uniqueness is enforced by two **PARTIAL** indexes
(`init.sql:296-299`, `... where target_bit_id is not null`), and **PostgREST cannot emit an
index predicate, so `on_conflict` can never infer a partial index** — the exact trap proven
on live PostgREST in D-134, where it would have thrown 42P10 into a swallowed catch and left
a feature permanently empty with no error anywhere. **The per-row insert + catch-23505 loop
stays.** Only the READ changes.

---

## 1 · A4 — merge silently destroys applications past 1000 · **the only data-loss item**

**Now:** `mergeTags` (`src/lib/db/tags.ts:137-141`) reads the from-word's applications with a
bare `.select()`. PostgREST caps every select at 1000 rows and **truncates silently**. It
copies what it got, then `delete from tag`, whose CASCADE removes **all** of the from-word's
applications — including the ones past 1000 it never copied. Merging a 1001+-application word
permanently strips it from the overflow things, with no error anywhere.

**Fix:** page the read with `pagedRows` — the house helper (`src/lib/db/paged.ts`), already
used by search, inbox and the export for exactly this class (D-132 fixed the same bug in
`/search` against the real system). `pagedRows` **requires a stable `.order()`** or pages can
repeat/skip rows — the helper's own comment says so; order by `created_at, target_bit_id`.

**Risk if we get it wrong:** the same silent loss, so the proof must be a real >1000 case.

## 2 · B2 — merge resets the act's clock *(same function, same pass)*

**Now:** the re-insert omits `created_at`, so every merged application's date becomes
merge-time. The pull's "this word, on this thing, **at this time**" (`init.sql:284-287`) is
the fact being overwritten — a 30-day-old application reads as today's.

**Fix:** select `created_at` alongside the targets and carry it into the insert.

## 3 · B1 — the managers count archived things as "world"

**Now:** `tag_counts` (`init.sql:632-643`) splits world/trash by `deleted_at` **alone**, so an
archived carrier counts as world. The tag manager says a word is on 2 things; tap it and the
pull shows 1. Same shape in `subtype_word_counts` and `listManagedSources`
(`src/lib/db/sources.ts:169-179`).

**Fix:** three-way counts (world / archived / trash) in both views + the sources tally.
**The confirm sentence that reads them is COPY — the owner's, not mine** (the house rule that
kept confirm wording per-door). I'll surface the number and leave the sentence blank for her.
**Needs the owner's wording ruling before it can ship** — see §8.

## 4 · B3 — "recently edited" is bumped by things that aren't edits

**Now:** the one `updated_at` trigger fires on ANY update, so `pinBit`, `setBitGroup`,
`setSource` and every resting act (archive/unarchive/trash/restore) bump it. `/notes` sorts by
it as "recently edited"; home's `touched_at` reads it for boards. **Star a note, or restore it
from the trash, and it leaps to the top of "recently edited" without being edited.**

The sharp version: D-134 built an entire separate `opening` table precisely so that *opening*
≠ *editing* — while *starring* = *editing* stands today.

**Two honest options, owner's call (§8):**
- **(a) Make it true:** a `WHEN` clause on the trigger ignoring `pinned_at`, `group_id`,
  `source_id`, `archived_at`, `deleted_at`. Stays one trigger; the column list is drift-prone,
  so it gets a regression proof that a star does NOT bump and a body edit DOES.
- **(b) Accept and record it** in `data-map.md` §7 with the star/restore cases named.

Claude's lean: **(a)** — "recently edited" is a promise the owner reads constantly, and (b)
leaves a known lie in the most-used sort on the app.

## 5 · B4 — four more unpaged reads *(no data loss; surfaces thin out silently)*

`getWordGraph` (`graph.ts:23-26`), `listTrash`, `listArchive`, and `listManagedSources`'
carrier read all take bare selects. **Verified: `pagedRows` is used in exactly three places
(`export`, `search.ts`, `inbox.ts`) and in NO `lib/db` module besides those** — so this is a
consistency gap, not a one-off. Past 1000 rows each silently under-reports.
D-134 already names `listBoards`/`listNotes` as the same known class.

**Fix:** `pagedRows` + a stable order at each. Mechanical, low risk, no rulings.

## 6 · B6 — a failed tag-copy on duplicate is invisible

**Now:** `bits.ts:565-573` — the docstring promises tags come across, but a failed copy is
`console.error` only (a server log the owner never sees); the copy lands untagged and says
nothing. **Fix:** return a warning through the action result, the way `duplicateBitAction`
already returns partial-success messages for media. Same pattern, already in the file.

## 7 · A3 — the accounts landmine · **RECORD ONLY, build nothing**

`tag_word_ci`, `source_name_ci`, `subtype_word_ci`, `category_name_ci` are
`unique (lower(word))` with **no `owner_id`** (`init.sql:107/121/131`; source migration:44).
D-107 put `owner_id` + RLS on every table but never re-scoped these four indexes. With a
second user: they cannot create any word the first user ever used, `applyTag`'s recovery
`.single()` throws opaquely forever for that word, and the 23505-vs-success difference leaks
which private words exist. `shelf_group` and `opening` got this right
(`unique (owner_id, ...)`) — so the pattern is established, just not applied here.

**Nothing to build today** (single user). The whole ask is that it lands on the same
before-accounts list the storage-policy migration already keeps, so it cannot be lost.
It was recorded **nowhere** — I checked `data-map.md`, `parked.md`, `invariants.md`, SPEC,
and the D-log.

## 8 · What only the owner can rule

1. **B3:** should "recently edited" mean *edits only*? (my lean: yes → §4a)
2. **B1:** the manager's wording once counts are three-way ("on 2 things · 1 archived"?).
3. **Duplicating an ARCHIVED bit** currently births a LIVE copy — defensible ("a copy is
   born live"), never ruled.
4. **Stale meaning-writes onto resting things** (`data-map.md` §6's ⚠ cells): should editing
   words / tagging / pinning a *trashed or archived* thing from a stale page refuse loudly,
   or stay quietly merciful? (Today: mostly merciful, no guard at any layer.)

## 9 · Order, and the proof each one owes

| # | item | risk | proof |
|---|---|---|---|
| 1 | **A4 + B2** (one pass in `mergeTags`) | **data loss** | a throwaway-DB merge with **>1000** applications: every one survives, and `created_at` is preserved. This is the one item whose proof cannot be skipped |
| 2 | **B4** paging ×4 | silent thinning | a >1000-row read returns all of them |
| 3 | **B6** the warning | invisible failure | forced-failure path returns a message |
| 4 | **A3** record only | none today | it appears on the before-accounts list |
| 5 | **B3** (after ruling) | a promise the owner reads | a star does NOT bump; a body edit DOES |
| 6 | **B1** (after wording) | a visible lie | manager count == pull count, archived shown apart |

**Honest limit on the A4 proof:** the 1000-row cap is **PostgREST** behavior, not Postgres, so
a local psql harness cannot reproduce the truncation itself. The throwaway proof shows the
paged read returns >1000 rows and preserves dates; the *cap* is grounded on this project's own
documented number (`paged.ts`) and D-132's live proof of the identical class. A live check
against real PostgREST is owed and named, not silently skipped.

**Not in scope:** anything the senior code-quality review is covering (structure, DRY,
splitting `board-surface.tsx`) — that runs separately and lands its own list.
