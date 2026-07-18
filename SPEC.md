# SPEC

The detailed **what**. Companion docs: `draft-philosophy.md` (why), `draft-highlevel.md` (model/glossary), `draft-claudemd.md` (how we work), `PROGRESS.md` (where we are). Living draft — supersedes `initial-spec.md` (kept as history). Where this and PHILOSOPHY disagree about *intent*, PHILOSOPHY wins and you flag it.

---

## 0. Definitions

*Naming note: this uses the code's current terms `bit` / `canvas`; the owner's words are **fragment** (= bit) and **board** (= canvas). Rename pending.*

| Term | Meaning |
|---|---|
| **bit** (fragment) | The **atom**: one small unit — `text`, `image`, `doodle`, `audio`, `link`, or `pdf`; something consumed *or* thought. Independent, taggable, dated, retrievable. **Lives on its own in the grid; needs no canvas.** |
| **canvas** (board) | A place to gather and think. **Two modes, same canvas:** *collection* (grouped bits, no spatial layout — quick, any device) → *canvas mode* (those bits given positions, arranged spatially — the sit-down act). Has a `stage`. |
| **placement** | A bit on a canvas. Its position (x/y/w/h/z) is **optional** — absent = collection mode, present = canvas mode. Live reference, never a copy. A bit may have **zero, one, or many** placements. |
| **topical tag** | What a bit is *about*. Open, growable vocabulary; a **linkable topic-node** — each topic has a page collecting everything about it (backlinks), tapped from a picker (never typed as syntax). Many per bit. |
| **kind** *(categorization)* | A bit's *nature*: `learned` · `noticed` · `wondered` · `theorized`. Fixed set, one per bit, **optional**, set while tending. |
| **stage** *(categorization)* | A canvas's *maturity*, ordered (~3–4). Drives "which boards want tending." |
| **pull** | Filter by a tag → a *designed* grid of bit previews (order may be random). |
| **backlink** | The reverse of a placement / topical tag / link — "what contains / is about / points at this." |
| **graph** | Mostly the **topical web** (bits connected through shared topics). Scoped views later; backlinks are the near-term value. |

**Single user** (one writer; a read-only key may be shared later; product not designed out). **Build order is capture-first — see §12 and `PROGRESS.md`.** `kind`/`stage` are not yet in the applied migration (written during the superseded "no attributes" phase); a new migration adds them.

---

## 1. Stack (fixed unless owner changes)

- Next.js App Router + TypeScript strict
- Supabase: Postgres + Storage + Auth — **local via Docker in dev**
- Tailwind (layout utilities only)
- Pre-approved libs: `dnd-kit`, `react-rnd`, `tiptap`, `pdf.js`, `zod`. Anything else needs approval.

---

## 2. Data model

Exact intent, not final SQL. All ids are uuid; all tables have `created_at` and `updated_at` (auto, see §2.3).

- **canvases** — `id`, `title` (nullable — canvases can be untitled), `visibility` (`private`|`shared`|`public`, default `private`), `is_home` (bool, at most one true), `width` (int, coordinate-space width), `created_at`, `updated_at`.
- **bits** — `id`, `type` (`text`|`image`|`doodle`|`audio`|`link`|`pdf`), `text` (body for text bits; caption otherwise), `storage_path` (image/doodle/audio/pdf object key — **path, not a signed URL**, see §9), `link_url` (link bits), plus media metadata (`image_w`, `image_h`, `thumb_path`, `file_name`, `mime`, `byte_size`), `visibility` (default `private`), `created_at`, `updated_at`.
- **placements** — `id`, `canvas_id` → canvases, `bit_id` → bits, `x`, `y`, `w`, `h`, `z`, `rotation`, `created_at`, `updated_at`.
- **tags** — `id`, `name` (unique), `created_at`.
- **bit_tags** — (`bit_id`, `tag_id`), pk both.
- **canvas_tags** — (`canvas_id`, `tag_id`), pk both.
- **links** — `id`, `from_bit_id`, `to_bit_id`, `created_at`. (Canvas↔canvas links: later; extend then.)
- **search** — `bits` carries a generated `tsvector` over text; GIN index. (§7)

