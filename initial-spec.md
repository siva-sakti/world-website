# SPEC — Implementation

Machine-readable build spec. Rules are numbered; cite them in commits and questions.
Companion: `CLAUDE.md` (working practices). This file defines *what*, not *why*.

---

## 0. Definitions

| Term | Meaning |
|---|---|
| **item** | One captured fragment. Text and/or one image and/or one file. The atomic unit. |
| **tag** | A row in `tags`. Has a `kind`. Items link to tags via `item_tags`. |
| **page** | A hand-composed canvas. Called "Pieces" in the UI. Notes, essays, lists — all the same type. |
| **block** | One positioned element on a page canvas. |
| **item_ref** | A block that renders a live item. Not a copy. |
| **wall** | The masonry grid of items at `/`. |
| **tile** | A hand-drawn PNG on the homepage that links somewhere. |

**Single user.** No signup, no roles, no sharing, no collaboration. One password.

---

## 1. Stack (fixed)

- Next.js App Router + TypeScript strict
- Supabase: Postgres + Storage + Auth
- Vercel + custom domain
- Tailwind (layout utilities only)

Any dependency not listed requires approval before install.

---

## 2. Schema

Exact. Do not add columns without asking. Do not rename.

```sql
create type tag_kind  as enum ('topic','verb','stage','output','system');
create type block_type as enum ('text','image','pdf','item_ref');

create table tags (
  id          uuid primary key default gen_random_uuid(),
  name        text not null unique,
  kind        tag_kind not null,
  created_at  timestamptz not null default now()
);

create table items (
  id          uuid primary key default gen_random_uuid(),
  body        text not null default '',
  image_url   text,
  thumb_url   text,                    -- generated, see C10
  image_w     int,                     -- intrinsic px, see W11
  image_h     int,
  file_url    text,
  file_name   text,                    -- original filename, for display
  source      text,                    -- free text. NOT a tag.
  is_public   boolean not null default false,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

create table item_tags (
  item_id  uuid not null references items(id) on delete cascade,
  tag_id   uuid not null references tags(id)  on delete cascade,
  primary key (item_id, tag_id)
);

create table pages (
  id            uuid primary key default gen_random_uuid(),
  title         text not null,
  slug          text not null unique,
  header_image  text,
  window_tag_id uuid references tags(id),   -- null = no auto-window
  is_public     boolean not null default false,
  created_at    timestamptz not null default now()
);

create table blocks (
  id         uuid primary key default gen_random_uuid(),
  page_id    uuid not null references pages(id) on delete cascade,
  type       block_type not null,
  content    text,                      -- text body, or storage url
  item_id    uuid references items(id) on delete set null,
  x          int not null default 0,
  y          int not null default 0,
  w          int not null default 300,
  h          int not null default 200,
  z          int not null default 0,
  rotation   real not null default 0,
  created_at timestamptz not null default now()
);

create table home_tiles (
  id          uuid primary key default gen_random_uuid(),
  image_url   text,
  label       text not null,            -- fallback before art exists
  target_href text not null,
  x           int not null default 0,
  y           int not null default 0,
  w           int not null default 200,
  rotation    real not null default 0
);

create index on item_tags (tag_id);
create index on items (created_at desc);
create index on blocks (page_id);
```

### 2.1 Seed data

```
kind=verb    : noticed, wondered, learned, theory, made
kind=stage   : seed, seedling, plant, fruit
kind=output  : essay, video, story, cartoon, product
kind=system  : untagged
kind=topic   : astrology, buddhism, tibetan, natural medicine, yoga,
               psychology, myth & archetype, ethics, philosophy, self,
               people, words, language, books, design, fonts, colors,
               film & photography, materials, dev economics, AI,
               AI safety, culture, history, apps
```

### 2.2 Row Level Security — required

The Supabase anon key ships to the browser. **Query-layer filtering is not security.** Without RLS, anyone can read every private item straight from the API.

Enable RLS on every table. Policies:

```sql
alter table items      enable row level security;
alter table pages      enable row level security;
alter table blocks     enable row level security;
alter table item_tags  enable row level security;
alter table tags       enable row level security;
alter table home_tiles enable row level security;

-- authenticated (me) can do anything
create policy owner_all on items
  for all to authenticated using (true) with check (true);
-- repeat the same policy for every table above

-- anonymous can only read public rows
create policy anon_read_public on items
  for select to anon using (is_public = true);

create policy anon_read_public on pages
  for select to anon using (is_public = true);

-- blocks are visible only if their page is public
create policy anon_read_public on blocks
  for select to anon using (
    exists (select 1 from pages p where p.id = blocks.page_id and p.is_public)
  );

-- item_tags visible only if the item is public
create policy anon_read_public on item_tags
  for select to anon using (
    exists (select 1 from items i where i.id = item_tags.item_id and i.is_public)
  );

-- tags and home_tiles are non-sensitive: anon may select all
create policy anon_read on tags       for select to anon using (true);
create policy anon_read on home_tiles for select to anon using (true);
```

