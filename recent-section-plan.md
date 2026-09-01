# "where you were" — the recent section · plan

**Status:** ✅ **BUILT + proven locally; the migration is OWED TO THE OWNER** (paste, then deploy).
Concept ruled → plan → **antagonist: "NOT build as written"** → corrected → built → proven.
Owner-authorized 2026-09-01. Queue item
**THE GAPS ROUND #4** (`organize-phase-plan.md`).
**Standing limits:** the migration is **owner-pasted** (never by Claude) · **migration before
deploy** · no deploy without the owner's word.

---

## 1 · The problem, exactly

Home shows what you **starred** (the desk) and every surface you own (the list, with sorts). One of
those sorts is **"recently modified"** — but that only knows about things you *changed*. Read a
board for twenty minutes and move nothing, and home has no memory that you were ever there.

So "what was I doing?" has no answer today. The app records what you **made**, never where you
**went**.

## 2 · What gets built (the owner's ruled concept)

A short row on home — **"where you were"** — the last **5 surfaces you opened**, most recent first,
click to go back. It reorders itself as you move; nothing to curate, nothing to tidy.

**The owner's rulings (2026-09-01):**

| | ruled |
|---|---|
| what counts as a visit | **opening it** — not editing, not scrolling. Arriving is the whole act. |
| what's trackable | **boards + notes only** — the surfaces you work *on*. A bit page is a glance, not a workplace. |
| how many | the last **~5**, **deduped** (one entry per thing, at its latest visit) |
| where the trail lives | **the database — across devices.** Read on the phone, sit at the laptop, same list. |
| the label | **"where you were"** |

**Claude's three calls (owner-flagged, reversible):**
- A **starred board still appears** in the trail if you were just in it. Hiding it would be a lie —
  the desk says *what you chose*, the trail says *where you went*.
- **Trashed and archived things drop out** silently. (Free — see §5.)
- **Bare, not designed** — one quiet line of names, lighter than the desk tiles. The
  deliberately-designed surface is the browse/feed phase, not this.

## 3 · Two things checked before planning

**A7 does NOT block this.** `organize-phase-plan.md` warns *"A7 forecloses placement-level visit
history."* A7 is about where a **bit** has travelled between boards — v1 keeps one durable
membership row, so a bit's entry/exit log isn't reconstructable. This records where **the owner**
has been. Different record, no overlap; building this neither spends A7 nor makes it harder.

**Accounts: no entanglement, and going to the DB *avoids* a debt.** Migration `20260728000001`
(D-107) already put `owner_id` on every table, defaulting to the logged-in user, with RLS meaning
"you see your own rows." A visit table built the same way is **per-person at birth** — nothing to
retrofit when accounts land. "Across devices" needs no accounts work: one account, several devices,
already true today. *(Contrast: the jot draft (D-133) is per-device and carries a named
before-accounts debt. This one carries none.)* Sharing is untouched — a visit row is private; a
future guest on a shared board writes nothing to the owner's trail.

## 4 · The trap that decides the shape

**The obvious implementation is poisoned.** `bit` and `board` each carry a `before update` trigger
that stamps `updated_at` — and the schema is explicit that this is *"the ONE trigger… nothing else
is ever"* (`20260721000001_init.sql:77`, strategy §4.7). So a `visited_at` **column** on those
tables, written on every open, would fire that trigger and make **merely opening a note look like
editing it**, corrupting:

- home's `touched_at` (`greatest(b.updated_at, max(p.updated_at))` — the whole `home` view's order),
- the home list's "recently modified" sort,
- `/notes`' "recently edited" sort.

Suppressing the trigger for one column means editing the one trigger the schema is built around —
rejected. **Therefore the trail gets its own table**, which no trigger touches and which perturbs
nothing that exists.

## 5 · The record — CORRECTED after the antagonist

Built as `supabase/migrations/20260903000001_opening.sql`. **The word is `opening`, not `visit`** —
`init.sql:357` already promises "one-row-per-visit" to the visit-by-visit **travel** timeline
(parked A7, where a *bit* has been). Two meanings on one word is drift. The owner ruled the word.

```sql
create table opening (
  id         uuid primary key default gen_random_uuid(),
  owner_id   uuid not null default auth.uid(),
  board_id   uuid references board(id) on delete cascade,
  bit_id     uuid references bit(id)   on delete cascade,
  opened_at  timestamptz not null default now(),
  constraint opening_exactly_one_target check ((board_id is null) <> (bit_id is null)),
  constraint opening_one_per_board unique (owner_id, board_id),
  constraint opening_one_per_bit   unique (owner_id, bit_id)
);
```

### ⚠ THE CORRECTION — the plan's original DDL was fatally, silently wrong

This plan first specified **partial unique indexes** (`… where board_id is not null`) and called them
*"what makes the write an upsert."* **That was inverted.** PostgREST's `on_conflict` takes bare
column names and cannot emit an index predicate, so `ON CONFLICT` can **never** infer a partial
index. The antagonist proved it on a throwaway PG17:

