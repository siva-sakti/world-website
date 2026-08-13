# Design build plan — the aesthetic layer (boards + cards)

**Status:** PLANNING (owner ready to plan, 2026-08-01). Not built. Focus: **boards + cards only** (not the feed — that stays the one deliberately-designed surface for Phase 6, B3).

**The north star** (converged 2026-08-01): **Japanese · ethereal · analog — quiet and luminous, with Aesop-clean type**, plus the **artist's-wall** feel. Beauty through *light, color, space, and type* — **not** texture imitation and **not** glassmorphism.
- *Feel:* serene · ethereal · quiet · warm · unhurried · luminous · *ma* (breathing space) · *wabi-sabi* (quiet imperfection).
- *Not:* glassy · skeuomorphic · corporate · loud · scattered.
- *The crux:* the **feeling** of analog (warm, calm, a little imperfect) **without imitating** it — nothing on screen pretends to be a physical object. "Feels like a quiet paper studio; isn't a photo of one."

---

## The spine — known work vs tunable values (the owner's framing)

Whether or not the exact aesthetic is nailed, the work splits in two, and this plan builds only the first half now:

- **KNOWN — build the *mechanism* now.** The controls + storage + rendering. Aesthetic-*agnostic*: a "pick a card color" control is the same code whether the perfect color is clay or indigo.
- **TUNABLE — dial the *values* later.** The exact palette, the chosen font, glow/grain amounts, the preset looks. These are **config, not code** — plugged in continuously against the owner's reference images, with **no rework**.

So: build the mechanisms, tune the beauty forever after. Every piece below marks its *tunable* part explicitly.

---

## The pieces (the known work)

