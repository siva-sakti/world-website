# Product concept — privacy, sharing, and publishing

> ## 📜 PREDATES THE SEALED MODEL (2026-09-05) — **the authority is `docs/visibility-model.md`**; read this file as early thinking only. The owner's sealed founding line lives in `product-concept-promise.md`.

> ## STATUS · 2026-08-30
> **⚪ OPEN — and explicitly flagged as needing its own session.** `philosophy.md` carries a standing warning: *"a dedicated session decides: public-by-default, private-by-default, or something smarter. Until then, the built reality (private) stands."*
>
> **🟢 SETTLED and not in question:** **one resident per home.** Never collaboration, never an audience machine. A product here means *many single-resident homes* (D-118).
>
> **The tension:** the founding dream was **public by default**. The app as built is **entirely private with no way to publish**. The product ruling made the gap matter.
>
> **Nothing here is decided.** This file is the inventory + the questions.

**Related:** `product-concept-map.md` (thread 8) · `philosophy.md` (the founding position + the warning) · `product-concept-brand.md` (which is blocked on this) · `SPEC.md` §3 (the built rule) · `agreements.md` §2a (historical reasoning).

---

## 1 · The founding position

From `philosophy.md`: *"New things start public unless I say otherwise. Most of what I make, I'm glad to have in the open — so openness is the default, and marking something private is one deliberate tap."* With the safeguard: nothing is visible to another person until a board is shared **on purpose**, and at that moment you're shown **exactly what a guest will see**.

## 2 · What's actually built

- **Everything is private.** Every board is private; a visitor currently sees **0 boards / 0 bits**.
- **There is no publish act.** No button, no route, no way to make anything public.
- **But the door exists at the database.** D-108 applied a read-only guest layer to the cloud: anon may `SELECT` (never write) board/bit/placement, filtered by the ruled composition. Proven leak-proof on a throwaway, then applied.
- **The rule it enforces — reachability AND visibility:** a guest sees a bit **iff** its board is public **AND** the bit itself is public. Board publicity never overrides bit privacy. A private card renders **absent** — the guest never learns something was withheld. No public feed: a bit is exposed only *through a reachable surface*, never merely by being public.
- **Not exposed to guests at all:** references (the gather thread), tags, sources.

**So: the plumbing is in and proven; the product decision and the entire app layer are missing.**

## 3 · Why it matters to everything else

- **Brand is blocked on it** — whether there's a landing surface at all depends on whether anything is ever public.
- **The positioning leans on it.** The product ruling was motivated by *"I want to live in something so beautiful I screenshot it, share from it, and have other people want a home like it — the Are.na crowd deserves better."* Screenshotting works today. **Sharing from it does not exist.**
- **The persona flows may assume it.** A flow ending in *"and then she offers it"* implies an offering mechanism.
- **Onboarding may assume it** — a second home existing at all is a signup/acquisition question.

## 3b · 🟡 SOCIAL IS NOT OFF THE TABLE (the owner, 2026-08-30)

**Prompted by the Are.na question** — *if we take Are.na's market, do we take it without the thing that makes Are.na sticky?* (Are.na is social: public channels, following, re-blocking each other's finds; part of why people stay is being **seen**.)

**The owner's response:** *"It can get social. We could definitely build social features easily — and think about it, especially as we still have this public/private split situation. I do appreciate you flagging that; I want to be aware of this."*

**So:** social is **buildable and open**, not excluded. ⚠ **But note the tension with the standing never-list** (D-118): *no collaboration, no audience machine, one resident per home.* Those may not actually conflict — **being able to show your work is not the same as collaboration or an audience machine** — but the line between them has never been drawn, and it must be drawn deliberately rather than crossed by accident.

⚪ **The real question this opens:** what kind of social? *Seeing other people's public boards* (Are.na's actual mechanic) is very different from *followers*, which is different again from *handing one trusted person a key*. The founding position allows the third. The Are.na market may require the first.

## 4 · Open questions

1. ⚪ **What's the default — public, private, or something smarter?** The founding answer (public) and the built answer (private) disagree, and both are defensible.
2. ⚪ **What's the unit you publish?** A board? A composition? A single bit? *(The built rule assumes a board is the reachable surface.)*
3. ⚪ **Is "sharing" handing a trusted person a key to look, or real publishing to the open web?** `philosophy.md` says the first; the product ruling gestures at the second. **Different products.**
4. ⚪ **Does a guest need an account?** Ties directly to first-contact and brand.
5. ⚪ **What does the owner see before publishing?** The ruled safeguard is a per-board **publish preview** — *exactly what a guest will see*. Designed, never built.
6. ⚪ **Does any of this change the never-list?** *(Current answer: no. One resident, no collaboration, no audience machine — publishing is read-only for everyone else.)*
