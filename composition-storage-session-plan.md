# The composition storage session — the plan (specific), pre-approved procedure
*(2026-09-03. The owner approved the shape and asked for: full file specificity + an antagonist gate. Charter: the session decides nothing conceptual · citations both ways · proofs not prose · the cloud is never touched.)*

## A · The inputs — every file, its read depth, and what gets pulled out

### Read EVERY LINE (the ruled surface + the authorities)
| file | what gets extracted |
|---|---|
| `docs/composition-spec.md` (~800 lines) | every ✅ ruling with a storage consequence → a row in the requirements table (with its § cited); every ⚪ checked against "does this block schema?"; every 🔵 lean that touches storage, listed as lean not law |
| `model.md` | the three-kinds frame the schema must not contradict |
| `invariants.md` | the standing invariants the new tables must keep; the slots where new ones get added |
| `lexicon.md` | the words (table/column names come from here); the retired-words list so none leak into DDL |
| `translation-guidelines-conceptual-to-technical.md` | the translation doctrine — re-read in full, not from memory |
| all 19 files in `supabase/migrations/` | the house patterns: CHECK style · generated columns · the one-trigger rule · `security_invoker` views · owner-RLS shape · the exactly-one-target precedents (`placement`, `opening`) · how `placement.left_at`/revive (I-L1) and `bit_travel` actually work — the machinery board-symmetry extends |
| `research-tiptap-persistence.md` + `verification/json-search-proof.sql` + `.out` | the format evidence and the proof to extend |
| `src/lib/db/references.ts` | the reconcile-on-save mechanism — the pattern the file-registry decision copies or rejects |
| `src/lib/db/search.ts` | the search legs that must grow a composition arm |
| `src/app/board/[id]/bitref.ts` | what the chip node stores — what the document format must carry |

### Read TARGETED SECTIONS ONLY (named here, so nothing hides)
| file | the sections, and why only them |
|---|---|
| `SPEC.md` | §2.1 (invariant→enforcement map) + the privacy/RLS section — the parts new tables must slot into |
| `src/lib/db/bits.ts` | `duplicateBit` + the create paths — the copy law and today's `kind` usage |
| `src/lib/media` pipeline | path/thumb conventions the composition-owned files reuse |
| `parked.md` | A15/A15b + storage-adjacent doors the schema must leave open |
| `PROGRESS.md` | D-142/D-143 receipts only |
| `model-scenarios.md` | placement/travel fixtures only (bits-era; the composition fixtures are the S-C scenes in the spec) |

### Deliberately NOT loaded
`research-notion-data-model.md` (reference only — decides nothing, by its own banner) · the ~30 `kind`-checking app files (migration is deferred; instead the grep inventory is re-run once and committed as the migration-scope record).

## B · The decisions, each with a written survey (options incl. rejected, weighed, why the winner won)
1. **Format of the writing** — HTML (today) · ProseMirror JSON · markdown · blocks-as-rows · store-both. ⚠ *(F2 — the antagonist caught the evidence ONE-SIDED: HTML's failure (silent drop) documented; JSON's mirror failure — a doc holding a node type the editor no longer registers can make the document THROW, unopenable — never mentioned; neither ever demonstrated.)* **Honest only with five added tests (→ C5):** (i) round-trip `generateHTML(generateJSON(body))` diffed over the owner's REAL note bodies — migration cost measured, not assumed · (ii) schema-evolution BOTH ways through the actual editor: unknown tag in HTML vs unregistered node type in JSON, failures OBSERVED · (iii) `pg_column_size` both ways on realistic long documents · (iv) extraction over the app's REAL node inventory (`bitRef`, not generic mention · heading ids · per-occurrence presence attrs · toggles) · (v) a **folded-section fixture** (collapsed content stays searchable). **Plus a dedicated adversarial review of the format survey** charged: *argue HTML's best case; check every citation* — otherwise the one owner-delegated decision ships un-reviewed.
2. **Finding composition-owned files** — registry table reconciled on save · walk-the-docs at sweep · a paths column.
3. **The composition table DDL** — §21.2's columns (+ subtitle · lock · state), generated search column + its extraction function.
4. **The tie table** — extend `reference` vs fresh table; the four-target exactly-one CHECK (extensible); the dedup constraint's exact shape (`opening` precedent); NO presence on it (§23.1 correction — presence lives in the doc).
5. **The pointer tables + views** — second-target columns; `board_cards`'s third leg; board-symmetry: generalize the existing arrive/leave/revive machinery vs a parallel table.
6. **RLS** — owner pattern on everything new; the future public door's shape held open.
7. **`bit.kind`'s end state** — deferred, with a REAL deliverable *(F8)*: the re-run grep inventory committed as a file + a written end-state naming which constraints/columns change at migration time and which app seams (~30 files, `listNotes()`, the `/note` routes) the sweep must cover.
8. **The trailing ruled facts** *(F3 — each homed, none silently dropped)*: the **hover-layer table** (fully ruled §26.5 — in this migration or explicitly deferred; the hidden-vs-derived trashed-pin mechanic designed, not improvised) · the **hide-compositions toggle persists** (§10.3 — a per-board stored fact) · the **job facts** (§8: word-count target · due date · who-for — ⚠ absent from §21.2's carries-list, the subtitle-class near-miss repeated; include-or-defer explicitly; the does-the-due-date-surface ⚪ returns to the owner) · **export lockstep** (I-G1: the EXPORTED_TABLES rows land in the same migration; the set-equality test runs in C5) · **source-merge carries ties** (decision 4 owns it; `mergeSources` read first) · **the FROM-side law** (§24.4: only compositions author ties; legacy `from_bit_id` rows named for the deferred migration) · **travel split in two** — the RULED half (§30b: placement journey + revive for compositions) vs the UNRULED half (a composition_travel analog — ⚪ the owner's, never defaulted).

