# ROADMAP — the spatial notebook

**What this is:** the single, canonical, followable plan — reordered around the owner's actual north star (**"Obsidian, but an interactive canvas"**) after a fresh-eyes review (D-053). It reconciles the older build-queues into one sequence with concrete **steps**. Detail still lives in `SPEC.md` (the *what*), `PROGRESS.md` (decisions + work done), `draft-map.md` (per-surface status); this ties it together and says *what to build next, in what order, and how we'll know it worked.*

_Last updated: 2026-07-17_

---

## 0. The point (the yardstick for every step)

A **private, single-user spatial notebook** — a place to **grow ideas, not just store them.** The differentiator, in the owner's words: **Obsidian's knowledge web (tags, backlinks, forward-links, graph) fused with an interactive spatial canvas** — a thing neither Obsidian (no canvas) nor Freeform (no knowledge web) can do (D-036). The atom is a **bit** (text/image/handwriting/…), re-combinable across many **boards** without copying (transclusion).

**The one success metric — the real go/no-go (D-053):**
> Not *"does it look/feel cool."* The only test that separates *beloved* from *abandoned* is: **~3 weeks after the knowledge layer + a real cluster of my notes exist, do I open it on my own — to connect and develop ideas — without deciding to "work on the project"?** Build toward *that*.

**Guardrails carried from the review:**
- **Grow must be a *feature*, not a metaphor** — the connect/tag/graph layer *is* the growth mechanic. Design it so ideas *accumulate and connect over time*, not just get filed.
- **Build the knowledge layer *with* real content, never before it** — the owner seeds a real cluster (manually, from Apple Notes) *as* we build, so tags/links have something true to bite on.
- **The login wall is not optional and not late** — it lands in Phase 1. **Do not put real notes on the current public deploy** until it does.

---

## 1. Where we are

✅ **Compose board built, deployed, validated on the Daylight with a real stylus** — text (reshape + scale), image (drop/resize), handwriting (the pen). Live at `world-website.vercel.app`.
⚠️ **Prototype only:** localStorage, per-device, **no cloud, no login, no backup** — and currently **public**. That's Phase 1.

---

## 2. The sequence at a glance

| # | Phase | Goal | Gated on |
|---|-------|------|----------|
| **1** | **Cloud + login + backup** | Make it real, private, synced, backed-up (+ port compose) | owner accounts |
| **2** | **Knowledge layer** ⭐ | Tags · backlinks · forward-links · find · topic-pages — *the soul*, built **with** real content | Phase 1 |
| **3** | **Graph view** | See the web of connections; wander it | Phase 2 |
| **4** | **Richer boards + growth mechanic** | Two modes · transclusion · undo · "develop this idea over time" | Phase 1–2 |
| **5** | **Phone capture** | Fling a fragment from your phone (later — matters with volume) | Phase 1 |
| **6** | **Browse / resurface feed** | A feed you land on that brings old ideas back (later — matters with volume) | Phase 1 (+ data) |
| **7** | **Privacy gradient** | Selectively share/publish (private → key → public) | Phase 1 |
| **∞** | **Treats** | rotation, in-app pen brushes, audio/pdf/link bits, wrap-box, infinite canvas, PWA | various |

**Owner priorities (explicit):** cloud/backup = must. Knowledge layer (tags/backlinks/forward-links/graph) = **highest value, do it beautifully.** Capture + feed = later, once there's volume. **Rotation = deprioritized, not now.** Migration = **manual** (Apple Notes won't auto-export cleanly).

---

## 3. The phases — with steps to follow

### Phase 1 — Cloud + login + backup (the floor and the lock)
**Goal:** turn the per-device prototype into a real app on your domain — private to you, synced across desktop + Daylight, backed up. **Success check:** you log in on both devices, the same board is there on both, and a nightly backup exists.

