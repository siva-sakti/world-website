# Parked — everything deferred or open, in one place

**What this is:** the complete ledger of everything the project has *consciously* deferred, parked, or left open — each with its **named re-entry condition** and its **source** (where the ruling lives). This file is an **index, never a source**: the ruling is always the cited section; this list only guarantees nothing parked can be silently forgotten. Update it in the same pass as any new deferral or any re-entry. *(The live action queue — walkthrough, translation, nits — is `PROGRESS.md`'s job, not this file's.)* Written 2026-07-20.

**How to read "re-entry":** most items wait on a *moment in real use*, not a date. The moment is the evidence **and** the build order.

---

## The only "now" this ledger generates — what translation must not foreclose

Triage (2026-07-20): **no parked item needs re-opening.** But five have a schema shadow — the migration must keep the door open, or the parked thing dies silently:

1. **`visibility` stored extensibly** — `shared` joins later (B6); don't hard-close the two-value set.
2. **`type` stored extensibly** — `pdf` · `audio` join later (B7).
3. **Born-at is client-suppliable at insert** — Phase-5 capture carries the act's timestamp (B1 / I-D4); zero rework later.
4. **The dormant link table ships in the migration** (A2) — never dropped as "unused."
5. **`UNIQUE (target, board)` knowingly forecloses the visit-log** until replaced (A7) — say so in the migration comment.

**Walkthrough watch-list (observe, never test):** A2 · A1 · A10 — the three re-entry conditions real scenes are most likely to trip. A scene firing one is evidence, free.

---

## A. Model-level — deferred with a named re-entry (ruled in `agreements.md`)

