# Stress-test — the convergent-surfaces direction (independent review, 2026-09-01)

> ## STATUS · 🔵 AN INDEPENDENT REVIEWER'S FINDINGS — not rulings, not the owner's
> Commissioned by the owner *"to think through how convergent surfaces in general come in, and then how the way we are approaching it works."* Briefed with the model, the goal (*maximum sensible surface area*), our five conclusions, and our own docs — and told **not to validate**. Heavily sourced; the reviewer **corrected itself twice mid-report** (noted inline), which is the behaviour we want.
> **Read alongside** `convergent-surfaces-overview.md` (what it is testing).

---

## The headline: convergence is TEN operations. We serve two.

| # | operation | the record it needs | today |
|---|---|---|---|
| 1 | **frame** — commit to a target (what · for whom · how long · by when) | a constraint on the piece | ❌ |
| 2 | **gather** — pull candidates | a membership | ✅ `[[` · drawer · search · the pull |
| 3 | **select / cull** — in or out **for this piece** | a **per-piece** in/out flag | ❌ live/trashed/archived are **global** |
| 4 | **excerpt / split** — take *part* of a thing | an excerpt object or anchor | ❌ `reference` is whole-bit, UNIQUE, no anchor |
| 5 | **order** — decide the sequence | an **authored** order | ❌ `z` is stacking; I-G3 forbids a second clock |
| 6 | **group** — cluster **and name it** | a group record | ❌ proximity is two floats |
| 7 | **merge** — several become one sentence | prose + provenance | prose ✅ · provenance whole-bit only |
| 8 | **commit** — declare a version done | a version / state | ❌ |
| 9 | **revise** | all of the above | — |
| 10 | **emit** — hand it to a person | a rendered file | ❌ `/api/export` is JSON of your world |

**The trio addresses #5 and gestures at #1.** The rest are missing **records and acts, not surfaces.** Doc · deck · sheet · outline · board are **five renderers of the same facts.**

**The indictment, from our own doc:** `promise.md` §4 rules *"the craft goes into the seams… not more board features."* **The plan puts all the craft into three destinations.**

**The warning that should land hardest — Tana.** Everything-is-a-node, supertags, live queries: architecturally our plan's endpoint. Their tagline is *"Write information, not documents,"* and **"Long-form writing in Tana" remains an open request with 359 votes on their own ideas board** — *"it is not possible to write essays, emails, blog posts… in a smooth way."* **A perfect atom model does not produce convergence by itself.**

**The prize is unclaimed:** Mural/Miro lay an authored order over space but export *pictures of viewports*; Longform carries *text* but has no canvas. **Nobody carries text and keeps free space.**

**What to keep:** the **bit-block** and **rows are bits** — and Heptabase's governing rule is our model in someone else's words: *"Whiteboards do not own cards. All cards belong to the Card Library."*

---

## The six verdicts

**1 · "Free to diverge, formatted to converge" — WEAK.** An **outline** converges hard with no format · **KJ clustering** converges with none · **deleting 40 of 50 cards** is maximal convergence with none. And formats force nothing: a blank Doc is where sprawl lives, and a **spreadsheet** — a third of our trio — is used overwhelmingly for *divergent accumulation*. **The real variable is CONSTRAINT (a bound), not FORMAT (a shape)**; the deck works because a slide is *bounded*.
> ⚠ **The consequence, and it is sharp: making the doc more capable makes it more DIVERGENT.** Our #1 build item runs the wrong way under our own frame.

**2 · The trio (doc/sheet/deck) — WEAK: partly real, borrowed, incomplete.** Real in that the three differ — but on **what carries the structure**, not "format," an axis we never articulated. Borrowed: named by product, and our own doc says it *"maps to the tools creatives already keep open."* The completeness check tested a list we had already written. **It omits stored NESTING — the 1987 middle rung** (Smith & Weiss, WE system: writing moves *"network → hierarchy → linear sequence"*). And **the board is already on that axis**, which is the tell these aren't a separate family.

**The better decomposition — one axis: what carries the structure?**

| carrier | surface | have it? |
|---|---|---|
| authored prose | doc | ✅ thin |
| stored 2-D position | **board** | ✅ good |
| **stored nesting** | outline / binder | ❌ the missing rung *(⚠ `/outline` already exists as a browse lens — step-2b name collision)* |
| **authored linear order** | deck · setlist · shot list | ❌ |
| computed query over fields | sheet | ½ — **the pull already is this**; only fields missing |

**3 · The 2×3 grid — WRONG as claimed, useful as UI taxonomy.**
- *"Every cell writes a reference or placement row"* is **false** — a **LIVE VIEW block writes no row** (a query has no target). A third of the grid yields no backlink.
- *"LIVE VIEW × space — a board is nearly this"* is **wrong**, contradicted a page earlier by our own Anytype Query-vs-Collection citation.
- **`reference.to_bit_id` cannot point at a board or source** — that cell is a migration (A15/N6), written as if true.
- **No cell for partial inclusion; no axis for order.**
- ⚠ **§4.2's chip-and-block "two displays of one mechanic, owner-switchable per instance" runs against the field.** Notion ships both and names them *differently* (link-to-block vs synced block, `"synced_from": null` marking the original); **Roam and Logseq both explicitly warn: don't conflate a *window* with a *portal*.** A per-instance toggle blurs a distinction three tools keep sharp.

