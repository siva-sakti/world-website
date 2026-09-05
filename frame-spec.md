# The frame — a board with a fixed size

**Status: 🟡 goals ruled by the owner; the architecture derived from them, step by step,
not yet complete. Nothing built.** Started 2026-09-05. The earlier `old/frame-plan.md` (a rectangle
placed on a canvas — the wrong model) is archived in `old/` and is not an input to this.

**One word, used one way:** **frame** = a board with a fixed size. Not "page," not "notebook
page" — Claude used those loosely and the owner rightly asked whether they meant the same thing.
They did. From here: *frame*.

---

## 0 · The method — from goals to "the code needs to look like this" *(the owner's ask)*

> *"What's the way for us to notice what could be an important feature so that we're able to
> make the best choice technically — not hashing everything out at the lowest detail, but
> getting to the point where we're like: okay, we understand the codebase needs to look like
> this because these are our goals for the views, and then the camera's got to do this."*

Six steps. **Each step is finished before the next starts, and the owner checks the output of
1, 3 and 5.** No step goes to the lowest detail until step 6, and step 6 only does it for the
first thing to build.

| step | what | who | output |
|---|---|---|---|
| **1 · Goals as requirements** | each conceptual goal restated as one short sentence that could in principle be checked | owner rules, Claude words | a numbered list |
| **2 · What each requirement touches** | for every requirement: which existing mechanism (from `whats-built-and-how-solid.md` §2) does it touch, and is that mechanism *compatible*, *needs a change*, or *conflicts*? | Claude | a requirement × mechanism grid |
| **3 · The deltas** | from the grid: the complete list of what the code must know or do that it does not today. This is *"the codebase needs to look like this."* | Claude; owner checks | the delta list |
| **4 · Cluster and sequence** | group deltas by the component they hit; order by dependency — what must exist before what | Claude | the build order |
| **5 · Antagonist** | on the deltas and the order: what requirement has no delta (missed), what delta serves no requirement (invented), what seam with the other lanes | agent; Claude verifies | fold-in |
| **6 · Detail the first step only** | files, tests, migration — for the first cluster. The rest stays at delta level until its turn | Claude | the first build |

**Why this order finds the important features:** step 2 is the probing principle *"check the
seams with what is coming"* run in reverse — instead of asking a mechanism what planned work
touches it, you ask a goal what mechanisms it touches. Every touch is a place the code changes
or a place the goal conflicts with something already decided. **A feature that would matter
shows up as a delta that surprises you in step 3.** The copy-paste-between-frames requirement
below is one: it looks small and it touches the copy rule.

**And what "not the lowest detail" means concretely:** steps 1–5 never name a file. Step 3 says
*"the camera needs edges"* — not *"`use-camera.ts` line 112."* The file level is step 6, and
only for the thing being built next.

---

## 1 · Goals as requirements *(step 1 — owner-ruled unless marked 🔵)*

| # | requirement | ruled |
|---|---|---|
| R1 | A board is **either** a canvas (no edges) **or** a frame (a fixed size). Chosen when the board is made. | ✅ 2026-09-04/05 |
| R2 | A frame's size is one of: **US Letter · A4 · square · a custom pixel size.** | ✅ |
| R3 | **US Letter is the default.** | ✅ 2026-09-05 |
| R4 | **Landscape and portrait are separate sizes**, not a rotation of one. *(Owner: reorienting what is already on the page — what gets cut off — "sounds like a user's problem" to avoid.)* | ✅ 2026-09-05 |
| R5 | The frame **is** the plane: its top-left is (0, 0); **nothing exists outside it**. A card may **overhang an edge — clipped at it, like print bleed** — but can never be dragged fully outside (it would vanish). | ✅ · overhang-clipped ruled 2026-09-05 |
| R6 | You can **zoom in, but not infinitely** — "like what you can print out and see." The whole frame fits the view by default. | ✅ |
| R7 | **Copying bits from one frame to another keeps their pixel position** — paste onto a landscape frame what was on a portrait one and it lands at the same coordinates. | ✅ 2026-09-05 |
| R8 | The frame's size is stored in **screen pixels** (1 px = 1/96 in); print and export scale at output. | 🔵 Claude's proposal from the research |
| R9 | Everything a canvas board can do, a frame board can do — modes, cards, arrange, edit — except pan past its edges and zoom past its bounds. | 🔵 implied by R1; stated so it is checkable |
| R10 | **Fit = the whole page** — fit always shows the entire page, edges visible, the way a PDF viewer fits a page. (On canvas, fit frames the cards; on a frame, the page IS the thing you compose against.) | ✅ 2026-09-05 |
| R11 | **100% = true print size**: the page at its real physical size on a standard screen (1 in = 96 px; Letter reads 816 px wide). Zooming to 100% ≈ holding the printed page. Confirms R8's pixel storage. | ✅ 2026-09-05 |

⚪ **Still open, not blocking step 2:** whether a frame's size can change after creation.
*(What "100%" means — ruled, R11, 2026-09-05.)*

---

## 2 · What each requirement touches *(step 2 — the grid)*

*(To be filled next. For each requirement, every mechanism it touches, marked compatible ·
change · conflict. The mechanisms are `whats-built-and-how-solid.md` §2's list; the coordinate system,
how things arrive, the copy rule and the camera are the obvious four — the grid finds the
non-obvious ones.)*

---

## 1a · The research behind R2/R6/R8 *(carried from `old/frame-plan.md` — evidence, not just conclusions)*

