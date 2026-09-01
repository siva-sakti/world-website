# The actual things — what you'd see and click in the app

> ## STATUS · 2026-09-01 · the CONCRETE list
> Written at the owner's ask: *"what are the actual things I need to see in an app."* Everything the convergence work turned up, translated out of frameworks into **things you would see, click, or miss.** No taxonomy. No theory.
> **✅ = there today · ⚠️ = half there · ❌ = missing · ⚪ = undecided whether we want it**
> Detail/reasoning for any line: `convergent-surfaces-overview.md` · `convergent-surfaces-stress-test.md` · `composition-surface-spec.md`.

---

## 1 · Writing a piece (the composition surface)

**Basic document stuff — "Notion-level":**
| | thing | note |
|---|---|---|
| ✅ | rich text · bold · italic · links | in the editor now |
| ⚠️ | **headings** | installed in the editor, **no UI exposes them** |
| ⚠️ | **bulleted + numbered lists** | same — installed, not surfaced |
| ⚠️ | **quote block · divider · code block** | same |
| ❌ | **checklist** | the boxes-you-tick one |
| ❌ | **a table, inside the writing** | Docs-style. *(≠ a separate sheet surface — see §5)* |
| ❌ | **an image, placed in the writing** | today an image is a bit on a board, not in prose |
| ❌ | **drag a block to reorder it** | the ⋮⋮ handle |
| ❌ | **`/` menu to insert things** | same pattern as our `[[` |
| ❌ | **turn this into that** | paragraph → heading → list |
| ❌ | **word count / length** | nothing tells you how long the piece is |

**Working with your material inside the writing:**
| | thing | note |
|---|---|---|
| ✅ | **type `[[` to pull in a bit** | drops a chip — a name you tap |
| ✅ | **the drawer** — browse your stuff while writing | on the note page |
| ✅ | **"gathered into"** — what pieces used this bit | on a bit's page |
| ❌ | **show a bit IN FULL in the writing** | the quote/image itself, not just its name. *The differentiator; the tap-peek already does the hard part* |
| ❌ | **quote PART of a bit** | you can't take one sentence of a long note, or a passage from a PDF |

## 2 · Connecting — the actions, by pair (owner's question answered 2026-09-02; supersedes the older matrix below)

| between | today | ruled, coming | open |
|---|---|---|---|
| **bit ↔ piece** | pull in (`[[`/drawer) · "pulled into" on the bit | the bit-block (shown in full) · pull from the floater | excerpt (part of a bit) |
| **bit ↔ board** | place · move · remove · call back | — complete | — |
| **bit ↔ bit** | same board · shared tag · co-pulled into one writing | — | the steering on-ramp to the connective note |
| **piece ↔ piece** | — | `[[` one into the other · the seeing-side list | how the seeing-side looks |
| **piece ↔ board** | place as card | auto-place at birth · distinct card · hide-pieces toggle | the card's look (mock) |
| **board ↔ board** | doorway (schema-ready, UI dormant) | — | when to surface |
| **anything** | shared tag · folder · find | "make this a board" from a tag | the graph (own round) · resurfacing (V2 doc) |

## 2-old · Linking — what can point at what *(the owner's "what should you be able to link, and where?")*

| from → into | a piece | a board |
|---|---|---|
| **a bit** | ✅ chip · ❌ shown in full | ✅ placed |
| **a board** | ❌ *(a door you tap — needs a small schema add)* | ✅ board-on-board |
| **another piece** | ⚪ **undecided** — your pitch-reuse case: writing a pitch from an old pitch | ✅ appears as a card |
| **a source** | ❌ *(link "from The Paris Review" inline)* | — |
| **a saved search** | ❌ *(a live list inside the writing)* | ⚪ a board is nearly this |

**Backlinks:** ✅ for bits (*"gathered into"*). ❌ for everything else in this table.

## 3 · Getting things OUT — the missing wall

| | thing | note |
|---|---|---|
| ❌ | **publish / share a piece** | **nothing.** The database door is open and proven; no button exists |
| ❌ | **save a piece as a PDF / file** | the gallerist's list of work · a portfolio · an EPK |
| ❌ | **print** | same problem |
| ✅ | export everything as data | `/api/export` — for you, not for handing to a person |

## 4 · Ordering & presenting

| | thing | note |
|---|---|---|
| ❌ | **put things in an order you choose** | a setlist · a track order · talk points · slides. *Not derivable from position — three tools proved that* |
| ❌ | **a deck / presentation** | frames in a sequence |
| ❌ | **select several things → make them one thing** | Figma/FigJam/Freeform/Notion all have this; we don't |

## 5 · Tables & fields — ⚪ THE OPEN QUESTION

Three distinct things, deliberately separated:
1. **A table inside a piece** (Docs-style) — §1. *Probably yes.*
2. **A table as its own bit** — a thing you put on a board. *Probably fine.*
3. **A whole "sheet" surface** — a third destination beside piece and deck. ⚪ **Imported from Docs/Sheets/Slides; never actually chosen.** May not be wanted at all.

**Fields on things** (a deadline · a status · a number): ❌ — the one real gap behind a gallery tracker. A bit already carries name, link, notes, tags, dates; **the missing piece is a date you set.**

## 6 · About a piece itself

| | thing | note |
|---|---|---|
| ✅ | title · dates · tags · trash | |
| ❌ | **what this piece is FOR** — who it's for, how long, by when | *"frame"* — the owner flagged this as the live one. Cheapest thing on this page; the only thing that would make a piece feel unlike a blank page |
| ❌ | **versions / drafts** | no evidence anyone wants it yet |
| ⚪ | **finished** — a status, and a room for finished work | the *pieces* idea; testable today with a `finished` tag |

## 7 · Things on this list with REAL evidence behind them

Not theory — each traces to something concrete:
1. **The doc isn't a real document** — the owner's own founding complaint, restated all session.
2. **You can't excerpt** — and PDF + audio bits **shipped last week**; a PDF is searchable by filename only. This is a live hole, not a hypothetical.
3. **Nothing leaves the app as a file** — the gallerist wants a PDF.
4. **There's no order** — the deck, the setlist.
5. **You can't publish** — flagged in `philosophy.md` as needing its own session, still true.

Everything else on this page is a good idea awaiting evidence.