Storage buckets: two — `public` and `private`. Files attached to `is_public = false` items go in `private` and are served via signed URLs. **If this is too fiddly for Phase 1, put everything in `private`, serve signed URLs always, and say so** — but never put private images in a public bucket.

**Verify by:** logging out, hitting the Supabase REST endpoint directly with the anon key, confirming private rows do not come back.

### 2.3 Invariants

- **I1** — Items reference tags by `tag_id` only. Never store a tag name on an item. No denormalisation, ever, for any reason.
- **I2** — `item_ref` blocks render the live item. Never copy item body/image into `blocks.content`.
- **I3** — Deleting a block never deletes its item. Deleting an item sets dependent blocks' `item_id` to null; those blocks render an "item deleted" placeholder and are removable.
- **I4** — `untagged` is applied/removed automatically only (rule C6). Never shown in the tag manager as editable.
- **I5** — Every table is included in the export (rule X1). Adding a table means updating the export.
- **I6** — RLS is enabled on every table (§2.2). Query-layer filtering is a convenience, never the security boundary.
- **I7** — Seeding is idempotent: `insert ... on conflict (name) do nothing`. Re-running a seed must never duplicate or reset tags.

---

## 3. Routes

| Route | Auth | Purpose |
|---|---|---|
| `/` | public-filtered | Fragment wall |
| `/search` | public-filtered | Full-text search |
| `/add` | required | Capture |
| `/i/[id]` | public-filtered | Single item view + edit |
| `/p/[slug]` | public-filtered | Page canvas |
| `/pages` | required | List/create pages |
| `/tags` | required | Tag manager |
| `/home` | public-filtered | Homepage tiles |
| `/login` | public | Password entry |
| `/export` | required | Download everything |

**public-filtered** = logged out sees only rows with `is_public = true`; logged in sees all. Same URL, same component, different query.

---

## 4. Capture — `/add`

- **C1** — Fields: body (textarea, autofocus), image upload, file upload, source (text input), topic tags (multi-select), verb tag (single-select), stage tag (single-select).
- **C2** — `stage` defaults to `seed`. No other tag has a default.
- **C3** — Tags are **tapped from the existing list only**. No free-text tag input exists anywhere in the app.
- **C4** — Tag pickers order by recent usage first, then alphabetical.
- **C5** — Save requires: body non-empty OR image_url non-null OR file_url non-null. Nothing else is required.
- **C6** — `untagged` is maintained by a single rule, applied on every write (create, edit, bulk edit): **an item has the `untagged` tag if and only if it has zero `kind=topic` tags.** Enforce in one function called from every path — not ad hoc at each call site. A Postgres trigger on `item_tags` is acceptable and preferred.
- **C7** — After save, clear the form and stay on `/add`. Do not redirect. Capture is often repeated.
- **C8** — Must be usable one-handed on a 390px viewport. This is the primary target, not desktop.
- **C9** — Uploads go to Supabase Storage. Store the URL on the item. Private items → private bucket, signed URLs (§2.2).
- **C10** — Image pipeline on upload:
  - reject > 25MB with a clear message
  - read intrinsic dimensions, store as `image_w` / `image_h`
  - downscale the original to max 2400px on the long edge, re-encode as WebP → `image_url`
  - generate a 600px-long-edge thumbnail → `thumb_url`
  - strip EXIF (it contains GPS — these are photos of my life)
  - do this client-side before upload (canvas/`createImageBitmap`) to keep it off the server and fast on mobile
- **C11** — Files (PDF): store as-is, keep `file_name`. Reject > 50MB.
- **C12** — Uploads show progress and survive a slow connection. Failure leaves the form filled, not wiped.

---

## 5. Wall — `/`

- **W1** — Masonry grid, responsive reflow, `created_at desc`.
- **W2** — Card renders: image (if any), body text, its tag names small. Click → `/i/[id]`.
- **W3** — Filter chips at top, grouped by `kind` (topic, verb, stage, output), showing only tags with ≥1 item.
- **W4** — Chip is tri-state, cycling on tap: `off → include → exclude → off`. Include and exclude must be visually distinct at a glance.
- **W5** — Query semantics: item matches if it has **every** included tag AND **none** of the excluded tags. Includes are AND, not OR.
- **W6** — Filter state serialises to the querystring, e.g. `/?in=astrology,jupiter&out=theory`. The URL is the state; reloading restores the view; the link is bookmarkable.
- **W7** — Empty result renders "nothing here" — not a spinner, not a blank page.
- **W8** — Select mode: checkboxes, then add-tag / remove-tag applied to all selected in one transaction.
- **W9** — Paginate: 60 items per load, infinite scroll or a "more" button. Never `select *` unbounded. Filters apply in the query, not client-side after fetch.
- **W10** — Deleting an item: from `/i/[id]` only, with a confirm dialog naming what breaks (see P14). Not from the wall — too easy to fat-finger.
- **W11** — Cards render `thumb_url`, never `image_url`. Reserve space using `image_w`/`image_h` aspect ratio so the masonry doesn't jump as images load.

