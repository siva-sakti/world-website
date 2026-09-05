# Product concept — the language and the open names

> ## STATUS · 2026-08-30
> **🟡 LEANING** (not ruled — and blocked anyway)
> · **`note` → `composition`** — *"I like a composition"* / *"I do think renaming note to composition is a good idea"* … but also *"I think we actually need to think about this a bit more."*
>
> **⚪ OPEN**
> · **`composition` collides** with an existing term in this project *(found while writing up, not in session)*
> · **is `board` the right word?** — the owner called it confusing; never resolved
> · **verbal/spatial** — the owner expressed doubt, not rejection. Still live in `model.md`.
>
> **⛔ NOT ENACTED — and shouldn't be.** `note` and `board` remain correct everywhere: code, UI, docs. **Nothing gets half-renamed.**

**Related:** `product-concept-promise.md` (the concepts these words name) · `lexicon.md` (the settled naming authority — *unchanged*) · `vision-and-language.md` (the voice/phrase material).

---

## 0 · THE OUTWARD LINE — what we'd say to a person 🟡

*(Moved here from `product-concept-promise.md` in the 2026-08-30 audit: that file holds the **argument**, this one holds **the words** — inward vocabulary in §1–4, the outward line here.)*

**Possibly the strongest line yet:**

> *"There are tons of tools for thought, but this is one that actually **thinks about how your mind works and how your mind moves**."*

Then, immediately extending it: *"how your mind works, **how your spirit moves** even — and then also like **what all is part of the process**."*

**Why this may beat "the seams" and "home base":** every other candidate is a claim about **coverage** (what the app contains). This is a claim about **intent** — how the thing was designed. It's also the only line that **pays off the frameworks work**: diverge↔converge, the board that converges without locking, either-direction. Those stop being internal theory and become the *evidence* for the claim.

### ⚠ REGISTER CORRECTION — pull back on "spirit" (the owner, same day)

The owner introduced *"how your spirit moves"* and then immediately dialled it back: **"I don't wanna lean too much into it… I don't wanna make this up too, especially spiritual. I do want it more of a **tool for thought**."**

**The register that IS wanted:** *"there's a lot of feeling in here, a lot of creativity, a lot of aesthetics… it's personalized. It **cares** — about inspiration."*

**So the claim is: a tool for thought that CARES** — about feeling, beauty, inspiration — **not** a spiritual tool. The frame stays cognitive; the warmth is in what it *attends to*, not in mystical language.

🟡 **The candidate word the owner reached for: INSPIRATION.** ⭐ **And it's already theirs** — `vision-and-language.md` §5 and the phrase bank both carry ***"All of your inspiration. None of the chaos."*** written 2026-08-25. The word they were groping toward was already in their own language book five days earlier. Worth reading that file again before writing the line.

⚑ **The owner writes this line — Claude does not finish it.** Raw seeds only, take or toss: *how your mind moves · built to the shape of a working mind · thinks the way you think · a tool for thought that cares how it feels · all of your inspiration, none of the chaos · and room for everything else the work asks of you.*

⚪ **Open:** the third clause (*"what all is part of the process"*) is doing the **surround** job inside the same sentence. That may be one idea too many for one line, or it may be exactly the point — the owner decides.


---

## 0b · 🟡 "PIECE" GETS A JOB (2026-08-30) — the runner-up finds its role

The rename's runner-up word now has its own meaning via the owner's **pieces** idea (`product-concept-promise.md` §Finding 3): **composition** = the surface you shape on · **piece** = a **finished** thing, of any kind — a finished composition *or* a finished board. Two words, two jobs, no collision — and "piece" is the founding gradient's own word (*raw → fragments → pieces*). ⚑ Not ruled; folds into the same naming session as §1–3 below.

## 1 · `note` → `composition` 🟡

**The case for it.** "Note" undersells the act. It sounds like a jot, when the real act is **making something and offering it**. **`composition`** — literally *put together from parts* — is exactly the model. **`piece`** was the runner-up and stays in the owner's pocket.

**Why it isn't cosmetic:** it fixes the one genuinely fuzzy line in the model. *"bit vs. note"* confuses because both are text and the difference is intent. *"bit (raw material) vs. composition (the made whole)"* is instantly clearer. The word does conceptual work.

