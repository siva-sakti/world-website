# The ruling register — every decision, numbered

> ## The parallel-check instrument (owner-asked, 2026-09-02)
> **Purpose:** a systematic inventory of every ruling made about the composition, extracted from the conversation trail — so the spec can be checked against it rather than against memory. *The owner: "here's all the things we need to know, as a parallel check for this process."*
> **How to use:** each ruling has an ID, a statement, and where it must appear. **Re-run the check after any spec change.** A ruling with no spec home is a defect.
> **Source of truth for the rulings themselves:** the trail (`composition-base-spec.md`, the walk stations, the N-answers). This register restates; it never decides.

**Legend:** ✓ = verified present in `composition-spec.md` · ○ = belongs to an unwritten Part (III–V) · 🔵 = Claude's, marked as such · ⚑ = owner stamp still pending

## A · Concept
| # | ruling | in spec |
|---|---|---|
| A1 | The motion is a **rhythm** — diverge↔converge repeatedly, never one-way | ✓ §2 |
| A2 | **Both surfaces are formats**: board = spatial, composition = linear | ✓ §2 |
| A3 | Creation is **absolutely deliberate** — "it could never just happen" | ✓ §3.2, §4.4 |
| A4 | **Privacy is not part of the concept** — its own session | ✓ §2 (absent by design), §12.2b |
| A5 | **North star:** "Notion, with Obsidian-like knowledge connection and graph capabilities" | ✓ §2 |
| A6 | The legibility line is **teaching material**, not a build constraint | ✓ §2 + `teaching-the-user.md` ⚑ |

## B · Model & laws
| # | ruling | in spec |
|---|---|---|
| B1 | **Content law:** content = bits (one shared roster); structure = formatting. A **premise, not dogma** — exceptions need an owner ruling | ✓ §3.4 |
| B2 | **Flatness:** only compositions weave; bits never reference | ✓ §3.1, §3.4 |
| B3 | **Direction:** boards hold, compositions are held; **mention ≠ containment** (plain hyperlink legal) | ✓ §3.4 |
| B4 | **Fixed kind** — no conversion, ever | ✓ §3.4 |
| B5 | **Silent bit-hood** — pulled things render as normal content; powers on tap/hover only | ✓ §3.4, §9.6.5 |
| B6 | **The four dimensions** — content · structure · relation · organization | ✓ §3.2 |
| B7 | **Bit roster:** text · image · drawing · audio · PDF · link; candidates video · file. ⛔ table is formatting, not a type | ✓ §3.1 |