### P0 · House style + base type — **NO schema, biggest immediate win**
The ambient layer that's *always on* and that you never pick — it's just made well. This is where "oh, it feels like a studio now" actually happens, at zero data risk.
- A beautiful **self-hosted type system** (Aesop's spirit: a refined editorial serif + a quiet grotesque), a considered **type scale**, generous **line-height / letter-spacing**, a comfortable **max line-width**.
- A **warm off-white ground** (never pure white), **softer card shadows**, more **breathing space** (*ma*), quiet chrome (tags, toolbars, buttons).
- *Tunable:* which exact faces (I'll bring 2–3 free, self-hostable pairings to pick), the exact off-white, shadow softness, spacing rhythm.
- *Stores:* nothing. Pure CSS + font files. **Loads light** (subset the faces).

### P1 · Board background — any color
- A **full color picker** for a board's background (your "I want any color!").
- *Stores:* one new column `board.bg_color text` (nullable → default warm ground).
- *Tunable:* the picker's curated swatches (a beautiful default palette) sit on top of full free choice.

### P2 · Card surface — per-board color + soft treatment
- A card's background = **a color × a soft treatment** (plain tint · gentle glow · faintest grain). Soft and analog-warm, **not glassy**.
- *Stores:* new columns on `placement` (`surface_color text`, and if wanted `surface_treatment text`) — the natural home: `placement` already holds *per-board appearance* (x/y/size/`display_size`). So a note can be one color here, another there; a **loose** note (no placement) shows the house default.
- *Tunable:* the palette, the glow/grain amounts.

### P3 · Border / frame — cards **and** images
- The edge treatment: **none · hairline · soft mat · gentle museum frame · polaroid**, for notes *and* images. This is the biggest single "artist's-wall" lever.
- *Stores:* one new column `placement.frame text not null default 'none'` — exact precedent: `display_size text not null default 'full'` already lives there.
- *Tunable:* the exact frame styles + their proportions/color.

### P4 · Presets — one-tap curated looks
- A few **ready-made looks** (bg + surface + frame + font bundled) so you never start blank — pick a preset and stop, or open the controls and go deep.
- *Stores:* **nothing** — a preset is a named bundle in the UI that *writes the existing fields* (P1–P3). No new storage.
- *Tunable:* the preset recipes themselves (this is where the aesthetic gets "shipped").

### P5 · Fonts pickable + per-note text size — **later / optional**
- Beyond the house-style base: a **per-board font** choice, and the long-deferred **per-note text size** (a `font_scale` — noted additive in `card.tsx`).
- *Stores:* `board.font text` (per-board) and/or a `placement.font_scale` — additive when it fires.
- *Deferred:* the base type (P0) covers most of the beauty; per-note font choice waits until it's genuinely wanted.

---

## The artist's-wall feel — no new mechanism
The wall is: **framed things** (P3) + **soft shadow lifting them** (P0) + **generous breathing space** (P0) + **a warm ground** (P0/P1). It falls out of the pieces above — nothing extra to build.

## Where full functionality lives (not this plan)
This is the **aesthetic track**. "Full functionality for people" — the solid daily loop (mood boards, writing, gather) and eventual sharing — is its **own track**, not blocked by this and returned to separately. The **creative-embed dreams** (song/playlist, audio notes, swatches, board cover) are also their own track, reconciled against `parked.md` before any build. **Board cover/title** specifically defers to the existing C9 lean (a drawing on the board), not rebuilt here.

## Model-safety gates (every data-touching piece passes all five)
1. **Invariants:** `bg_color`/`surface_color`/`frame` are *per-board appearance*, like x/y/`display_size` (Principle 8). They ride the placement/board lifecycle — un-place stamps `left_at` but keeps the row, so a card's color/frame **survives a departure + return** (same as `arrived_at`). A loose note (no placement) shows house defaults. **No new always-true rule; nothing existing breaks.**
2. **Trace** each field across create · edit · un-place · trash · restore · destroy — no blank cells. The render rule (`the_inbox`) reads `deleted_at` + live-placement existence, **never** appearance fields → untouched.
3. **Lowest layer:** nullable/defaulted columns (old rows default gracefully); one db-module setter each.
4. **Derive, don't duplicate:** presets write existing fields (no parallel store); one source of truth per fact.
5. **Prove the flow:** color a card on board A → it's unchanged on board B; un-place + re-place → color/frame survive; set board color → reload persists. Schema proven on a throwaway Postgres first, **owner-gated** to cloud (backup → atomic → verify), per the established pattern.

## Stages (each shippable, `pnpm build` green → deploy → owner feel-test)
- **Stage A — P0 house style + base type** *(no schema).* Ship first: the biggest felt beauty, zero data risk. Includes bringing font specimens to pick.
- **Stage B — P1 board color** *(tiny schema: `board.bg_color`).* Simple, gratifying.
- **Stage C — P2 card surface** *(schema: `placement.surface_color` [+ treatment]).*
- **Stage D — P3 frames** *(schema: `placement.frame`).* The wall snaps into focus.
- **Stage E — P4 presets** *(no schema).* Bundles the above into one-tap looks.
- *(Later — P5 fonts-per-board, per-note size.)*

Each schema stage: proven on a throwaway DB → deployed to cloud on your go. Aesthetic *values* tuned continuously against your reference images — never a blocker to shipping the mechanism.

## Decisions to confirm before building
1. **Surface + frame per-board** (on `placement`), loose notes show house defaults — confirmed lean. ✓?
2. **Fonts:** house-style base only for v1 (P0), per-board font choice deferred to P5. ✓?
3. **Presets are UI-only** (write existing fields, no new storage). ✓?
4. **Exact palette / font / values** are the *tunable* half — decided by your eye against reference images, not pinned in this plan. ✓
5. **Stage order A → B → C → D → E** (house style first). ✓?

## The tunable half (the beauty dial, for reference)
Palette · the chosen faces · glow & grain amounts · frame styling · preset recipes · the warm off-white · shadow softness · spacing rhythm — all **config**, dialed against your Japanese/ethereal/Aesop references, forever, with no rework.
