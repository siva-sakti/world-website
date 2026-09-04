# The composition build plan — gated stages
> ⚠ **TERMINOLOGY, fixed after a confusion Claude caused (owner, 2026-09-04):** **"the schema change"** = the file that changes the database's SHAPE (always needed). **"the data move"** = carrying old notes across — **CANCELLED by the fresh-start ruling (§21.7)**. Claude had used "the migration" for both, which read as if the cancelled thing was still in the plan. Two words from now on.
*(v2, 2026-09-03 — restructured after the owner's confidence challenge ("sensible technically, not neatly packaged") + a re-audit that caught three fall-throughs + registry verification of every extension. Originally written the same day, after: the spec verified banner-off (D-146) · the storage session proven (D-145) · §33's words 1–3 landed. House genre: spec → build plan → verification; every stage cites the spec and names its acceptance. The builder follows this and improvises nothing; a question the plan doesn't answer routes to the spec, then to the owner.)*

## The rules over the whole build
- **The spec is the authority** (`docs/composition-spec.md`, VERIFIED); this plan sequences, never re-decides. Words → `lexicon.md` (new code-names enter it in the same pass — the S8/F10 debt lands at stage ①).
- **Model-safety gates on every stage** (CLAUDE.md): invariants named · lifecycle traced · lowest-layer enforcement · derive-don't-duplicate · flow proven end-to-end.
- **Nothing touches cloud without the owner's go.** Stage ① is the only stage that touches stored data.
- **Every stage ends green**: `pnpm build` + typecheck + its named proofs + the owner's feel-test list for that stage.

## ⭐ THE STANDING ACCEPTANCE — applies to EVERY stage below
*(Written 2026-09-04 after the carry-through map found §15/§16/§17/§18 with no build home. These are not a stage; they are a floor each stage must clear. A stage's own "Accept" line is IN ADDITION to these.)*
- **S1 · §15 — every new screen has its three states:** empty · loading · error. *No stage is done until each screen it introduces has all three.* House rule: every list can be empty, every fetch can fail, nothing fails silently.
- **S2 · §18 — the accessibility floor for what this stage introduces:** every control keyboard-reachable · anything that opens is focus-trapped and returns focus where it was · anything a screen reader meets is announced as what it is.
- **S3 · §16/§17 — keyboard and size:** new controls have their key paths; new screens behave at phone width (frames: page-only, §17).
- **S4 · the house floor:** `pnpm build` + typecheck green · new logic carries a test · nothing in the stage contradicts §1–§3 or §22's guardrails.

## Stage ⓪ · THE ENACTMENT PAPER (planning-grade, runs NOW)
~~The three-act conversion procedure~~ **KILLED BY THE OWNER'S FRESH-START RULING (§21.7, 2026-09-03)** — no browser act, no fidelity proof, no per-document conversion; the plan's single riskiest step is gone. What remains on paper: the real migration file drafted from the proven DDL + the enactment extras (EXPORTED_TABLES lockstep · tie alter-vs-rebuild · mergeSources repoint) · **cloud-lag coordination:** `supabase/migrations/` is 2 files ahead of cloud (`…005` · `…006`, the other window's, proven; the enactment applies them first; my board_cards rebuild is display_size-free and runs after — `…006`'s header forbids standalone application) · the placement machinery satisfies the new `left_at` constraint + server-clock trigger by construction (proof suite already ran with both in the chain, green).

## Stage ① · THE SPLIT — now ONE clean migration (fresh start, §21.7)
1. New tables per the proven draft · `EXPORTED_TABLES` += composition, composition_file (test goes green).
2. **The old note-rows deleted** (`kind='note'`): counted and REPORTED at the checkpoint · their tags/placements/references cascade per the existing destroy physics (K3's expendable ruling extended by §21.7) · then `kind` + its CHECK dropped — the bit table returns to pure material.
3. The code sweep (`verification/kind-seam-inventory.txt` the checklist; `/note/[id]` → `/composition/[id]`; `/notes` redirects; search's kind filter becomes all·bits·compositions).
4. **Prove:** the draft attack suite re-run against the REAL migration file · zero orphans · export completeness · the S-C scenes seeded FRESH in the new home and replayed.
5. **⚑ CHECKPOINT — the owner's #4 nod:** backup shown → the delete-count shown ("N test notes will be removed — restorable from the backup") → throwaway run's raw output → her explicit go → cloud → deploy.
**Accept:** *(+ the standing acceptance S1–S4)* the tech-spec §5 provables minus migration-counts (moot) · the owner opens the app and bits/boards are exactly as they were; the compositions list starts empty and ready.

## ⚠ THE ONE PLACE BITS AND COMPOSITIONS COUPLE *(owner-surfaced 2026-09-04: "we have to make sure the way you're building compositions works with the way bits are currently done")*
**Verified facts:** only the **text** bit type has a body at all (drawing = `strokes` jsonb · image/audio/pdf = files · link = url), and that body is **HTML**; the composition's is **JSON**. **Board text-cards and compositions mount the SAME editor component** (`TextBit`, from `board/[id]/card.tsx` · `bit/[id]/text-workspace.tsx` · `write/quick-write.tsx`) — the ruled "one shared editor" (§13).
**The requirement:** the shared editor must write **HTML when mounted on a bit and JSON when mounted on a composition** — an explicit per-mount setting, never an accident. Its capability set stays shared (§13); only the OUTPUT differs. A test asserts each mount's format. *(Not hard; must be deliberate.)*
**⭐ AND WHY THE FORMATS NEVER ACTUALLY MEET** *(owner, 2026-09-04: "if they're brought in as blocks or if they're hovering, does that cause [a problem]?")* — **no, by construction, and it is her own window ruling (§24.5b) that guarantees it:**
- **A block stores a POINTER, not content.** The composition's document holds `{kind, id, label, form…}` (§32.3); the bit's content stays in the bit, in the bit's own format. At display the app fetches and renders it **exactly as on a board** (§9.6's general rule). A table bit shown in writing = "draw bit #77 here" — the composition's JSON never contains the table's HTML. **No conversion, nothing to sync.**
- **The hover layer touches the document not at all** — those windows float above the page (§26).
- **Editing cannot collide either** — a block's content is edited on the bit's own page (§24.5b), never in place, so a composition never writes into a bit's format.
- **Search:** the composition is findable by the chip's cached NAME; the bit by its own words through its own index. Two indexes, no overlap.
- ⚠ **Export is the ONE place a window becomes a copy** — a rendered export must **inline each block as a snapshot** (the table's HTML, the image, the quote) or the file ships dangling references. Consistent with the ruled *"export is a snapshot"* (§30c). **Build detail, named here so it is not discovered late.**
- ⚑ **Open in the OTHER window's lane, not a blocker here: the table BIT's own storage format** (HTML like text · structured like `strokes` · a file). Every option above works unchanged either way.

**The ruled sequencing** *(owner asked for the ideal, not a forced fit)*: the ideal end-state is ONE format everywhere, but the reasons JSON won for compositions mostly do not transfer to bits (no chips after the split — flatness · no headings · little structure), and the risk classes are opposite — **her compositions are deletable test data; her bits are the real notebook.** So: composition on JSON now (greenfield, zero risk), and **a bit-format conversion stays its own later, separately-proven project** — after the JSON path has real use behind it. Recorded so it is a decision, not a drift.

## Stage ②a · THE EDITOR — SURFACING + THE PAGE (low-risk half)
**Registry-verified (2026-09-03, npm reads, no installs): every needed piece EXISTS as an official MIT `@tiptap/*` 3.x extension** — task-list/item (checklist) · table · **details (the toggle)** · **drag-handle** · **unique-id (the heading `hid`s — the vendor's own tool, not custom code)** · static-renderer (already approved). **The ONE custom build in the whole editor: columns** (no official or findable community package — §13.9 is its spec).
This half: surface the installed blocks (headings ×2 · lists · quote · divider · code) · the `/` menu · checklist + table extensions · text alignment · never-empty · title/subtitle + exit-mint + display-label fallback (§32.4/G9) · word count (owner's words only, G11) · the lock (`locked_at`) · **the fall-throughs the owner's challenge caught, homed here:** the compositions LIST gains the due-date sort/filter (§31.2) · **composition saves get the I-D1 liveness guard** (FOR SHARE target-alive check, the house write law — was unlisted) · **the page records its `opening`** (the recent trail — column existed, the write was unhomed).
**Accept:** *(+ S1–S4; this stage introduces the composition page and the list — §15's three states apply to both)* the eight musts minus drag · list sort/filter works · a save against a just-trashed composition prompts instead of landing silently.

## Stage ②b · THE EDITOR — STRUCTURAL BLOCKS (the hard half, honestly labeled)
The two genuinely hard pieces, isolated so their risk can't hide: **drag-reorder with a heading carrying its span** (§20.5 — real ProseMirror structural surgery; drag-handle extension gives the gesture, the span logic is ours; plan: its own mini-spec + tests before code, antagonist-checked) · **the columns block** (custom, §13.9) · the toggle via `extension-details` bent to §13.7 (label-only folded · searchable · auto-unfold on search-hit — the search-hit unfold is ours) · undo ~15 covering pulled-in acts · unfold-before-delete (§20.5b).
**Accept:** *(+ S1–S4)* §13.3's drag must + heading-span proven by tests that try to break the span math · fold/search/unfold end-to-end · columns per §13.9 including phone stacking.
## Stage ③ · BRING-IN (the promise: everything you've collected, available)
*(Depends on ②a only — can interleave with ②b if the builder wants; the node registry §32.3 is fixed before either persists anything.)*
The picker reaches ALL FOUR target kinds (§9.2 amended · §32.4/G8 board=chip · §31.6 heading-unfold under compositions) · chips per the §29 table (truncation cap ~40ch — the ⚪ cosmetics land at the owner's pass) · the peek per kind (§32.4/G10) · **the block form** (§9.6: the general rule — the bit as it looks on a board; one-level-deep; tuck control; presence per occurrence) · the drawer's tabs + "in this piece" (§9.7) · reconcile extended to the four-column tie (from the node registry, §32.3) · backlinks both directions (§12.1b) · "pulled into" surfaces.
**Two requirements from the §34 stress-test:** **batched block loading** (one assembling read, the board's pattern — never N round-trips for N blocks) · **a block's loading + failure states** (the peek has them, blocks don't; house rule: every fetch can fail).
**Accept:** *(+ S1–S4; §18's chip/peek/block announcements land here)* every S-C scene walkable on screen · a 40-block piece loads in one round-trip (asserted) · a block whose fetch fails degrades visibly, never silently · a chip of each kind placed, peeked, flipped, deleted · the §9.8 edge table demonstrated per row (chips; the block dead-display family stays the one fenced sitting).

## Stage ④ · MAKE-THIS-A-BIT + PASTED IMAGES (material's doors)
Selection toolbar → "make this a bit" per §32.2 (copy-law mint · selection stays writing · no tie · no made-from v1) · pasted/dropped images per §24.3 (composition-owned files · the registry reconcile · the open-time orphan sweep with 24h grace, §32.4/G14 · promotion moves the file) · paste-text stays writing with the waiting affordance (§13.6).
**Accept:** *(+ S1–S4)* the §24.6 scenes S-C1/S-C3 exact · a pasted image survives trash/restore · destroy sweeps bytes (proven) · promotion lands the file in bit ownership.

## Stage ⑤ · THE POSTURES (frames on a board)
The floater (§14.3: title+body, basic toolkit, no drawer) · dock→panel→page chain (§14.4, one editor moving) · the compose door births per §4.2 (auto-place · evaporate-by-never-writing) · the board's piece-cards distinct (§10.1) + the hide toggle (`hide_compositions`, §10.3) · same-piece-twice = focus the existing frame (§5.1/S9) · undo follows focus · the board-side §23.2 proposal re-presented to the owner HERE (it is still neither confirmed nor vetoed).
**Accept:** *(+ S1–S4; §18's focus handling across the frames, and §17's phone rule, land here)* the open-chain feel-test list (tech-spec §5) · evaporate's acceptance (create-empty-close ⇒ zero rows) · the floater's save status visible (§6.6 closed).

## Stage ⑥ · THE HOVER LAYER (last, polish on a working surface — §26)
The appendix table enacted (its own small migration + EXPORTED_TABLES row) · summon from the drawer's pin · screen-fixed · viewing-only · hide-all remembered · trashed-pin hidden-not-deleted. **Needs its name from the owner before its UI ships** (§26.5).
**Accept:** *(+ S1–S4)* §26.3's table demonstrated row by row; positions survive a reload; restore brings a pinned window back.

## Riding alongside (not stages)
The **naming session** (the list's route · "gather" still soft · the hover layer's name · §21.6's direction-words) — needed by ①'s route sweep at the redirect level only; full sweep at naming. · The **owner's refinement pass** over Part III + columns + chip cosmetics. · The fenced sittings: the block dead-display family (one sitting) · heading-also-folds. · The parked shelf stays parked (F-1…F-9).

## The gates, restated
①'s cloud step: **the owner's explicit go, after seeing the throwaway run.** Every stage: green build + its proofs before "done" is said. Any question the spec doesn't answer: **stop and route** — the spec's law (citation, never care) is this plan's law too.


---
# THE CARRY-THROUGH MAP — every spec section → its build home
> ⭐ **Why this exists** *(owner, 2026-09-04)*: *"now that we have two levels of document — the big write-up and then the phased one — we have to make sure the things carry through."* The spec says **what is true**; this plan says **when it is built**. Nothing else guarantees every line of one reaches the other. **This map is the guarantee, and it is re-runnable.**
> **The rule from now on:** a ruling added to the spec gets a row here **in the same pass** (the same discipline as `cross-feature-rulings.md`). A stage may build nothing that has no spec section; a spec section may name nothing that has no stage.

| spec | build home |
|---|---|
| §1–§3 foundations · the laws · §22 guardrails | **not built — constraints.** Every stage is checked against them |
| §4 birth (write page · list door) / (board compose-door) | **②a** / **⑤** |
| §5 opening + the frames chain · §14 the three frames | **⑤** |
| §6 saving · §6b parts · §7 the title + exit-mint | **②a** *(save machinery exists; the frames' indicator lands with ⑤)* |
| §8 job facts (columns / the UI / the list's sort-filter) | **①** / **②a** / **②a** |
| §9 pulling in — trigger · picker · chip · peek · block · drawer · edges | **③** *(all of it; §34's batching + failure states in its acceptance)* |
| §10 on a board — the card · placement · hide-toggle | **⑤** *(the `hide_compositions` column lands in ①)* |
| §11 states — live/archived/trashed/destroyed | **①** (columns + cascades) → behaviors surface in **②a/③/⑤** |
| §12.1 search · §12.1b backlinks · §12.2–12.4 tags/folders/star · §12.5 export · §12.7 the pull | **①** · **③** · **①** · **①** · **①** |
| §12.6 the graph | ⏸ parked — no stage, by design |
| §13.1–13.6 the editor's v1 set | **②a** (surfacing · checklist · table · alignment) + **②b** (drag+span · columns · toggle) |
| §13.7 toggles · §13.9 columns | **②b** |
| §16 keyboard · §17 responsive/phone | **②a** *(⚠ was unhomed — see the gaps)* |
| §20.1–20.3 headings · contents · the lock | **②a** *(the `locked_at` column in ①)* |
| §20.4 undo · §20.5 drag + heading-span · §20.5b the folded-backspace path | **②b** |
| §20.5c + §31.6 heading ids + cross-piece section links | **②a** (ids, via the vendor's unique-id extension) + **③** (the picker's heading-unfold) |
| §20.6 affordances | **②a/③** per row |
| §21 + §27 storage · the pointers · the views | **①** |
| §23.1 presence per occurrence · §23.2 the board-side posture | **③** · **⑤** *(and §23.2 is re-presented to the owner AT ⑤ — still unconfirmed)* |
| §24.1–24.2 the composing model · §24.3 pasted-image files · §24.4 flatness-as-FK · §24.5b window + copy-door | **②a** · **④** · **①** · **③/④** |
| §25 the move inventory · §28 the walk · §24.6 the scenes | **not built — the acceptance fixtures.** Every stage tests against them |
| §26 the hover layer | **⑥** |
| §29 chips per type · §30 the bring-in list (four targets) | **③** |
| §32.2 make-this-a-bit · §32.3 the node registry · §32.4 the small answers | **④** · **②a** *(fixed before anything persists)* · **②a/③** |
| §34 the pointer stress-test | **③** (its two requirements are in ③'s acceptance) |

## ⚠ THE GAPS THIS MAP FOUND — four spec sections had NO build home
*(Found on the first run, 2026-09-04 — exactly the failure the owner predicted.)*
1. ⭐ **§15 · Empty, loading, error — every screen.** Spans every stage and belonged to none. **Ruled here, and ENACTED as standing-acceptance S1 above** (not merely recorded — every stage's Accept line now references it). No stage is done until its new screens have their three states. *(The owner: "if loading or [a fetch] fails, we need to write those things down.")* Stage ③ additionally owes the block's states (§34.5), which §15 never covered.
2. **§18 · The accessibility floor** — keyboard reachability · focus-trapping the picker/peek and returning focus to the caret · chips and blocks announced as what they are · the toggle's fold state announced. **Homed: ②a for the page's floor, ③ for chip/peek/block announcements, ⑤ for the frames' focus handling** — each in its stage's acceptance, not a separate stage.
3. **§16 keyboard · §17 responsive** — implied but never assigned. **Homed above: ②a**, with ⑤ owning the frames' phone rule (page-only).
4. **§12.6 the graph** — correctly homeless (parked); recorded so its absence reads as deliberate, not missed.

## How to re-run this check
1. Walk the spec's section list; every section appears in the table above or in the "not built" rows.
2. Walk the stages; every item a stage builds cites a spec section.
3. A row that cannot be filled either way **is the finding** — a spec section with no builder, or a stage inventing work nobody ruled.
**Run it: after any spec change, and once more before stage ① starts** *(the second run is best done by an independent agent — the author is the wrong checker, the same reason Gate B exists).*
