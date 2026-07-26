# Agreements — what we've settled, in detail

**What this is:** the complete record of everything agreed in the owner–Claude working conversation of 2026-07-19/20 — the model, ruled piece by piece, latest ruling wins. **This document supersedes `draft-techlayer.md`** and outranks every older doc where they conflict (SPEC, plan docs — they get synced to this before any build). Open items are listed at the bottom as open, never silently assumed.

**Status:** the **bit**, **tags**, **the pull**, and **boards** are ruled in full · **links: RULED — none in v1** (the word is deleted from the product; §6) · **connectors (canvas arrows): RULED IN** (§6a — placement-anchored, additive, post-port) · **document mode: explored & deferred** (§6b) — **v1 is canvas-first**. The conceptual model is CLOSED **and audit-merged — all 14 independent-audit findings resolved (D-072–D-076)**; what remains is the life walkthrough and translation to schema (§8). · **Hardening pass (2026-07-20, D-071):** a record-level rigor audit closed nine ambiguities/contradictions — trash-as-freeze · content-as-one-field · placement history kept · one-category-per-tag · pull-complete-for-the-owner · board-card arrows · deletion-safety (principle 12). Rulings threaded into §1/§2/§3b/§6a/§7; the model is now record-level *consistent*, not just closed.

---

## 1. The standing principles (ruled)

1. **You write meaning; the system writes bookkeeping. Never the reverse.** The system never guesses meaning (no AI reading your drawings, no auto-applied guesses) — it may only *propose*, mechanically.
2. **Truth vs regenerable — the storage test.** Everything stored is either *truth* (your acts and your content — irreplaceable, all of it in the export) or a *machine artifact* rebuildable from truth (thumbnails, search indexes, extracted titles). Nothing else is ever stored.
3. **Facts are stored; retrieval is computed.** Search results, pulls, what's-on-a-board, time surfaces — all computed fresh from the facts, stored nowhere, maintained by no one. You manage facts; surfacing follows. Any feature that would require you to *manually keep a surface accurate* is wrong by this rule. *(Regenerable accelerators — the search index, thumbnails — are cache, layer E, never truth: a surface is never **sourced** from state that can't be rebuilt.)*
4. **One clock.** Every record keeps when it was born (and last touched, where editable) — stored in one standard form, always shown in your local time. Every ordering anywhere (recency pickers, a bit's travels, newest-first) derives from these stamps. No second clocks.
5. **Nothing is ever forced.** No required titles, tags, subtypes, or content lines. Ceremony is a bug.
6. **One fact, one record.** A connection is never stored twice (being on a board never writes a duplicate "link").
7. **Automatic surfaces never lie.** A pull is complete, or it's broken. Nothing automatic can be hand-curated. *(Complete over **the world** — trash is outside it, §4 — and complete for **you, the owner**. A guest's pull, if guests ever have pulls, gathers only what is public AND already reachable to them — a tag opens nothing, §4. Still uncurated, just scoped. 2026-07-20.)*
8. **Meaning travels with the bit; position stays with the board.** Edit once → changed everywhere (placements are live references, never copies).
9. **Renames are free.** Vocabulary — tag words, **categories, subtype words** — and board titles change without touching anything tagged, placed, or made: every word is referenced by id, so a rename touches one row (the vocabulary family, §7). *(**Carved 2026-07-25, gather — one named exception, recorded as a trade, not smoothed into "no-drift":** a **chip** stores a **copy** of a gathered bit's face inside the referencing note, for one payoff — a note is **findable by what it references** (Postgres can only find a note by words *in* it, so those words must be copied in). It **self-heals lazily** — the copy re-syncs on the note's next open/save — and **renaming a bit still rewrites nothing elsewhere** (no fan-out); the only cost is that an untouched note may show a renamed target's **old** name in its list-label until you next touch it. Rich surfaces (the bit's page, cards) always resolve the face **live**. The rejected alternative — active rename fan-out over every referencing note — is parked. §6 amendment; I-Ref8.)*
10. **Everything is exportable, always.** Deleting a **thing** (a bit, a board) is recoverable — trash — until emptied deliberately. *(Carved 2026-07-20: acts and vocabulary die without a trash stage — a tap-deleted connector, a deleted tag word, a dissolved category are simply gone; principle 12 guards those with proportional confirms instead.)*
11. **Ink carries words, optionally.** A drawing's content line, and the typed title beneath a handwritten board title, make the hand findable — never required.
12. **Destruction asks; everything leans toward keeping (2026-07-20).** Deletes are soft and recoverable by default. Where an act would *actually lose* something — emptying trash, deleting a tag word, or a two-device clash that would drop something you just used (a *referential* clash — something deleted vs. something used, §2h; a same-bit edit-vs-edit overwrite is **outside this promise** — §2d, accepted knowingly) — the system confirms first and keeps by default. It does **not** nag on ordinary reversible moves (un-tagging one thing, un-placing a *bare* card): a confirm on every act is the ceremony we refuse (principle 5). **Confirmation is proportional to what's lost** — so un-placing a card *that carries connectors* removes them and therefore asks first, while a card with none goes silently. And a confirmation's count **reckons with frozen things too** — trash hides from surfaces, never from an act's accounting (§4's domains): *"3 things + 2 in trash carry this word."*

---

## 2. The bit — ruled in full

