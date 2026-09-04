# The board's two modes — the specification

> # 🔴 ANTAGONIST v2 — verdict: NOT buildable. The core argument was FALSE. *(2026-09-04)*
>
> **Verified against the code, not relayed:**
>
> **B1 — the depth argument compared against a design that doesn't exist.** The spec said
> entering a card today costs a *double-click*, and that on a phone double-tap fights the
> browser. **Neither is true.** Entering is **click-when-already-selected**
> (`card.tsx:350` — two separate taps, no timing window); there is no `onDoubleClick` on any
> card body. And `.compose-board { touch-action: none }` (`globals.css:45`) **already**
> suppresses browser double-tap zoom — empty-space double-tap-to-create proves it works on
> touch today. So *"double-click is now free"* buys nothing: it was never spent. And the table
> miscounted the incumbent: seeing a card's title/tags is **one** tap today (they appear on
> select) — under the mode, from the landing mode, it is switch + tap = **two. Worse.**
>
> **The honest ledger:** the mode wins on entering the *second and later* card per visit; it
> loses on seeing the first card's details; and "double-click = open everywhere" is available
> today with no mode at all.
>
> **B2 — §4 violates §1.** The principle says *"never decides what you may DO"*; §4 greys **ten
> controls by mode**. That is v1 with `disabled` instead of `display:none`. And it
> contradicts itself: tags greyed in arrange for one card (§4), tags' *"natural home"* is
> arrange for several (§7.7). **The fix is the owner's own words:** every act hangs off the
> *selection*; the mode changes exactly two things — what a click on a card does, and where
> typing goes.
>
> **B3 — edit mode has no selection or pointer model.** Drag on the *entered* card is text
> selection (that is why `disableDragging={editing}` exists); marquee in edit selects things
> nothing can act on; Escape's second stage returns to arrange with nothing to select.
>
> **Also:** a composition card's enter is **already ruled** — the floater
> (`composition-spec.md` §10.1.4); this spec overrode it. `selectMode` is today's **only touch
> multi-select**, retired with no replacement. §5.1 rules on board-cards, which never render.
> Text cards **do** change height on enter (they are auto-height), so §5's "never changes
> size" is false.
>
> **What survives all of it, and it is the owner's original instinct, not Claude's argument:**
> *"it makes sense in the mind to separate these actions."* That is a reason. It is just not
> the one this spec argued from. **Whether it is enough is the owner's call, with the corrected
> ledger in front of them.**


**Status: 🔵 a top-down draft for the owner, then an antagonist, then the owner again. Nothing
built.** Written 2026-09-04. The reasoning trail that produced it is
`board-arrange-vs-edit-mode-plan.md`; this document is the *result*, laid out from the top so
it can be checked as a whole. **Words are placeholders** — "arrange" and "edit" belong to the
naming pass (the owner has also said "compose" and "view").

---

## 1 · The principle

> **A mode decides what your input MEANS. It never decides what you may DO.**

Two modes because a card needs two things from a click — *pick this up* and *go into this* —
and one surface can only give a click one meaning. Putting the second meaning on double-click
costs every card an extra gesture, and on a phone double-tap fights the browser. Two modes give
each meaning its own click.

**Every act is available in both modes.** What changes is what a click, a drag and a keystroke
do, and what the card and the toolbar show.

### 1.1 The argument, as a table — interaction depth *(the owner's framing: "what hierarchy would we need?")*

| action | one surface | depth | two modes | depth |
|---|---|---|---|---|
| select · move | click · drag | 1 | arrange: click · drag | 1 |
| resize · rotate · lock · trash · align… | select → handle/button | 2 | arrange: same | 2 |
| **enter a card** *(cursor in the words)* | **second click on a selected card** | **2** | **edit: click** | **1** |
| **see title · tags · source** | select → they appear | 2 | **edit: click — with the cursor** | **1** |
| open full page | select → button · *or* double-click on a note | 2 / 1 | **double-click, every card** | 1 |

**The mode buys two things:** entering drops from two clicks to one — small on a mouse, large on
a phone — and double-click becomes free to mean *open* for every card, killing today's
type-dependent inconsistency. **Everything else is the same depth either way**, which is why
those acts hang off the selection, not the mode. **The cost is one switch per visit.**

---

## 1b · The words *(confirmed by the owner 2026-09-04; definitions are `lexicon.md`'s)*
**board** — the surface, stored · **canvas** — the board's infinite spatial *rendering*, never a
synonym for board · **frame** — an optional page-shaped fixture *on* a board (`frame-plan.md`) ·
**placement** — one bit sitting on one board · **card** — what a placement *looks like*, not
stored. **Modes belong to the board**, not to the frame or to anything floating over it.

## 2 · The two modes, defined

