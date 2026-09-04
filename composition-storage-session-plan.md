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
1. **Format of the writing** — HTML (today) · ProseMirror JSON · markdown · blocks-as-rows · store-both. Weighed on silent-loss, the search proof, block/heading ids, migration cost, the editor's API.
2. **Finding composition-owned files** — registry table reconciled on save · walk-the-docs at sweep · a paths column.
3. **The composition table DDL** — §21.2's columns (+ subtitle · lock · state), generated search column + its extraction function.
4. **The tie table** — extend `reference` vs fresh table; the four-target exactly-one CHECK (extensible); the dedup constraint's exact shape (`opening` precedent); NO presence on it (§23.1 correction — presence lives in the doc).
5. **The pointer tables + views** — second-target columns; `board_cards`'s third leg; board-symmetry: generalize the existing arrive/leave/revive machinery vs a parallel table.
6. **RLS** — owner pattern on everything new; the future public door's shape held open.
7. **`bit.kind`'s end state** — named, not migrated.

## C · The steps
1. Extraction pass over §A → the requirements table (requirement ⇄ ruling, both directions).
2. The surveys + decisions (§B), reasoning written including rejections.
3. Draft the real migration file — applied NOWHERE real.
4. **Gate B — independent DDL review:** a fresh-context agent, given only the spec + the draft, hunts drift/omissions/inventions.
5. **The proof:** throwaway local Postgres (the native-runner pattern) → all 19 migrations + the draft → the attack suite: S-C scenes as data · CHECKs attacked (self-gather, double-target, dedup) · search over real tiptap fixtures · cascades (destroy → ties gone, files swept) · source-merge-carries-ties · RLS probes. Raw output → `verification/`.
6. Record: the decision doc (this file grows into it) · `invariants.md` additions · `lexicon.md` code names · the plain-language summary to the owner, with anything conceptual that surfaced returned to her un-decided.

## D · The gates
- **Gate A (before anything runs): the ANTAGONIST** — attacks THIS plan: missing files, missing decisions, self-deception risks, anything treated as ruled that isn't. Findings folded; material changes shown to the owner.
- **Gate B:** the DDL reviewer (step C4).
- **Gate C:** the proof suite itself — adversarial by construction.
- **The owner's go** happens after Gate A's findings are folded, before step C1 runs.