One small unit of thought or consumption. **Unnamed, on purpose** — a thought doesn't have to earn a title to exist. **Composed one at a time, always** — born free, or born on a **starting board** (in which case it also gets that board + a placement from birth). Never requires a title, a board, or a tag.

### 2a. Substance — what it is *(mostly the machine's business)*

| holds | detail | who writes it |
|---|---|---|
| the thing itself | the typed words · the strokes (vectors — crisp forever, recognition-ready someday) · the image file · *(later: pdf · audio · url)* | me |
| type | text · drawing · image · **bookmark** *(a saved URL — renamed from "link," owner-confirmed 2026-07-20; the collision with the deleted relationship word is closed)* · *(later: pdf · audio)* — the half the machine can tell on its own | system |
| subtype | cartoon · doodle · script · notes · diagram · … — **the half only Gargi can give.** Preset chips offered at ✓/drop, one tap, optional, editable later, my vocabulary | me |
| dates | created · last edited | system |
| privacy | **public by default, flat** — one-tap toggle to private, changeable anytime | system default · only me to flip |
| trash | soft-delete, recoverable until emptied deliberately | me deletes · system remembers |
| plumbing | permanent ID (the spine everything points at) · media facts (width×height, file name, format, size) · a bookmark's **captured title** (the page's title read once at save — machine truth, immutable; §2b) · thumbnails · storage addresses | system — invisible, regenerable where derived |

**Privacy & sharing — ruled in full (Cluster-1 audit close, 2026-07-20).** Two `visibility` fields, *composed* — never a single OR (this kills the SPEC §3 leak where a private bit went public the instant it was placed on a public board):

- **bit** — `visibility` **public by default** ("more likely I want something public than private"; the philosophy now says the same — "new things start public," rewritten), one-tap to private, changeable anytime.
- **board** — `visibility` **private by default**; a board turns public only by a **deliberate act**. The split: a bit is a low-stakes atom that leans public; a board is a whole assembly, shared on purpose. *A locked room can't leak.*
- **Composition = reachability AND visibility.** A guest sees a bit only when the *surface* is reachable (its board is public) **and** the *bit itself* is public. **Board publicity never overrides bit privacy** — principle 8 made literal (privacy travels with the bit). One rule for every card, bit-card or board-card: **a card shows to a guest iff its target is public; a private card renders _absent_** (the guest never learns anything was withheld).
- **The gate = a per-board publish preview.** The instant you make a board public you are shown *exactly what a guest will see* — the cards that show, the cards withheld, and any public boards this one links into. This **replaces** the earlier "one-time review of everything marked public" (a hand-maintained global pile — a principle-3 smell): the review is now per-board, at publish, computed.
- **v1 safety:** nothing is visible to another human until the sharing phase ships; every board is private until then.
- **Deferred (named re-entry):** *contextual bit-privacy* (a bit born in a private board born private) — unneeded now because the locked room + publish preview already protect private writing; re-enter only if publish-previews prove tedious in real use.
- **Since ruled (§4, 2026-07-20):** a guest's pull gathers only what is public AND already reachable — a tag opens nothing; the "what counts as open" sub-question is named in §4 for the sharing phase.
- **Translation:** SPEC §3 is stale twice — its `or visibility='public'` OR-leak *and* its "private by default" (§3) — and is authoritative on nothing privacy-related; it is rewritten from this ruling (AND, not OR).

**Source & the bookmark preview — ruled (2026-07-25, capture Slice 1 · D-100).** A bit may carry two optional provenance fields, **`source_url`/`source_title`** — where a **clip** (a quote or image lifted *out of* a page) came from:
- **Optional and frozen.** Both blank = self-made (most bits); when set, they are read **once at capture** and never re-read — a dead or edited page can't rewrite what you filed (the storage test, principle 2 — the same reasoning as a bookmark's captured title). The substance rule never names them, so any kind may carry them.
- **A bookmark's source is itself.** A whole-page **bookmark** stores its title once (in `captured_title`) and leaves `source_*` blank; only a clip carries source. What shows as the source = `source_url` if present, else the bookmark's own `url`.
- **A bookmark may now carry a preview.** The per-type substance rule was relaxed **for bookmarks only**: a bookmark may hold a preview picture (`storage_path`) while `url` stays what it points at. The relaxation is surgical — text/drawing/image still refuse a stray file (proven, `verification/capture-proofs.sql` §2). → invariants **I-S1–I-S4**.

### 2b. Meaning — what I say about it *(all optional, accumulates over its life)*

| holds | detail |
|---|---|
| **content** | **only words I authored** — typed or dictated ("cartoon of a girl who feels overwhelmed right now"); empty is normal. What a bit shows and searches by is its **face** — my content if I spoke, else a mechanical fallback per type (the ruling below). Dictation rides the keyboard mic from day one; a dedicated speak-button only if the two-tap path proves slow |
| **tags** | topics & associations — see §3. Redundancy with content is fine: two routes back beat one |
| links | **none in v1** — bit-to-bit relatedness is always mediated (shared tag or shared board); see §6 |

