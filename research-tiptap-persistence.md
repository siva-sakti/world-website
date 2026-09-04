# Storing a tiptap document — JSON or HTML? The sourced evidence

**What this is:** the research behind **`docs/composition-spec.md` §21.5** — how a composition's writing is stored. Gathered 2026-09-03 under the owner's rule: *"stop making such substantial claims without proper proof."* Every claim below is quoted with a URL, or marked NOT FOUND.

**The question:** today the writing is one **HTML string** in a text column. Should it be the editor's **JSON** document instead?

---

## ✅ THE HEADLINE — tiptap's own docs recommend JSON

> **"we recommend using JSON to persist the editor state as it is more flexible, easier to parse and allows for external edits if needed without running an additional HTML parser over it."**
> — https://tiptap.dev/docs/editor/core-concepts/persistence

⚠ **One inconsistency, reported not smoothed:** tiptap's *other* page on the same subject (`output-json-html`) presents JSON and HTML as both fine. **Only the persistence page carries the explicit recommendation.**
⚠ ProseMirror itself makes **no** such recommendation — it documents `toJSON` / `nodeFromJSON` and stops.

## ✅ The documented lossiness is about SCHEMA, not attributes
> **"This schema is *very* strict. You can't use any HTML element or attribute that is not defined in your schema."**
> **"If you paste something like `This is <strong>important</strong>` into Tiptap, but don't have any extension that handles `strong` tags, you'll only see `This is important` – without the strong tags."**
> — https://tiptap.dev/docs/editor/core-concepts/schema

**What this means for us:** HTML can only be read back correctly by **the exact same extension set that wrote it**. Anything the schema does not know is **silently dropped** — no error, no warning. Since this project's writing will carry custom nodes (chips) and custom attributes (heading ids), a future extension change is a real way to lose content quietly.

ProseMirror's side of the same point:
> *"you are encouraged to include parsing information directly in your schema with the `parseDOM` property."* — https://prosemirror.net/docs/guide/

## ⚠ CLAUDE'S ORIGINAL ARGUMENT WAS PARTLY WRONG — recorded
On 2026-09-02 Claude argued for JSON on the grounds that **heading ids and chip attributes get stripped when stored as HTML**. **The research does not support that as stated.** The official docs say the opposite by default:

> **"All attributes will be rendered as a HTML attribute by default, and parsed from the content when initiated."** *(and `rendered: false` disables it)*
> — https://tiptap.dev/docs/editor/extensions/custom-extensions/extend-existing

`renderHTML` / `parseHTML` are the documented mechanism, mapping to ProseMirror's `toDOM` / `parseDOM` — https://tiptap.dev/docs/editor/extensions/custom-extensions/create-new/node

**The attribute-loss claim exists only as community commentary**, in a discussion on tiptap's own repo, by an author whose affiliation the researcher could not confirm:
> *"Storing the JSON, rather than HTML makes sure that any unique IDs or generated attributes on a Node/Mark will be retained. If you store HTML then it will regenerate all attributes again."* — https://github.com/ueberdosis/tiptap/discussions/6209

