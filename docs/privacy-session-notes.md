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

**N8 · ⚠ NOTHING BELOW IS DECIDED — the owner's explicit instruction ("please don't note all of this as decided — the discussion is good to note, but I don't know if we've decided"). N7's "awaiting stamps" framing is WITHDRAWN; these are discussion notes only.**

**N9 · Her pushback broke Claude's no-dial position, legitimately:** the per-bit annoyance is real for the GARDEN-FIRST resident (mostly-public person: under born-private, every new bit needs a flip or published boards silently gather gaps — a forever tax). Claude's no-dial was over-fit to the journal-first posture. Concession: **the user-set default earns its place in a product with both kinds of resident.**

**N10 · The split under discussion (answers her three-toggles worry):** the dial covers THINGS (bits — many, made constantly); DOORS (boards + compositions) are always born private and opened deliberately, no dial — few in number, and the consequential act should be felt. Factory = private for everyone; openness is a chosen posture. *(Undecided.)*

**N11 · The seam named:** a journal-person adds a bit to an ALREADY-PUBLISHED board → lands private → invisible → "why can't you see it?" Candidates: an at-the-moment mention ("this board is published — this bit won't show; show it?") · nothing + the glanceable line · born-where-it-lands (a bit created ON a published board leans public — touches her multi-place watchfulness; named, not pushed). *(Undecided.)*

**N12 · Her four requirements stated together (2026-09-05):** a user-picked default · everything individually toggleable · never laborious ("I don't want to have to turn every single bit public or private") · a surface-level lever ("maybe a global board or composition setting") — "flexibility, but not burdensome."

**N13 · The architectural line Claude drew for her (discussion):** rules may act at BIRTH (a bit born on a published board takes its cloak from context, then owns it) and in BULK (a board action / the publish review writes each thing's OWN cloak, twenty at a time) — but ⛔ never as STANDING OVERRIDES (board-displays-things-as-public-regardless = two truths per thing; kills "who can see this?"; the mistake-machine for multi-place bits). The four-layer stack under that line: the dial (once) · the thing's toggle (exceptions) · the surface bulk-action (one click per room) · doors always deliberate. **Put to her: does the stack sit right, and is the BIRTH rule a want or a danger? Undecided.**

**N14 · Her probe: does the bulk act alter a bit's setting everywhere / does allowing two truths cause display conflicts / where do we LIMIT users?** *(2026-09-05)*

**N15 · The two ripple scenarios given straight:** ripple-OUT (bulk-public on Reading flips the therapy note that also lives on Journal — status changed in another room) · ripple-BACK (bulk-private while tidying Journal silently removes the bit from live, published Reading). One truth throughout — the hazard is action-at-a-distance, not contradiction.

**N16 · ⭐ THE ONLY-NARROWING PRINCIPLE (the backend answer):** every layer may only NARROW visibility, never widen — guest sees iff board-public AND thing-public AND nothing-hides. All ANDs = contradictions impossible, display always computable, "who can see this?" always one answer. **The builders' limit = forbid widening (no "show despite private"), full stop.**

**N17 · The three designs put to her:** ① one cloak only (today's ruling; ripples disclosed; hide-here = un-place) · ② cloak + per-place HIDE-ONLY (narrows ⇒ still conflict-free; serves "published reading board, one card mine-only"; costs one concept + a placement flag + one guest-rule line) · ⛔ ③ per-place both-ways override = the two-truths world, forbidden. **Plus: every bulk act discloses its cross-board ripples before running** (the consequence-moment pattern). **Her pick pending: is hide-only (②) wanted, or is ① enough? Undecided.**

**N18 · She derived the storage herself and asked to be located:** per-bit setting + per-place settings + "a global one that could OVERRIDE" — located for her: **that is Design 2's storage, with the single word "override" being the trapdoor into Design 3.** The teaching swap: **override (precedence — can force VISIBLE) vs veto (every level holds only a NO; shown = zero vetoes; nothing outranks anything).** Her "global beats per-board" intent is already satisfied by veto logic — a global no is sufficient by itself, like every no. The storage table given: bit row = the cloak (one, global — confirmed this is what "cloak" means) · surface row = the door · placement row = where/position (+ Design 2's hide flag) · owner = the dial. *(Undecided still: adopting Design 2's hide flag at all, and the dial.)*
