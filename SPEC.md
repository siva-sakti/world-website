# SPEC — the technical manual

**What this is:** the **technical *what*** — how the proven schema is built and how the app is wired to it, so a builder can implement any feature without reopening the agreements. **Rebuilt from the closed model at the translation step (Stage 1f, D-085);** it *describes* what is upstream and never re-derives it (guidelines rule 8). The derivation chain is one-way: `agreements.md` (the ruled model) → `supabase/migrations/20260721000001_init.sql` (the proven schema) → this SPEC → `ROADMAP.md`. Where this and the agreements ever disagree, **the agreements win** — raise it, don't paper over it. Words are the `lexicon.md` words. The old SPEC is retired to `old/` (its model prose was superseded; its technical sections are carried forward here, proven-schema-accurate).

---

## 1. The five moving pieces

1. **The screen** (Next.js App Router, TS strict) — renders bits and boards; never talks to the database directly.
2. **The one door** (`lib/db`) — every read and write goes through this single module. It is where the rules marked *app* in `invariants.md` live (the content write-guard I-R1, the un-place transaction, the keep-by-default prompt I-D1, the confirm-builders I-T2). One `lib/storage` module is the twin door for files. **Never call Supabase from a component.**
3. **The database** (Supabase Postgres 17) — holds the nine record kinds + the dormant tenth + one derived index (`reference`, §6), and does as much of the work as physics can (constraints, generated columns, views). Proven: `verification/`.
4. **The file store** (Supabase Storage) — the actual image bytes (later: pdf, audio). A media bit is two halves: its row (facts + address) and its file.
5. **RLS** (§3) — the security boundary, enforced by the database on every request, not by the query layer.

Pipe: **screen → `lib/db` → Postgres** (+ `lib/storage` → file store), every row filtered by **RLS**. A board is never stored as a whole — it is one row assembled from its placements at load time (two indexed queries; the only slow thing in the product is image bytes on the network, mitigated by downscaling + thumbnails).

## 2. The schema, described

The authority is the migration; this is the map. **Nine record kinds in three families + the dormant tenth + one derived index (`reference`)** (agreements §7; lexicon):

- **things** — **`bit`** (the atom: `type` ∈ text·drawing·image; owner-only `content`; a text bit's `body`; a drawing's `strokes`; an optional `source_id` FK → the `source` table (provenance — one source per bit; blank = self-made; §2a/D-102); media facts + `storage_path`/`thumb_path`; `subtype_word_id`; `visibility` **public**-default; `deleted_at` freeze; the generated **`face`** + `search_tsv`). **`board`** (`title` nullable; `visibility` **private**-default; `deleted_at`; generated `search_tsv`).
- **acts** (each a timestamped row) — **`tag_application`** (a word on a bit *or* a board, exactly one, at a time) · **`placement`** (a bit *or* a board on a board; `x`/`y`/`width`/`height`/`z`/`display_size`; `arrived_at` = first arrival & birth; `left_at` empty = here now) · **`connector`** (an arrow between two placements on one board; `arrowhead`).
- **vocabulary** (id-referenced, renames free) — **`tag`** (`word`, optional `category_id`) · **`category`** · **`subtype_word`** · **`source`** (`name` + optional `url`, `source_name_ci` CI-unique; §2a/D-102).
- **dormant** — the nameless tenth (§6): two bit refs + when; ships empty, never dropped, never written in v1.

**What the database does itself** (so app code can't get it wrong): the **`face`** is a *generated column* — the display headline, `content ∥ per-type fallback`, one rule in `bit_face()`, no sync code (§4.4/D-074). **Search is a separate, wider generated column** (`bit_search_text`, D-088): it indexes *all* a bit's words — content + body + captured-title + URL — never just the face, so titling a note never hides its body from find. **Ten views** are the computed surfaces, each a saved question (`the_pull` · `the_ledger` · `home` · `trash_listing` · `bit_travel` · `board_cards` · `board_connectors` · `tag_counts` · `subtype_word_counts` · `the_inbox`); **find** is these blocks + the owner's filters, composed in the app, and its empty query is `the_ledger`. **One trigger** stamps `updated_at`; everything else is visible constraints. The key refusals, all proven (`verification/attacks.out`): twice-tagging impossible (→ merge can't duplicate), a cross-board arrow unrepresentable, one membership row per (thing, board) reused on re-place, exactly-one-target on placements & applications, per-type substance coherence, case-insensitive vocabulary twins refused, every destroy cascade total-and-self-contained.

