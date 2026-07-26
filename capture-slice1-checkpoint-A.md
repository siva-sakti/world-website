# Capture · Slice 1 — the model on paper → ◆ Cap-Checkpoint A

**For you to sign off.** This is the *model on paper* for capture — the smallest change to the database that lets you **collect what you read** (a page, a quote, a picture, each remembering where it came from) and **arrange it later** instead of filing it the moment you catch it. Nothing here has touched the live site or your real data — it was proven on a private throwaway copy of the database and rolled back. When you say yes, I apply it for real and we build the visible parts (the bookmark card, the inbox page, "place on a board…") on top.

**The one-line promise:** a saved page/quote/picture doesn't have to land on a board — it lands in a **loose pile** you can arrange when you're in the mood, and a quote always remembers **"from …"** with a working link home.

---

## 1. What this change does — in plain words

Three small things, and that's the whole database change for now:

1. **Every bit can remember where it came from.** I added two new optional fields to a bit: **`source_url`** ("this came from this web page") and **`source_title`** ("…which was titled this"). They're read **once** when you catch something and then **frozen** — if the page later changes or dies, what you saved never changes under you. Most bits leave these blank (a thought you wrote yourself has no "source"). A **saved page** doesn't use them either — its source *is* itself, so it just uses the title field it already had. Only a **clip** — a quote or a picture lifted *out of* a page — carries them.

2. **A saved page can now keep a preview picture.** Today the database *forbids* a saved-URL bit (a "bookmark") from also holding an image. That was too strict — a bookmark card should be able to show the page's preview thumbnail. I relaxed exactly that one rule, and **only** for bookmarks: a quote, a drawing, or a photo still can't carry a stray file where it doesn't belong. (I proved that the relaxation is surgical — see the green output below.)

