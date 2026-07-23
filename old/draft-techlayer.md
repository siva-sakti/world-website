# The Model — everything, top-down — ⚠️ SUPERSEDED by `draft-agreements.md`

> **This doc is retired (2026-07-20).** The owner–Claude working conversation re-derived and re-ruled the model in detail; the complete, current record — latest ruling wins — is **`draft-agreements.md`**. This file is kept as history only; where they differ, `draft-agreements.md` wins.

**What this is:** the single top-down picture of how the whole system works — every thing, its characteristics, every kind of connection, every surface, every flow — in plain language, with diagrams. Written so either of us can read it cold and hold the whole thing. Born from the owner–Claude talk-through of 2026-07-19 (D-059–D-064); **absorbs and supersedes `draft-datamodel.md`** as the map above `SPEC.md`. The SQL detail stays in `SPEC.md` + the migration; per-feature build detail stays in the plan docs. Written 2026-07-19.

*One name is still the owner's open pick (D-060): the tap-a-tag view — written as **the pull** below. (The doodle-words naming dissolved: that field is simply the bit's **content**.)*

**Status of this doc:** the **bit** is ✅ aligned & recorded to the T (owner–Claude discussion, 2026-07-20, D-065). The **board**, **tag categories**, and the downstream detail are ⏳ still in discussion — those sections are provisional until they get the same treatment.

---

## 0. The one-sentence version

Unnamed **bits** (thoughts) carry their own meaning (**tags**, **links**) and can sit on any number of named **boards** (arrangements) via **placements** — meaning stored once, layout free and repeatable, everything findable, nothing ever forced.

---

## 1. The five things

```
                the five things
  ┌──────────┬────────────────────────────────┐
  │  content │  bit        — the unnamed atom │
  │  space   │  board      — a named assembly │
  │  meaning │  tag        — a shared thread  │
  │          │  link       — a pointer        │
  │  layout  │  placement  — thing-on-board   │
  └──────────┴────────────────────────────────┘
```

### bit — the atom *(owner's word: fragment)* — ✅ aligned & recorded 2026-07-20

One small unit of thought or consumption. **Unnamed, on purpose** — a thought doesn't have to earn a title to exist. **Composed one at a time, always** — born free, or born on a **starting board**, in which case it also gets that board + a placement from birth.

