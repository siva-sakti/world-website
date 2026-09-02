# The composition — the specification

> ## STATUS · in progress, written section by section with the owner (started 2026-09-02)
> **This supersedes `composition-technical-spec.md`** when complete; that file and `composition-base-spec.md` retire to trail-status. Nothing here is invented: every ruling carries its provenance, and anything unruled is marked ⚪ inline rather than smoothed over.

---

# PART I · FOUNDATIONS

## 1 · How to use this document

**Who it's for:** whoever builds this feature — including a future session with no memory of the conversations behind it.

**What it is:** the complete, current specification of the composition — the app's convergent surface. It states what is true, what is ruled, and what is open. **It does not argue.** The reasoning lives in the trail documents (§1.3).

**How to read the marks:**
- **RULED** — the owner decided it. Provenance in *(parentheses italic)*.
- 🔵 — Claude's design proposal, accepted in substance but not separately stamped.
- ⚪ — **genuinely open.** Do not build past a ⚪ without the owner.
- ⛔ — deliberately excluded. Not an oversight; do not "fix" it.

**Provenance discipline — how this document guards against invention:**
Every claim here traces to one of four sources: **an owner ruling** (quoted or dated) · **shipped code** (verified in the repo) · **a Claude proposal, marked 🔵** · or **⚪ open**. A claim with no source is a defect. *(This discipline exists because an audit on 2026-09-02 found three Claude inventions written as settled: the recursion guard, the silent-bit-hood forbidden-list, and the drawer's focus requirement — all now marked 🔵.)*

**The verification pass (owner-set method, 2026-09-02):** when this document is complete, **every claim is traced back to its source in one systematic pass** — ruling, code, or marked proposal. Claims that cannot be traced are corrected or marked ⚪ before the spec is called done. *The owner: "it might take a bit of tokens, but to me it's worth it."*

**The three rules for anyone extending this document:**
1. **Amend in place.** Never add a contradicting layer below. *(This rule exists because it was broken — see `aerial-review-findings.md`.)*
2. **Every ruling names its owner.** If you cannot say who decided something, it is ⚪ or 🔵, never RULED.
3. **When a ruling changes, mark what it supersedes** in the same edit.

**1.3 · Where the reasoning lives**
| for | read |
|---|---|
| the concept, in the owner's voice | `composition-definition.md` |
| what a person must learn | `teaching-the-user.md` |
| the moments of use (S1–S13) | `integration-scenes.md` |
| deferred ideas (F-1…F-9) | `future-features.md` |
| the audit that shaped this doc | `aerial-review-findings.md` |
| the historical trail ⚠ contradictory | `composition-base-spec.md` |

## 2 · The concept, in brief

The app serves a **rhythm: diverge → converge → diverge**, never a one-way arrow *(owner, station 1)*. Material is caught as **bits**. It is spread and thought with in space on a **board**. It is synthesized into words in a **composition**.

**Both surfaces are formats with different powers** *(owner, station 1)*: the board is the **spatial format** — free position, arrange anything. The composition is the **linear format** — sequence, structure, a throughline.

**The composition is convergence made legible:** a board's arrangement speaks mostly to its maker; a composition can be read by anyone, including future-you. *(This sentence is teaching material, not a build constraint — `teaching-the-user.md`.)*

**Why it exists at all:** the app built its divergent half well and converged into a text box. The positioning claim — *"we accommodate the process of getting from divergent to convergent"* — rests on this half.

## 3 · The model

**3.1 · The three things**
- **bit** — material. One thing you caught or made: text · image · drawing · voice recording · PDF · link *(candidates: **file** · **video**. ⛔ Not `table` — a table is formatting; a text bit can contain one.)*. **Flat: a bit never references anything.** *(the flatness call)*
- **board** — a spatial surface. Holds material by **placement** (a position).
- **composition** — a linear surface. Holds material by **reference** (pulled into the writing).

**3.2 · The four dimensions** *(the complete model in one frame — station 2)*

| dimension | what it is | for a composition |
|---|---|---|
| **CONTENT** | the things themselves | your words + bits pulled in (one shared roster) |
| **STRUCTURE** | how a surface groups its content | **sequence** — headings, lists, order *(a board's is **position**)* |
| **RELATION** | how things point at each other | references (pulled in) · placements (held by boards) |
| **ORGANIZATION** | how you categorize across everything | tags · one folder · star · search |

Four dimensions, no overlaps. Every feature in this spec belongs to exactly one.

**3.3 · The vocabulary** *(used throughout; the user never meets these words — see `teaching-the-user.md` §4)*

| term | meaning |
|---|---|
| **face** | a bit's computed headline: the owner's caption → else its first words → else nothing (visual bits stand in with a thumbnail) |
| **chip** | the inline pill a pulled-in thing becomes in the writing; shows the target's face. *Shipped Aug 2026.* |
| **peek** | tap a chip → a floating glimpse of the target beside it, with a door to open it. *Shipped Aug 2026.* |
| **block** | a pulled-in thing rendered **in place** in the flow — preview-sized. *Ruled, unbuilt.* ⚑ *the word is overloaded (Notion's paragraph word) — naming session item.* |
| **frame** | ⛔ **not used in this spec.** The word belongs to the board's alignment feature (other track). |

**3.4 · The laws**

| law | statement | source |
|---|---|---|
| **content/structure** | Content is bits — **one roster shared by both surfaces**: anything placeable on a board is pullable into a composition. Structure (headings · lists · checklists · tables) is **formatting** — it lives in the editor and is never a bit. **This is a premise, not dogma** — but an exception requires the owner's explicit ruling, recorded here; a builder never takes one unilaterally. | owner |
| **flatness** | Material is flat; **only compositions weave.** A bit referencing bits would be a composition wearing the wrong label. | owner |
| **direction** | **Boards hold; compositions are held.** A composition never contains or references a board. **Mention is not containment** — a plain hyperlink to a board remains possible: it is an **ordinary editor link** (the link mark that already exists), **not a feature to build**, and it creates **no stored tie, no backlink, no graph line.** | owner |
| **deliberateness** | A composition is **never** auto-created. The board catches material by default; making a composition is always an act. Pasting into writing stays mere content — never auto-minted as a bit. | owner |
| **fixed kind** | A thing's kind is set at birth and never converts: bit ↮ composition ↮ board. | D-121 |
| **silent bit-hood** | In the writing, a pulled-in thing **renders as normal document content** — an image looks like an image, a quote reads as a quote. 🔵 **Forbidden: badges, borders, icons, or any persistent marker distinguishing pulled-in content from typed content.** *(The rule is the owner's — "it could be annoying for everything to be in this bit shape"; this specific forbidden-list is Claude's operationalisation of it.)* Its bit-life (source · tags · where else it lives) appears **only** on tap or hover. | owner |

**3.5 · What a composition IS — the definition**
> A **document you write.** Made of your words, with captured things pulled into the writing. It is **made, never captured** — it can never just happen. It always appears in your compositions list. It can sit on many boards as cards. It is not a bit and never becomes one.

*(§2 gives the concept; this is the operative definition. Where they differ in wording, this one governs.)*

**3.6 · What it is NOT** ⛔
Not material · not a container things are placed *onto* (*"text-forward, like Notion"*) · not convertible to or from a bit · never auto-born · not a task manager — **though it holds facts about its own job** (a word-count target · a due date · who it's for), specified in Part III's lifecycle section *(owner: "that kind of project management layer")*.

---

# PART II · THE FLOWS

*Every step of every path, exactly. "Nothing exists" means no database row. ⚪ = genuinely undecided.*

## 4 · Birth

### 4.1 From the write page
1. Owner opens the write page. Editor renders empty, **focused**. Title field empty, no placeholder text.
2. **Nothing exists.** No row.
3. Owner types the first character **in the body** → **the composition is created**: one row (state `live`, visibility `private`, title `null`, body = that character). *(Title alone never births it — typing only in the title creates nothing.)*
4. From here: §6 saving.
5. It appears in the compositions list immediately on creation.
6. **On leaving with a still-empty body** → nothing was ever created; nothing to clean up.

### 4.2 From within a board — the compose door
1. Owner taps **compose** on the board toolbar. *(Distinct from `+ text`, which makes a bit.)*
2. **The floater opens** over the canvas — the board stays visible and interactive behind it. ⚪ *opening position: centred in viewport / near the toolbar / last-used position.*
3. Floater contents: title field · body editor (focused) · **basic toolbar only** (§8.2) · close control. ⚪ *whether it also shows a save indicator — see §6.4.*
4. **Nothing exists** until the first body character.
5. On first body character → **two rows created together**: the composition, and its **placement on this board** *(auto-place, owner-ruled)*.
6. The card appears on the board immediately, at ⚪ *a clear spot found by the existing find-a-clear-spot logic — confirm this is the right placement rule.*
7. **On closing with an empty body → nothing was ever created**: no composition row, no placement row, no card. *(The evaporate rule; the placement cannot orphan because it was never written.)*

### 4.3 Templates — a mode, not a door *(future, T3)*
At either door above, the owner may choose **blank** *(today's only option)* or **a template** — a composition that opens pre-shaped. Entrances are unchanged.

### 4.4 What can never create a composition ⛔
Pasting · importing · the system · any automatic path. **No exceptions.**

## 5 · Opening an existing composition

| from | opens | notes |
|---|---|---|
| **its card on a board** | the **floater** | the default; board stays live behind |
| the floater's dock control | the **side panel** | board still visible, narrower |
| either frame's expand control | the **full page** | leaves the board |
| the compositions list · search results | the **full page** directly | no board context to preserve |
| a **chip** in some writing | the **peek** first; the peek's door opens the full page | reading is not interrupted |
| **on a phone** | the **full page**, always | no floater, no panel |

**5.1 · Multiple open at once:** allowed — several floaters may be open on one board *(owner-ruled)*. ⚪ *the same composition open in two frames simultaneously: undesigned (the frame-handoff problem). Until designed, the second open should ⚪ focus the existing frame rather than open a duplicate.*

## 6 · Writing and saving

1. Typing updates the body locally; **nothing is written immediately**.
2. **350 ms after the last keystroke**, the body is written *(existing debounce)*.
3. On the same write, **references reconcile**: the chips currently in the body become the composition's reference rows — added and removed to match *(existing mechanism)*.
4. The save is **also flushed** on: leaving the page · the tab being hidden · the app being switched · the window closing *(existing save-guard)*.
5. Status shows **"saving…" → "saved"**; on failure, a visible error — **never silent** *(house rule)*.
6. ⚪ **The floater and side panel need the same status indicator.** Unspecified today; without it, a failed save in a floater is invisible.

## 7 · The title

1. Editable at any time, in any frame.
2. If empty when the owner **leaves or closes** the composition → the app **writes** a title in a fixed date-time format *(owner-ruled: minted at exit, never on entry, never on autosave)*.
3. That minted title is **an ordinary title** — replaceable forever, no special state.
4. ⚪ **the exact format string** (e.g. `Sep 2, 9:41 AM`).
5. ⚠ This is the one place the app writes into an owner-owned field. It is a **ruled exception** to *the machine never writes your words*.

## 8 · What a piece knows about its job *(owner-ruled: "that kind of project management layer")*

A composition may carry: **a word-count target** · **a due date** · **who it's for**.
- All three are **optional**; a composition with none is normal and complete.
- The **word count is always shown**; the target, when set, is shown against it. ⚪ *where: the footer / near the title / the editor's edge.*
- ⚪ **Does the due date surface anywhere outside the piece** (the compositions list, home)? *If yes, this becomes a scheduling feature; if no, it is a note-to-self.* **This is the line between "a piece knows its job" and "a task manager" — and it needs the owner's word.**
- ⛔ Not: assignees · statuses · reminders · notifications.

## 9 · Pulling things in

*The one act with two doors: `[[` when you know what you want; the drawer when you want to look.*

### 9.1 The `[[` trigger
1. Typing `[[` in the body opens the **picker** at the caret. The two characters are consumed by the trigger, not left in the text.
2. Every character typed after the trigger filters the picker; **Backspace past the trigger closes it**, restoring nothing to the text.
3. **Escape** closes it, inserting nothing.
4. ⛔ The trigger does **not** fire inside a code block.
5. ⚪ Whether `[[` also triggers in the title field. *(Default: no.)*

### 9.2 The picker
1. Two sections, in this order: **your material** (bits), then **your compositions**. Section headers always shown, even when one section is empty.
2. **Ordering within each section:** most recently touched first, before any query is typed.
3. **Matching** follows the app's one search rule *(word-start matching; `lib/search-query`)*, applied to a bit's **face** and a composition's **title**. ⚪ *whether composition bodies are also matched — bodies are large; default: title only.*
4. **Excluded, always:** trashed things · **archived things** *(owner-ruled)* · the composition being written (no self-reference) · **boards** *(direction principle — boards never appear)*.
5. **Visual bits** (image, drawing) show a thumbnail in the row; others show their face.
6. **No matches:** the picker shows an empty state and **offers nothing** — ⛔ it does not offer to create anything. *(Create-on-miss is ⚪, unbuilt: if ever built, it must ask which kind — bit or composition.)*
7. **Selection:** Enter or click inserts at the caret and closes the picker. The caret lands **immediately after** the inserted thing.

### 9.3 What gets inserted
| target type | inserted as | why |
|---|---|---|
| text bit · link bit · PDF · audio | **a chip** | born small; the sentence stays a sentence |
| **image · drawing** | **a block** | you pulled in a picture to see it |
| a composition | **a chip**, styled distinctly from a bit-chip | it is a whole piece, not a scrap |

### 9.4 The chip
1. **An atom**: one indivisible unit. Backspace deletes the whole chip, never characters of it. It cannot be edited in place.
2. **Renders the target's CURRENT face**, fetched live. *(The face text also sits in the stored body — for search and export only. Display never uses the stored copy.)*
3. **Tap** → the peek (§9.5). A chip does **not** navigate on tap.
4. **Undo** removes it like any editor content; the reference row disappears at the next save's reconcile.
5. **Copy/paste** carries it; the destination composition mints its **own** reference row on its next save.
6. **The same target pulled in twice** → two chips, **one** reference row. Removing one chip while the other remains leaves the row intact.

### 9.5 The peek
Opens beside the chip, without moving the writing. Contents:
- the target's face · a glimpse of its content *(text: an excerpt · image/drawing: the picture · audio: ⚪ a player or a static row · PDF: ⚪ first-page thumbnail or filename)*
- its **source**, if it has one
- **"open →"** — opens the target's own page (full page)
- **"show in place"** — converts the chip to a block (§9.6)
Tapping anywhere else closes it. ⛔ The peek never edits the target.

### 9.6 The block
1. Created by "show in place" from a peek; **images and drawings arrive as blocks directly** (§9.3).
2. **Renders preview-sized by default; full only when full is small:**
   - **image / drawing:** shown, sized per instance (⚪ the size control's form), **text wraps around it; it never floats** *(owner-ruled)*
   - **short text bit:** its content, whole
   - **long text bit:** its first lines, with an expand control
   - **PDF / audio:** ⚪ undesigned — a titled row, a thumbnail, or a player
3. 🔵 **Renders one level deep only.** Chips inside a block's content stay chips and never expand. *(Prevents infinite recursion when A blocks B and B chips A.)* **Claude's rule, found in the procedural pass — never owner-stamped.** Mandatory on technical grounds; flagged so it is not mistaken for a ruling.
4. Carries a control to **tuck back to a chip**. Reversible forever, per instance.
5. **Silent bit-hood applies:** no badge, border, or icon marks it as pulled-in content. Its bit-life appears on tap/hover only.

### 9.7 The drawer (the second door)
1. Available on the composition's **page and side panel**. ⚪ *whether it fits in the floater at all.*
2. Tabs: **bits · compositions · all**, plus **"in this piece"**.
3. **"In this piece"** lists everything this composition currently references, each **readable in full** in the drawer — so long material stays cropped in the flow but whole at your side.
4. **Clicking any row inserts it at the caret**, exactly as picker selection does (§9.2.7). 🔵 The row must not steal focus from the editor — the caret survives the click. *(Claude's implementation requirement, from the N4b build's known risk; not an owner ruling.)*
5. Same exclusions as the picker (§9.2.4).

### 9.8 Pulling in — the edge cases
| case | behavior |
|---|---|
| the target is trashed after being pulled in | the chip **greys and freezes**; tapping says *"this is in your trash — bring it out to see it"* with a restore door. The writing is unchanged. |
| the target is archived after being pulled in | the chip **greys but stays enterable**; tapping opens it, clearly marked archived |
| the target is destroyed (empty-trash) | the chip **degrades to plain text** of its stored face; the reference row is gone; the sentence still reads. *(Not a design decision — a consequence of the chip's stored text BEING its label, by construction since the Aug 2026 gather build.)* |
| the composition itself is trashed | its chips elsewhere freeze (as above); its own content is untouched |
| a chip is deleted from the body | the reference row is removed at the next save |
| the save fails mid-reconcile | the body is the truth; references re-derive on the next successful save *(self-healing)* |
| ⚪ a bit that already contains chips (historical) | migration cleans them up — the owner has ruled her existing data expendable |

## 10 · On a board

### 10.1 The card
1. A placed composition renders as a card on the canvas, **visibly different from a bit-card** *(owner-ruled; the difference must be legible at a glance)*.
2. ⚪ **What it shows: its title only, or its title plus the opening lines of the writing?** *(Today's built behavior is title + a faint preview. Decided by a specimen, not argument — the code window builds two and the owner points.)*
3. ⚪ Whether the card is resizable, and whether size changes what it shows.
4. **Tap → the floater opens** (§5). The card does not navigate away.
5. Otherwise it behaves as any card: moved, selected, marquee-selected, moved together with others.
6. ⚪ **Connectors (arrows) to a composition's card** — the connector feature is unbuilt and parked; if ever built, a composition's card is an ordinary card and participates.

### 10.2 Placement
1. **At birth from a board:** placed automatically on that board *(owner-ruled)*.
2. **Later:** from the composition's own page, "place on a board…" — offering only boards it is not already on.
3. **On many boards at once:** each placement independent — its own position, its own card. Un-placing from one leaves the others untouched.
4. **Un-place** removes the card from that board; the composition is unaffected and remains in the list. The placement record survives *(travel history — I-L2)*.
5. ⛔ **A composition is never "loose."** Un-placed from everywhere, it lives in the compositions list — it never appears in the bits inbox.
6. ⚪ Where a newly-placed card lands *(the existing find-a-clear-spot logic is the presumed answer)*.

### 10.3 The hide-pieces toggle *(owner-ruled)*
1. A per-board control hides **all** composition-cards on that board.
2. **Presentation only:** placements are untouched; the compositions stay placed and related; nothing is un-placed, moved, or deleted.
3. Purpose, in the owner's words: *"if you just want to compose but don't want to see them on your surface, and you want them to be linked and related."*
4. ⚪ Whether the toggle's state persists per board (stored) or is per session (local).

## 11 · States

*Three mutually exclusive states, inherited from the app's existing resting model (D-127): **live · archived · trashed**.*

### 11.1 Live
The default. Appears in the compositions list, in search, on its boards, and in the picker.

### 11.2 Archived — **read-only** *(owner-ruled)*
| aspect | behavior |
|---|---|
| the composition | opens **greyed and readable; not editable** |
| returning to work | one visible **"bring back to edit"** control → returns to live |
| its **chips** in other writing | greyed, **still enterable** — tapping opens it, clearly marked archived |
| its **card** on boards | ⚪ *proposed: greyed, present, still opens — matching its chips. Never stamped.* |
| the `[[` **picker** | **excluded** *(owner-stamped)* |
| **search** | **excluded by default, with a control to include the archive** *(owner-ruled 2026-09-02: "should it just be with active, that you can turn on allowing to bring things in from the archive?")*. Matches archive's meaning — out of the active world, not out of existence — and makes returning deliberate, the same principle as the picker's exclusion. |
| the compositions list | out of the main view; reachable through the archive |

### 11.3 Trashed
| aspect | behavior |
|---|---|
| the composition | frozen: out of the list, out of search, not editable |
| its **card** on boards | **vanishes**; on restore it **returns to its exact place** *(placement rows survive underneath)* |
| its **chips** in other writing | greyed and **frozen**; tapping says *"this is in your trash — bring it out to see it"*, with a restore door |
| **restore** | returns it **whole** — star intact, placements intact, references intact |
| the trash page | lists it alongside trashed bits and boards |

### 11.4 Destroyed
1. Only by **emptying the trash** — the app's one irreversible act *(D-125)*.
2. Removes the composition, its placements, and its references **in both directions**.
3. Chips pointing at it **degrade to plain text** (§9.8).

### 11.5 What is never a state ⛔
"Draft" · "published" · "finished" — ⚪ *the last is the parked **pieces** idea (F-series), testable today with a `finished` tag; it is not part of this spec.*

## 12 · Cross-cutting — how a composition joins the rest of the app

### 12.1 Search *(verified against `src/lib/db/search.ts`, 2026-09-02)*
**Today:** search reads **bits and notes** — things with words — filtered by kind (all · bit · note), matching the bit's search index. **A board never appears in search**, by design: it has no content of its own. Boards are reached by name through **jump-to**, the separate tool *(the "two kinds of looking" split, D-122)*.

**After compositions separate:**
1. Search covers **bits and compositions**; the kind filter becomes **all · bits · compositions**.
2. A composition matches on **its title and its body**.
3. ⛔ Boards stay out of search; jump-to remains their door.
4. **Archived things: excluded by default, with a control to include them** (§11.2).
5. ⚠ **REQUIRED WORK, or compositions vanish from search:** search reads the bit table today. When compositions move, **the search index must follow them** — a generated column on their new home, and the query taught to read both. *(Caught by writing the technical spec; the single largest silent-breakage risk in the migration.)*

### 12.2 Tags
Identical to bits and boards: apply, remove, and pull. A composition carries its own tags; ⛔ tags are never inherited from the bits it references or the boards it sits on.

### 12.3 Folders
**One folder per composition**, exactly as boards and bits. Deleting a folder strands nothing — its contents simply leave it *(existing set-null behavior)*.

### 12.4 Star ("alive")
A composition can be starred; starred things lead the desk. Unchanged from today.

### 12.5 Export
Compositions join `/api/export` **in the same migration that moves them** — not after. *(Invariant I-G1: every stored record kind appears in the export. This is not optional and not deferrable.)*

### 12.6 The graph *(parked — its own round)*
The graph draws references and placements as lines. Compositions are ⚪ *presumably* nodes; nothing here decides it. **The rows accrue correctly from day one regardless**, so parking costs nothing.

### 12.7 The pull (tapping a tag)
Returns everything carrying that word — bits, boards, and now compositions, mixed. ⚪ *whether the pull gains kind-filters like search has.*
