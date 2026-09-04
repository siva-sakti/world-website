# A board's two modes: ARRANGE vs EDIT — a draft for the owner

**Status: a DRAFT for the owner to react to.** Nothing built. Written 2026-09-04 at the
owner's ask: *"I think there should be an arrange mode versus an edit mode… can you draft up
what that feature would hold, and what it would change, for example with the alignment guide
stuff… I think it would simplify things."*

---

## 0 · The words, and what is actually tracked *(owner asked 2026-09-04: "what is a canvas, what is placement, what exactly are we tracking?")*

**The definitions are `lexicon.md`'s, not this document's** — it is the naming authority and
duplicating it is how two definitions of one word start. Pointing at them, with the part that
matters here:

| word | what it is | where it lives |
|---|---|---|
| **bit** | the thing itself — the words, the photo, the drawing | a `bit` row |
| **board** | a surface things sit on | a `board` row |
| **placement** | **one bit sitting on one board** — its position, size, stacking, tilt, lock, when it arrived, when it left | a `placement` row |
| **card** | the visual box you see on screen. **Not stored** — it is a placement *rendered* | computed (`board_cards`) |
| **canvas** | a board's **spatial rendering mode**. ⚠ Never a synonym for "board" | not stored at all |

**So, to answer the question directly:** a placement is neither "the clicked-in card" nor "the
clicked-out card." It is not a card at all. **A card is what a placement looks like.** The same
placement is both of your two appearances — stripped in arrange, detailed while you are in it.
Nothing about the *placement* changes when you click into it; only how it is drawn.

### ⭐ THE MODE BOUNDARY IS THE PLACEMENT/BIT BOUNDARY

This is the hard definition the earlier "objects vs content" framing was reaching for, and it
is checkable against the schema rather than argued:

> **Arrange mode writes `placement` rows. Edit mode writes `bit` rows.**

Every act sorts itself, with nothing left to taste:

| what a **placement** holds → **ARRANGE** | what a **bit** holds → **EDIT** |
|---|---|
| `x` `y` — move | `body` — the words |
| `width` `height` — resize | `content` — title · caption |
| `z` — send to back | `source_id` — where it came from |
| **`angle` — rotate** | `subtype_word_id` |
| `locked_at` — lock | *(and `tag_application` rows, which point at the bit)* |
| the row existing / `left_at` — on or off this board | |