**Steps:**
1. **You provide** the cloud accounts: a Supabase project (URL + anon + service-role keys), Vercel access, your domain. *(I can't log in as you.)*
2. Apply the schema migration to cloud Supabase; create the `public` + `private` storage buckets.
3. **Wire the login wall** — Supabase Auth (email+password, already scaffolded); the whole app behind your account; remove the public-open state (D-049 hazard closed).
4. **Port compose: localStorage → Supabase** — bits → `bits` rows, placements → `placements` rows; all media through `lib/storage` (store **paths, not URLs**; sign at read time).
5. Deploy on your domain; **verify** logged-out gets nothing.
6. **Backup** — GitHub Actions nightly `pg_dump` + storage sync → private artifact/R2 (doubles as the Supabase keep-alive so a free-tier project doesn't pause).
7. **Now safe:** put your real notes on it.

**Notes/decisions:** RLS is the boundary; service-role key server-only; uploads go client→Storage directly (4.5 MB serverless cap). D-002, D-021/29, D-031, D-049.

### Phase 2 — The knowledge layer ⭐ (tags · backlinks · forward-links · find · topic-pages)
**Goal:** the soul — make bits *about* something, *findable*, and *connected*, so ideas **accumulate and grow.** Built **beautifully** (researched) and **with real content flowing in.** **Success check:** the ~3-week return test above.

**Steps:**
0. **Research + design pass** *(I'll do this — you greenlit it):* study how Obsidian / Roam / Tana handle **tags, backlinks, unlinked mentions, forward-links, and the tag→page→graph UX**; decide what to adopt and what to do better; design the tag+link model + interactions so they feel *effortless* (tap-not-type, **no `[[ ]]` syntax**). Output: a short "knowledge-layer design" doc before we build.
1. **Tag a bit / a board** — a tap-existing + create-new picker, recent-first; tags always optional (D-039).
2. **Frictionless "quick add"** — paste a note → it becomes a bit — so you **seed a real cluster of your Apple Notes** as you go (manual, deliberate — truer to "grow, don't hoard").
3. **Links both directions** — **forward-links** (this idea → that idea) *and* **backlinks** (what points here), surfaced on every bit and board.
4. **Topic-page per tag** — everything about a tag in one place = the "topic-home"; designed as a **living surface you write *into* and watch accumulate** (this is the growth mechanic, not just a backlink list).
5. **Find / pull** — filter by tags (include/exclude) + full-text search; state in the URL (bookmarkable); results = a grid.
6. **Tag manager** — rename (free, no data migration), merge A→B, delete-with-count.

**Notes/decisions:** FTS column already exists (HTML-stripped); tags referenced by id only so renames are free (I1); "significance = tagging" (untagged idle marks don't clutter find, D-039). D-020, D-036, D-024.

### Phase 3 — Graph view (the payoff)
**Goal:** *see* the web you've built and **wander** it (not query it). **Success check:** clicking around the graph makes you *discover* a connection you'd forgotten.
**Steps:**
1. Render nodes (bits + boards) and edges (explicit links + placements + shared tags).
2. Filter/scope it; click a node → open that bit/board.
3. Tune for wandering (gentle, legible), not analytics.
**Notes/decisions:** it renders the connective tissue built in Phase 2 (so it's a payoff, not from scratch). **Needs a viz approach** — a force-graph library (dep approval) vs hand-built canvas. D-023 (was demoted → **elevated per owner**).

### Phase 4 — Richer boards + the growth mechanic
**Goal:** the full two-mode spatial canvas on real data, plus explicit "develop an idea over time."
**Steps:**
1. **Two modes, same board:** *collection* (grouped, no positions, works on phones) ↔ *canvas* (positioned, drag/arrange — the sit-down act).
2. **Insert existing bit** — search → place a *new placement* (live transclusion; one bit, many boards).
3. **Undo/redo** (board-scoped, ~50 mutations, Cmd/Ctrl+Z).
4. **The growth mechanic** — a lightweight **"continue / relate this thought"** action so a bit grows a visible **lineage**; `stage`/tending surfaces (define the maturity steps here — D-028 schema gap closes now).
**Notes/decisions:** react-rnd owns on-canvas drag/resize, dnd-kit owns tray→board; wire `react-rnd`'s `scale` prop to board scale (D-030/48). D-019, D-013/28, D-048 (infinite canvas is a later camera layer, forward-compatible).

### Phase 5 — Phone capture *(later — matters with volume)*
**Goal:** fling a fragment from your phone in seconds, offline-safe. **Start with a one-day iOS spike** (the biggest technical risk, D-032).
**Steps:** iOS spike → `/capture` (offline-precached) + `/api/capture` (bearer `CAPTURE_TOKEN` → service-role) → offline outbox ("N waiting to sync", flushes on next open) → optional quick tags → `serwist` service worker *(new dep, needs approval)*.
**Notes/decisions:** no Web Share Target on iOS; no iOS Background Sync; JPEG-on-iOS; convert HEIC in the Shortcut. D-018, D-022, D-025–27, D-031.

### Phase 6 — Browse / resurface feed *(later — matters with volume)*
**Goal:** a place worth *returning to* — and the **default landing should invite wandering, not be a blank work-board.**
**Steps:** a designed, image-forward grid (the one deliberately-designed surface; text preview card is its primary object, D-033) → a few random old bits + recent on home → an "untagged recent" strip.
**Notes/decisions:** D-033, D-008.

### Phase 7 — Privacy gradient
**Goal:** selectively expose — private (only me) → shared-with-a-key (read-only) → public. New things start private; publishing is deliberate. *(The login wall — "only me" — already shipped in Phase 1; this is the finer control.)*
**Steps:** activate `visibility` per bit/board → anon read-public RLS policies (own migration) → shared password-key tier → public-filtered routes (same components, RLS picks the rows).
**Notes/decisions:** D-012, D-015.

### ∞ Treats (deliberately deferred — hold the line)
**Rotation** (react-rnd doesn't do it → custom handle + transform math; *owner said not now*) · in-app calligraphic pen (brush types/colours/eraser) · link/audio/pdf bits · the **"text flows around forms" wrap-box** dream (D-044; MVP text stays rectangular) · **infinite / pan-zoom canvas** (D-048) · PWA shell · doodled hand-drawn home board · JSON Canvas export · read-only shared keys for friends.

---

## 4. Cross-cutting foundations (true across every phase)

- **Stack:** Next.js 16 (App Router, TS strict) · React 19 · Supabase (Postgres/Storage/Auth) · Tailwind 4 (layout only) · pre-approved libs `dnd-kit`, `react-rnd`, `tiptap`, `pdf.js`, `zod`, `perfect-freehand`. New deps need approval.
- **Security = RLS, never the query layer** (the anon key ships to the browser). Service-role key **server-only**. Storage via `lib/storage` + signed URLs.
- **Data model (written + validated):** `boards` · `bits` (atom; `kind`, `deleted_at`, HTML-stripped FTS) · `placements` (bit-on-board; x/y optional = transclusion) · `tags` · `bit_tags` · `board_tags` · `links` (bit→bit). Dates auto (trigger). **`stage` not yet in schema** (lands Phase 4). No `rotation` column.
- **Naming:** code = `bit`+`board`; your words = `fragment`+`board`; "canvas" = a board's spatial mode.

---

## 5. Open questions & needs-owner

**Blocked on you:** cloud Supabase keys · Vercel + domain + DNS · disk space before local `supabase start` · `serwist` approval (Phase 5) · a viz-lib decision (Phase 3 graph) · the iOS spike needs your iPhone.
**Design questions:** the knowledge-layer UX (Phase 2 research resolves much of it) · `stage` steps (how many, named/numbered) · `kind` fixed-at-four? · exactly how connections get *surfaced* (backlinks vs suggested-adjacency) · v1 cut line.

---

## 6. Easy-to-forget technical checklist (don't ship a phase that breaks one)

- [ ] **Login wall in Phase 1; no real notes on a public URL before it.**
- [ ] **Export/backup from day one**; every new table added to `/export` (I5). Backup = GitHub Actions cron (also the Supabase keep-alive).
- [ ] **Media uploads client → Storage directly** (4.5 MB serverless cap). **Storage columns hold paths, not URLs.** **Service-role key server-only.**
- [ ] **Build the knowledge layer *with* seeded content**, not before it (the review's core warning).
- [ ] **Tags referenced by id only** (renames free); **FTS is HTML-stripped**; text stored as HTML; `updated_at` trigger-maintained.
- [ ] **Handwriting is SVG → invisible to search** — add an optional typed title/caption per doodle so the "everything findable" promise holds.
- [ ] Capture (Phase 5): no iOS Web Share Target / no Background Sync; JPEG on iOS; convert HEIC in the Shortcut. **HEIC can't decode in Chrome** (surface a message).
- [ ] Boards: one drag-owner per gesture (react-rnd vs dnd-kit); wire `react-rnd` `scale` under `transform: scale()`; `stage` migration + placement invariant `((x is null)=(y is null))`; at most one home board.
- [ ] **Empty + error states everywhere**; the browse feed is the only deliberately-designed surface (one typeface elsewhere).
- [ ] Known gotchas: Turbopack stale CSS (`rm -rf .next` + restart); Daylight cert scare = browser dropped SNI (close+reopen browser); LAN dev doesn't hydrate on the Daylight (judge feel on the deployed URL).

---

## 7. Judge it by this, not by looks

After Phase 2 (knowledge layer + a real cluster of your notes), **live in it for two weeks.** If you open it unprompted — to connect and develop ideas — the thesis is proven and everything above is worth building. If you don't, no amount of polish saves it, and we'd rather learn that early. **Close the loop thin; then deepen.**
