# The composition storage session — decisions, surveys, evidence
*(Run 2026-09-03 per `composition-storage-session-plan.md` (Gate-A-folded version). Charter held: nothing conceptual decided here — five items found needing the owner are in §Q, not resolved. Every decision below is technical-with-tradeoffs (translation rule 2): Claude decides, logs, owner veto open.)*

## 0 · The requirements table (extraction pass, both directions)
Each requirement cites its ruling; the draft DDL cites back. **Traced against `ruling-register.md` + quoted rulings; nothing rests on an unmarked ✅.**

| req | source |
|---|---|
| own table, peer of board (option C over B) | §21.1 owner-quoted + K8 + §5c seed *(see survey S1 — C confirmed here, B surveyed)* |
| carries: title · subtitle · writing · folder · star · archive · trash · visibility · search — never `source` | §21.2 + §3.4b + reg E-series |
| job facts: word target · due date · who-for (all optional) | §8, reg E3 |
| born private; visibility model deferred | §12.2b, reg J6 |
| states live/archived/trashed; archived read-only; restore-whole; destroy cascades both directions | §11, reg G1–G5, I-T4 |
| archived ⛔ starred · trashed ⛔ archived | house CHECKs 20260902000002 · 20260903000003 |
| title nullable; minted at exit (app) | §7, reg E2 |
| born-on-first-content; evaporate = never-written | §4.1.3, §4.2.7, reg D1/D5 |
| ties: from = composition ONLY (flatness); to = bit·composition (+board pending Q-A; +source ruled 2026-09-03); exactly one; one row per ordered pair; not-self; destroy cascades; no updated_at | §3.4, §21.3–4, §30, I-Ref1–8 |
| the tie's stored label = a shadow (search/export); display live | §9.4.2, I-Ref8 |
| presence per OCCURRENCE in the doc, never the tie | §23.1 (corrected) |
| same target twice = two chips one row | §9.4.7, I-Ref2 |
| placements: composition on many boards, independent; unique per (board,target); durable (I-L2); revive on return (I-L1); never loose | §10.2, reg H4, I-L1/2 |
| board symmetry: journey remembered, one record two views | §30b owner-quoted |
| hide-compositions toggle: per-board, stored | §10.3.4 |
| copy law: what it IS, never where it SITS; per-door "here"; own copy of the file | §28b + **I-G6 (D-144, owner-ruled — independently, other window; the two agree)** |
| search: index moves with compositions or they vanish; title+subtitle+body; archived excluded by default | §12.1.5, reg J2, G6 |
| export lockstep same migration | §12.5, I-G1 |
| existing notes flip private; old chips + note-sources cleaned; bit-authored references counted then grandfathered | reg K2/K3 + tech-spec §1.3 |
| pasted-image files: composition-owned; reconcile-on-save; deferred sweep; destroy deletes; promotion moves the file | §24.3, §27.1.3 |
| heading ids: stable, survive rename+move | §20.5c |
| toggles' folded content searchable | §13.7.4 |
| `bit.kind` retired at migration; bit returns to pure material | tech-spec §1.1/5c-5 |

## S1 · Own table (C) vs shared surface table (B) — the §5c fork, closed
**B** (one `surface` table boards and compositions both move into): honest, but weighed and declined — the two share *organization* (tags · folder · star · states) yet differ in **everything structural**: a board has geometry columns (frame_x/y/w/h since 2026-09-03, hide-toggle) and NO body; a composition has a document and job facts and NO geometry. A shared table = a pile of mutually-null columns policed by CHECKs (`form='canvas' ⇒ doc is null …`) — the bit table's substance-CHECK pattern at twice the width, plus **boards must migrate too** (touching the app's most live surface for zero behavior change). **C** (own table): the cost §5c named — per-kind code paths — is **already the house pattern** (boards and bits have per-kind db modules today; the "one door" is per-kind functions of identical shape). The owner's stated lean, twice, is C. **Chosen: C.**

