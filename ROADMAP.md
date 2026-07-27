# ROADMAP — the spatial notebook

**What this is:** the single, canonical **product sequence** — what to build next, in what order, and how we'll know it worked. **Rebuilt from the closed model at the translation step (Stage 1f, D-085)** in the ruled language: no bit-to-bit *links*, no `kind`, no `stage` in v1 — relatedness is a **shared tag** or a **shared board**, and the canvas arrow is the **connector**. Reads *downstream* of `agreements.md` (the ruled model) and `SPEC.md` (the technical manual); it never re-derives them. The **work campaign** for the current stretch (translation → port → knowledge layer → return test, with the owner's checkpoints) is `technical-build-plan-stages-and-checkpoints.md`. Decisions + status live in `PROGRESS.md`; every deferral lives in `parked.md`.

_Rebuilt: 2026-07-21._

---

## 0. The point (the yardstick for every step)

A **private, single-user spatial notebook** — a place to **grow ideas, not just store them.** The atom is a **bit** (text · drawing · image); bits live on **boards**, and one bit can sit on many boards at once (call it in — never a copy). Ideas connect through what they **share** — a tag (the pull gathers everything carrying a word) or a board (things placed together belong together). The differentiator (D-036): the spatial freedom of a canvas fused with a findable, accumulating knowledge web — a thing neither a pure canvas nor a pure notes-web gives.

**The one success metric — the real go/no-go (D-053):**
> **~3 weeks after the knowledge layer + a real cluster of my notes exist, do I open it on my own — to connect and develop ideas — without deciding to "work on the project"?** Build toward *that*.

**Guardrails:**
- **Growing is a *feature*, not a metaphor** — the ruled growth mechanic is **travel + accumulating pulls + revision-in-place** (D-069), *not* a new "develop" tool. A bit's page shows every board it's been on; a tag's pull deepens as things accrue.
- **Build the knowledge layer *with* real content, never before it** — the owner seeds a real cluster (manually, from Apple Notes) *as* it's built, so tags and the pull have something true to bite on.
- **The login wall is not optional and not late** — it lands first (the port). **No real notes on the current public prototype until it does.**

---

## 1. Where we are *(refreshed 2026-07-27 — the previous block predated the port)*

✅ **The model is closed, audited, walked through real scenes, and *translated* to a proven schema** (Stage 1, D-083–D-085) — the migration applies and every rule is proven in `verification/`.
✅ **The port is DONE and live** — cloud Supabase + Vercel, login wall, RLS, real data at `world-website.vercel.app` (D-089/D-092). Compose on real rows: text · image · pen (colors/sizes/eraser, D-099) · endless canvas + fit · tags + find + the pull · tag manager · board tagging · trash/restore · export · a bit's own page + travel · a read-only graph view.
✅ **The full bit + capture-lite** — source made **first-class**, bookmark retired (D-102); rich text; the editable workspace; the inbox + intake (source + tags at capture, smart source links); the source manager; **call-in both doors** (the loose-notes column on a board · "place on…" from the inbox) (D-103–D-105).
✅ **Gather G1** — the `reference` table applied (D-101); the `[[` picker (G2/G3) is next in that track.
🔎 **Deep multi-agent review run 2026-07-27** (D-106): 11 confirmed findings all fixed same-night; docs re-synced; proofs green.

---

## 2. The sequence at a glance

| # | Phase | Goal | Gated on |
|---|-------|------|----------|
| **1** | **The port — cloud + login + backup** | Make the prototype real, private, synced, backed-up; real notes come in | owner accounts |
| **2** | **The knowledge layer** ⭐ | Tags · the pull · find + the ledger · the tag manager · the bit's page + travel · the connector batch — *the soul*, built **with** real content | Phase 1 |
| **3** | **The graph** | See the web (dots joined by shared words + shared places); wander it | Phase 2 |
| **4** | **Richer boards** | Collection ↔ canvas modes · call-in · undo (the growth mechanic is already the tags/pull/travel of Phase 2) | Phase 1–2 |
| **5** | **Phone capture** | Fling a bit from the phone, offline-safe (matters with volume) | Phase 1 |
| **6** | **Browse / resurface feed** | A place worth landing on that brings old bits back (matters with volume) | Phase 1 (+ data) |
| **7** | **Sharing — the privacy gradient** | Hand a trusted person a key to *look*; publish a board on purpose | Phase 1 |
| **∞** | **Treats** | crop · HEIC conversion · pen brushes/colours · pdf·audio bits · wrap-box · infinite canvas · JSON-Canvas export | `parked.md` C |

