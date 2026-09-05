# Cross-feature rulings — decisions made in the composition sessions that touch OTHER things

> ## Why this exists *(owner-asked, 2026-09-02)*
> *"Where are you adding things like this? They're not composition feature specs — they're things touching boards and other things. Where are you recording this stuff, and how do I keep track of the things we need to do that aren't explicitly the composition surface, but these other places near it and around it?"*
>
> **The problem it solves:** deciding one feature produces rulings about *other* features. Buried in the composition spec, they would never reach whoever builds boards, search, or the app's chrome. **This is the register for those.**
> **The rule going forward:** a ruling that changes something outside the composition gets a row here **in the same edit** that records it in the spec.

## The rulings

| # | ruling | what it touches | source | status |
|---|---|---|---|---|
| X1 | **One global date format for the whole app** — every date the app displays uses it, not just the composition's minted title | **app-wide** (every surface showing a date) | owner, 2026-09-02: *"we have to pick a global date format for everything in this app"* | ⚪ the format itself unchosen |
| X2 | **The pull (tapping a tag) gains a kind filter** — bits · boards · compositions, narrowable like search | **the pull**, for all kinds | owner, 2026-09-02: *"tapping a tag, I think you should have a filter as well there"* | ruled, unbuilt |
| X3 | **The homepage's quick search stays titles-only**; the full search reads bodies | **search / home** | owner, 2026-09-02 | ruled — matches today's split |
| X4 | **A table becomes a bit type** — a table can be a thing on a board, as well as formatting inside writing | **bits · boards · the type roster · schema** | owner, 2026-09-02: *"a table should be its own bit… in the boards a bit that can be a table"* | ruled, unbuilt — **belongs with the file-bit handoff** |
| X5 | **Boards get an auto-title too** — date/time stands in when a board is untitled, same rule as compositions | **boards** | owner, station 3b: *"same thing with a board — for both"* | ruled, unbuilt |
| X6 | **A bit's private mark is GLOBAL**, never per-board | **bits · boards · the whole privacy model** | owner | ⚪ superseded in scope — the privacy model is now deferred to its own session |
| X7 | **The board's alignment/snapping feature owns the word "frame"** — the composition work must not use it | **naming · the board track** | owner, 2026-09-02 | ruled |
| X8 | **"Link" is taken** by the link bit type — the relationship sense stays dead; the composition's tie-word must avoid it | **naming, app-wide** | lexicon D-129 + owner | ruled |
| X9 | **The `+ checklist` door on the board** births a text bit pre-shaped as a checklist | **boards** | owner, 2026-09-03 | in the code-window handoff |
| X10 | **Nothing vanishes under your hands while you rearrange** — the principle behind bit-cards persisting (D-138) and behind evaporation being birth-scoped | **boards · all card behavior** | owner: *"I don't want that bit to disappear… I architected it that way for a bit"* | ruled, honored today |

## ⭐ BUILD STATUS — decided ≠ built *(owner-asked, 2026-09-02: "did you build these out on the other surface?")*

**Nothing in this register is built. All ten are decided-only.** Status legend: **DECIDED** (ruled, no code) · **HANDED OFF** (in a build plan) · **BUILT** (in the app, verified).

| # | ruling | status | its build home |
|---|---|---|---|
| X1 | global date format | **DECIDED** | ⚑ no home — needs the feature queue |
| X2 | the pull's kind filter | **DECIDED** | ⚑ no home |
| X3 | homepage search titles-only | **BUILT** — matches today's behavior | — |
| X4 | table as a bit type | **DECIDED** | ⚑ belongs beside the file-bit build (`editor-formatting-and-file-bit-plan.md`) |
| X5 | boards get auto-titles | **DECIDED** | ⚑ no home |
| X6 | global private mark | **DEFERRED** | the privacy session |
| X7 | "frame" belongs to the board feature | **BUILT** (the other window's work) | — |
| X8 | "link" is taken | **BUILT** (the link bit type ships) | — |
| X9 | `+ checklist` door | **HANDED OFF** | `editor-formatting-and-file-bit-plan.md` |
| X10 | nothing vanishes while rearranging | **BUILT** for bits (D-138) · **DECIDED** for compositions | the migration |

## ⭐ THE BUILD ORDER — the architecture first *(owner-ruled, 2026-09-02)*
> *"You need to at least build the underlying architecture of the composition being a different place than just a big bit as it is right now… that elementary starting-off first, before fixing the other things."*

**Correct, and it matches the tiers** (T1 = the functional floor): everything else in the feature stands on compositions being their own thing. Building composition behavior first means building it twice.

**The order:**
1. ⚑ **THE STORAGE SESSION** — decides the shape (own home · shared surface table · which columns). **This is the critical path; nothing below can start.**
2. **The migration** — compositions leave the bit table; search index follows; export lockstep; references and placements repoint. *(Code window's lane, house method: backup → throwaway-proven → owner's go.)*
3. **Then** composition behavior: the floater · the block/chip work · the editor's v1 blocks.
4. **Then** the cross-feature items above, which are independent and can slot anywhere after their own build homes exist.

⛔ **Do not build composition behavior before step 2.** *(This is the sequencing the spec has carried since the tiers; the owner has now stated it independently.)*

## How to keep track
- **This file is the index of them.** Anything here that is unbuilt eventually becomes a build item in `build-queue.md` (the app's real feature queue) or a handoff doc.
- **The composition spec cross-references here** wherever a ruling reaches beyond it.
- ⚑ **Owed:** X1, X2, X4, X5 have no build home yet — they need to reach the feature queue.
