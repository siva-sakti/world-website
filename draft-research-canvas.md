# Research — how the canvas apps are built, and what we adopt

*Findings from JSON Canvas (data model), tldraw (rendering/interaction), Heptabase (card reuse), Excalidraw (pen). Purpose: build our board surface + data model by borrowing proven approaches. Marked **ADOPT / SKIP**.*

## 1. Rendering — how to get "Freeform-smooth" on the web

- **tldraw** renders each shape as a **DOM element (HTML/SVG) positioned with CSS transforms**, inside a container that is *itself* CSS-transformed for camera **pan/zoom**. Smoothness = GPU-accelerated CSS transforms + a reactive signals store + direct pointer handling. Because shapes are DOM, they can hold **rich content, including rich text**.
- **Excalidraw**, by contrast, renders everything to a **single `<canvas>`** (via rough.js) — fast, but text is *plain* and content isn't DOM.
- **✅ ADOPT (tldraw's way): our board = DOM bit-cards** — each bit is a positioned `<div>` inside a container we `transform`. Pan/zoom = transform the container; per-bit drag/resize = **react-rnd / moveable**; and Tiptap rich text, images, and doodles live *inside* the divs for free. This is exactly why we chose DOM (model B) — tldraw is the proof the smoothness is achievable this way.
- **⛔ SKIP: adopting tldraw itself** — its store/shape framework would own our data model, and its license requires a watermark / paid tier for commercial use. We borrow the *approach*, keep our own React state + Supabase.
- **Gotcha to honor (D-030):** wire the container's scale into react-rnd's `scale` prop, or drag/resize deltas drift under zoom.

## 2. Data model — JSON Canvas validates *and* refines ours

JSON Canvas (Obsidian's open format) = **nodes** + **edges**:
- **node:** `id`, `type` (`text`|`file`|`link`|`group`), `x`, `y`, `width`, `height`, `color`; **z-order = array order.** `text`→inline `text`; `file`→a `file` path; `link`→a `url`; **`group`→ a labeled/background *region* (not a card).**
- **edge:** `id`, `fromNode`, `toNode`, optional `fromSide`/`toSide`, `fromEnd`/`toEnd` (`arrow`), `label`.

Against ours:
- Our **`placements`** ≈ their **nodes** (x/y/w/h + z). ✅ our position model matches an established spec.
- Our **bit types** ≈ their node types (text / file = image/pdf / link). ✅
- **Our advantage:** JSON Canvas embeds content *in the node* (text inline, file as a path) — it has **no shared, independent card reused across canvases.** Our **bit + placement split does** (one bit, many boards, live). So JSON Canvas is a *canvas file format*, not a *knowledge system.* We keep the split — and can **export a board → JSON Canvas** for interop.
- **✅ ADOPT — `group` answers our open question:** a board *can* hold a lightweight **structural element (a labeled region / background)** that is **not** a first-class bit. So: *most things on a board are bits; a board may also carry a few non-bit "group"/label elements.* Clean answer to "is everything a bit?"
- **✅ ADOPT: edges → our future bit↔bit `links`** (fromNode/toNode + optional arrow/label).

## 3. Card reuse — Heptabase confirms the bit/placement split

Heptabase: a **card** is a note; putting it on a whiteboard is a **reference** — the *same* card can sit on **many whiteboards**, edits propagate everywhere; cards live in a **card library** you pull from. That is *exactly* our **bit (independent) + placement (reference) + heap.** ✅ Ours is the proven way to do "same card, many boards."

## 4. The pen — perfect-freehand → SVG

Excalidraw/tldraw freehand uses **perfect-freehand** (points + pressure/velocity → a filled stroke outline). We render that outline as an **SVG path** → a doodle bit. **Vector = a few KB** (confirms storage is a non-issue). ✅ ADOPT for the in-app pen.

## Net — what we build

- **Board surface:** DOM bit-`div`s in a CSS-transformed container; react-rnd/moveable per bit; pan/zoom via container transform; scale wired to react-rnd. *(tldraw approach.)*
- **Data model:** keep `bits` + `placements` (richer than JSON Canvas) + add a **`group`/structural element** for non-bit board elements; **edges → links**; optional **JSON Canvas export** for interop.
- **Pen:** perfect-freehand → SVG doodle bit (vector).
- **Don't** adopt tldraw wholesale (license + owns the model) or Excalidraw's canvas-render (kills rich text). Borrow approaches; build ours.

*Feeds into: `SPEC.md` (§5 compose) and `draft-components.md`. Owner's parallel half: study Freeform's interaction feel by using it.*