3. **There's now a "loose pile" — the inbox.** A bit is **loose** when it isn't sitting on any board you can actually see. The inbox is simply *"show me every loose bit, newest first."* It's not a new thing stored in the database — it's a **question the database answers on the fly** from the boards a bit is (or isn't) on. That means it's always correct with nothing to keep in sync: put a loose bit on a board and it leaves the inbox; take it off its last board and it comes back — automatically.

   One subtle case the review caught and this fixes: if a bit's **only** board goes to the **trash**, the bit used to fall into a crack — not on a board, and not in the inbox either, so effectively invisible. Now it correctly comes **back to the inbox**. (Proven below.)

### The exact database change (the SQL)

```sql
-- 1. two "where did this come from" fields (optional; blank = you made it yourself)
alter table bit add column source_url   text;   -- the page a clip was taken from
alter table bit add column source_title text;   -- that page's title, frozen when caught

-- 2. let a saved page (a "bookmark") also hold a preview picture.
--    Only the bookmark line changes; quote/drawing/photo rules are copied word-for-word.
alter table bit drop constraint bit_substance_matches_type;
alter table bit add  constraint bit_substance_matches_type check (
    case type
      when 'text'     then body is not null
                        and strokes is null and url is null
                        and captured_title is null and storage_path is null
      when 'drawing'  then strokes is not null
                        and body is null and url is null
                        and captured_title is null and storage_path is null
      when 'image'    then storage_path is not null
                        and body is null and strokes is null
                        and url is null and captured_title is null
      when 'bookmark' then url is not null
                        and body is null and strokes is null
                        -- a preview picture is NOW ALLOWED here;
                        -- it used to say `and storage_path is null`
      else true
    end
  );

-- 3. "the inbox" — every loose bit, newest first. A live question, not a stored list.
create view the_inbox with (security_invoker = true) as
  select b.*
  from bit b
  where b.deleted_at is null                       -- the bit itself is live (not trashed)
    and not exists (                               -- …and no board actually shows it:
      select 1
      from placement p
      join board bo on bo.id = p.board_id
      where p.target_bit_id = b.id
        and p.left_at is null                      -- it hasn't been taken off that board
        and bo.deleted_at is null                  -- …and that board isn't in the trash
    )
  order by b.created_at desc;
```

The whole migration file is `supabase/migrations/20260725000001_capture_source_and_inbox.sql`.

---

## 2. The proof (the green result)

I built a throwaway copy of the real database, applied the proven schema and then this change, and ran a suite that checks every claim above. It **passed**. Run it yourself anytime with `bash verification/run-capture-native.sh`.

```
=== PHASE 4: apply the proven init, THEN the capture migration ===
init applied clean ✓
capture migration applied clean ✓
=== truth-check: the tenth view (the_inbox) + the two source columns are really there ===
views = 10
the_inbox present = true
bit source columns = 2
=== PHASE 5: capture-proofs.sql — source · the flip · the inbox ===
HOLDS ✓ 1 source round-trips off the bit row · export (direct select *) is free · the_inbox carries
         source, the_ledger's frozen select * does NOT (Slice-4 view-refresh flagged)
HOLDS ✓ 2a THE FLIP: a bookmark carrying a preview file is now ACCEPTED (was refused pre-migration)
REFUSED ✓ 2b text still refuses a stray storage_path
REFUSED ✓ 2c drawing still refuses a stray storage_path
REFUSED ✓ 2d image still refuses a stray url
REFUSED ✓ 2e bookmark still refuses a body (only storage_path was relaxed)
HOLDS ✓ 3 the_inbox = EXACTLY the loose set: never-placed IN · live-board OUT · un-placed IN ·
         only-board-trashed IN (the hole) · trashed bit OUT
HOLDS ✓ 3b restore the board → its bit leaves the inbox again (pure symmetry, nothing rebuilt)

=== CAPTURE SLICE 1 PROOFS PASSED ✓ — source round-trips, the flip is surgical, the inbox is exactly the loose set ===
```

Files: the proof is `verification/capture-proofs.sql`, its runner is `verification/run-capture-native.sh`, and the captured output is `verification/capture-proofs.out`.

### One thing the proof caught worth knowing about

There's a Postgres quirk I hit and turned into a proven fact: a saved view written as `select *` **freezes its column list the day it's created**. So the two new source fields show up on the bit table (and on a plain **export**, which reads the table directly), and on the **new inbox view** — but *not* automatically on the older `the_ledger` view (find's "show everything" list), which was written before these fields existed. This costs us **nothing now** (nothing shows a source line yet). It just means: when we build the clip's *"from …"* line onto boards and lists (Slice 4), that step must also *refresh* those older views to include the new fields. It's on the checklist below so it can't surprise us later.

---

## 3. The rules this establishes (proposed for `invariants.md`)

These are the always-true rules capture adds — written in the project's `I-x` style, as a **proposal** to fold into `invariants.md` when you sign off (not added yet). Two small sets: **I-S** for *source*, **I-N** for *looseness / the inbox / call-in*.

**Source (I-S):**
- **I-S1 — Source is optional.** Any bit may carry `source_url`/`source_title`; both blank = self-made. → *kept by the database* (nullable columns; the substance rule never names them).
- **I-S2 — Source is frozen at capture.** Read once when caught, never re-read — a dead or edited page can't change what you filed (same principle as a bookmark's captured title). → *kept by the one write path (app)*.
- **I-S3 — A bookmark's source is itself.** A whole-page bookmark stores its title once (in `captured_title`) and leaves `source_*` blank; only clips carry source. What's shown as the source = `source_url` if present, else the bookmark's own `url`. → *app*.
- **I-S4 — A bookmark may carry a preview; the target stays `url`.** A bookmark may now hold a preview picture (`storage_path`); `url` is still what the bookmark points at. The relaxation is surgical — the other three kinds still refuse a stray file. → *kept by the database* (the substance rule).

**Looseness / the inbox / call-in (I-N):**
- **I-N1 — Loose is computed, never stored.** A bit is loose ⇔ it is live **and** no board actually shows it (no un-departed placement on a non-trashed board — the exact rule boards already use). No flag, no column. → *computed*.
- **I-N2 — The inbox is the loose surface.** Every loose bit appears in the inbox, newest-first; it's a computed surface, not a saved state. (This is loose bits' guaranteed way-back, the way the ledger is for everything live.) → *computed*.
- **I-N3 — A bit whose only board is trashed is loose.** It returns to the inbox (its placement keeps "not departed"; the board-not-trashed test catches it). Corollary, by pure symmetry: taking a bit off its last board, and trashing its last board, both return it to the inbox; restoring the board removes it — with nothing to rebuild. → *computed*.
- **I-N4 — Call-in reuses the membership row.** Putting a bit back on a board it once left **clears the departure** on the existing row (never inserts a second — the database forbids two rows for one bit-and-board, I-L1); a called-in bit lands where you drop it, center by default. → *app + the existing UNIQUE rule*.

