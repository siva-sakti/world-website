# The Plan (High-Level)

*The consolidated, evaluatable plan — objective, constraints, model, approach, build order, open questions. Sits between `draft-philosophy.md` (the **why**) and `SPEC.md` (the detailed **what**); `draft-map.md` tracks per-item status. Living draft.*

## Objective

A private, spatial notebook that **holds the flood of what you consume and think, and turns it into something you return to and grow** — instead of a flat pile you never reopen. It unites the **spatial freedom + doodle of paper**, the **memory / search / links of digital** (Obsidian), and enough **visual pleasure that you actually come back** (Pinterest / Tumblr). Built for how your brain works — visual, spatial, non-linear. A place to *think*, not a product. (Full why: `draft-philosophy.md`.)

## Constraints

- **Single writer** (you). A **read-only key** for trusted friends may come later. Multi-user / product is a *possible future, not designed out* — the auth model already leans that way; we don't build for it now.
- **Web app / PWA**, hosted at your public domain, **login-gated**, installable on phone + desktop. **No native app** — a default, contestable only if the web pen genuinely falls short.
- **Devices:** **phone = capture + browse** (not compose — too small). **Compose = the Daylight (touch, landscape) or a desktop.** Landscape-only; ignore portrait.
- **Not:** AI features, analytics, collaboration, a public product, or a full drawing app.
- **Tech:** Next.js + Supabase (Postgres / Storage / Auth) + Tailwind (layout only) + pre-approved libs: dnd-kit, react-rnd, tiptap, pdf.js, zod, perfect-freehand (pen candidate). New deps need approval.
- **Design:** quiet, white, fast — the app makes **no aesthetic decisions** *except the presentation of the browse/feed surface*, which must be designed to feel good (image-forward, density, rhythm) or "returning" fails. Beauty otherwise comes from your content. One typeface.
- **Data:** private by default; security at the **database** (RLS); **soft-delete + automated export/backup** so nothing is ever truly lost.
- **Capture is instant and mobile; composing is deliberate and on a big touch/mouse screen.**

## The model

*Provisional naming: **fragment** / **board** (your words). Code still says `bit` / `canvas`; rename pending.*

| Term | What it is |
|---|---|
| **Fragment** | The atom: a small unit you *consumed or thought* — text, image, doodle, audio, link, or PDF. **Lives on its own in a browsable grid; needs no board.** Tagged; optionally has a *kind*. Can be pulled onto boards (zero, one, or many). |
| **Board** | A place to gather and think. **Two modes, same board:** *collection* (a grouped set of fragments, no spatial layout — quick, works anywhere) → *canvas* (those fragments given positions, dragged and arranged spatially — the sit-down act). Has a *stage*. |
| **Placement** | A fragment on a board. Its position is **optional** (unplaced = collection mode; placed = canvas mode). Live reference, not a copy. |
| **Topical tag** | What a thing is *about*. **Open, growable vocabulary; a linkable topic-node** — each topic is a page collecting everything about it (Obsidian-style backlinks, but tap-from-picker, no `[[ ]]` syntax). Many per fragment. |
| **Kind** *(categorization)* | A fragment's *nature*: learned · noticed · wondered · theorized. Fixed set, one per fragment, **optional**, set while tending. |
| **Stage** *(categorization)* | A board's *maturity*, ordered, ~3–4 steps. Drives "which boards want tending." |
| **Link / Graph** | Topical tags *are* the main connective web (the graph = the topical web; a topic-page is the killer "everything about this" view). Explicit fragment→fragment links are a later maybe. |
| **Pull / grid** | Filter by a tag → a designed grid of fragment previews (order can be random, not just chrono). |

## Surfaces

- **Capture** — instant add of a bare fragment (text + photo), optional quick tags. Phone-first; offline-tolerant.
- **Fragment grid + home** — a *designed* browse surface + a few **random old fragments** on home (the return loop).
- **Fragment detail** — view / edit / **trash (soft-delete)** + backlinks (its boards, its topics).
- **Board** — collection mode → canvas mode (compose).
- **Boards by stage / tending** — so stage actually does something.
- **Topic page** — everything about a topical tag.
- **Tag manager** — create / rename / merge / delete.
- **Privacy tiers · Export · Graph (later, scoped) · Login.**

## Approach

- **Build capture-first** (see sequence) — the daily loop before the sit-down pleasure.
- **Assembling = model B:** manual discrete boxes (text / image / doodle), drag / resize, **no rotation in v1** (no approved lib does it). Touch + mouse, landscape. Placement is on you; the tool assists (aspect-locked resize, in-place non-destructive crop, optional snapping).
- **Media:** import auto-sizes (cap long edge, keep aspect); crop in place, non-destructively. **Transparency, not crop, makes doodles look nice** (prefer transparent PNG, else knock out white).
- **Doodles / pen:** import PNG for v1; a **one-day pen-feel spike on the Daylight** before betting on it; a light calligraphic pen (perfect-freehand) post-v1. The brush carries quality; latency is the only native gap and matters least for deliberate strokes.
- **Tagging:** optional and fast at capture (never required); refine while tending. Vocabulary **grows** (creating a tag is a deliberate act).
- **Data safety:** soft-delete + automated export/backup from day one of real data.

## Build sequence (capture-first)

1. **Foundation** (scaffolded locally) **+ cloud Supabase + deploy** — so a phone can reach it. *Critical path.*
2. **Capture loop** — deployed PWA; bare-fragment capture (text + photo); iOS **Shortcut → endpoint** (Web Share Target is absent on iOS); **offline outbox**.
3. **Browse + resurface** — designed fragment grid + random-old-fragments on home.
4. **Fragment detail + edit + soft-delete + backlinks + automated export/backup.**
5. **Tagging** — tap-existing + create-new; topic-pages; `kind` optional; tag-filter on the grid.
6. **Pen spike → Boards** — collection mode, then canvas (model B, touch/landscape).
7. **Stage + boards-by-stage / tending view.**
8. **Privacy tiers.**
9. **Later / maybe** — scoped graph; in-app pen; audio/pdf; wrap-box.

## Decisions locked

- **Fragment is the atom; placement-optional.** Capture makes a *bare* fragment; nothing is forced onto a board. (Supersedes "everything is a canvas.")
- **Boards are two-mode:** collection → canvas.
- **Two tag roles:** topical tags = open, linkable topic-nodes; kind (fragments) + stage (boards) = fixed categorization.
- **Capture-first build order.** Tagging optional at capture.
- **Data safety** (trash + auto-export) is in the plan, from day one of real data.
- **Daylight is a first-class compose device** (touch, landscape). Rotation cut from v1. Graph demoted to later/scoped.
- Single-user now, product not designed out. Private by default; RLS the boundary; export always.

## Open questions

- **Ingestion specifics** — the exact iOS capture path (Shortcut vs email-in vs paste) to try first.
- **Naming** — adopt fragment/board (rename code)?
- **Stage** — how many steps, named or numbered? **Kind** — set fixed at those four?
- **Schema gap** — `kind`/`stage` aren't in the applied migration yet (written during the "no attributes" phase); needs a new migration.
