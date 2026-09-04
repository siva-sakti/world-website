# A board's two modes: ARRANGE vs EDIT — a draft for the owner

> # 🔴 CONCEPTUAL REVIEW: **DO NOT BUILD THIS** *(2026-09-04)*
>
> The owner asked for a conceptual review before anything was built. It returned **No**, and
> its load-bearing claims were **verified against the code and the documents** before this
> banner was written — not relayed.
>
> **The central finding: this is not a split into two postures. It is ONE posture (arrange)
> plus a remainder bucket (edit).** The tell is in this document's own thread sentences —
> arrange's names an *activity* (§2d: *"the board as a picture"*), edit's names a *scope*
> (*"one thing, up close"*). **A mode defined by its target absorbs anything you can do to one
> card**, which is exactly why trash, tag, read and write all ended up inside it and why it
> kept needing new rules.
>
> **And the killer, which inverts §5b's own argument:** writing is migrating to the composition
> surface. §5b used that to argue *for* landing in arrange. But **if writing leaves the board,
> EDIT's only justifying want leaves with it** — what remains is title · caption · tag ·
> source · trash · read. You would be building a surface-wide mode to hold a handful of
> per-card attribute edits. **The migration is an argument against the split, not for it.**
>
> **Three defects verified in this document:**
> 1. 🔴 **It contradicts itself on trash.** §0a's ⭐ table — the one written *to go in the
>    on-screen hints* — says **EDIT**. §2c, §3 and §6 say **BOTH, a deliberate exception**.
>    Nothing reconciles them and the document never noticed.
> 2. 🔴 **The mode has lost its tell.** §8 strikes through *"a mode you can be in without
>    knowing"* citing §2b's visual difference — but **§2c removed it** (*"arrange and edit look
>    the SAME"*). Edit-with-nothing-open is now pixel-identical to arrange, and the punishment
>    for guessing wrong is §3's *"drag a card → **nothing**"*: a silent no-op on the most-used
>    gesture. §8 was never updated. **The named failure mode is live and unmitigated.**
> 3. 🔴 **Two committed documents already answer this question differently.**
>    `docs/composition-spec.md` §4.2 (verified, gates a build): the compose door opens **a
>    floater over the canvas — "the board stays visible and interactive behind it."**
>    `board-actions-technical-audit.md` D-135 layer 6 commits to the same shape (a panel;
>    view-state, not world-state). **If both ship, what mode is a board in while a floater is
>    open over it?** They say interactive; this plan says anchored.
>
> **Also verified:** the **pen creates a `bit`** and so breaks §0c's *"arrange NEVER writes a
> bit row, not once"* — waved through as *"its own mode"*, never argued. **Boards are
> taggable**, and §0a (board → arrange) and §2c (tags → edit) give opposite answers with the
> case in neither table. And this document's own test — *"if a want has to be ARGUED into its
> mode, the split is wrong"* — is failed by roughly half the list.
>
> **One claim checked and found OVERSTATED:** the review calls connectors "built". They are
> **schema-only — `boards.ts:39` says "no create-UI exists yet"**. The underlying point stands
> though: `board-what-you-can-do.md` calls itself complete and does not mention arrows even as
> a gap.
>
> ## ✅ WHAT TO BUILD INSTEAD — everything this feature was for, without the mode
> The review's own observation: §2c already conceded *"arrange and edit look the SAME"* — the
> whole visual difference is **one card**. That is not a mode, it is a **rule**:
> 1. **The finished-card rule** — a card shows its title, tags and source **only while you are
>    inside it**. One condition in `card.tsx`. This is §2b's entire value, shipped.
> 2. **One click rule** — single click always selects; double-click always enters; Escape
>    leaves. Kills the type-dependent branch that is the real defect today.
> 3. **Selection-scoped chrome** — align/distribute/tidy show when something is selected and no
>    card is open. Snap guides are already drag-only by construction.
> 4. **§5's gesture answer as-is** — empty-drag pans, marquee takes the modifier. It never
>    needed a mode. *(⚠ and shift+drag has no answer on a phone or the Daylight.)*
> 5. **Tools stay tools** — the pen and arrows keep explicit tool states. A tool is not a mode
>    of the surface.
>
> **If a mode is still wanted after living with that**, the review's read is that the thing
> actually wanted is a **READ posture** — and that is a card-level affordance (a **peek**,
> already proven on the composition surface, whose rule is *"the peek never edits the target"*),
> not a surface-level mode.
>
> **Everything below is kept as the reasoning trail. It is not a build plan.**


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

