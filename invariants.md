# Invariants — the always-true rules

**What this is:** the model's **invariants** — rules that must hold *no matter what the owner does*. "Smooth cascading" = every operation preserves every invariant. This doc **grows as each cluster of the model closes**; at the **translation step** each rule becomes a real safeguard — a database constraint (`UNIQUE`/foreign key/`CHECK`), a computed read rule, or a single db-module function. It is the checklist every feature is run against. Companion to `agreements.md` (the ruled model) and `lexicon.md` (the words). Written 2026-07-20.

**How to read the "kept by" tag:** `constraint` = the database refuses to write an illegal row · `computed` = derived at read, so it can't drift · `app` = enforced in one db-module function (the single chokepoint). Prefer pushing a rule as far *left* as it will go (constraint > computed > app).

**Status tags:** `LOCKED` = ruled + recorded · `PROVISIONAL` = depends on an open decision (named inline).

---

## Global (project-wide)

- **I-G1 — Export completeness.** Every one of the stored record kinds appears in the storage map *and* in the export. *(This is the invariant that would have caught the missing `category` — finding #4.)* The sweep surface includes **§7's payoff ledger** — twice a ledger row went stale silently (D-074, D-076). → `app` + a test.
- **I-G2 — One fact, one record.** Every fact is stored exactly once; computed surfaces (the pull, find, a bit's page, the graph, the publish preview) are never stored. → design + `computed`.
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
- **I-L3 — Card visibility is derived.** A card renders **iff** its placement is present (`left_at` null) **and** its target is not trashed (`deleted_at` null). *(This is the owner's view; a guest's adds the visibility conjunct — I-P2/I-P3.)* → `computed`.
- **I-L4 — Connector endpoints are real.** Every connector endpoint references an existing placement row. → `constraint` (foreign key).
- **I-L5 — A connector exists only while both endpoints are placed.** Un-placing an endpoint card **deletes** the connector (a proportional confirm fires if any exist); it is *not* kept for revival — arrows are ephemeral *arrangement*, not history (§2c). → `app` + `constraint` (cascade on placement delete).
- **I-L5b — While it exists, a connector renders iff neither endpoint's *target* is trashed** (the bit — or, for a board-card endpoint, the board it points at). Trashing a target *hides* its connectors (frozen); restore revives them; empty-trash cascade-deletes them (D-071 #1). This is the only soft-hidden state, and it has a terminal event — so no zombie rows. → `computed` + `constraint` (cascade).
- **I-L6 — Board-destroy cascade.** Emptying a board from trash deletes every placement referencing it — those *on* it and those *of* it (board-cards elsewhere) — its connectors, **and its tag applications**, but **no bits**. → `constraint` (`ON DELETE CASCADE`).
- **I-L7 — Bits outlive boards.** No board operation ever deletes a bit; a bit may live on zero boards (a boardless bit still exists and stays findable). → structural.
- **I-L8 — Trashed things leave the live surfaces.** A trashed bit *or* board is excluded from pulls and find (they surface only live, visible things — feeds the #14 restatement, Cluster 5). → `computed`.
- **I-L9 — A connector's endpoints share its board.** Both endpoint placements belong to the connector's own board — a cross-board arrow is unrepresentable. → `constraint` (composite FK at translation).
- **I-L10 — Bit-destroy is total and self-contained.** Destroying a bit removes its placements (and their connectors), its tag applications, and its media — file bytes and derived artifacts — and touches nothing belonging to anything else. → `constraint` (cascades) + `app` (storage delete).

## Cluster 3 — what's a record · LOCKED (D-074)

- **I-R1 — Content is owner-only.** The `content` column holds only owner-authored words; the machine has **no write path** to it. *(The v1 lock on text-bit content was lifted by owner ruling 2026-07-22, D-087 — text bits now take an **optional** owner-written title, blank by default, the first line standing in; §2f. The invariant is unchanged in force — content stays owner-only, machine-never-writes; only the text-bit lock is gone.)* → `app` (the single db-module write fn).
- **I-R2 — The face is computed.** What a bit displays/searches by is derived at read/index time: `content`, else the per-type mechanical fallback (text: body words · bookmark: captured title, else URL · pdf/audio: metadata title). Never stored as truth of its own. → `computed` (layer E index).
- **I-R3 — Captured-once titles.** A bookmark's captured title is written exactly once, at save, then immutable — it is *truth* (storage test: not rebuildable from stored truth; the live page isn't ours). → `app`.
- **I-R4 — Vocabulary is id-referenced.** Tag words, categories, subtype words are their own rows; everything points by id; a rename touches one row. → `constraint` (FKs).
- **I-R5 — Vocabulary is not content.** Categories and subtype words are never taggable, placeable, or bits. → structural.
- **I-R6 — Eight kinds, everywhere.** Storage map, lexicon, and export enumerate the same eight record kinds (+ the dormant table). → `app` + the I-G1 test.
- **I-R7 — One application per (tag, thing).** At most one tag application of a given word on a given thing — so merge A→B *dedupes by construction* (closes the below-the-line "merge duplicates applications" finding). → `constraint` (`UNIQUE (tag, target)`).
## Cluster 4 — two devices & collisions · LOCKED (D-075)

- **I-D1 — No silent landing on tombstones.** Every write/flush checks its target live (*exists, no `deleted_at`*) while **holding `SELECT … FOR SHARE` on the target row in the write's own transaction** — *not* `FOR KEY SHARE` (a soft-delete is a non-key UPDATE, which key-share does not block; the READ COMMITTED snapshot race lands the write silently otherwise). On a hit: write held on the acting device, prompt at act time, **keep-by-default = restore target + land write** (a hard-deleted vocabulary word has no frozen row — keep = **recreate by name**, I-D6's machinery). → `app` (db-module) + `constraint` (FKs for hard existence) + **a two-session race probe at translation** (reproduce the silent land without the lock; show it blocked with it).
- **I-D2 — Births-only offline.** The outbox carries only *creations* (new bits, their tag applications, new tag words) — never an edit of an existing record. On every device, forever. → structural + `app`.
- **I-D3 — No automatic edit replay.** An edit reaches the database only through a live save with the owner present; a failed compose save fails visibly and retries in memory, **never durably queued**. (A crash-guard draft may restore into the *editor* only — never replay to the DB.) → `app`.
- **I-D4 — Born-at = act-time.** A record created offline carries the act's timestamp as its birth; flush time is not a clock (principle 4's offline corollary — the return loop's time surfaces depend on it). → `app` (the outbox carries timestamps).
- **I-D5 — Edit-vs-edit is last-arrival, whole-record, and *named*.** Resolved by database arrival order; explicitly outside I-D1's prompt (the P12 boundary, §2d/§2h). → design.
- **I-D6 — Flush name-collisions attach.** A new-word creation arriving at flush resolves case-insensitively to an existing word (the near-duplicate rule). → `app` + `constraint` (case-insensitive UNIQUE on tag word).
## Cluster 5 — retrieval honesty · LOCKED (D-076)

- **I-T1 — Nothing stored is unreachable (scoped to things + vocabulary).** Every **thing** and every **vocabulary word** appears in at least one no-precondition surface: live bits → **the ledger** (find's empty query, newest first); boards → home; frozen things → the trash listing; vocabulary → the manager/picker rows, **count-0 words included**. **Acts surface through their things** (a chip on the bit's page, a card, an arrow, a travel line) — they need no surface of their own. → `computed` + `app`.
- **I-T2 — Destructive confirms count the frozen.** The world/trash boundary governs *surfaces*, never an act's *accounting*: every destructive confirmation (delete/merge a word, empty trash, destroy a board) states its loss including frozen things. → `app` (one confirm-builder in the db module).
- **I-T3 — Vocabulary ops reach every row.** Rename (free via id), merge, delete operate on all applications, in-world **and frozen** — skipping trash would let a restore resurrect a tombstone reference (a self-inflicted I-D1 clash). → `app` + the I-D1 FKs.
- **I-T4 — Three surface domains, no fourth.** **World** surfaces exclude trash (the render rules I-L3/I-L5b); **the trash listing** shows only trash; **history** surfaces (bit travel; board ever-placed) show acts indifferent to current state. → design + `computed`.
- **I-T5 — The pull is complete over the world.** Every in-world thing carrying the tag appears; restore re-includes instantly (the pull computes from applications — nothing to rebuild; *translation note: the search **index** may need a reindex touch on restore — layer-E housekeeping, find only, never the pull*). → `computed`.
- **I-T6 — Travel has a surface (v1).** The bit's page shows *has-been-on* (board · arrived · left) — stored history may not be surfaceless (the F3 growth verdict depends on it, D-069). Board-side "ever placed here": deferred, named re-entry. → `computed`.

## From the walkthrough · LOCKED (D-079, 2026-07-21)

- **I-W1 — Un-place and trash are never one button.** Every removal surface presents them as two distinct, labeled acts — *"Remove from this board"* (this board only; confirms when arrows would die) vs *"Move to trash"* (the bit, everywhere; restorable) — never a lone ambiguous "Delete." The model keeps these acts safe (§2g); only a muddled menu can lose data, so the menu is bound here. → design + review on every removal surface.