**SUBSTANCE — what it is** *(mostly the machine's business)*

| holds | detail | who writes it |
|---|---|---|
| the thing itself | the typed words · the strokes (kept as vectors — crisp forever, recognition-ready someday) · the image file *(later: pdf · audio · url)* | me |
| type | text · drawing · image · link *(later: pdf · audio)* — the half the machine can tell on its own | system |
| **subtype** | cartoon · doodle · script · notes · diagram · … — **the half only I can give**; preset chips offered at ✓/drop, one tap, optional, editable later, my vocabulary | me |
| dates | created · last edited | system |
| privacy | **public by default, flat** (owner ruling 2026-07-20) — one-tap toggle to private, changeable anytime | system default · only me to flip |
| trash | soft-delete, recoverable until emptied deliberately | me deletes · system remembers |
| plumbing | permanent ID (the spine everything points at) · media facts (width×height, file name, format, size) · thumbnails · storage addresses — machine-made, invisible, regenerable where derived | system |

**MEANING — what I say about it** *(all optional, accumulates over its life)*

| holds | detail |
|---|---|
| **content** | the bit's words. Automatic for text (the words *are* it) · extracted title where mechanical (link, pdf, audio) · otherwise **I tell it** — type or dictate a line: *"cartoon of a girl who feels overwhelmed right now."* The searchable face; the phone keyboard's mic dictates it for free |
| tags | topics & associations. Redundancy with content is fine — two routes back beat one. Every application timestamped (feeds recency-first pickers) |
| links | **bare references, permanently** — "these pieces connect"; what the connection means is mine, held by what I build around it. No labels, no flavors (owner ruling). Timestamped |

**PRESENCE — where it lives** *(changes freely; never touches substance or meaning)*

- Appearances on zero, one, or many boards — per board: a position **and a size** (the same bit can be poster-sized on one board, a stamp on another). **Every arrival timestamped** → the original board and the order of its travels are derivable free, while the placements live. No separate origin field.

**Two v1 choices, made knowingly (2026-07-20):** **no edit history** — revise in place; trash protects deletes, not edits (a version log is addable later, no rework) · **two devices, same bit: last edit wins** — the right cheap answer for one human in one chair.

**Considered and rejected:** capture location (never asked for; wrong flavor for a private notebook) · a favorites field (significance = tagging) · link labels (a link is a hyperlink).

**Shown by** its content's first words anywhere a label is needed — search results, pickers, link sections, graph dots. **Never requires:** a title, a board, a tag.

### board — the named assembly *(its spatial mode is "canvas")*

A space you gather and arrange in. **The named thing** — a thing gets a name when it *becomes* an assembly. Multi-purpose by design: a creative playground, a topic consolidation, a staging ground for a piece you're writing — the system attaches no purpose to it, your tags say what it's for.

| characteristic | what it is |
|---|---|
| title | typed (so it's searchable); may *display* as your handwriting, with the typed title as its shadow beneath |
| two modes | **collection** (a gathered pile, no positions — quick, any device) → **canvas** (arranged spatially — the sit-down act) |
| tags | what it's about — this is what places it in a pull |
| stage | maturity (seed → … → fruit) — *later; shape still the owner's open question* |
| visibility | starts private, like everything |

### tag — the shared thread

Just a word: `astrology`. Flat, open, invented freely, applied by tap (or typed `#`). Its whole power: **many different things carry the same word** — that's what makes gathering possible. Renaming is always free and never touches the things tagged.

### link — the pointer

"This points at that." **Anything → anything** (bit↔bit, bit↔board, board↔board), never itself. **One record, read from both ends:** from A, `A→B` is a forward link; from B, the same record is a backlink. Not two features — two directions. **Bare, permanently** — no labels or flavors; a link just connects, and what the connection means is the owner's, held by the arrangement around it. Deliberate only; timestamped.

### placement — thing-on-board

Which thing — a bit, **or a board** (shown as a *board-card*: title, tap to enter; reference, not containment) — on which board, where (position optional: absent = collection/pile mode), **at what size**, arrived **when**. **Stores position, never meaning.** One thing → zero, one, or many placements. Live, never a copy: edit the bit and every placement shows the edit; remove a placement and the bit is untouched.

---

## 2. Who has a name

```
   NAMED                              UNNAMED
   boards   "Saturn & cycles"         bits — shown by their first words,
   tags     #astrology                       or their legend
```

Titles belong to assemblies — never demanded of a fragment. (This is why title-per-note tools chafed: they ask for the name before the thought has earned one.)

**Title ≠ tag.** A title is *one board's* unique, expressive name; a tag is the *shared* thread. "Saturn & cycles" contains no "astrology" — only its tag can place it in astrology's pull. Titles never silently become tags; when a title obviously matches an existing tag, the app may *offer* the tag in one tap.

---

## 3. The two layers — why editing once updates everywhere

```
                      a BIT
                        │
          ┌─────────────┴──────────────┐
       MEANING                       LAYOUT
  travels with the bit          lives per-board
  (the "Obsidian" part)        (the "Freeform" part)
        │                              │
   ┌────┴─────┐                 ┌──────┴───────┐
  tags      links             boards  +  placements
 (about)  (points at)        (spaces)   (where it sits
 content                                  on each one)
 (its words)
```

Tag and link a thought **once** — its meaning. Then arrange it **anywhere**, on as many boards as you like. Move it, resize it, re-board it all day: its meaning never changes. Edit its words once: every board shows the edit. Meaning stored once, layout free and repeatable — the whole differentiator in one line.

---

## 4. The three kinds of connection

| kind | it says | recorded as | made by |
|---|---|---|---|
| **tag** (shared) | "these are about the same thing" | the same word carried by many things | one tap |
| **link** (pointer) | "this points at that" | one link record (read from both ends) | the connect picker, or drag on canvas |
| **placement** (spatial) | "this lives here" | the placement itself | dropping a bit onto a board |

**One fact, one record.** Being on a board *counts* as a connection and shows up everywhere connections show up — but it never writes a duplicate link record. Shared tags connect implicitly — no record at all, just the shared word. The **graph** draws all three kinds as lines.

---

## 5. The surfaces — where you meet the system

```
  capture ──────▶  the heap (every bit, findable by its words)
                       │
      ┌────────────────┼─────────────────────┐
      ▼                ▼                     ▼
   a BOARD         the PULL              FIND (search)
   arranged        (tap a tag —          words + tag
   by you          automatic,            filters
      │            complete)                 │
      └────────┬───────┴─────────────────────┘
               ▼
        a BIT's own page
   (its words · tags · boards · links, both directions)
```

- **A board** — where you arrange and think. Entirely yours, entirely chosen.
- **The pull** — tap a tag: *everything* carrying it, bits **and** boards, gathered automatically. Never hand-curated — completeness is its whole value; it must catch what you forgot, so it must not be able to lie. It is not a board and not a thing you manage.
- **Find** — search across all words (bit bodies, legends, board titles) plus tag filters (include/exclude). Results come in three kinds: topics, boards, bits.
- **A bit's own page** — a simple page (not a canvas): the bit plus everything connected to it. One of several payoff surfaces — alongside find, the pulls, and boards themselves — the per-thought one:

```
┌─ one bit ────────────────────────────────────┐
│  "jupiter returns every 12 years, which      │
│   means the year I..."                       │
│                                              │
│  tags:        #astrology   #cycles           │
│  on boards:   Retreat notes · The Piece      │
│  links to:    "saturn is more about..."      │
│  linked from: "my 24th year felt like..."    │
│               ⌇ retreat doodle ("the wheel") │
└──────────────────────────────────────────────┘
```

- **The graph** — the map view: dots (bits, boards, tags) and lines (all three connection kinds). Local neighborhood first; for wandering, not querying.
- *(Later phases: phone capture; the browse/resurface feed — the one deliberately designed surface.)*

---

## 6. The flows — gesture by gesture

**Capture.** Think → jot → done.
```
a thought  ▶  a bare bit   (no board, no tag, no title — nothing demanded)
```
Findable by its own words from that moment on.

**Tag.** Select a thing → `#` → tap a word (or make a new one). Context supplies the tag whenever it can:
```
writing inside a pull        ▶  bit born already tagged
board created from a pull    ▶  board born already tagged
board created cold           ▶  one tap
```

**Connect.** One picker for everything — `[[`, `@`, a "connect" affordance, all open the same thing:
```
one picker: topics first, then bits and boards
   pick a TOPIC   ▶  that's a tag        (same act as tagging)
   pick a BIT     ▶  that's a link
   pick a BOARD   ▶  that's a link
```
On the canvas there's a second gesture for the same thing: drag from a bit's edge onto another bit — a link, drawn as a line that follows them.

**Handwrite.** Pen → draw → Done → one doodle bit — then *offered*, never required, a **legend**: a few typed words so the drawing can be found. The same pattern covers handwritten board titles: your hand on top, the typed title beneath as its searchable shadow.
```
THE TYPED-SHADOW RULE
beautiful for your eyes  ·  a few typed words for the machine
```

**Place.** Drag a bit onto a board → a placement. The same bit can sit on other boards too. Take it off a board — the bit is untouched, still in the heap, still tagged, still linked.

**Return** *(the point of it all)*. Months later → tap a tag → the pull: both boards, the loose bits, a doodle you'd forgotten sitting next to the thought it rhymes with → drag two things onto a fresh board → write.

---

## 7. The standing rules

1. **Nothing is ever forced** — no required titles, tags, subtypes, or content lines. Ceremony is a bug.
2. **One fact, one record** — a connection is never stored twice.
3. **Ink carries words, optionally** — a drawing's *content* line and the typed shadow under a handwritten board title make the hand findable; never required.
4. **Automatic surfaces never lie** — the pull is complete, or it's broken.
5. **Meaning travels with the bit; position stays with the board.**
6. **Edit once, changed everywhere** — placements are live references, never copies.
7. **New things start public** *(owner ruling 2026-07-20 — supersedes the earlier start-private stance; the per-thing toggle is one tap; nothing is visible to anyone until the sharing phase ships, and a review of everything marked public gates the first real publish).*
8. **Everything is exportable, always** — and deletes are recoverable (trash) until emptied deliberately.
9. **Renames are free** — tags and titles can change without touching anything tagged or placed.
10. **One clock** — every record keeps when it was born (and last touched, where editable), stored one standard way, shown in local time; every ordering anywhere derives from these stamps.
11. **Truth vs regenerable** — everything stored is either *truth* (the owner's acts — irreplaceable, all of it in the export) or a *machine artifact* rebuildable from truth (thumbnails, search indexes, extracted titles). Nothing else is ever stored.

---

## 8. Still open — the discussion queue

- **The board's full round** — same treatment the bit got: title, tags, stage (ordered — its shape), the two modes, pile-order in collection mode, board defaults (does a starting board carry birth-context — tags? — now that privacy went flat).
- **Tag categories** — form dissolved into subtype; what remains of the categories instinct (topic · source · nature?) — owner's round.
- The word for the tap-a-tag view: **pull** *(recommended — the philosophy's own verb)* · gathering · accumulation.
- `philosophy.md`'s "new things start private" line — superseded by the public-default ruling; the owner rewrites it in their own voice.
- The walkthrough scenarios — owner's reactions pending; then `draft-walkthrough.md` gets written and tests everything here.

---

## 9. Where the detail lives

`SPEC.md` (schema + per-surface rules) · `draft-plan-tags.md` / `draft-plan-links.md` / `draft-plan-knowledge.md` (per-piece build plans) · `draft-walkthrough.md` *(next: the real-life scenes that test everything above)* · `PROGRESS.md` D-059–D-064 (the decisions behind this doc) · `draft-vetting-technical-layer.md` (the proof process + ledger).
