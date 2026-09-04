# A board's two modes: ARRANGE vs EDIT — a draft for the owner

**Status: a DRAFT for the owner to react to.** Nothing built. Written 2026-09-04 at the
owner's ask: *"I think there should be an arrange mode versus an edit mode… can you draft up
what that feature would hold, and what it would change, for example with the alignment guide
stuff… I think it would simplify things."*

---

## 1 · The one-sentence version

**Arrange mode treats a card as an object; edit mode treats it as a page — and they LOOK
different.** In arrange you see the things themselves, stripped of titles and tags; in edit you
see each thing with its details. Right now the board tries to be both at once, and works out
which one you meant from how you clicked.

## 2 · What this is, and what it is NOT *(corrected by the owner, 2026-09-04)*

**Claude's first draft got this wrong and the owner caught it.** It argued that this
"removes a mode", because `selectMode` already changes empty-drag to a marquee and card-tap
to toggle-selection — so the feature was really that toggle, finished and named.

The owner: *"select mode lets you select multiple things. That's different than an entire
surface for arrangement, or an entire surface for editing."*

**Correct.** `selectMode` is a **selection technique** — how you pick several things. What is
being proposed is a **posture for the whole surface** — what the board *is* right now. Those
are different kinds of thing, and the first framing shrank the second into the first because
the first was already familiar. *(A recurring Claude failure this session: reaching for a
reframe that makes an idea sound cheaper, and losing what it was.)*

**So state it honestly: this ADDS a mode.** `selectMode` folds INTO arrange mode — multi-select
is simply always available there — which is a genuine tidy-up, but a small one, and not the
argument for the feature.

### The real argument, now that "it's free" is off the table

1. **One posture means one meaning per gesture.** Today a click on a card means *select* or
   *edit* depending on the card's type and on whether it was already selected. That rule is
   learnable but it is a rule; a mode replaces it with a fact you can see.
2. **Each surface can then be designed for its job** — spatial affordances (guides, grids,
   alignment) belong to arranging and clutter writing; the chrome that serves writing (title,
   tags, source) clutters arranging. Today both compete for the same screen at the same time.
3. **The two jobs diverge as the board gets richer.** More card types and more spatial tools
   make one undifferentiated surface harder, not easier.

### And the honest cost
**It is a mode, with a mode's real failure: being in the wrong one and not knowing.** That is
not hypothetical and it is not designed away by wanting it not to happen — it is paid for with
visibility (§5) and with `Escape` always meaning "back to arrange".

## 2b · ⭐ THE CARD LOOKS DIFFERENT IN EACH MODE *(owner-ruled 2026-09-04)*

*"Every time you arrange, it's just gonna be a cleaned-out version of the card — no title, no
tag. Every time you edit, they would see the details of it."*

**This is the strongest part of the feature, and it was not in Claude's draft.** The modes were
framed as differing in what your gestures *do*. The owner's version is that they differ in what
you *see*:

| | **ARRANGE** | **EDIT** |
|---|---|---|
| the card shows | **the thing itself, and nothing else** — the photo, the words, the drawing | the thing **plus its details**: title · tags · source · caption |
| the board reads as | your material, arranged | your material, with its machinery visible |

**Why this matters more than the gesture rules:** arranging is a *visual* act — you are judging
shape, weight and spacing. Titles and tag chips are exactly the noise that makes that hard, and
they are attached to every card at once. Stripping them is not a tidiness preference; it is what
makes the arrange surface usable for the thing it is for.

And it gives the mode an **honest tell**. §8 names "a mode you can be in without knowing" as the
way this fails. If the whole board visibly changes appearance, that failure mostly cannot happen
— the answer to *"which mode am I in?"* is the screen itself, not a highlighted button.

⚪ **Open, and worth one look before it is called right:** does a card in arrange keep its
*caption* (words the owner wrote about a photo)? It is a title by another name, but for a photo
it is often the only way to tell two similar images apart. 🔵 Lean: **no** in arrange — the
image is the identity there — but this is the one place the rule might read as losing something.