---

## 4. The scenes, traced to the record

Two walk-throughs in `model-scenarios.md` style — every step of a bit's life (**create · edit · place/call-in · un-place · trash · restore · destroy**), first for a **captured bit**, then for **looseness** (when a bit is or isn't in the inbox), including the trashed-board case the review caught.

### Grid A — a captured bit (a quote clipped from an article, carrying its source)

| step | what happens to the record |
|---|---|
| **create** | one **text bit**: `body` = the quote, `source_url` + `source_title` set and **frozen**. Born on no board → it's **loose**, so it shows in the inbox. |
| **edit** | you rename it (write your own `content`) → its face becomes your words; **source is untouched** — a changed or dead page never rewrites what you filed. Editing the quote body edits the body only. |
| **place / call-in** | you call it onto a board → one **placement** row (reusing the old membership row if it was ever there). Source travels on the bit itself — one bit, same source on every board. |
| **un-place** | you take it off that board → the placement is marked *departed* (row **kept** as travel history); the bit returns to the inbox. Source unchanged. |
| **trash** | you trash the **bit** → it vanishes from every board **and** from the inbox (trash is outside the world). Its source sits frozen on the row, ready to return. |
| **restore** | you un-trash it → it comes back exactly, source intact; if it's on no live board, it's back in the inbox. |
| **destroy** | you empty the trash → the bit row and its placements/tags/preview file are gone completely; the source dies with the row (it lived nowhere else). Nothing else is touched. |

### Grid B — looseness (is the bit in the inbox?) — includes the trashed-board scene

| step | in the inbox? |
|---|---|
| **create** (no board) | **IN.** A bit made without a board is loose immediately — this finally honors "the bit needs no board." |
| **edit** | **unchanged.** Looseness is about boards, not words — editing never moves a bit in or out of the inbox. |
| **place / call-in** (live board) | **OUT.** Now a board shows it, so it's not loose. |
| **un-place** (its last board) | **IN, automatically.** Off its last board → loose again, nothing to set by hand. |
| **trash the bit** | **OUT** (but restorable) — trashed things are outside the world. |
| **trash its *only board*** *(the hole the review caught)* | **IN.** The board is trashed but the bit's placement still says "not departed" — the old naive test would have filed it **nowhere**. The board-not-trashed test catches it and returns it to the inbox. |
| **restore that board** | **OUT.** The board shows the bit again → it leaves the inbox. Pure symmetry, nothing rebuilt. |
| **destroy the bit** | **gone** — not in the inbox, not anywhere. |

Both grids are proven by section 3 of `verification/capture-proofs.sql` (the inbox cases) and hold against the existing placement/trash rules (the rest).

---

## 5. The one open decision for you

**Should the inbox be a database *view* (the `the_inbox` I built) or a query written in app code (`lib/db`)?**