**Rotation is settled by this, not by taste** *(the owner: "rotation should also be in the
arrange mode… I don't know")*: `angle` is a **placement** column. Turning a card changes how it
sits on THIS board and nothing about the thing itself — the same bit on another board is
untilted. **Rotation is arrange.** So is the degrees readout.

**And it exposes the one true exception.** `trash` and `archive` write `bit.deleted_at` /
`bit.archived_at` — bit columns, so the rule says EDIT. But you will want to throw something
away while tidying. **That is the only place the rule is deliberately broken**, and knowing it
is the only one is worth more than a rule with no exceptions and no teeth.

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

## 2b · ~~THE CARD LOOKS DIFFERENT IN EACH MODE~~ — ⚠ NARROWED by §2c's resolution

*(Kept for the reasoning. The instinct was right — arrange should be clean — but "every card
is stripped in arrange, detailed in edit" was too broad. The owner narrowed it to: only the
card you are actually working on shows its details. See §2c.)*

### The original framing

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

### ✅ RESOLVED: how a card shows its details *(owner reasoned it out, 2026-09-04)*

**First, a correction: Claude overstated the problem.** The draft warned that showing a card's
details in edit mode would make "the board visibly reflow." **It would not.** Cards are
absolutely positioned on the canvas (`card.tsx:241` sets `position={{x, y}}`), so a card
growing **moves nothing else** — it can only overlap a neighbour. The owner rejected all three
of Claude's workarounds (overlay · side panel · reserved space) and was right to: they were
solving a problem that isn't there.

**The owner's reasoning, and where it landed.** First idea — *"when you're editing, why don't
we just always display the title and the tags"* — then the self-check that settled it:

> *"Or is that kind of annoying? Because it makes sense that you want to see everything you're
> NOT touching have it look like it's in its final mode… and only when you're editing do you
> want to see, for that specific thing you're touching, the title and the tags."*

**The ruling:** in edit mode, **every card still looks finished — except the one you are
working on**, which shows its title and tags.

**Why this is the right answer and not a compromise:**
- The details are **where you need them, when you need them** — on the thing you're touching.
- Everything else keeps looking like the board you made, so you're always seeing your work
  rather than its machinery.
- Only **one** card changes at a time, and it's the one you deliberately clicked. Nothing
  surprises you.
- **The board's arrangement genuinely never changes** — the constraint that started this.

So the mode difference is smaller and better than the draft had it: **arrange and edit look the
SAME.** Only the card you are currently inside looks different, and only while you're inside it.

⚪ **One question left:** in ARRANGE mode, does the selected card show its details too? By this
logic **no** — selecting to move is not touching the content. 🔵 Lean: no; arrange stays clean
throughout. *(This is the last thing that would make arrange feel noisy, so it is worth a look.)*

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

## 3 · THE FULL LIST — what is possible, and what is NOT, in each mode

*(Owner's ask: "be very clear — what is possible in which mode, what is not possible." The
right-hand column is the point: a blank there is a decision nobody made.)*

### Touching a card
| | ARRANGE | EDIT |
|---|---|---|
| click a card | **selects** it | **enters** it — its title and tags appear on it |
| drag a card | **moves** it | **nothing.** Cards are anchored |
| resize · rotate handles | **shown** | **hidden** |
| the degrees readout while turning | **shown** | n/a — no rotating here |
| double-click a text card | *(nothing — it is already selected)* | **puts the cursor in the words** |
| double-click a note/composition card | opens its page | opens its page |
| type | **nothing** | **writes into the card you are in** |

### Several at once
| | ARRANGE | EDIT |
|---|---|---|
| shift-click a second card | **adds to selection** | **no** — you are inside one thing |
| drag empty space | **marquee** (select several) | **pans** |
| align · distribute · tidy | **shown, and work** | **hidden** — not greyed |
| the magenta snap guides | **shown while dragging** | n/a — no dragging |

### The card's content and meaning
| | ARRANGE | EDIT |
|---|---|---|
| title · caption | **not shown** | **shown and editable** on the card you are in |
| tags | **not shown** | **shown and editable** on the card you are in |
| source ("from…") | **not shown** | **shown and editable** |
| a card's words | **shown, not editable** | **shown and editable** |

### Putting things on and taking them off
| | ARRANGE | EDIT |
|---|---|---|
| the loose-bits drawer / call a bit in | **yes** | **no** — placing is arranging |
| double-tap empty space → new card | **yes**, and it **switches you to edit** on it | ⚪ **open** — see below |
| remove from this board | **yes** | **no** |
| lock · send to back · duplicate | **yes** | **no** |
| **trash · archive** | **yes** | **yes** — the deliberate exception (§2c) |

### Looking around
| | ARRANGE | EDIT |
|---|---|---|
| pan · zoom · fit-to-view | **yes** | **yes** — looking is not an act on anything |
| the board's title, description, timeline | **yes** | **yes** — they are the board's, not a card's |
| the pen | its own mode, entered from either | same |

### What is IDENTICAL in both
**Every card in the same place, at the same size, at the same zoom and scroll.** The only
visual difference in the whole app is the single card you are working on. **A mode switch must
never move anything.**

⚪ **Two open, both small:**
1. **Double-tap on empty space in EDIT mode** — make a card and start writing (consistent with
   edit being where writing happens), or refuse it (creating places something, which is
   arranging)? 🔵 Lean: **allow it**, because the alternative is refusing to let you write on a
   surface whose whole job is writing.
2. **Does the selected card in ARRANGE show its details?** 🔵 Lean: **no** (§2c).

## 3b · HOW IT WORKS, in technical detail *(owner asked to see the process walked through)*

### What exists today, and what the mode actually costs

**The owner's read is right:** *"edit mode is actually what we have built as a default right
now."* Today's board is edit mode with arranging bolted onto it — a click selects, a second
click on a text card starts typing, and the title/tags bar (`selected-bar.tsx`) appears for any
single selection. The build is therefore mostly **subtraction**: take today's behaviour, call it
edit, and remove from it the things that belong to arrange.

**The state.** One value replaces the existing `selectMode` boolean:
`const [mode, setMode] = useState<"arrange" | "edit">("arrange")`. It lives in
`board-surface.tsx` beside `editingId`, and the two are different questions: **`mode` is what
kind of surface this is; `editingId` is which card you are inside.** `editingId` is only ever
non-null in edit mode.

**Five places read it, and that is the whole change:**
1. `card.tsx` — `disableDragging` becomes `mode === "edit" || locked`; the resize and rotate
   handles gate on `mode === "arrange"`; the title/tag strip renders only when
   `mode === "edit" && editingId === this card`.
2. `use-board-pointer.ts` — already branches on `selectMode` for marquee-vs-pan; it branches on
   `mode` instead. **No new code, a renamed condition.**
3. `board-toolbar.tsx` — the mode control, and align/distribute/tidy hidden in edit.
4. `use-card-drag.ts` — a drag can only start in arrange, so the snap guides are arrange-only
   **by construction** rather than by a guard that has to be remembered.
5. `selected-bar.tsx` — splits: the arrange acts (lock, send to back, straighten, duplicate,
   remove) stay for arrange; tags/title/source move to the in-card strip for edit.

**What is NOT touched:** the database, the save queue, undo, the geometry ledger, `board_cards`.
**No migration. Nothing about your bits changes. Revertible in one commit** — which is why this
is safe to build and look at rather than debate further.

### The "would you like to edit?" offer *(owner, 2026-09-04)*

*"You can't ever click in and edit something — it'll prompt 'would you like to edit'."*

**Why it matters more than it sounds:** it is the answer to §8's failure mode. A mode you can be
in without knowing is only dangerous when it silently does nothing. Here, the moment you try the
thing this mode does not do, **the app tells you which mode you are in and offers the way out.**
That converts the classic modal trap into a signpost.

🔵 **Proposed shape:** double-clicking a card's text in arrange shows a small inline offer on
that card — *"edit this?"* — one click away from switching to edit **with that card already
open**. It does not steal the gesture the way a modal would, and it costs nothing if ignored.

⚪ **Open:** does the same offer appear if you *type* on the keyboard with a card selected in
arrange? 🔵 Lean: yes — typing at a selected card is unambiguous intent to write.

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

## 6 · THE QUESTIONS — everything I need from you, in one batch

*(Owner: "bring questions to me… if I missed anything that you already asked about, just bring
it to me in the next batch." So this is the complete list, re-asked, not a delta.)*

### 🔴 Blocking — I cannot build without these
1. **Panning in arrange mode.** Empty-space drag draws a marquee there, so panning needs
   another gesture. Space-bar + drag · two fingers on a trackpad · a hand tool. **This is the
   one most likely to make arrange feel worse than what you have now**, and it needs your hands,
   not my judgement.
2. **Which mode do you land in when you open a board?** 🔵 Lean **arrange** — you arrive to look
   and move; writing is something you go *into*. But you said edit is close to today's default,
   so landing in arrange is the bigger change to how it feels.

### 🟡 Shapes the feature, but I can build with the lean and you can overturn it
3. **Does a selected card in ARRANGE show its details?** 🔵 Lean **no** — selecting to move is
   not touching the content, and this is the last thing that could make arrange feel noisy.
4. **Double-tap empty space in EDIT — make a card, or refuse?** 🔵 Lean **allow**; refusing means
   refusing to let you write on a surface whose job is writing.
5. **The "would you like to edit?" offer** — inline on the card (🔵 lean) or something else? And
   does *typing* at a selected card trigger it too (🔵 lean yes)?
6. **What is this mode called on screen?** "Arrange" and "Edit" are Claude's words. ⚠ You have a
   **naming pass** running that may move "bit" and "inbox" — these two labels should probably
   wait for it, or be decided inside it. *(You also said "view mode" once and "arrange" once —
   worth settling which.)*

### 🟢 Answered already — flagging so you can overturn, not asking again
7. **Rotation is ARRANGE** — settled by §0: `angle` is a placement column, so turning a card
   changes how it sits on *this* board and nothing about the thing.
8. **Snapping + guides are ARRANGE** — a drag only exists there.
9. **Trash/archive are in BOTH** — the one deliberate exception to §0's rule.
10. **Only the card you are inside shows its details** — your own resolution.

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
