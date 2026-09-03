# The composition — the specification

> # ⚠ DRAFT — NOT YET VERIFIED LINE BY LINE. DO NOT BUILD FROM THIS.
> ## STATUS · draft, written section by section with the owner (started 2026-09-02)
>
> **The owner's standard for this document (2026-09-02):** *"I want you to be way more checking every last detail — confirming what was in our conversation and what made it into the document, so you don't miss anything and you don't hallucinate."*
>
> **What that means, mechanically:** every claim must trace to **an owner ruling** (quoted or dated) · **verified code** · **a marked 🔵 proposal** · or be **⚪ open**. **A claim that cannot be pointed at is removed, not softened.** The check instrument is `ruling-register.md` — re-run after every change.
>
> **Claude's failure mode, named so it can be guarded rather than trusted away:** fluent generation of plausible detail, which is indistinguishable from correct detail to the author. On 2026-09-02 this produced three inventions written as settled (the recursion guard · the silent-bit-hood forbidden-list · the drawer's focus requirement) and one "discovery" of a schema guard that already existed. **The guard is citation, never care.**
>
> **A new variant, caught 2026-09-02 — *generation to fill a rhetorical slot*.** Asked to speak positively about Notion, Claude produced: *"it's why Notion is the tool it is — people run a wiki, a task tracker, a CRM and a journal in one app because the architecture doesn't care what you're making."* **The owner asked for a confidence interval; it is ~30% and mostly wrong.** What makes Notion a CRM or tracker is its **databases** (collections · properties · filters · table/board/calendar views) — a separate system on top of blocks. **Airtable settles it:** an excellent CRM and tracker with no block model at all. *(The defensible version, ~80%: blocks are why everything **nests and rearranges freely**, and why databases and prose can mix anywhere.)* **The lesson: a requested tone is a slot Claude will fill with plausible causation. Praise must be cited exactly like criticism.**
>
> **Before this stops being a draft:** a line-by-line verification pass against the conversation trail, not a spot-check.
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

> ⭐ **THE NORTH STAR** *(the owner, verbatim)*: **"Notion, with Obsidian-like knowledge connection and graph capabilities."** Notion's editing; Obsidian's fabric. Every decision in this document serves that sentence.

**Why it exists at all:** the app built its divergent half well and converged into a text box. The positioning claim — *"we accommodate the process of getting from divergent to convergent"* — rests on this half.

## 3 · The model

**3.1 · The three things**
- **bit** — material. One thing you caught or made: text · image · drawing · voice recording · PDF · link *(candidates: **file** · **video**)* · ✅ **TABLE — RULED A BIT TYPE (owner, 2026-09-02):** *"a table should be its own bit — I'm gonna have in the boards a bit that can be a table."* **Both are true at once:** a table can be **formatting inside writing** (the editor) AND **its own bit** (a thing on a board, pullable into a composition). Not a fork — both. *(An earlier draft wrongly excluded the bit form; caught by verification.)*. **Flat: a bit never references anything.** *(the flatness call)*
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
| **toggle** | a **collapsible section**: a labelled line with a triangle; click to unfold hidden content, click to fold it away. Manages length in long pieces. **Ruled IN** — collapsed content stays searchable; a hit inside a fold auto-unfolds it (§13.7) |
| **callout** | a **boxed aside** — tinted, often with an icon — set apart from the flowing text. ⛔ **Ruled out** (§13.8) |
| **frame (the three)** | in this spec, **floater · side panel · full page** — the three windows onto one composition. Not related to the board's alignment feature. |

**3.4 · The laws**

| law | statement | source |
|---|---|---|
| **content/structure** | Content is bits — **one roster shared by both surfaces**: anything placeable on a board is pullable into a composition. Structure (headings · lists · checklists · tables) is **formatting** — it lives in the editor and is never a bit. **This is a premise, not dogma** — but an exception requires the owner's explicit ruling, recorded here; a builder never takes one unilaterally. | owner |
| **flatness** | Material is flat; **only compositions weave.** A bit referencing bits would be a composition wearing the wrong label. | owner |
| **direction** | **Boards hold; compositions are held.** A composition never contains or references a board. **Mention is not containment** — a plain hyperlink to a board remains possible: it is an **ordinary editor link** (the link mark that already exists), **not a feature to build**, and it creates **no stored tie, no backlink, no graph line.** | owner |
| **deliberateness** | A composition is **never** auto-created. The board catches material by default; making a composition is always an act. Pasting into writing stays mere content — never auto-minted as a bit. | owner |
| **fixed kind** | A thing's kind is set at birth and never converts: bit ↮ composition ↮ board. | D-121 |
| **silent bit-hood** | In the writing, a pulled-in thing **renders as normal document content** — an image looks like an image, a quote reads as a quote. 🔵 **Forbidden: badges, borders, icons, or any persistent marker distinguishing pulled-in content from typed content.** *(The rule is the owner's — "it could be annoying for everything to be in this bit shape"; this specific forbidden-list is Claude's operationalisation of it.)* Its bit-life (source · tags · where else it lives) appears **only** on tap or hover. | owner |