**Content is yours alone; the face is computed (ruled 2026-07-20 — SUPERSEDES D-071 ruling #2, "content is one field, auto-mirrored/cached"; resolves §2b-vs-§7 in §7's favor).** The stored `content` holds **only words you authored** — the machine has **no write path to it**, so "never silently overwritten" is *structural*, not promised. What a bit displays and searches by is its **face**, computed fresh and never stored: **your content if you gave any** → else, mechanically by type — **text:** the body's plain words (the words *are* it; no mirror, no cached copy); **bookmark:** its **captured title** — the page's title read **once at save** and stored as machine truth beside the URL (storage test, principle 2: the live page isn't ours to re-read, so a dead or retitled page must never blank or mutate a face you've navigated by), else the URL itself; **pdf/audio:** the file's own metadata title (ID3 etc. — genuinely mechanical, no transcription needed; rebuildable from the stored file → layer E); **drawing/image:** nothing — the bit shows as its visual self. Chosen consequences: an *untouched* suggestion was never in your column, so there is nothing to overwrite; **clearing your words reverts the face to the mechanical fallback** — a bookmark always shows something (chosen, not an accident of the mechanism); **the face's first words are the bit's de-facto title** — you edit the headline by editing content (no separate title field — §2f); and **content was locked for text bits in v1** — writable content on text *is* a title field. **AMENDED D-087 (2026-07-22): the owner opened that gate — text bits now take an *optional* title (content), blank by default, the first line standing in (nothing forced); §2f.** And **the face is display-only; searching is wider (D-088):** the search index covers content + body + captured-title + URL, never face-only — so titling a note (or captioning a bookmark) never hides its body/page-title from find. For a rich-text bit the derived words are the **plain words** (formatting rides in the body).

### 2c. Presence — where it lives *(changes freely; never touches substance or meaning)*

- Appearances on zero, one, or many boards. Per board: a **position** (optional — absent = pile/collection mode) and a **size** (the same bit can be poster-sized on one board, a stamp on another).
- **A bit remembers every board it's ever been placed on (ruled 2026-07-20).** Each placement carries when the bit **arrived** and, if you removed it, when it **left** — and the record — the bit's *membership* on that board — is *never erased* by any ordinary act; only the one true destroy (emptying a bit or board from trash, §2g) removes placement rows, taking their travel legs with it, knowingly. So the **origin** is simply the first placement; a bit's whole **travel** survives un-placement and is derivable free; and **any board can list everything ever placed on it.** *(v1 keeps it simple — **one durable placement row per (target, board)**: "first arrived [date] · here now?". **Re-placing** a bit on a board it left **reuses that same row** — first-arrival kept, presence back to here-now, the last **departure overwritten** — so "never erased" means the *membership row* is permanent, **not** that every entry/exit is logged; the full visit-by-visit timeline is additive later. **Trashing records no departure** — it's a freeze, §2g; only a deliberate un-place stamps one. Old **connectors are not remembered** — arrows are live arrangement, not travel.)*
- A placement's target can be a bit **or a board** — a board on a board shows as a **board-card** (title, tap to enter; reference, not containment — so no nesting problems).

### 2d. The v1 choices, made knowingly