## 0a · ⭐ THE LINE, DERIVED THE RIGHT WAY ROUND *(owner corrected Claude, 2026-09-04)*

**The correction.** Claude derived the mode boundary from the schema — *"arrange writes
`placement` rows, edit writes `bit` rows"* — and then argued trash into edit because that is
which table it touches. The owner: *"I'm not asking if it breaks the rule. I'm asking whether
it makes sense to HAVE such a rule."*

**That is the right challenge and Claude had it backwards.** A rule derived from which table a
column lives in is an architecture convenience. It cannot be explained to anyone, it cannot be
shown in a hint, and it produces answers nobody can predict. **The line has to make sense to a
person first. The schema agreeing is evidence we got it right — never the reason.**

### Said the way it should be said

> **In ARRANGE you are working on the BOARD. In EDIT you are working on a THING.**

That is the whole rule, and every case falls out of it without appeal to a table:

| you want to… | which? | because |
|---|---|---|
| move · resize · tilt · stack a card | **arrange** | you are changing what the board looks like |
| line things up, space them out | **arrange** | the board's composition |
| put something on · **take it off this board** | **arrange** | *"I don't want to see this here"* is a fact about the **board** |
| write in a card, retitle it, tag it | **edit** | you are changing the **thing** |
| **trash · archive** | **edit** | *"this shouldn't exist"* is a fact about the **thing** — and you should be looking at the thing when you decide it |

**The owner reached this independently while questioning it:** *"not seeing something on the
board any more is the arrange view, but trashing and archiving you can only do in the edit
view."* Same answer, arrived at from what a person is doing rather than from a schema — which
is exactly why it is the version that goes in the hints.

**And now the schema check, in its proper place:** this line happens to fall exactly on
`placement` vs `bit` (§0). That is a **good sign** — the data model was built around the same
distinction — but it is a confirmation, not the argument.

### The say-it-out-loud test
If a mode's rule cannot be said in one sentence a person nods at, it is the wrong rule. Both
pass now: *"arrange changes the board · edit changes a thing."*

