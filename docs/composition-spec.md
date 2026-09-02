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
| **silent bit-hood** | In the writing, a pulled-in thing **renders as normal document content** — an image looks like an image, a quote reads as a quote. **Forbidden: badges, borders, icons, or any persistent marker distinguishing pulled-in content from typed content.** Its bit-life (source · tags · where else it lives) appears **only** on tap or hover. | owner |

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