- **No edit history.** Revise in place; trash protects deletes, not edits. A version log is addable later with no rework.
- **Two devices, same bit: last edit wins** — precisely: **the last write to *arrive at the database* wins, whole-record** (no per-field merges). Honestly (2026-07-20 — replacing the false "one human in one chair," which contradicted the product's own phone + Daylight + desktop premise): one author whose two compose screens almost never hold the same bit mid-edit; when they do, the earlier save is gone — a real, named, accepted v1 loss. An additive edit-history/version layer is the upgrade if real use ever bites (the `updated_at` it needs already exists — principle 4; the optimistic-concurrency alternative was rejected: cheap to detect, expensive to *answer* — conflict copies + a merge UI, over-built for one author). **This overwrite sits outside principle 12's clash promise by explicit boundary** — the prompt guards *referential* clashes (§2h), not edit-vs-edit.

### 2e. Considered and rejected

- **Capture location** — never asked for; wrong flavor for a private notebook.
- **A favorites field** — significance = tagging; a star would be a second way to say the same thing.
- **Link labels/flavors** — a link, if it exists, is a bare reference ("a link is a hyperlink").
- **Auto-chunking of pasted text** — you decide where the joints are; splitting is a later nicety, demoted because composition on a board is natively granular (every ✓ makes a unit).

### 2f. Display

A bit is **shown by its face's first words** (§2b) anywhere a label is needed — search results, pickers, graph dots. Doodles/images show their content line (their face); a bit with no words shows as its visual self. The same rule is the **abridged form** when a placement renders small: first words for text, the content line for media.

**No title/subject split in content (ruled 2026-07-20):** a title component would reintroduce per-bit naming ceremony (rejected day one — titles belong to assemblies). First words are the abstract for fragment-sized text; the content line already is one for media. **Evidence gate:** the day a small-rendered *long* text bit reads wrong in real use, an optional title field earns its place — one nullable column, additive, no rework.

**AMENDED 2026-07-22 (owner ruling — the A10 gate opened by choice, ahead of its evidence trigger).** The owner enables the **optional title now**. A text bit gets a title of its own that is **optional and blank by default — the first line stands in, so nothing is ever forced** — writable whenever the owner wants more than the first line. Mechanically this **unlocks owner-writes to `content` on text bits** (the schema already carries the column — a switch, not a rebuild; built at the port). The "nothing forced" principle is intact: an empty title falls back to the first line exactly as today. This **supersedes the 2026-07-20 "no title/subject split" ruling for text bits.** Rationale: across the Checkpoint-B conversation the owner repeatedly and *specifically* asked for the *ability* to optionally set a title beyond the first line — a clear owner want for their own tool — and rules it in knowingly, **overriding the advisor's hold-the-gate recommendation** (latest ruling wins). *(The advisor's process point stands and was honored: this is the owner's explicit re-ruling, recorded — not the author "leaning."*)

### 2g. Trash & deletion — ruled (2026-07-20)

**Trash is a freeze, not an erase.** Trashing a bit *hides* it everywhere at once — its cards on every board, and any connectors anchored to those cards — without destroying anything. **Restore brings all of it back, exactly** (the arrows too). A trashed bit records **no** departure from its boards; it's hidden, not moved. **Emptying trash is the one true destroy** — and it asks first (principle 12). **The destroy is total, stated once (ruled 2026-07-20):** destroying a bit takes its placements (and their connectors), its tag applications, and its media — the file bytes and every derived artifact — with it. Nothing belonging to anything else is ever touched.

Two acts the earlier wording ran together:
- **Un-place** — you deliberately take a card off a board. You meant it: that card's connectors on that board die (**it asks first when the card carries any — principle 12**; a bare card goes silently), and its placement is stamped *left* (the row is kept as membership history, not erased — §2c).
- **Trash** — you delete the whole bit. Nothing dies; it's hidden and fully restorable.

**Deleting a board is a freeze too (ruled 2026-07-20, Cluster 2).** Trashing a board hides the board and its whole *arrangement* — its placements, its connectors, its tag applications — and any **board-card** pointing at it (on another board) renders **absent**; but **the bits it held are untouched** (they're independent atoms, alive on their other boards or on their own). **Restore** brings the board and its arrangement back exactly. **Emptying it from trash** is the one true destroy: it removes the board, the placements *on* it and the board-cards *of* it, its connectors, **and its tag applications** — **never the bits** (a bit that loses its only board becomes a *boardless bit*; giving that bit a home is Cluster 5). A trashed board also **drops out of pulls and find**, like a trashed bit. Confirmation is proportional (principle 12): a light confirm to trash (*"its bits stay in your collection"*), a full one to truly destroy (*"permanently delete this board and its layout — the N bits on it remain but lose this arrangement"*).

**Two-device clash, safe by default** — ruled *mechanical* in **§2h**: the prompt, its detection (no new stored state), and the standing rules that keep two devices conflict-free.

### 2h. Two devices — ruled in full (2026-07-20)

**The conflict surface is tiny by construction — and stays that way by rule.** The phone captures and browses, never composes (D-023); the offline outbox carries only **births** (new bits, their tag applications, and any newly typed tag words — inserts with fresh IDs, which cannot conflict with anything); the compose devices (desktop · Daylight) are online clients on one database. That leaves exactly **three clash types**, each ruled:

1. **Referential clash — the keep-by-default prompt (principle 12, now mechanical).** No write silently lands against — or silently vanishes into — a trashed or deleted target. Detection needs **no new stored state**: trash-is-a-freeze rows (§2g) *are* tombstones, so the write/flush-time check is simply *"does my target exist, un-trashed?"* On a hit, the write is **held on the acting device** (the failed request; a capture just stays in the outbox — flush happens with the app open, so there is always a screen to ask on) and you're asked at act time: *"you deleted 'astro' on your Daylight, but just tagged something with it here — keep the word?"* **Keep (default) = restore the target and land the write; decline = drop the held write.** Where the target is a **hard-deleted vocabulary word** (no frozen row exists — word-delete is real loss, §3e), **keep = recreate it by name**: the near-duplicate machinery (§3e; clash type 3 below) already resolves words by name, so the word simply exists again and the write lands on it — to you it just looks like the word came back. *Mechanism note for translation: the check must hold a row lock on the target — `SELECT … FOR SHARE`, in the same transaction as the write. **Not** `FOR KEY SHARE`: a soft-delete is a non-key UPDATE, which key-share does not block (key-share guards existence/keys — what FK checks see — and a tombstone is exactly the case FKs are blind to); without the lock, the READ COMMITTED snapshot race lands the write silently. Verify with a two-session race probe at translation.*
2. **Edit-vs-edit — last arrival wins, whole-record, silent, accepted** (§2d). Outside the clash promise by explicit boundary.
3. **Flush name-collision** (an offline capture typed a tag word the desktop created meanwhile) — resolved by the **near-duplicate rule** (§3e): attach to the existing word, case-insensitive. Mechanical, no prompt.

**Two standing rules that keep the surface tiny forever:**
- **Births-only, and its compose twin:** the outbox may only ever carry *creations*, never edits of existing records — and **an edit reaches the database only through a live save with the owner present; nothing ever replays edits automatically.** A compose save that can't reach the database (the Daylight drops wifi) **fails visibly and retries in memory — never durably queued.** *(A device-local crash-guard draft that restores into the editor for you to re-save is compatible and additive later; an auto-flushing edit queue is what this forbids — it would reopen the general sync problem this section closes.)*
- **Born-at = the act's moment, never the sync's** (the one-clock's offline corollary — principle 4): a capture queued Tuesday on the train and flushed Wednesday is *born Tuesday* — the outbox carries the act's timestamp and the insert uses it. Otherwise every offline capture lies by up to a day, and the time surfaces (recency, resurfacing — the return loop) inherit the lie.

---

## 3. Tags — ruled in full

### 3a. What a tag is

Two kinds of record carry tagging itself: the **word** (stored once — why renames are free) and each **application** of it (this word, on this thing, **at this time**). *(A third, optional, stands beside them: the **category** a word may sit in — §3b; vocabulary family, §7.)* Anything is taggable — bits and boards. Everything else about tags (the pull, counts, graph edges) is computed.

### 3b. Categories — structure that emerges from use

- A category is **an optional grouping that holds many tag words**; a tag sits in **zero or one** category (ruled 2026-07-20 — one home per tag; multi-home is additive later if ever missed). Creating one = typing its name once, anywhere. The picker grows a labeled row; existing words can be assigned in, moved, or the category dissolved (words survive) — all free, forever. No schema change per category, ever.
- **Ruled now:** multiple topic tags are normal; no preset source/nature categories — *categories emerge once real use begins* (e.g. a future "aliveness: so-alive · deadening" costs one typed word).
- The old `kind` field is gone; the four thought-words (learned · noticed · wondered · theorized) are ordinary seeded tags, available if ever wanted.

### 3c. The picker

Guided, never gating: labeled rows of my own chips, tap to toggle, create-new always present, skip always legal, recency-first ordering. Touch-sized (Daylight-first).

### 3d. Propose vs apply — the auto-population boundary

**The system may propose; only my acts apply.** Mechanical proposal sources only:
- **context** — where the bit is born
- **co-occurrence** — "things tagged #jupiter usually also carry #astrology — add it?" (pure counting)
- **title-match** — a board named "astrology" is offered the tag
- **recency** — my live vocabulary floats to the top

**Context rules (ruled):** born **inside a pull** → auto-tagged with that tag (the room I'm standing in *is* the tag; this is my act). Born **on a tagged board** → the board's tags appear as **pre-lit chips** — one glance, confirm or flick off — never silently inherited (pulls stay meaning-what-I-meant).

### 3e. The tag manager

What I can tell it, and what the machine must therefore do:
- **Rename a word** — free; every use follows instantly.
- **Merge A into B** — everything carrying #astro now carries #astrology — **every row, in-world and frozen** (skipping trash would let a later restore resurrect an application pointing at the deleted word — a self-inflicted tombstone clash, §2h); one confirmation showing counts; A disappears.
- **Delete a word** — confirmed with its count, **frozen carriers included** (*"3 things + 2 in trash carry this word"* — principle 12); the things all survive, they just lose the word.
- **Create a category** — type its name once; it exists. **Assign/move** words between categories anytime. **Dissolve** a category — its words survive, ungrouped.
- **Near-duplicates prevented at birth** — Astrology/astrology can't both exist; the picker offers the existing one first.
- **Always visible:** each word's count and last use — **every word listed, count-0 included** (a stored word no surface shows would break the reachability floor, I-T1) — pruning the vocabulary is a five-minute pleasure, not archaeology.

---

## 4. The pull *(named 2026-07-20 — from the philosophy's own verb, "whenever I pull the tag")*

Tap a tag → **everything carrying it** — bits *and* boards — gathered automatically, complete, the instant the word is first used. **Never hand-curated** (completeness is its whole value: it must catch what I forgot, so it must not be able to lie). It is not a board and not a thing I manage. Writing inside a pull creates a bit born tagged; a board created from inside a pull is born tagged.

**Completeness, made literal — the three domains: world · trash · history (ruled 2026-07-20).** **Trash is outside the world**: a frozen thing is suspended, not part of it. **The pull is complete over the world — everything in the world carrying the tag, no exceptions.** Restore returns a thing to the world and it reappears in every pull *instantly, with nothing to rebuild* — the pull never lied; the world changed. *(Literal for the pull, computed from applications; the search **index** may need a reindex touch on restore — layer-E housekeeping, find only.)* Surfaces of the **world** exclude trash (the render rules, §2g/§6a); **the trash listing** is the frozen things' one surface; **history surfaces** (a bit's travel, a board's ever-placed-here list) show *what happened*, indifferent to current state. The boundary governs **surfaces only — never what acts must reckon with**: destructive confirmations count frozen things (principle 12, §3e). No include-trashed toggle — the trash listing already serves it.

**A tag opens nothing — the guest principle (ruled now; the feature ships with sharing).** A guest's pull, if guests ever have pulls, shows only things **public AND already reachable through surfaces open to them** — tags gather what's open, they never widen reachability. *Named sub-question deferred into the sharing phase: what counts as "open" — **globally public** (every public board anywhere; the philosophy's open-web thread + D-056 lean this way) or **share-scoped** (only what was handed to them; the keyed-guest tier makes this thinkable). The principle survives either reading — decide when sharing is real.*

---

## 5. Boards & placement — RULED IN FULL (board round closed 2026-07-20)

- A board is **the named assembly** — the primary tying feature of the product. Multi-purpose by design (creative play, topic consolidation, staging a piece); the system attaches no purpose.
- **Title ≠ tag.** A title is one board's unique expressive name ("Saturn & cycles" contains no "astrology"); only its tag places it in a pull. Titles never silently become tags; an obvious match may be offered one-tap.
- **Handwritten titles welcome:** my hand on top, the typed title beneath as the searchable shadow. Untitled boards are legal.
- Two modes, same board: **collection** (a gathered pile, no positions) → **canvas** (arranged spatially). *(Document mode = a later third rendering, §6b.)* **On a canvas, every card has a position (ruled 2026-07-20): a called-in bit lands where you dropped it** (center if summoned without a pointer) — no positionless cards on an arranged board.
- Boards are taggable, searchable by title, and appear in pulls and find results as their own kind.
- **Boards carry `visibility`** — private by default; public only by a deliberate act. The privacy composition (reachability AND bit-visibility; a private card renders absent; a per-board publish preview at the moment you go public) is ruled in §2a.
- **No `stage` in v1** (ruled 2026-07-20). Ordered board-maturity was never designed, and growth is already served by travel + accumulating pulls + revision (audit F3). Significance/maturity, if wanted, rides ordinary tags (`#seed`, `#fruit`). A real ordered `stage` field is additive later if genuinely missed.
- **Board-card** (a board placed on another board): shows **title + a small preview** of the board's contents; tap to enter. Reference, not containment (no nesting problems).
- **Every bit gets its own simple page** (not a canvas): its content, tags, the boards it's on — **and its travel** (*has been on: board · arrived · left* — read straight off the placement rows). **Travel's surface is ruled v1, not optional (2026-07-20):** the F3 verdict rested on "travel + accumulating pulls + revision IS growth" (D-069), so surfaceless travel would silently unwind an owner ruling. The board-side history view ("everything ever placed here") is **deferred — re-entry: the first time you stand on a board wondering what left it.**

### 5a. The home surface — RULED (2026-07-20)

Opening the app lands on **your boards** — a simple grid/list, most-recently-touched first. The honest v1 default: oriented, works from day one with little content, no design-heavy surface to build first. *(A hand-made "doodled home" board and a resurfacing feed are both real wants — deferred: the feed is Phase 6 by design, the doodled home is a treat you can build yourself any time as just another board.)*

### 5b. Small-card display — RULED (audit F7, 2026-07-20)

A placement carries a **display size**: full (the thing itself) or **small** (a compact card — first words / content line, tap to expand/jump). Available on the v1 canvas — it's just a value on the placement, costs nothing, and de-clutters a busy board.

### 5c. Subtype vocabulary's home — CONFIRMED

The subtype chips (cartoon · doodle · script · notes · diagram · …) live as a **small owner-editable stored list**, exactly like tag words — add/rename/remove freely. Not hard-coded. **"Exactly like tag words" is literal (2026-07-20):** removing a subtype word is confirmed with its count (frozen carriers included), the bits survive and simply lose the subtype, and near-duplicates are prevented case-insensitively at birth.

### The acts framing (ruled)

Placing and tagging are **acts I take**; their records are the memory of the acts — which is why each carries a timestamp and lives as its own row, not as a property on the bit. Undo = removing the act's record, no residue — **for un-tagging and tap-deleting a connector. Un-place is the ruled exception (carved 2026-07-21, Checkpoint A): it stamps a departure and _keeps_ the membership row, because travel is memory (§2c).** And the asymmetry is chosen, not accidental (owner-confirmed 2026-07-21): **un-tagging is traceless** — no record survives that the word was ever applied; tag-history is additive later if real use ever disagrees. Substance is what a thing *is*; the rest is *what I did with it*; retrieval is the system replaying what my acts imply.

---

## 6. Links — RULED: none in v1; the word is deleted from the product

**The ruling (owner + Claude, 2026-07-20):** there are no links anywhere in v1 — not on the canvas, not in any future document mode, not in the vocabulary. The empty table stays in the schema, dormant and nameless.

**The ontology this leaves (ruled, and it's the clean one):** v1 stores **no record whose two endpoints are both bits.** The stored relationships are only bit→tag, thing→board, board→tag. Two bits are "related" only ever as a **computed coincidence** — each independently tied to the same middle thing:

```
bit A ──tagged──▶  #jupiter  ◀──tagged── bit B     two hops through a shared middle — v1
bit A ───────────── link ──────────────▶ bit B     one hop, no middle — waived
```

All bit-to-bit relatedness is an *introduction* — brought to the same place, or given the same word. No private handshakes.

**Why nothing is lost — the Obsidian audit (8 of 9 jobs already accommodated):** travel, create-by-mention, backlinks, accretion, in-context connection, embedding, graph edges — all served by tags, pulls, placements, and boards (embedding-by-placement is *stronger* than Obsidian's). The one unaccommodated job is the direct pair-tie with no shared word and no shared room.

**Re-entry condition:** the first time real use produces the miss — standing on a bit, another belongs with it, yet no shared tag feels true and no board feels warranted (symptoms: a board-of-two, or a tag only two things would ever carry). That moment is the evidence *and* the build order: the feature arrives that week, small (a record of two IDs + when; one quiet "related" list; **symmetric — no direction, no labels** if ever built). Nothing done meanwhile is wasted.

**§6 AMENDMENT — gather (2026-07-25, owner · D-101).** §6 above waived the pair-tie; **gather revises the first half and keeps the second:**
1. **A stored bit→bit fact now exists — but a *directed, grown* one.** Gather adds a `reference`: a **directed** tie from a text bit's writing to any bit, **grown from the body on save** (never hand-authored). It is a *materialized index* of ties the writing already expresses — the body stays the single source of truth — so "gathered into" and the future graph are fast reads. This is a different animal from the pair-tie §6 waived, which was **symmetric and hand-drawn** ("these two relate," no direction, no writing).
2. **The dormant table stays parked — for the *symmetric* A2 case only.** `reference` does **not** cover A2. The dormant table was built for the direction-less, writing-less pair-tie (two bits that relate with no sentence to hang the tie on, e.g. two doodles). That case still has no home, so the dormant table keeps sleeping under its A2 re-entry condition, unchanged.
3. **Relatedness is now three ways, not two.** Two bits relate through a **shared middle** (a tag or a board — §6's "introduction"), *and now* through a **thread you tie on purpose** inside a sentence (a reference). The **connector** (§6a) stays a distinct third thing — pure board arrangement, still storing no bit↔bit fact.

**Standing, stated honestly:** this is **owner-authority-ahead-of-evidence** — the *same kind of ruling as D-087* (the optional text-bit title, ruled in by want, not by an evidence gate firing). §6's own re-entry condition ("the first real miss") has **not** fired; gather is want-driven ("I do want this for sure"). It is recorded as the owner's ruling, **not** dressed up as the evidence gate — the legitimate path (latest ruling wins). *(The philosophy's outgrown "a direct thread… I haven't missed it yet" line is left for the owner to rewrite in their own voice — gather package §6.)*

## 6a. Connectors — canvas arrows, RULED IN (owner, 2026-07-20 — over Claude's evidence-gate flag, knowingly)

**What it is:** a visible arrow/line between two cards **on the same board** — part of the *arrangement*, like position and size. The Obsidian-Canvas kind of arrow, **not** the deleted meaning-link.

**Stored as its own record kind (an *act* — §7):** `connector { board · from-placement · to-placement · when }` (~100 bytes). **Endpoints anchor to placements, not bits** — the choice that keeps the model clean:
- per-board by construction (same two bits elsewhere = no connector there);
- **un-place** a card (deliberately take it off the board) → its connectors die automatically (no orphans), **with a proportional confirm when the card carries any (principle 12)**; **trashing** the bit only *hides* its connectors (restorable — §2g), never kills them;
- **no bit↔bit fact is ever stored** — §6's ontology stands untouched: the two bits remain related only through the shared board. Connectors never feed pulls, bit pages, or the graph (co-placement already covers the graph).

**Behavior:** anchored to the two cards; auto-routed; **reroutes live** as either card moves/resizes (the binding model — anchor + reroute — from `research-knowledge-layer.md`, now applied here); optional arrowhead (display value); tap to delete; created by dragging from a card's edge onto another card; touch-tested on the Daylight. No text labels on connectors in v1 — ink annotates. **A connector may anchor to any card, including a board-card** (an arrow → a whole board) — still pure arrangement on this board, never a stored relationship, so no nesting and nothing fed (ruled 2026-07-20: allowing it is free; forbidding it would cost a special-case).

**Sequencing:** purely additive (new table only) → NOT in the port's critical path; lands with the canvas-enrichment batch after port + tags.

## 6b. Document mode — explored in full, deferred; v1 is CANVAS-FIRST

**The concept (kept for its day):** a board rendered as a vertical flow instead of a spatial field — same board, same bits, same placements; position means *order in the sequence* instead of x/y (the Roam/Notion block architecture — stored order per block; standard, not invented; a text file gets order free only because its pieces aren't independent objects). You type (blocks become bits at enter), draw inline, and **call in** any bit of any medium — rendered **full** (the thing itself as a block) or **small** (its first words / content line, tap to jump — *a placement rendered small*, not a new record kind). Text wrapping around images stays the old parked dream; called-in things are their own rows in the flow.

**Why deferred (owner ruling, 2026-07-20 — "build the canvas first"):** the end-to-end build trace found document mode's real costs, and deferring removes every one of them from v1:
1. **Split/merge become core operations** — backspace at a block boundary merges two *identities* (what happens to the deleted block's tags and its placements on other boards?); selection-split becomes an everyday gesture. Unruled edit-semantics; the canvas needs none of it — every box is independent.
2. **Two truths of position** — order vs x/y on one board can drift into contradiction; would force a mode-permanence ruling.
3. **Order storage + a `mode` field on boards** — small, but only document mode needs them.

**Re-entry:** when the text-forward want shows up in real use. The operations checklist above (split/merge semantics, bit-birth-at-enter, mode permanence) is its entry gate — designed *before* it's built.

---

## 7. Retrieval — the payoff ledger (all computed, never stored)

| the fact I gave it | the way back it buys |
|---|---|
| its words (the **face**, §2b) | search |
| its tags | every pull |
| its placements | every board it's on — and its **travel** (history, on its page — §5) |
| its dates | **the ledger** (find's empty query — every live bit, newest first; **v1**) · random-old resurfacing (*the feed — Phase 6, deferred by choice*) |

A bit given nothing still has: search (if its face has words), its spot on whatever board it was born on, and **the ledger** — reachable by date alone, no precondition (invariant **I-T1: nothing stored is unreachable** — live things in world surfaces, frozen things in the trash listing, history via the travel views). Each optional act buys exactly one more way back. Find filters by tag (include/exclude), by **type/subtype** (all my drawings, free — no tag needed), and full text; results come as topics, boards, and bits; the URL is the query. **Find with an empty query is the ledger (ruled 2026-07-20): the complete list of every live bit, newest first** — the zero-design reachability floor (the empty query is simply *everything*). *(The earlier deferral of a "not on any board" filter — the loose-bits drawer — is now **superseded**: capture rules in **the inbox**, below.)*

**Loose & the inbox — ruled (2026-07-25, capture Slice 1 · D-100).** A bit is **loose** when it is live **and** no board actually shows it — no un-departed placement on a non-trashed board (the exact rule boards already use; no flag, no column, always computed). **The inbox is the loose surface:** every loose bit, newest-first — a computed surface, not stored state; a loose bit's guaranteed way-back, the way the ledger is for everything live. A bit made on no board is loose immediately (this finally honors "the bit needs no board"); place it and it leaves; un-place its last board — **or trash its only board** (the crack the review caught) — and it returns, nothing to rebuild. **Call-in reuses the membership row:** returning a loose bit to a board it once left **clears the departure** on the existing placement row (never a second row — I-L1), landing where you drop it (center by default). → invariants **I-N1–I-N4**. *(Proven: `verification/capture-proofs.sql` §3; the surface is the `the_inbox` view.)*

### The complete storage map — every byte, five layers

| layer | what lives there |
|---|---|
| **A. Truth — database** | the **eight record kinds, three families** (ruled 2026-07-20): **things** — bit · board · **acts** — tag application · placement · **connector** (§6a) · **vocabulary** — tag word · **category** (§3b) · **subtype word** (§5c) — **plus one *derived index*, `reference`** (§6 amendment — gather's directed bit→bit ties; stored here in layer A but **layer-E-natured**, rebuildable from bodies, and in the export for completeness — the first record of its nature) — plus their small values: subtype, **`visibility` (on both bit and board — §2a)**, display size, **placement arrival/departure times (travel history, §2c)**, **a bookmark's captured title (§2b)**, **a clip's frozen `source_url`/`source_title` (§2a)**… |
| **B. Truth — file store** | the actual bytes of every image *(later: pdf, audio)*. A media bit is stored in two halves: its row (the facts + the address) and its file (the thing). The heaviest storage in the system |
| **C. Dormant** | one empty, unnamed table (§6) — present, unused, waiting |
| **D. The account** | one owner login record — the key the security boundary checks on every request |
| **E. Regenerable artifacts** | thumbnails · search index — stored for speed, rebuildable from truth anytime; cache wearing a permanent look. *(A pdf/audio **metadata title** is regenerable from the stored file. A **bookmark's title is not** — the live page isn't stored — so it is **captured once as truth**, layer A, §2b. Your `content` is always truth and never machine-written.)* |

Nothing else is ever written. And no board — canvas or otherwise — is stored *as a whole* anywhere: boards are one row each, assembled from placements at load time (two indexed queries, tens of milliseconds; the only slow thing in the product is image bytes on the network, mitigated by downscaling + thumbnails).

---

## 8. Open — listed honestly

**The conceptual model is closed (2026-07-20).** All model decisions ruled: the bit, tags, the pull, boards, connectors, links-out, document-mode-deferred, the home surface, small-card, subtype home. What remains is *verification* and *translation*, not model design:

1. **The independent-window audit** — ✅ DONE and **fully merged** (run cold, guarded; 14 findings, verdict *yes-with-fixes*; five clusters ruled → D-072–D-076). The finding-by-finding record: `old/audit-agreements.md` §5 (retired to `old/` at translation, job done). The reasoning: `deliberations.md`. The enforceable rules: `invariants.md`.
2. **The life walkthrough — ✅ DONE (2026-07-21, D-079) → `model-scenarios.md`.** Seven scenes from the owner's real week traced to the record level: 0 MISSING · 2 AWKWARD, both owner-blessed. Watch-list (A2 · A1 · A10): no trips. New invariant I-W1; A10 + A14 evidence logged in `parked.md`.
3. **Translation** — SPEC rebuilt from THIS document; the schema derived fresh (one clean migration, empty-DB replace); ROADMAP Phase 2 reworded off the links/graph rulings; connector table + export scheduled. *(audit F6)* **The migration honors `parked.md`'s five foreclosure notes** (extensible `visibility` + `type` · client-suppliable born-at · the dormant table ships · the visit-log-foreclosing UNIQUE is commented as such). **The ROADMAP rebuild reconciles with `parked.md`:** phase-scheduled items (B/C) match their phases — one list, no drift; event-gated items (A) stay off the sequence (a roadmap must never imply an evidence-gated thing is simply "coming"). **The full procedure + rules: `translation-guidelines-conceptual-to-technical.md` (D-081).**
4. **Then the port** — build on vetted ground.

*Deferred, re-blessed by the owner (not open questions — parked with named re-entry):* document mode (§6b) · the pairwise link (§6) · PWA install (Phase 5, audit F8) · resurfacing feed + doodled-home surface (Phase 6 / build-it-yourself). **The complete ledger of every parked/open item — including the inline ones ruled across §2–§7 — is `parked.md`.**

---

*Decisions behind this doc: D-059–D-065 (+ this doc as the consolidated record). Process: `draft-vetting-technical-layer.md`. This doc supersedes `draft-techlayer.md`.*