```
ERROR:  there is no unique or exclusion constraint matching the ON CONFLICT specification
```

**How it would have failed:** every board open throws 42P10 → §6's mandated `.catch(() => {})` eats
it → the trail stays empty forever, with no error anywhere. And §10 as first written would have gone
**green anyway**, because every proof was raw SQL and the defect lives in the layer above.

**The fix, proven:** plain `UNIQUE` constraints. Postgres defaults to `NULLS DISTINCT`, so every note
row (`board_id IS NULL`) coexists happily under `unique (owner_id, board_id)` — the same semantics
the partial index reached for, but inferable. Regression-tested as proof 3.

Everything else survives review and earns itself:

- **The exactly-one-target pair + CHECK** — the house shape already named for this (A15).
- **FK `on delete cascade`** — destroying a board or bit removes its openings *by the database*.
- **Unique constraints** make dedupe **structural**, not app logic.
- **No `updated_at`, no trigger** — `opened_at` *is* the row's meaning. Asserted by proof 8.
- **RLS verbatim from `shelf_group`** — per-person at birth, no accounts retrofit. No guest policy,
  ever: where the owner has been is private and stays so through the sharing phase.

**Deliberately NOT enforced at the DB: "bit_id must be a note."** A CHECK can't reach another table
and the composite-FK trick is disproportionate. Honest layering: only the note page writes one, and
`/note/[id]` redirects a non-note to `/bit/[id]` **before any JSX** (`note/[id]/page.tsx:36`), so a
non-note can't reach the write. *(Bonus: if bit pages ever count, no migration.)*

## 6 · The write — CORRECTED after the antagonist

`src/components/record-opening.tsx` renders `null` and stamps once on mount;
`recordOpening()` lives in `src/lib/db/openings.ts`.

### ⚠ CORRECTION 1 — a browser-client write, not a server action

The plan invented a server-action-from-a-mount-effect pattern that **exists nowhere in this
codebase** (no `.upsert(`, no `.rpc(`, and every one of the 11 client→action imports is
event-handler-driven). Meanwhile `pinBoard` · `pinBit` · `setBoardGroup` · `createGroup` ·
`duplicateBoard` already do exactly this class of write — small, owner-scoped, RLS-guarded —
straight from the browser client through `lib/db` (`shelf-controls.tsx`, `home-surfaces.tsx`).

Using the established pattern is a smaller diff, still honors *"never call Supabase from a
component,"* keeps RLS as the boundary as ruled — and **deletes the `revalidatePath` question
entirely**, since no server action means no router involvement.

### ⚠ CORRECTION 2 — `opened_at` must be SENT, never defaulted

