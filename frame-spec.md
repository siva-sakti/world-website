# The frame — a board with a fixed size

**Status: 🟡 goals ruled by the owner; the architecture derived from them, step by step,
not yet complete. Nothing built.** Started 2026-09-05. The earlier `frame-plan.md` (a rectangle
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
| **2 · What each requirement touches** | for every requirement: which existing mechanism (from `foundations-pass.md` §2) does it touch, and is that mechanism *compatible*, *needs a change*, or *conflicts*? | Claude | a requirement × mechanism grid |
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
| R5 | The frame **is** the plane: its top-left is (0, 0); **nothing exists outside it**; a card cannot leave it. | ✅ |
| R6 | You can **zoom in, but not infinitely** — "like what you can print out and see." The whole frame fits the view by default. | ✅ |
| R7 | **Copying bits from one frame to another keeps their pixel position** — paste onto a landscape frame what was on a portrait one and it lands at the same coordinates. | ✅ 2026-09-05 |
| R8 | The frame's size is stored in **screen pixels** (1 px = 1/96 in); print and export scale at output. | 🔵 Claude's proposal from the research |
| R9 | Everything a canvas board can do, a frame board can do — modes, cards, arrange, edit — except pan past its edges and zoom past its bounds. | 🔵 implied by R1; stated so it is checkable |

⚪ **Still open from the research, not blocking step 2:** what "100%" means on a frame · whether
a frame's size can change after creation.

---

## 2 · What each requirement touches *(step 2 — the grid)*

*(To be filled next. For each requirement, every mechanism it touches, marked compatible ·
change · conflict. The mechanisms are `foundations-pass.md` §2's list; the coordinate system,
how things arrive, the copy rule and the camera are the obvious four — the grid finds the
non-obvious ones.)*
