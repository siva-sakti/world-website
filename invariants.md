# Invariants — the always-true rules

**What this is:** the model's **invariants** — rules that must hold *no matter what the owner does*. "Smooth cascading" = every operation preserves every invariant. This doc **grows as each cluster of the model closes**; at the **translation step** each rule becomes a real safeguard — a database constraint (`UNIQUE`/foreign key/`CHECK`), a computed read rule, or a single db-module function. It is the checklist every feature is run against. Companion to `model.md` (the current model) and `lexicon.md` (the words). Written 2026-07-20; grown through D-121.

**How to read the "kept by" tag:** `constraint` = the database refuses to write an illegal row · `computed` = derived at read, so it can't drift · `app` = enforced in one db-module function (the single chokepoint). Prefer pushing a rule as far *left* as it will go (constraint > computed > app).

**Status tags:** `LOCKED` = ruled + recorded · `PROVISIONAL` = depends on an open decision (named inline).

---

## Global (project-wide)

- **I-G1 — Export completeness.** Every one of the stored record kinds appears in the storage map *and* in the export. *(This is the invariant that would have caught the missing `category` — finding #4.)* The sweep surface includes **§7's payoff ledger** — twice a ledger row went stale silently (D-074, D-076). → `app` + a test.
- **I-G2 — One fact, one record.** Every fact is stored exactly once; computed surfaces (the pull, find, a bit's page, the graph, the publish preview) are never stored. → design + `computed`.
- **I-K1 — A thing never changes type (D-121).** `bit.kind` ('bit'|'note') is set **at birth** (catch/jot → 'bit' · ✎ write → 'note') and is **never updated** — there is no bit↔note conversion. The only writes to `kind` are the create-path inserts; no `setBitKind`/update-kind path exists. → `app` (single chokepoint: kind is insert-only) — could harden to a `CHECK`/trigger later. `LOCKED`.
- **I-G3 — One clock.** Every ordering anywhere derives from birth/last-touch stamps; no second clocks. → `computed`.
- **I-G4 — Only acts apply meaning.** The system may *propose* (mechanical sources only — §3d); only an owner act ever writes a tag application or a subtype. No auto-applied meaning, ever (principle 1). → `app` + review.

## Cluster 1 — privacy & sharing · LOCKED (D-072)

- **I-P1 — Two visibility fields.** A bit and a board each carry `visibility` ∈ {private, public} (`shared` later). → `constraint` (columns + defaults: bit public, board private).
- **I-P2 — Bit-privacy always wins.** A card (bit-card *or* board-card) is shown to a guest **iff its target is public**; board publicity never overrides a private target. → `computed` (RLS).
- **I-P3 — Reachability AND visibility.** A guest sees a bit **iff** its surface is reachable (its board is public) **and** the bit itself is public. → `computed` (RLS).
- **I-P4 — No public feed.** A bit is exposed to a guest only *through a reachable surface*, never merely by being public. → `computed` (RLS).
- **I-P5 — A private card renders absent.** Where a private target would show to a guest, nothing renders — the guest never learns something was withheld. → `computed`.

## Cluster 2 — placement lifecycle · LOCKED (D-073 — connectors: kill-with-confirm)

- **I-L1 — One placement per pair.** At most one placement row per (target, board); re-placing reuses it, never a second row. → `constraint` (`UNIQUE (target, board)`).
- **I-L2 — Placements are durable.** A placement row is never deleted except by empty-trash; un-place sets `left_at` (the card goes *absent*) and keeps the row. → `app`.
- **I-L3 — Card visibility is derived.** A card renders **iff** its placement is present (`left_at` null) **and** its target is **in the world** (`state = 'live'` — neither trashed nor archived). *(This is the owner's view; a guest's adds the visibility conjunct — I-P2/I-P3.)* → `computed`.
- **I-L4 — Connector endpoints are real.** Every connector endpoint references an existing placement row. → `constraint` (foreign key).
- **I-L5 — A connector exists only while both endpoints are placed.** Un-placing an endpoint card **deletes** the connector (a proportional confirm fires if any exist); it is *not* kept for revival — arrows are ephemeral *arrangement*, not history (§2c). → `app` + `constraint` (cascade on placement delete).
- **I-L5b — While it exists, a connector renders iff neither endpoint's *target* is trashed** (the bit — or, for a board-card endpoint, the board it points at). Trashing a target *hides* its connectors (frozen); restore revives them; empty-trash cascade-deletes them (D-071 #1). This is the only soft-hidden state, and it has a terminal event — so no zombie rows. → `computed` + `constraint` (cascade).
- **I-L6 — Board-destroy cascade.** Emptying a board from trash deletes every placement referencing it — those *on* it and those *of* it (board-cards elsewhere) — its connectors, **and its tag applications**, but **no bits**. → `constraint` (`ON DELETE CASCADE`).
- **I-L7 — Bits outlive boards.** No board operation ever deletes a bit; a bit may live on zero boards (a boardless bit still exists and stays findable). → structural.
- **I-L8 — Set-aside things leave the live surfaces.** A **trashed *or* archived** bit *or* board is excluded from pulls, find, and home (world surfaces show only `state = 'live'` things — feeds the #14 restatement, Cluster 5). → `computed`.
- **I-L9 — A connector's endpoints share its board.** Both endpoint placements belong to the connector's own board — a cross-board arrow is unrepresentable. → `constraint` (composite FK at translation).
- **I-L10 — Bit-destroy is total and self-contained.** Destroying a bit removes its placements (and their connectors), its tag applications, and its media — file bytes and derived artifacts — and touches nothing belonging to anything else. → `constraint` (cascades) + `app` (storage delete).

## Cluster 3 — what's a record · LOCKED (D-074)

- **I-R1 — Content is owner-only.** The `content` column holds only owner-authored words; the machine has **no write path** to it. *(The v1 lock on text-bit content was lifted by owner ruling 2026-07-22, D-087 — text bits now take an **optional** owner-written title, blank by default, the first line standing in; §2f. The invariant is unchanged in force — content stays owner-only, machine-never-writes; only the text-bit lock is gone.)* → `app` (the single db-module write fn).
- **I-R2 — The face is computed.** What a bit displays/searches by is derived at read/index time: `content`, else the per-type mechanical fallback (text: body words · bookmark: captured title, else URL · pdf/audio: metadata title). Never stored as truth of its own. → `computed` (layer E index).
- **I-R3 — Captured-once titles.** A bookmark's captured title is written exactly once, at save, then immutable — it is *truth* (storage test: not rebuildable from stored truth; the live page isn't ours). → `app`.
- **I-R4 — Vocabulary is id-referenced.** Tag words, categories, subtype words are their own rows; everything points by id; a rename touches one row. → `constraint` (FKs).
- **I-R5 — Vocabulary is not content.** Categories and subtype words are never taggable, placeable, or bits. → structural.
- **I-R6 — The stored kinds match everywhere.** Storage map, lexicon, and export enumerate the same set — the nine record kinds (+ the dormant table) **+ the `reference` derived index** (gather, §6 amendment; in the export per I-Ref7). → `app` + the I-G1 test.
- **I-R7 — One application per (tag, thing).** At most one tag application of a given word on a given thing — so merge A→B *dedupes by construction* (closes the below-the-line "merge duplicates applications" finding). → `constraint` (`UNIQUE (tag, target)`).
## Cluster 4 — two devices & collisions · LOCKED (D-075)

- **I-D1 — No silent landing on tombstones.** Every write/flush checks its target live (*exists, no `deleted_at`*) while **holding `SELECT … FOR SHARE` on the target row in the write's own transaction** — *not* `FOR KEY SHARE` (a soft-delete is a non-key UPDATE, which key-share does not block; the READ COMMITTED snapshot race lands the write silently otherwise). On a hit: write held on the acting device, prompt at act time, **keep-by-default = restore target + land write** (a hard-deleted vocabulary word has no frozen row — keep = **recreate by name**, I-D6's machinery). → `app` (db-module) + `constraint` (FKs for hard existence) + **a two-session race probe at translation** (reproduce the silent land without the lock; show it blocked with it).
- **I-D2 — Births-only offline.** The outbox carries only *creations* (new bits, their tag applications, new tag words) — never an edit of an existing record. On every device, forever. → structural + `app`.
- **I-D3 — No automatic edit replay.** An edit reaches the database only through a live save with the owner present; a failed compose save fails visibly and retries in memory, **never durably queued**. (A crash-guard draft may restore into the *editor* only — never replay to the DB.) → `app`.
- **I-D4 — Born-at = act-time.** A record created offline carries the act's timestamp as its birth; flush time is not a clock (principle 4's offline corollary — the return loop's time surfaces depend on it). → `app` (the outbox carries timestamps).
- **I-D5 — Edit-vs-edit is last-arrival, whole-record, and *named*.** Resolved by database arrival order; explicitly outside I-D1's prompt (the P12 boundary, §2d/§2h). → design.
- **I-D6 — Flush name-collisions attach.** A new-word creation arriving at flush resolves case-insensitively to an existing word (the near-duplicate rule). → `app` + `constraint` (case-insensitive UNIQUE on tag word).
## Cluster 5 — retrieval honesty · LOCKED (D-076)

- **I-T1 — Nothing stored is unreachable (scoped to things + vocabulary).** Every **thing** and every **vocabulary word** appears in at least one no-precondition surface: live bits → **the ledger** (find's empty query, newest first); boards → home; **trashed** things → the trash listing; **archived** things → the archive listing; vocabulary → the manager/picker rows, **count-0 words included**. **Acts surface through their things** (a chip on the bit's page, a card, an arrow, a travel line) — they need no surface of their own. → `computed` + `app`.
- **I-T2 — Destructive confirms count the frozen.** The world/trash boundary governs *surfaces*, never an act's *accounting*: every destructive confirmation (delete/merge a word, empty trash, destroy a board) states its loss including frozen things. → `app` (one confirm-builder in the db module).
- **I-T3 — Vocabulary ops reach every row.** Rename (free via id), merge, delete operate on all applications, in-world **and frozen** — skipping trash would let a restore resurrect a tombstone reference (a self-inflicted I-D1 clash). → `app` + the I-D1 FKs.
- **I-T4 — Four surface domains.** **World** surfaces show only live things (`state = 'live'` — the render rules I-L3/I-L5b); **the trash listing** shows only trashed (`state = 'trashed'`); **the archive listing** shows only archived (`state = 'archived'`); **history** surfaces (bit travel; board ever-placed) show acts indifferent to current state. The three resting states are **mutually exclusive** (trash wins), so a thing is in exactly one of world / trash / archive. → design + `computed`. *(Supersedes the old "three domains, no fourth" — archive is the fourth, D-127.)*
- **✅ The I-T4 question raised on 2026-08-28 is now ANSWERED.** The archive round (our D-128) flagged that a proposed *archive* state collided with "three domains, no fourth": an archived row was a **live** row, so it was in the world, and "put away" wanted it out of four world surfaces while staying in find — a fourth domain by another name. Two ways out were named: **(a)** world splits and I-T4 becomes four domains, or **(b)** archive is a listing property only. **Ruled (a)**, via the resting-state work (D-127): `state` is one column with three mutually-exclusive values, so archive is a real fourth domain rather than a filter bolted onto world. The reasoning behind the original objection stands recorded in `deliberations.md` (the archive round); `parked.md` A24 is closed by D-127.
- **I-T5 — The pull is complete over the world.** Every in-world thing carrying the tag appears; restore re-includes instantly (the pull computes from applications — nothing to rebuild; *translation note: the search **index** may need a reindex touch on restore — layer-E housekeeping, find only, never the pull*). → `computed`.
- **I-T6 — Travel has a surface (v1).** The bit's page shows *has-been-on* (board · arrived · left) — stored history may not be surfaceless (the F3 growth verdict depends on it, D-069). Board-side "ever placed here": deferred, named re-entry. → `computed`.

## From the walkthrough · LOCKED (D-079, 2026-07-21)

- **I-W1 — Un-place and trash are never one button.** Every removal surface presents them as two distinct, labeled acts — *"Remove from this board"* (this board only; confirms when arrows would die) vs *"Move to trash"* (the bit, everywhere; restorable) — never a lone ambiguous "Delete." The model keeps these acts safe (§2g); only a muddled menu can lose data, so the menu is bound here. → design + review on every removal surface.

## Cluster 6 — capture: source & looseness · LOCKED (D-100; the source set re-cut to I-Src by D-102)

**Source (I-Src) · LOCKED (D-102 — supersedes the D-100 I-S set):**
- **I-Src1 — Source is optional, one per bit.** Any bit may carry a single `source_id`; blank = self-made. A bit has *many* tags but at most *one* "where it came from." (Supersedes I-S1.) → `constraint` (a nullable single FK; the substance rule never names it).
- **I-Src2 — Source is a named vocabulary citizen.** A source is its own row — a `name` (never blank) + an optional `url` — id-referenced like a tag or subtype word; near-duplicate names refused case-insensitively at birth. → `constraint` (the `source` table + `source_name_ci` unique).
- **I-Src3 — Rename-once; read once, machine never re-reads.** A source is created at capture (or picked from the list) from the page's title, and the machine **never re-fetches it** — a dead or edited page can't rewrite it. Only a deliberate rename changes it, and a rename touches **one row** so every note pointing at it re-labels instantly (id-referenced, P9). **Re-homes the old I-S2** ("frozen at capture"): the machine still never re-reads; the owner may now rename. → `constraint` (the FK) + `app` (the one rename fn).
- **I-Src4 — Delete-source sets null; the note survives.** Deleting a source lets its notes live on, losing only the stamp — never the words (like deleting a subtype word). → `constraint` (`on delete set null`).
- **I-Src5 — Source travels with the bit, and groups it.** Source lives on the bit, so placing a note on a board carries its "from…" along (Principle 8); and *"everything from this source"* is just `where source_id = X` — it assembles itself. → `constraint` (the FK + `bit_source` index) + `computed` (the `board_cards`/`the_ledger` join).

**Retired / moot with the bookmark (D-102, part of the same edit so the doc doesn't drift):**
- **I-S3** ("a bookmark's source is itself") · **I-S4** ("a bookmark may carry a preview") — **retired**: there are no bookmarks, and I-S4's preview relax is reverted by the migration.
- **I-R3** ("captured-once titles") — ~~moot for live rows; the `captured_title` column persists, unused~~ **LIVE AGAIN (D-129):** the **link** bit revives `url` + `captured_title` (and adds a read-once stored card image in `thumb_path`); captured-once applies to the link's title + image exactly as it did to the bookmark's title. Every *other* type still forces both columns null (the substance CHECK).
- **I-R2**'s face fallback ~~still lists a dead `bookmark:` branch; no function edit~~ **edited (D-129):** `bit_face()`'s branch is now **`link:`** (captured title, else the URL) — same rule, live name (`20260901000001_link_type.sql`, CREATE OR REPLACE).

**Looseness / the inbox / call-in (I-N):**
- **I-N1 — Loose is computed, never stored.** A bit is loose ⇔ it is **in the world** (`state = 'live'`) **and** no board actually shows it (no un-departed placement on a **live** board (`state = 'live'`) — the exact rule boards already use, now archive-aware). No flag, no column. → `computed`.
- **I-N2 — The inbox is the loose surface.** Every loose bit appears in the inbox, newest-first; a computed surface, not saved state (loose bits' guaranteed way-back, as the ledger is for everything live). → `computed`.
- **I-N3 — A bit whose only board is trashed is loose.** It returns to the inbox (its placement stays "not departed"; the board-not-trashed test catches it). By symmetry: un-placing a last board and trashing a last board both return it; restoring the board removes it — nothing to rebuild. → `computed`.
- **I-N4 — Call-in reuses the membership row.** Putting a bit back on a board it once left **clears the departure** on the existing row (never a second — I-L1); a called-in bit lands where you drop it, center by default. → `app` + `constraint` (the existing `UNIQUE`).

## Cluster 7 — gather: references · LOCKED (D-101)

- **I-Ref1 — A reference is directed.** It goes from a source bit to a target bit; forward ("what this gathers") and backward ("gathered into") are one row read from two ends. → `constraint` (two columns, `from`/`to`).
- **I-Ref2 — One tie per ordered pair.** At most one reference for a given (from, to); the same target mentioned twice in a body reconciles to one row (both chips still render); the reverse pair is a distinct tie. → `constraint` (`reference_once` unique).
- **I-Ref3 — The source is a text bit.** Only writing originates a reference, so `from` is always a text bit — a CHECK can't see another row's type without a trigger, and the schema allows exactly the one `updated_at` trigger. → `app` (the one write door).
- **I-Ref4 — References are grown from the body, never hand-authored.** The body is the single source of truth; the reference rows are its derived index, reconciled on save. There is no "delete a reference" act. → design + `app`.
- **I-Ref5 — Removal is traceless.** Delete the chip and save; the row falls away, leaving no record it existed — like un-tagging. → `app` (reconcile-on-save).
- **I-Ref6 — Destroy cascades both ways.** Destroying a bit removes every reference where it is the source *and* every one where it is the target; other bits are untouched. → `constraint` (`on delete cascade` on both columns).
- **I-Ref7 — References are in the export.** A reference is a stored record kind, so it joins `/export` and the completeness check — or "you own everything" silently breaks (I-G1). → `app` + the I-G1 test.
- **I-Ref8 — The chip caches the target's face for search/labels, refreshed lazily.** A chip stores a copy of the target's face so notes are findable by what they reference and list-labels read naturally; the copy self-heals on the note's next save/view — no rename fan-out. A **knowing carve to Principle 9** (agreements §1 carve / §6 amendment), recorded as a trade. → `app` (lazy reconcile-on-read).

## Undo (D-137)

- **I-U1 · An undo entry never outlives its board visit, and never replays into a different board.** The stack is session memory (the three-layer save ruling: durable recovery is trash/archive/travel — never a stored undo stack). Enforced by construction: the stack lives in the board's own hook and dies with it.
- **I-U2 · Only deliberate acts enter the stack.** Reflexes (click-to-front, auto-grow) and the system's repairs (rollbacks) route through the raw door and cannot record. A failed act's entry is marked and never replays.