**Build note (the frozen `select *` — DONE, closed by D-102):** a view defined `select *` freezes its column list the day it is created — so when D-102 dropped the D-100 `source_*` columns (now the `source` table), it had to rebuild `the_inbox` / `the_ledger` / `board_cards`; the latter two now **join `source`** and expose `source_name`/`source_url` (a note's *"from …"* on boards and lists). Keep the caveat in mind for any future `select *` view.

### 2.1 Since the base schema — the notes / synthesis layer (D-118 → D-121)

Added **additively** to the proven base (migrations `…_shelf.sql`, `…_shelf_bits.sql`, `…_kind_and_folder_stars.sql`); no record kind was added — these are columns + one small table:

- **`bit.kind`** (`text`, `CHECK in ('bit','note')`, default `'bit'`) — the field that splits a bit's **role**: **`'bit'` = material** (a fragment you caught/made); **`'note'` = a written piece** — a *verbal-synthesis surface* (model.md §premise). **A note is stored as a `bit` row** with `kind='note'`: its writing is `body`, its gathered bits are `reference` rows. That shared storage is deliberate and invisible — it inherits all bit-machinery (tags · find · trash · gather · export) for free (*three layers allowed to differ*: model = surface, storage = a bit row, presentation = a surface). **`reference`** is the note's membership record — *placement is to a board what a reference is to a note.*
- **`bit.group_id` / `board.group_id`** (FK → **`shelf_group`**, `ON DELETE SET NULL`) + **`pinned_at`** on `bit` / `board` / `shelf_group` — folders (the "shelf") and **alive** (the owner's ★), both cutting across boards and notes.

**HARD LINE — I-K1 / D-121: `kind` is set at birth and never updated** (catch/jot → `'bit'` · ✎ write → `'note'`). There is no conversion; the only writes to `kind` are the create-path inserts (no `setBitKind`). Enforced at the app chokepoint (kind is insert-only); could harden to a trigger/`CHECK` later.

**Serving (presentation ≠ storage).** A note is served as a **surface** at `/note/[id]` — its own writing page, listed beside boards, never the `/bit` page (N1). On a board it renders as a page-shaped **doorway card** that opens the note (N3); the `board_cards` view doesn't expose `kind`, so the board page reads it in one indexed query (`getBitMeta`), same pattern as raw `content`.

## 3. Security — RLS, the ruled composition (replaces the old §3, which leaked)

The browser holds the anon key; query filtering is not security. **RLS on every table.**

- **v1:** owner-only on all eleven tables, **scoped to the owner's uid** — `for all to authenticated using (auth.uid() = <owner>) with check (auth.uid() = <owner>)` (D-094; migration `20260723000001_owner_scoped_rls.sql`), **no anon policies at all** — nothing is visible to another human until sharing ships (agreements §2a). *Originally shipped as `using (true)`, resting on "only the owner has an account" — but a live deploy was found with Supabase signups OPEN (the wall was config, not the DB). Hardened to uid-scoping: a second authenticated identity (even a stranger who signs up) can neither read nor write. Proven by `scripts/test-rls-lock.mjs` (owner keeps full access; a fresh 2nd account reads zero rows and its writes are refused).* The privacy gradient re-scopes this when sharing ships.
- **The future guest layer (drafted now as comments beside each table, gradient-ready — §4.8):** a guest sees a bit **iff** its surface is reachable **AND** the bit itself is public — **reachability AND visibility, never an `OR`** (the old §3's `OR` is exactly the leak this closes: a private bit placed on a public board must **not** show). A private card renders **absent** (the guest never learns something was withheld). Sharing lands as pure addition — the composition, the per-board publish preview, and the guest-pull scope (parked A4) are decided when the sharing phase is real.
- **Storage** mirrors this: two buckets (`public`, `private`); private objects via signed URLs through `lib/storage` only; never a private object in the public bucket.
- **Service-role key:** server-only, never `NEXT_PUBLIC_`, never in the client bundle.

## 4. Media pipeline (carried forward, proven-schema-accurate)

- **Transport rule (app-wide):** media uploads go **client → Supabase Storage directly** (authenticated + storage RLS), **never through a Vercel function** — serverless bodies cap ~4.5 MB; iPhone photos are 3–8 MB.
- **Images/drawings:** client-side before upload — reject > 25 MB; read intrinsic `media_width`/`media_height`; downscale long edge ≤ 2400px → `storage_path`; 600px thumb → `thumb_path`; strip EXIF and **honor EXIF orientation on decode**. **Encode JPEG on iOS** (Safari cannot `toBlob('image/webp')` — known, not a runtime check); WebP where supported.
- **HEIC:** via `<input type=file>` iOS auto-transcodes; via the Shortcut needs an explicit convert step. **The HEIC/unreadable-image message ships in the port batch (parked C2)** — a *silent* failure violates the error-state norm; the message is one line.
- **Columns hold storage *paths*, not URLs** — signed URLs are generated at read time by `lib/storage` (they expire; never persist them). All storage access goes through `lib/storage` (so the backend can move later). *(pdf · audio are parked B7 — same two-halves storage when they land, no rework.)*

## 5. Operations

- **Env** (`.env.example`): `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY` (server-only).
- **Migrations:** `supabase/migrations/`, numbered, **never edited after applying** — new change = new file.
- **Export & data safety** (from day one of real data): **`/export` = one tap → every truth row + every file** — including travel history and all vocabulary (**I-G1**, proven in 1d). The **nightly backup is a GitHub Actions cron** (`pg_dump` + storage sync to a private artifact) — a Vercel Hobby cron would outgrow serverless limits as media accumulates. **This cron doubles as the keep-alive ping** (free-tier Supabase pauses after ~a week idle — which would kill capture exactly when you return from a trip). **Trash is a soft-delete freeze** (`deleted_at`); the one true destroy is emptying trash, which cascades totally (§2g).
- **Empty & error states everywhere** — every list can be empty, every upload can fail; each is a short sentence, never a spinner-forever or blank screen.

## 6. Capture (Phase 5 — the critical path when it lands; §4b carried, now constrained by §2h)

- **iOS path = a Shortcut → `/api/capture`** (Web Share Target absent on iOS Safari); the Shortcut carries no session cookie, so it authenticates with a **bearer capture-token** (`CAPTURE_TOKEN`; the route validates then uses the service-role client — a deliberate, narrow bypass). Media: resize before POST, or exchange the token for a signed upload URL; convert HEIC explicitly.
- **The offline outbox is births-only (§2h/I-D2):** it may carry only *creations* (new bits, their tag applications, newly-typed tag words — inserts with fresh IDs that cannot conflict), **never an edit**. iOS has no Background Sync; queued captures flush **when the app is next opened** (IndexedDB; photos as blobs). **Born-at = the act's moment, not the flush's** (I-D4 — the outbox carries the timestamp; else recency/resurfacing inherit day-late lies).
- **No automatic edit replay (I-D3):** an edit reaches the database only through a live save with the owner present; a failed compose save fails visibly and retries in memory, never durably queued. (A device-local crash-guard draft may restore into the editor only — parked A12.)
- **Sync state is visible** ("N waiting to sync"); latency budget tap → keyboard ≤ ~1.5s; the capture shell is a precached client route; `serwist` (SW) is a **new dep needing approval** at phase start; the phase opens with a one-day on-device spike.

## 7. The invariant → enforcement map (which rule lives where)

Full list + "kept by" tags in `invariants.md`; this is where each lands in the build:

- **Database constraint** (physics — the DB refuses the write): I-P1 (visibility columns+defaults) · I-L1 (`UNIQUE(board,target)`) · I-L4/I-L9 (connector FKs + composite same-board key) · I-L6/I-L10 (destroy cascades) · I-R4 (vocabulary FKs) · I-R7 (`UNIQUE(tag,target)`) · I-D6 (case-insensitive unique) · the substance & target-pair CHECKs. *All attacked in `verification/attacks.sql`.*
- **Generated / computed** (can't drift): I-R2 (the face) · I-G2/I-G3 (surfaces computed, one clock) · I-P2–P5 (the guest composition, as RLS) · I-L3/I-L5b/I-L8 (render rules, as views) · I-T1/I-T5 (the ledger & pull floors) · I-T4 (the three surface domains).
- **The one door** (`lib/db`, enforced in one place): I-R1 (content write-guard) · I-R3 (captured-once title) · I-D1 (the `FOR SHARE` tombstone check + keep-by-default prompt) · I-D2/I-D3/I-D4 (births-only, no edit replay, born-at) · I-T2 (confirm-builders count the frozen) · I-T3 (vocabulary ops reach frozen rows) · **the un-place transaction** (stamp `left_at` + delete every connector touching the placement — from *or* to — together; guarded by the orphan tripwire) · I-G1 (export completeness) · I-G4 (only acts apply meaning) · I-W1 (un-place vs trash are two labeled acts on every removal surface).
