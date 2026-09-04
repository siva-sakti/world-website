# The privacy session — live notes *(2026-09-04; raw capture, decisions distilled at the end)*

**N1 · The founding public-by-default is SCRATCHED.** Owner: "scratch the idea of the founding — we were pivoting from a personal thing to a product; don't worry about world B at all." The philosophy.md ⚠ tension resolves: NOT public-by-default. (Supersession to write into philosophy.md at distillation.)

**N2 · The model, hers:** everything is the PERSON'S CHOICE — a per-thing public/private toggle on everything, plus **a default the owner can set** ("there should be a default, maybe, that they set — then everything they can toggle").

**N3 · Her read "we don't have privacy in the schema yet" — fact-checked:** partly right. What EXISTS: `visibility` columns on bit + board (public|private, CHECKed), composition drafted born-private, the guest-door RLS proven. What's genuinely MISSING: ① **anywhere to store HER chosen default** — no settings/preferences storage exists at all ② the toggle UI on things ③ the publish act ④ and every existing bit still carries the founding-era `public` flag, which now contradicts N1/N2 — a privacy-build migration item: flip stored bits to private (or to the owner-default) as a one-time correction.

**Open crumbs surfaced by N2, not yet asked:** the FACTORY default (before the owner ever sets one) · one global default dial, or per-kind (bits / boards / pieces)?

**N4 · "Gap" defined for her:** guest sees the board; private bits render absent — a mostly-private board looks near-empty. Nothing leaks; it looks bare.

**N5 · WHERE privacy lives — the standing architecture explained and put to her for re-stamp under the product frame:** two levels, two jobs — the board's toggle = the DOOR (room visitable?), the bit's toggle = the CLOAK (thing visible anywhere?); guest sees iff BOTH (the AND-law, proven). A bit's cloak is GLOBAL (ruled X6): never private-here-public-there — per-place control already exists as PLACEMENT ("visibility controls the thing; placement controls the where"). Composition = a door too, same law.

**N6 · THE FORK REQUIRING HER WORD — publish-the-board semantics:** her sentence: "publishing would make all of the things public" (door + flip-all). The ruled shape: door-only (things keep their cloaks → gaps → hence the review screen: "14 private things won't show — review?", bulk-flip eyes-open). Claude's read: door-only + review — never silently flip a cloak she set by hand; flip-all builds the accidental-leak scene in. AWAITING: ① global-cloak re-stamp ② door-only-with-review vs flip-all.

**N7 · Claude's full opinion, delivered as a stampable bundle** *(her ask: sensible functionally AND accessible)*:
- Confusion dissolves when the app SHOWS outcomes instead of making users predict: the whole teaching load lands on ONE moment (the publish review screen) + ONE glanceable answer everywhere ("who can see this right now?" — and on a bit's page, "visible on: …" = the multi-place watchfulness solved as display).
- **Born private, everything, NO settable default dial in v1** — the dial does no work once the review screen exists, creates the one dangerous state (a forgotten "public" setting), and dropping it DELETES the settings-storage schema gap (N3①). One-sentence model: "everything you make is yours alone until you show it — and when you show it, you're shown exactly what they'll see."
- Whoever never publishes never meets privacy UI at all.
- Publish = door-only + review (never silently flip a cloak) · the architecture (door/cloak/AND/global) stands.
**AWAITING her stamps on the four-piece bundle.**
