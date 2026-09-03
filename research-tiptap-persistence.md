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
