# The visibility model — the authority
> ## ✅ SEALED · 2026-09-05 · THE authority for everything public/private in this app
> **Sealed by the owner across a two-day session** (the full reasoning: `docs/privacy-session-notes.md`, N1–N47 — the record of every option weighed and why the losers lost). **This document states; it does not argue.** Anything elsewhere that contradicts it is superseded — the sweep table at the bottom names each.
> **The owner's founding line (hers, verbatim-near):** *"We're not going to force people to be public — but I want the entire architecture to be there if people want public things, while not feeling intruded upon in their process, which has private parts to it."*
> *(The one metaphor line, per her rule: a surface's visibility is its **door**; a bit's is its **cloak**; the laws below are all ANDs — everything else in this doc is literal.)*

## 1 · The switches — what is stored, completely
- `bit.visibility` — `'public' | 'private'` · **born private**
- `board.visibility` — same · born private
- `composition.visibility` — same · born private
**That is ALL privacy storage.** No per-spot hide (examined, collapsed into privacy — any future "tuck away" is an *arrangement* feature, unrelated). No owner default dial (examined, cut — born-private + review-screen bulk-flips do its job; additive later if ever). No settings table needed. Nothing on the placement row.
⚠ **Two birth corrections at build:** the `bit` column default flips `'public'` → `'private'` · **the one-time legacy flip** — every existing bit sheds its founding-era public flag (counts shown, owner's go) **before any publish act exists.** Non-negotiable, every model, always.

## 2 · The three lived stages *(two switches, no third state)*
1. **WORKING** = private. Draft mode is privacy doing its job. Creation asks nothing — everything is born private, thoughtlessly.
2. **PUBLIC** = permission. A public thing with no door to it is seen by no one — there is no feed *(not prohibited any more — the founding "never" is erased for the product era; discovery/profiles belong to the future social session; simply **not built**)*.
3. **OUT** = public **and reachable**: its card on a published board, or a link handed to someone.
*(The composition's LOCK is "felt-finished" — a posture, not a visibility state. **Sharing with a specific person — keys — is NOT in this model**: parked for the accounts era, schema doors open.)*

## 3 · The two laws — each true to its medium
### Boards — the absence model *(a board is SPACE; absence leaves space)*
Private bits **may** sit on public boards. Place freely; nothing stops you; nobody checks your own account. **A visitor's board = your arrangement minus the absent cards** — the space stays, overlap renders normally, nothing reflows. **The marker:** on a published board, a private bit never looks ordinary to you. Flipping a bit private is the gentlest act in the model: it quietly vanishes for visitors everywhere, nothing moves, fully reversible.
### Compositions — the hard rule *(a composition is PROSE; absence would leave holes)*
> **A private bit can never be incorporated into a public composition.**
Private pieces gather anything, freely. The rule bites only at the public edge: **gathering into a public piece** meets the barrier — *make it public · place a public copy · keep it in the hover view instead*. **Publishing a piece** requires resolving each private gathered thing first (flip · public copy · remove the chip) — which is editing your piece for its audience. **The hover view** (bits propped above the writing, owner-only, toggleable) is the always-free way to have private material at hand there. A public piece therefore **never** renders differently than authored: no holes, no broken sentences, no markers needed.

## 4 · The states
**Boards** (bit × board):
| bit | board | visitor sees | you see |
|---|---|---|---|
| public | public | the card | the card |
| public | private | nothing (door shut) | the card |
| private | public | **absent — space stays** | the card, **marked** |
| private | private | nothing | the card |
**Compositions:** a private piece may contain anything (visitors see nothing — door shut). A public piece contains **only public things**, by law — the mixed state is *prevented at the doors*, never rendered. All board states legal; no state anywhere is ambiguous.

## 5 · The acts *(every row a future test case)*
| act | what happens | the moment says |
|---|---|---|
| create anything | born private | nothing — ever |
| place a bit on a board | always succeeds | on a *published* board: public bit → *"visitors can see this here"* · private bit → marked + *"visitors won't see this here"* |
| gather a bit into a piece | private piece: free · **public piece: the barrier** | the offer: *make public · public copy · keep in hover* |
| flip a bit **public** | it appears wherever public boards hold it | the line lists where |
| flip a bit **private** | vanishes for visitors on boards (gentle) · **if quoted in a public piece: the piece un-publishes, with your confirm** — the app never edits your prose and never blocks your privacy | the line lists boards; the confirm names the piece |
| publish a board | door opens | **the review**: what shows, what won't (the gaps), bulk-flip offers, per-item |
| publish a piece | door opens **after** each private gathered thing is resolved | the resolve list: flip · copy · remove, per item |
| un-publish either | everything there vanishes for visitors; contents' switches untouched | one small confirm |
| bulk acts | many of the above | aggregated, shown **before** running; private items listed separately, each opt-in |
| viewing (panel · hover · your own pages) | always free, always yours | never any privacy UI |

## 6 · The invariants
Visitor rules are **ANDs only, forever** — no OR, no exception, which is why conflicts cannot exist · an act touches **only its own switch** *(no exceptions remain — the auto-hide died with the hide)* · the machine **never edits your prose** and **never blocks a privacy flip** · nothing is ever forced public · switches never lie — what a setting says is always true · **no chains**: every outcome is computed fresh from current columns; paths forget themselves · viewing chrome is owner-only, always · every stored kind stays in the export (owner's own data — visibility never filters HER access to anything).

## 7 · Corners and edges, collected
The unpublish corner (above) — rare, reversible, chosen · re-placing remembers nothing (no hide exists) · a public **loose** bit shows nowhere (not prohibition — just no door) · board gaps are by design and marked · empty columns / broken sentences in public pieces are **impossible states**, not rendering problems · trash/archive multiply everything uniformly (not-live → visitors see nothing) · export unaffected.

## 8 · The companions *(all screens, no concepts)*
The **marker** (boards only) · **view-as-visitor** (any published surface, exactly as a guest) · the two **review screens** (board: shows; piece: resolves) · the barrier **offers** · flip **notifications** with where-lists · **bulk disclosure** with per-item opt-ins.

## 9 · The technical delta from today *(direction-grade — NOT for enactment; the owner sequences the build)*
**Already built and matching (July's founding work):** the bit/board columns · the visitor RLS policies implementing exactly the board AND-law (`20260728000002`, proven leak-proof) · `composition.visibility` born-private in the proven ①a draft.
**The build, when sequenced:** ① the legacy flip + the bit default change (one small migration; counts + her go) ② the composition guest policies (the drafted comments in the ①a file → real) ③ the gather-barrier at the app's one door (the picker + reconcile refuse private targets into public pieces — app-level, like flatness pre-split; stated honestly) ④ the unpublish mechanic ⑤ the companions (screens). **Nothing is removed — no hide column ever existed. No new tables. No settings storage.**

## 10 · Out of scope, doors open
Person-keys / the shared tier (accounts era) · discovery, profiles, feeds (the social session — no longer prohibited, not designed) · the default dial (additive if ever) · arrangement-tuck (unrelated future) · the naming of user-facing words (the naming session).

## The sweep — what this supersedes *(each marked at its home)*
`philosophy.md`'s "under active rethink" banner → **resolved by this document** · the composition spec's §12.2b "whole model deferred" → the session happened; this is the model · the composition spec's §34.4/§24-era "private windowed bits render absent" → **superseded — the mixed state is now prevented, not rendered** · `invariants.md` I-P4 "no public feed" → re-scoped: *not built; no longer prohibited* · I-P1's "bit default public" → superseded by born-private · `docs/privacy-session-prep.md` + `privacy-simplification-review.md` → historical inputs, superseded as authorities · `docs/product-concept-privacy.md` → predates the session; consult this doc instead.
