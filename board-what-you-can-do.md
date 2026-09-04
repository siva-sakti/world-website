# What you can do on a board — the complete inventory

**A standalone task, at the owner's ask (2026-09-04):** *"What are the actual things someone's
trying to do, and what are we calling those actions? To me those are both important sides of the
puzzle. Making sure it's comprehensive — all the things a user wants to do when they're on the
surface. Listing that as a task on its own… a really good task as we're getting close to the end
of finishing the board feature."*

**Built from the code, not from memory** — every control's own description, the create doors, the
keyboard map — so "comprehensive" is a claim that can be checked rather than felt.

**Two columns, deliberately.** *What you'd say* is the want you arrived with. *What we call it*
is the app's word. **Where those two drift apart is a finding**, and the ⚠ rows are where they do.

---

## 1 · Putting something on the board

| what you'd say | what we call it | there today? |
|---|---|---|
| *"start a note right here"* | **new card** *(double-tap empty space)* | ✅ |
| *"draw something"* | **the pen** | ✅ |
| *"put this photo on here"* | **drop · paste** | ✅ |
| *"add a voice memo / a PDF"* | **+ audio · + pdf** | ✅ |
| *"paste a link and let it fetch itself"* | **capture a link** | ✅ |
| *"bring in that thing I caught yesterday"* | ⚠ **call in** *(the loose column)* | ✅ |
| *"put a whole board on this board"* | **a board-card** | ✅ *(no create-UI — placed from elsewhere)* |

⚠ **"Call in" is our word, not anyone's.** A person would say *"bring in"* or *"add"*. It is the
oldest naming debt on this surface. **Flag for the naming pass.**

## 2 · Composing — the board as a picture

| what you'd say | what we call it | there today? |
|---|---|---|
| *"move this"* | **drag** | ✅ |
| *"make it bigger / smaller"* | **resize** | ✅ |
| *"give it some life"* | **rotate · tilt** | ✅ |
| *"put it back straight"* | **straighten** | ✅ |
| *"these three should line up"* | **line up** — left · centre · right · top · middle · bottom | ✅ |
| *"space these evenly"* | **even gaps** — across · down | ✅ |
| *"tidy this mess"* | **tidy** *(a neat grid)* | ✅ |
| *"put this behind that"* | **send to back** | ✅ |
| *"bring this forward"* | ⚠ *(no word — happens automatically on click)* | ⚠ partial |
| *"don't let me knock this out of place"* | **lock · unlock** | ✅ |
| *"I want another one of these"* | **duplicate** | ✅ |
| *"move these five together"* | **select several** → drag | ✅ |
| *"snap it to line up with that"* | **the guides** *(magenta lines while dragging)* | ✅ |

⚠ **Bring-forward has no name and no button** — clicking a card raises it, which is a rule you
have to discover. Its opposite (*send to back*) is a labelled act. **A real asymmetry.**

## 3 · Looking

| what you'd say | what we call it | there today? |
|---|---|---|
| *"move around the board"* | **pan** *(drag empty space)* | ✅ |
| *"closer / further out"* | **zoom** *(scroll · ⌘+ · ⌘− · ⌘0)* | ✅ |
| *"show me everything"* | **fit to view** *(press again to go back)* | ✅ |
| *"where was I?"* | ⚠ *(no word — the view is remembered per board)* | ✅ silently |
| *"when did all this arrive?"* | **timeline** | ✅ |
| *"where has this one bit been?"* | ⚠ **a bit's journey** | 🔴 **NOT BUILT** *(the lost thread)* |

## 4 · Taking things away

| what you'd say | what we call it | there today? |
|---|---|---|
| *"get this off my board"* | **remove from this board** *(un-place)* | ✅ |
| *"put this away for now"* | **archive** | ✅ |
| *"I'm done with this thing"* | **trash** | ✅ |
| *"undo that"* | **undo · redo** *(⌘Z / ⌘⇧Z)* | ✅ |

## 5 · Working on one thing

| what you'd say | what we call it | there today? |
|---|---|---|
| *"write in this"* | **the words** *(a text card's body)* | ✅ |
| *"this needs a name"* | ⚠ **title** *(text)* / **caption** *(media)* — two words, one field | ✅ |
| *"file this with the retreat stuff"* | **tag** | ✅ |
| *"where did this come from?"* | **source** | ✅ |
| *"open it properly"* | **open** *(full page)* | ✅ |

⚠ **"Title" and "caption" are the same stored thing** (`bit.content`) wearing two words depending
on the card's type. Defensible, but it is one concept with two names — **naming pass.**

## 6 · The board itself *(not a card — the surface)*

| what you'd say | what we call it | there today? |
|---|---|---|
| *"name this board"* | **the board's title** | ✅ |
| *"say what it's for"* | **description** | ✅ |
| *"make another arrangement of the same things"* | **duplicate this board** | ✅ |
| *"keep this one handy"* | **★ pin** | ✅ |
| *"file it with my other boards"* | **group** *(a folder)* | ✅ |
| *"who can see this?"* | **visibility** | ✅ *(not on the board surface)* |
| *"throw the whole board away"* | **trash the board** | ✅ *(not on the board surface)* |

---

## 7 · ⚠ WHAT A PERSON WOULD EXPECT AND CANNOT DO
The point of a comprehensive list is the gaps it exposes.

| what you'd say | status |
|---|---|
| *"find that card — I know it's on here somewhere"* | 🔴 **no search within a board.** On a big board, you hunt visually |
| *"where has this bit been?"* | 🔴 not built *(§3 — the lost thread)* |
| *"select these five and tag them all"* | 🔴 no bulk tag *(bulk remove/trash/archive exist)* |
| *"lock these five"* / *"duplicate these five"* | 🔴 no bulk lock or duplicate |
| *"make a note from here"* | 🔴 you can make a text card, not a note/composition |
| *"draw on my phone"* | 🔴 **the pen ignores touch entirely** — the overlay appears and records nothing |
| *"look at this photo properly"* | 🔴 no lightbox; no way to read a PDF from its card |
| *"group these into one thing"* | 🔴 no grouping *(the **frame** is the planned answer)* |
| *"put these in a row automatically"* | ✅ *(line up + even gaps together)* |

## 8 · What this list is FOR
1. **A completeness check** — §7 is the deliverable; four of those are already ruled or planned,
   and the rest are decisions nobody has made.
2. **A naming check** — the ⚠ rows feed the **naming pass**: *call in* · *bring forward* ·
   *title/caption* · the unnamed remembered view.
3. **The input to the mode split** — every row above has to sit in arrange or edit without being
   argued into it (`board-arrange-vs-edit-mode-plan.md` §2d).
4. **The thing to re-read before the board is called finished**, which is what the owner asked
   it for.