### ✅ And this resolves DUPLICATE, which the rule-from-schema could not
Claude's schema rule got stuck on duplicate (it writes a `bit` row but is obviously an
arranging gesture) and needed a carve-out about *new* things. **Under the human rule there is
no puzzle:** you duplicate a card **to put another one on the board** — that is composition.
**Duplicate is arrange.** If you then want the copy to say something different, you switch to
edit, exactly as you would for any card. *(The owner's point: the schema rule "was not
resolving anything from the ground up.")*

### On-screen, not just in a document *(owner: "helpful on-screen hints and guides")*
The rule is only worth having if it can be *seen*:
- The mode control says what the mode **does**, not just its name — 🔵 *"Arrange — move things
  around"* / *"Edit — work on a thing"*.
- Acts that belong to the other mode are **absent, not greyed** (a greyed button is a puzzle).
- Trying an act the mode does not do gets the **offer** (§3b): *"edit this?"* — the app names
  the mode exactly when you meet its edge.
- ⚪ **Worth deciding with the naming pass:** whether these are called Arrange/Edit at all.

## 0b · THE VOCABULARY, confirmed *(owner, 2026-09-04)*

**Confirming the understanding, since the owner asked to double-check it:**

| | what it is | is it stored? |
|---|---|---|
| **board** | the surface. The thing you make and name | ✅ a `board` row |
| **canvas** | **the board's infinite spatial rendering** — how a board is drawn, not a thing you have | ❌ not stored |
| **frame** | an **optional page-shaped fixture placed ON a board** — "the artist composes on a *page*", `frame-plan.md`. A board stays infinite; the frame is a fixture within it | ✅ (its own row, when built) |
| **arrange / edit** | **modes of the BOARD** — what the whole surface is doing right now | ❌ not stored; per-visit |

**So the nesting is:** a **board** is rendered as an infinite **canvas**, may contain a
**frame**, and is in one **mode** at a time. **The mode belongs to the board, not to the frame**
— a frame does not have its own arrange/edit state; when the board is in arrange you move the
frame and the cards alike. ⚪ *Flagging in case the owner meant otherwise — "each of these we
have an edit mode or an arrange mode" could be read as per-frame, and that would be a different
and much larger feature.*

## 0c · ~~THE HARD LINE~~ — the same conclusion, reached the WRONG WAY *(superseded by §0a)*

*(Kept because the conclusion holds and the reasoning is instructive: it is right about WHERE the
line falls and wrong about WHY, which is how a rule ends up unexplainable. Read §0a instead.)*

The owner: *"If you say that you cannot write bit columns, and then you draw the line at
arrange… does that make sense? Do we have exceptions?"*

**Pressing on it was right, and the answer is: no exceptions. Claude's trash/archive carve-out
was wrong** — pragmatism applied to a rule that was already correct.

**Why it dissolves.** In arrange, the act you actually want is *"get this off my board"* — and
that is **un-place**, which is a **placement** act and stays available. **Trash** is different:
it removes the thing from *everywhere*, forever-ish. That is a decision about the **thing**, and
you should be looking at the thing when you make it.

So the line holds with no carve-out:
- **Arrange** → *remove from this board* ✅ *(reversible, placement-level, exactly the tidying act)*
- **Edit** → *trash · archive* ✅ *(thing-level, where you can see what you are throwing away)*

**And it makes the app safer for free:** you cannot destroy anything from the mode where you are
moving fast and clicking a lot. That is not a cost of the rule — it is the rule paying out.

> **THE LINE, final: arrange mode NEVER writes a `bit` row. Not once, not for convenience.**

## 0d · ⚠ WHAT WE WOULD LOSE — the careful audit *(owner: "I want to be very careful about what exactly is possible, what we might lose")*

Running the hard line against everything the board can do today. **Three acts break**, and all
three break the same way — they **create a bit** while you are arranging:

| act today | why it conflicts | 🔵 resolution |
|---|---|---|
| **double-tap empty space → new text card** | creates a `bit` row | it **creates, then switches you to edit** on that card. You made a thing to write in; writing is where you were going |
| **drop a photo / paste / the pen** | creates a `bit` row | the create is allowed as the *landing* of an arrange gesture, and **the "add a few words?" offer switches to edit** rather than appearing uselessly |
| **the "add a few words?" offer** | writes `bit.content` | as above — it is the thing that hands you over |

**The principle those three share, stated so it is not three special cases:**
> **Making a new thing is the one act that crosses the line — and it crosses by handing you to
> edit, never by writing from arrange.**

**What is NOT lost, checked one by one:** moving · resizing · rotating · aligning · distributing ·
tidying · locking · stacking · multi-select · marquee · pan · zoom · calling a loose bit in ·
removing from this board · duplicating a card *(a bit write — ⚪ see below)* · the board's own
title, description and timeline · undo · the pen as its own mode.

✅ ~~**One genuinely unresolved case: DUPLICATE.**~~ **RESOLVED in §0a** — under the human rule
it is plainly arrange, with no carve-out needed. The three options below are kept only to show
what rule-lawyering from a schema looks like when the rule is derived backwards.

⚪ *(superseded)* **DUPLICATE.** It writes a `bit` row (a real copy) but is
plainly an arranging gesture — you duplicate a card to place it beside the original. It is the
one act where the rule and the feel disagree and "hand off to edit" would be silly.
**Three options:** (a) allow it in arrange as a stated second exception · (b) move duplicate to
edit only · (c) 🔵 **re-read it as arrange-legal because the bit it writes is *new*, never an
edit to something that exists** — the same carve the create acts get. **Lean (c)**, which keeps
one rule: *arrange may bring new things into being; it may never change a thing that exists.*

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

## 2d · ⭐ WHAT A PERSON WANTS TO DO *(owner's ask, 2026-09-04 — the conceptual test)*

*"Take what a user wants to do and list that — what does arrange do, what does edit do."*

Acts are what the app offers. **Wants are what you arrived with.** A mode is only real if the
wants inside it belong together — so this is the list the concept gets judged on, before any
technical step is written.

### ARRANGE — the wants
| what you'd say | the act behind it |
|---|---|
| *"let me see what's on here"* | look · pan · zoom · fit |
| *"this doesn't look right yet"* | move · resize |
| *"these three belong together"* | move · align · distribute |
| *"tidy this up, it's a mess"* | tidy |
| *"this one matters more"* | make it bigger · bring it forward |
| *"give this some life"* | tilt it |
| *"don't let me knock this out of place"* | lock |
| *"I want another one of these here"* | duplicate |
| *"bring in that thing I caught yesterday"* | call a loose bit in |
| **"I don't want to see this on this board any more"** | **take it off the board** |
| *"start something here"* | new card → **hands you to edit** |

**The thread:** every one is about **the board as a picture** — what is on it, where, how big,
in what order. You are standing back and looking.

### EDIT — the wants
| what you'd say | the act behind it |
|---|---|
| *"let me write this down"* | write in a card |
| *"that's not quite what I meant"* | rewrite · fix a typo |
| *"this needs a name"* | title |
| *"what even is this photo?"* | caption |
| *"this belongs with the retreat stuff"* | tag |
| *"where did this come from?"* | source |
| *"read this properly"* | open a note to its page |
| **"I'm done with this thing entirely"** | **trash · archive** |

**The thread:** every one is about **one thing, up close**. You have stopped looking at the
board and started looking at something on it.

### ⚠ The three places the two lists rub — named, not hidden
A conceptual review should push hardest here.

1. **Tagging feels like organising, and organising feels like arranging.** *"This belongs with
   the retreat stuff"* is the same instinct as *"these three belong together."* But a tag
   travels with the thing to every board and to search, while a position belongs to one board
   only. **The test that decides it:** does this change what you see on THIS board, or what the
   thing is everywhere? Tagging is everywhere → edit. *(Still the sharpest tension in the model.)*
2. **"Start something here" is an arrange want with an edit ending.** You wanted a note *in that
   spot* — spatial — and a half-second later you are writing. This is the only want that spans
   both, and it is why creating hands you over rather than being forbidden.
3. **Reading spans both, and may not be either.** *"Let me see what's on here"* is arrange;
   *"let me actually read this"* opens a note. ⚪ **Is reading a third posture we are pretending
   is edit?** Arguably you should be able to read without being in the mode that can change
   things. *(Flagged deliberately: it is the question most likely to reveal the two-mode split
   is really a three-mode one, and it is better raised now than after building.)*

### The claim being tested
> **Arrange = "I am working on the board." Edit = "I am working on a thing."**
> Every want above sits under one of those two sentences without being argued into it.

**If a conceptual review finds a want that has to be argued into its mode, the split is wrong.**

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

## 5 · How you switch, and panning — ✅ THE OWNER ANSWERED THE HARD ONE

🔵 **Switching:** a control in the toolbar · `Escape` always returns to **arrange** ·
double-clicking a card jumps to **edit with that card open** (today's muscle memory, kept).

### ✅ Panning — the owner's answer, and it is better than the question

*"Wouldn't panning just be clicking either arrows, or dragging your mouse on empty space for
arrange? Wouldn't that be easier?"*

**Yes — and it dissolves the friction Claude called the biggest risk in this feature.**

Claude had assumed arrange mode inherits `selectMode`'s behaviour, where empty-space drag draws
a **marquee**, which is what forced panning onto some new gesture. **There is no reason to
inherit that.** Keep the thing that works:

| gesture | arrange | edit |
|---|---|---|
| **drag empty space** | **pan** — unchanged from today | **pan** |
| **arrow keys** | **pan** ⚪ *(new — see below)* | *(they nudge a selected card today)* |
| marquee (select several) | **shift + drag empty space** 🔵 | n/a |
| double-tap empty space | new card → switches to edit | ⚪ open |

**Why this is the better answer:** panning is the most-used gesture on an infinite canvas and
it already works. Marquee is occasional, so **the modifier belongs on the rare act, not the
constant one** — Claude had it backwards. It also means arrange mode does not change how the
board feels to move around in, which removes the main way this feature could have made things
worse.

⚠ **One conflict the owner spotted:** *"right now I think if you're clicking empty space it
could create a card."* Correct — **double-tap** empty space creates a text card. That is a
*double*-tap and panning is a *drag*, so they do not collide today. **But arrow keys do
collide:** they currently **nudge the selected card** (a placement write). ⚪ **So arrows can be
pan OR nudge, not both.** 🔵 Lean: **arrows nudge when something is selected, pan when nothing
is** — which is what you would expect either way.

## 5b · DOES ARRANGE STAND ON ITS OWN? — and what you land in *(owner thinking aloud, 2026-09-04)*

*"Arrange makes sense as a thing on its own if they can do all this… really thinking about how
the user acts and caring about that makes the most sense, and also what makes sense on our
back end."*

### First, the checkable half: is arrange a complete place to be?

Everything you can do there, listed so the question is answerable rather than felt:
move · resize · **rotate** · align · distribute · tidy · lock · send to back · duplicate ·
select one · select several · marquee · pan · zoom · fit-to-view · call a loose bit in ·
**take something off this board** · make a new card *(hands you to edit)* · the pen · undo ·
the board's own title, description and timeline.

**That is a complete workspace for composing.** The only things missing are the four that
change a *thing*: write · title · tag · trash. **Yes — arrange stands on its own.**

### The argument for landing there, and it is a safety one

**Arrange cannot change anything you have made.** Not one word, not one tag, nothing thrown
away. So arriving in arrange means **you cannot damage anything by arriving** — a stray click,
a cat on the keyboard, a mis-tap on a phone. Landing in edit means a stray click can put you in
a text field with a cursor blinking in your own writing.

That is the kind of argument that survives taste changing, which is why it beats *"which do you
do more often."*

### The back-end half the owner raised
It is also **simpler for us in the same direction**: in arrange the entire bit-writing layer is
inert. No debounced save is running, no `editingId`, no reference reconcile, no title queue.
**The mode with the most gestures has the fewest live code paths** — and that is the mode a
board sits in while you are not doing anything, which is most of the time.

### And where the app is heading
Writing is moving to the **composition** surface. As that lands, the board becomes **more**
about arranging, not less. Landing in arrange is the answer that ages in the right direction.

### 🔵 Recommendation
**Land in arrange, always.** Not remembered per board — remembered state means opening a board
and not knowing what it will do, which is the mode trap wearing a helpful hat.

⚠ **The one real cost, named:** if you often arrive to *continue writing*, that is now one extra
click every time. **Mitigation that keeps the safety:** double-clicking a card goes straight to
edit **with that card open** — so "arrive and write" is one gesture, not a mode switch plus a
click. ⚪ Worth a look in practice, and it is the thing to watch for in the first week.

## 6 · THE QUESTIONS — everything I need from you, in one batch

*(Owner: "bring questions to me… if I missed anything that you already asked about, just bring
it to me in the next batch." So this is the complete list, re-asked, not a delta.)*

### 🔴 Blocking — I cannot build without these
1. ~~**Panning in arrange mode.**~~ ✅ **ANSWERED by the owner (§5): empty-drag stays pan;
   marquee takes the modifier.** The modifier belongs on the rare act, not the constant one.
2. **Which mode do you land in when you open a board?** 🔵 Lean **arrange** — you arrive to look
   and move; writing is something you go *into*. But you said edit is close to today's default,
   so landing in arrange is the bigger change to how it feels.
3. **Duplicate** (§0d) — is it arrange-legal? 🔵 Lean yes, under *"arrange may bring new things
   into being; it may never change a thing that exists."*

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
