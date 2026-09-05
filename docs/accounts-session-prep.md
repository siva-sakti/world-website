# The accounts & social session — prep sheet
*(2026-09-05. The proven pattern: this sheet makes the sitting start warm; it decides nothing. Structured the owner's way: goals first. One world, two halves, taken in order: **accounts — many homes**, then **social — people meeting**.)*

## 1 · GOALS — hers to write; seeded with her own recorded words
**What do we want?** *(her statements on the record, to confirm/refine/strike)*
- *"A product — many single-resident homes"* (philosophy, the product ruling): each person gets what she has — a whole private world of their own.
- *"Accounts and making this social and sharable — a human social network"* (2026-09-05, the founding-rule erasure).
- *"I was wanting to advertise it all more publicly… put bits out there for people, like quotes"* — publicity as a real want, hers first.
- The sealed founding line: *"the entire architecture is there if people want public things, while not feeling intruded upon in their process, which has private parts to it."*
- Premium/business named in her roadmap list ("what's premium") — a later facet of this same world.
**What do we NOT want?** *(the standing never-list — written for the one-person era; to be RE-CHOSEN, kept or re-drawn, the way privacy's founding rule was)*
- No collaboration (one writer per home) · no audience machine · no growth mechanics · no AI features · no analytics.
- ⚪ The session asks of each: does this survive the social era as-is? (E.g.: does "no audience machine" permit follows? profiles? a shared-with-me shelf?)

## 2 · What ALREADY EXISTS — verified, and again more than expected
- **Per-row ownership (July, D-107):** every table carries `owner_id`, defaulting to the logged-in user; every access rule says "your own rows." Its own migration comment: *"this is the exact foundation multi-account needs — de-hardcoding and that door are one change."* **Multi-home is one config change away at the database level.**
- **Signups are disabled by config** — the only thing making this a one-person app today.
- **The guest door** (proven RLS): visitors-see-public machinery already live.
- **The visibility model (sealed):** born private · the two laws · person-keys explicitly parked to THIS session.
- One legacy trace: the founding owner's uuid appears in old migrations as backfill data (not in any live rule) — cosmetic, listed for completeness.

## 3 · The surfaces this touches *(the sweep list — what the session must walk past)*
Login/auth (today: one email login) · **routes** (does a person get a name in the URL? `world.app/gargi`?) · home/the desk (per-owner already) · the publish surfaces + the guest door (whose public things does a visitor see — and how do they say WHOSE?) · **profiles** (a public face: name, image, what shows?) · person-keys (the `shared` visibility tier — schema doors open) · storage buckets (per-owner paths exist) · export (per-owner already) · the never-built discovery/feeds (no longer prohibited) · onboarding (arc 0 — a new person's empty first hour) · premium/billing (later facet) · the app's own identity (names, since "world-website" is a placeholder).

## 4 · The questions, as scenes
1. **A stranger signs up.** What do they see in their first empty hour? (The onboarding arc exists as a sketch — arc 0 — never built.)
2. **You hand your mentor a key.** To one board? To everything public? Do they need an account to *look*? (The never-list says looking only.)
3. **A visitor lands on your public quote-board.** Do they know who you are? Can they find more of you? Follow you? Or is each board an island?
4. **Someone you don't know finds the app.** Is there any door to *anyone's* public world — a directory, a feed, nothing?
5. **Two residents.** Do they ever see each other inside the app at all — or is every home an island with public windows?
6. **What would anyone pay for?** (Named, not designed — the premium facet waits on the answers above.)

## 5 · Suggested session order *(Claude's, from the privacy session's lesson)*
**Accounts first, alone** — many homes, signups, identity, routes. Concrete, mostly infrastructure, nearly buildable already. **Then social** — profiles, keys, discovery — the philosophical half, where the never-list gets re-chosen. Splitting them keeps each sitting the size that worked for privacy.
