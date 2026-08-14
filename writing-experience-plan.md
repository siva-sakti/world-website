# The writing experience — notes that feel like notes (plan)

**What this is:** planning a real note-**writing** experience. On the phone the owner found the text box too small and too canvas-y for actually writing a note, wants to resize it in a touch-friendly way, and — bigger — sometimes just wants to *write* (type a note out), not place a spatial card. This plans the **structure/UX**; the visual restyle stays the owner's. Owner + Claude, 2026-08-03. **Not yet built — plan for review.**

## What the owner said (on the phone)
- The text card **opens small** and feels cramped for writing a real note.
- **Resizing isn't obvious or touch-friendly** (today it's width-only, with tiny 11px handles).
- Sometimes you **just want to write** a note — type it out — not think about a card on a canvas.

## What already exists (so we build ON it, not a parallel thing)
- **A text bit on a board is a card** — opens ~240×60, auto-grows height as you type, resizes by *width* (left/right handles reflow the text). It's a compact *spatial* object, sticky-note sized.
- **Every bit already has a full page** — `/bit/[id]` (`TextWorkspace`) is an **always-editing rich-text editor**, page-sized. This is a genuinely comfortable writing surface — it's just not surfaced as "where you write."
- **The inbox intake** is a quick-capture box → a loose text bit.
- **Loose bits** (in your inbox/notes, on no board) are a first-class thing.
- So the atom (a text bit), a spacious editor, and a home for board-less notes **all already exist.** What's missing is a **writing-first way in and out** — not new data.

## The core idea — separate WRITING from ARRANGING
- The **board** is for *arranging* — spatial cards, the overview.
- **Writing** wants a *focused, comfortable, linear* surface — a page, not a tiny card.
- The friction is forcing writing into a canvas card. So: let writing happen on a real surface, and keep the board for arranging.

## The plan — three coordinated moves
1. **A "write" door → a comfortable editor.** From home / the nav, a "write a note" that opens a **spacious page editor** (reusing the existing workspace), you type freely, and it saves as a **loose note** in your inbox — place it on a board later if you want. This is the pure "just write" mode, built on pieces that already exist (workspace + loose bit), no new data concept.
2. **Tap a card → write in a focused view (essential on mobile).** On the board, opening a text card to edit brings up a **focused writing view** (the note, full and comfortable — a sheet/overlay or the workspace), you write, close, and you're back on the board with it updated. On a phone a tiny card is simply unwritable, so this is the real fix there; on desktop it can stay in-place if that already feels fine.
3. **Make the card itself more note-friendly (smaller win).** A more generous default size for a fresh text card, and a **touch-friendly resize** (bigger handle / corner-resize / a "grow" affordance) so writing *in place* is less cramped when you do want it.

**Priority:** 1 + 2 are the heart (writing gets a real surface; the board stays for arranging). 3 is a nice quick win alongside.

## Open questions for the owner (your taste decides these)
1. When you **"just write a note,"** should it land in your **inbox/notes** (loose, place on a board later — my lean, it fits the model) — or go straight onto the board you're on?
2. On the board, tapping a text card to write: a **full focused view** (my lean, especially on mobile) or **edit bigger in place**? Or full-view on phone, in-place on desktop?
3. Should the writing surface feel like a **document/page** (full-width, long-form) or just a **bigger card**? (Document feel = more note-like.)
4. Should that writing view be its **own screen** (the bit page) or an **overlay** floating over the board (so you never lose your place)?

## Scope
Reuses the text bit, the loose/inbox model, and the existing workspace editor — **likely no schema change**; it's new *doors*, a focused editor surface, and card sizing. Verified by build + owner feel-test (especially on the phone). Visual design is the owner's.

---

## v1.1 — board creation ergonomics (owner feedback on v1, 2026-08-13)

Two desktop frictions from real use, named by the owner after living with v1:

**1. Dumb spawn spot — new things stack.** Code-proofed 2026-08-13 — FOUR spawn paths, three broken: **`+ note`** always lands at view center (stacks); **`+ image` (picker)** always at a fixed corner offset (stacks — missed in the first draft); **pasted images** likewise (missed); **call-in**'s 6-step cascade *cycles*, so the 7th lands on the 1st. Double-tap note / image *drop* / pen doodle land where you acted — deliberate, untouched.
- **Fix — ONE shared `findClearSpot(rect)` helper** used by all four: start at the natural spot (view center / the door's anchor), hit-test the candidate rect (at the thing's actual default size) against existing cards in world coords, **step down-right in fixed world increments** until clear — capped (~20 tries, then plain cascade). Deterministic, no randomness. Call-in's `bringInStep` cycle is replaced by it.

**2. Receipt mode — the box never adapts its shape.** Fixed width (240px, D-040) + auto-grow height only ⇒ real writing produces a tall skinny ribbon ("a super long receipt") that must be hand-widened every time.
- **Fix (a) — born wider:** default text-card width **240 → ~400px**. *This supersedes D-040's 240px — the owner has called the default too small three times in real use (2026-08-03 phone, 2026-08-13 desktop ×2); ruling falls on the owner's word, recorded here.*
- **Fix (b) — auto-widen while typing:** while a card is being **actively edited** and its shape goes receipt-like (height ≳ 1.5× width), the card **widens itself stepwise up to a comfortable measure (~560px)**, then grows taller as today. **The owner's own resize always wins** — a manually-set width (this session) turns auto-widen off for that card; width changes persist through the normal debounced door. *Mechanics (code-proofed):* the stored `h` is stale by design for text (height:auto) — the card must measure its **rendered** DOM height; auto-widen lives in `Card` (it owns editing + the DOM), emitting the same `onChange({w})` patch as a hand-resize; the resize-stop handler sets the per-card "user sized" flag. Also: **text call-ins get the same 400 default** on a fresh insert (revives keep their true stored width).
**3. Adjacent, swept + ruled (owner, 2026-08-13):**
- **(A) Empty-note litter — IN.** The board's create births the row instantly (unlike /write's born-on-first-content), so a stray double-tap leaves a blank note on the board. Fix: a fresh board-born note that ends its edit with still-no-real-content (the /write `hasContent` test: no text, no chip) **evaporates** — removed from the board and its row deleted through the settled-create door (the existing compensating-delete). Once it has ever held real content, it stays (matches /write). Old notes emptied by hand are left alone (a deliberate act).
- **(B) Stay in view — IN.** `findClearSpot` prefers candidates fully inside the current viewport (world-converted); only if no in-view spot is clear does it fall back to the first clear spot beyond, then plain cascade. A new note must never seem to not-appear.
- **(D) Paste text → a note — IN.** ⌘V of text on the board (NOT while editing a note or focused in any input — the guard) → one new text note holding the pasted text (lines → paragraphs, HTML-escaped), at a clear spot. One paste, one note, no cleverness (distinct from the rejected auto-chunking, D-log).
- **(C) Zoom-on-create — REJECTED (owner):** auto-zoom on `+ note` while zoomed out would feel like the app grabbing the wheel. Not re-proposed.
- Out of scope here: the phone write-first fork (open the page on create — still an open owner call); any visual restyle (the owner's design pass).
- *Build note (proofed):* overlap tests use state `w` but **rendered DOM height** for text cards (state `h` is stale by design, height:auto) — a `data-pid` on the card inner + a query at spawn time; fallback to state h.

**Verify:** build green; on a busy board, five toolbar-creates in a row land without overlap; typing three paragraphs into a fresh note widens it to the cap then grows down; a hand-narrowed note stays narrow while typed into. Feel-test = the owner.
