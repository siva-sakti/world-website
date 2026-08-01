# Gather picker — the smart organized dropdown (build plan)

**What this is:** the plan for the `[[` gather picker, redesigned as a **smart, organized dropdown**. Refines the flat text-only picker shipped in gather **G2** (live on production now) and pulls the *visual chip* forward from G3, because they're one experience. Owner design session + cold review + choices locked, 2026-08-01. **No schema change** (it only reads a few more columns already on `bit`).

**The problem it fixes:** the live picker is a flat list of every live bit by its `face`, so it's a wall of **"untitled"** — every uncaptioned doodle, screenshot, and empty note — where you can't tell things apart or find a picture by sight.

**Vision:** typing `[[` feels like reaching into your own mind — you find a *note* by its words and a *doodle* by its picture, fast, and the dropdown never gets in the way of writing.

**Success feel:** browsing shows everything, organized; the instant you type it narrows to just what fits; gathering a doodle drops a little *picture* into your sentence, not the word "untitled."

---

## The design — settled with the owner (2026-08-01)

1. **Organized into two sections** — **notes** (text bits, found by words) and **images & drawings** (found by sight, as thumbnails). Split by *type* — which is the same as splitting by *recognition mode* (you find words by reading, pictures by looking) — not by tag/board (those are many-per-bit and ambiguous).
2. **Smart, not modal** — the *same* organized dropdown. As you type, non-matching items drop out and **a section with no matches collapses**. So typing narrows it to a lean list automatically; not-typing shows the full organized browse. **No toggle, no mode** — the act of typing *is* the collapse.
3. **You find a picture by looking, not by typing** — a caption narrows the images row, but most doodles and screenshots have none, so **typing words is really a note search** and the images row steps aside. It never *vanishes*, though: it collapses to a slim **"N images — tap to browse"** line, so your pictures are always one tap away. (This is the honest shape of the collapse for a screenshot-heavy writer — see the UX note.)
4. **Media always shows in browse** — a thumbnail identifies it, caption or not. The **only** thing excluded is a *truly empty note* (a text bit with zero words) — nothing to show, almost always an accidental blank.
5. **Faceless is fine** — you can gather anything; the issue was never eligibility, it's *display* (the owner's correction — a bit is a real thing with an id regardless of a caption).
6. **Visual chips** — gathering an image/drawing drops a small **thumbnail chip** into the sentence (tap it to *peek* it larger); gathering a note drops a **text chip** (its words). This is *why* faceless media is usable — you recognize it by sight both in the picker and in the chip. Under the hood the chip is unchanged: it still stores the target's id + a text label; only its *look* becomes a picture (so search/reconcile/export are untouched — see below).
7. **Tap-to-select, floats at the cursor, portaled** — touch-first for the Daylight; the board's zoom can't move it (already true of the live picker); it flips **above** the cursor when there's no room below (writing low on the page / above the keyboard).

---

## Settled choices (2026-08-01) — reviewed + ruled

1. **The image chip in your sentence** — a **small inline thumbnail** (~1.5× line height, so the words still read), **tap to peek it larger**. A chip is a *pointer, not an embed*; small keeps the sentence readable, and peek covers the one risk of small (a thumbnail too tiny to recognize). Peek ships **with** the chip, not later.
2. **Section order** — **notes on top**, fixed (not reordered by state). You're writing words, so the section you match by typing stays anchored at the cursor; images sit below.
3. **Scope** — **all three stages ship together.** Pausing after the picker would ship the exact "gather a picture, get the word *untitled*" problem, now inside your sentence.

---

## The experience — the UX, step by step

