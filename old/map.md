# Design Map

The methodical tracker of every **Element** (noun/data), **Surface** (screen), and **Flow** (journey) — each with a status and its open questions. This is the working board we drive design from.

**Process (the loop):**
1. Pick the top 🔴/🟡 item.
2. Talk it to resolution — options → decision.
3. Record the decision (here + in the relevant doc: philosophy / high-level / SPEC, and the `PROGRESS.md` decisions log).
4. Flip its status to 🟢.
5. Next.

**Status:** 🟢 settled · 🟡 partly settled · 🔴 open. Resolutions flow *out* of here into `SPEC.md` / `highlevel.md`.

---

## Elements (nouns / data)

| Element | What it is | Status | Open questions |
|---|---|---|---|
| **Fragment** | the atom: text or a picture; something consumed *or* thought | 🟢 | naming: keep `bit` or rename → `fragment`? |
| **Board** | a spatial workspace where you think / arrange / compose | 🟢 | naming: keep `canvas` or rename → `board`? |
| **Placement** | a fragment positioned on a board (live reference, not a copy) | 🟢 | — |
| **Topical tag** | what a thing is *about* (astrology, jupiter). Open vocabulary, **many** per fragment | 🟢 | — |
| **Kind** (attribute) | nature / relationship-to-reality: learned · noticed · wondered · theorized. On **fragments**, **one** each | 🟡 | is the set fixed at these 4? strictly single-value? |
| **Stage** (attribute) | maturity. On **boards**, **ordered** | 🟡 | how many (3–4)? named or numbered? |
| **Link** | explicit connection: fragment→fragment, board→board | 🔴 | what may link to what; how backlinks surface |
| **Graph** | the web of links + placements + shared tags | 🔴 | how central; when built |

## Surfaces (screens)

| Surface | What it is | Status | Open questions |
|---|---|---|---|
| **Doodled home** | hand-drawn index page; elements link to boards | 🟡 | it's just a board used as an index; not built |
| **Fragment grid** | browse all fragments; order can be random, not just chrono | 🔴 | not built; how you pull one onto a board |
| **Board (workspace)** | where you assemble & think | 🟡 | model decided; build the drag/resize interaction next (dnd-kit + react-rnd), DB-gated |
| **Pull / tag view** | filter by tag → grid of fragment previews | 🟡 | basic version built |
| **Single fragment** | view/edit a fragment + its backlinks | 🔴 | not built |
| **Capture** | fast add-in | 🔴 | tied to the ingestion flow |
| **Login / auth** | single-owner sign-in | 🟢 | built |
| **Tag manager** | rename / merge / delete tags | 🔴 | not built |
| **Graph view** | wander the connections | 🔴 | not built |
| **Export** | download everything | 🟡 | spec'd, not built |

## Flows (journeys)

| Flow | What happens | Status | Open questions |
|---|---|---|---|
| **Ingestion / capture** | how the flood gets *in* | 🔴 | **big gap** — share-sheet? screenshot import? paste-a-link? dictate? |
| **Assemble a page** | build a board into a beautiful layout | 🟡 | model decided (see log). Remaining: snapping/guides or pure free-drag? overlap + rotate? |
| **Tagging** | tap topical tags; set kind / stage | 🟡 | taxonomy settled; the picker UI/behavior TBD |
| **Linking** | fragment↔fragment, board↔board; backlinks | 🔴 | full design pass needed |
| **Revisiting / tending** | come back to things and grow them | 🟡 | **live tension** — active tending (watering-can) vs passive browse |
| **Pull fragment → board** | from the grid, place a fragment onto a board | 🔴 | not built |
| **Publish / share** | private → shared (key) → public | 🟡 | tiers deferred to later phase |
| **Export** | download all data + files | 🟡 | spec'd |

---

## Resolved this pass (log)

- Feeling = a fragment (text or picture). No special type.
- Tag taxonomy: topical (open, many) is distinct from kind/stage (fixed, single-value attributes).
- No third "piece" primitive — a piece is a board used for composition.
- The portfolio → impact pipeline is personal motivation, **not** an app feature.
- **Assemble a page = collage of manually-placed discrete boxes (model B).** Each text block wraps inside its own box (plain DOM, no special engine). Placement is manual ("it's on me"), with drag/resize. A **wrap-around-a-doodle text box (model A)** is a *later, occasional* special box type — **pretext** is the candidate tool for that one feature, **not** a v1 dependency.

### Replan pass (external review → reconciled). Authoritative plan now lives in `highlevel.md`; decisions in `PROGRESS.md` (D-017…D-024).

- **Build order is now CAPTURE-FIRST** (was compose-first): foundation → cloud deploy → capture → browse+resurface → data safety → tagging → compose. Ingestion & revisiting move to the front; graph demoted.
- **Fragment is the atom, placement-optional** — capture makes a bare fragment; nothing is forced onto a board. (Ontology conflict resolved; SPEC §0/§5 fixed.)
- **Boards are two-mode:** collection (quick, any device) → canvas (spatial, sit-down).
- **Two tag roles:** topical = open linkable topic-nodes (the graph/backlink web); kind (fragments) + stage (boards) = fixed categorization. `kind`/`stage` still need a new migration.
- **Data safety** (trash + auto-export) added; **Daylight = compose device** (touch, landscape); **rotation cut** from v1; **capture tagging optional**; resurface (random old fragments) pulled into v1.

### Feasibility pass (second review). Capture flow is now *designed*, not a bullet: see SPEC §4b (token auth, direct-to-storage uploads, honest offline guarantee, latency budget) + D-025…D-033.

- **Ingestion / capture: 🔴 → 🟡** — path designed; remaining unknowns resolve in the phase-2 iOS spike.
- **Assemble a page:** drag roles settled (react-rnd on-canvas; dnd-kit tray→board; scale wiring). Phone board view = collection mode.
- Schema amended + re-validated (collection mode representable; `kind`, `deleted_at`, clean FTS). Only `stage` outstanding (boards-phase migration).
- Backup/keep-alive mechanism named (GH Actions nightly). Both spikes scheduled at phase-2 start.