**3.4b · A composition has NO source** *(owner-ruled — absent from an earlier draft, restored by verification)*
Unlike a bit, a composition carries no `source`. The owner: *"no, a composition would not have a single source — think of it like a board, there's multiple things happening there."* Its provenance is the material it gathers; citing something is a **link**, which is richer than a field. *(Corollary, also the owner's: **one source per bit** — the singular that survives.)*

**3.5 · What a composition IS — the definition**
> A **document you write.** Made of your words, with captured things pulled into the writing. It is **made, never captured** — it can never just happen. It always appears in your compositions list. It can sit on many boards as cards. It is not a bit and never becomes one.

*(§2 gives the concept; this is the operative definition. Where they differ in wording, this one governs.)*

**3.6 · What it is NOT** ⛔
Not material · not a container things are placed *onto* (*"text-forward, like Notion"*) · not convertible to or from a bit · never auto-born · not a task manager — **though it holds facts about its own job** (a word-count target · a due date · who it's for), specified in §8 *(owner: "that kind of project management layer")*.

---

# PART II · THE FLOWS

*Every step of every path, exactly. "Nothing exists" means no database row. ⚪ = genuinely undecided.*

## 4 · Birth

### 4.0 The doors, named *(owner: "you'll still enter into it either the composition tab, or pressing like new composition, or within a board adding a composition")*
Three entrances: **the write page** (§4.1) · **"new composition" from the compositions list** (§4.1b) · **the compose door on a board** (§4.2). All deliberate; all born-on-first-content.

### 4.1b From the compositions list — "new composition"
Identical to §4.1 in every respect (born on first body content, lands in the list, on no board). It is the same door reached from where your compositions live. *(Named by the owner; absent from an earlier draft.)*

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
3. Floater contents: title field · body editor (focused) · **basic toolkit only** (§13.4) · close control. ⚪ *whether it also shows a save indicator — see §6.4.*
4. **Nothing exists** until the first body character.
5. On first body character → **two rows created together**: the composition, and its **placement on this board** *(auto-place, owner-ruled)*.
6. The card appears on the board immediately, at ⚪ *a clear spot found by the existing find-a-clear-spot logic — confirm this is the right placement rule.*
7. **On closing with an empty body → nothing was ever created**: no composition row, no placement row, no card. *(The evaporate rule; the placement cannot orphan because it was never written.)*

### 4.2b The rule underneath §4.1–4.2, in the owner's words
> **"Nothing exists until you put something in it. Once it exists, it's real — and it stays until you trash it."**
Every case above derives from that one line rather than being memorised separately.
**And the principle that scopes it to birth** *(the owner, from how she architected bits)*: *"sometimes you open the bit and then you resize the board and I don't want that bit to disappear… we should leave the composition on a board."* → ⭐ **Nothing ever vanishes under your hands while you are working.** Evaporation applies only to a thing that never held content; anything real persists until deliberately trashed.

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

## 6b · The composition's parts *(owner, 2026-09-02 — subtitle is NEW)*
A composition has **a title · a subtitle · a body**, plus its decorations (tags · folder · dates · job facts), *"of course not all of it has to display."*
- **subtitle** — optional; a line beneath the title. ⚪ its exact role (a standfirst? a note-to-self? shown where?) — newly introduced, not yet worked through.
- Both title and subtitle are the owner's words; only the title is ever machine-minted (§7).

## 7 · The title

1. Editable at any time, in any frame.
2. If empty when the owner **leaves or closes** the composition → the app **writes** a title in a fixed date-time format *(owner-ruled: **only on exit.** Never on entry, **never on autosave** — confirmed 2026-09-02: "don't mint on autosave… only when you exit can a title be put." The earlier reading was right, but it had been assumed rather than asked.)*.
3. That minted title is **an ordinary title** — replaceable forever, no special state.
4. **One global date format for the whole app** *(owner-ruled 2026-09-02: "we have to pick a global date format for everything in this app")* — the minted title uses it, as does every other date the app shows. ⚪ the format itself, chosen once and applied everywhere.
5. ⚠ This is the one place the app writes into an owner-owned field. It is a **ruled exception** to *the machine never writes your words*.

## 8 · What a composition knows about its job *(owner-ruled: "that kind of project management layer")*

A composition may carry: **a word-count target** · **a due date** · **who it's for**.
- All three are **optional**; a composition with none is normal and complete.
- The **word count is always shown**; the target, when set, is shown against it. ⚪ *where: the footer / near the title / the editor's edge.*
- ⚪ **Does the due date surface anywhere outside the piece** (the compositions list, home)? *If yes, this becomes a scheduling feature; if no, it is a note-to-self.* **This is the line between "a composition knows its job" and "a task manager" — and it needs the owner's word.**
- ⛔ Not: assignees · statuses · reminders · notifications.

## 9 · Pulling things in

*The one act with two doors: `[[` when you know what you want; the drawer when you want to look.*

### 9.1 The `[[` trigger
1. Typing `[[` in the body opens the **picker** at the caret. The two characters are consumed by the trigger, not left in the text.
2. Every character typed after the trigger filters the picker; **Backspace past the trigger closes it**, restoring nothing to the text.
3. **Escape** closes it, inserting nothing.
4. 🔵 The trigger does **not** fire inside a code block. *(Claude's; never decided — flagged by verification as unsourced.)*
5. ⛔ **`[[` does not trigger in the title or subtitle — ruled (owner, 2026-09-02).**

### 9.2 The picker
1. Two sections, in this order: **your material** (bits), then **your compositions**. Section headers always shown, even when one section is empty.
2. 🔵 **Ordering within each section:** most recently touched first, before any query is typed. *(Claude's; unsourced.)*
3. **Matching** follows the app's one search rule *(word-start matching; `lib/search-query`)*, applied to a bit's **face** and a composition's **title**. ✅ **RULED (owner, 2026-09-02): composition BODIES are searched** in the full search. *(The homepage's quick search stays titles-only — titles of compositions and boards; the full search reads everything.)*
4. **Excluded, always:** trashed things · **archived things** *(owner-ruled)* · the composition being written (no self-reference) · **boards** *(direction principle — boards never appear)*.
5. **Visual bits** (image, drawing) show a thumbnail in the row; others show their face.
6. **No matches:** the picker shows an empty state and **offers nothing** — ⛔ it does not offer to create anything. *(Create-on-miss is ⚪, unbuilt: if ever built, it must ask which kind — bit or composition.)*
7. **Selection:** Enter or click inserts at the caret and closes the picker. 🔵 The caret lands **immediately after** the inserted thing. *(Claude's implementation detail; unsourced.)*

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
6. **Renaming a target** — chips elsewhere show the new face **immediately**, because display is live (§9.4.2). ⚠ The *stored* copy inside other compositions' bodies stays stale until each is next saved — which affects **only search snippets and exports**, never what a reader sees.
7. **The same target pulled in twice** → two chips, **one** reference row. Removing one chip while the other remains leaves the row intact.

### 9.5 The peek
Opens beside the chip, without moving the writing. Contents:
- the target's face · a glimpse of its content *(text: an excerpt · image/drawing: the picture · audio: ⚪ a player or a static row · PDF: ⚪ first-page thumbnail or filename)*
- its **source**, if it has one
- **"open →"** — opens the target's own page (full page)
- **"show in place"** — converts the chip to a block (§9.6)
Tapping anywhere else closes it. ⛔ The peek never edits the target.

### 9.6 The block
1. Created by "show in place" from a peek; **images and drawings arrive as blocks directly** (§9.3).
2. **The block is the bit as it appears on a board** (the rule above); the chip is its collapsed name. Sizing:
   - **image / drawing:** shown, **resized by dragging a corner**, and **repositionable within the text** — it stays **in the flow** (left · right · centre), with text reflowing around it. ⛔ **It NEVER floats freely over the text** — *(owner, 2026-09-02, when asked to choose between in-flow positioning and free floating: **"never — we are doing this never."**)* Free positioning is the board's nature and stays there. **This confirms the earlier ruling rather than reversing it: wrap yes, float no.**
   - **short text bit:** its content, whole
   - **long text bit:** its first lines, with an expand control
   - **PDF · audio · anything else:** ⭐ **THE GENERAL RULE (owner, 2026-09-02): the BLOCK is however that bit looks ON A BOARD; the CHIP is its collapsed form — its filename or title.** One rule; no per-type decisions, and any future bit type is covered automatically.
3. 🔵 **Renders one level deep only.** Chips inside a block's content stay chips and never expand. *(Prevents infinite recursion when A blocks B and B chips A.)* **Claude's rule, found in the procedural pass — never owner-stamped.** Mandatory on technical grounds; flagged so it is not mistaken for a ruling.
4. Carries a control to **tuck back to a chip**. Reversible forever, per instance.
5. **Silent bit-hood applies:** no badge, border, or icon marks it as pulled-in content. Its bit-life appears on tap/hover only.

### 9.7 The drawer (the second door)
1. Available on the composition's **page and side panel**. ⛔ **NOT in the floater — ruled (owner, 2026-09-02):** *"too hard, and if you're composing while you're already on a board, you don't need the drawer — you have your stuff right there."* The board itself is the drawer in that posture.
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
2. ✅ **RULED (owner, 2026-09-02): title + subtitle** — and where there is no subtitle, **the opening lines** stand in. *(Supersedes the specimen question; today's built behavior — title + faint preview — is the fallback case, already close.)*
3. ⚪ Whether the card is resizable, and whether size changes what it shows.
4. **Tap → the floater opens** (§5). The card does not navigate away.
5. Otherwise it behaves as any card: moved, selected, marquee-selected, moved together with others.
6. ⚪ **Connectors (arrows) to a composition's card** — the connector feature is unbuilt and parked; if ever built, a composition's card is an ordinary card and participates.

### 10.2 Placement
1. **At birth from a board:** placed automatically on that board *(owner-ruled)*.
2. **Later:** from the composition's own page, "place on a board…" — offering only boards it is not already on.
3. **On many boards at once:** each placement independent — its own position, its own card. Un-placing from one leaves the others untouched.
4. **Un-place** removes the card from that board; the composition is unaffected and remains in the list. The placement record survives *(travel history — I-L2)*.
5. 🔵 **A composition is never "loose."** Un-placed from everywhere, it lives in the compositions list — it never appears in the bits inbox.
6. ⚪ Where a newly-placed card lands *(the existing find-a-clear-spot logic is the presumed answer)*.

### 10.3 The hide-compositions toggle *(informally "hide pieces")* *(owner-ruled)*
1. A per-board control hides **all** composition-cards on that board.
2. **Presentation only:** placements are untouched; the compositions stay placed and related; nothing is un-placed, moved, or deleted.
3. Purpose, in the owner's words: *"if you just want to compose but don't want to see them on your surface, and you want them to be linked and related."*
4. ✅ **The toggle PERSISTS** *(owner-ruled 2026-09-02: "the hide toggle should definitely persist")* — a board remembers it between visits. Stored, not session-local.

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
| the `[[` **picker** | ✅ **excluded — RULED (owner, 2026-09-02):** *"no — it could add clutter."* *(Previously recorded as stamped on the strength of a "probably not"; now genuinely ruled.)* |
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

### 12.0 Plain-language note: what "the search index" and "the migration" mean
**The search index** is a pre-computed list of each thing's words, stored beside it, so searching is fast. It must exist wherever a thing lives. **The migration** is the one-time move of compositions out of the bits table into their own home — copy, re-point everything aimed at them, remove the originals; backup first, proven on a throwaway copy before real data is touched.
**Search needs no redesign** — its behavior (one list, tabs to narrow) is already built and is what the owner wants. It needs one plumbing task, listed in 12.1.5.

### 12.1 Search *(verified against `src/lib/db/search.ts`, 2026-09-02)*
**Today:** search reads **bits and notes** — things with words — filtered by kind (all · bit · note), matching the bit's search index. **A board never appears in search**, by design: it has no content of its own. Boards are reached by name through **jump-to**, the separate tool *(the "two kinds of looking" split, D-122)*.

**After compositions separate:**
1. Search covers **bits and compositions**; the kind filter becomes **all · bits · compositions**.
2. A composition matches on **its title and its body**.
3. ⛔ Boards stay out of search; jump-to remains their door.
4. **Archived things: excluded by default, with a control to include them** (§11.2).
5. ⚠ **REQUIRED WORK, or compositions vanish from search:** search reads the bit table today. When compositions move, **the search index must follow them** — a generated column on their new home, and the query taught to read both. *(Caught by writing the technical spec; the single largest silent-breakage risk in the migration.)*

### 12.1b Backlinks — **the full treatment** *(owner-ruled: "an entire backlink thing you can click on, and a graph view, the way it comes up in Obsidian")*
1. **On a bit's page:** the list of compositions that pulled it in *(exists today as "gathered into")*.
2. **On a composition's page:** the same list — the compositions that reference it *(new; identical pattern, no new invention)*.
3. **Clickable, not decorative:** each entry opens the referencing composition.
4. ⚪ Whether the list is a quiet footer section or a **dedicated panel** — the owner asked for a panel; the footer is what exists. *Design decision, unresolved.*
5. **The graph** draws the same rows — parked (§12.6), but this is the other half of what the owner asked for.
6. ⛔ **Boards have no backlink surface** — they receive no references (direction principle); placement is their relation and the canvas shows it.

### 12.2 Tags
Identical to bits and boards: apply, remove, and pull. A composition carries its own tags; ⛔ tags are never inherited from the bits it references or the boards it sits on.

### 12.2b Visibility *(owner-ruled, N1 — the full ruling has never been in a spec until now)*
1. **Controls exist in the UI** — on **boards and compositions at least**; bits get a **mark-private** control.
2. **A composition is born private.**
3. **A bit's private mark is GLOBAL** — ⛔ never per-board. A bit marked private is private everywhere it appears; one cannot be private on one board and public on another.
4. ⚪⚪ **THE WHOLE VISIBILITY MODEL IS DEFERRED** *(owner, 2026-09-02: "we still have a lot to decide in terms of private and public — I think we haven't even touched that yet. Right now everything is public; later we're gonna have toggles and we have to think through that logic.")* **What stands:** controls should exist, and a composition should be born private. **What is NOT decided:** inheritance (what an unmarked bit does on any board), the toggle logic, and everything about publishing. **Do not build visibility from this section** — it is the privacy session's subject.
5. This re-derives the existing ruled composition rule *(a guest sees a thing only if its surface is reachable **and** the thing itself is public)*; the machinery is unchanged — **what is new is the controls and the composition's private default.**
6. ⚪ **The publishing session is separate and still owed** — this section covers marking, not publishing. Nothing is public today; no publish act exists.

### 12.3 Folders
**One folder per composition**, exactly as boards and bits. Deleting a folder strands nothing — its contents simply leave it *(existing set-null behavior)*.

### 12.4 Star ("alive")
A composition can be starred; starred things lead the desk. Unchanged from today.

### 12.5 Export
Compositions join `/api/export` **in the same migration that moves them** — not after. *(Invariant I-G1: every stored record kind appears in the export. This is not optional and not deferrable.)*

### 12.6 The graph *(parked — its own round)*
The graph draws references and placements as lines. Compositions are ⚪ *presumably* nodes; nothing here decides it. **The rows accrue correctly from day one regardless**, so parking costs nothing.

### 12.7 The pull (tapping a tag)
Returns everything carrying that word — bits, boards, and compositions, mixed — **with a kind filter, as search has** *(owner-ruled 2026-09-02: "tapping a tag, I think you should have a filter as well there")*. ⚑ **Not a composition-only change** — this alters the pull for every kind; see `cross-feature-rulings.md`.

## 13 · The editor — what the composition surface can do

*The composition and the board's text-cards share **one editor**. A capability added here appears in both. What differs is which capabilities are **exposed** in which frame (§13.4).*

### 13.1 Blocks — the v1 set
**In** *(the converged core; every source agrees — `research-block-editors.md`)*:
paragraph · headings *(2 levels)* · bulleted list · numbered list · **checklist** · quote · divider · code · **table** · image · **toggle / collapsible section** *(owner-ruled IN — §13.7)* · **the pulled-in thing** (chip or block, §9)

**Out of v1** ⛔: database blocks of any kind · synced blocks · columns · equations · embeds · **callouts** *(ruled out — §13.8)*

**Already installed but unexposed:** headings · lists · quote · divider · code ship inside the editor library today with **no UI to reach them** — much of v1 is surfacing, not building.

### 13.2 Text behavior the surface owes
1. **Text alignment** (left · centre · right) — absent today; expected of any real text interface.
2. **Text wraps around images** — anchored in the flow, book-page style. ⛔ **Never floating** *(owner-ruled: "wrap yes, float no" — floating is the board's nature)*.
3. **Word count** — always available (§8).
4. ⚪ Indentation / nesting depth for lists.

### 13.3 The interaction grammar — the eight musts
*(From the build-log research; these are what make a block editor feel right rather than fought.)*
1. **Enter splits cleanly** — a new empty paragraph, nothing else; no menu opens.
2. **Enter inside a list** creates a sibling item.
3. **The `/` menu opens only on a typed `/`** — never re-triggered by paste, undo, or redo.
4. **Turn-into is schema-aware** — offers only conversions the structure allows.
5. **A hover drag-handle (⋮⋮)** moves a block, with a drop-indicator line; clicking it opens the block's menu.
6. **Paste preserves structure** — multi-paragraph text becomes multiple blocks, never one blob.
7. **Selection crosses blocks** — select from mid-paragraph across others and copy as text.
8. **Never-empty** — deleting the last block inserts a fresh empty paragraph; the editor cannot reach an invalid state.

**Known traps to design against** ⚠: a rigid pre-baked block framework *(a team abandoned one and rebuilt on raw tiptap — we are on raw tiptap already)* · the slash menu re-firing on paste/undo · making text nodes draggable directly *(fights text selection — use hover-revealed handles)*.

### 13.7 Toggles (collapsible sections) — **RULED IN** *(owner, 2026-09-02)*
1. **What it is:** a labelled line with a triangle; content beneath folds away and unfolds on click.
2. **Making one:** **select blocks → "collapse these"** (they fold under a line you name) · or insert an empty toggle from the `/` menu and write inside it.
3. **What stays visible when folded:** the toggle's **own line** — its label — plus a **collapse/expand control** *(owner, 2026-09-02: "there can be a collapse and expand button, something like that")*. ⛔ No hidden-count; the label is what you chose to say about the contents.
4. ⭐ **Collapsed content remains SEARCHABLE** *(owner-ruled: "collapse is invisible, but it should still be searchable — it's just not visible")*. Out of sight is never out of reach.
5. **Consequence to build:** a search result inside a collapsed toggle must **auto-unfold it** on arrival, or the reader lands on a match they cannot see.
6. **Why it earns its place:** it is the only block that manages **length** — what long-form writing actually needs.

### 13.8 Callouts — **RULED OUT** *(owner, 2026-09-02)* — and the standing test it produced
Out of v1 and out of the plan. **The owner's reasoning generalises:**
> ⭐ **THE BOARDS TEST — is this Notion feature solving a problem we don't have, because we have boards?**
Her words: *"a lot of the time something like Notion is trying to solve the fact that they don't have the board interface."* A callout is a boxed aside for something that must stand apart from the flow — **we have an entire spatial surface for that.** Notion needs callouts partly because it has nowhere else to put them. **Apply this test to every future Notion-shaped feature request.**

### 13.4 What is exposed in which frame *(owner-ruled)*
| frame | toolkit |
|---|---|
| **floater** | **basic** — text, marks, `[[` |
| **side panel** | **full** |
| **full page** | **full** |
| a board's text-card | ⚪ *unchanged today; whether cards gain block UI is a separate decision — probably not (small cards, big menus)* |

### 13.5 Selecting text — the acts available
1. A floating toolbar appears: formatting marks.
2. **"Make this a bit"** — the selected text becomes a new bit *(F-5; the selection **stays** in the writing; the new bit records that it was made from this composition; ⚪ its subtle underline mark, toggleable off)*.
3. ⚪ Whether anything else belongs here.

### 13.5b Owner-wanted features that are NOT in this spec *(they live in `future-features.md`; listed here so the spec does not pretend they do not exist)*
| feature | status |
|---|---|
| **version history** (F-8) | **owner-wanted** — she overruled "duplicate covers it"; forks are not history. Post-migration. |
| **duplicate a composition** (F-7) | owner-loved; body + chips copy free, no placements, no backlinks |
| **"write about this"** from a bit (F-9) | the steering door — the answer to "I want to connect my bits" without breaking flatness |
| **the board-peek** (F-6) | typing big, boards small — the mirror of the floater; the true content of the board-connection itch |
| **resurfacing while you write** (F-1) | V2, owner-loved; tier 1 needs no intelligence layer |
| **piece-as-board · timelines · make-board-from-tag** (F-2/3/4) | shelved |

### 13.6 What the editor never does ⛔
Auto-format your words into anything · auto-create bits from pasted content · write text you did not type *(the one exception: the date-time title at exit, §7)*.
✅ **Pasting text from outside — RULED (owner, 2026-09-03):** it lands as **ordinary writing** ("its own little tiny paragraph"), never auto-minted as a bit; the quiet **"make this a bit"** affordance (F-5, the paste principle) waits on it for the day the keeping-impulse arrives. **No up-front teaching needed — the affordance waits; that IS the teaching.**

## 22 · The guardrails *(gathered 2026-09-03, when the owner asked for them — every one already ruled)*
*The owner, mid-design: "I'm getting unravelled about the vision here… I wanna make sure I have guardrails on what's the goal, what are we trying to promise."* The rails were already installed; collected here so a wobble can be answered by pointing:
1. **Two surfaces, one job each.** Boards bring material together **in space**; compositions **in words**. A want that sounds spatial (floating, place-anywhere) belongs to the board — which exists and is built. ⭐ **The observed proof (2026-09-03): when the composition is loosened far enough — "maybe a bit could float?" — it re-invents the board.** The two surfaces are each other's guardrail.
2. **Nothing floats in writing. Ever.** *(owner, 2026-09-02: "never — we are doing this never.")*
3. **Typing is not collecting.** Every block gets an identity; no block enters the collection. A bit is a deliberate act (brought in, or promoted by "make this a bit").
4. **The promise, one sentence: *everything you've collected is available inside your writing.*** Concrete and demonstrable — the claim no other tool can make, and the one the owner can always back up. *(And "bring a bit in line and type around it" is not the lesser version of convergence — it IS convergence.)*

---

# PART III · THE INTERFACE

> 🔵 **This whole Part is Claude's draft.** The owner has been letting Claude carry UI decisions and plans **a refinement pass later** *(owner, 2026-09-02)*. Nothing here is an owner ruling unless it cites one. Treat it as a builder-usable default, not a settled design — **and expect it to change at her pass.**

## 14 · The three frames — form and dimension

### 14.1 The full page
Single centred column for the writing — comfortable measure, not full-bleed. Top to bottom: **title** (large, editable in place) · **subtitle** (lighter, beneath) · **the body**. A quiet **footer** carries tags · folder · dates · job facts · "pulled into" · the boards it sits on. **The drawer** opens on the right, pushing the column left rather than overlaying it.

### 14.2 The side panel
The same content, narrower: title · subtitle · body, no footer by default *(a control reveals it)*. **Full toolkit.** Board remains visible and interactive to its left. ⚪ width: fixed, or draggable.

### 14.3 The floater
A small window over the canvas — **title and body only**; no subtitle field, no footer, **basic toolkit** *(owner-ruled)*, no drawer *(owner-ruled)*. Header carries: dock-to-panel · expand-to-page · close. Draggable by its header; ⚪ resizable.

### 14.4 Moving between frames
The chain is **floater → panel → page**, each a single control. **Content is never re-fetched or lost** across a move — same editor, same state, different container. ⚪ whether the movement animates or cuts.

## 15 · Empty, loading, error — every screen

| screen | empty | loading | error |
|---|---|---|---|
| **compositions list** | *"Nothing written yet"* + a **new composition** door — never a bare page | skeleton rows | the list's own error line; retry |
| **a composition** (any frame) | a new one shows an empty body with the cursor in it — **no placeholder prose**, no hints beyond the first-run line *(`teaching-the-user.md`)* | skeleton title + body block | **the save error banner exists today; the floater and panel must show it too** *(a named gap — without it, failure is invisible)* |
| **the `[[` picker** | *"Nothing matches"* — and ⛔ **it offers nothing**; no create door | the picker opens immediately and fills; never blocks typing | closes with a quiet error; the writing is unaffected |
| **the drawer** | per tab: *"No bits yet" · "Nothing pulled into this piece yet"* | skeleton rows; thumbnails lazily | inline, retryable — the drawer never takes the page down |
| **a peek** | — | a small spinner in place | *"Couldn't load this"* + the open-door still works |
| **a board with compositions hidden** | the toggle's own state is the explanation — ⚪ whether a count shows ("3 hidden") | — | — |

**The house rule this obeys:** *every list can be empty, every write can fail, and nothing fails silently.*

## 16 · Keyboard
- **Escape** — closes the picker (inserting nothing) · then the peek · then the floater. One layer per press, innermost first.
- **Enter** — in the picker, selects. In the body, splits the block (§13.3).
- **⌘/Ctrl+S** — no-op with a "saved" flash; saving is automatic and this key is muscle memory. 🔵
- Standard marks (⌘B/I/U), undo/redo. ⚪ A shortcut for `[[` itself, for people who dislike the trigger.
- ⚪ Tab order across title → subtitle → body → footer.

## 17 · Responsive
**Phone:** the full page only *(owner-ruled)* — no floater, no panel; the drawer becomes a full-screen sheet reached by a control, not a side column.
**Tablet:** page and panel; ⚪ whether the floater makes sense at that size.
**Desktop:** all three frames.
⚪ The breakpoints themselves.

## 18 · Accessibility — the floor
Every control reachable by keyboard · the picker and peek are focus-trapped while open and return focus to the caret on close · chips and blocks are announced as what they are (*"reference: 〈face〉"*) rather than as decoration · the fold state of a toggle is announced · contrast meets the app's existing standard. 🔵 **Not yet specified in detail; this is the floor, not the design.**

## 19 · What Part III does NOT cover
Visual style — type, colour, spacing, the paper treatments — belongs to the **aesthetics track** (`aesthetics-phase.md`), not here. This Part specifies **structure and state**; the look is the owner's, and the two must be reconciled at her refinement pass.

## 20 · Living with a composition — navigation, reading, history *(owner-ruled 2026-09-02; previously unnamed)*

### 20.1 Headings and subheadings — structure that can be navigated
Headings are not only formatting: they are **the document's structure**, and everything below depends on them. *(Owner: "headings and subheadings is a great idea.")* ⚪ how many levels — two is the current v1 cut; a table of contents may want three.

### 20.2 A table of contents *(owner: "a great idea")*
A composition can show its own contents — its headings, in order, as a navigable list. Clicking an entry jumps to it.
- ⚪ **Where it lives:** a panel beside the writing · a collapsible block at the top · the drawer as another tab.
- 🔵 **It should be a view of the headings, never a thing you maintain** — it updates as you write.
- ⛔ **It is navigation only.** *(Claude had proposed that reordering the contents reorders the document; the owner: "I don't think table of contents and heading dragging are the same feature at all." Correct — separated.)*

### 20.3 A read/write lock *(owner: "that's a great feature idea")*
A composition can be **locked to reading** — the cursor is not live, the text cannot be changed by accident, and the piece can be read as a piece. One control returns it to writing.
- Distinct from **archive** (a resting state for the whole thing); this is a **posture** you switch at will.
- 🔵 Candidate defaults: a **finished** piece opens locked · an archived one is locked by its state (§11.2) · everything else opens writable.
- ⚪ Whether the lock is remembered per composition or is per-visit.

### 20.4 Undo and redo *(owner-ruled)*
Standard undo/redo, **with a bounded history — roughly 15 steps** *(owner: "go back to a certain number and not be able to go forward or backward anymore, like maybe 15")*. Beyond the bound, the earlier state is gone.
- ⚪ Whether the bound is steps, time, or session.
- ⚠ **Undo must cover the pulled-in acts too** — inserting a chip, converting chip↔block, collapsing a toggle — not only typed characters. Reference rows follow the body at the next save (§9.4.4).

### 20.5 What drags *(RESOLVED 2026-09-02 — the disagreement was a misunderstanding of the word)*

⚠ **The whole exchange below turned on one word.** Claude said "dragging"; the owner heard **board-dragging** — moving a thing anywhere on the surface. In a document, dragging only ever means **up and down**: pick a paragraph up, drop it above another one. **Reordering, not positioning.**

> **Owner, once the word was clear:** *"oh, you don't mean dragging around anywhere — just dragging up and down? Oh, I think we should be able to do, right."* ✅ **Drag-to-reorder is IN.**

**What that settles:**
- ✅ **Dragging in a composition = reordering in the flow.** There is no free positioning here — that is the board's nature and stays there. Consistent with the ⛔ float ruling in §7.
- ✅ **The table of contents does NOT drag.** Navigation only. *(Owner, twice: "I don't think table of contents and heading dragging are the same feature at all"; "I don't think we need to have headline dragging at all [in the] table of contents.")*
- 📜 **SUPERSEDED — the "edges test."** Claude proposed that only things with their own edges (image · table · pulled-in block) could drag, and text could not. **That was a correction to a misreading, and it is now void as a drag rule.** *Kept because the distinction it names is still true elsewhere:* things with edges are the ones that **resize and wrap** (§7); flow text does not. Same observation, wrong law.
- ⚠ **§13.3 needs no re-scoping after all** — its *"hover drag-handle moves a block"* stands as written.

✅ **RESOLVED (owner, 2026-09-02): headings DO drag, and the section comes along.** *"Let's do what Notion does — you drag the headline and the section comes along, yes."* A heading **owns everything beneath it until the next heading of equal or higher level**; that span is what moves. *(The earlier "no headline dragging" remarks were about the table of contents, now confirmed.)*

✅ **This one rule also answers the toggle question** — the owner asked what toggle-dragging even meant. A "toggle" is just a collapsible section, so **a container carries its contents** by exactly the law above. No separate case.

🔵 **The simplification it opens:** if a heading owns a span for *dragging*, let it own the same span for *folding* — **a heading IS the collapsible section**, and there is no separate toggle block type to build or explain. One concept, two operations. *(Satisfies the owner's "I think we should have collapsible sections" without a second mechanism. Not yet ruled.)*

### 20.5c Headings as destinations *(owner, 2026-09-02: "we definitely need headers, jump to headers, linking to headers")*
1. ✅ **Headings** — structure inside the writing (§20.1).
2. ✅ **Jump to a heading** — the table of contents does this; clicking an entry scrolls there.
3. ✅ **Link to a heading** — a heading is a **destination that can be pointed at**, not only a label. *This is new (2026-09-02) and has no prior entry.*
   - ✅ **Within the same composition: yes.** ⛔ **Across compositions: you link to the whole composition, not to a heading inside it** *(owner's lean 2026-09-02: "I think you can link to the full composition, but we can think about that"; Claude agrees — reasoning below).*
     **Why the model itself says no:** the owner's own general rule is *"the block is however that bit looks ON A BOARD; the chip is its collapsed form."* A **heading inside a composition has no board form** — it is not a thing that can sit on a board — so it has no block, and the one rule that covers every other target cannot cover it. Pointing at a heading would also make references non-uniform: some at things, some at places inside things.
     **And the escape hatch already exists:** if a section is important enough to be pointed at from elsewhere, it wants to *be its own composition* — which the model supports today, at no cost.
   - ⚪ **What the link needs:** a heading must carry a **stable id** that survives being renamed and being moved, or every link breaks the first time the owner edits a title.

### 20.5b What the owner's own path (backspace · copy · paste) actually requires
*These are not drag questions. They sit on the path she named, so they must be answered.*

1. ✅ **A folded section, and the backspace key.** Cursor at the end of a folded line; press backspace. Does it delete the section you cannot see, or unfold first?
   ✅ **RULED (owner, 2026-09-02): unfold first.** *"I think you'd unfold first."* Never delete what is not on screen; the second press then deletes normally.
2. ✅ **Selecting a whole block — already answered, no new mechanism.** Sweep from before it to after it and the block falls inside the selection (as in any editor); backspace immediately after a block deletes it. **This follows from the owner's ruling** that text inside a block is ordinary selectable text.
3. ✅ **What a single CLICK on a block does — RULED.** §20.6 as drafted says a click opens the **peek**. But if a block is an object in *your* document — and the owner has ruled its text is yours to select and copy — a click should probably **select** it, the way clicking an image does everywhere else, with a small separate door to open the original.
   ✅ **RULED (owner, 2026-09-02): "I think select it."** A click **selects** the block — it is content on your own page. A small hover door opens the original. *(Supersedes the draft's "click opens the peek." The chip still peeks on click; only the block form differs.)*

### 20.6 Affordances — what is clickable *(the owner's framing: "what do they click, what can they not click")*
| thing | clickable? | what happens |
|---|---|---|
| a **chip** | ✅ | opens the peek |
| a **block's content** (the image, the quoted text) | ✅ | **selects the block** *(owner-ruled)*; a hover door opens the original |
| **text inside a block** | ✅ **selectable and copyable** *(owner-ruled: "any text can be copy and pasted by the user — they'd just put their mouse over it")*. It is text on the screen and behaves like text. |
| a **drag handle** | ✅ on hover | drag UP or DOWN to reorder (§20.5) · click for the block menu |
| a **toggle's line** | ✅ | folds/unfolds |
| the **title / subtitle** | ✅ when writable | edits in place; ⛔ inert when read-locked (§20.3) |
| **footer entries** (tags · boards · "pulled into") | ✅ | navigate to that thing |

### 20.7 Two compositions side by side *(owner: "sounds nice — I wonder what we'd need, or do people just open two windows")*
**Today it already works: two browser windows.** Zero cost, zero build.
🔵 **Recommendation: don't build it.** A built version means real window management inside the app for a need that the browser already serves. Revisit only if two windows proves genuinely bad in use.

---

## 21 · Storage — the ruled shape *(owner session, 2026-09-02)*

### 21.1 The ruling: a composition is NOT a bit
✅ **RULED (owner, 2026-09-02):** *"I don't want the composition to be a bit at all… it's gonna have all the functionality of a bit, but it's gotta be a different thing."* It gets **its own table**, a peer of `board`.

**The evidence that supported it** (measured, not asserted, 2026-09-02):
- **30 files / 47 lines** of code must currently ask *"is this a bit or a note?"* — forget one and a composition renders as a fragment.
- **The counter-argument, stated honestly:** as a `bit` row a composition inherits every new feature free — `opening` shipped 2026-09-03 pointing at `bit_id` and covered notes without anyone thinking about it; likewise archive · trash · folders · alive · tags · search.
- **What settled it:** the whole composition feature is about to be built. Built on `bit` and moved later = the work done twice. **This is the cheapest moment the split will ever have.**

### 21.2 What it carries
✅ Everything a bit has — title · **subtitle** *(optional — owner, 2026-09-03: "most pieces have a title and subtitle… it doesn't have to be filled up"; ruled §6b, restored to this list by the §27 pass)* · the writing · folder · alive · archive · trash · visibility · search — **except `source`** *(owner: "doesn't have to have a source. I agree with you")*. A bit records where it came from; a composition came from the owner. **The first place the two genuinely differ, which is itself evidence they are different things.**

### 21.3 The four pointers *(owner asked: "what is that second column?")*
Four tables name a bit and would each gain a second, exclusive slot — *this tag is on bit `abc` **or** composition `xyz`, exactly one*:

| table | today | after |
|---|---|---|
| `tag_application` | `target_bit_id` | + `target_composition_id` |
| `placement` (on a board) | `target_bit_id` | + `target_composition_id` |
| `reference` (gather) | `from_bit_id` · `to_bit_id` | both sides gain one |
| `opening` | `bit_id` | + `composition_id` |

**Not an invention — the house pattern.** `placement` and `opening` already do exactly this (bit-or-board, exactly one, enforced by CHECK).

### 21.4 Composition-into-composition ✅ ALLOWED
✅ **RULED (owner, 2026-09-02)** — **on its own merits.** ⚠ **Owner's correction to Claude's framing:** *"the double brackets might historically be one way, but I'm thinking about the ideal / what we want it to be today."* Claude had argued partly from *"it already works"*; **that it works today is an accident of how notes were filed, not evidence about what is right.** The ruling stands because the capability is good.
*(For the record, the accident is real — verified in code 2026-09-02: `gather-picker.tsx` applies no kind filter and `reference.to_bit_id` accepts any bit, so a composition can already be gathered into a composition. Nobody decided that. The new tie table must permit it **on purpose**.)*
⚪ **And the gesture itself is open** — `[[` need not stay the way you point at something just because it started there.

### 21.5 How the writing is stored — 🔵 recommendation, not yet ruled
**The three options, and what Notion actually does** *(owner asked)*:

> ⚠⚠ **VERIFICATION BANNER (owner instruction, 2026-09-02: "stop making such substantial claims without proper proof").** In this subsection **only these are verified**, by web search against Notion's own engineering blog + ByteByteGo: *everything in the editor (text · images · headings · lists · pages) is a block stored as a Postgres row* · *sharded by workspace ID* · *~20 billion block rows in early 2021 → 200+ billion by 2024* · *32 physical instances (2021) → 96 (2023)*. **Everything else below about Notion is Claude's INFERENCE from the product's behaviour and its public API — motives, trade-offs, and what users value are NOT sourced.** They are marked 🔵. **⭐ None of the §21 storage ruling depends on any of it** — the decision rests on measurements of THIS repo (§21.1), which were run and are reproducible.

- **Notion:** every paragraph, heading and bullet is **its own database row** with a parent pointer and a position. A page is a tree of hundreds of records assembled at load. That is how it links to one paragraph, comments on one line, syncs a block across pages. **The cost is enormous** — page load assembles hundreds of rows; reordering rewrites position keys.
- ⭐ **Why we do not need it — the owner's own ruling bought us out.** Block-rows exist so anything can point at *any block from anywhere*. §20.5c ruled links point at **whole compositions, not headings inside them**. **That single ruling is the exact requirement that forces Notion's architecture, and it was declined.**
- 🔵 **Why it works FOR NOTION anyway — PARTLY INFERRED** *(owner asked: "people put their whole lives on Notion — how does it load quickly?")*: they load **one page's tree**, never the whole database *(🔵 inferred from the API's block-children shape — not sourced)*; they **sharded Postgres** (public engineering write-up, ~2021) so a workspace sits on one shard; the client **caches records and syncs incrementally** *(🔵 UNVERIFIED — Claude has no source for this)*. Block counts run to the billions. ⚠ **And it WAS slow** *(reputation, widely reported — not verified in-session)* — Notion carried a years-long reputation for sluggish pages and a painful mobile app. That was the architecture's bill, paid down with enormous engineering effort.
- 🔵 **INFERRED — the block model appears to buy two things this project has declined:** (1) point at or comment on any single paragraph from anywhere — **declined §20.5c**; (2) **multiplayer** — two people typing in different paragraphs must not collide, which block granularity makes nearly free — **declined at the founding (one resident, no collaboration, ever)**. Buying the complexity would return nothing.
- 🔵 **CLAUDE'S FRAMING (not a sourced claim about Notion) (owner asked directly: "if Notion does that, can/should we do this too?") — we already have the good half, in a better place.** ⚠ **The motive claim is UNSOURCED — Notion has never said this, and it is Claude's reading, not a fact:** *that Notion promoted the paragraph into an addressable reusable unit because it has no concept of material.* **What is actually observable** is only the contrast itself: Notion's addressable unit is the paragraph; this project's is the **bit**. **This project has bits.** The addressable reusable unit already exists as its own kind of thing, and a better one: a bit can be an image, a drawing, a voice memo, a whole PDF, and it can sit on many boards at once, alive on all of them.
  - **The seam already falls in the right place:** the parts of the writing that need their own identity **already have rows** (the gathered things); the owner's own sentences do not need identity and stay in the document. A hybrid already exists, split correctly.
  - **The closer:** every want that a *synced block* would serve, the model answers better — *"I want this paragraph in two compositions"* → then it is not a paragraph, it is **material**: make it a bit and gather it into both.
  - **What copying Notion would cost:** every edit a row write · opening a composition an assembly job · reordering rewrites position keys — **owned by one person, with no team to pay the bill down the way Notion did.**
- ⚠ **And note what does NOT need blocks:** folding a section · dragging a heading with its section · the table of contents. All are **editor behaviour**, not filing.

**What the feature list actually demands** — only three lines have teeth:

| feature | demand on storage |
|---|---|
| rich text · fold/drag a heading · table of contents · images · undo | **nothing** |
| read/write lock | one column |
| **links to headings** | **headings need permanent ids surviving rename + move** |
| **chips and blocks** | **every reference must be findable in the writing, reliably** |
| **search the body** | **Postgres must read the words out** |

🔵 **Claude's recommendation: ONE STRUCTURED DOCUMENT per composition (the editor's own format), not the HTML string used today.**
1. **The chips.** Today they are found by pattern-matching HTML text (`extractRefIds`). It works, but a formatting change can break it *silently* — discovered only when a chip stops counting. Walking a structured document finds them exactly.
2. **The heading ids.** In HTML they are attributes a paste or sanitizer can strip; one missing id breaks every link to that heading. Structured, they are real fields that cannot be dropped by accident.
- ⚠ **The honest cost, NOT yet proven:** Postgres searches the body today by regex-stripping tags (`bit_search_text`). Structured storage needs text pulled out of the structure instead. Believed doable in the same style as the existing `bit_face` / `bit_search_text` functions — **to be RUN and shown before it is committed to.**

### 21.6 Naming *(owner, 2026-09-02)*
- ✅ **"note" is retired** — *"we're gonna get rid of note, that's old words."* Supersedes the D-118→D-121 note vocabulary in `lexicon.md`.
- ✅ **"composition" stands** — *"I think composition is nice"* (open to a better word; no rival proposed).
- ✅ **Route: `/composition`.**
- ✅ **"chip" and "block" are user-facing words** — *"we can say chips and blocks to users, I think that's good."* They stop being Claude's shorthand.
- ⚪ **"gather" — soft.** *"You really anchored on the word gather; I wasn't the biggest fan, although I don't dislike it."* Stays live, not settled.
- ⛔ **"link" is unavailable** — taken 2026-09-01 as the `link` bit type (D-129).
- ⚪ **No words yet for the two directions** (forward / backward). Owner: *"forward link, back link — some of these things don't have words… we were using words to be straight with what we were accomplishing."* Today's backward surface reads **"gathered into."**

### 21.7 Deferred
⏸ **The migration** — moving existing notes across and rewriting pointers. *(Owner: "it's OK for the migration, I think about that a little bit later.")* Includes converting existing HTML bodies if §21.5 is adopted.


## 23 · Per-surface presence, and composing beside the board *(2026-09-03; the floater worked through while the owner was at lunch)*

### 23.1 ✅ Presence is stored ON THE TIE — the owner's analogy, made exact
*(Owner: "similar to how a bit can be on multiple boards and each time its position and its size is stored differently — if it gets pulled into a composition it needs to be stored the analogous same way.")*
- `placement` stores how a bit sits on **that board**: x · y · w · h · z.
- The reference row must store how the bit sits in **that composition**: **form (chip | block)** · when block: **its size there** · **left / centre / right**. No x/y — the writing's flow decides where.
- Same bit → three surfaces → three independent presences, each on its own tie. Resizing one never touches another *(owner: "of course independent")*.
- **The narrow-place rule:** the stored size is a **maximum**; display caps at the container's width. Nothing stored twice.
- Export: no special handling beyond including the files — *(owner: "wouldn't export just be taking what the user is viewing")*. Concern dropped.

### 23.2 The floater — composing while looking at a board *(🔵 Claude's analysis, for the owner's rulings)*
⚠ **STATUS NOTE (2026-09-03, later that day):** the owner opened her reply to this section with *"No — I don't think it should gather, it should be more like a hovering thing"* and pivoted to a NEW feature (the hover layer, §26) **without reading the rest of this section** (her words). So the proposal below is **neither confirmed nor vetoed** — re-present it when the board-side posture is actually built.

**The gesture to define: dragging a card from the board into the floater GATHERS — it never moves.** The bit lands in the writing at the insertion point; the card stays placed exactly where it was (gather is a tie, not a relocation). ⚠ If unspecified, drag-as-move gets built and a board rearranges itself while you write. *(Already ruled nearby: no drawer in the floater — "the board itself is the drawer in that posture.")*

**Hole 1 — the same composition open twice** (its page + the floater): two editors autosaving one document silently overwrite each other. Was already the frame-handoff debt; the floater makes it live. 🔵 Simplest guard: **one live editor at a time** — the second opening is read-only with a "writing elsewhere — take over?" door.
**Hole 2 — whose undo:** the board has its own undo (D-137); the composition has ~15 steps. **Cmd+Z follows FOCUS** — cursor in the floater undoes writing; focus on the board undoes arranging.
**Hole 3 — narrow width:** the linear document reflows naturally; the one exception is a **table**, which scrolls sideways inside its own block.
**The synergy to build on purpose:** "make this a bit" in the floater offers **"…and place it on this board"** — the reverse flow (scene 5, writing→board) becoming one act via the existing call-in machinery.
⚪ Small: is the floater's open state remembered per board? (The hide-toggle was ruled stored — same question, smaller.)

### 23.3 ~~Where the owner left off (lunch)~~ — superseded by §24–§26, written when she returned


## 24 · The composing model — SETTLED *(owner, 2026-09-03: "the notion surface is the way I wanna do it")*

### 24.1 The ruling
The composition is a **Notion-style linear editor**: every unit is a full-width block in a vertical flow, dragged up/down only. **Everything typed or pasted — text AND images — is WRITING, never automatically a bit.** *(Owner: "when we compose… it's going to be like a block line thing and of course they can resize… and if they want, they can also make it a bit — but when they're in the compose we don't assume they want bits.")* A bit exists on this surface only by a deliberate act: **brought in** (gather) or **promoted** ("make this a bit", F-5).

### 24.2 Identity vs collection *(the distinction that unlocked it)*
A Notion block has an id from birth (client-side, verified — research doc §10) — but Notion has **no collection of blocks**: addressable ≠ collected. Here, every block gets an **identity** (needed for reorder/links); **no block enters the collection**. "Bit" keeps meaning *deliberately kept material*. Write 2,000 words → the collection is unchanged.

### 24.3 Pasted images — ✅ writing, and the file mechanics *(🔵 Claude's analysis of the trap, accepted direction)*
A pasted image is a block of writing (resizable, left/centre/right), NOT a bit. Its **file** still needs a home → **composition-owned files**: same bucket + downscale/thumbnail code as bits, no bit row — the document references the path. Lifecycle: **reconcile-on-save** (the chips' own mechanism — compare the doc's image list to stored files) · **never delete eagerly** (undo must restore) — orphans go by deferred sweep. ⛔ **Rejected: pasted images as hidden bits** — reintroduces things-are-bits-without-deciding + a leaky hidden state. **Promotion moves the file into bit ownership** (else destroying the composition orphans a bit's image on three boards).

### 24.4 Promotion and the flatness law
- **Ruled (foundations): only compositions weave — a bit never gathers** (no outgoing ties). ⚠ Today's build still lets a plain bit's page use `[[`; **that door closes at the split.**
- **Incoming is untouched:** any bit can be gathered *into* any composition. So a promoted paragraph = an **ordinary text bit** — gatherable elsewhere, placeable on boards. *(Owner asked "does that mess up anywhere?" — no.)*
- ⚪ **The one edge, needs a ruling:** promoting a paragraph that **contains a chip**. Flatness forbids the new bit carrying the tie. 🔵 Lean: **the chip flattens to its plain text in the new bit** — the sentence reads, the tie stays behind. (The existing destroyed-chip degrade rule, applied at birth.)

### 24.5 The presence split it produces
| on the surface | nature | can drift? | editable here? |
|---|---|---|---|
| typed / pasted (text, images, your tables) | **yours — writing** | never | fully |
| gathered (chip or block) | **a tie to material** | yes — edits elsewhere show here | ⚪ **the window-or-copy question — OPEN** |
⚪ Also open: does a gathered thing get a small **origin tell**, or stay visually identical to your own content? (Two identical-looking images, one can drift — the seam is real.)

### 24.6 The scenes *(run 2026-09-03; the model's test fixtures)*
S-C1 morning pages → nothing minted ✓ · S-C2 the Substack flow (board → drawer → weave) ✓ **the promise working** · S-C3 six pasted screenshots → all writing; one promoted later ✓ · **S-C4 the typo in a gathered quote → ⚪ window-or-copy, unanswered** · **S-C5 essay wants to become a board → laborious (promote × N); F-4 piece-as-board's re-entry case; "either order" is a core principle, so the roughness matters** · S-C6 the inline table → formatting; promote when wanted ✓ · S-C7 quoting your own earlier piece → whole-composition tie or plain paste; a *passage* can't be pulled — escape: make the section its own composition; feel it in practice.

## 25 · The moves — the practical inventory *(laid out 2026-09-03 at the owner's ask: "what are the moves, what do we limit, what flexibility might they want — literally")*
**Markers: ✅ ruled · 🔨 built today · ⚪ open · ⛔ limited on purpose.**
- **Write:** type/Enter/Shift+Enter 🔨 · bold·italic·quote·lists 🔨 · headings ✅(🔨 unstyled) · checklist ✅ planned · a table you make = writing ✅ · `/` menu (typed `/` only, never re-fires on paste/undo) ✅ · collapsible sections ✅ wanted (⚪ heading-is-the-unit, Claude's lean, vs separate toggles)
- **Move writing:** cut/copy/paste the main path ✅ · drag block up/down ✅ · heading carries its section ✅ · folded+backspace → unfold first ✅ · undo ~15 ✅
- **Bring in:** `[[` → chip 🔨 · the drawer ✅ planned · block form ✅ ruled ⛔ not built · outside text → paragraph + waiting "make this a bit" ✅ · **paste an image → writing ✅ (§24.3)** · gather a board/source ⚪ parked
- **Act on a brought-in thing:** chip click → peek ✅ · block click → selects ✅ · resize/align ✅ · presence stored per-tie ✅ (§23.1) · delete → tie dropped on save 🔨 · **edit it here ⚪ window-or-copy**
- **Get around / meta:** contents (nav only) ✅ · links to headings ✅ · lock ✅ · tag/place/trash inherited ✅
- **⛔ On purpose:** nothing floats (content) · typing never mints bits · no columns/page-nesting (hierarchy is Notion's move; the web here is tags+gather) · no auto-anything (sole exception: the exit-minted title) · no `[[` in the title · no built side-by-side
- **Flexibility they WILL ask for** — decide before they ask: "fix the typo right here" (⚪ window-or-copy) · "collapse this block to a chip" (⚪ per-spot chip↔block toggle — 🔵 lean yes) · "colors/highlights/callouts" (⚪ where formatting stops — callouts cut once, make it a ruled line) · "two columns just here" (answer = the board; the refusal must feel good) · "turn this list into a board" (F-4, parked)

## 26 · THE HOVER LAYER — bits propped above the writing *(the owner's feature, 2026-09-03 — fully ruled in one sitting)*

### 26.1 What it is *(the owner's own description)*
On the composition page, **summon a bit — one or several — and it hovers above the page as a small movable window while you compose underneath.** *"If people want to bring up a bit or a couple of bits and refresh them without the whole board… like a cork-board set-up."* Two layers: **the linear page** (the piece) and **a viewing layer** on top (the owner's desk furniture). *"It wouldn't be like a board surface — it'd be two surfaces almost… and that view can be hidden."*

### 26.2 Why it's legal under the guardrails (§22)
- **"Nothing floats in writing — ever"** banned floating *content* — part of the piece. These windows are **not in the piece**: a reader never sees them, export never includes them.
- **"Spatial belongs to boards"** survives because of what position *means*: on a board, position IS the thinking; here it is **parking** — meaningless, private, furniture.
- Lineage: **the peek, grown up** (summonable without a chip, persistent, movable). **Distinct from F-6** (board-peek): boards are ⛔ excluded here (owner: too small; the board-side posture §23.2 covers that want).

### 26.3 The rulings *(each in the owner's words, 2026-09-03)*
| question | ruling |
|---|---|
| what's remembered | ✅ **positions too** — the full geometry, per composition ("I think 3") |
| editing from a window | ⛔ **viewing only** — "we shouldn't let people edit bits from this display; they have to go into the specific page or onto the board" |
| stick to screen or text | ✅ **screen-fixed** — "it would stay put while you scroll" *(text-anchored = margin notes, a different feature, not this)* |
| what can be summoned | ✅ **bits only** — "a board would be too small… and we have the other way [composing while on a board]" |
| the door | ✅ **the drawer** — "the natural door is the drawer" |
| drawer drag vs prop | 🔵 **lean (Claude's, answering her "how do we distinguish"):** **drag = into the writing** (an insert needs a position; the drag carries it) · **a pin button = prop up** (a window needs none). No modes. |
| a pinned bit is trashed | ✅ **the window just disappears** — 🔵 mechanic: the row is *hidden, not deleted* → restore brings the window back; destroy cascades the row |
| hide-all | ✅ one toggle for the whole layer, **remembered** |
| a cap | ✅ **none** — "as long as we can manage it on our side" (trivial: tiny rows) |

### 26.4 Claude's smaller calls *(🔵 unless marked)*
Not in the composition's undo (not the piece) · exists on the composition **page only** — never inside the board-side floater · summoning an already-open bit **focuses** its window (one row per bit per composition) · off-screen positions **clamp** into view · content is **stale until refresh** if edited elsewhere (the app's last-arrival norm) · long text scrolls inside its window · every window carries **"open →"** to the real page · collapse form ⚪ (pill in place vs an edge strip — pure design, undecided).

### 26.5 Storage, sequencing, name
**One new table** — owner · composition_id · bit_id · x · y · w · h · collapsed — unique(composition, bit), FK-cascade on destroy, owner-only RLS. **Anchored on the composition table, so it BUILDS ONLY AFTER THE SPLIT** *(the owner called this: "it relates to storage, which is why we have to hash it out first")*. **Orthogonal to §21.5** (HTML-vs-JSON) — the layer deliberately lives outside the document. **Build order: last** — step 6 of: ① the split → ② editor core → ③ bring-in (picker-reaches-everything · block form · presence-on-tie) → ④ make-this-a-bit + pasted images → ⑤ postures → ⑥ the hover layer. ⚪ **Needs a name from the owner** (user-facing; owner writes the voice).


## 27 · The cross-cutting pass — composition × every dimension × the lifecycle *(run 2026-09-03 at the owner's ask; the no-blank-cells gate)*

### 27.1 Caught by the pass (schema)
1. **The SUBTITLE column** — ruled in §6b, absent from §21.2's carries-list; would have been silently dropped at build. **Added: title · subtitle · the writing · …**
2. **`board_cards` grows a third leg** — bit-or-board becomes bit-or-board-or-composition; liveness rules ride along (trashed doorway hides, restores back; archived matches archived bits).
3. **Composition-owned files: trash keeps, DESTROY sweeps** — the destroy trigger for the orphan sweep, previously unnamed.
4. ⚪ **Travel:** 🔵 lean — **surfaces don't travel** (no `composition_travel`), matching boards. Needs the owner's nod.

### 27.2 Inherited clean (verified against §21.2–§21.3 + existing patterns)
tags · folder · alive · archive(state) · trash-as-freeze · openings · created/updated · search · the lock column · destroy cascades the ties · a chip pointing at a destroyed composition degrades to plain text (the bits mechanism, unchanged).

### 27.3 Visibility — parked on the owner's word
*(Owner, 2026-09-03: "we have not figured out security/storage/privacy yet — there's some default for now, but we will have to change it in the future.")* **Default `private` (matching boards) as a placeholder; the privacy session owns the real answer** — including public-composition-gathering-private-bits (the AND-composition question, deferred with the layer).

### 27.4 App-level opens, complete list
**Rulings needed:** window-or-copy ⭐ (the storage gate, §24.5) · a BLOCK whose bit is *trashed* (chips ruled; blocks ⚪ — blank vs tombstone) · origin tell · chip-flattening at promotion (§24.4 lean) · collapse form (§26.4) · the global date format (§6b).
**Work, no decisions:** the pull / home / find / graph each grow a composition leg · archived-target display matches bits.

### 27.5 ⚪ "Done" — asked, not invented
No draft-vs-finished state exists anywhere in the model. 🔵 Assumption: **deliberately none** — the gradient stays felt, not stored. The owner says the word if wrong (it would be a column).
