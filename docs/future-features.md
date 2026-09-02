# Future features — loved, filed, deliberately NOT now

> ## STATUS · 2026-09-02 · 🟠 the shelf for owner-loved ideas that wait
> **The owner's sequencing rule, verbatim:** *"we need to settle the basics of the bit and the piece and the board first, and redo the piece mechanics, before we build out these other side features."* Nothing here builds until the composition base is enacted. Each entry: a one-paragraph spec, enough to pick up cold.

## F-1 · Resurfacing while you write — **V2** *(owner: "I love that")*
Full ideation: `resurfacing-ideation.md` (the constraints, the three tiers, the AI gate).

## F-2 · The thought's journey *(Claude's variant)*
Tap any bit or piece → its dated biography: caught March 12 · landed on [board] June 3 · pulled into [piece] Sept 2. **All data already stored** (bit_travel + reference/placement timestamps) — this is a read-only page section or overlay, no schema. Spec sketch: a "journey" strip on the thing's page, chronological, each entry a link.

## F-3 · The board timeline view *(the owner's variant — "a little timeline view, that could be a cute view")*
A board's view toggle: the same bits laid along a **time axis** (by when caught, or when they arrived on this board — pick one, probably arrived). Read-only rendering like the outline lens; placements untouched. Spec sketch: a third view mode beside canvas (and the outline), horizontal time axis, cards small.
*(Siblings, not rivals — F-2 is one thought across surfaces; F-3 is one surface across time. Decide separately, later.)*

## F-4 · The piece seen as a board *(the owner's — 2026-09-02)*
A view of a composition **as a board**: everything it pulled in, spread spatially. The mirror of parked document-mode (a board read as flowing text); this is a piece read as space. *"Maybe there's something cool there."* Spec sketch: a view toggle on the piece; its pulled-in bits as cards; read-only v1 (arranging them = a real board, which "make this a board" could mint).

## F-5 · "Make this a bit" from inside writing *(from the owner's paste principle — 2026-09-02)*
Select anything in your writing → the deliberate catch act, performable mid-flow. The completion of the paste ruling: the composition never catches automatically (it's a saying surface); the deliberate act stays available everywhere.

### F-5, thought through (owner + Claude, 2026-09-02, late)
**The value:** liberation from the one document — pasted content stays trapped in its piece unless minted; minted, it's material (boards · search · reuse · source). Real non-value too (dividers, one-off screenshots) — hence deliberate, never automatic.
**The interaction — never ask, never do it for them; the affordance WAITS:** pasted content carries a quiet hover/tap "make this a bit" forever · highlighted text gets it on the existing selection toolbar. No prompts, no interruption — the keeping-impulse often arrives later, and the act is sitting there when it does. Detection trivial (pasted ≠ pulled).
**Three design points for enactment:** the selected text STAYS (never replaced by a chip — no mutating the writing); the minted bit is born already tied to its piece; source offered at minting (the intake pattern), skippable. **Owner refinements (2026-09-02, late):** minted-from-selection text gets a **subtle underline, toggleable off** (her mark: a whisper that "this text also lives as a bit"). **The minted bit's origin = the composition it was born from** — "made from [composition]," recorded automatically; not the external-source field. **⚠ Design once with EXCERPT** — both are "a bit born from inside something, remembering its parent."

## F-6 · The board-peek on the composition *(the owner's — 2026-09-03; the true content of the "board-connection itch")*
**The want, finally located:** *"when I'm writing, I wanna be able to see my vision board — maybe multiple — in my composition surface, as opposed to the opposite."* The mirror of the floater: on the board, the board is big and typing small; here **typing is big, boards are small.** Same need, two postures — *either surface can host a small window of the other.*
**Feasibility (against the owner's "too difficult" hedge):** a **read-only board-peek** is cheap — the board already renders at any zoom (camera + fit-to-content); small + locked + click-through-to-open is the board running small. **Editing both at once is the hard thing, and nobody wants it — glancing is the want.**
**The ladder:** ① second browser window (today, legal, scaffolding) → ② **a board tab in the drawer** (read-only, fit-to-view — Claude's first-step lean) → ③ **floating board-peeks, multiple** (the true mirror). Coexist fine.
**Sequencing:** composition-surface behavior → after the migration, with the floater. Filed so it can't slip.

## F-7 · Duplicate a piece *(owner-loved 2026-09-03: "I would love that")*
"Duplicate" on the piece's page + card menu → a new composition: **body verbatim — chips come along free** (they carry target ids; first save mints the copy's own reference rows to the same bits — existing machinery, zero new code) · tags copied · same folder · fresh dates · no star · **no placements** (unless duplicated from a board card → lands beside the original) · no backlinks (correct automatically). **Quietly answers VERSIONS:** duplicate-before-rewrite is manual versioning — the shape people actually reach for. Post-migration (composition behavior).

## The full cool-ideas list (owner-requested tracker — keep current)
resurfacing (V2, F-1) · board-peek on the composition (F-6) · duplicate a piece (F-7) · journey strip (F-2) · board timeline (F-3) · piece-as-board (F-4) · make-this-a-bit (F-5) · make-board-from-tag (near-term, queued) · hide-pieces toggle (✅ ruled in) · floater+dock (✅ ruled in) · steering on-ramp to the connective note (open in base spec)

## Near-term, NOT on this shelf
**"Make this a board" from a tag** — owner wants it soon; lives in `product-concept-queue.md`, code window's lane when slotted.