## 5b. Search — `/search`

- **S1** — Postgres full-text search over `items.body` and `items.source`.
  ```sql
  alter table items add column search_tsv tsvector
    generated always as (
      to_tsvector('english', coalesce(body,'') || ' ' || coalesce(source,''))
    ) stored;
  create index on items using gin (search_tsv);
  ```
- **S2** — Query: `search_tsv @@ websearch_to_tsquery('english', $1)`. Rank by `ts_rank`, then `created_at desc`.
- **S3** — Results render as the same card component as the wall.
- **S4** — Search box is reachable from the wall header on every page. It is the primary way I find things; do not bury it.
- **S5** — Filter chips (W3–W6) apply on top of search results. Same querystring convention, plus `q=`.
- **S6** — Search respects RLS automatically. Do not write a separate public/private branch.

---

## 6. Pages — `/p/[slug]`

- **P1** — Canvas is **exactly 900px wide**. Height = furthest block bottom + 200px padding.
- **P2** — Blocks are absolutely positioned within the 900px coordinate space. Coordinates are stored raw; never recompute on resize.
- **P3** — On viewports < 900px, scale the whole canvas with `transform: scale(vw/900)` and `transform-origin: top left`. **It must not reflow.** Pinch-zoom stays enabled.
- **P4** — `header_image` renders at the top, full canvas width, above the coordinate space.
- **P5** — **Canvas editing is desktop-only** (viewport ≥ 1024px). Below that the canvas is read-only for everyone, including me — no drag handles, no add menu, just the scaled view and pinch-zoom. Composing is a sit-down activity; capture is the mobile activity. This removes the drag-under-scale-transform problem entirely. Do not attempt touch dragging.
- **P6** — Logged in on desktop: blocks are draggable, resizable, rotatable. Drag → x/y; resize → w/h; autosave on release (debounce 400ms).
- **P7** — **Use `dnd-kit` (drag) and `react-rnd` (resize) — pre-approved, do not hand-roll.** Hand-rolled drag/resize is where this phase dies.
- **P8** — **Undo/redo, canvas-scoped.** Keep the last 50 block mutations (move, resize, rotate, delete, add) in an in-memory stack. Cmd/Ctrl+Z and Cmd/Ctrl+Shift+Z. Cleared on navigation. Without this I will drag something into the void and lose it.
- **P9** — `text` blocks: **rich text — bold, italic, links, headings, lists, line breaks.** I write essays here. Store as HTML in `content`. Use Tiptap (pre-approved). Editable in place: click → caret → type → autosave on blur or 1s idle.
- **P10** — Add-block menu: text, image (upload), pdf (upload), item (search-and-insert).
- **P11** — Item insert: search using the §5b engine, results as a list, selecting one creates an `item_ref` block at the canvas centre, z on top.
- **P12** — `item_ref` renders the item's live `thumb_url`/body, read-only on the canvas, with a link to `/i/[id]` to edit.
- **P13** — **`pdf` blocks:** render the **first page only**, rasterised to an image, as the block's visible content (pdf.js, pre-approved). Click opens the full PDF in a new tab. Multi-page inline rendering is out of scope. My morning pages are PDFs and I want to *see* them on the canvas, not a file icon.
- **P14** — **Deleting a block:** select → Delete key or a menu item → removed immediately, undoable via P8. No confirm dialog; undo covers it. Deleting a block never touches its item (I3).
- **P15** — **Deleting an item** (from `/i/[id]`): confirm dialog stating how many pages reference it. On confirm, dependent blocks get `item_id = null` and render a removable "item deleted" placeholder (I3).
- **P16** — If `window_tag_id` is set, render an auto-window **below** the canvas: same query engine as the wall, filtered to that tag. Not part of the coordinate space.
- **P17** — Logged out: canvas is static. No drag handles, no add menu.
- **P18** — z-order: bring-to-front on selection; persist `z`.
- **P19** — Page creation at `/pages`: title + slug. **Slug is auto-generated** from the title (lowercase, non-alphanumerics → `-`, collapse repeats, trim), editable before save, uniqueness enforced with a `-2` suffix on collision. Changing a slug later does not redirect the old one — warn me.

---

## 7. Homepage — `/home`

- **H1** — Fixed 900px coordinate space, same scaling rule as P3.
- **H2** — Tiles render `image_url` as a transparent PNG at width `w`, or `label` as plain text if `image_url` is null.
- **H3** — Hover/tap applies a small rotation transition. Click navigates to `target_href`.
- **H4** — Logged in: an edit mode toggles drag-to-position; positions autosave.