A related issue (#3218, custom attributes reverting to defaults) was **closed as "not planned"/stale with no maintainer confirmation** — anecdotal, and about in-editor updates rather than a save/reload round trip.

**⭐ The honest position: right conclusion, wrong reason.** JSON is still the recommendation — because **tiptap says so**, and because **schema-strict parsing silently drops the unknown**. Not because attributes are known to be stripped.

## ❌ NOT FOUND
- **No official page calls HTML "lossy."** The word appears on tiptap.dev only about DOCX table-cell styling, and on ProseMirror's side only about Markdown and DOM-selection reading.
- **No authoritative size comparison.** One community comment says JSON is *"slightly larger storage"* with no numbers — https://github.com/ueberdosis/tiptap/discussions/5677
- **No docs statement resolving which attribute shapes need explicit `renderHTML`/`parseHTML`** versus which get the automatic default.
- **Not verified** whether the persistence recommendation is unchanged between tiptap v2 and v3 docs.

## The API, for the record
`editor.getJSON()` · `editor.getHTML()` — https://tiptap.dev/docs/guides/output-json-html
`setContent` accepts either — https://tiptap.dev/docs/editor/api/commands/content/set-content

## ⏳ Still open — the one thing that decides it
**Can Postgres full-text search a JSON document as well as it searches the HTML string today?** That is a **test**, not research, and its result belongs here when it runs. *(Draft + run instructions being prepared.)*

---

# ✅ THE TEST — RUN 2026-09-03, raw output committed

**Run it yourself:** `./verification/run-json-search-native.sh` · proof `verification/json-search-proof.sql` · output `verification/json-search-proofs.out`. Local Postgres 17.10, throwaway db, self-contained.

**The question:** can Postgres full-text search a ProseMirror JSON document as well as the HTML string it searches today?

## Result 1 — ✅ generated columns work, all four approaches
```
GENERATED COLUMN (html_search_text):        PASS
GENERATED COLUMN (jsonb_text_only):         PASS
GENERATED COLUMN (jsonb_text_and_labels):   PASS
GENERATED COLUMN (jsonb_all_strings):       PASS
GENERATED COLUMN (jsonb_all_strings_cte):   PASS
```
The search index can stay a **database-maintained generated column** exactly as `bit.search_tsv` is today — no app-written duplicate, no drift. *(`jsonb_path_query_array` etc. are catalogued genuinely immutable in PG 17.10.)*

## Result 2 — ✅ nested text is found by everything
`spelunking`, inside a doubly-nested list item, is found by HTML and by all four JSON approaches. **Depth is a non-issue.**

## Result 3 — ⭐ THE DISCRIMINATOR: text living in a chip's *attribute*
```
--- search for the chip-label-only word (marmoset) ---
 id | html_hit | json_naive_hit | json_type_aware_hit | json_catch_all_hit
----+----------+----------------+---------------------+--------------------
  1 | t        | f              | t                   | t
```
**HTML gets it FREE** — a generic tag-strip catches whatever `renderHTML()` puts between the tags. **The naive JSON walk (`$.**.text`) MISSES it** — a chip's label lives in `attrs`, not in a text node.

## Result 4 — and grab-everything creates false positives
```
--- searching the literal word "mention" ---
 id | html_hit | json_type_aware_hit | json_catch_all_hit
----+----------+---------------------+--------------------
  1 | f        | f                   | t     ← false positive
  4 | f        | f                   | t     ← false positive
```
Indexing every string pulls in **node type names and ids** (`doc`, `paragraph`, `mention`, `user-42`). Searching "mention" would return documents that merely *contain* a chip.

## ⭐ The verdict
**Type-aware extraction — `text` nodes plus a named list of attribute keys that carry visible words — matches HTML exactly on every test: finds nested text, finds chip labels, no false positives.**

**And the honest cost, which HTML does not have:** that list must be **maintained by hand**. Today it is one entry (`label`). Every future inline node whose visible words live in an attribute must be added, **or those words silently stop being findable.**

## The real trade — both sides have a quiet failure
| | what it gets free | how it fails quietly |
|---|---|---|
| **HTML** *(today)* | search, completely automatic | **reading it back needs the exact schema** — an extension change makes unknown tags *silently vanish* (tiptap's own docs, quoted above). **Content loss.** |
| **JSON** | reading back is exact and lossless | a new attribute-carrying node not added to the list is **not findable**. **A search gap.** |

🔵 **Claude's read: JSON, and now for a reason that is tested rather than asserted.** Both failures are quiet, but they are not equal — **HTML's loses writing irreversibly; JSON's only hides it from search, is detectable (search a chip label, see nothing), and is fixable afterwards by adding the key and regenerating the column.**
⚠ **Not yet ruled by the owner.**

## What this test did NOT cover
- Real documents may use **marks with attributes**, not just nodes; the fixture used one `mention` node shape. The full inventory must come from the app's tiptap extension config.
- Supabase's project Postgres major version was not confirmed to match 17 — check `supabase/config.toml` before relying on this there.
- ⚠ **A quirk found by testing, in no documentation read:** Postgres's `.**` recursive wildcard returns each matching value **twice**; `string_agg(DISTINCT …)` is required.

---
# ⚠ ADVERSARIAL ADDENDUM (2026-09-03) — the strongest facts AGAINST this file's conclusion, found by the HTML's-best-case review
1. **`enableContentCheck` / `contentError` — omitted above, material.** Tiptap CAN make HTML's silent drop loud (opt-in): *"Tiptap's content checking is 100% accurate for JSON content types. However… While Tiptap does its best to alert on missing nodes, certain mark-related issues might be missed in some situations."* — https://tiptap.dev/docs/guides/invalid-schema · `emitContentError` exists in the installed @tiptap/core@3.28.0 (verified in node_modules). **Why the JSON ruling still stands:** the guard costs the same to build either way, and only JSON's detection is guaranteed total.
2. **The same docs praise HTML where this file under-quoted:** *"HTML can be easily rendered in other places, for example in emails and it's widely used, so it's probably easier to switch the editor at some point."* — https://tiptap.dev/docs/guides/output-json-html · and the persistence page allows *"saving HTML is possible and may be the easiest way to get renderable content."*
3. **Correction to this file's own process:** the evidence outputs were once claimed "committed" while living in a session scratchpad; now genuinely in `verification/` (format-evidence.mjs reproduces its .out).