**Type `[[` mid-sentence** → a compact dropdown floats at the cursor (flipping above it if you're near the bottom):
```
─ notes ─────────────────
  Day 2: fire ceremony sequence
  on acting well toward a friend
  the equanimity thought
─ images & drawings ─────
  [🖼] [🖼] [✏️] [🖼]      ← thumbnails, scrollable row
```
Notes by their words; images and doodles by sight. This is the **browse** state.

**Type "fire"** → notes narrow live to just what matches. The images row has no words to match, so it **steps aside** — collapsing to a slim **"3 images — tap to browse"** line (tap it to clear back to browse). You're left with a tight, fast note list — arrived at by typing, no mode switch.

**Tap the doodle** → a small **thumbnail chip** drops into the sentence — *"the ceremony connects to `[🖼]`…"* — an actual tiny picture, not "untitled" (tap it later to peek it larger). Tap a note → a **text chip** with its words. Cursor lands right after; keep writing.

**Nothing matches** → a quiet **"no bits match"** line (never an empty box).

**Keep typing past it / tap away / Escape** → closes, sentence intact.

Baked-in details: **compact + internal scroll** (never takes over the screen) · **caps** (a few notes + a thumbnail row, scroll for more) · **media always listed in browse, empty-notes excluded** · **floats at cursor, flips up when low, portaled** · **tap-to-select**.

---

## How it fits the code (grounded — verified against the files)

- **The picker lives in `text-bit.tsx`** (shipped). Its data comes from `listGatherCandidates` (`lib/db/references.ts`), which today returns `{ id, face, type }` for the newest live bits and the client filters by `face` substring.
- **Every bit fits one of the two sections.** A bit is `text`, `image`, or `drawing` (a saved *link* is a text bit — "bookmark" was retired, D-102 — so there's no fourth kind and no missing section). Sort **by type first**: `image`/`drawing` → *images & drawings* (always shown in browse); `text` → *notes*, and **only there** drop a bit whose `face` is empty (a truly blank note). This one rule is unambiguous — a *captioned* screenshot is still type `image`, so it stays with the pictures (where you'd look for it), never mis-sorted into notes.
- **Extend the candidate query** to also select `thumb_path`, `storage_path` (image) and `strokes` (drawing) — everything a thumbnail needs. All already columns on `bit`; no schema change. (`strokes` rides along with the row — eager, not lazy — which is fine at one writer's scale.)
- **Thumbnails — reuse proven patterns, honestly:**
  - **Images** → a **lazily-signed URL**, signed only for the rows **actually rendered** (not the whole filtered list) — the `signedUrl(supabase, thumb_path ?? storage_path)` pattern from `loose-column.tsx`.
  - **Drawings** → a **mini render of `strokes`** via `DoodleBit` (the same component the bit page uses), drawn in a **fixed-ratio box** so a thumbnail doesn't distort (it renders full-bleed by default). *Note:* the loose-notes *panel* does **not** mini-render drawings — it shows them as the word "drawing" — so this is real new rendering, not a copy-paste.
- **Browse = the 200 newest.** `listGatherCandidates` caps at 200 (newest-first). Honest framing: browse shows *everything you'd reach for*, which at this scale is the recent pile; a real search comes when the pile outgrows 200.
- **Sections + smart collapse:** split candidates by type as above; filter each by the typed query (`face` substring); render a section only if it has matches — except the images row, which collapses to the slim "N images — browse" affordance rather than disappearing.
- **The visual chip:** `BitRef` today renders `<span data-ref>label</span>` as styled text. For an image/drawing target it gets a **NodeView** that draws the thumbnail (+ tap-to-peek) — but its **serialized form (`renderHTML`) is unchanged**: still `<span data-ref="id">label</span>`, text-bearing. The NodeView changes only what you *see*, never what's saved — so `extractRefIds`, `reconcile`, `search_tsv`, and export are all untouched (the label text still flows into search — the P9 cache carve holds). Text refs stay plain text chips.
- **One pipeline, editor + read-only.** Note bodies render through the *same* `TextBit`/`BitRef` path whether you're editing or just reading (the bit page and the board card both mount `TextBit`), so a single NodeView on `BitRef` lights up the chip **everywhere** a body shows — the media chip is lower-risk than the parent G3 note implied.

**Net:** app-layer only — a wider read, a two-section render with lazy thumbnails, and a media-aware chip NodeView. No migration, no new dependency.

---

## Stages (each: build → `pnpm build` → deploy → owner feel-test)

1. **Picker thumbnails** — extend the candidate read; render image thumbnails (lazy-signed, rendered rows only) + drawing minis (`DoodleBit`, fixed-ratio) in the picker; drop truly-empty notes. *(The list stops being a wall of "untitled.")*
2. **Sections + smart collapse** — the two-section layout (notes on top / images & drawings); narrow each by the query; collapse the images row to the slim "N images — browse" line while typing; the "no bits match" line when nothing fits; flip the whole picker up when there's no room below. *(The "smart organized dropdown" itself.)*
3. **Visual chips** — a gathered image/drawing renders as a small thumbnail chip (tap to peek larger) via a `BitRef` NodeView whose serialized HTML stays text-bearing; text chips unchanged. Lights up in the editor and in read-only bodies at once (same pipeline). *(Pulls G3's media-chip forward; the chip's data model is untouched.)*

**Scope:** all three ship together (owner-ruled) — stages 1–2 are the *picker*; stage 3 is the *media chip* (so a gathered faceless doodle shows as a picture, never "untitled"). Peek (a media chip tapped larger) ships **with** stage 3; the "gathered into" backlink list stays a separate piece (below).

---

## Model-safety gates
1. **No schema change** — reads more existing columns; writes nothing new.
2. **Thumbnails lazy-signed** — only the rows actually rendered (the `loose-column` rule), never the whole filtered list.
3. **Faceless-media stays reachable; empty-notes excluded** — a conscious *display* rule (type-first, then drop an empty-`face` text bit), not an eligibility one (reconcile already refuses self / a non-text source).
4. **One source of truth unchanged** — the media chip's NodeView changes only the *rendered look*; its serialized `<span data-ref>label</span>` is exactly what G2 saves, so `extractRefIds` / reconcile / `search_tsv` / export are untouched.
5. **Prove the flow** — typecheck + build green; owner feel-tests: thumbnails render, sections narrow on filter, the images row collapses to the browse line (not vanish), a gathered doodle shows as a picture and peeks larger, and search still finds a note by a gathered chip's words.

## Deferred / not here
- **The "gathered into" list** on a bit's page (the backward payoff read) — the rest of G3, separate.
- **Grouping by tag/source** — many-per-bit, ambiguous; the type split is the right axis.
- **Keyboard arrow-nav** in the picker — tap-select is primary (touch-first); desktop arrow-keys are later polish.
- **Server-side body search** in the picker — client substring on the `face` is the v1 (house pattern); server search when the pile grows past the 200 browse cap.
