# Tables and structured data — the thinking, ready to pick up

> ## STATUS · 2026-08-30 · ⚪ NOT PLANNED, NOT BUILT, NOT RULED
> **This is a handoff doc.** It exists so a fresh window can pick this up cold without re-deriving anything. It is **thinking + an honest cost inventory**, not a build plan. Nothing here has been decided, and no code or schema has been touched.
>
> **Read first:** `product-concept-promise.md` §2b (adjacency — *why* this matters) and §2c (the three shapes). This doc is the detail underneath those.

**Where it came from:** the owner, 2026-08-30, mid product-ideation: *"I might think there's also like tables that you can put in there… all the stuff you can do in Notion and Google Docs — so it just feels like a composing interface for all the other stuff."* And then, when Claude cautioned about scope: *"a Notion-based database doesn't have to be simple, but if we think about it and plan it, we could do it right. We can have deadline — what other features would build this out?"* **The owner is not deterred by the scope. They want it planned properly.** They also named the competitor: *"Notion is probably what I'm competing with more than Google Docs, for sure."*

---

## 1 · Why this exists at all — the argument it serves

Not "Notion has tables so we should." It falls out of the **surround claim**: creative practice is much more than producing, and the parts that aren't producing — publications to pitch, galleries to apply to, contacts, deadlines, submissions — are **list-shaped**.

And the reason it belongs *here* rather than in Notion is **adjacency** (`product-concept-promise.md` §2b), in the owner's words:

> *"If you are a writer and you have to find places to publish — well, now you can do that in one place, because you just have a note that you put onto your board, so it's **not detached from your process**."*

**That is the whole differentiator.** In Notion the deadline is a row in a table, disconnected from the piece. Here the list, the draft, and the references are in one space. **If a table lands here in a way that is NOT connected to boards, bits, tags and gather, it has no reason to exist** — Notion already does it better.

**Design test for every decision below:** *does this keep the table connected to the rest of the app, or does it become an island?*

---

## 1b · ⭐⭐ THE CONCEPTUAL CHECK — the engine's four jobs vs our model (2026-08-31; owner: cost is not a veto — spec what serves the product)

**The owner's correction, standing:** *"I'm not worried about technical time. I want a good product. We just need to be clear on exactly what we're trying to achieve and if it makes sense for our product."* Effort informs sequencing; it never decides scope. *(Claude had twice used "Notion spent a decade" as an argument — retracted as a category error: their decade includes collab, multi-tenant, scale, and a business. None of that is our problem.)*

**"The database engine" decomposed into its four jobs, mapped:**

| job | in Notion | in OUR model, today |
|---|---|---|
| **typed properties** | a database's schema | ⚠️ partly — tags · source · dates exist; **user-defined typed fields (deadline · status · number) are the real gap** |
| **views** (filter/sort one set, many ways) | saved views | ✅ **architecturally native** — stored-vs-computed is the house principle; **the pull IS a live filtered view**; Anytype's celebrated "Sets are queries, not containers" is how this app has worked since July |
| **relations** | linked databases | ✅ `reference` + `placement` ARE relations — with backlinks and a graph already |
| **computation** (formulas · rollups) | the deep end | ❌ genuinely new machinery — defer until a real want |

> **The punchline: this app is ALREADY a database with computed views.** Bits are rows · tags are properties · the pull is a view · references are relations. Notion's documented weakness is databases **bolted on** as a second product; **ours would be one model, deepened.** A structured-data engine is not foreign here — a *separate database container* would be.

**What we're exactly trying to achieve (the owner's ask, answered):** *your material, with typed fields and saved views — never a database product living inside a notes product.*

**The one conceptual gate everything hangs on — §2's fork, now with a strong lean 🔵:** **rows are bits.** Typed fields land ON the bit; a "table" is a saved view over your world; nothing is ever a trapped row in a container. Get this call right and the engine is *more* coherent here than in Notion. Get it wrong (Option B, a separate container) and we rebuild Notion's own bolt-on mistake inside the one app whose model didn't have to.