## S2 · The writing's format — **JSON (`doc jsonb`)**, with the evidence de-biased per Gate A
**Ran, not asserted** — ⚠ *corrected 2026-09-03: the adversarial review (S12) caught this line claiming "committed" while the artifacts lived only in the session scratchpad, and the first script could not reproduce the output. Fixed: `verification/format-evidence.mjs` (re-run, reproduces) · `format-evidence.out` · `format-sql-evidence.sql/.out` are now genuinely committed.*
| test | result |
|---|---|
| J1 chip attrs through JSON | ✅ round-trip exact |
| J2 JSON doc holding a RETIRED node type | ⚠ **HARD THROW — "Unknown node type: callout"** (the antagonist's mirror-failure is REAL) |
| J3 unknown attribute on a known node | ⚠ **silently dropped — JSON is not attr-safe either** |
| J4 unknown mark | throws |
| HTML→model in Node | ⚠ **impossible without a browser DOM** — observed: tiptap throws "no window object available"; no DOM lib installed (deps owner-gated) |
| E1 size | **JSONB costs 3–5.1× HTML** for the same content |
| E2 extraction over REAL shapes (bitRef label attr · folded toggle) | ✅ finds chip labels + folded words; zero false positives |
| E3 generated tsvector column from jsonb | ✅ works |
| E4 tsvector ceiling | **real**: errors at ~1MB of distinct-lexeme text ("string is too long for tsvector") — repetitive prose is safe far beyond that; the guard is still mandatory |
| E5 `left(500k)` guard | ✅ holds |

**The honest comparison, both failure modes on the table:** on schema regression HTML **silently vanishes content** (tiptap's own docs, quoted in `research-tiptap-persistence.md`) and the loss is **irreversible on next save**; JSON **refuses loudly** (J2) — the stored document still holds everything, and a guarded loader turns the throw into "this piece needs attention" instead of a blank. Loud-and-recoverable beats silent-and-permanent. Add: the official tiptap recommendation (sourced) · exact chip/id extraction from structure (E2) vs regex over markup · server-side processing without a browser (observed today, the HTML side literally could not run) · search parity proven (E2/E3).
**Costs accepted, named:** 3–5× bytes (one owner; a 100k-word piece ≈ hundreds of KB — immaterial) · the migration converts HTML→JSON **in a browser context** (a migration page/script; Part IV) · **two build obligations**: the guarded loader (J2) and **the attr-drop caveat (J3): removing an attribute's extension silently drops stored ids on next save — extension removal is a migration-class act, recorded as a standing rule** · the `left(500000)` cap in the extractor (E4/E5).
**Rejected:** HTML (silent loss; regex extraction; DOM-bound) · markdown (cannot express chips/ids without private syntax — no longer portable, the one virtue it had) · blocks-as-rows (§21.5 — both its justifications are declined features) · store-both (two truths; I-G2).

## S3 · Finding composition-owned files — **a registry table** (`composition_file`)
Reconciled on save exactly like reference rows (the proven mechanism); destroy = delete listed files; export reads it (I-G1 needs the file list anyway). **Rejected:** walking every doc at sweep time (works, but re-derives at every sweep what save-time already knows; and export still needs a list) · a paths array column (a second truth beside the doc). **Consequence adopted from I-G6:** a pasted-image block copied into ANOTHER composition **copies the file** — each composition owns its files 1:1; "never the same object, or trashing either destroys both" (the ruled duplicate-file law, applied here).

## S4 · The tie — end-state `reference`
from_composition_id **NOT NULL → composition** — ⭐ **flatness becomes PHYSICS** (I-Ref3 upgrades from app-guard to FK: a bit *cannot* author a tie, structurally). Four to-columns (bit · board¹ · composition · source), `num_nonnulls = 1`, partial unique per kind (the `opening` pattern — NULLs handled by partial indexes, proven in-house), not-self on the composition pair, cascade on every to-column (destroy → chip degrades, ruled), **no updated_at** (never edited — house law: born or gone). ¹ *board gated on Q-A below; drafted in, one-line removal if the owner reverses.* **mergeSources gains one step:** repoint `to_source_id` before deleting the absorbed source (else the cascade silently eats the chip's tie — found by reading `sources.ts:220`). Alter-vs-rebuild of today's table = Part IV mechanics.

## S5 · Pointer tables + surfaces
`tag_application` · `placement` · `opening`: + `target/composition_id`, exactly-one-of-three, partial unique, cascade, index. `board_cards`: third leg (title · subtitle · a computed preview). `the_pull`: third arm. `trash_listing` / `archive_listing`: third arms. **`composition_travel`: a sibling view of `bit_travel`** (same query, composition column) — the ruled journey memory with zero new storage. `home` and `the_inbox` untouched (boards-only · bits-only; "never loose" is structural). Search: the query unions `bit` + `composition` (app), each on its own generated index.

## S6 · RLS — owner-all per-row (D-107 pattern) on both new tables; guest policies **drafted as comments** (gradient-ready, the AND-composition mirroring `bit_guest_read`); `default 'private'` asserted by proof.

## S7 · `bit.kind`'s end state — the deliverable
At migration: `kind` column dropped; `bit_kind_allowed` CHECK dropped; bit returns to pure material. **The seam inventory is committed as `verification/kind-seam-inventory.txt`** (the re-run grep): the app files + `listNotes()` + `/note/[id]` + `/notes` routes the sweep must cover.

## S8 · The trailing ruled facts, homed
Hover-layer table: **deferred to its own migration at build step ⑥** — shape recorded as a commented appendix in the draft (nothing in the core depends on it). `board.hide_compositions boolean not null default false` — in the draft (ruled, stored, per-board). Job facts — in the composition table. Export — `EXPORTED_TABLES` += composition · composition_file **at enactment** (⚠ the draft deliberately lives in `verification/`, NOT `supabase/migrations/` — the set-equality test would go red the moment the file landed there; noted per Gate-A F3). Source-merge — S4. From-side law — S4 (physics). Travel — S5 (ruled half); the unruled analog question dissolved: no new table exists to ask about.

## Q · RETURNED TO THE OWNER — found, not resolved *(the demote-and-return rule, F1)*
1. **⚠ BOARDS AS TIE-TARGETS — two of your rulings collide.** The direction law (§3.4: *"a composition never contains or references a board"*) + register F3/C2 (*"boards never appear in the picker"*, station-era, reasoned) **vs** §30 (2026-09-03: *"gather a whole board and reference it — that should be OK"*). Newest-wins would say §30, but the older ruling is load-bearing (it also kills §12.1b.6's "boards receive no references"). **Drafted WITH `to_board_id` + a loud gate-comment; your word decides whether it ships.**
2. **Text-wrap** — ruled IN (§13.2.2 "wrap yes, float no") but on 2026-09-03 you leaned dropping it ("we don't need it to be there to have a really good product"), never crisply superseded. Storage-irrelevant; needs your word before the editor build.
3. **The lock column** — §20.3 left remembered-vs-per-visit ⚪, so the column is NOT in the draft (adding later = one line). Confirm or reverse.
4. **Born-forms** — your §9.3 ruling (text→chip · image/drawing→block) contradicts Claude's later §29c door-grammar lean. **Your ruling wins; §29c is amended to defer to §9.3.** No question — an fyi of a self-correction.
5. **Job-facts surfacing** (§8 ⚪: does the due date appear outside the piece?) — columns are in regardless; the surfacing is yours.

## S9 · Concurrent saves — decided and recorded (the F4 demand)
**No version/rev column.** Edit-vs-edit is **already a ruled invariant — I-D5: "last-arrival, whole-record, and named"** (D-075, LOCKED); the composition inherits it deliberately rather than growing a second conflict model. The §23.2 same-doc-open-twice hole is closed at the APP layer per §5.1's standing lean (the second open focuses the existing frame; the floater build enforces one live editor). Schema stays silent on purpose — a rev column would contradict I-D5's explicit "no version column by explicit ruling" (init.sql, §2d).

## S10 · The proof record (Gate C — RUN 2026-09-04, all green)
`verification/composition-draft-proofs.out` (runner: `run-composition-draft-native.sh`; every real migration + the draft on throwaway PG17): **12/12 true assertions · 8/8 refusals fired with the expected constraint names · 0 false.** Highlights: born private+live+indexed · chip-label AND folded-toggle text findable, zero node-type pollution · both state-crossfire CHECKs · flatness-as-FK refused a bit author · exactly-one ×2 · not-self · dedup per kind with mutual-ties standing · **the source-merge repoint proven both ways** (tie survives WITH the step; silently eaten WITHOUT — the exact bug S4 prevents) · I-L1 refusal + arrived_at surviving un-place→revive · board_cards third leg with vanish-on-trash/return-on-restore · destroy cascades both directions · composition_travel showing the journey · file rows swept at destroy · RLS: another owner sees nothing, anon sees nothing even when marked public.

## S11 · Gate B — independent trace review (RUN 2026-09-03): FAIL → all findings folded → shape sound
Two full trace tables, **zero MISSING rulings, zero structurally INVENTED elements**. Four blockers, all folded: **F1 (the real catch)** — `opening_one_per_comp` was a partial unique index; the house's own `opening.sql` header documents that PostgREST cannot infer partial indexes for upserts (42P10 forever) → now a **plain unique constraint**, with a new proof assertion (A14) confirming it · F2 — the `to_board_id` gate verified as genuine, not smuggled (stays gated on the owner, §Q1) · F3 — an invented citation ("I-C5") → corrected to I-K1/D-121/B4 · F4 — the `composition_file` comment contradicted §24.3's never-delete-eagerly → corrected. Plus six hygiene items folded: `doc`→**`body`** (the lexicon's word, rule 7) · `due_at`→**`due_on`** (`_at` = moment-stamps only) · I-P2 cited on the view's visibility coalesce · the partial-unique precedent comment corrected (init's pattern, NOT opening's) · D-088 cited for subtitle-in-search · the enactment lexicon/invariants debt listed (incl. I-Ref3's ruled rewrite: from = composition, now an FK).
**Mid-session ground shift, absorbed:** the other window landed `20260903000005` + `20260903000006` (drop `display_size`) DURING the session — the draft's `board_cards` synced; Gate-A F6's "every file at session start" wording proved out within hours.

## S12 · The HTML adversary (RUN 2026-09-03): decision STANDS, WEAKENED — five required changes, all folded
**The strongest points against, on the record:**
1. **`enableContentCheck` / `contentError` — a MATERIAL OMISSION from the research:** tiptap can make HTML's silent drop loud (opt-in). Why it doesn't flip the ruling, in tiptap's own words: content checking is *"100% accurate for JSON content types"* while for HTML *"mark-related issues might be missed in some situations"* — equal build cost, weaker guarantee. Loud-by-guarantee beats loud-by-best-effort. Added to the research file.
2. **The size cost was a fixture artifact:** E1's 3–5.1× came from 57/201-byte fixtures; at realistic length the adversary measured **~1.07× raw · ~1.7–2.3× stored**. E1 annotated; the accepted cost shrinks to noise — in either direction.
3. **The regex's fragility is theoretical to date** — zero incidents since Aug 2026 (git + PROGRESS swept). The adversary then FOUND a latent bug class itself: prose containing literal `data-ref="…"` text would match `extractRefIds` and die as an uncaught 22P02 — never fired, and **exactly the bug family structural extraction makes unwritable**.
4. **Permanent dual-format cost, previously unnamed, now accepted:** text BITS keep HTML bodies forever; compositions go jsonb — two extractors, two render paths, both in the proof suite. (S5's union already assumed it; the COST is now stated.)
5. **Export/lock-in — the deepest argument:** exported PM-JSON is readable by nothing but PM tooling; tiptap's own docs note HTML *"can be easily rendered in other places… probably easier to switch the editor at some point."* **Folded as an enactment requirement:** the export emits **both** the jsonb truth AND a rendered-HTML copy per composition; the DOM-free candidate is `@tiptap/static-renderer` — **a NEW DEP, owner-gated → §Q6.**
6. **The migration is one big pass through the silent-drop parser** → **folded as a Part IV requirement:** per-document round-trip fidelity diff + `enableContentCheck` during conversion, with a flagged-pieces report. The switch's first act must not be the event it exists to prevent.
**Citation audit:** the persistence quote verbatim-in-context ✓ · the schema-strictness quotes ✓ · #6209's community-caveat fair ✓ · **one FALSE claim of the author's caught** ("committed" — fixed, see S2's correction) · the omitted pro-HTML lines from `output-json-html` now quoted in the research file.

## Q6 · (added) `@tiptap/static-renderer` — a new dependency for portable exports
Needed so "I own all of it" keeps meaning *usable anywhere* (S12.5). New deps are owner-gated: **approve, name an alternative, or accept PM-JSON-only exports.**

## Q-RESOLUTIONS (owner, 2026-09-03, same day)
Q1 **RESOLVED — boards gatherable, doorway-only** (owner + Claude's concurring reasoning; §3.4 amended, register C2/F3 superseded, the DDL gate lifted). Q5 **RESOLVED — due date = piece metadata + list sort/filter** (no home surfacing, no reminders). Q3 rec delivered (lock remembered per piece — the felt "finished") — awaiting the word. Q2 reframed: **wrap × columns is ONE decision** (her columns sketch = Notion's wrap-substitute; rec: columns in, wrap out — reverses two standing rulings, needs her explicit word). Q6 explained (official renderer vs hand-kept converter; rec (a)) — awaiting approve/decline.

## Q-RESOLUTION addendum (2026-09-03, late): THE FRESH START
The owner dissolved the migration entirely: existing notes are test data, deleted at enactment (§21.7 superseded in place; count shown, backup first, her go). **Consequences:** S12.6's per-document fidelity proof — MOOT · the browser-context conversion act — MOOT (the adversary's argument 9 dies with it) · K2's flip-private — MOOT (nothing carried) · stage ① is one clean SQL migration. The S12.5 export-renderer requirement STANDS (new pieces still export portable HTML).

## The enactment adversary (2026-09-04): verdict RETHINK → the TWO-STEP SPLIT
A codebase-grounded adversary attacked the one-step enactment procedure: **15 findings, none touching the proven table design** — they hit sequencing (the kind-drop blocked by `the_ledger`/`the_inbox`, a trap the repo had already documented), false interim claims ("writing and gather keep working" — untrue in one step), undisclosed data loss (the owner's bits' `[[` ties, uncounted), a back-out resting on unproven atomicity and a five-weeks-stale never-restored backup, a swept room that does not exist (the list is HOME), and unbudgeted app rework (search, export bytes). **Resolution: the split** — ①a add-only (everything keeps working, by construction) → the interim builds the new surface → ①b remove, gated on the owner having moved, with the counts, her tie ruling, a fresh rehearsed-restore backup, and the documented view dance. Full detail: `composition-enactment-procedure.md` (rewritten); plan synced. The schema draft itself needed **zero changes** from all 15 findings.
