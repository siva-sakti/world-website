# Aesthetics phase — the consolidation place

**What this is:** the single home for the whole aesthetics phase, so the project stays **cleanly manageable** — one place, latest state visible, no sprawl. It holds six things:
1. **The north star** — what we're going for (§1)
2. **The working method** — how we work on anything aesthetic (§2)
3. **The design ↔ data bridge** — how the *look* and the *stored data / code* fit together (§3)
4. **The system** — the structure we decompose everything into (§4) + the surfaces map (§5)
5. **The procedure** — the order we move in (§6)
6. **The build** — pieces, stages, gates; the roadmap that falls out of the above (§7) + open decisions (§8)

Started 2026-08-01. *(Supersedes the standalone `design-build-plan.md` — folded into §7, original moved to `old/`.)*

---

## STATUS — where we are (update this block every session)
- **Phase:** aesthetics — the **card papers are NAILED** (washi · linen · vellum), owner-approved via rendered studies + her eye. Next: the toolbar / putting the papers into the real card component.
- **Decided:** north star (§1) · working method (§2) · the system (§4–5) · movement order (§6) · **card style = per-card, per-board pickable paper type** (RULED per-board, §3, color × paper).
  - **PAPER RECIPES LOCKED (2026-08-01) — CSS source of truth: `board-study.html`** (built with the borrowed techniques, all cheap/static, tint-ready via a color fill under a color-agnostic texture overlay):
    - **washi** = torn **deckle edge** (baked feTurbulence displacement) + **grain core** (fine fractalNoise, overlay) + **long fibers** (stretched fractalNoise, moderate, multiply) + sparse **flecks** (thresholded turbulence). *Grain = the body; fibers = the visual interest — both, layered (owner's insight).*
    - **linen** = crossed **warp × weft** stretched-noise threads (multiply, ~.26/.24) + fine grain. Woven, not a printed grid.
    - **vellum** = translucent `rgba(...,.30)` + soft `backdrop-filter: blur(3px)`, no texture — you read what's beneath, softened (owner loved it).
  - **CARD DESIGN COMPLETE (2026-08-01, owner-approved).** Beyond the papers:
    - **image on paper** = the image matted on the paper (paper shows as the mat/margin), **centered by default, caption below** on the same card (image + caption = ONE bit, associated). No free-dragging the image inside the card (v1). Separate text near an image = a second bit placed nearby (spatial, not associated).
    - **frames** (a small per-card detail, `card_frame`): **none · paper-mat (default for images) · hairline · polaroid**, with **museum** optional. A frame composes *over* the paper.
    - **size** = drag handles (already built, per-board on placement w/h). **corners** = owned by the paper's edge (torn washi vs clean vellum) — no separate roundness control in v1.
- **Open — need owner:** exact palette + **font** values (studies used Newsreader + Hanken Grotesk — needs confirming as the app faces) (Foundation tokens, §7).
- **Next action:** **PLAN then build** wiring the card into the real app — schema `placement.card_style` + `card_color` + `card_frame` (additive, per §3 gates), the picker UI, and lifting the `board-study.html` CSS recipes into `card.tsx`. Proven on a throwaway DB first, owner-gated to cloud. (Toolbar / board-background are the other open surfaces.)

---

## §1 · The north star (the *what*)
One breath: **Japanese · ethereal · analog — quiet and luminous, with Aesop-clean type**, plus the **artist's-wall** feel. Beauty through *light, color, space, and type* — **not** texture imitation, **not** glassmorphism.
- **Feel:** serene · ethereal · quiet · warm · unhurried · luminous · *ma* (breathing space) · *wabi-sabi* (quiet imperfection) · understated.
- **Not:** glassy · skeuomorphic · corporate · loud · scattered.
- **The crux:** the *feeling* of analog (warm, calm, a little imperfect) **without imitating** it — nothing pretends to be a physical object. *"Feels like a quiet paper studio; isn't a photo of one."*
- **Touchstone:** Aesop (type + text cleanliness). Reference images to come, to calibrate color + light (the soul of it).

## §2 · The working method (the *how we work* — non-negotiable for anything aesthetic)
Claude **cannot reliably see** what it builds — "I think it looks like X" is unreliable, and design is unforgiving. So, more caution by design:
1. **Build off proven work, never invent** — extract *exact* values from real references (hexes, type scales, spacing, the actual techniques) and reproduce faithfully. Precision from provenance.
2. **Specimens before the app** — prototype every look in a small *isolated* page first; iterate cheaply there.
3. **Render → screenshot → owner judges** — Claude screenshots the specimen to catch gross wrongness; the **owner is the final eye** on taste. Loop = build → render → screenshot → owner → iterate. Never "built, done."
4. **One variable at a time, tokenized** — a fixed token set is the single source of truth; change deliberately, no "roughly."
5. **Each stage states HOW it's enacted** (exact CSS technique + values, sourced) *before* building.

## §3 · The design ↔ data bridge (design and code/data, working together)
Every designable property needs a **home** (where it's stored) and an **enactment** (how it's drawn). This is where the look meets the schema:

| Designable thing | Where it's stored | How it's enacted |
|---|---|---|
| **House style** (base type, warm ground, spacing, shadow) | *nothing* — CSS + font files | global CSS + self-hosted `@font-face` |
| **Board background** (color/[surface]) | `board.bg_color` — new column | CSS background on the canvas |
| **Card surface** = paper type × color | `placement.card_style` + `placement.card_color` (per-board) | a color fill + a baked, color-agnostic **texture overlay** (edge mask / grain) that layers over any tint |
| **Card border / frame** | `placement.frame` — new column, default `'none'` | CSS frame styles per card |
| **Per-note font / text size** | **OPEN** — `bit.*` (travels) vs `placement.*` (per-board) vs both (§ decision) | CSS applied to the card's text |
| **Presets** | *nothing* — a UI bundle that *writes the fields above* | picking a preset sets the stored values |
| **Tokens** (palette · type · spacing) | *nothing* — code constants / CSS variables | the single source every component reads |

**The model decision — RULED per-board (owner, 2026-08-01):** a card's look lives on `placement` — the *same content wears a different design on different boards* (two placements = two independent styles, exactly like position already works); a loose/unplaced card shows the **default**. **Card style = a pickable paper type** (`placement.card_style text default 'washi'` — the `display_size` precedent), with all styles polished to genuinely beautiful. *(A note-level default that travels is addable later if ever wanted — no rework.)*
**Sub-question RULED (owner, 2026-08-01):** color **stacks on the paper** — surface = **paper type × color**, two per-board dials (`placement.card_style` + `placement.card_color`). The paper's grain/edge must show *through* the tint (a dusty-blue washi still reads as washi) → the texture is a **color-agnostic overlay** (a see-through layer that "multiplies" over the color fill), NOT baked with a fixed color. Bonus: one baked texture works over *any* color, so tinting is ~free + the performant choice.

**Why this matters:** per-board lives on `placement` (which already holds per-board appearance — x/y/size/`display_size`), so it's the model's natural seam; `display_size text not null default 'full'` is the exact precedent for `frame`. Board color is one clean column. Nothing here touches security (RLS) or the render rule (`the_inbox` reads `deleted_at` + live-placement, never appearance).

## §4 · The system (the structure)
One hierarchy, four levels — the scaffold we decompose *everything* into:
- **Foundation (tokens)** — palette · type · spacing · shadow · motion. *Shared by everything → comes first.*
- **Surface** — a screen (board · card · workspace · home · chrome)
  - **Sub-element** — its parts
    - **Property** — what's designable (color · type · shape · border · shadow…)
      - **State + motion** — rest · hover · selected · editing · dragging → *the feel*

*The scaffold is mechanical/logical; the art is the values we pour into each slot (the words §1, the reference pictures). Motion is just the transition between an element's states — so this structure is what makes animation tractable later.*

## §5 · Surfaces × sub-elements (the creative canvas)
| Surface | Sub-elements | Priority |
|---|---|---|
| **Card** | surface (color/treatment) · border/frame · content (text/image/doodle) · title line · source line · selection handles | primary |
| **Board / canvas** | background · the space (*ma*) · cards · loose panel · toolbars/chrome · empty state | primary |
| **Writing workspace** | page ground · title · body type · formatting toolbar · source/tags | primary |
| **Home** (boards list) | board tiles · titles/covers · layout rhythm · empty state | worth it |
| **Chrome** | nav · tag bar · pickers · buttons | the considered details |
| *(Later)* inbox/panel · the pull · the graph · **the feed** (the one deliberately-designed surface, Phase 6) | — | later |

## §6 · The procedure (how we move)
**Three passes — so it never overwhelms:**
1. **Static at rest** — tokens first, then each sub-element made beautiful at rest.
2. **States** — hover · selected · editing.
3. **Motion / feel** — the transitions (the animation, *eventually*).

**Movement order:** Foundation (tokens) → **Card** → **Board** → Workspace → Home/chrome. Static-first across all, then passes 2–3.
**Every slot** goes through §2: research → tokens → specimen → screenshot → owner's eye → iterate → only then integrate into the app.

## §7 · The build — pieces, stages, gates (the roadmap from the above)
**The spine (the owner's framing):** the work splits into **KNOWN mechanisms** — the controls + storage, aesthetic-*agnostic*, built now — and **TUNABLE values** — palette, font, glow/grain amounts, dialed later against references (config, not code, *no rework*). Build the mechanisms; tune the beauty forever.

**Two things that fall out for free / stay separate:** the **artist's-wall feel** falls *out* of the pieces (framed things + soft shadow + breathing space + warm ground) — no new mechanism. **Full functionality for people** (the solid daily loop + sharing) and the **creative-embed dreams** (song/playlist · audio notes · swatches · board cover) are their **own separate tracks**, reconciled against `parked.md` before any build — not this phase.

**The pieces** (each marks its *tunable* half — the exact values dialed later against references, config not code, no rework):
- **P0 · House style + base type** — *no schema, biggest immediate win.* Self-hosted Aesop-spirit type, warm off-white ground, soft shadows, breathing space.
- **P1 · Board color** — full any-color picker (`board.bg_color`).
- **P2 · Card surface** — per-board color + soft treatment (`placement.surface_color`).
- **P3 · Border/frame** — none · hairline · mat · museum · polaroid, cards **and** images (`placement.frame`). *The artist's-wall lever.*
- **P4 · Presets** — one-tap curated looks (no schema — writes P1–P3 + font).
- **P5 · Fonts pickable + per-note size** — later.

**Stages** (each: `pnpm build` green → deploy → owner feel-test; schema stages proven on a throwaway DB first, then cloud on owner's go):
**A** house style + base type *(no schema)* → **B** board color → **C** card surface → **D** frames → **E** presets → *(later P5)*.

**Model-safety gates (every data-touching stage passes all five):** (1) name invariants — the new fields are per-board appearance like x/y, riding the placement/board lifecycle, surviving un-place→re-place; a loose note shows defaults; nothing existing breaks. (2) trace create·edit·un-place·trash·restore·destroy — no blank cells. (3) lowest layer — nullable/defaulted columns + one db-module setter each. (4) derive don't duplicate — presets write existing fields. (5) prove the flow end-to-end (color on board A unchanged on board B; survives re-place).

## §8 · Open decisions & the tunable half
**To confirm before building:** (1) the color/font model (§3 — per-note-per-board vs both). (2) base font first, per-note font at P5. (3) presets UI-only. (4) exact values = the tunable half, owner's eye against references. (5) stage order A→B→C→D→E.
**The tunable half (the beauty dial):** palette · chosen faces · glow/grain amounts · frame styling · preset recipes · the warm off-white · shadow softness · spacing rhythm — all config, dialed forever against the references, no rework.
