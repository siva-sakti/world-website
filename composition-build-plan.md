# The composition build plan — six stages, gated
*(Written 2026-09-03, after: the spec verified banner-off (D-146) · the storage session proven (D-145) · §33's words 1–3 landed. House genre: spec → build plan → verification; every stage cites the spec and names its acceptance. The builder follows this and improvises nothing; a question the plan doesn't answer routes to the spec, then to the owner.)*

## The rules over the whole build
- **The spec is the authority** (`docs/composition-spec.md`, VERIFIED); this plan sequences, never re-decides. Words → `lexicon.md` (new code-names enter it in the same pass — the S8/F10 debt lands at stage ①).
- **Model-safety gates on every stage** (CLAUDE.md): invariants named · lifecycle traced · lowest-layer enforcement · derive-don't-duplicate · flow proven end-to-end.
- **Nothing touches cloud without the owner's go.** Stage ① is the only stage that touches stored data.
- **Every stage ends green**: `pnpm build` + typecheck + its named proofs + the owner's feel-test list for that stage.

## Stage ① · THE SPLIT (schema + migration, ONE enactment — §32.1)
**What:** the proven draft (`verification/composition-schema-draft.sql`) becomes a real migration; existing notes move; the disguise drops.
1. Finalize the migration file from the draft + the enactment extras it deliberately deferred: `EXPORTED_TABLES` += composition, composition_file (I-G1 lockstep — the set-equality test goes green, not red) · the tie table's alter-vs-rebuild mechanics (S4) · `mergeSources` gains the repoint step (S4, proven both ways in the draft suite).
2. The migration body, in the tech-spec §1.3 order: schema → **convert each note's HTML body → JSON with the S12.6 fidelity proof** (per-document round-trip diff + contentCheck; flagged-pieces report; a browser-context script — the one-time page) → copy rows (**visibility flipped private**, K2) → repoint tags/placements/references/travel → **grandfather bit-authored references: count, then clean** (K3 — owner ruled her data expendable; report counts) → delete note-rows → drop `kind` → views regenerated → search legs → sweep the ~30 app files (`verification/kind-seam-inventory.txt` is the checklist; `/note/[id]` → `/composition/[id]`, `/notes` redirects).
3. **Prove:** the full draft attack suite re-run against the REAL migration file · migration counts (rows in = rows out, refs repointed, zero orphans) · the S-C scenes replayed · export completeness · a body phrase found in search post-move.
4. **⚑ CHECKPOINT — the owner's #4 nod:** backup shown → throwaway run's raw output shown → her explicit go → cloud migration → app deploy (never app-before-migration).
**Accept:** every §5-era acceptance in `composition-technical-spec.md` §5 + the proofs above green + the owner opens her pieces and everything is where it was.

## Stage ② · THE EDITOR CORE (the writing surface earns its v1)
**What:** the composition page's editor gains the verified v1 set — on the shared editor, so board text-cards inherit capabilities but expose per §13.4.
Surface what's installed (headings ×2 · lists · quote · divider · code — §13.1 "surfacing, not building") · the `/` menu (§13.3.3: typed `/` only) · checklist + table via same-family extensions (§33.3) · **toggle per §13.7** (select-blocks→collapse · label-only folded · searchable · auto-unfold on search-hit; the heading-also-folds ⚪ stays fenced, §32.5) · **columns per §13.9** (builder-default; the owner's refinement pass owns the feel) · drag-reorder with handles (§13.3.5; heading carries its span §20.5; unfold-before-delete §20.5b) · text alignment (§13.2.1) · undo ~15 covering pulled-in acts (§20.4) · never-empty (§13.3.8) · **the node registry as specified (§32.3)** — `hid` on headings from birth · word count = owner's typed words (§32.4/G11) · title/subtitle fields + exit-mint with the display-label fallback (§7, §32.4/G9) · the read/write lock, remembered (`locked_at`, §31.3) · save = the existing debounce/flush/status machinery (§6), the floater/panel indicator gap (§6.6) closed when those frames land in stage ⑤.
**Accept:** §13.3's eight musts demonstrated · fold/search/unfold proven · a heading drag carries its span · lock survives a reload · `pnpm build` green.

## Stage ③ · BRING-IN (the promise: everything you've collected, available)
The picker reaches ALL FOUR target kinds (§9.2 amended · §32.4/G8 board=chip · §31.6 heading-unfold under compositions) · chips per the §29 table (truncation cap ~40ch — the ⚪ cosmetics land at the owner's pass) · the peek per kind (§32.4/G10) · **the block form** (§9.6: the general rule — the bit as it looks on a board; one-level-deep; tuck control; presence per occurrence) · the drawer's tabs + "in this piece" (§9.7) · reconcile extended to the four-column tie (from the node registry, §32.3) · backlinks both directions (§12.1b) · "pulled into" surfaces.
**Accept:** every S-C scene walkable on screen · a chip of each kind placed, peeked, flipped, deleted · the §9.8 edge table demonstrated per row (chips; the block dead-display family stays the one fenced sitting).

## Stage ④ · MAKE-THIS-A-BIT + PASTED IMAGES (material's doors)
Selection toolbar → "make this a bit" per §32.2 (copy-law mint · selection stays writing · no tie · no made-from v1) · pasted/dropped images per §24.3 (composition-owned files · the registry reconcile · the open-time orphan sweep with 24h grace, §32.4/G14 · promotion moves the file) · paste-text stays writing with the waiting affordance (§13.6).
**Accept:** the §24.6 scenes S-C1/S-C3 exact · a pasted image survives trash/restore · destroy sweeps bytes (proven) · promotion lands the file in bit ownership.

## Stage ⑤ · THE POSTURES (frames on a board)
The floater (§14.3: title+body, basic toolkit, no drawer) · dock→panel→page chain (§14.4, one editor moving) · the compose door births per §4.2 (auto-place · evaporate-by-never-writing) · the board's piece-cards distinct (§10.1) + the hide toggle (`hide_compositions`, §10.3) · same-piece-twice = focus the existing frame (§5.1/S9) · undo follows focus · the board-side §23.2 proposal re-presented to the owner HERE (it is still neither confirmed nor vetoed).
**Accept:** the open-chain feel-test list (tech-spec §5) · evaporate's acceptance (create-empty-close ⇒ zero rows) · the floater's save status visible (§6.6 closed).

## Stage ⑥ · THE HOVER LAYER (last, polish on a working surface — §26)
The appendix table enacted (its own small migration + EXPORTED_TABLES row) · summon from the drawer's pin · screen-fixed · viewing-only · hide-all remembered · trashed-pin hidden-not-deleted. **Needs its name from the owner before its UI ships** (§26.5).
**Accept:** §26.3's table demonstrated row by row; positions survive a reload; restore brings a pinned window back.

## Riding alongside (not stages)
The **naming session** (the list's route · "gather" still soft · the hover layer's name · §21.6's direction-words) — needed by ①'s route sweep at the redirect level only; full sweep at naming. · The **owner's refinement pass** over Part III + columns + chip cosmetics. · The fenced sittings: the block dead-display family (one sitting) · heading-also-folds. · The parked shelf stays parked (F-1…F-9).

## The gates, restated
①'s cloud step: **the owner's explicit go, after seeing the throwaway run.** Every stage: green build + its proofs before "done" is said. Any question the spec doesn't answer: **stop and route** — the spec's law (citation, never care) is this plan's law too.
