# The composition build plan — six stages, gated
*(v2, 2026-09-03 — restructured after the owner's confidence challenge ("sensible technically, not neatly packaged") + a re-audit that caught three fall-throughs + registry verification of every extension. Originally written the same day, after: the spec verified banner-off (D-146) · the storage session proven (D-145) · §33's words 1–3 landed. House genre: spec → build plan → verification; every stage cites the spec and names its acceptance. The builder follows this and improvises nothing; a question the plan doesn't answer routes to the spec, then to the owner.)*

## The rules over the whole build
- **The spec is the authority** (`docs/composition-spec.md`, VERIFIED); this plan sequences, never re-decides. Words → `lexicon.md` (new code-names enter it in the same pass — the S8/F10 debt lands at stage ①).
- **Model-safety gates on every stage** (CLAUDE.md): invariants named · lifecycle traced · lowest-layer enforcement · derive-don't-duplicate · flow proven end-to-end.
- **Nothing touches cloud without the owner's go.** Stage ① is the only stage that touches stored data.
- **Every stage ends green**: `pnpm build` + typecheck + its named proofs + the owner's feel-test list for that stage.

## Stage ⓪ · THE ENACTMENT PAPER (planning-grade, runs NOW)
~~The three-act conversion procedure~~ **KILLED BY THE OWNER'S FRESH-START RULING (§21.7, 2026-09-03)** — no browser act, no fidelity proof, no per-document conversion; the plan's single riskiest step is gone. What remains on paper: the real migration file drafted from the proven DDL + the enactment extras (EXPORTED_TABLES lockstep · tie alter-vs-rebuild · mergeSources repoint) · **cloud-lag coordination:** `supabase/migrations/` is 2 files ahead of cloud (`…005` · `…006`, the other window's, proven; the enactment applies them first; my board_cards rebuild is display_size-free and runs after — `…006`'s header forbids standalone application) · the placement machinery satisfies the new `left_at` constraint + server-clock trigger by construction (proof suite already ran with both in the chain, green).

## Stage ① · THE SPLIT — now ONE clean migration (fresh start, §21.7)
1. New tables per the proven draft · `EXPORTED_TABLES` += composition, composition_file (test goes green).
2. **The old note-rows deleted** (`kind='note'`): counted and REPORTED at the checkpoint · their tags/placements/references cascade per the existing destroy physics (K3's expendable ruling extended by §21.7) · then `kind` + its CHECK dropped — the bit table returns to pure material.
3. The code sweep (`verification/kind-seam-inventory.txt` the checklist; `/note/[id]` → `/composition/[id]`; `/notes` redirects; search's kind filter becomes all·bits·compositions).
4. **Prove:** the draft attack suite re-run against the REAL migration file · zero orphans · export completeness · the S-C scenes seeded FRESH in the new home and replayed.
5. **⚑ CHECKPOINT — the owner's #4 nod:** backup shown → the delete-count shown ("N test notes will be removed — restorable from the backup") → throwaway run's raw output → her explicit go → cloud → deploy.
**Accept:** the tech-spec §5 provables minus migration-counts (moot) · the owner opens the app and bits/boards are exactly as they were; the compositions list starts empty and ready.

## Stage ②a · THE EDITOR — SURFACING + THE PAGE (low-risk half)
**Registry-verified (2026-09-03, npm reads, no installs): every needed piece EXISTS as an official MIT `@tiptap/*` 3.x extension** — task-list/item (checklist) · table · **details (the toggle)** · **drag-handle** · **unique-id (the heading `hid`s — the vendor's own tool, not custom code)** · static-renderer (already approved). **The ONE custom build in the whole editor: columns** (no official or findable community package — §13.9 is its spec).
This half: surface the installed blocks (headings ×2 · lists · quote · divider · code) · the `/` menu · checklist + table extensions · text alignment · never-empty · title/subtitle + exit-mint + display-label fallback (§32.4/G9) · word count (owner's words only, G11) · the lock (`locked_at`) · **the fall-throughs the owner's challenge caught, homed here:** the compositions LIST gains the due-date sort/filter (§31.2) · **composition saves get the I-D1 liveness guard** (FOR SHARE target-alive check, the house write law — was unlisted) · **the page records its `opening`** (the recent trail — column existed, the write was unhomed).
**Accept:** the eight musts minus drag · list sort/filter works · a save against a just-trashed composition prompts instead of landing silently.

## Stage ②b · THE EDITOR — STRUCTURAL BLOCKS (the hard half, honestly labeled)
The two genuinely hard pieces, isolated so their risk can't hide: **drag-reorder with a heading carrying its span** (§20.5 — real ProseMirror structural surgery; drag-handle extension gives the gesture, the span logic is ours; plan: its own mini-spec + tests before code, antagonist-checked) · **the columns block** (custom, §13.9) · the toggle via `extension-details` bent to §13.7 (label-only folded · searchable · auto-unfold on search-hit — the search-hit unfold is ours) · undo ~15 covering pulled-in acts · unfold-before-delete (§20.5b).
**Accept:** §13.3's drag must + heading-span proven by tests that try to break the span math · fold/search/unfold end-to-end · columns per §13.9 including phone stacking.
**What:** the composition page's editor gains the verified v1 set — on the shared editor, so board text-cards inherit capabilities but expose per §13.4.
Surface what's installed (headings ×2 · lists · quote · divider · code — §13.1 "surfacing, not building") · the `/` menu (§13.3.3: typed `/` only) · checklist + table via same-family extensions (§33.3) · **toggle per §13.7** (select-blocks→collapse · label-only folded · searchable · auto-unfold on search-hit; the heading-also-folds ⚪ stays fenced, §32.5) · **columns per §13.9** (builder-default; the owner's refinement pass owns the feel) · drag-reorder with handles (§13.3.5; heading carries its span §20.5; unfold-before-delete §20.5b) · text alignment (§13.2.1) · undo ~15 covering pulled-in acts (§20.4) · never-empty (§13.3.8) · **the node registry as specified (§32.3)** — `hid` on headings from birth · word count = owner's typed words (§32.4/G11) · title/subtitle fields + exit-mint with the display-label fallback (§7, §32.4/G9) · the read/write lock, remembered (`locked_at`, §31.3) · save = the existing debounce/flush/status machinery (§6), the floater/panel indicator gap (§6.6) closed when those frames land in stage ⑤.
**Accept:** §13.3's eight musts demonstrated · fold/search/unfold proven · a heading drag carries its span · lock survives a reload · `pnpm build` green.

## Stage ③ · BRING-IN (the promise: everything you've collected, available)
*(Depends on ②a only — can interleave with ②b if the builder wants; the node registry §32.3 is fixed before either persists anything.)*
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