| | **ARRANGE** | **EDIT** |
|---|---|---|
| **in one sentence** | *I am working on the board* | *I am working on a thing* |
| **a click on a card** | selects it | **enters** it — cursor, title, tags, source appear together |
| **a drag on a card** | moves it | moves it *(same foundations — a silent no-op is worse)* |
| **typing** | nudges the selection *(arrows)* | writes into the entered card |
| **double-click on a card** | opens its full page | opens its full page |
| **the card shows** | only itself | only itself — **except the entered one**, which shows its details |
| **the toolbar** | one toolbar, the thing-tools greyed | the same toolbar, the spatial-tools greyed |
| **you land here** | ✅ always | — |
| **Escape** | clears the selection | leaves the card; a second Escape returns to arrange |

---

## 3 · Every gesture, both modes

### 3.1 On a card
| gesture | ARRANGE | EDIT |
|---|---|---|
| click | select *(replaces selection)* | enter *(one card entered at a time)* |
| shift-click | add to selection | ⚪ *(open: add to selection, or nothing?)* |
| drag | move it, and everything selected with it | move it |
| drag a resize handle | resize | resize |
| drag the rotate handle *(top-centre)* | rotate, with the live degrees readout | rotate |
| double-click | open full page | open full page |
| typing | nothing *(arrows nudge)* | writes |
| long-press *(touch)* | 🔵 the card's menu | 🔵 the card's menu |

### 3.2 On empty space
| gesture | ARRANGE | EDIT |
|---|---|---|
| drag | **pan** | pan |
| shift + drag | **marquee** *(select several)* | marquee |
| double-tap | new text card, **and switch to edit on it** | new text card, entered |
| scroll · pinch | zoom | zoom |
| click | clear selection | leave the entered card |

### 3.3 The keyboard
| key | ARRANGE | EDIT |
|---|---|---|
| arrows | nudge the selection · **pan when nothing is selected** | move the cursor |
| Delete / Backspace | remove the selection from this board | delete text |
| ⌘A | select all cards | select all text in the card |
| ⌘Z / ⌘⇧Z | undo / redo *(one stack, both modes)* | same |
| ⌘= · ⌘− · ⌘0 | zoom | zoom |
| Escape | clear selection | leave card → then leave edit |
| 🔵 **E** / **A** | switch mode | switch mode |
| 🔵 Tab | — | next card *(enter the next one)* |

---

## 4 · The toolbar — one toolbar, greyed by mode *(owner-ruled: stable beats shuffling)*

**The rule:** every control is always present, in the same place. A control that does not
apply in this mode is **greyed, and tapping it says why and offers the switch** —
*"switch to edit to tag this"*. The greyed pattern is the mode's visible tell.

| control | ARRANGE | EDIT | it acts on |
|---|---|---|---|
| **the mode switch** | · | · | — |
| + text · + audio · + pdf · pen · bring in | ✅ | ✅ | the board |
| undo · redo | ✅ | ✅ | — |
| zoom · fit | ✅ | ✅ | the view |
| **line up** *(6)* · **even gaps** *(2)* · **tidy** | ✅ *(≥2 selected)* | 🔘 greyed | the selection |
| lock · send to back · straighten | ✅ *(1 selected)* | 🔘 greyed | the selection |
| duplicate | ✅ | ✅ | the selection / entered card |
| remove from board · trash · archive | ✅ | ✅ | the selection / entered card |
| **tags** | 🔘 greyed *(→ "switch to edit")* | ✅ *(on the entered card)* | the entered card |
| **title · caption · source** | 🔘 greyed | ✅ | the entered card |
| open full page | ✅ | ✅ | the selection / entered card |
| the board's title · description · timeline | ✅ | ✅ | the board |

**Greyed means:** `aria-disabled`, dimmed, still focusable, and a tap explains in one line and
offers the switch. Never silent.

⚪ **Open:** does **tags** show in arrange as *read-only* (you can see them on the selection,
not change them)? 🔵 Lean: greyed entirely — *"separate in the mind"*.

---

## 5 · The card — how it looks in each mode

| | ARRANGE | EDIT, not entered | EDIT, entered |
|---|---|---|---|
| the thing *(words · photo · drawing…)* | ✅ | ✅ | ✅ editable |
| selection outline | when selected | — | entered outline *(distinct from selected)* |
| resize / rotate handles | when selected | — | when entered |
| title / caption line | ✗ | ✗ | ✅ |
| tag chips | ✗ | ✗ | ✅ |
| "from…" source line | ✗ | ✗ | ✅ |
| lock badge | ✅ when locked | ✅ when locked | ✅ |

**The card never changes size between modes** — the details are drawn *within* the entered
card's box, or overflow it. A mode switch moves nothing.

