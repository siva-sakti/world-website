# Compose MVP — Build Plan (per task)

*Detailed implementation plan for the compose surface. Built in the **real Next app** (React + react-rnd + Tiptap), **localStorage** persistence (no cloud/Docker), on a client route `/compose`. Run via `pnpm dev` → `localhost:3000/compose`. Ports to Supabase persistence when cloud is set up. Tracks tasks #1–#5.*

**Universal principle:** every bit is the same **Card** (a draggable/resizable wrapper); only the *content* inside differs (Tiptap text / `<img>` / doodle `<svg>`). Build the Card once (Task 1); every later bit reuses it.

---

## Task 1 — Board + universal Card (text bit)

**Goal:** `/compose` where double-click → a text card forms around what you type, drags + resizes + selects. Establishes Card + the localStorage store.

**New deps:** `react-rnd`, `@tiptap/react`, `@tiptap/starter-kit`, `@tiptap/pm` *(react-rnd + tiptap are pre-approved).*

**Files:**
- `src/app/compose/page.tsx` — `"use client"`; renders `<ComposeBoard/>`. No Supabase (self-contained).
- `src/app/compose/types.ts` — `PBit` + `BoardState` (below).
- `src/app/compose/store.ts` — `loadBoard()/saveBoard()` (localStorage key `compose:v1`), debounced save.
- `src/app/compose/compose-board.tsx` — `ComposeBoard`: owns `bits`, `selectedId`, `editingId`, `nextZ`; board surface; create/select/persist.
- `src/app/compose/card.tsx` — `Card`: the `<Rnd>` wrapper (drag/resize/select/z), renders per-type content.
- `src/app/compose/bits/text-bit.tsx` — `TextBit`: Tiptap editor.

**Types:**
```ts
type PBit = { id; type:"text"|"image"|"doodle"; x;y;w;h;z:number;
  autoSize?:boolean;              // width still hugging content (pre-manual-resize)
  html?:string;                   // text
  src?:string; crop?:Rect;        // image (Task 2)
  strokes?:Stroke[] };            // doodle (Task 3)
type BoardState = { bits:PBit[]; nextZ:number };
```

**Interaction model (the crux — Freeform-like select/edit/drag):**
- Card has states: **idle → selected → editing** (text).
- Click idle card → *selected* (frame + handles; draggable from anywhere; NOT editing).
- Double-click (or Enter) a selected text card → *editing* (caret; **drag disabled**; Tiptap active).
- Click empty board → deselect + commit.
- Implement with per-card `editing` flag → `<Rnd disableDragging={editing}>`; Tiptap `editable`/focus only when editing.

**ComposeBoard:**
- On mount: `loadBoard()` → state. On change: debounced `saveBoard()`.
- Board = full-viewport relative `<div>` (paper ground, `onDoubleClick` to create, `onClick` empty → deselect).
- Create text: dbl-click empty → new text PBit at event coords (relative to board), `html:""`, `autoSize:true`, `z:nextZ++`; select + set editing + focus.
- Select: card pointerdown → `selectedId=id`, bring to front (`z=nextZ++`).

**Card (`<Rnd>`):**
- `position={{x,y}}`, size: if `autoSize` → `"auto"` (content-driven; **fallback: measure content width via ref and set px if react-rnd `auto` misbehaves**); else `{width:w,height:h}`.
- `onDragStop` → update x,y. `onResizeStop` → update w,h, set `autoSize:false`.
- `enableResizing` corners **only when selected**; selection ring via CSS `outline`.
- `cancel` not used (drag disabled by `editing` flag instead).

**TextBit:**
- `useEditor({ extensions:[StarterKit], content:bit.html, editable:isEditing, immediatelyRender:false })` (Next hydration-safe).
- `onUpdate` → debounced update `bit.html`. Auto-height: editor grows naturally; width from Card.

**Done / verify:**
- `pnpm build` clean. `pnpm dev`: dbl-click → card forms around typed text → click-away deselects → click selects (frame) → drag smooth → corner-resize wraps text → dbl-click edits → **reload persists**.

**Risks / sub-decisions:**
- react-rnd `size:"auto"` may not hug content → fallback: measure content with a ref + ResizeObserver, set width in px.
- Tiptap in Next: `immediatelyRender:false` to avoid hydration mismatch; route is `"use client"`.

---

## Task 2 — Image bit

**Goal:** drop/paste/pick an image → an image card → aspect-resize + non-destructive crop.