| # | parked thing | re-entry condition | source |
|---|---|---|---|
| A1 | **Document mode** — a board rendered as a vertical text-first flow | ✅ **RE-ENTRY FIRED BY OWNER 2026-07-25** — pulled into v1 (Plan E, last slot in the A→B→D→C→E queue). **The entry gate is honored, not skipped:** Plan E *opens* with the §6b design round (split/merge semantics · bit-birth-at-enter · mode permanence) before any build. Plan written fresh at its start (anti-staleness rule) | §6b |
| A2 | **The pairwise link** — a direct bit↔bit tie (the dormant table) | the first real miss: standing on a bit, another belongs with it, no shared tag feels true, no board feels warranted (symptoms: a board-of-two, a single-use tag) → built that week, small + symmetric. **UNCHANGED by gather (2026-07-25, D-101):** gather's `reference` is *directed and grown from writing* — it does **not** cover A2's *symmetric, writing-less* pair-tie (two doodles that relate with no sentence to hang the tie on); the dormant table keeps sleeping under this condition (§6 amendment). *(Contrast A6, which capture absorbed.)* | §6 |
| A3 | **Contextual bit-privacy** — born in a private board → born private | publish previews prove tedious in real use | §2a |
| A4 | **Guest-pull scope** — "open to them" = globally-public vs share-scoped | decide when sharing is real; principle already ruled (a tag opens nothing) | §4 |
| A5 | **Board-side history** — "everything ever placed here" | the first time you stand on a board wondering what left it | §5 / I-T6 |
| A6 | **Loose-bits drawer** — a "not on any board" filter in find | ✅ **ABSORBED (2026-07-25, D-100)** — **the inbox *is* the loose surface** (every live bit no board shows, newest-first, computed as `the_inbox`); supersedes the "if wanted" note. *Quick-add (jot a note / paste a link → born loose) lands with the inbox in capture Slice 2.* | §7 / capture-slice1-checkpoint-A.md |
| A7 | **Visit-by-visit travel timeline** — full entry/exit log per board | additive later; v1 keeps the durable membership row only (last departure overwritten on re-place) | §2c |
| A8 | **Multi-home categories** — one tag word in 2+ categories | if one-home-per-tag ever genuinely blocks | §3b |
| A9 | **`stage` / ordered board maturity** | if genuinely missed; meanwhile maturity rides ordinary tags (`#seed`, `#fruit`) | §5 / D-070 |
| A10 | **Optional title on text bits** | ✅ **RE-ENTRY FIRED BY OWNER DECISION 2026-07-22 (D-087)** — ruled in ahead of the evidence trigger. Owner chose to enable the optional title (blank-default, first-line-stands-in, nothing forced); unlocks owner-writes to `content` on text bits; the column already exists, so it's a switch — **built at the port.** *(Prior evidence log: the owner reached for a bit-title 4× across the Checkpoint-B conversations 2026-07-20→22; the gate was designed to fire on real-use display, but the owner exercised their authority to rule it in directly.)* See agreements §2f. | §2f / §2b |
| A11 | **Edit history / versions** | if silent last-arrival-wins ever bites in real life; the `updated_at` it needs already exists | §2d |
| A12 | **Crash-guard draft** — device-local editor restore after a crash | additive anytime; must restore *into the editor* only — never auto-replay to the DB (I-D3) | §2h |
| A13 | **Dedicated speak-button** for dictation | only if the keyboard-mic two-tap path proves slow | §2b |
| A14 | **Video as a stored type** — v1+ answer (re-homed D-102): a video is a **source** on a note, or a **rich-text link inside** a note — not a saved object. *(Was "a reference / bookmark to Drive/YouTube"; bookmark is retired, so that mechanism is gone — a source-on-a-note replaces it.)* Storing files means real infrastructure: transcoding for cross-browser playback (iPhone HEVC won't play in Chrome/Daylight), 100MB–1GB files, bandwidth cost | **unchanged** — the day a video feels like a *bit* (something to place, tag, grow on a board rather than point at), or a linked video dies and it hurts. Additive when it fires: a `video` type = the same two-halves storage as images, no rework | D-079 · §2a · D-102 |
| A15 | **Board-gathering** — gathering a bit *into a board* (not just from writing) | named now so it can't surprise: if it ever fires, `to_bit_id` becomes the house exactly-one-target pair (`to_bit_id`/`to_board_id` + a CHECK) — a small migration then, no rework | gather-g1-checkpoint-A §9 |
| A16 | **Active rename-propagation** — fan-out rewriting every referencing note when a gathered bit is renamed | rejected in the Principle 9 carve (the chip self-heals lazily instead — §6 amendment / I-Ref8); re-enter only if the lazy staleness ever genuinely annoys | gather §7/§9 |
| A17 | **"(removed)" reveals a trashed bit exists** — a muted chip shows that a referenced bit is trashed | fine owner-only now; revisit at the sharing phase (a guest must not learn a withheld thing exists) | gather §9 |
| A18 | **Storage format for word-forward writing** (Markdown vs HTML) | decided *with* document mode (A1 / Plan E); gather is built format-agnostic so it carries over either way | gather §9 / §6b |
| A19 | **Bulk call-in** — select several loose notes → place together | the natural next want once a big pile builds; re-enter when the one-at-a-time gesture starts to feel slow | call-in plan §12 · D-104 |
| A20 | **The multi-board call-in door** — reach an *already-placed* bit and put it on a second board, live (the D-036 differentiator). `callInBit` is already capable; only the door is unbuilt — both current doors surface loose notes only | re-enter deliberately (a conscious v1 scoping — "call-in done" ≠ "the differentiator done"); the gather/source plans gesture at the affordance ("from find and the bit page") | call-in plan §12 · D-104 |
| A21 | **Drag-to-drop-exact call-in** — drag a loose note from the column to a precise spot (v1 is click → view-center) | pure polish on the working gesture; re-enter if view-center landing ever annoys | call-in plan §12 |
| A22 | **Server-side loose-note filtering** — the column filters in-memory today | re-enter only if the loose pile grows past snappy (single-writer scale says: not soon) | call-in plan §6/§12 |
| A23 | **Source URL-conflict surfacing** — pasting a URL whose fetched title matches an existing source keeps the existing source's url; a *conflicting* url is dropped silently after the D-106 back-fill fix (a NULL url now back-fills) | the collision's resolution is the owner's ruling to make (I-Src3: re-URLing is deliberate); re-enter when it first bites | D-106 review |
| A25 | **Link-bit embeds** (a YouTube/Spotify player playing in place on the card) + a deliberate **re-fetch act** (re-read a link's title/image on the owner's click — read-once means an unlucky early fetch stays plain) | embeds: the card leaves the owner wanting play (iframes/tracking/weight were the v1 no); re-fetch: a plain card annoys at scale | D-129 · link-bit-plan.md |

## B. Phase-scheduled promises — deferred by choice to a named phase (re-blessed by the owner)

| # | thing | where it lands | source |
|---|---|---|---|
| B1 | **Phone capture loop** — instant capture, offline outbox (births-only), iOS Shortcut; `serwist` dep needs approval | Phase 5 | ROADMAP · audit #12 · §2h |
| B2 | **PWA install** ("feels like *my* app") — a philosophy promise, deferred eyes-open | Phase 5 | audit F8 |
| B3 | **The feed** — browse/resurface, random-old, image-forward. ⚠ the one surface that must be *deliberately designed* ("or returning fails") | Phase 6 | §5a · CLAUDE.md design stance |
| B4 | **Doodled home** — a hand-made home board | build-it-yourself anytime; it's just another board | §5a |
| B5 | ~~**The graph view** — local-neighborhood first; `react-force-graph` needs dep approval~~ | ✅ **built** — a read-only graph surface is live at `/graph` (nav-linked). *(Marked done retroactively 2026-07-27, deep-review sweep D-106.)* | D-054 · lexicon |
| B6 | **`shared` visibility tier + the whole guest layer** (incl. publish preview shipping) | sharing phase | §2a |
| B7 | **pdf · audio bit types** (+ their metadata-title faces) | ✅ **FIRED BY OWNER 2026-07-25** — voice memos + PDFs are v1 (Plan C: the media-types migration round — two new types + face/substance/search branches + **search-by-source**, absorbed from the capture plan's deferred list). Plan written fresh at its start | §2a / §2b |
| B8 | **Handwriting recognition** — strokes stored as vectors, "recognition-ready someday" | someday | §2a |
| B9 | **Connections — gather + the reference graph.** ✅ **HALF-FIRED BY OWNER 2026-07-25 — the split the owner actually meant:** yesterday's "retire graph view" had parked *both* halves; the owner clarified they want the **linking**. **Gather (stages 1–4: `[[` · `reference` rows · "gathered into") returns to v1 as Plan B**, per the resumption procedure in `connections-review-and-resumption-notes.md`. **The graph *picture* (stage 5) stays parked** — its one open decision (layers vs swap) waits with it | graph picture: the owner's word. Everything else: in v1 now | D-098 · §6 |

## C. Build-level treats (real, not next — D-053)

| # | thing | note | source |
|---|---|---|---|
| C1 | **Crop** (non-destructive) | needs an owner call: small dep (`react-easy-crop`) vs hand-built | D-016 / D-043 |
| C2 | ~~**HEIC support + unreadable-image message**~~ | ✅ **DONE (2026-07-23, D-091).** HEIC now converts client-side via `heic-to` (modern libheif) with a "Converting your photo…" notice; the one-line message survives as the fallback. Root cause of the old failure: `heic2any` bundled an ancient libheif that threw `ERR_LIBHEIF format not supported` on ordinary iPhone HEVC HEICs — proven on the owner's real file, then proven fixed on it. | PROGRESS |
| C3 | ~~**Rich-text formatting UI** (bubble menu; headings/bold/lists)~~ | ✅ **DONE (2026-07-26, D-103 Stage 1)** — a quiet toolbar (bold · italic · lists · quote · link) on every text bit, one typeface kept | D-046 · D-103 |
| C4 | **Rotation** | cut from v1 (no approved lib) | D-023 |
| C5 | **Wrap-box / text flowing around shapes** | the parked dream | D-044 · §6b |
| C6 | ~~**Infinite canvas camera** (pan/zoom)~~ | ✅ **DONE (2026-07-22)** — camera over an endless world, `screenToWorld()` centralized, `⊹ fit` (D-090). *(Marked done retroactively 2026-07-27, deep-review sweep D-106.)* | D-048 · D-090 |
| C7 | ~~**Pen types / colors**~~ | ✅ **DONE (2026-07-25, D-099)** — per-stroke **color** (natural palette: ink · indigo · cerulean · forest · terracotta · ochre) + wider **size** range (extra-fine → extra-bold) + **eraser** (undo + drag-to-rub-out). Stored in the drawing jsonb (additive; old doodles default to ink; `normalizeDrawing` reads all shapes). | PROGRESS |
| C8 | **JSON Canvas export** (interop) | optional idea from research | research-canvas.md |
| C9 | **Handwritten board title — where the hand lives** | flagged at Checkpoint A (2026-07-21): "my hand on top, the typed shadow beneath" (§5) ruled the *look*, never the storage. Default lean: an ordinary drawing bit placed on the board (zero schema); a dedicated slot is additive if the port finds that wanting. Decide at the port, by feel | §5 · deliberations (D-083 feedback round) |
| A24 | **ARCHIVE — "the possibility for archiving and deletion for anything that is a unit"** (owner's ask, 2026-08-28). Built ahead of its ruling, audited, and **sent back**: the migration (`20260828000001_archive.sql`) is written and throwaway-proven 8/8 but **applied to no cloud**; the UI is reverted off the working branch. Nothing shipped | **Re-enter when the owner answers the three questions the audits isolated:** (1) **which surfaces** does a put-away thing leave? `world` has five (the pull · find · home · boards · the graph) — this is the ⚠ I-T4 question, and it must be settled first because it is the root cause, not a detail. (2) **What happens to a container's contents** when the container is put away? Following the trash precedent floods the loose pile; not following it strands the contents (see the deliberation). (3) **Is it reversible** — does the star come back? Trash→restore keeps it; archive→unarchive currently destroys it. *Then* the word gets ruled ("archive" is software-speak; "put away" was Claude's and was rejected by the owner), and only then the code | deliberations (the archive round) · invariants ⚠ I-T4 · `verification/archive-proofs.sql` · D-128 |

## D. Rejected outright — listed so they're never re-proposed as "ideas"

**Capture location** · **a favorites/star field** (significance = tagging) · **link labels/flavors** · **auto-chunking of pasted text** (→ §2e) · **an include-trashed toggle on the pull** (the trash listing serves it — §4) · **optimistic-concurrency merge UI** (cheap to detect, expensive to answer — §2d) · **auto-filled boards from tags** (rejected *for now*, "maybe one day" — no named re-entry; D-060) · **a title/subject split in content** (→ A10 is the only gate back — §2f).
