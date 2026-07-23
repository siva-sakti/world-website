# Old-schema diff — every disappearance names its ruling (Stage 1e, D-085)

**What this is:** the countercheck required by translation-guidelines rule 6 / build-plan 1e. The new schema (`supabase/migrations/20260721000001_init.sql`) was derived **fresh** from the agreements; here it is diffed against the retired `old/20260715000001_init.sql` so that **every dropped or changed element names the ruling that killed it** — catching both contamination (something invented) and silent loss (something ruled that vanished). Verdict: **no unexplained disappearance.**

## Types (all three enums → `text` + named CHECK)

| old | new | ruling |
|---|---|---|
| `visibility` enum incl. `'shared'` | `text` CHECK `(public\|private)` on bit & board | enum→text for painless door-extension (strategy §4.2, deliberations 1a); `shared` dropped from the v1 set → **parked B6** (re-added by ADD). **Bit default flipped `private`→`public`** (agreements §2a — the atom leans public); board stays `private`. |
| `bit_type` enum `(text\|image\|doodle\|audio\|link\|pdf)` | `text` CHECK `(text\|drawing\|image\|bookmark)` | enum→text (door). `doodle`→`drawing` (lexicon: the *type* is `drawing`; "doodle" is now a **subtype word**, §2a/§5c). `link`→`bookmark` (**D-074** collision close). `audio`·`pdf` dropped → **parked B7**. |
| `bit_kind` enum `(learned\|noticed\|wondered\|theorized)` | *gone* | the `kind` field is **retired** (§3b, lexicon retired-words); the four thought-words survive as **ordinary seeded tags** (present in the new migration's seed). |

## Tables

| old | new | ruling |
|---|---|---|
| `boards` | `board` (singular) | lexicon naming authority (rule 7). |
| `boards.is_home` + `one_home_board` index | *gone* | **home is the boards-list surface** (§5a — "opening the app lands on your boards, most-recently-touched first"), not a flagged row; the doodled-home is **parked B4** (just another board). |
| `boards.width` (coord space) | *gone* | no ruled question needs it (§4.6 "a column must earn its existence", pre-logged in the 1a boundary log); canvas coordinate convention is an app constant; per-board sizing unparked only if wanted. |
| — | `board.deleted_at` | **boards are trashable** now (§2g Cluster 2 — trash-is-a-freeze extended to boards). |
| — | `board.search_tsv` | boards are searchable by title (§5). |
| `bits` | `bit` (singular) | lexicon. |
| `bits.text` ("body or caption", one overloaded column) | split → `body` + `content` + generated `face` | **D-074** — content is owner-only (no machine write path), the face is computed (content ∥ per-type fallback). The overloaded column is exactly what Cluster 3 dismantled. |
| `bits.link_url` | `url` | bookmark's URL (lexicon; D-074). |
| `bits.image_w/h` | `media_width/height` | generalized to media (mechanical rename). |
| `bits.kind` | *gone* | as above (§3b). |
| `bits.search_tsv` over raw `text` | `search_tsv` over **all the bit's words** (content + body + captured-title + URL) | D-074 established search-over-computed-text; **D-088 widened it beyond the face** (via `bit_search_text`) so a titled note stays findable by its body. |
| — | `subtype_word_id`·`content`·`captured_title`·`face`, substance CHECK, media-facts CHECK | subtype (§2a/§5c) · owner-content (§2b) · captured-once bookmark title (§2b/I-R3) · computed face (§2b/§4.4) · type-coherence (§2a). |
| `placements` | `placement` (singular) | lexicon. |
| `placements.bit_id` (bit only) | `target_bit_id` **+** `target_board_id` + exactly-one CHECK | the **target pair** (§4.1) — a placement holds a bit **or a board** (board-cards, §5); the old schema had no board-cards. |
| `placements.x/y/w/h int`, `w/h NOT NULL` | `x/y/width/height double precision`, nullable size | float positions (mechanical); optional size (§2c pile mode). |
| `placements.created_at` | `arrived_at` (doubles as birth) | one clock — first-arrival and row-birth can never differ (deliberations 1a, gate 4). |
| — | `left_at`·`display_size`·not-on-itself CHECK·`UNIQUE(board,target)`·the connector superkey | travel history (§2c, D-073/D-071) · small-card (§5b) · board-card sanity (§5) · one-row-per-pair (I-L1) · cross-board-arrow impossibility (I-L9). |
| `tags` | `tag`; `name`→`word`; `unique(name)`→CI-unique | lexicon; near-duplicate prevention case-insensitive (§3e). |
| — | `tag.category_id`·`tag.updated_at` | categories (§3b); renames are edits (P4). |
| `bit_tags` + `board_tags` (two timestampless PK-pair junctions) | `tag_application` (one timestamped act, target pair, `UNIQUE(tag,target)`) | tagging is an **act with a time** (§3a "at this time", §5 acts framing), not a bare join; the pair unifies both targets (§4.1); the unique gives **merge-dedupe by construction** (I-R7). |
| `links` (active feature: from/to, unique, self-check) | `dormant` (bit_a/bit_b/when, symmetric, no unique/check) | **§6** — links deleted from v1; the table ships **dormant and nameless**, minimal shape per §6's re-entry design, all further design deferred to **A2**. |

## Added whole (no old equivalent) — each by its ruling
- **`connector`** table — canvas arrows, a new record kind (§6a).
- **`category`** table (§3b) · **`subtype_word`** table (§5c) — the two new vocabulary kinds.
- **`bit_face()`** function (§2b/§4.4) · the **one** `set_updated_at` trigger kept identical (§4.7).
- **9 views** — surfaces as named views (§4.5); the old schema computed surfaces ad hoc in app code.

## RLS
Old: 7 tables owner-only + a comment deferring anon policies to SPEC §3. New: 9 tables owner-only + the future guest policies **drafted as comments** (reachability **AND** visibility — §2a/§4.8). **Note:** SPEC §3's `OR`-leak lived in *prose about the future anon policy*, never in the old migration (which was owner-only); the new migration's drafted guest policy encodes the ruled **AND**, so the leak is closed at the source it would have entered.

**Conclusion:** every disappearance is accounted for by a ruling; nothing silently lost, nothing invented. The old migration is retired in `old/` and never followed again.