`default now()` fires on **INSERT only**. A payload without `opened_at` produces
`DO UPDATE SET board_id = EXCLUDED.board_id` and leaves the timestamp **frozen at the first-ever
visit** — the trail would never reorder, which is the entire feature. Proven both ways: proof 4
(carried → it moves), proof 5 (omitted → it doesn't).

The rest stands:

- **Not stamped during the server render** — a render is not a mutation, and a prefetch or refresh
  would forge a visit the owner never made.
- **Idempotent**, so StrictMode's double mount is harmless.
- **Silent on failure, always** — a dropped connection costs one trail entry and nothing else.
- **Returns `null`**, not an empty element: `.board-page` is a flex column with an 8px gap.

## 7 · The read (and why it's nearly free)

Home **already** loads every board and every note to build `surfaces`. So the trail fetches only
`{board_id, bit_id, visited_at}` — no join, no titles, no second copy of anything — and maps those
ids onto the surfaces already in memory.

```
listRecentVisits(supabase, 30)  →  ids+timestamps, newest first
  → map each onto `surfaces` by id
  → drop the ones that don't match
  → take 5
```

**Derive, don't duplicate:** a board's title and href have exactly one source (`toSurfaces`), so a
renamed board is never stale in the trail.

**Verified sound:** the map is keyed `kind:id`, not a bare id — board and bit ids are different
spaces, and the house already keys surfaces this way (`desk-alive.tsx:21`).

**And the drop-out is free.** `home` filters `b.state = 'live'`
(`20260830000001_resting_state.sql:91`) and `listNotes` filters `.eq("state","live")`
(`bits.ts:459`) — **both verified by reading, not assumed** — so a trashed or archived thing simply
isn't in `surfaces` and falls out of the trail with no filtering code of its own. Destroyed things
are gone by FK cascade.

**Why fetch 30 for a list of 5:** trashed/archived visits are dropped *after* the fetch, so a raw
`limit 5` could render 1 item. 30 is far more than the survivors of any plausible session and still
a trivial read.

## 8 · The surface

New `src/app/where-you-were.tsx`, rendered in `page.tsx` **between** `DeskAlive` and `HomeSurfaces`.
Order reasoning: the desk is what you **chose** to keep alive; the trail is **incidental**. Choice
outranks incident. (One JSX line to move if it reads wrong.)

- `<h2 className="desk-h">where you were</h2>` — the desk's own heading class, so it belongs.
- Rows are **plain text links** (a quiet pill each), visibly lighter than the desk tiles: the
  name and a small kind label.
- **No timestamp — corrected after the antagonist.** `ago()` bottoms out at `"today"`
  (`lib/dates.ts:27`), so every row in a minutes-old trail would read the same word. The **order
  is the information**; adding a timestamp meant either noise or changing `ago()` app-wide
  (it's shared with `DeskAlive`), which this feature has no business doing.
- **Nothing visited yet → the section renders nothing at all.** Not an empty box, not a hint —
  the trail explains itself the moment it has content, and a new home is already busy.

**Named honestly: this is home's third list** (desk · trail · surfaces), all of the same nouns.
That's a real clutter risk on a page this small, and the mitigation is the weight difference —
one quiet line, not a third block of tiles. If it still reads as clutter, it's one line to remove.

## 9 · Every case traced

| case | behavior |
|---|---|
| never visited anything | no section at all (§8) |
| the same board opened twice | one row (unique index), moves to the front |
| visited, then trashed / archived | drops out — no code, it's just absent from `surfaces` (§7) |
| visited, then destroyed | row deleted by FK cascade |
| board renamed after the visit | current title — the trail carries ids, not names (§7) |
| offline when opening | write fails silently; the trail is one entry short, nothing else (§6) |
| two tabs on the same board | both upsert the one row; last wins |
| StrictMode double mount | upsert — the second is a no-op (§6) |
| a non-note bit reaching the note write | can't: `/note/[id]` redirects it to `/bit/[id]` first (§5) |
| the owner is *on* home | home isn't a surface; it never enters its own trail |
| a starred board just visited | appears in **both** the desk and the trail — ruled, §2 |

## 10 · Proof — what was actually run

**✅ `verification/run-opening-native.sh` — 12 proofs GREEN** on a throwaway PG17, all 19 migrations
applied clean (`verification/opening-proofs.out`):

| | proves |
|---|---|
| 1 | the exactly-one CHECK refuses both-set **and** neither-set |
| 2 | one row per (owner, board) — a second insert is refused |
| **3 / 3b** | ★ **the fatal-defect-1 regression** — the exact predicate-free `ON CONFLICT` PostgREST emits infers the constraint, on both targets |
| **4** | ★ **the fatal-defect-2 regression** — re-opening UPDATES the one row and **moves `opened_at` forward** |
| 5 | omitting `opened_at` leaves it frozen — the reason the db module always sends it |
| 6 | NULLS DISTINCT: many note openings coexist under `unique (owner_id, board_id)` |
| **7** | ★ **the §4 trap proven closed** — an opening leaves `updated_at` untouched on **both** targets |
| 8 | `opening` carries no trigger (one clock, by design) |
| 9 | destroying a board / a bit cascades its openings away |
| 10a/b/c | RLS through the real roles: a stranger sees none and can forge none; the owner sees their own |

*A proof-harness lesson worth keeping: proof 4 first failed because `now()` is
`transaction_timestamp()` — frozen for the whole proof transaction. The payload clock comes from the
**client**, so the proofs use `clock_timestamp()` to model it faithfully.*

**✅ Also green:** tsc · lint (0 errors) · production build · **24 unit tests** across four suites,
including 5 new ones for the openings→surfaces map (order, drop-out, the cap counting only
survivors, and the board/note id-collision case).

**✅ Proven live in the browser:** with the migration *not yet applied*, home renders correctly with
the trail simply absent — the degrade path (below) working as designed.

### The degrade path — a deliberate ruling, not an oversight

Home's trail read is wrapped in a `.catch` that **logs and returns `[]`**. The trail is decoration;
the surfaces are the page. A missing migration or an RLS slip must not brick the landing page — but
it must not vanish silently either, so it is logged server-side. The other three reads have **no**
such catch: if those fail, home genuinely has nothing to show and should say so.

### ⛔ Still unproven until the migration is applied

The **PostgREST layer itself** — whether it accepts an `on_conflict` column (`owner_id`) that isn't
in the request body. The SQL shape is proven; this repo has no local PostgREST (every runner is
`*-native.sh`, raw Postgres), so it is provable only against the real thing. **The order is
therefore: owner pastes the migration → Claude runs the browser test on localhost (real PostgREST,
real RLS) → deploy.** If it does balk, the fix is one line: send `owner_id` explicitly.

### Named, not fixed: the 1000-row cap

`listBoards` and `listNotes` are un-paged `.select("*")` and don't use `pagedRows`
(`lib/db/paged.ts`). A visited surface sitting past row 1000 wouldn't be in `surfaces`, and §7's
drop-out would make that **look like the feature working**. Pre-existing, but this is the first
thing that turns truncation into silently wrong output. At ~20 surfaces and 88 bits the cap is far
off; **named here so it isn't rediscovered as a mystery.**

## 11 · What this is not

Not a history page, not a back button, not analytics, not a streak, and not a second sort on the
surfaces list. Five names and a timestamp. If it ever wants to be more, that's a new ruling.
