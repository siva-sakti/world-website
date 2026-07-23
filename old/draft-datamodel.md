# Data model — the high-level picture — ⚠️ SUPERSEDED by `draft-techlayer.md`

> **This doc has been absorbed into `draft-techlayer.md`** (2026-07-19, D-059–D-064) — the full top-down model: all five things, connections, surfaces, flows, and rules, with diagrams. Read that instead; this is kept as history.

**What this is:** the *plain-language* sketch of how the data works — the mental model to hold onto. The full schema/DDL lives in `SPEC.md` (§ schema/RLS) and `supabase/migrations/20260715000001_init.sql`; this is the map above them. Written 2026-07-19.

## One idea, two layers

Everything rests on a **bit** (one atom of content — text, image, doodle) living in **two separate layers**:

```
                    a BIT
                      │
        ┌─────────────┴──────────────┐
     MEANING                       LAYOUT
  (information layer)            (visual layer)
   the "Obsidian" part           the "Freeform" part
        │                              │
   ┌────┴─────┐                   ┌────┴──────┐
  tags      links              boards   +  placements
 (about)   (connect)          (spaces)   (which board +
 kind/stage                              where on it)
 (type/maturity)
```

## ① Information layer — what a bit *means*
Travels **with the bit**, no matter where (or if) it's shown.

- **Tags** — what it's about.
- **Kind / stage** — what it is / how mature.
- **Links** — what it connects to.

### Tags vs kind/stage — two different data structures (not one thing with sub-types)
A real data-layer distinction, on purpose:

- **Open tags** → a **`tags` table** you join to (via `bit_tags` / `board_tags`). A bit can have **many**; you **invent them freely** ("grief", "astrology"). Unbounded vocabulary.
- **Fixed labels** (`kind` on a bit, `stage` on a board) → a **single field right on the bit/board**, chosen from a **short fixed list**: `kind` = learned / noticed / wondered / theorized; `stage` = a maturity gradient (seed→…→fruit). **One value each**, constrained.
- **Why separate:** they *behave* differently — open+many vs fixed+one — and `stage` is **ordered**, which a flat tag can't express. (Some apps unify everything into "one tag system"; we keep them apart so the fixed ones stay constrained + orderable. Revisitable if a unified model is ever wanted.)
- *(Note: `stage` is designed but not yet in the DB — it lands with the boards phase, D-028. `kind` and open `tags` are already in the schema.)*

### Links — how bits connect
One `links` row = one connection (`bit → bit`). **"Forward-link" and "backlink" are the same row read from either end** — not two things. Deliberate connections only; *shared tags* connect bits **implicitly**, with no row.

## ② Visual layer — where a bit *sits*
- **Boards** — spaces / canvases.
- **Placements** — the layout record: **which bit · which board · where on it** (`x, y` position, `w, h` size, `z` stacking). One bit → **many** placements (on three boards = three placements, *same bit*) or **zero** (exists, just not arranged yet). If `x/y` are empty, it's *on* the board but ungridded (collection mode).
- **A placement stores position, never meaning.** Move / resize / re-board a bit all day; its tags and links never change.

## The payoff — why the two layers are separate
Tag + link a thought **once** (its meaning); then arrange it **visually** in as many places as you like — all live. Edit the bit, and it updates **everywhere** it's placed. That's "Obsidian + Freeform" in one line: **meaning stored once, layout free and repeatable** (the whole differentiator, D-036).