**4 · "Rows are bits" — SOUND gate, WRONG costing.** By **I-N1** every tracker row is **loose forever**, and **I-T1** forbids hiding them. `listAllBits` ships **every live bit to the client** (`/bits`, the drawer, `/outline`, live search — already past PostgREST's 1000-row cap with a noted ~1000-item trigger); the `[[` picker gets all candidates. **Excerpt-bits hit the same wall.** Both roads need one fix: **a membership, so a bit isn't loose.** Fix that and the gate holds.

**5 · Sequencing — WEAK: defensible order, wrong labels, inverted estimates.** Doc-first is pragmatically fine; **counting it as "the convergent half" is not.** And the estimates are backwards: the **sheet is cheapest** (one `bit.props jsonb` + a table rendering of the pull, which exists — a bit already carries 5 of 8 tracker columns; the gap is *a date you set*); **the deck, called "lighter," is heaviest** (authored order + bounded frames + a print pipeline).
**The reviewer's order:** doc-blocks continuously as table stakes → **the authored-order primitive** → **the bit-block** → **the deck end-to-end including the file that leaves the app** — the only build that proves *"you collect → you finish."*

**6 · Missing entirely — see the gaps.**

---

## What convergence actually is (Part A findings)

**The literature is one-sided and we had it backwards.** Double Diamond's converge is *"taking focused action"* and *"rejecting those that will not work"* — **zero language about producing a document.** The **KJ method** (Kawakita) is verbatim: *label creation → label grouping → chart creation → **written or oral explanation***; its own cardinal rule is that clustering must be **bottom-up, never to fill a preexisting categorization** — *"the most important aspect of the KJ method."* ⚠ **That cuts against templates-with-columns-prefilled as the convergence answer.** And note the method **ends in prose** — the step the UX lineage dropped.

**The outliners treat convergence as a lossless PROJECTION:** Workflowy's node-type change is *"reversible and lossless"*; a Board is *"the first level of nesting becomes the column names."* Roam and Logseq both distinguish a **window** (`((uid))`) from a **portal** (`{{embed}}`).

**The counterweight, kept honestly:** Russell et al., *The cost structure of sensemaking* (CHI '93) — the representational shift **is** the high-value move. Don't abolish the destination; **make it cheap.** Every prose-output tool (Scrivener, Ulysses, Longform) still ships a **compile** step; Tana's 359 votes is what happens without one.

**The reconciliation, and it's Longform's shape:** the manuscript is *an ordered list held as metadata over the fragments*, and it *"never alter[s] the contents on your notes."* **A projection that behaves like a surface.**

### ⚠ The reviewer corrected itself twice — both worth keeping
1. **Do NOT derive order from y-position** (parked **A1**'s shape, which Milanote ships). Three independent sources: Scrivener requires an explicit **Commit Freeform Order** *"since the freeform order is free, Scrivener has to guess"* (and asks the reading direction); Tinderbox keeps `$Xpos/$Ypos` and `$OutlineOrder` **deliberately independent** — *"no obvious answer"* which direction implies sequence; Canvas2Document never reads x/y. **A sequence is authored information a 2-D arrangement does not contain.** Corollary: **nesting shares across views for free; order does not.**
2. **Do NOT mint block-ids into text** (Obsidian `^id` / Logseq `id::`) — it **mutates captured source**, which **I-Src3 (read-once)** exists to prevent, and it *still* can't reach a sentence (an Obsidian moderator: *"It can't link to sentences"*).

### The excerpt problem — a real hole, already broken in shipped code
Our doctrine says *"a bit is a unit of capture, not an atomic idea — never force one-idea-per-bit"* — **and there is no way to split one later.** `reference` is `(from,to)`, UNIQUE, no anchor. **Already broken:** **pdf and audio bits shipped** (migrations 20260830000003/4); a PDF is searchable **by filename only**, and a bit-block rendering one *"in full"* is meaningless. **The grid's middle row assumes bits are small; the model says any size. Both cannot hold.**

**The four stances, costed:** selectors (W3C TextQuote) — **Hypothes.is measured 22% of 20,953 highlights permanently unanchorable, 53% at risk**, *after* four fallback strategies · copy+parent FK (Readwise) — position lost · id-in-source (Obsidian/Logseq) — **disqualified by I-Src3** · **promote to a first-class object** (Heptabase Highlight Cards · Zotero annotations-as-items · Tinderbox **Explode**) — proliferation, same wall as verdict 4.

> **The reviewer's revised recommendation:** an excerpt is **a first-class bit with a FK to its parent**, quoted `text` and your `comment` as separate fields (Zotero's shape), plus a TextQuote `exact`+`prefix`+`suffix` stored as a **best-effort hint, not the truth** — never mutating the source, dodging the orphan cliff. **And make splitting an ACT, not a capture tax:** Tinderbox's `Note ▸ Explode` splits one note into many *after the fact*. That directly resolves our doctrine's contradiction — **and it is an operation, not a surface.** *(Zettelkasten's own literature on the alternative: "this switching ruins the focus"; "Don't be an atomicity zealot.")*

### Spatial → linear: only four mechanisms exist
1. **Implicit reading-order sort** (Milanote's Word export, Tinderbox `$Sort=Ypos`) — undocumented folklore everywhere.
2. **Author-declared order over space** — the only one that works: Mural's **Outline** (*"exports… in the order of your outline"*), Miro **Frames**, Scrivener **Commit**, Longform `scenes:`, Tinderbox `$OutlineOrder`. **Mural/Miro carry viewports (you get slides); Longform carries text but gave up space.**
3. **AI generation** — Miro Create with AI; Mural's Cluster **rearranges your stickies**, destroying the arrangement that carried the meaning. Moot for us, but it's why the category *looks* solved.
4. **Refusal** — Muse/Allume, Napkin, Sublime, core Obsidian Canvas. Ink & Switch on their own product: work *"is currently trapped in Muse."*

**Heptabase — the closest comparable — ships a MANUAL method:** copy card links → paste into a new card → group under headings → *"gradually replac[e] the links with your own text."* **Transclusion is scaffolding people delete.**

**Scrivener's unmatched move: Draft vs Research + "Include in Compile"** — one project holds sources *and* artifact; the boundary is **one flag**. **No spatial tool surveyed has an equivalent.** Also `Merge`/`Split at Selection` as reversible ops that *retain synopses, notes, bookmarks, keywords, snapshots*.

**And the gesture every spatial tool has that we don't:** *convert this selection into a thing* — Figma Frame selection · FigJam Create section · Freeform Group · Obsidian Canvas "Convert to file…" · Notion "Turn into page." **The single most common convergent gesture in the category, and we have none of it.**

---

## The gaps, ranked

1. **A per-piece in/out state — the cut pile.** Scrivener's Draft/Research + Include-in-Compile; **no spatial tool has one.** Today culling means trashing (global) or nothing.
2. **The excerpt, plus `explode` as an act.** Already broken for shipped PDF and audio bits.
3. **Authored order + a named group** — and **"convert this selection into a thing."**
4. **The constraint on a piece** (audience · length · deadline). Cheapest item on this list. *(reviewer's inference, not the owner's)*
5. **The output artifact** — our five-types list had *"a file you hand someone"* and **§2c-bis dissolved it. Don't** — it's the terminal convergent act, and the demo that sells the switch.
6. **File bits are write-only** — no highlight, transcript, or timestamp; the chain dead-ends on two of six shipped types.
7. **No version / commit.**

## Uncertainty, as flagged by the reviewer
Gap #4 is its inference, not the owner's · the `placement` sketch is **untraced against the invariants** and needs an **I-G3** ruling · the five-carrier axis is the reviewer's · much of the tool detail came via relay research (two verbatim strings independently re-fetched and matched; the rest one layer of relay) · Roam's official help is an SPA (claims rest on their repo + a mirror) · **treat Miro specifics as soft** (403 for one agent) · Luhmann's numbering is secondary-sourced · **there is no W3C RobustAnchoring spec** — the WG produced no output on it.

## Sources
Design Council (Double Diamond) · Scupin 1997 · Gu & Lee 2024 · Iba PLoP 2017 (KJ) · NN/g · IxDF · Literature & Latte (Scrivener: corkboard · Freeform/Commit · Scrivenings · Compile · Include in Compile · Merge/Split) · Ulysses help · Longform repo + COMPILE.md · Heptabase wiki (method · fundamental-elements · pdf-annotation) · Milanote export help · Obsidian links/embeds + forum + Canvas2Document + jsoncanvas.org · aTbRef + eastgate.com + Eastgate forum (Tinderbox · Explode) · Muse/Allume + Ink & Switch + Metamuse 61 · Kinopio · Miro & Mural help · Gingko `Export.elm` · Workflowy help + Mirrors · Roam `roam-tools` + help mirror · Logseq docs · Tana docs + ideas.tana.inc/posts/91 · Notion help + API · Craft support · Zotero `userdata.sql` + Zotero 6 blog · Readwise api_deets + docs · W3C Web Annotation Data Model · Hypothes.is client + arXiv:1512.06195 · WICG text fragments · zettelkasten.de · Matuschak notes · Shipman & Marshall (*Formality Considered Harmful*) · Marshall & Shipman HT'93 · Russell et al. CHI'93 · Threddy/Sensecape (UIST) · UNC TR 86-025/87-033 (WE, 1987)
