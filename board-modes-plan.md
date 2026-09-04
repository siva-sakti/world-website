# Arrange mode vs Edit mode — a draft for the owner

**Status: a DRAFT for the owner to react to.** Nothing built. Written 2026-09-04 at the
owner's ask: *"I think there should be an arrange mode versus an edit mode… can you draft up
what that feature would hold, and what it would change, for example with the alignment guide
stuff… I think it would simplify things."*

---

## 1 · The one-sentence version

**Arrange mode treats a card as an object. Edit mode treats it as a page.** Right now the
board tries to be both at once, and works out which one you meant from how you clicked.

## 2 · The claim worth checking first: this REMOVES a mode

The instinct against modes is that each new one is a new way to be confused — *"why isn't
this working?"* That objection doesn't land here, because **the board already has a partial
arrange mode and calls it something else.**

`selectMode` (the toolbar toggle, `board-surface.tsx:66`) already changes two things:
empty-space drag draws a **marquee** instead of panning, and a tap on a card **toggles
selection** instead of opening it. That is arrange mode, half-built and unnamed.

**So this is not a third mode. It is `selectMode`, finished and named.** Mode count stays at
two (plus the pen), and one of them stops being a mystery toggle. *That* is where the
simplification the owner is after actually comes from — not from adding a switch.

## 3 · What each mode holds

| | **ARRANGE** — the board as a space | **EDIT** — the card as a page |
|---|---|---|
| a click on a card | selects it | opens it: title · tags · source · its words |
| a drag on a card | moves it | *nothing — cards are anchored* |
| resize · rotate | ✅ | ✗ |
| **alignment guides + snapping** | ✅ **only here** | ✗ |
| align · distribute · tidy buttons | ✅ | ✗ hidden, not greyed |
| multi-select · marquee | ✅ | ✗ |
| lock · send to back · duplicate | ✅ | ✗ |
| typing into a card | ✗ | ✅ |
| tags · title · source · caption | ✗ | ✅ |
| trash · archive · remove | ✅ both — a destructive act belongs in both places | ✅ |
| empty-space drag | marquee | pan |
| pen / draw | its own mode, unchanged | — |

**The rule that makes it predictable:** *in arrange you can never accidentally type into a
card; in edit you can never accidentally move one.* Each mode makes the other's whole class
of accident impossible.

## 4 · What it changes for the alignment guides — the owner's question

Today the guides are already safe in the narrow case: editing a card disables its dragging
(`card.tsx:243`) and guides only exist during a drag, so **they cannot appear while you type.**
Verified, not assumed.

What the mode changes is **the rest of the alignment surface**, which is not currently gated:
- The **align · distribute · tidy buttons** live on the toolbar and show whenever a selection
  exists. In edit mode they would be **hidden** — not disabled-and-greyed, which is just a
  puzzle with a lock on it.
- **Snapping while dragging a tilted card** (the owner ruled this in) becomes an arrange-mode
  behaviour by definition, so it can be built without asking "but what if they're editing?"
- The **magenta guides** get an explicit home instead of an emergent one. Today's safety is a
  consequence of two unrelated decisions; that is the kind of thing that quietly stops being
  true.

**A real simplification for the code, not just the screen:** the four `!c.angle` filters, the
`editing` guards, and the `selectMode` branches are all answering *"which mode is this
really?"* one site at a time. One mode value answers it once.

## 5 · How you switch — and the one genuine friction

🔵 **Proposal:** a segmented control in the toolbar (**Arrange | Edit**) · `Escape` always
returns to Arrange · **double-clicking a card jumps to Edit and opens that card**, because
that is what the app does today and the muscle memory is worth keeping.

⚠ **The friction, named rather than discovered:** in arrange mode, empty-space drag draws a
marquee — so **panning needs another gesture.** Today `selectMode` off = pan, and that is the
whole reason the toggle exists. Options: space-bar + drag (the convention in spatial tools) ·
two-finger drag on a trackpad · a hand tool. **This needs the owner's hand to judge, and it is
the thing most likely to make the feature feel worse rather than better.**

## 6 · Open — the owner's calls
1. **Which mode do you land in when you open a board?** 🔵 lean: **Arrange** — you arrive to
   look and move; writing is a thing you go *into*.
2. **Does the pen stay its own mode, or become an arrange-mode tool?** 🔵 lean: leave it alone.
3. **Does a note/composition card open its page in edit mode, or open inline?** Interacts with
   the composition work — worth asking there, not deciding here.
4. **Panning** (§5). The one that decides whether this feels good.

## 7 · Cost, honestly
**Small-to-medium, and it deletes more than it adds.** One mode value replacing `selectMode`;
the toolbar and selected-bar read it; the pointer machine already branches on `selectMode` and
would branch on the mode instead. The card's `editing` state stays — a mode says *what kind of
thing a card is right now*, not *which card you are in*.

**What makes it safe to try:** it is behaviour, not stored data. No migration, nothing about
your bits changes, and it is revertible in one commit. That is unusual for a change this
visible, and it is the argument for building it rather than debating it.

## 8 · What would make this fail
- **A mode you can be in without knowing.** Mitigation: the cursor changes, the toolbar
  changes shape, and `Escape` always gets you out.
- **Solving a problem that isn't there.** The owner's original example — guides intruding while
  editing — turned out to be already impossible. The case for this rests on the *other* four
  rows of §3, not that one.
- **Panning becoming worse for everyone to make marquee better for a few.** §5.