**Files:** `src/app/compose/bits/image-bit.tsx`; edit `compose-board.tsx` (add-image + drop/paste), `types.ts` (image fields), `card.tsx` (aspect-lock for image; crop mode).

**Add image (3 ways):** file `<input accept="image/*">`, board `onDrop` (dataTransfer files), `onPaste` (clipboard image). Each → **downscale-on-import** (canvas, cap long edge ~1400px, re-encode JPEG dataURL) so localStorage isn't blown *and* it previews the real §9 pipeline. Read intrinsic w/h; initial card size caps long edge ~360px, keeps aspect.

**ImageBit content:** `<img>` filling the card; if `crop` set, show the cropped region (wrapper `overflow:hidden` + absolutely-positioned scaled img, from normalized crop rect).

**Resize:** react-rnd `lockAspectRatio` when `type==="image"`.

**Crop (non-destructive):** select → "crop" → overlay a draggable/resizable crop rect over the image → confirm → store `crop:{x,y,w,h}` normalized [0..1]; original `src` untouched; recompute display. Minimal but real.

**Done:** drop/paste/pick → downscaled image card → aspect resize → crop → drag → persists.
**Risks:** localStorage quota (mitigated by downscale); keep crop UX minimal.

---

## Task 3 — Doodle bit (the validated pen)

**Goal:** the good pen inside a card; strokes as **vector SVG** so the card scales the ink crisply.

**Files:** `src/app/compose/pen.ts` (port `buildOutline` from the spike → output **SVG path `d`** instead of canvas fills); `src/app/compose/bits/doodle-bit.tsx`; edit `compose-board.tsx` (add-doodle), `types.ts` (`Stroke = {pts:number[][], color, width}`), `card.tsx`.

**Add doodle:** creates a doodle PBit (initial ~320×220) in **draw mode**.

**DoodleBit:**
- Draw surface (pointer events, perfect-freehand-style outline, redraw-from-data — the spike's validated logic). Theme-aware ink.
- Render strokes as `<svg viewBox="0 0 W H" preserveAspectRatio>` with a `<path>` per stroke (filled outline). Resizing the Card scales the SVG → **crisp vector at any size**.
- Draw-vs-move mode == the text edit-vs-select model: draw when the doodle card is "editing"; movable otherwise.
- Pointer coords mapped into the doodle's viewBox space (account for card position + current scale).

**Done:** add doodle → draw (good pen) → move/resize card, ink stays crisp → persists.
**Risks:** coordinate mapping under card scale; draw/move mode toggle.

---

## Task 4 — Toolbar + run locally for the feel

**Goal:** a toolbar to add each bit; a coherent multi-card board; running locally for the owner to feel.

**Files:** `src/app/compose/toolbar.tsx`; edit `compose-board.tsx` (toolbar actions, delete, keyboard).

**Toolbar (slim, fixed):** select (default) · text · image · doodle · delete · clear. text/doodle → create at board center; image → file picker.
**Multi-card:** z-order on select (Task 1). **Delete:** Delete/Backspace when a card is selected & not editing. **Clear:** wipe board (confirm).
**Polish:** selection ring, corner handles, hover cursors, `touch-action:none` on cards (future touch), smoothness (react-rnd transforms).
**Run:** `pnpm build` (verify) → `pnpm dev` (background) → owner opens **localhost:3000/compose**.
**Done:** a usable Freeform-like board running locally; add/arrange/delete text+image+doodle.

---

## Task 5 — Compose the real retreat notes (validation)

**Goal:** the go/no-go — compose the owner's actual notes and judge the feel.

**Steps:** owner gets retreat handwriting onto the computer as an image → compose a board (handwriting = image bit, typed sections = text bits, a doodle) resembling the retreat page → judge: smooth? natural? does handwriting-and-typing side-by-side satisfy?
**Decision:** feels right → **port to the real persisted app** (swap localStorage → `lib/db` + Supabase, cloud deploy, domain), then build the **Obsidian layer** (tags/find/topic-pages). Something missing → iterate the compose surface first.
**Done:** verdict captured + next-phase decision made.

---

## After these five (the visible arc, not yet tasked — gated on cloud)
6. Port compose → real persistence (localStorage → Supabase `bits`/`placements`), deploy, domain.
7. The Obsidian layer: tag UI (tap-not-type), topic-pages, heap/find, search.
8. Privacy tiers · scoped graph · PWA.
