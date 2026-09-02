# Teaching the user — what a person must learn, and how they learn it

> ## STATUS · 2026-09-02 · 🟠 WORKING — the user-facing counterpart to the specs
> **Why it exists:** every decision we ruled has a user-facing consequence — something a person must understand, or never needs to. The specs say what's true; **this says what gets taught, where, and how.** The owner: *"onboarding, the little hints, the ways we teach the app as used."*
> **Two registers, both wanted:** the **stories** (the musician, the artist — flows not definitions, `product-concept-people.md`) and the **literal** — this doc's job.
> **The rule that governs all of it:** teach in the moment of use, never in a lecture. Nothing here is a tutorial screen unless it says so.

---

## 1 · The three things a person MUST understand (everything else is optional)

**① Bits are material; compositions are what you make.** *You catch bits. You write compositions. A bit never becomes a composition.*
**② Boards hold; compositions weave.** *A board is space — arrange anything. A composition is words — pull anything into the writing.*
**③ Things you pull in stay alive.** *A quote in your writing is the same quote on your board — one thing, in two places.*

If someone understands those three, every other behavior is discoverable. **Nothing else is mandatory learning.**

### The legibility line — teaching material (moved here 2026-09-02)
*A board's arrangement speaks mostly to its maker; a composition is synthesis made legible to any reader.* The owner: *"that was a way for us to do teaching — I don't think it affects how we build stuff."* Correct: it explains **why** the two surfaces differ, in one sentence a person can hold. Candidate copy for the compose-door moment; ⚑ owner's words, when she writes them.

## 2 · What must be taught vs. what can be discovered

| must be taught | can be discovered |
|---|---|
| that bits and compositions are different **kinds** (①) | the floater→panel→page chain (tap and see) |
| that `[[` pulls your world into writing (②③) | chip ⇄ block switching (it's on the peek) |
| that the board catches, the composition is deliberate | tags · folders · stars (identical to today) |
| — | archive vs trash (labels carry it) |

## 3 · The moments, and what teaches at each

| moment | the teaching | form |
|---|---|---|
| **first time on a board** | *"drop anything here — it becomes a bit"* | one-line hint, dismissible |
| **first compose door** | *"a composition is something you write — it'll live in your list and on this board"* | one line, once |
| **first empty composition** | *"type `[[` to pull anything from your world into the writing"* | the idle-state hint (this pattern is already live on `/write`) |
| **first `[[` use** | the picker's own two sections teach the material/composition split **by showing it** | structural, no copy |
| **first chip placed** | *"tap it to look; you can also show it in place"* | one-time tooltip on the chip |
| **first pull-in from a bit that's on boards** | *"this is the same bit that's on 〈board〉"* | quiet line in the peek |
| **first archive** | *"archived things rest here — you can read them, and bring one back to edit"* | inline on the archive action |
| ⚑ **the connective impulse** (their bits feel related) | **F-9's door: "write about this"** — the *steering* answer to the bit↔bit worry | a control, not copy — the best teaching is an affordance |

## 4 · The vocabulary a person actually meets
**They see:** bit · board · composition *(name pending)* · tag · folder · trash · archive.
**They never need to hear:** chip · block · placement · reference · face · form · surface · flatness. *(Ours, internal. If a user must learn one of these, that's a design failure — flag it.)*

## 5 · What the design already teaches without words
The **compose door being deliberate** teaches that compositions are made, not caught · the **picker's two sections** teach the two kinds · **silent bit-hood** teaches that pulled things are alive (powers appear on touch) · **the board catching everything** teaches that material is cheap · **auto-placement** teaches that a piece belongs where it was written.
> **The goal: teach through structure; use words only where structure can't.**

## 6 · Open
⚑ The **stories** (the musician, the artist, the scholar) — owner-written, after naming · ⚑ where hints live technically (a dismissed-hints record) · ⚑ whether ① needs one deliberate first-run moment or can be entirely in-the-moment · ⚑ the words themselves (naming session gates most copy above).

## 7 · The teaching family — every doc that teaches, and its job

| doc | its teaching job | when you need it |
|---|---|---|
| **`teaching-the-user.md`** (this) | **the literal register** — what must be learned, taught at which moment, in what form | writing hints, tooltips, first-run copy |
| `product-concept-people.md` | **the story register** — who these people are · the persona flows (⚑ owner-written) · *flows not definitions* · templates-as-teacher · the two levels (build vs framing) | writing the stories; deciding who we speak to |
| `product-concept-promise.md` | **the pitch** — the switching argument (*"you already do this in Are.na — here's the delta"*) · required artifacts per discipline | landing-page words; the demo moment |
| `integration-scenes.md` | **the scenes** — S1–S13, real moments; the hero candidates for stories (S3/S9 = writing beside the work) | choosing what to show |
| `user-flows.md` Arc 0 | **the mechanism** — first-run detection (empty owner → seed or guide), the `onboarded` flag | building onboarding |
| `composition-definition.md` | **what's true** — the concept the teaching must not misstate | fact-checking any copy |
| `vision-and-language.md` | **the voice** — phrase bank, the problem told three ways (⚑ owner re-voices) | when words need warmth |
| `product-concept-language.md` | **the outward line** + the naming state | before any user-facing word ships |

**The flow:** *who* (`people`) → *what we claim* (`promise`) → *what's true* (`definition`) → **what must be learned + when (this doc)** → *how it's built* (`user-flows` Arc 0) → *the actual words* (⚑ owner, after naming).

## 8 · Where this sits (upstream/downstream)
Upstream: `product-concept-people.md` (who they are · flows-not-definitions · templates as teacher) · `composition-definition.md` (what's true). Downstream: the actual copy, after naming. `user-flows.md` Arc 0 holds the *technical* first-run mechanism (detect empty owner → seed or guide).
