# Lexicon — the precise words

**What this is:** the one place the project's terms are pinned down, so nobody (owner, Claude, a future window) uses a word two ways. Functional names for now — *beautiful* names can come later; this is about precision, not poetry. Companion to `agreements.md` (the ruled model). Written 2026-07-20.

**The one distinction everything hangs on: STORED vs COMPUTED.** Eight kinds of thing — in three families, **things · acts · vocabulary** — are written to the database, alongside a dormant ninth and one **derived index** (`reference`, gather's ties — grown from writing, §6). Everything else you see — the pull, find, the graph, a bit's page, a bit's *face* — is *computed on the fly* from those eight. Never confuse a stored thing with a computed view of it.

---

## The eight stored things (the core of the database) — three families

**things** (what exists) · **acts** (what you did — each its own timestamped row) · **vocabulary** (your organizing words — every one referenced by id, so renames are free *by construction*, principle 9).

| family | term | precise meaning | owner's prose word |
|---|---|---|---|
| thing | **bit** | the atom — one unit of thought or consumption (text, drawing, image…). Needs no title, board, or tag to exist. | *fragment* |
| thing | **board** | a named space you arrange things in. The chosen assembly. | *board* |
| act | **tag application** | one tag stuck on one thing, at one time — the recorded *act* of tagging. | — |
| act | **placement** | one bit **or board** sitting on one board — carries its position, size, display-size, **arrival time and (if removed) departure time**. One durable row per (target, board), reused on re-place; **kept as membership history, never erased** (§2c). | — |
| act | **connector** | an arrow between two cards on one board (arrangement, not meaning — ephemeral, unlike the two acts above; §2c/D-073). | *arrow* |
| vocab | **tag** (word) | a word, stored once. Renaming is free (everything points at it by id). | *tag* |
| vocab | **category** | an optional group a tag word sits in (zero or one per tag — §3b). Create/rename/dissolve free; its words survive dissolution. Not taggable, not placeable. | — |
| vocab | **subtype word** | one entry in the owner-editable subtype list (cartoon · doodle · script · …) — §5c, "exactly like tag words." Not taggable, not placeable. | — |

*(A ninth table exists but is empty and dormant — the deferred pairwise "link"; not part of v1. A tenth, **`reference`** (§6), is the first **derived index** — gather's directed bit→bit ties, grown from writing and rebuildable from bodies; it belongs to no family.)*

## The computed surfaces (never stored — assembled from the eight)

| term | precise meaning |
|---|---|
| **the pull** | tap a tag → *everything* carrying it (bits and boards), complete and automatic. Not a board; not curated. |
| **find** | search over words + filter by tag (include/exclude) and by type/subtype. Results: topics, boards, bits. **Empty query = the ledger: every live bit, newest first — the reachability floor (I-T1).** |
| **home** | what opens the app: **your boards**, most-recently-touched first. |
| **a bit's page** | one bit + everything connected to it (its content, tags, the boards it's on — **and its travel**: has been on, arrived, left). |
| **the graph** | dots (bits · boards · tags) joined by shared words + shared places. Local-neighborhood first. *(later phase)* |
| **the publish preview** | when you make a board public: *exactly what a guest will see* — visible cards, withheld (private) cards, and any public boards it links into. Computed at publish; not a maintained surface. *(sharing phase)* |
| **the inbox** | your **loose** pile — every live bit that **no live board shows**, newest-first. Computed, never stored: put a loose bit on a board and it leaves; take it off its last board — or trash that board — and it returns, with nothing to keep in sync. A loose bit's guaranteed way-back, the way the ledger is for everything live. *(capture)* |
| **gathered into** | standing on a bit, every live thought that **gathered** it — computed from its `reference` rows read backward; free, never maintained. *(gather)* |

**Relatedness — the three-way line (2026-07-25).** Two bits relate through a **shared middle** — a tag or a board (§6's "introduction"; feeds the pull and the graph) — *or* through a **thread you tie on purpose**, a **reference** (→ *gathered into*). A third thing looks similar but isn't relatedness: an **arrow** (a *connector*) is pure board arrangement, storing no bit↔bit fact. So: *arrow* = arrangement · *reference* = gathered-into · *tag / board* = shared middle.

## The parts of a bit

- **type** — `text` · `drawing` · `image` · `bookmark` *(saved URL)* · *(later: `pdf` · `audio`)*. **Machine-set** from how you made it.
- **subtype** — `cartoon` · `doodle` · `script` · `notes` · `diagram` · … **You set it**, from a small editable list. Optional.
- **content** — **only the words you authored** (typed/dictated), one nullable field on every bit; **the machine never writes it**. On a text bit it doubles as an **optional title** (D-087 — blank by default, the first line stands in). Empty is normal — the face falls back mechanically.
- **face** — what a bit **shows** (its display headline); **computed, never stored**: your `content` if any, else the mechanical fallback per type — text: the body's plain words · bookmark: the **captured title**, else the URL · pdf/audio: the file's metadata title · drawing/image: nothing (the visual self). **The face's first words are the bit's de-facto title**; on a text bit an **optional written title** (content) stands in for the first line (D-087). **Search is separate and wider** (D-088): it indexes *all* a bit's words (content + body + captured-title + URL), never just the face — so a titled note stays findable by its body.
- **captured title** — a bookmark's page-title, read **once at save** and stored as machine truth beside the URL, immutable thereafter (the live web can't be re-read — §2b). To rename a bookmark, you write `content` — your act, your column.
- **source** — `source_url` · `source_title`: where a **clip** came from (the page a quote or image was lifted out of, plus that page's title), read **once at capture** and **frozen** — a dead or edited page never rewrites it. Both blank = self-made (most bits). Distinct from a bookmark's `url`: a whole-page bookmark *is* its own source, so it leaves `source_*` blank; only a clip carries them (§2a).
- **visibility** — `public` · `private` (`shared` later). Lives on **both bit and board**. Bit default **public**; board default **private**. Composition: a card shows to a guest **iff its target is public** — bit-privacy always wins (§2a). *(The field is `visibility`; "privacy" is only its informal name — don't let the two words drift.)*
- **substance / meaning / presence** — the three groupings of what a bit holds: *what it is* / *what you say about it* / *where it lives*.

## Display words (keep these crisp)

- **card** — a bit's visual box on a board (draggable, resizable).
- **board-card** — a board shown *as a card* on another board (title + small preview; tap to enter).
- **full / small** — a placement's display size (the thing itself, vs a compact card: first words, tap to expand).
- **canvas** — a board's **spatial rendering mode**. ⚠ NEVER a synonym for "board."
- **collection mode** — a board rendered as an unpositioned pile.
- **document mode** — a board rendered as a vertical flow. *(deferred — §6b)*

## The three surface domains (ruled 2026-07-20 — every surface belongs to exactly one)

- **world** — what *is*: excludes trash (the render rules). The pull, find, home, boards, the graph.
- **trash** — the frozen: its one surface is the **trash listing**.
- **history** — what *happened*, indifferent to current state: a bit's travel; a board's ever-placed list *(board side deferred)*.

The boundary governs **surfaces only** — destructive acts always *count* frozen things (principle 12).

## The acts (verbs)

**make / jot** a bit · **tag** it · **place** it (→ a placement) · **un-place** it (take a card off a board — kept in travel history) · **pull** a tag (→ the pull) · **connect** two cards (→ a connector) · **call in** an existing bit onto a board (reuses its membership row — clears the departure, never a second row) · **clip** a quote or image out of a page (keeps its **source**) · **gather** a bit from inside your writing (type `[[`, pick it → a **reference**) · **trash / restore** a bit **or board** (freeze / unfreeze — §2g). A bit **no live board shows** is **loose** (adjective) → the inbox.

## Retired — do NOT use (these cause drift)

| dead word | use instead / why |
|---|---|
| **link** (as a relationship / backlink) | deleted from v1 (§6). Relatedness = shared tag or shared board. |
| **legend · caption · handle** | → **content** |
| **kind** (the field) | gone — the four thought-words are ordinary tags now |
| **stage** | dropped from v1 (D-070) |
| **canvas** (meaning a board) | → **board**; "canvas" = the spatial *mode* only |
| **topic page** | → **the pull** |
| **transclusion** (jargon) | → "one bit on many boards" / "call in" (fine in technical notes) |
| **backlink** (the word) | → **gathered into** (the reverse read of a `reference`) — "backlink" is Obsidian's word and drifts |
| **pull in** (for gathering) | → **gather** — "pull in" collides with **the pull** (tap-a-tag) |

## The one collision — RESOLVED (owner-confirmed 2026-07-20, D-074)

**"link"** was retired as a *relationship* yet still named a *bit type*. **Ruled: the bit type is `bookmark`.** "link" now has zero live meanings in the product — a hyperlink inside prose is just a hyperlink.

## Code names (translation, D-083) — the words as they appear in the schema

This lexicon is the naming authority for code (ruled); the schema uses its words verbatim, singular (`supabase/migrations/20260721000001_init.sql`). Technical names born at translation, pinned here per the same-pass rule:

- **tables** — `bit` · `board` · `tag_application` · `placement` · `connector` · `tag` · `category` · `subtype_word` · `dormant` (the nameless ninth — "dormant" describes its state, deliberately not a product word) · `reference` (the first **derived index** — gather's directed bit→bit ties, grown from the body on save; §6)
- **body** — a *text* bit's typed words (rich text) — the thing itself, §2a/§2b's own word. Distinct from **content** (owner-only, any type).
- **strokes** — a drawing's vectors, one opaque package on the bit row.
- **url · captured_title** — a bookmark's two stored halves (§2b).
- **source_url · source_title** — a clip's frozen provenance (the page it was lifted from + that page's title); blank = self-made; distinct from a bookmark's own `url` (§2a; the I-S set).
- **chip** — inside a text bit's `body`, a gathered bit renders as a **chip** that also caches a copy of the target's **face**, so a note is findable by what it references; the copy self-heals on the note's next open/save (the Principle 9 carve, §6 — no rename fan-out).
- **storage_path · thumb_path** — file-store addresses (paths, never URLs); thumb is layer E.
- **media facts** — `media_width` · `media_height` · `file_name` · `mime` · `byte_size` (§2a plumbing; only where a file exists).
- **state stamps** — `deleted_at` (the freeze; empty = in the world) · `left_at` (empty = here now) · `arrived_at` (first arrival; also the placement row's birth stamp) — never a flag beside a date.
- **face · search_tsv** — generated columns (computed by the database itself; layer E): the face rule lives once, in `bit_face()`.
- **thing** — in view rows: `'bit' | 'board'` (the things family as a column).
- **label** — a view's display word: the face for a bit, the title for a board (§2f).
- **views** (the named surfaces, computed) — `the_pull` · `the_ledger` · `home` · `trash_listing` · `bit_travel` · `board_cards` · `board_connectors` · `tag_counts` · `subtype_word_counts` · `the_inbox`.