**Paper sizes in screen pixels** ✅ verified *(1 CSS px = 1/96 inch, the web standard)*:
**US Letter** 816 × 1054 px *(2551 × 3295 at 300 dpi print)* · **A4** 794 × 1123 px *(2480 ×
3508)* · square: 1080 × 1080 is the common social size *(⚠ unverified, widely used)*.

**Zoom on a fixed document, in the tools the owner named:** **Photoshop** ✅ up to 12,800%
(one source: 3,200%; version-dependent) because it edits *pixels*; shows a **grey pasteboard
around the document — a visual margin, not a place to put things**. **Canva** ✅ presets
50 · 75 · 100 · 200% + Fit; zoom never changes the design. ⚠ Canva's hard limits were not found
— not assumed. 🔵 Hence R6's shape: Fit as the floor and default, modest ceiling (~400%) — a
frame is composed and read, not retouched.

*(Sources are linked in the archived plan's banner. Rule restated: an archived document
preserves history; anything still LOAD-BEARING must live in the current one.)*

## 1b · The layer map — canvas and frame through every layer *(the sensibility check)*

**The claim this map exists to check:** *one coordinate system, one camera, one render path —
the frame only adds bounds.* If any row's frame column needs more than a bound or a flag, the
approach is wrong and we want to know at this level, not in code.

Nine layers, storage to screen. Every claim verified against the code 2026-09-05.

| layer | what it does | canvas today | **frame delta** | code | doc |
|---|---|---|---|---|---|
| **1 storage** | what is remembered | `placement.x/y/w/h/z/angle` (px) · `board` row | `board.kind` + a size (`frame_w/h`) — **one migration** | migrations · `placement-fields.ts` | `SPEC.md` §2 |
| **2 read** | rows → the page | `getBoard` + `getBoardCards` (the render rule) | reads two more columns — **compatible** | `db/boards.ts` · `page.tsx` · `board_cards` view | `SPEC.md` §2 |
| **3 the plane** | positions mean something | absolute px, origin (0,0), no edges | **edges at (0,0)–(w,h)** — same numbers, bounded | `geometry.ts` · `placement-fields.ts` | `SPEC.md` §2z ✅ |
| **4 the camera** | which part you see | `{x, y, scale}` · zoom 0.2–3 · pan unbounded · per-device memory | **pan clamped to frame+margin · zoom floor = fit** — two clamps in one place | `use-camera.ts` · `camera-storage.ts` (tested) | §2z ✅ |
| **5 render** | the plane → pixels | one CSS transform: `translate(cam) scale(cam)`; cards absolutely positioned inside | draw the page edge + grey margin; **the card's selection chrome (resize dots · rotate anchor) must render OUTSIDE the clip plane** — R5's overhang-clip would otherwise clip an overhung corner's handles with the card (agent catch 2026-09-05; lands with the card split, D-148) | `board-surface.tsx:531` · `card.tsx` · `globals.css` | — |
| **6 input** | gestures → intents | pointer (pan · marquee · tap) · card drag · keys | drag/nudge **clamped at the edges**; everything else unchanged | `use-board-pointer.ts` · `use-card-drag.ts` · `use-board-keys.ts` | modes spec §3 |
| **7 measure** | real rendered sizes | the geometry ledger | **unchanged** | `use-geometry.ts` | — |
| **8 arrange maths** | snap · align · tidy · clear spots | pure, tested | **unchanged** (already bounded by inputs) — ⚠ except `firstClearSpot`, which must not propose a spot outside the frame | `board-arrange.ts` · `geometry.ts` | — |
| **9 persist** | changes → storage | the write queue | **unchanged** | `write-queue.ts` · `use-persistence.ts` · `db/bits.ts` | `SPEC.md` |

**Reading the map:** the frame touches **1 (two columns), 3–4 (bounds), 5 (a drawing), 6 (a
clamp), 8 (one function)** — and leaves 2, 7, 9 untouched. **Five deltas, all of them bounds or
flags. The claim holds at this level.** R7 (paste keeps pixel position) rides on layer 3 being
identical in both kinds — which is the whole point of "same coordinates, bounded."

### How we check sensibility, at each altitude
- **High level (now):** the map above — every layer named, every frame cell filled. **A blank
  cell is an unexamined layer.** None is blank.
- **Mid level (step 2–3 of §0):** the requirement × mechanism grid. Every R touches ≥1 layer;
  every delta traces to an R. A delta with no R was invented; an R with no delta was missed.
- **Low level (step 6, per build):** the pure layers (3, 4, 8) get tests before the visual ones
  are touched — the camera clamps and the edge-clamped drag are provable the way `screenToPlane`
  was, by maths, before anything is on a screen.
- **Always:** the antagonist at step 5, and the owner's eye on the result — the two checks that
  have caught what the others missed all week.

### Where everything lives *(the owner asked — one place to look)*

**Documents:** `frame-spec.md` (this — goals · method · layers) · `whats-built-and-how-solid.md` (the 63
mechanisms · walkthroughs · ledger · probing principles) · `SPEC.md` §2z (the plane + camera,
written yesterday) · `board-modes-spec.md` (arrange/edit) · `board-what-you-can-do.md` (every
act) · `bits-and-boards-code-map.md` (file health) · archived: `old/frame-plan.md`.

**Code, by layer:** the table above's code column is complete — thirteen files, and layers 3, 4,
7, 8 are the tested pure core (63 of this suite's 217 tests).