**Build shape that falls out (prelim, unruled):** ① a typed-field system on `bit` (the schema question — JSONB vs EAV vs columns; **research running**) → ② saved views (a stored query definition rendering as a table — the pull's pattern, persisted) → ③ relations: already exist → ④ computation: **parked — owner-confirmed 2026-08-31** (*"if it's the machinery we could just park it"*); re-enters on a real want, not a checklist.

**🟢 RESEARCH LANDED (2026-08-31 — full report + sources: `research-structured-data.md`). The technical shape, recommendation-grade:**
- **The universal pattern** (all four tools, no exceptions): a **property registry** (`{id, name, type, options}`) + **values as an id-keyed bag on the row** + **view = saved config with zero data gravity** (Notion/Airtable don't even expose views in their APIs — a view is pure presentation).
- **For us, concretely: TWO small tables + ONE column.** `property_defs` · `saved_views` (JSONB config: filters · sorts · layout · visible props) · `bit.props jsonb`. **No new container anywhere — rows stay bits**, which the research independently endorses: with one atom table, Anytype's *global* property registry is the natural scope (a "deadline" field works on anything, like a tag does).
- **EAV is dominated** (3× storage, orders slower even indexed); **JSONB's documented failure modes are million-row diseases** — at our scale even the GIN index is optional at first.
- **Three residual costs, all owned by the one db door:** validation on write (the type lives in the registry) · deletion sweeps (`props - 'prop_id'`) · **id-keyed values, never name-keyed** — ⭐ which is already house **P9** (tags rename free by id-reference). The engine's one hard rule is a rule this project already obeys.
- **A naming gift:** Anytype's Query-vs-Collection split (live filter vs hand-curation) is *the pull vs the board*, named by someone else — external confirmation the model's bones are the right ones.

**⚪ Original dispatch note:** R1 Notion's actual data model (API docs) · R2 the common property/view architecture across Airtable/Anytype/Capacities · R3 Postgres JSONB-vs-EAV-vs-hybrid at personal scale, recommendation-shaped.

## 2 · The central fork — decide this FIRST, everything follows

### Is a row a **bit**, or a new kind of record?

**Option A — a row IS a bit** (a table is a *view*, not a data type)
- ✅ inherits everything free: tags · search/find · trash+restore · export · **gather (`[[`)** · placement on a board · the pull
- ✅ the same list can be **spread on a board** and **gathered into a pitch** — the adjacency test passes by construction
- ✅ honors **one primitive, everywhere** (the owner's own discipline rule)
- ❌ typed columns beyond a few are hard — a bit has `content`, `body`, `source`, tags, dates, and not much else
- ❌ "a table with 200 rows" means 200 bits; needs thought about whether that floods `/bits`, the drawer, the `[[` picker

**Option B — a row is a new record type** (a real database)
- ✅ arbitrary typed columns, properly
- ❌ **a second data model.** New table, new RLS, new export lockstep (**I-G1**), new trash semantics, new everything
- ❌ rows can't be gathered, placed, or tagged unless each of those is rebuilt for them — **fails the adjacency test by default**
- ❌ this is the "half-built database is worse than none" risk: if it can't filter, the owner uses Notion anyway

**Option C — hybrid:** rows are bits, plus a small typed-properties sidecar for the few columns bits can't express.
- The likely honest answer. Costs are listed in §4.

⚠ **Claude's lean, not a ruling: A, extended toward C only where a real need is proven.** The owner has not chosen.

---

## 3 · What already exists (the surprising part)

Taking the owner's own example — a writer's publications list — against what a `bit` already carries:

| the column you'd want | already exists? | how |
|---|---|---|
| publication name | ✅ | the bit's `content` (its optional title) / its **face** |
| link to submissions page | ✅ | **`source`** — a first-class record, and it **already fetches the page title** (D-105) |
| status / fit / genre | ✅ | **tags** — already filterable, already poly on bits and boards |
| notes on it | ✅ | the bit's `body` (rich text) |
| when I added it | ✅ | `created_at` |
| **deadline** | ❌ | **nothing.** A bit has *machine* dates (created/edited), not a **date you set**. |
| a number (fee, word count) | ❌ | nothing |
| a real single-select | ⚠ | tags approximate it but don't enforce one-of |

> **The gap between "a table of bits" and a working submission tracker is roughly ONE field: a user-set date.**

That is the cheapest meaningful step in the whole area, and it is worth knowing before anything larger is designed.

---

## 4 · "What other features would build this out?" — the honest inventory

The owner asked directly. Nothing here is padded; each item is real work.

**Tier 1 — the minimum that isn't useless**
1. **A table view** over a set of bits (which set? a tag? a board? a folder? a saved query? — **open**)
2. **Columns mapped to existing bit fields** (face · source · tags · dates)
3. **A user-set date field** on `bit` (small migration; the one real gap)
4. **Sort by column**
5. **Filter** — at minimum by tag and by date range. *(Without filter, the whole thing fails its purpose.)*
6. **Add a row inline** — creating a bit from inside the table
7. **Where the table lives** — inside a composition? its own surface? a card on a board? **This is a model question, not a UI one.**

**Tier 2 — what "a real database" additionally means**
8. **Typed properties** — number · single-select · multi-select · checkbox · URL · date
9. **A per-type editor** for each (date picker, select chips, number input) — one small UI each, six of them
10. **Column management** — add · rename · reorder · delete · **retype** (retype is a data migration every time)
11. **Group by** a column
12. **Saved views** — the same rows as table / gallery / board / calendar
13. **Per-table schema storage** — real columns, or JSONB, or EAV. All three have costs; JSONB is likeliest and weakens querying
14. **Relations between tables** — *this is where Notion actually lives, and it is a large build*
15. **Formulas / rollups** — explicitly out of scope unless proven needed

**Tier 3 — the plumbing that is NOT optional if any of the above ships**
16. **Export** — **I-G1** says every stored record kind appears in `/api/export`. A new kind must join in lockstep.
17. **RLS** — any new table needs owner-only policies, proven on a throwaway (the house standard)
18. **Trash / restore** semantics — what does trashing a row mean? a table?
19. **Find integration** — does table content appear in `/find`? (It does free under Option A.)
20. **The `[[` picker** — do rows show up as gatherable? (Free under A; a build under B.)
21. **Naming** — ⚑ **step 2b: none of this has a ruled word yet.** "table," "list," "database," "grid" are all unruled. `lexicon.md` has nothing. **Name it before building it** — this is exactly the rule that archive broke (D-128).

---

## 5 · Model-safety notes (the five gates, pre-flagged)

- **I-G1 export completeness** — new record kinds join the export in the same pass.
- **I-G2 one fact, one record** — a table must not become a second place a bit's title or tags live.
- **One primitive, everywhere** (the owner's positioning rule) — Option B is in direct tension with it. Not fatal, but it must be a *decision*, not a drift.
- **The one door** — all access through `lib/db`, never Supabase from a component.
- **Schema work is throwaway-proven first, cloud only on the owner's explicit go.**

---

## 6 · Open questions for the owner

1. ⚪ **Row = bit, or a new record?** (§2 — everything else depends on this)
2. ⚪ **Where does a table live** — in a composition, on a board, or its own surface?
3. ⚪ **Which typed columns do you actually need?** Date is proven. Number? Single-select? Or do tags cover it?
4. ⚪ **How many rows realistically?** 20 publications behaves very differently from 2,000.
5. ⚪ **Does a table need to be gatherable / placeable**, or is it fine as an island? *(If it's fine as an island, the adjacency argument for building it here at all weakens considerably — worth being honest about.)*
6. ⚪ **What is it called?** Unruled. Name before build.

---

## 7 · If picked up cold, read in this order

`product-concept-promise.md` §2b + §2c (why, and the three shapes) → this doc → `invariants.md` (I-G1, I-G2) → `lexicon.md` (naming, and step 2b) → `SPEC.md` §schema → `organize-phase-plan.md` §5 (the item loop — **step 2b, name it, is not optional**).
