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
| A1 | **Document mode** — a board rendered as a vertical text-first flow | the text-forward want shows up in real use; entry gate = the pre-designed checklist (split/merge semantics · bit-birth-at-enter · mode permanence) | §6b |
| A2 | **The pairwise link** — a direct bit↔bit tie (the dormant table) | the first real miss: standing on a bit, another belongs with it, no shared tag feels true, no board feels warranted (symptoms: a board-of-two, a single-use tag) → built that week, small + symmetric | §6 |
| A3 | **Contextual bit-privacy** — born in a private board → born private | publish previews prove tedious in real use | §2a |
| A4 | **Guest-pull scope** — "open to them" = globally-public vs share-scoped | decide when sharing is real; principle already ruled (a tag opens nothing) | §4 |
| A5 | **Board-side history** — "everything ever placed here" | the first time you stand on a board wondering what left it | §5 / I-T6 |
| A6 | **Loose-bits drawer** — a "not on any board" filter in find | if wanted; the reachability floor (the ledger) doesn't need it | §7 |
| A7 | **Visit-by-visit travel timeline** — full entry/exit log per board | additive later; v1 keeps the durable membership row only (last departure overwritten on re-place) | §2c |
| A8 | **Multi-home categories** — one tag word in 2+ categories | if one-home-per-tag ever genuinely blocks | §3b |
| A9 | **`stage` / ordered board maturity** | if genuinely missed; meanwhile maturity rides ordinary tags (`#seed`, `#fruit`) | §5 / D-070 |
| A10 | **Optional title on text bits** | ✅ **RE-ENTRY FIRED BY OWNER DECISION 2026-07-22 (D-087)** — ruled in ahead of the evidence trigger. Owner chose to enable the optional title (blank-default, first-line-stands-in, nothing forced); unlocks owner-writes to `content` on text bits; the column already exists, so it's a switch — **built at the port.** *(Prior evidence log: the owner reached for a bit-title 4× across the Checkpoint-B conversations 2026-07-20→22; the gate was designed to fire on real-use display, but the owner exercised their authority to rule it in directly.)* See agreements §2f. | §2f / §2b |
| A11 | **Edit history / versions** | if silent last-arrival-wins ever bites in real life; the `updated_at` it needs already exists | §2d |
| A12 | **Crash-guard draft** — device-local editor restore after a crash | additive anytime; must restore *into the editor* only — never auto-replay to the DB (I-D3) | §2h |
| A13 | **Dedicated speak-button** for dictation | only if the keyboard-mic two-tap path proves slow | §2b |
| A14 | **Video as a stored type** — v1+ answer: video = a *reference* (bookmark to Drive/YouTube; the owner's own want, D-079/S1). Storing files means real infrastructure: transcoding for cross-browser playback (iPhone HEVC won't play in Chrome/Daylight), 100MB–1GB files, bandwidth cost | the day a video feels like a *bit* — something to place, tag, grow on a board rather than point at — or a linked video dies and it hurts. Additive when it fires: a `video` type = the same two-halves storage as images, no rework | D-079 · §2a |

## B. Phase-scheduled promises — deferred by choice to a named phase (re-blessed by the owner)

| # | thing | where it lands | source |
|---|---|---|---|
| B1 | **Phone capture loop** — instant capture, offline outbox (births-only), iOS Shortcut; `serwist` dep needs approval | Phase 5 | ROADMAP · audit #12 · §2h |
| B2 | **PWA install** ("feels like *my* app") — a philosophy promise, deferred eyes-open | Phase 5 | audit F8 |
| B3 | **The feed** — browse/resurface, random-old, image-forward. ⚠ the one surface that must be *deliberately designed* ("or returning fails") | Phase 6 | §5a · CLAUDE.md design stance |
| B4 | **Doodled home** — a hand-made home board | build-it-yourself anytime; it's just another board | §5a |
| B5 | **The graph view** — local-neighborhood first; `react-force-graph` needs dep approval | Phase 3 | D-054 · lexicon |
| B6 | **`shared` visibility tier + the whole guest layer** (incl. publish preview shipping) | sharing phase | §2a |
| B7 | **pdf · audio bit types** (+ their metadata-title faces) | later | §2a / §2b |
| B8 | **Handwriting recognition** — strokes stored as vectors, "recognition-ready someday" | someday | §2a |
| B9 | **Connections — gather + the reference graph** ("pull a bit into a thought" via `[[` · stored `reference` rows · "gathered into" surface · graph rebuilt on deliberate ties). **Parked 2026-07-24 (D-098) pre-revision** — plan drafted (`connections-build-plan.md`), fully reviewed, NOT built; **§6 stands unmodified**, the dormant ninth still sleeps. Owner intent on record: *"I do want this for sure"* + ruled **graph = read-only v1** | **the owner's word** (want-driven, not evidence-gated). Resumption procedure + all findings/questions: `connections-review-and-resumption-notes.md` — resume THERE, not from the plan alone | D-098 · §6 |

## C. Build-level treats (real, not next — D-053)

| # | thing | note | source |
|---|---|---|---|
| C1 | **Crop** (non-destructive) | needs an owner call: small dep (`react-easy-crop`) vs hand-built | D-016 / D-043 |
| C2 | ~~**HEIC support + unreadable-image message**~~ | ✅ **DONE (2026-07-23, D-091).** HEIC now converts client-side via `heic-to` (modern libheif) with a "Converting your photo…" notice; the one-line message survives as the fallback. Root cause of the old failure: `heic2any` bundled an ancient libheif that threw `ERR_LIBHEIF format not supported` on ordinary iPhone HEVC HEICs — proven on the owner's real file, then proven fixed on it. | PROGRESS |
| C3 | **Rich-text formatting UI** (bubble menu; headings/bold/lists) | multi-*font* tension with the one-typeface stance = owner's explicit call | D-046 |
| C4 | **Rotation** | cut from v1 (no approved lib) | D-023 |
| C5 | **Wrap-box / text flowing around shapes** | the parked dream | D-044 · §6b |
| C6 | **Infinite canvas camera** (pan/zoom) | additive wrapper; `screenToWorld()` centralization when it lands | D-048 |
| C7 | ~~**Pen types / colors**~~ | ✅ **DONE (2026-07-25, D-099)** — per-stroke **color** (natural palette: ink · indigo · cerulean · forest · terracotta · ochre) + wider **size** range (extra-fine → extra-bold) + **eraser** (undo + drag-to-rub-out). Stored in the drawing jsonb (additive; old doodles default to ink; `normalizeDrawing` reads all shapes). | PROGRESS |
| C8 | **JSON Canvas export** (interop) | optional idea from research | research-canvas.md |
| C9 | **Handwritten board title — where the hand lives** | flagged at Checkpoint A (2026-07-21): "my hand on top, the typed shadow beneath" (§5) ruled the *look*, never the storage. Default lean: an ordinary drawing bit placed on the board (zero schema); a dedicated slot is additive if the port finds that wanting. Decide at the port, by feel | §5 · deliberations (D-083 feedback round) |

## D. Rejected outright — listed so they're never re-proposed as "ideas"

**Capture location** · **a favorites/star field** (significance = tagging) · **link labels/flavors** · **auto-chunking of pasted text** (→ §2e) · **an include-trashed toggle on the pull** (the trash listing serves it — §4) · **optimistic-concurrency merge UI** (cheap to detect, expensive to answer — §2d) · **auto-filled boards from tags** (rejected *for now*, "maybe one day" — no named re-entry; D-060) · **a title/subject split in content** (→ A10 is the only gate back — §2f).