### 5.1 What "enter" means, per card type *(the question nobody asked yet)*
| type | click in edit → |
|---|---|
| text | cursor at the end of the words |
| image · pdf · audio · link | caption field focused; tags and source shown |
| drawing | ⚪ *(open: re-open the pen on it? or caption only?)* |
| note / composition | ⚪ *(open: enter inline, or always open full page? — `composition-spec.md` §4.2 opens a floater)* |
| a board placed as a card | opens that board |

---

## 6 · Transitions — what happens when you switch

| from → to | selection | entered card | camera | undo stack |
|---|---|---|---|---|
| arrange → edit *(button / key)* | the first selected card becomes **entered**; the rest deselect | — | unchanged | unchanged |
| arrange → edit *(via "switch to edit to…" on a greyed control)* | the selected card becomes entered, **with that control's target focused** *(e.g. the tag field)* | — | unchanged | unchanged |
| arrange → edit *(via double-tap create)* | the new card entered | — | unchanged | the create is one entry |
| edit → arrange *(button / key / Escape ×2)* | the entered card becomes **selected** | leaves | unchanged | unchanged |
| open a board | — | — | restored per board | empty |

**Mode is view-state:** never stored, never synced, not undoable. Like the camera, but *not*
remembered per board — you always land in arrange.

---

## 7 · The considerations — "future-respect" things, thought through *(owner's ask)*

Each is either **answered**, given a **lean**, or left ⚪ **open with the reason it matters**.

### 7.1 Touch — the app is phone-first for capture
- **No hover** → greyed controls cannot explain on hover; **tap explains** (§4). Non-negotiable.
- **No shift key** → shift+drag marquee is impossible. ⚪ **Needs its own gesture**: 🔵 long-press
  empty space then drag · or a marquee tool button. *(The pen already uses a tool button.)*
- **Double-tap** conflicts with browser zoom → the mode exists partly for this; double-tap is
  only "open", which is less frequent.
- **Palm rejection** — the pen refuses `pointerType === "touch"` (deliberate). ⚪ Should edit-mode
  *drawing* accept a finger? Separate decision, flagged.

### 7.2 Tools vs modes — the pen and the arrows
A **tool** is a temporary grab of the pointer (pen · marquee · later arrows). A **mode** is a
posture of the surface. **A tool lives inside a mode** and returns to it. The pen is a tool
within arrange; it does not need to be a third mode, and it creates a bit without violating
anything because the principle (§1) is about input meaning, not permission.

### 7.3 Compositions on a board *(the committed floater — `composition-spec.md` §4.2)*
The floater opens **over a live board**. Under this spec that is consistent: the floater takes
edit-style input for the composition while the board behind it stays in whatever mode it was.
**Mode is a property of the board, not of things floating above it.** ⚪ Confirm with the
composition lane before either ships.

### 7.4 The frame *(`frame-plan.md`)*
An arrange-mode object: you move and resize it in arrange. In edit it is furniture. No change to
the frame plan.

### 7.5 Undo
**One stack, both modes.** A mode switch is not an entry. Undoing a text edit while in arrange
mode is allowed and just works — the stack does not care which mode you are in.

### 7.6 Locked cards
Lock is a *position* fact. In edit you can still enter a locked card and write in it. In arrange
it does not move. ⚠ Today the lock also hides the rotate handle — keep that.

### 7.7 Multi-select and edit
Edit enters **one** card. ⚪ Should shift-click in edit *add to a selection* for bulk tagging
(owner wants bulk tag)? 🔵 Lean: **bulk tag is an arrange-mode act on the selection** — greyed
today, but the natural home when built. Keep edit single-card.

### 7.8 The empty board
Arrange on an empty board shows the create doors and nothing else. No mode question until there
is a card.

### 7.9 Accessibility
Mode is announced (`aria-live`) on switch. Greyed controls are `aria-disabled` with the reason
as their accessible description. The entered card has a distinct outline from a selected one,
and both meet contrast.

### 7.10 Naming *(the naming pass owns this)*
"Arrange" and "edit" are placeholders. The owner has floated **compose** and **view**. ⚠ "Edit"
already means the archived/live axis in `composition-spec.md` §11.2; "mode" is spent on
rendering in `lexicon.md`. **Decide inside the naming pass, not here.**

### 7.11 What existing habit breaks
`selectMode` (the toolbar toggle) goes away — its marquee moves to shift+drag / the marquee tool.
Clicking a selected text card no longer enters it. **Both are one-line release notes for one
person.**

### 7.12 Two devices
Mode is per-device view state. Two devices on the same board can be in different modes; nothing
conflicts because mode writes nothing.

---

## 7b · What we would LOSE — audited against THIS version *(owner: "I want to make sure we don't lose anything we currently have")*

Under input-meaning **no act is removed**. What changes:

| today | after | verdict |
|---|---|---|
| click a selected text card → cursor | arrange: nothing; switch to edit → one click enters | **the one cost** — one extra step to start typing, per visit |
| double-click: enters text / opens notes | double-click **opens**, every card | gain — one rule |
| title/tags on any selected card | arrange: card clean, toolbar greyed · edit: on the entered card | moved, not lost |
| the `selectMode` toggle | gone — marquee is shift+drag / a tool | habit change, one person |
| everything else | identical | nothing lost |

## 7c · Rulings and where they came from *(provenance — the old spec carried 43 owner references; this one must not carry fewer)*

| ruling | the owner's words | where |
|---|---|---|
| a mode is worth having — to avoid the double click | *"if you have a mode then you [don't] have to make people click twice… it also makes sense in the mind to separate these actions"* | §1 |
| **the mode decides input meaning, not permission** | *"are we getting confused by putting other actions, tying it to that?"* | §1 |
| only the card you're inside shows its details | *"you want to see everything you're NOT touching look like it's in its final mode… only when you're editing do you want to see, for that specific thing, the title and the tags"* | §5 |
| **one toolbar, greyed — not shuffled** | *"all the toolbar icons stay the same but… some things get greyed out… more intuitive than shuffling around the whole toolbar"* | §4 |
| the toolbar is different between modes | *"it shouldn't be the same toolbar, but a lot of the foundational things should be the same"* | §4 |
| panning stays on empty-drag | *"wouldn't panning just be… dragging your mouse on empty space? Wouldn't that be easier?"* | §3.2 |
| trash · archive · remove belong in arrange | *"trashing and archiving and removing from a board would make sense to me in the arrange mode"* | §4 |
| rotation is arrange | *(owner unsure; settled by the depth table and by `angle` being placement state — a confirmation, not the reason)* | §3.1 |
| the "would you like to edit" offer | *"it'll prompt 'would you like to edit'"* | §4 |
| a card never changes size between modes | *"that would not change how it's arranged on the page"* | §5 |
| land in arrange | *(Claude's recommendation, §5b of the trail: safety — arrange cannot change anything you made; ⚪ owner has not ruled)* | §2 |
| the words are the naming pass's | *"I'm doing a naming pass… I probably want to change the word bit also"* | §7.10 |

## 7d · How it is built *(the five files — carried from the trail's §3b)*

The owner's read holds: **edit mode is roughly today's default**, so the build is mostly
*subtraction* plus one new value. `mode: "arrange" | "edit"` replaces the `selectMode` boolean
in `board-surface.tsx`; **`mode` is what the surface is, `editingId` is which card you are in**,
and `editingId` is only ever set in edit.

| file | what changes |
|---|---|
| `card.tsx` | click → select *or* enter by mode; drag stays; handles gate on arrange; the details strip renders only when entered |
| `use-board-pointer.ts` | already branches on `selectMode` for marquee-vs-pan — branches on a modifier instead. *A renamed condition.* |
| `use-board-keys.ts` | arrows: nudge / pan / cursor by mode + selection; Escape's two stages; the mode shortcut |
| `board-toolbar.tsx` | the switch · greying by mode · greyed-tap explains and offers |
| `selected-bar.tsx` | folds into the toolbar's greyed pattern |

**Not touched:** the database · the save queue · undo · the geometry ledger · `board_cards`.
**No migration. Revertible in one commit.**

## 8 · Open decisions — the complete list for the owner
1. **Shift-click in edit** — add to selection, or nothing? *(§3.1)*
2. **Tags in arrange** — greyed entirely, or visible read-only? *(§4)*
3. **Enter on a drawing** — reopen the pen, or caption only? *(§5.1)*
4. **Enter on a note/composition card** — inline, or always the floater? *(§5.1, with the composition lane)*
5. **Marquee on touch** — long-press-drag, or a tool button? *(§7.1)*
6. **Finger drawing** — should any mode accept it? *(§7.1)*
7. **The words** — arrange/edit vs compose/view vs other. *(§7.10, naming pass)*

## 9 · What this spec is checked against, and where it came from
- **`old/board-arrange-vs-edit-mode-plan.md`** — **the previous spec, archived** *(moved after the
  2026-09-04 antagonist finished reading it)*. It holds the full reasoning trail: the schema-first
  rule and why it was wrong, the review that killed v1, the loss audit, the owner's diagnosis
  that rescued the idea. **Every ruling in §7c was lifted from it.** Read it for *why*; read this
  for *what*.
- `board-what-you-can-do.md` — every want there must reach its act in ≤2 gestures in some mode
- `docs/composition-spec.md` §4.2 — the floater must not conflict (§7.3)
- `lexicon.md` — the words, under its naming-pass banner