## C · The fabric
| # | ruling | in spec |
|---|---|---|
| C1 | **composition → composition: YES** ("the basic Obsidian") | ✓ §9.3 |
| C2 | **board inside a composition: RULED OUT** | ✓ §3.4, §9.2.4 |
| C3 | **bit ↔ bit: no fourth mechanism**, deliberately | ✓ §3.1 (flatness) |
| C4 | **board → composition: single-channel** — holding as a card only | ✓ §10 |
| C5 | board↔board doorway is a **placement**; the reverse view is parked | ✓ §12.1b.6 (boards have no backlink surface) |
| C6 | A composition sits on **many boards**, each placement independent | ✓ §10.2.3 |
| C7 | **Cardinalities:** all many-to-many except **one folder per thing** and **one source per bit** | ✓ §12.3 (folder) · ○ (source — Part III) |
| C8 | The self-doorway guard **already exists** in the schema (a Claude "find" that wasn't one) | ○ Part III |

## D · Birth & frames
| # | ruling | in spec |
|---|---|---|
| D1 | **Born on first body content** — title alone never births | ✓ §4.1.3 |
| D2 | Three doors: write page · board compose-door · templates *(a mode, not a door)* | ✓ §4 |
| D3 | The compose door is **distinct from + text** (which makes a bit) | ✓ §4.2.1 |
| D4 | **Auto-place** on the birth board | ✓ §4.2.5 |
| D5 | **Evaporate:** nothing exists until content; once it exists it stays until trashed; the birth-placement goes with it | ✓ §4.1.6, §4.2.7 |
| D6 | Card → **floater** (default) → panel → page; list/search → page; chip → peek; **phone → page only** | ✓ §5 |
| D7 | **Many floaters** allowed | ✓ §5.1 |
| D8 | ⛔ **Nothing floats on a composition** | ✓ §3.6, §13.2.2 |

## E · Writing
| # | ruling | in spec |
|---|---|---|
| E1 | Debounced save + flush on leave/hide/close; **never silent failure** | ✓ §6 |
| E2 | **Title minted at exit only**, fixed date-time format, replaceable; the one machine-write exception | ✓ §7 |
| E3 | A composition holds **job facts** — word target · due date · who it's for. ⛔ not a task manager | ✓ §8 |
| E4 | **Wrap yes, float no** | ✓ §13.2.2 |
| E5 | **Text alignment** is owed | ✓ §13.2.1 |

## F · Pulling in
| # | ruling | in spec |
|---|---|---|
| F1 | `[[` opens a **search picker, two sections** (material · compositions) | ✓ §9.2 |
| F2 | **Archived excluded** from the picker | ✓ §9.2.4 |
| F3 | **Boards never** appear in the picker | ✓ §9.2.4 |
| F4 | **Born as a chip**; images/drawings born as **blocks** | ✓ §9.3 |
| F5 | The chip is an **atom**, shows the **live** face; the stored copy is a shadow for search/export | ✓ §9.4 |
| F6 | **Peek** on tap; "show in place" converts to a block; reversible | ✓ §9.5, §9.6.4 |
| F7 | Block is **preview-sized**; full only when small; images sized per instance, carrying bit-hood | ✓ §9.6 |
| F8 | 🔵 Blocks render **one level deep** (recursion guard — Claude's, unstamped) | ✓ §9.6.3 |
| F9 | The **drawer** + its **"in this piece"** tab, readable in full | ✓ §9.7 |
| F10 | **Copy-paste carries chips**; the destination mints its own row | ✓ §9.4.5 |
| F11 | **No create-on-miss** — reopened as a candidate *if* it asks which kind | ✓ §9.2.6 |
| F12 | **Source offered at minting**, never required | ✓ §13.5.2 |

## G · States
| # | ruling | in spec |
|---|---|---|
| G1 | **Archive is read-only**; one "bring back to edit" tap revives | ✓ §11.2 |
| G2 | Trashed: frozen; **card vanishes**, returns to place on restore; **restore returns it whole** | ✓ §11.3 |
| G3 | Chips of trashed targets **freeze**; of archived targets **grey but stay enterable** | ✓ §9.8, §11 |
| G4 | ⚑ The **archived card** greyed/present/openable — proposed, never stamped | ✓ §11.2 (marked ⚪) |
| G5 | Destroy only by **emptying the trash**; chips degrade to plain text | ✓ §11.4 |
| G6 | **Search excludes archived by default, with a toggle to include** | ✓ §11.2, §12.1.4 |

## H · The board side
| # | ruling | in spec |
|---|---|---|
| H1 | The piece-card must look **visibly different** from a bit-card | ✓ §10.1.1 |
| H2 | ⚪ Its look (title only vs title + opening lines) — **decided by specimen** | ✓ §10.1.2 |
| H3 | **Hide-pieces toggle**, per board, presentation-only | ✓ §10.3 |
| H4 | A composition is **never "loose"** | ✓ §10.2.5 |

## I · The editor
| # | ruling | in spec |
|---|---|---|
| I1 | The **v1 block set** (incl. checklist, table, toggle) | ✓ §13.1 |
| I2 | **Toggles IN** — collapsed content stays **searchable**; a hit auto-unfolds | ✓ §13.7 |
| I3 | **Callouts OUT** — and the **boards test** it produced | ✓ §13.8 |
| I4 | The **eight interaction musts** + the known traps | ✓ §13.3 |
| I5 | **Floater = basic toolkit; panel + page = full** | ✓ §13.4 |
| I6 | **"Make this a bit"** from a selection; the text stays; ⚪ subtle underline mark | ✓ §13.5 |
| I7 | ⛔ **No auto-minting** from pasted content | ✓ §3.4, §13.6 |
| I8 | One **shared editor** — a capability added appears in both surfaces | ✓ §13 preamble |

## J · Cross-cutting
| # | ruling | in spec |
|---|---|---|
| J1 | Search covers **bits + compositions**, kind-filtered; **boards never** (jump-to is their door) | ✓ §12.1 |
| J2 | ⚠ **The search index must move** with compositions or they vanish from search | ✓ §12.1.5 |
| J3 | **Backlinks, full treatment** — a clickable panel + a graph view (Obsidian-style) | ✓ §12.1b |
| J4 | Tags · folders · star — identical to everything else | ✓ §12.2–12.4 |
| J5 | **Export lockstep (I-G1)** in the same migration | ✓ §12.5 |
| J6 | **Visibility:** controls in the UI; composition **born private**; a bit's private mark is **GLOBAL**, never per-board | ✓ §12.2b |
| J7 | **Rename ripple:** display live, stored copy stale until next save (search/export only) | ✓ §9.4.6 |
| J8 | The **pull** returns all kinds; ⚪ whether it gains kind-filters | ✓ §12.7 |

## K · Beyond this spec — recorded elsewhere, deliberately
| # | ruling | home |
|---|---|---|
| K1 | **The three tiers** (functional floor · identity · shelf) | ○ Part V |
| K2 | Existing notes **flip private** at migration | ○ Part IV |
| K3 | Old chips inside bits + note-sources: **cleaned up** (owner: test data, expendable) | ○ Part IV |
| K4 | **Excerpt + make-this-a-bit + PDF/audio passages = ONE design** | ✓ §13.5b (F-listed) · ○ enactment |
| K5 | Owner-wanted F-features: **version history** · duplicate · write-about-this · board-peek · resurfacing | ✓ §13.5b |
| K6 | The **code-window handoff** (checklist · table · file bit) | `editor-formatting-and-file-bit-plan.md` |
| K7 | **Terminology discipline** — "composition" consistently until naming | ✓ §1, §3.3 |
| K8 | **Storage shape** — owner's lean: compositions get their own home, peers of boards | ○ the backend session |

---
## Coverage
**A–J: 61 rulings, 61 present.** K: 8 items, 5 in the spec, 3 correctly awaiting unwritten Parts.
**Known gaps are all ⚪-marked in the spec, not missing:** the card's look · the archived card's stamp · the block's PDF/audio form · picker-searches-bodies · drawer-in-floater · `[[`-in-title · image size control · toggle's hidden-count · hide-toggle persistence · the date format · pull kind-filters.
