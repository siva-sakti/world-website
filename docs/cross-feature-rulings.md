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

## How to keep track
- **This file is the index of them.** Anything here that is unbuilt eventually becomes a build item in `organize-phase-plan.md` (the app's real feature queue) or a handoff doc.
- **The composition spec cross-references here** wherever a ruling reaches beyond it.
- ⚑ **Owed:** X1, X2, X4, X5 have no build home yet — they need to reach the feature queue.