**The owner's usage examples, verbatim — these belong in onboarding:** *scripts for videos · organizing yourself for a conversation · speeches · an artist statement · a set of notes.*

### ⚠ The blocker: `composition` is already taken here

Found while writing this up, **not** in session:

| where | current meaning |
|---|---|
| `SPEC.md` §3 · `agreements.md` §2a · D-072 · D-108 | **the privacy AND-rule** — "the ruled AND-composition": a guest sees a bit iff its surface is reachable **AND** the bit is public |
| `model.md` | plain English — *"a board's composition **is** the arrangement"* |

Two meanings for one word is exactly the drift `lexicon.md` exists to prevent.

**Option (not a proposal, just the cheapest path):** rename the privacy sense to **"the AND-rule"** and leave `composition` free for the surface. That's a real edit across the technical docs — a decision, not a drift.

## 2 · Is `board` the right word? ⚪

The owner called it confusing in the same session; the question was asked back and never answered. Genuinely open.

**Why it matters here and not later:** if both words change, that's **one** sweep. If they change one at a time, that's two sweeps — twice the risk, twice the chance of a half-renamed app. **Settle the words together.**

## 3 · Two framings under discussion ⚪ *(NOT retired — the owner has not rejected them)*

- **"a note is a verbal surface / a board is a spatial surface."** The concern: it turns the surfaces into personality types, when a visual artist writes statements and a writer spreads things on a board. **The owner's actual words were doubt, not rejection:** *"idk if verbal makes sense though like verbal vs spatial?... hm idk."* ⚠ **`model.md` still says "a note is a verbal surface."** Left as-is until ruled.
- **"a composition is a step up from the board."** The concern: it implies a pipeline, when people write first and arrange after just as often.
- **"a composition commits."** The concept is right; the *word* the owner didn't like. Alternative offered: **the surface of convergence**.

## 4 · The enactment scope, whenever it does go

So nobody under-scopes it later: the route `/note/[id]` · the `bit.kind` value `'note'` · the `/notes` room · every UI label · `lib/db` function names · D-121's wording · `model.md` · `user-flows.md` · `build-queue.md` · `lexicon.md`. Plus a language check that no synonym crept in.

## 5 · The voice — a standing rule 🟢

**The owner writes the app's own words.** Claude supplies **guiding principles and raw seeds**, never finished user-facing prose. (`vision-and-language.md` is explicitly Claude-drafted **raw material** awaiting the owner's re-voice — it says so at the top.)

**Raw seeds from the session** (take or toss): board → *a table · a wall · a studio floor · a spread · a constellation* · composition → *a piece · a weave · a cut · a shaped thing you hand over* · the moves → *gather · spread · wrangle · shape · offer*.

## 6 · How this relates to `vision-and-language.md` — clarified by the owner, 2026-08-30

**`vision-and-language.md` is not a brainstorming file.** It's meant to be **near-final** — the language book, the words we'd actually use with people. It isn't finished (it awaits the owner's re-voice), but it is a *different kind of document*: an **output**, not thinking-in-progress.

**So the relationship is upstream/downstream, not overlap-to-merge:**

| | `product-concept-*` | `vision-and-language.md` |
|---|---|---|
| **kind** | thinking in progress | near-final output |
| **holds** | the **argument** — what's true, what we own, why | the **words** — how we say it to a person |
| **written by** | Claude + owner, in conversation | ⚑ **the owner** (Claude drafts raw material only) |
| **changes when** | the thinking moves | the argument settles |

**Nothing moves out of `vision-and-language.md`.** Its positioning one-liners (vs Are.na, Sublime, Obsidian, Notion, paper) are an **early draft of an output** — they'll be revisited when the argument underneath them settles, not merged away. ⚠ The one thing to watch: **if the argument changes and those lines don't, they go stale.** That's a re-voice trigger, not a merge.

## 7 · Open questions

1. ⚪ **Rename `note` → `composition`, yes or no?**
2. ⚪ **If yes: what happens to "the AND-composition"?**
3. ⚪ **Is `board` right?**
4. ⚪ **Is verbal/spatial dead or alive?** — currently alive in `model.md` by default.
5. → **The app's own name is NOT this file's question.** This file governs the app's *internal vocabulary* (what things inside it are called) and the *outward line* (§0). **The app's name lives in `product-concept-brand.md` §4 Q1** — one place only.