## C · The steps
1. Extraction pass over §A → the requirements table (requirement ⇄ ruling, both directions).
2. The surveys + decisions (§B), reasoning written including rejections.
3. Draft the real migration file — applied NOWHERE real.
4. **Gate B — independent DDL review, PINNED** *(F7)*: inputs = spec §§21–30e + `ruling-register.md` + the migrations directory + `invariants.md` + `lexicon.md` — **never the author's surveys**. Output = a trace table: every storage-consequential ✅ → the DDL element satisfying it or **MISSING**; every DDL element → its ruling or **INVENTED**. Pass = zero unresolved rows. **Every finding reaches the owner with a written disposition — not only "material" ones.**
5. **The proof:** throwaway local Postgres **pinned to major 17** (`supabase/config.toml`) → **every migration in the directory** + the draft → each a NAMED attack with a committed `.out` *(F4 additions •)*: S-C scenes as data · CHECKs attacked (self-gather · double-target · **dedup ×4 under NULLs**: duplicate-per-kind refused · different-kind pairs allowed · mutual A↔B allowed · §30d loops allowed) · search over the REAL node inventory incl. the folded fixture · **destroy traced per target kind** (bit · board · composition both directions · source destroyed AND merged) · • **`default 'private'` asserted + guest-door probes** (the trap: bits default public; a copied column ships the wrong default) · • **trash/archive crossfire + restore-returns-whole** (placements survive; the card back in place) · • **revive (I-L1) for a composition placement** (proven for bits in run-1d; never for the second target column) · • **the tsvector ceiling** — one long-document fixture (a generated to_tsvector column ERRORS the whole save past ~1MB; decides whether extraction needs a `left(…,N)` guard) · • **concurrent saves: DECIDED AND RECORDED** — a rev/updated_at guard or last-write-wins accepted in writing (silence = the floater ships a data-loss surface, §23.2 Hole 1) · the export-lockstep test green. Raw output → `verification/`.
6. Record: the decision doc (this file grows into it) · `invariants.md` additions · `lexicon.md` code names · the plain-language summary to the owner, with anything conceptual that surfaced returned to her un-decided.

## D · The gates
- **Gate A (before anything runs): the ANTAGONIST** — attacks THIS plan: missing files, missing decisions, self-deception risks, anything treated as ruled that isn't. Findings folded; material changes shown to the owner.
- **Gate B:** the DDL reviewer (step C4).
- **Gate C:** the proof suite itself — adversarial by construction.
- **The owner's go** happens after Gate A's findings are folded, before step C1 runs.

## E · Gate A — RUN 2026-09-03 · verdict RUN AFTER FIXES · all eight findings folded above
F1 building from a DRAFT-bannered spec while skipping `ruling-register.md` (the instrument built to catch invented rulings) → the register is now read-every-line; C1 law: any ✅ tracing to neither register nor quoted ruling is demoted and returned to the owner. F2 one-sided format evidence, delegated decision un-reviewed → the five tests + the HTML's-best-case review. F3 seven orphaned rulings → decision 8. F4 seven missing attacks → C5. F5 missing modules + one nonexistent path → inventory fixed. F6 "19" migrations was already stale (22; three landed today from the other window) → count-free wording + PG17 pinned. F7 Gate B loose + a live stale line in INDEX (presence-on-the-tie, superseded) → pinned; INDEX corrected same pass. F8 decision 7 could succeed by definition → real deliverable named.