**Owner priorities:** cloud/backup = must. The knowledge layer = **highest value, do it beautifully.** Capture + feed = later, with volume. Migration = **manual** (Apple Notes won't auto-export cleanly — S2).

---

## 3. The phases — with steps to follow

> The current stretch (Phases 1–2) has a detailed campaign with owner checkpoints in `technical-build-plan-stages-and-checkpoints.md`. Per-piece plans are written **fresh from the agreements right before each build** (the anti-staleness rule — a plan written far ahead rots; evidence: the retired `old/draft-plan-tags.md`).

### Phase 1 — The port: cloud + login + backup (the floor and the lock)
**Goal:** turn the per-device prototype into a real app on your domain — private, synced across desktop + Daylight, backed up — and bring your real notes in. **Success check:** you log in on both devices, the same board is on both, a nightly backup exists, and your first real board lives behind the login.
**Steps:** (1) **you provide** the cloud accounts (Supabase project keys, Vercel, domain). (2) Apply the proven migration to cloud Supabase (empty-DB replace); create the `public` + `private` storage buckets; **re-run the Stage-1 proofs against the cloud DB**. (3) **The login wall** — Supabase Auth, the whole app behind your one account; the public-open state closed. (4) **Rewire compose to the schema** — every read/write through the one door (`lib/db`) onto real `bit`/`placement` rows; media through `lib/storage` (paths, not URLs). Includes **un-place vs trash as two distinct, labeled acts on every removal surface (I-W1)** — the S7 non-negotiable — **and the optional text-bit title (D-087: blank-default, first-line-stands-in)**. (5) **Media pipeline** — client→Storage direct, downscale, thumbnails; **the HEIC/unreadable message** (no silent failure — parked C2). (6) Deploy on your domain; verify logged-out gets nothing. (7) **Backup + export** — the nightly GitHub-Actions cron (doubles as the keep-alive) and **`/export` (every row + file — I-G1), shipped before real notes land** (F5). (8) **Now safe:** real notes in (scene S1 comes true).
**Build-notes from the scenes:** at source-capture the title fetch often fails on auth-walled URLs (Drive, Instagram) → the source is named after its link (name-fallback, D-102), so make the rename prompt natural (S1). The two-device checkpoint (log in on both, edit/move/trash/restore across them, drop wifi mid-edit and see the honest failure) is the port's owner gate.

### Phase 2 — The knowledge layer ⭐ (the soul)
**Goal:** make bits *about* something, *findable*, and *connected*, so ideas **accumulate**. Built beautifully (research: `research-knowledge-layer.md`) and **with real content flowing in**. **Success check:** the ~3-week return test. **Build order (agreements §3/§4/§7):**
1. **Tags + the picker** — labeled rows of your own chips, tap to toggle, create-new always present, recency-first; **chips pre-lit at board birth** (a bit born on a tagged board sees the board's tags — confirm or flick off, never silent). Tags always optional.
2. **The pull** — tap a tag → everything carrying it (bits *and* boards), computed, complete, never curated.
3. **Find + the ledger** — filter by tag (include/exclude), by type/subtype (all your drawings, free), and full text; the URL is the query. **Empty query = the ledger** (every live bit, newest first — the reachability floor).
4. **The tag manager** — rename (free), merge A→B, delete — **counts include frozen carriers** ("3 things + 2 in trash").
5. **The bit's page + travel** — one bit, its content, its tags, the boards it's on, and its **travel** (has been on · arrived · left).
6. **The connector batch** — canvas arrows between cards on a board (§6a): drag from a card's edge, auto-reroute on move, tap to delete; a proportional confirm when un-placing a card that carries any. Purely additive (new table only) — lands after the port + tags.
**Build-note (highest-leverage for this owner):** the **content-line offer at image-drop** is this screenshot-heavy owner's single biggest findability surface (S5) — make it one effortless, dictation-friendly tap.

### Phase 3 — The graph (the payoff)
**Goal:** *see* the web and **wander** it. Dots (bits · boards · tags) joined by shared words + shared places; **local-neighborhood first** (`react-force-graph` — dep approval; parked B5). Connectors do **not** feed it (co-placement already covers the graph). **Success check:** clicking around surfaces a connection you'd forgotten.

### Phase 4 — Richer boards
**Goal:** the full two-mode board on real data. **Steps:** collection (a gathered pile, no positions) ↔ canvas (arranged spatially); **call in** an existing bit (a new placement — one bit, many boards, live); board-scoped undo/redo. **No new "growth" feature** — growing is already the tags, the pull, travel, and revision from Phase 2 (D-069); ordered maturity rides ordinary tags (`#seed`, `#fruit`), an ordered `stage` field only if genuinely missed (parked A9).

### Phase 5 — Phone capture *(later — matters with volume)*
**Goal:** fling a bit from the phone in seconds, offline-safe. Opens with a **one-day on-device spike** (the biggest risk). **Steps:** `/capture` (offline-precached) + `/api/capture` (bearer token → service-role) → the **births-only** offline outbox ("N waiting to sync", flushes on next open, **born-at = act-time**) → optional quick tags → `serwist` service worker *(new dep, approval)*. Also the **PWA install** ("feels like my app" — parked B2). No iOS Web Share Target / no Background Sync; JPEG on iOS; convert HEIC in the Shortcut.

### Phase 6 — Browse / resurface feed *(later — matters with volume)*
**Goal:** a place worth *returning* to; the landing invites wandering, not a blank board. **The one surface that must be deliberately designed** (image-forward, density, rhythm — "or returning fails"). A few random-old + recent bits. The **doodled home board** (parked B4) is buildable anytime — it's just another board. *(Phrasing to reconcile once Stage 3's presentation-intentionality call is made: with the feed deferred, the pull + ledger are the de-facto return surfaces meanwhile — the Stage-3 entry gate decides whether they get feed-level care, so "the one surface" may become "the one **remaining** deliberately-designed surface.")*

### Phase 7 — Sharing (the privacy gradient)
**Goal:** hand a trusted person a key to *look*; publish a board on purpose. New bits start **public**, boards start **private**; a board turns public only by a deliberate act, and at that moment a **publish preview** shows *exactly what a guest will see* (visible cards, withheld-private cards render absent, and any public boards it opens into). **Steps:** the `shared` visibility tier + the whole guest layer (parked B6) → the guest RLS policies (reachability **AND** visibility — the drafted comments in the migration become live) → the publish preview. **Decide when real:** guest-pull scope (globally-public vs share-scoped — parked A4).

### ∞ Treats — deliberately deferred (hold the line; canonical list in `parked.md` C)
Non-destructive crop · full HEIC conversion · pen brushes/colours/eraser · **pdf · audio bit types** (parked B7) · the wrap-box "text flows around forms" dream · infinite pan/zoom canvas · JSON-Canvas export · handwriting recognition (parked B8).

*(Event-gated model deferrals — the pairwise **link** between two bits, **document mode**, board-side "everything ever placed here" — are **not** on this sequence. They wait on a real moment in use, tracked with their re-entry conditions in `parked.md` A. A roadmap must never imply an evidence-gated thing is simply "coming." The **optional text-bit title** left this list — the owner ruled it in, D-087; it builds in Phase 1.)*

---

## 4. Cross-cutting foundations (true across every phase)

- **Stack:** Next.js (App Router, TS strict) · React · Supabase (Postgres/Storage/Auth) · Tailwind (layout only) · pre-approved libs `dnd-kit`, `react-rnd`, `tiptap`, `pdf.js`, `zod`, `perfect-freehand`. New deps need approval.
- **Security = RLS, never the query layer.** Service-role key server-only. Storage via `lib/storage` + signed URLs. Only the owner ever has an account (the load-bearing wall).
- **The schema (proven — `SPEC.md` §2):** the nine record kinds in three families — **things** `bit` · `board` · **acts** `tag_application` · `placement` · `connector` · **vocabulary** `tag` · `category` · `subtype_word` · `source` — plus the dormant tenth and one derived index (`reference`). Retrieval is computed (ten views); the face is a generated column; one clock, one trigger.
- **Naming:** the `lexicon.md` words. Code = `bit` + `board`; the owner's word *fragment* = bit; "canvas" = a board's spatial **mode**, never a synonym for a board.

---

## 5. Judge it by this, not by looks

After Phase 2 (the knowledge layer + a real cluster of your notes), **live in it for ~3 weeks.** If you open it unprompted — to connect and develop ideas — the thesis is proven and everything above is worth building. If you don't, no polish saves it, and better to learn that early. **Close the loop thin; then deepen.**
