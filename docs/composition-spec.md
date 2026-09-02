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
- 🔵 **The strong version:** reordering entries in the contents **reorders the document**. Pairs with §20.5's heading-drag question — if a heading carries its section, the contents becomes the document's outline control.

### 20.3 A read/write lock *(owner: "that's a great feature idea")*
A composition can be **locked to reading** — the cursor is not live, the text cannot be changed by accident, and the piece can be read as a piece. One control returns it to writing.
- Distinct from **archive** (a resting state for the whole thing); this is a **posture** you switch at will.
- 🔵 Candidate defaults: a **finished** piece opens locked · an archived one is locked by its state (§11.2) · everything else opens writable.
- ⚪ Whether the lock is remembered per composition or is per-visit.

### 20.4 Undo and redo *(owner-ruled)*
Standard undo/redo, **with a bounded history — roughly 15 steps** *(owner: "go back to a certain number and not be able to go forward or backward anymore, like maybe 15")*. Beyond the bound, the earlier state is gone.
- ⚪ Whether the bound is steps, time, or session.
- ⚠ **Undo must cover the pulled-in acts too** — inserting a chip, converting chip↔block, collapsing a toggle — not only typed characters. Reference rows follow the body at the next save (§9.4.4).

### 20.5 Moving blocks — the design space *(owner: "I don't know if you've really thought about this" — correct; here it is)*
| question | options | 🔵 lean |
|---|---|---|
| **Drag a heading — does its section follow?** | just the heading (Notion's answer) · **the heading takes everything under it** to the next equal heading | **takes its section** — it makes reorganising one gesture, and makes §20.2's contents a real outline control |
| **Drop onto a collapsed toggle** | goes inside (invisibly) · lands after it · **unfolds it first, then drops in** | **unfold first** — silently hiding just-moved content loses work |
| **Several blocks at once** | one at a time · multi-select then drag | ⚪ — multi-select exists on boards; unclear it is wanted here |
| **A block that IS a pulled-in thing** | — | drags like any other block; no special case |

### 20.6 Affordances — what is clickable *(the owner's framing: "what do they click, what can they not click")*
| thing | clickable? | what happens |
|---|---|---|
| a **chip** | ✅ | opens the peek |
| a **block's content** (the image, the quoted text) | ✅ | opens the peek — same as its chip form |
| **text inside a block** | ⚪ | selectable for copying, or an atom like a chip? **Unresolved — affects whether a reader can quote from a pulled-in quote.** |
| a **drag handle** | ✅ on hover | drag to move · click for the block menu |
| a **toggle's line** | ✅ | folds/unfolds |
| the **title / subtitle** | ✅ when writable | edits in place; ⛔ inert when read-locked (§20.3) |
| **footer entries** (tags · boards · "pulled into") | ✅ | navigate to that thing |

### 20.7 Two compositions side by side *(owner: "sounds nice — I wonder what we'd need, or do people just open two windows")*
**Today it already works: two browser windows.** Zero cost, zero build.
🔵 **Recommendation: don't build it.** A built version means real window management inside the app for a need that the browser already serves. Revisit only if two windows proves genuinely bad in use.
