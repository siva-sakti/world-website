# The writing experience — notes that feel like notes (plan)

**What this is:** planning a real note-**writing** experience. On the phone the owner found the text box too small and too canvas-y for actually writing a note, wants to resize it in a touch-friendly way, and — bigger — sometimes just wants to *write* (type a note out), not place a spatial card. This plans the **structure/UX**; the visual restyle stays the owner's. Owner + Claude, 2026-08-03; **cold-reviewed same day** (corrections folded in). *(Recreated 2026-08-09 in the GitHub working copy after macOS locked the local Documents folder.)*

## What the owner said (on the phone)
- The text card **opens small** and feels cramped for writing a real note.
- **Resizing isn't obvious or touch-friendly** (today: width-only side handles, 11px dots).
- Sometimes you **just want to write** a note — type it out — not think about a card on a canvas.

## What already exists (so we build ON it, not a parallel thing)
- **A text bit on a board is a card** — opens ~240×60 (the 240 width is owner-ruled, D-040/D-045), auto-grows height, resizes by width. A compact *spatial* object.
- **Every bit already has a full page** — `/bit/[id]` (`TextWorkspace`) is an **always-editing rich-text editor**, page-sized. A genuinely comfortable writing surface — just not surfaced as "where you write."
- **The inbox intake** quick-captures a loose text bit — and `createLooseTextBit` **already exists** in `lib/db/bits.ts` (D-100; review finding 3 — reuse it, don't duplicate the door).
- **Loose bits** (in your notes, on no board) are first-class; the inbox is their home.
- So the atom, a spacious editor, and a home for board-less notes **all exist.** What's missing is a **writing-first way in and out** — not new data.

## The core idea — separate WRITING from ARRANGING
The board is for *arranging*; **writing** wants a focused, comfortable, linear surface — a page, not a tiny card. Stop forcing writing into a canvas card.

## Decisions taken (owner delegated execution 2026-08-03; each reversible on their word)
1. **A "just written" note lands loose in your notes/inbox** — place it on a board later. Writing never forces a spatial decision.
2. **The focused writing view is the existing bit page** (`/bit/[id]`). V1 reaches it via an explicit **"open" act on a selected card**; in-place card editing stays. (An auto-sheet on phone tap is a later refinement.)
3. **Document/page feel** — the bit page already is that; no new surface invented.
4. **Own screen, not an overlay** — v1 uses the proven page; overlay-over-the-board is later polish.
- **NOT changed: the 240px default text-card width** — owner-ruled (D-040), so re-ruling it is the owner's call. The cramped-writing pain is answered by the focused view instead.

## The v1 build list (all app-layer, no schema change; review corrections folded)
1. **`/write`** — a quiet full-page writer reusing the shared `TextBit` editor. Creates the loose bit **only on first real content** (no empty-note litter), with a **synchronous ref guard** against double-create (review finding 2), and **every flush awaits the create promise** — the settled-create gate (review finding 1, BLOCKER: an unawaited flush 0-row-updates and silently loses the first words; `updateBitBody` doesn't assert rows). Then debounce-save body + reconcile `[[` chips exactly as the workspace flush does. Save-error state shown; a quiet "saves to your notes" line.
2. **A "✎ write" door on home** → `/write`.
3. **"open" on a selected board card** → the bit page. Gated: `settled(placementId)` first (a fresh card's insert may be in flight → the page would 404), then **flush the pending body write** before navigating (review finding 4 — else the workspace SSRs a stale body and later overwrites the board keystrokes).
4. **Touch-friendly resize handles** — the 11px dots become ~22px when the pointer is coarse (set in a mount effect), **with the centering offsets scaled too** (−6→−11; review finding 9). Handle size is unruled territory; D-040's width default untouched.

## Verify
`tsc` + lint + build green; the create-gate and open-gate traced on paper against `use-persistence`; the feel — writing on the phone, the open door, the fatter handles — is the owner's device test. Visual design remains the owner's.

## Noted, not v1
- The bit page's back link reads "← find" wherever you arrive from; browser-back covers it — a smarter return is later polish.
- A note typed then fully deleted still leaves an empty note in the pile (existing class, visible in the inbox).