---

## 8. Tag manager — `/tags`

- **T1** — List all tags grouped by kind, each with its item count.
- **T2** — Rename: updates `tags.name`. Because of I1, nothing else changes.
- **T3** — Merge A→B: repoint all `item_tags` from A to B (ignoring conflicts), then delete A. One transaction.
- **T4** — Delete: removes the tag and its `item_tags` rows. Items survive. Confirm first, showing the item count that will be affected.
- **T5** — Add: name + kind.
- **T6** — `kind=system` tags are not editable or deletable.

---

## 9. Auth

- **A1** — One password, checked against an env var or a single Supabase user. No signup route, no password reset, no roles.
- **A2** — Session persists indefinitely. I should never re-login on my phone.
- **A3** — Middleware guards the `required` routes in §3.
- **A4** — Row-level: logged-out queries filter `is_public = true` at the query layer.

---

## 10. Export

- **X1** — `/export` downloads a zip: one JSON file per table (full rows), plus every uploaded file from Storage.
- **X2** — Must work from Phase 1 onward. Non-negotiable.

---

## 10b. Operations

- **O1** — Env vars, all of them, documented in `.env.example`:
  ```
  NEXT_PUBLIC_SUPABASE_URL
  NEXT_PUBLIC_SUPABASE_ANON_KEY
  SUPABASE_SERVICE_ROLE_KEY     # server-only, never NEXT_PUBLIC_, never in the client bundle
  SITE_PASSWORD                 # if not using a Supabase user
  ```
- **O2** — **Storage ceiling.** Supabase free tier is ~1GB. I upload images and PDFs constantly and will hit it. Because of C10 (WebP + downscale) this is slower than it would otherwise be, but plan for it: all file access goes through **one module** (`lib/storage.ts`) so the backend can be swapped to Cloudflare R2 without touching feature code. Never call the Supabase storage SDK directly from a component.
- **O3** — **Empty states everywhere.** Zero items, zero search results, a page with no blocks, a tag with no items, a failed image load. Each renders a short sentence, not a spinner, not a crash, not a blank screen.
- **O4** — Loading states: skeletons on the wall, spinner on upload. Never a frozen UI.
- **O5** — `updated_at` on `items` is maintained by a trigger, not by application code.
- **O6** — Migrations live in `supabase/migrations/`, are numbered, and are never edited after being applied. New change = new file.

## 11. Design constraints

- **D1** — No aesthetic decisions. Neutral: black on white, system-default spacing, one typeface set once in the root layout.
- **D2** — No gradients, shadows, accent colours, hero sections, decorative animation, or emoji in UI.
- **D3** — Visual identity arrives later as hand-drawn PNGs supplied by me. Build the frame, not the picture.
- **D4** — Violating D1–D3 is a bug, not a bonus.

---

## 12. Phases

One phase per session. Deploy before the next. Do not start the next phase in the same session.

### Phase 0 — Skeleton
Next.js + Vercel + domain + Supabase project + password login. One page reading "hello" behind auth. `.env.example` per O1.
**Accept:** I visit my domain on my phone, log in, see it.

### Phase 1 — Capture + wall
§2 schema migrated **including RLS (§2.2)**, §2.1 seeded idempotently (I7). `/add` per §4 including the C10 image pipeline. `/` per W1, W2, W9, W11. `/i/[id]` view + edit + delete (P15). `/search` per §5b. `/export` per §10. Empty states per O3.
**Accept:** (a) I dictate a thought on a walk, tag it, see it on the wall. (b) I search a word and find it. (c) I download my data. (d) **Logged out, hitting the REST endpoint with the anon key returns no private rows.**
**Then stop. I use it for one week before Phase 2 is written.**

### Phase 2 — Filtering + tags
W3–W8, S5, `/tags` per §8.
**Accept:** `/?in=astrology&out=theory` renders correctly from a cold load. Renaming a tag changes it everywhere with no data migration.

### Phase 3 — Pages canvas
§6 in full. The hard phase. **Propose a seam before starting** — suggested: (3a) canvas + text/image blocks + drag/resize + undo; (3b) pdf blocks, item_ref insert, auto-window.
**Accept:** I rebuild a notebook page on my laptop: handwriting PNG, rich typed text beside it, a doodle rotated in the corner, one fragment pulled in live, a morning-pages PDF showing its first page. It reads correctly on my phone at scale, read-only.

### Phase 4 — Homepage
§7 in full.
**Accept:** my drawn words, where I put them, linking where they should.

---

## 13. Open questions

Ask before assuming:
- Which typeface (default to Inter until told otherwise).
- Whether `/home` or `/` is the root once Phase 4 lands.