- **Recommended: keep it a view.** The inbox is a *computed surface* — the same kind of thing as every other list in the app (the ledger, home, the pull), and those are all views. As a view it (a) applies your privacy automatically, exactly like the others, so the security posture can't drift; (b) keeps the "is it loose?" rule in **one** place, matching the rule boards already use, instead of copying it into app code where the two could fall out of step; and (c) is the thing I just proved. **Cost:** it makes the app's view count go from **nine to ten**, which means a small wording sweep in two docs (listed below).
- **The alternative:** write the inbox as a query in `lib/db` instead. This keeps the count at nine, but copies the "is it loose?" logic into app code — a second place it could drift from the boards' rule. I don't recommend it.

I built it as a **view** so the proof is real. If you pick the app-query path instead, we simply drop the view from the migration and skip the nine→ten sweep.

---

## 6. Proposed edits to the canonical docs — to apply *with you* at sign-off (NOT done yet)

None of these are applied. This is the checklist we walk through together when you approve, so the seed-of-truth docs stay in step. *(Items marked ⑽ apply only if you keep the inbox as a view — section 5.)*

- **`agreements.md`** — record the capture rulings (latest-ruling-wins, into the right clusters): *loose = computed* (no board actually shows it, bit live) · *the inbox is the loose surface* · *call-in reuses the membership row* (clears the departure, never a second row) · *source is optional, frozen, and a bookmark leaves it blank* · *a bookmark may carry a preview*.
- **`lexicon.md`** —
  - Computed-surfaces table: add **the inbox** ("your loose pile — every bit no live board shows, newest-first; computed, not stored").
  - Parts of a bit: add **source** (`source_url` · `source_title` — provenance, frozen at capture; distinct from a bookmark's `url`).
  - The acts: **call in** is already listed (good); add **clip** (lift a quote/image from a page, keeping its source) and the adjective **loose** (a bit no live board shows).
  - Code-names → the views list (line 98): add **`the_inbox`** ⑽ (the list becomes ten).
  - Code-names → the bit's stored halves: add **`source_url` · `source_title`**.
- **`invariants.md`** — add the **I-S** and **I-N** sets from section 3 (a new cluster, e.g. "Cluster 6 — capture: source & looseness").
- **`parked.md`** —
  - **A6 (Loose-bits drawer):** mark ✅ **ABSORBED — the inbox is the loose surface** (supersedes its "if wanted" note).
  - **Quick-add** (jot a note / paste a link → born loose) lands with the inbox in Slice 2 — note it.
  - Add a build note: the **Slice-4 view refresh** — when the clip's "from …" line reaches boards and lists, refresh `board_cards` and `the_ledger` to include the source fields (the frozen-`select *` finding in section 2).
- **`model-scenarios.md`** — add the two grids in section 4 as a capture scene (a captured clip; looseness including the trashed-board case), in the doc's trace style.
- **`ROADMAP.md`** — reconcile capture arriving early (Phase-5 capture pulled forward by your want; the phone/offline loop stays parked, B1). **§4 line 93** ⑽: "Retrieval is computed (**nine** views)" → "**ten** views."
- **`SPEC.md`** —
  - **§2 line 26** ⑽: "**Nine views**" → "**Ten views**", **and add `the_inbox`** to the named list.
  - §2 line 21 (the `bit` description): note the two **source** fields and that a **bookmark may now carry a preview** (`storage_path` permitted).
  - Add the Slice-4 view-refresh note (frozen-`select *`, section 2) so the builder expects it.

---

### What's proven, and what's still ahead

**Proven on paper (this checkpoint):** the two source fields store, read back, and export; a bookmark may carry a preview and the relaxation touched nothing else; the inbox returns *exactly* the loose set, including the trashed-board bit; and the whole thing applies cleanly on top of the proven schema. **Still ahead (later slices, later checkpoints):** the visible bookmark card and the inbox *page* (Slice 2 — the inbox is a browse surface, the one kind we deliberately design), "place on a board…" / call-in (Slice 3), quote + image clips with their "from …" line (Slice 4), and the browser save button (Slice 5). We can stop after any slice with a real result banked.