Indexes: `placements(canvas_id)`, `placements(bit_id)`, `bit_tags(tag_id)`, `bits(created_at desc)`, `links(to_bit_id)`, bits FTS GIN.

### 2.1 Invariants

- **I1 — Tags by id only.** Never store a tag name on a bit or canvas. No denormalisation, ever.
- **I2 — Placements render live bits.** Never copy a bit's content into a placement. Editing the bit updates every placement.
- **I3 — Deleting a placement never deletes its bit.** Deleting a bit sets nothing to a copy; its placements are removed and any links to it are cleaned up. A bit can be deleted only deliberately.
- **I4 — Dates are auto (§2.3).** Application code never sets `updated_at`.
- **I5 — Every table is in the export (§10).** Add a table → update the export.
- **I6 — RLS is the security boundary (§3), never the query layer.**

### 2.2 Seed data

Seed a small starter tag set (idempotent, `on conflict (name) do nothing`) — owner's real vocabulary lands over time. No tag "kinds"; tags are flat (hierarchy is an open question, not v1).

### 2.3 Timestamps

`created_at default now()`. `updated_at` maintained by a trigger on update for every table — not by app code. For canvases, moving/adding/removing a placement counts as editing the canvas (touch `updated_at`).

---

## 3. Security — RLS required

The anon key ships to the browser; query filtering is not security. RLS on **every** table.

- Owner is an authenticated Supabase user → policies `for all to authenticated using (true) with check (true)` on every table.
- Anonymous (`anon`) may `select` only rows reachable as public: `canvases` where `visibility='public'`; `bits` that have a placement on a public canvas (or `visibility='public'`); `placements` whose canvas is public; `bit_tags`/`canvas_tags` for public rows; `tags` readable (flat labels, non-sensitive).
- `shared` tier (password key) enforced later; until then only `private`/`public` exist and everything is `private` by default.
- **Storage:** two buckets — `public`, `private`. Private objects served via signed URLs through `lib/storage` only. Never a private object in the public bucket. Storage RLS mirrors the above.
- Service-role key: server-only, never `NEXT_PUBLIC_`, never in the client bundle.
- **Verify:** logged out, hitting the REST endpoint with the anon key returns no private rows.

---

## 4. Surfaces / routes

