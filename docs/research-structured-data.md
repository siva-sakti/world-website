# Research — structured-data engines: properties & views, technically

> ## STATUS · 2026-08-31 · 🟢 LANDED (Claude's agent). Folds into `tables-and-structured-data.md` §1b.
> Frame it serves: *rows are bits; a table is a saved view over your world; never a trapped-row container.*

## Executive summary — the shape that fits this app

Every surveyed tool (Notion · Airtable · Anytype · Capacities) converges on **one three-part shape**:
1. **a property REGISTRY** — `{id, name, type, options}` records;
2. **values as an id-keyed bag on the row** — keyed by the property's *stable id, never its name* (renames stay free);
3. **a view = saved config** `{source, filters, sorts, layout, visible props}` — **no tool gives a view data gravity**; Notion and Airtable don't even expose view config in their APIs. A view is pure presentation.

**For us:** a small `property_defs` table · one `props jsonb` column on `bit` · a `saved_views` table with a JSONB config. **EAV is dominated on every measured axis** (3× storage, orders-of-magnitude slower even fully indexed); JSONB's documented failure modes (planner statistics, key-repetition bloat — Heap's production writeup) are **million-row diseases**. At thousands of rows a sequential scan is sub-millisecond — **even the GIN index is optional at first**.

## R1 — Notion's data model (from its API)
Database = a container (no schema) → **data source** = the schema-bearer (a `properties` map) → **property object** = `{id: short random string, name, type, <type>: {config}}` → **page = row**, values keyed by property **id** ("remains constant even if the name changes"). ~21 property types; a personal app needs ~6 (text · number · checkbox · select · date · relation). **Views are absent from the API entirely** — in-product they're layout + filters + sorts + visibility, per-view independent. Internally everything is a block; collections sit above the block tree.

## R2 — The common architecture, and the one divergence that matters
**The pattern: registry + id-keyed bag + view-as-saved-query — all four tools, no exceptions.** The divergence is **registry scope**: per-container (Notion/Airtable), per-object-type (Capacities), or **global** (Anytype — "a Genre property works on Books and Movies"). ⭐ **For an app with ONE atom table, Anytype's global registry is the natural fit — there is no container to scope to.** Which is exactly the *rows-are-bits* frame: fields belong to your world, not to a table.
Anytype's other useful split: **Query** (live filter, self-maintaining) vs **Collection** (manual curation) — our pull vs our board, named by someone else.

## R3 — Postgres: the honest costing
- **Real columns per user field:** disqualified — runtime DDL. 
- **EAV:** benchmark (coussej, 10M entities): 3 tables, 6.43GB vs JSONB's 2.08GB, GIN containment 0.153ms vs *thousands* of ms for the joins. Its advantages matter at analytics scale only.
- **JSONB:** Heap's two production failure modes — no planner statistics inside JSONB (hardcoded 0.1% selectivity → catastrophic plans) and per-row key repetition (table doubled) — **both bite at millions of rows, not thousands.** Their own rule: JSONB is for *sparse, optional attributes* — which is precisely what user-defined fields are.
- **Indexing when ever needed:** GIN `jsonb_path_ops` for containment; expression B-trees per hot field for sort/range. Neither needed at first.

**The three residual costs the db module must own** (the one-door rule carries all three):
1. **validation on write** — the type lives in `property_defs`, not the DB; the db module (or a trigger) enforces it;
2. **deletion sweeps** — removing a property definition must sweep `props - 'prop_id'` across rows, or keys orphan;
3. **id-keyed values, never name-keyed** — the one design detail worth copying verbatim. ⭐ *And it is already our house principle:* **P9 — words referenced by id so renames are free** — the same rule tags have obeyed since July.

## Sources
Notion API: [database](https://developers.notion.com/reference/database) · [data source](https://developers.notion.com/reference/data-source) · [property object](https://developers.notion.com/reference/property-object) · [page property values](https://developers.notion.com/reference/page-property-values) · [2025-09 upgrade guide](https://developers.notion.com/docs/upgrade-guide-2025-09-03) · [views help](https://www.notion.com/help/views-filters-and-sorts) · [the block model](https://www.notion.com/blog/data-model-behind-notion) — Airtable: [field model](https://airtable.com/developers/web/api/field-model) · [base schema](https://airtable.com/developers/web/api/get-base-schema) — Anytype: [properties](https://doc.anytype.io/anytype/organize/properties.md) · [queries](https://doc.anytype.io/anytype/organize/queries.md) · [sets mirror](https://github.com/steffantucker/anytype-docs/blob/main/basics/sets-and-collections/sets.md) — Capacities: [properties](https://docs.capacities.io/reference/properties) — Postgres: [coussej EAV-vs-JSONB benchmark](http://coussej.github.io/2016/01/14/Replacing-EAV-with-JSONB-in-PostgreSQL/) · [Heap: when to avoid JSONB](https://www.heap.io/blog/when-to-avoid-jsonb-in-a-postgresql-schema) · [JSON types & GIN](https://www.postgresql.org/docs/current/datatype-json.html)
