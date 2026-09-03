# Notion's data model — the sourced reference

**What this is:** a **reference point**, gathered 2026-09-03 at the owner's request (*"seems helpful at least as a reference point"*). It records **only what Notion's own documentation states**, each line with a quote and a URL.

> ⚠ **THE RULE THIS FILE EXISTS TO ENFORCE.** On 2026-09-02 Claude described Notion's architecture, motives and trade-offs fluently and **without sources**; the owner: *"stop making such substantial claims without proper proof."* **So: every line below is quoted from a primary source, or marked NOT FOUND.** Nothing here explains *why* Notion built anything — motives are unknowable unless stated publicly, and they were not. **Claude's inferences do not belong in this file.**
>
> ⚠ **And the standing caveat, from the researcher:** all of this is the **public API contract plus published infrastructure posts**. Notion's docs do not claim to describe internal storage. **The API is a contract, not a schema.**

---

## 1 · The core claim — VERIFIED, and from Notion itself

> **"Everything you see in Notion is a block. Text, images, lists, a row in a database, even pages themselves—these are all blocks."**
> — *Exploring Notion's data model*, notion.com/blog, **18 May 2021**
> https://www.notion.com/blog/data-model-behind-notion

**This is the strongest source on the question and it is Notion's own.** It supersedes the second-hand summaries used on 2026-09-02.

## 2 · What a block record carries *(the API reference)*
`object` · `id` (UUIDv4) · `parent` (object) · `type` (enum) · `created_time` · `created_by` · `last_edited_time` · `last_edited_by` · `archived` *(deprecated)* · `in_trash` · `has_children` (boolean) · `{type}` — "An object containing type-specific block information."
— https://developers.notion.com/reference/block

## 3 · A block's parent — six shapes
`database_id` · `data_source_id` · `page_id` · `workspace` · `block_id` · `agent_id`
— https://developers.notion.com/reference/parent-object

## 4 · Ordering — ⭐ NO EXPLICIT FIELD IS DOCUMENTED
There is **no documented position, index or sort key on a block**. "Retrieve block children" is described only as paginated, **with no stated ordering guarantee**; the `position` parameter on *append* (`end`/`start`/`after_block`) controls where a block is inserted, and is not a field on a stored block.
— https://developers.notion.com/reference/get-block-children · https://developers.notion.com/reference/patch-block-children

## 5 · Is a page a block? — two framings, deliberately NOT reconciled
- **Guide:** *"Pages are a special kind of block, but they have children like many other block types."* — https://developers.notion.com/docs/working-with-page-content
- **Reference:** *"Page content is available as blocks."* — https://developers.notion.com/reference/page
- **Blog (§1):** *"even pages themselves—these are all blocks."*

## 6 · Is a database a block? — ❌ NOT FOUND
Neither the Database reference nor the databases guide states it either way. *(Adjacent fact: `child_database` is one of the documented block **types**, i.e. a database can appear as a block inside a page — which is NOT the same claim.)*
⚠ **Correction:** on 2026-09-02 Claude asserted *"a database is itself a block."* **Unsourced. Withdrawn.**
— https://developers.notion.com/reference/database

## 7 · Linking to an individual block — ❌ NOT FOUND in the API docs
The docs describe extracting a **page** ID from a URL (*"The URL ends in a page ID… a 32 character long string"*), but the researcher found **no documentation of block IDs in URLs or of linking to an individual block**.
⚠ **Status:** the *product* feature ("Copy link to block") is believed to exist and is **trivially checkable in the app** — but it is **not doc-verified**, so it is not asserted here.
— https://developers.notion.com/docs/working-with-page-content

## 8 · Block types — ~32, ⚠ WEAKEST ITEM IN THIS FILE
The quoted enum contains **32** values: bookmark · breadcrumb · bulleted_list_item · callout · child_database · child_page · column · column_list · divider · embed · equation · file · heading_1 · heading_2 · heading_3 · heading_4 · image · link_preview · numbered_list_item · paragraph · pdf · quote · synced_block · table · table_of_contents · table_row · template · to_do · toggle · transcription · unsupported · video
⚠ **The researcher flagged this themselves:** repeat extraction passes returned 31 / 32 / 33, and a later pass surfaced section headings (Audio, Code, Meeting notes, Tab, Mention) absent from the enum string. **Treat the count as approximate.**
— https://developers.notion.com/reference/block

## 9 · Infrastructure — published, dated
| fact | quote | source · date |
|---|---|---|
| the first shard build | *"480 logical shards evenly distributed across 32 physical databases"* | [Herding elephants](https://www.notion.com/blog/sharding-postgres-at-notion) · 6 Oct 2021 |
| what was sharded first | *"the `block` table was the highest-priority for sharding"* | same |
| the re-shard | *"we landed on tripling the number of instances in our fleet from 32 to 96 machines."* | [The Great Re-shard](https://www.notion.com/blog/the-great-re-shard) · 17 Jul 2023 |

⚠ **Row counts (20 billion in 2021 → 200 billion in 2024) are NOT Notion-primary** — they came from a secondary summary (ByteByteGo). The data-model post gives no row counts. **Directional only.**
⚠ **An unreconciled detail:** logical-shards-per-instance is quoted as 15 in both posts, but 480 shards across 96 machines implies 5. **Not resolved — do not cite a per-instance number.**

---

## What this file does NOT establish
- **Why** Notion chose blocks. Never stated publicly; every explanation Claude gave on 2026-09-02 was inference and is marked as such in `docs/composition-spec.md` §21.5.
- **What users value about Notion** — and the one guess Claude made (that block architecture is why Notion can be a wiki/CRM/tracker) is **~wrong**: that work is done by *databases*, and **Airtable is a counter-example**. Also unverified.
- **How blocks are actually stored** — column names, indexes, the row's real shape. The API is a contract, not a schema.
- **Anything current.** The newest source here is 2023.

**Where the live decision is:** `docs/composition-spec.md` §21.5 — and **none of it depends on this file.** This is a reference point the owner asked to have in her pocket, nothing more.
