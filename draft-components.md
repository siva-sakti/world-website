# Components & References — Frontend + Backend

*Every part of the system: **what it is**, and the closest example to **study / borrow** (its "likeness") — so we reuse the wheel and hand-build only what's genuinely ours. Organized frontend / backend. Status: **🟢 = MVP-core** (build first) · **⚪ = deferred/later**.*

**The one-line model:** *Heptabase-style cards (any size) on Freeform-style boards, tagged like Obsidian, where the same card can live on many boards at once — as a public web diary you own, on any device.*

---

## Frontend

| Part | What it is | Likeness / borrow from | Status |
|---|---|---|---|
| **Board surface (the canvas)** | The spatial compose surface: drag / resize / arrange bit-cards, smoothly; touch **and** mouse, landscape; two modes — *collection* (grouped) ↔ *canvas* (positioned). | **Freeform** = the *feel* target (drop/drag/**buttery resize**); **tldraw / Excalidraw** = how to get that feel *on the web*; **moveable / react-rnd / dnd-kit** = DOM drag/resize; **JSON Canvas** = positions | 🟢 |
| **Bit-cards** | How each bit type renders + edits on a board and in the heap | *(per type below)* | 🟢 |
| ↳ text bit | rich text, one line → full essay | **Tiptap** | 🟢 |
| ↳ image bit | drop, **crop** (non-destructive), resize aspect-locked | **Freeform** (crop/resize feel); browser canvas | 🟢 |
| ↳ doodle bit | **in-app web pen** + imported PNG | **perfect-freehand** + Excalidraw/tldraw draw tool | 🟢 *(pen spike first)* |
| ↳ link bit | paste a URL → a card (like Freeform's link object) | **Freeform** link cards | 🟢 |
| ↳ pdf bit | first page rasterized as the card; click → full PDF | **pdf.js** | ⚪ |
| ↳ audio bit | attached file → small player | native `<audio>` | ⚪ |
| **Toolbar** | add text / image / doodle / link; select; pen | **Freeform / Excalidraw** toolbars | 🟢 |
| **Pen / drawing tool** | web pen, calligraphic brush + eraser; strokes stored as **vector** (tiny) | **perfect-freehand** | 🟢 *(spike)* |
| **Heap / fragment grid** | browse all bits — image-forward, order can be random; pull one onto a board | **Heptabase** card library; **Pinterest / Tumblr** feel; **Are.na** | 🟢 |
| **Tag UI** | tap-from-existing **+ create-new** picker; never typed syntax | **Obsidian** tags; **Bear** tap-tag | 🟢 |
| **Topic-page** | everything about a tag (backlinks) — the topic-home | **Obsidian** backlink / tag pages | ⚪ |
| **Search UI** | search box + results grid | Obsidian search | ⚪ |
| **Login** | single-owner sign-in | *built* | 🟢 |
| **Home (doodled index)** | hand-drawn landing board linking to boards | indie-web / hand-drawn | ⚪ |
| **PWA shell** | installable on phone + desktop + Daylight; offline capture shell later | standard PWA; **serwist** (later) | ⚪ |
| **Design system** | quiet / white / fast chrome, one typeface; the **feed is the one deliberately-designed exception** | indie-web "vibes" pages | 🟢 |

## Backend

| Part | What it is | Likeness / borrow from | Status |
|---|---|---|---|
| **Data model** (Postgres) | `bits` (cards, any type) · `boards` (2-mode) · `placements` (bit on a board, **position optional = transclusion**, one bit → many boards) · `tags` · `bit_tags` · `board_tags` · `links`. `kind` on bits; `stage` on boards (later migration). | **JSON Canvas** (node/edge model); **Heptabase** (card model); *our migration — built + validated on Postgres* | 🟢 *(built)* |
| **Auth** | Supabase Auth, single owner; **RLS is the security boundary** (not query filtering); privacy tiers (private/shared/public) later | Supabase Auth + RLS | 🟢 *(built)* |
| **Storage** (`lib/storage`) | one module. Images → downscaled WebP/JPEG; files → as-is, size-capped; **doodles → vector (a few KB)**; private → signed URLs; R2 path later | Supabase Storage + our abstraction | 🟢 *(module built)* |
| **Data access** (`lib/db`) | typed functions; components never call Supabase directly | our `lib/db` | 🟢 *(built)* |
| **Search** | Postgres FTS over bit text (**HTML-stripped** tsvector) + tag filter | Postgres FTS | ⚪ |
| **Capture endpoint** (`/api/capture`) | bearer-token Shortcut intake; direct-to-storage; offline outbox | *fully designed, SPEC §4b* | ⚪ *(deferred)* |
| **Export / backup / trash** | `/export` (JSON per table + files); **GitHub Actions nightly** `pg_dump` + storage sync (doubles as **keep-alive** vs free-tier pause); soft-delete (`deleted_at`) | pg_dump; GH Actions cron | ⚪ *(from real data)* |
| **Deploy / host** | Next.js on **Vercel** + cloud **Supabase** + your **domain**; served as a PWA | Vercel; standard PWA | 🟢 *(Phase 0)* |

---

## Build vs borrow — the honest split
- **Borrow the *approach / data model***: **JSON Canvas** (canvas model), **Heptabase** (card reuse), **Obsidian** (tags / transclusion), **Freeform** (interaction *feel*, by observation — it's closed-source). Study, don't depend.
- **Use as *libraries*** (pre-approved): Tiptap · pdf.js · zod · dnd-kit / react-rnd (or moveable) · perfect-freehand · Supabase. `serwist` later (capture).
- **Hand-build — genuinely ours**: the **integration** (a bit *is* a taggable, referenceable card), the **heap → board pull + transclusion**, the **public/private web layer**, and the **topic-home loop**. This is the part nothing off-the-shelf does — and the reason we build.

## The hardest part to hit (flagged early)
Matching **Freeform's resize/drag smoothness in a browser** is the single toughest piece of the frontend. **tldraw** is the proof it's achievable and the first thing the research nails down — because if we can't get *close* to that feel, the compose surface won't satisfy, and we want to know early.

*Related: `draft-highlevel.md` (the plan) · `SPEC.md` (detailed rules) · `draft-map.md` (status) · `PROGRESS.md` (decisions).*