| Route | Auth | Purpose |
|---|---|---|
| `/` | public-filtered | Home: a few random old fragments + recent captures (the return loop) |
| `/capture` | owner | Instant capture: text + photo, optional quick tags. Precached, offline-capable |
| `/api/capture` | capture-token | Endpoint for the iOS Shortcut (see §4b) |
| `/c/[id]` | public-filtered | A canvas: collection view; canvas view; edit if owner (touch or mouse) |
| `/pull` | public-filtered | Tag pull → grid of bit previews (`/pull?in=astrology,jupiter&out=theory&q=…`) |
| `/b/[id]` | public-filtered | A bit: full view + edit; its backlinks (canvases it's on, tags it shares) |
| `/tags` | owner | Tag manager (create/rename/merge/delete; renames need no data migration, I1) |
| `/graph` | public-filtered | The connection graph (later, scoped) |
| `/login` | public | Single-user sign-in |
| `/export` | owner | Download everything |

**public-filtered** = logged out sees only public rows; logged in sees all. Same component, different rows via RLS.

## 4b. Capture (phase 2 — the critical path)

- **Transport rule: media uploads go client → Supabase Storage directly** (authenticated + storage RLS), **never through a Vercel function** — serverless bodies cap at 4.5 MB (server actions default 1 MB); iPhone photos are 3–8 MB. This rule applies app-wide.
- **iOS path is a Shortcut → `/api/capture`** (Web Share Target does not exist on iOS Safari). The Shortcut carries **no session cookie**, so it authenticates with a **bearer capture-token** (`CAPTURE_TOKEN` env; server route validates it, then uses the service-role client — a deliberate, narrow RLS bypass). Media: the Shortcut resizes before POST, or exchanges the token for a **signed upload URL**. Decide in the spike; convert HEIC explicitly in the Shortcut.
- **Offline outbox — honest guarantee:** iOS has **no Background Sync**; queued captures (IndexedDB; photos as blobs) flush **when the app is next opened**, not in the background. Spec'd as such; never imply more.
- **Sync state is visible:** "N waiting to sync" — no did-it-save anxiety.
- **Latency budget: tap icon → keyboard up in ≤ ~1.5s.** The capture shell is a **precached client route** that renders without the server auth round-trip (the proxy guard's `getUser()` must not gate it when offline).
- **Service worker:** requires `serwist` (or hand-rolled SW) — **new dependency, needs owner approval at phase 2 start.**
- **First act of phase 2 is a one-day end-to-end spike** on the real iPhone: token flow, the 4.5 MB reality, tap→saved latency, paused-project behavior. Its findings shape the rest of the phase.

---

## 5. Canvas + bits

- **Two modes.** A canvas is first a **collection** (grouped bits, no positions — quick, works on any device). It becomes a **spatial canvas** when you place bits: a fixed-width coordinate space (`width`, default ~1200), landscape; below `width`, scale with `transform: scale()` — do not reflow.
- **Capture never forces a board.** Capturing a bit creates a **bare bit — no placement**. A placement is created only when you drop a bit onto a board; a bit can live on zero boards.
- **Compose targets: the Daylight (touch, landscape) and desktop** — *not* mouse-only. Phone = capture + browse, not compose. **Touch** drag/resize is a v1 requirement. **On phones, a board renders in collection mode** (a 1200-wide canvas at 390pt is a squint, not a view).
- **Placement — one owner per gesture:** **`react-rnd` owns on-canvas drag *and* resize** (it does both; wiring dnd-kit to the same box double-handles pointer events). **`dnd-kit` owns pulling a fragment from the grid/tray onto a board.** Under `transform: scale()`, react-rnd's `scale` prop **must** be wired to the canvas scale or pixel deltas drift. Bring-to-front on select (persist `z`); autosave on release (debounce ~400ms). **No rotation in v1.**
- **Undo/redo**, canvas-scoped, in-memory, last ~50 placement mutations (move/resize/add/delete); Cmd/Ctrl+Z / +Shift+Z; cleared on navigation.
- **Bit types in v1:** `text` (Tiptap rich text, stored as HTML) and `image`. Others per the queue.
- **Add-bit menu:** text, image (upload), and (later) doodle/audio/pdf/link, plus "insert existing bit" (search → place → new placement, live).
- **Delete a placement:** select → Delete → removed, undoable, no confirm (I3). **Delete a bit:** from `/b/[id]` → **soft-delete to trash** (recoverable), naming how many boards it's on. Hard-delete only from trash (data safety, §10).

---

## 6. Tagging

- Tags are **tapped from the existing list only** — no free-text/syntax tag entry anywhere. Pickers order by recent use, then alphabetical.
- Per-**bit** tags in v1; canvases taggable too. Adding/removing is one function, called from every path.
- Tag manager (`/tags`): list with counts; rename (I1 makes it free); merge A→B (repoint `bit_tags`/`canvas_tags`, delete A, one transaction); delete (confirm with count; things survive).

---

## 7. Pull (search + filter)

- Filter by tags: a bit matches if it has **every** included tag and **none** excluded. State in the querystring (`in=`, `out=`, `q=`); the URL is the state; bookmarkable.
- Full-text: Postgres FTS over bit text (`websearch_to_tsquery`), rank by `ts_rank` then `created_at desc`.
- Result = **grid of bit preview units**: image → thumb; text → snippet; audio → player; link → card; pdf → first-page thumb. Auto-arranged (not a canvas). Empty result → a short sentence, never a spinner or blank.
- Paginate (e.g. 60/pull, cursor on `(created_at, id)`); filters in the query, never client-side after fetch. Respects RLS automatically.

---

## 8. Links, backlinks, graph (queue item 5)

- A bit can link to another bit; the target shows its backlinks ("referenced by…"). Placements and shared tags are *implicit* backlinks surfaced on `/b/[id]` (canvases it's on; bits sharing its tags).
- `/graph`: nodes = bits/canvases, edges = links + placements + shared tags; filterable by tag; for wandering, not querying.

---

## 9. Media pipeline

- **Images/doodles:** client-side before upload — reject > 25MB; read intrinsic `image_w/h`; downscale long edge ≤ 2400px → `storage_path`; 600px thumb → `thumb_path`; strip EXIF (canvas re-encode does this) and **honor EXIF orientation on decode**. **Encode: JPEG on iOS** (Safari cannot `toBlob('image/webp')` — this is known, not a runtime check); WebP where supported (Chrome/Android). HEIC via `<input type=file>` is auto-transcoded by iOS; HEIC via the Shortcut needs an explicit convert step (§4b). **Note: photo capture pulls this whole pipeline into phase 2**, including creating the storage buckets.
- **Doodles (v1):** imported PNG, same pipeline. In-app finger-draw is later.
- **PDF:** store as-is (`file_name`), reject > 50MB; render first page rasterised **once at insert** → stored image used as the bit's preview (pdf.js). Click → open full PDF new tab.
- **Audio (v1):** attach file, store as-is, preview = a small player. In-app recording later.
- **Columns hold storage paths, not URLs** — signed URLs are generated at read time by `lib/storage` (they expire; never persist them). All storage access goes through `lib/storage` so the backend can move to R2 later. Never call the Supabase storage SDK from a component.

---

## 10. Operations

- **Env** (`.env.example`): `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY` (server-only), local-Supabase values for dev.
- **Migrations:** `supabase/migrations/`, numbered, never edited after applying — new change = new file.
- **Export & data safety** (from day one of real data): `/export` = a zip of one JSON per table (full rows) + every storage object. **The automated backup is a GitHub Actions nightly cron**: `pg_dump` + storage sync to a private repo artifact (or R2) — a Vercel Hobby cron would outgrow serverless duration/memory as media accumulates. **This cron doubles as the keep-alive ping: free-tier Supabase pauses after ~a week idle**, which would otherwise kill capture exactly when you return from a trip. **Soft-delete (trash)** for bits (`deleted_at`) — deletes are recoverable; hard-delete only from trash. Note the serverless size ceiling on `/export`; stream if large.
- **Empty & loading states everywhere:** zero canvases, zero bits, empty pull, a bit that fails to load — each a short sentence, never a spinner-forever or blank screen. Skeletons on grids, progress on upload.

---

## 11. Design constraints

- Quiet, white/warm, fast. No brand/aesthetic decisions made for the owner — **except the browse/feed surface, whose presentation (image-forward, density, rhythm) must be deliberately designed, or "returning" fails.** Elsewhere, expression comes from the owner's own content. *Considered*-quiet, never careless-ugly. Layout inspiration: indie-web "vibes" pages.
- One typeface set once. No gradients/shadows/accent colours/hero sections/emoji in UI unless the owner brings them. Violating this is a bug.

---

## 12. Build sequence (CAPTURE-FIRST; mirrors `PROGRESS.md`)

1. Foundation + **cloud Supabase + deploy** (so a phone can reach it) — critical path
2. **Capture loop** — **first act: the one-day iOS end-to-end spike (§4b)**; then bare-fragment capture (text + photo), Shortcut → endpoint, offline outbox, visible sync state. **Pen-feel spike on the Daylight runs alongside** (one throwaway day — its outcome reshapes post-phase-6 plans).
3. **Browse + resurface** — designed fragment grid (the **text preview card is the primary designed object** — the corpus is mostly text at first) + random-old-fragments on home
4. **Fragment detail + edit + soft-delete + backlinks + automated backup (GH Actions cron)**
5. **Tagging** — tap-existing + create-new; topic-pages; `kind` optional; tag-filter on grid; **an "untagged recent" strip on home** (else the topical web never gets fed)
6. **Boards** — collection mode → canvas (model B, touch/landscape, no rotation); `stage` column added in this phase's migration
7. **Stage + boards-by-stage / tending view**
8. **Privacy tiers**
9. Later/maybe: scoped graph, in-app pen (if the spike passed), audio/pdf, wrap-box

---

## 13. Open questions

- Exact iOS capture path to try first (Shortcut vs email-in vs paste).
- Naming: adopt fragment/board (rename from bit/canvas)?
- Stage: how many steps, named/numbered? Kind: fixed at the four?
- New migration for `kind`/`stage` (not in the applied `init`).
