# Product concept — the map

**What this is:** the hub for the **product-concept** workstream — the layer **above features**: what this app is, who it's for, what it promises, what it owns, and how we talk about it. Features get **pulled down from here**, not invented sideways.

**Why it exists:** this thinking was half-started and scattered across `philosophy.md`, `vision-and-language.md` and a long unrecorded session. This is where it lives now.

---

## The goal

> **Get the argument clear** — what we promise, who for, and what movements a person actually makes — so the build queue reorders itself underneath it.

The owner's framing, twice:
- *"What are we promising people that we can do, and what are the movements that people would actually make?"*
- *"I wanna think first from what the user needs and what the flows are, then what features we need to build — I'm actually happy to build and rebuild as long as the core, the argument, meaning our value-add, is very clear."*

**The success condition is not a document.** It's that the owner can say what this is and who it's for in a way that feels true — and that open feature questions become answerable by looking up here.

**The method premise:** 🟢 **needs → flows → features, in that order.** Features are disposable; the argument is the anchor.

---

## How to read the status marks

Every file in this workstream opens with a status banner using these:

| mark | meaning |
|---|---|
| 🟢 **SETTLED** | the owner said it clearly, in their own words — build on it |
| 🟡 **LEANING** | discussed, tending one way, **not ruled** — don't build on it |
| 🔵 **CLAUDE'S FRAMING** | my phrasing or model, offered and liked — the owner has not adopted it as theirs |
| ⚪ **OPEN** | no answer yet |

**"Ruled" is a word only the owner says.** Nothing graduates from these files into `model.md` / `lexicon.md` / `invariants.md` / `PROGRESS.md` until they do.

---

## The threads

| # | thread | file | state |
|---|---|---|---|
| 1 | **The promise** — what we're for, the surround, the movements | `product-concept-promise.md` | 🔴 **live — this is where we stopped** |
| 2 | **The concepts** — bits/surfaces, peers, either direction | `product-concept-promise.md` | 🟡 mostly worked |
| 3 | **Positioning** — the seams, the honest competitive read | `product-concept-promise.md` | 🟡 one session old |
| 4 | **People & their flows** — the maker range, personas, onboarding | `product-concept-people.md` | 🔴 frame only; **owner writes the characters** |
| 5 | **Language & naming** — note→composition, is "board" right | `product-concept-language.md` | 🟡 leaning, blocked on a collision |
| 6 | **Frameworks** — diverge/converge landed; more wanted | `product-concept-frameworks.md` | ⚪ research round not run |
| 7 | **Brand & identity** — the app's *name*, identity, voice, landing | `product-concept-brand.md` | ⚪ **empty room** — never worked |
| 8 | **Privacy / publishing** — public-by-default vs private | `product-concept-privacy.md` | ⚪ needs its own session; **brand is blocked on it** |

*(1–3 share a file deliberately: in conversation they were one continuous thought. What we promise **is** what we own — splitting them would mean writing the same ideas twice.)*

**Files 7 and 8 are placeholders with honest inventories**, not empty — each holds what we have, what's missing, and the open questions. Neither has been worked.

---

## The three kinds of document in this project

A distinction the owner drew on 2026-08-30, worth keeping straight:

| kind | what it is | examples | who writes it |
|---|---|---|---|
| **Thinking in progress** | in flux; a status banner marks maturity per idea | the `product-concept-*` files | Claude + owner, in conversation |
| **Near-final outputs** | meant to be finished; not there yet | `vision-and-language.md` (the language book) · `philosophy.md` (owes a re-voice) | ⚑ **the owner** — Claude supplies raw material only |
| **Settled records** | the authority; changed only by a ruling | `model.md` · `lexicon.md` · `invariants.md` · `PROGRESS.md` · `SPEC.md` | Claude, on the owner's ruling |

**The rule:** thinking graduates **into** settled records. It does **not** get merged into a near-final output — those get **re-voiced by the owner** when the argument underneath them moves.

---

## Everything that is 🟢 SETTLED across the whole workstream

The owner's own reasoning, stated plainly. These are the six things safe to lean on:

1. **Gather-a-board is the wrong *shape*.** Bits are material; boards and notes are **peers**. Peers *relate* (place it on the board · share a tag) — they don't get pasted into a sentence. ⚠ *But see the open question in `product-concept-promise.md` — the owner has since re-raised it as "I don't know, should they? How will people use it?" The **reasoning** is settled; the **feature call** is back open.*
2. **Return is not the differentiator.** *"I don't agree with you there — that was old thinking from when I thought the app wasn't doing enough on its own."*
3. **Both surfaces, either direction.** Some scatter on a board then write; others write first and lay it out after.
4. **A bit is a unit of capture, not one idea.** A rambling multi-topic note-to-self is a perfectly good bit.
5. **Teach with cases and examples, not definitions.**
6. **Creative practice is much more than producing.** The surround — meaning, outreach, opportunities, presentation — is most of the work and has no home today. *"I really wanna bake this into our priorities."*

---

## Where this touches the docs we already have

**This workstream is half-started and scattered.** That is the real problem it solves — not "we have nothing."

| existing doc | what conceptual material it already holds | how it relates |
|---|---|---|
| **`vision-and-language.md`** | what it is plainly · the multi-mind · the problem taught 3 ways · the gradient story · positioning one-liners · a phrase bank | **A near-final OUTPUT, downstream of this** — it holds the *words*; this workstream holds the *argument*. **Nothing merges out of it.** ⚠ If the argument moves and its lines don't, they go stale — a re-voice trigger for the owner, not a merge. |
| **`philosophy.md`** | the why · raw→fragments→pieces · returning-is-the-point · "alive" · the product ruling (many single-resident homes) · **privacy/publishing flagged as needing its own session** | **Upstream of this.** Philosophy = why it exists *for the owner*. This workstream = what it is *in the world*. Philosophy also still owes the owner's re-voice pass. |
| **`model.md`** | the concepts as currently built — bit · board · note, how they join | **Downstream of this.** Concepts settle here first, then graduate into `model.md`. |
| **`user-flows.md`** | Arc 0 onboarding + the 8 arcs | **Downstream.** The persona flows here become Arc 0's curriculum. |
| **`aesthetics-phase.md`** | the in-app look (*Japanese · ethereal · analog*, papers, frames, tokens) | **Adjacent, not overlapping.** It has **no name, no identity, no voice, no landing** — that's thread 7. |
| **`build-queue.md`** | the live feature queue | **Downstream.** Open feature questions get answered from here. |

---

## Open feature questions this workstream should answer

The point of working above features is that it settles the ones below. Currently waiting on it:

- ⚪ **Can a composition link a board inline?** The owner's live example — *"I don't know. Should they? Well, how will people use it?"* The reasoning says no (peers don't nest); the owner has not closed it.
- ⚪ **Should bits connect to bits** (drawn lines between fragments on a board)?
- ⚪ **What does onboarding actually show** on first run? (needs thread 4)
- ⚪ **Is there a publish act at all**, and what's the default? (thread 8)
- ⚪ **Does `/bits` show written notes?** — a small one, long-flagged, still awaiting a ruling.

---

## The queue

> ⭐ **What's next lives in `product-concept-queue.md`** — the ordered list, what each item is waiting on, and where finished thinking goes. This file is the **map** (what's where); the queue is **what's next**. Kept apart on purpose.

---

## Where we stopped

**Thread 1, mid-answer.** The owner asked Claude to elaborate on the surround — creative practice being much more than producing — and said *"I really wanna bake this into our priorities and our premises."* The answer was cut off when the session moved to bug fixes.

**That's the live edge.** Pick up there.
