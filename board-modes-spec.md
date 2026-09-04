# The board's two modes — the specification

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

---

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

## 8 · Open decisions — the complete list for the owner
1. **Shift-click in edit** — add to selection, or nothing? *(§3.1)*
2. **Tags in arrange** — greyed entirely, or visible read-only? *(§4)*
3. **Enter on a drawing** — reopen the pen, or caption only? *(§5.1)*
4. **Enter on a note/composition card** — inline, or always the floater? *(§5.1, with the composition lane)*
5. **Marquee on touch** — long-press-drag, or a tool button? *(§7.1)*
6. **Finger drawing** — should any mode accept it? *(§7.1)*
7. **The words** — arrange/edit vs compose/view vs other. *(§7.10, naming pass)*

## 9 · What this spec is checked against
- `board-what-you-can-do.md` — every want there must reach its act in ≤2 gestures in some mode
- `board-arrange-vs-edit-mode-plan.md` — the trail, including the review that killed v1
- `docs/composition-spec.md` §4.2 — the floater must not conflict (§7.3)
- `lexicon.md` — the words, under its naming-pass banner