## 2c · ⭐ THE BOUNDARY, DRAWN CLEANLY *(owner, 2026-09-04: "I realize we need to draw the boundaries more cleanly")*

### The one rule that decides every case

> **Arrange acts on the card as an OBJECT. Edit acts on the thing's CONTENT.**
> *Does this change where and how it sits — or what it is?*

That single question settles the whole list below without case-by-case argument, which is
what makes it a boundary rather than a preference.

### ⚠ And the constraint the owner set, which is sharper than it looks

*"That would not change how it's arranged on the page… you'd be able to click in, but you
wouldn't be able to move things around."*

**Edit mode must not re-lay-out the board.** Same cards, same places, same sizes. You are
looking at the same arrangement — you simply cannot push it around, and you can work inside
a card.

**This has a consequence Claude's §2b missed.** If a card in arrange is *stripped* (no title,
no tags) and in edit *shows its details*, then a text card would **grow** when the details
appear — auto-height — and the board would visibly reflow on every mode switch. That is
exactly what the owner just ruled out.

So the details cannot simply be *added into* the card's box. Three ways out:
- **(a) 🔵 the details overlay the card** — floating on top, the card's box unchanged. Layout
  is untouched by construction, and it reads as "looking closer at this thing."
- **(b) a side panel** — the details live off the card entirely. Zero layout risk; costs
  screen and puts a thing's tags far from the thing.
- **(c) the card reserves the space in both modes** — no reflow, but arrange stops being
  visually clean, which was the whole point of §2b.

**🔵 Lean: (a).** ⚪ **The owner's call** — it decides what edit mode *looks* like.

### The boundary, act by act

| act | mode | why, under the rule |
|---|---|---|
| move · resize · **rotate** · the **degrees readout** | **ARRANGE** | where and how it sits |
| **snapping + the magenta guides** | **ARRANGE** | a drag is an arrange act; guides serve it |
| align · distribute · tidy · send to back · lock | **ARRANGE** | arrangement, plainly |
| multi-select · marquee | **ARRANGE** | you select several things *to arrange them* |
| put a bit ON the board · take it OFF | **ARRANGE** | membership is where it sits |
| double-tap empty space to make a card | **ARRANGE**, then drops you into EDIT | placing is arrange; the typing that follows is not |
| the pen | its own mode | unchanged |
| **write in a card** | **EDIT** | the content |
| title · caption · tags · source | **EDIT** | what the thing is |
| open a note/composition to its page | **EDIT** | going into the thing |
| **pan · zoom** | **BOTH** | looking is not an act on anything |
| **trash · archive** | **BOTH** — a deliberate exception | strictly "what it is", so the rule says edit. But you will want to throw something away while tidying, and hiding a destructive act behind a mode switch is worse than a tidy rule. *Stated as an exception rather than bent into the principle.* |

### What is NOT different between the modes
Same cards, same positions, same sizes, same zoom, same scroll position. **Switching modes
changes what you can do and what you see ON a card — never where anything is.** A mode switch
should be visually calm: nothing jumps.

## 3 · What each mode holds

| | **ARRANGE** — the board as a space | **EDIT** — the card as a page |
|---|---|---|
| a click on a card | selects it | opens it: title · tags · source · its words |
| a drag on a card | moves it | *nothing — cards are anchored* |
| resize · rotate | ✅ | ✗ |
| **alignment guides + snapping** | ✅ **only here** | ✗ |
| align · distribute · tidy buttons | ✅ | ✗ hidden, not greyed |
| multi-select · marquee | ✅ *(owner: selecting several is an arrange thing)* | ✗ |
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
- ~~**A mode you can be in without knowing.**~~ **Largely answered by §2b** — the whole board
  changes appearance, so the answer to "which mode am I in?" is the screen rather than a
  highlighted button. `Escape` still always returns to arrange.
- **Solving a problem that isn't there.** The owner's original example — guides intruding while
  editing — turned out to be already impossible. The case for this rests on the *other* four
  rows of §3, not that one.
- **Panning becoming worse for everyone to make marquee better for a few.** §5.
