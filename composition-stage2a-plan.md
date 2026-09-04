# Stage ②a — the detailed breakdown *(the runbook applied; DRAFT until its adversary runs)*
> **Read first:** `docs/composition-spec.md` §4 · §6–§8 · §13 · §20.1–20.3 · §31–§32 · `composition-build-plan.md` (②a + the five floor rules + the cross-window contract) · `docs/how-each-piece-gets-built.md`.
> **Scope:** the composition page + list, the surfaced editor, the low-risk half. ⛔ NOT here: drag/heading-spans/columns/toggles (②b) · pulling things in (③) · the board postures (⑤).
> **Precondition:** stage ①a applied (the tables exist). Code lane: new files + the two agreed touches (`TextBit` variant/showToolbar props · the write-flip).

## 1 · "Done," in the owner's words
> I open the app and my pieces live in their own room. I hit ✎ write and get a real writing page: title, subtitle, my words. I can make headings, lists, checklists, a table; align text; see my word count. If I leave without a title, the app names it by date. I can set a word target, a due date, who it's for — and sort my list by date. I can lock a piece so reading can't smudge it. Everything saves as I type, tells me so, and never loses a word. **Nothing about my boards or bits feels any different.**

## 2 · The pieces, each with its tests *(pure-function logic tested today, no browser; gestures = owner-feel per the testing ruling)*
| piece | build | machine tests | owner feels |
|---|---|---|---|
| **`lib/db/compositions.ts`** — the one door | create(body-first birth §4.1.3) · get · updateBody/title/subtitle/jobFacts · lock/unlock · list(sort by due_on/created) · trash/restore/archive + the **I-D1 liveness guard** (FOR SHARE, prompt-on-tombstone) · recordOpening branch | the birth rule (title alone ⇒ no row) · liveness: write-after-trash prompts, never lands silently · list sort orders · every fn refuses a foreign owner (RLS probe) | — |
| **`/composition/[id]`** — the page | title · subtitle · body (TextBit `variant='page'`, **JSON out** + the format test) · footer (tags · folder · dates · job facts) · save status (§6) · `RecordOpening` | **the mount-format test** (page mount emits JSON; card mounts still HTML) · save-flush on leave/hide (the save-guard contract, existing pattern) | typing feels instant; "saving…/saved" honest |
| **the exit-mint** | on leave-with-empty-title → date-time title (§7; format = X1's global pick or its interim default, flagged) | mint fires on exit only — never on autosave (unit on the exit hook) · minted title is ordinary (editable after) | the name feels okay |
| **display-label fallback** (§32.4/G9) | label = title → opening words → date; used by list + (later) chips | pure fn: the three fallbacks, empty-body edge | list never shows a blank row |
| **the surfaced blocks** | expose StarterKit's installed set + task-list/table extensions (§33.3) via the **`/` menu** (the `[[` suggestion pattern, §13.3.3: typed `/` only) | `/` opens only on typed `/` (the re-fire trap test: paste/undo don't trigger) · the schema knows the new nodes (registry test, §32.3) | inserting feels Notion-familiar |
| **text alignment** (§13.2.1) | per-block attr, occurrence-data | serialize/round-trip of the attr | — |
| **word count** (§32.4/G11) | owner's typed words only — pure fn over the doc | counts exclude chip labels/blocks; folded text counts | the number matches her sense |
| **the lock** (§31.3) | `locked_at` toggle; editor read-only when set; remembered | locked ⇒ update refused at the db door (not just UI) · survives reload | "finished" feels real |
| **the list room** (home's composition arm) | title+subtitle rows · due-date **sort/filter** (§31.2) · empty state ("nothing written yet" + the door) | sort/filter orders (pure) · empty/loading/error present (floor rule) | the room feels like hers |
| **the write-flip** (②a ruling, veto open) | ✎ write births a composition, routes to the new page | the flip test: no new `kind='note'` rows post-②a | one writing surface, not two |
| **trash/archive rooms learn the third kind** (antagonist F5) | label · restore · destroy · unarchive for `thing='composition'` | restore hits the composition table, never the bit door (the lying-error test) | trash behaves |

## 3 · What it could break — the trace (safety gate 2)
- **Card mounts of TextBit** — the contract protects them (default `'card'`, own commit); test: existing board-card save path emits byte-identical HTML before/after the prop lands.
- **Home** — gains the composition arm *reading the new table*; the old note rows keep rendering via the existing path until ①b (two sources, one list, labeled internally; removed at ①b).
- **Search** — the second paged query + merge (the F12 rework) lands HERE with its own tests (a body phrase in a composition is findable; bit search unchanged).
- **Invariants touched:** I-D1 (the guard) · I-G1 (no new stored kind without export — compositions already in the ①a lockstep) · the §22 guardrails (nothing floats; typing mints nothing).
- **Blank-cell check:** create ✓ edit ✓ trash/restore/archive ✓ destroy (①b's lane) · un-place n/a (③).

## 4 · Order of build *(each its own green commit)*
db module + its tests → the variant/showToolbar commit (the contract) → the page skeleton + mount-format test → save path + liveness → exit-mint + label fn → `/` menu + blocks → alignment · word count · lock → the list room + sort → write-flip → trash/archive third kind → the floor sweep (three states · no-hover-only · keyboard/phone · a11y announcements).

## 5 · Accept *(+ the five floor rules)*
Every machine test above green in `pnpm test` · the §1 paragraph performed by the owner on the real app, as written, no step failing · no board/bit behavior changed (the before/after HTML test + her eyes).

## Open, flagged honestly
The date format (X1) — interim default used, named at build · the `/composition` list-room ROUTE (naming session; interim: home's arm only, no new route needed) · ✎ flip = lean, her veto open.
