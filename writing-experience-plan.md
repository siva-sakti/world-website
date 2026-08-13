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
