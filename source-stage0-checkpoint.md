# Source & the full bit · Stage 0 — the model fix → ◆ Checkpoint

**For you to sign off.** This is the *model on paper* for the change that opens the whole "Source & the full bit" plan: making **source** — *where a bit came from* — a real, first-class thing in your notebook, and **retiring the "bookmark"** as its own kind of object. Nothing here has touched the live site or your real data — it was proven on a private throwaway copy of the database and thrown away. When you say yes, we apply it and build the visible parts (the source picker, rich text, the workspace) on top.

**The one-line promise:** a saved page is no longer a *thing you hoard* — it becomes a **source** you can hang notes off. You keep **notes *from* sources**, never the raw page. *Grow thoughts, don't hoard consumption.*

> ### ⚠ Read this first — it's a real pivot, and it needs your conscious "yes"
> This reverses three-day-old work on purpose. Two consequences you should say yes to *before* we apply anything:
> 1. **There is no "saved web page (or video) as its own kept thing" anymore.** A URL is a **source** on a note (or a plain link *inside* a note) — not a saved object. If you clipped a quote from an article, you keep the *note* and remember the *source*; you don't keep the article.
> 2. **"Save this to come back to it later" is now a deliberate act — a tag** (like `#revisit`), never an automatic bookmark. This matches how we already decided against a "favorites/star" (same idea: significance = a tag, not a second hidden mechanism).
>
> If either of those feels wrong, stop me here — everything downstream rests on them.

---

## 1. What this change does — in plain words

Three linked things happen, in a careful order:

1. **Source becomes a real named thing** — its own little list in the database, shaped **exactly like your tags and your subtype words**: a **name** (e.g. *"Deep Work"*, *"calnewport.com"*) plus an **optional link** (a web page has both; a *book* has a name and no link). Every bit can point at **one** source (a bit has *many* tags but *one* "where it came from"). Near-duplicate names are refused the same way tags are — you can't have both *"Deep Work"* and *"deep work"*.

2. **Your old provenance notes are moved in.** Three days ago we added two plain text fields to bits (`source_url` / `source_title`) to remember where a clip came from. Those get turned into proper **source** records and the old fields are removed. If a page's title never loaded (so we only had a link), the source is simply **named after its link** — nothing is lost, nothing is blank.

3. **Every "bookmark" bit becomes a normal note.** A bookmark was a bit that *was* a saved URL. Each one is rewritten into an ordinary **text note whose body is a clickable link**, carrying a **source** for that page. After that, the "bookmark" type is retired — the database will now *refuse* to make one.

**The order matters and is load-bearing:** we build the source list → move the old fields in → **convert every bookmark first** → *only then* forbid bookmarks. If we forbade them before converting, the leftover bookmarks would violate the new rule and the whole change would abort. The proof (section 2) checks that **zero bookmarks survive**.

Two small honest notes: the old `captured_title` slot on bits is now unused on live rows (harmless leftover, cleaned up later); and a bookmark that happened to carry a preview picture loses that picture's link (the picture file itself is just an orphan in storage, tidied later) — a note's body is a link, not a picture.

### The exact database change (the SQL)

The whole change is one migration file, `supabase/migrations/20260726000001_source_first_class.sql`. The heart of it:

```sql
-- 1. The source list — shaped exactly like your subtype words, locked to you (D-094).
create table source (
  id         uuid primary key default gen_random_uuid(),
  name       text not null,          -- "Deep Work", "calnewport.com/deep-work"
  url        text,                   -- optional link; null for a book
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create unique index source_name_ci on source (lower(name));   -- no near-duplicate names (like tags)
alter table source enable row level security;
create policy source_owner_all on source for all to authenticated
  using (auth.uid() = '<your owner id>') with check (auth.uid() = '<your owner id>');

-- 2. Every bit can carry ONE source (optional). Delete a source → bits keep going, lose the stamp.
alter table bit add column source_id uuid references source(id) on delete set null;
create index bit_source on bit (source_id);

-- 3. Move the old source_url/source_title fields into real source records
--    (name = the title if we have one, else the link), then point the bits at them.

-- 4. Turn every bookmark into a text note whose body is a clickable link, with a source:
--       body = '<p><a href="<url>"><title-or-url></a></p>'
--    and clear the old bookmark-only fields so it's a clean text note.

-- 5. Retire the bookmark type — only after zero bookmarks remain:
--    drop 'bookmark' from the allowed types; drop its rule branch.

-- 6. Drop the old source_url/source_title columns; refresh the card + list views
--    so "from [name] ↗" can show on boards and in your lists.
```

The full file has every step written out with house-style comments and each fix cited.

---

## 2. The proof (the green result)

I built a throwaway copy of the real database, applied the **entire** proven history in order (the schema → the security hardening → the capture fields → gather), then **seeded exactly the kinds of data this change has to convert** — a bookmark, a clip whose page-title never loaded, and a plain self-made note — then applied this change and ran a suite checking every claim above. It **passed**. Run it yourself anytime with `bash verification/run-source-native.sh`.

```
=== PHASE 4a: apply the FULL proven chain in filename order (init → 723 → 725001 → 725002) ===
applied clean ✓  …/20260721000001_init.sql
applied clean ✓  …/20260723000001_owner_scoped_rls.sql
applied clean ✓  …/20260725000001_capture_source_and_inbox.sql
applied clean ✓  …/20260725000002_gather_reference.sql
=== PHASE 4b: SEED the data the new migration will convert ===
seed inserted ✓ (1 bookmark · 1 null-title clip · 1 self-made bit)
=== PHASE 4c: apply the new source migration ===
source migration applied clean ✓
=== truth-check: source table, index/policy, the bit FK, the retired type, the refreshed views ===
source table = true
source_name_ci index = 1
source rls enabled = true
source owner policy = 1
bit.source_id column = true
bit source_url/title dropped = true
bookmark still allowed = false
board_cards exposes source = true
the_ledger exposes source = true
live bookmark rows = 0
=== PHASE 5: source-proofs.sql ===
HOLDS   ✓ 1 zero bookmark rows survive · the seeded bookmark is now a TEXT bit with a non-null link body + a source (name = its captured title, url kept)
HOLDS   ✓ 2 name-fallback: a clip whose title-fetch failed (source_title NULL) got a source named after its URL · a self-made bit got none
REFUSED ✓ 3 source_name_ci: a case-duplicate source name is refused at birth (like tags)
REFUSED ✓ 4a source_id FK: a bit cannot point at a non-existent source
HOLDS   ✓ 4 source_id FK rejects a phantom · deleting a source sets its bits' source_id NULL (the bit survives, loses the stamp)
HOLDS   ✓ 5 grouping (where source_id = X) returns exactly that source's bits — "everything from this source" assembles itself
REFUSED ✓ 6 type='bookmark' is now refused (bit_type_allowed retired it)
HOLDS   ✓ 7 owner (jwt sub = owner uid) reads source rows
REFUSED ✓ 7b a stranger cannot write a source (WITH CHECK owner clause)
HOLDS   ✓ 7 a stranger reads zero source rows (owner-scoped wall)

=== SOURCE STAGE 0 PROOFS PASSED ✓ — zero bookmarks survive · the bookmark converted to a
    linked note + source · name-fallback clean · name_ci refuses dups · FK set-null on
    source-delete · grouping exact · type=bookmark refused · owner-scoped RLS holds ===
```

What each line means, in one breath: **no bookmarks are left**; the one we seeded is now a **normal note with a clickable link and a source**; a clip whose title never loaded got a source **named after its link** (nothing blank); you can't have **two sources with the same name** (case aside); a bit can't point at a **source that doesn't exist**, and **deleting a source keeps the note** (it just loses the "from…" stamp); asking for **"everything from this source"** returns exactly the right notes; a **bookmark can no longer be made**; and the source list is **locked to you** — a stranger reads nothing and writes nothing.

Files: the proof is `verification/source-proofs.sql`, its runner is `verification/run-source-native.sh`, the captured output is `verification/source-proofs.out`.

*(One local-testing detail, so the proof is honest: the real Supabase provides the `auth.uid()` "who is asking" function; a plain local Postgres doesn't. The runner stands one in — a tiny copy reading a simulated login — exactly as it stands in the `anon`/`authenticated` login roles. That's the only stand-in; the table, its rules, the FK behavior and the conversion are pure Postgres, identical to the live runtime.)*

---

## 3. The rules this establishes (proposed for `invariants.md`)

The always-true rules source adds, in the project's `I-x` style — a **proposal** to fold in at sign-off (not added yet). One set, **I-Src**:

- **I-Src1 — Source is optional, one per bit.** Any bit may carry a single `source_id`; blank = self-made. A bit has *many* tags but at most *one* "where it came from." → *kept by the database* (a nullable single FK; the substance rule never names it).
- **I-Src2 — Source is a named vocabulary citizen.** A source is its own row — a `name` (never blank) + an optional `url` — id-referenced like a tag or subtype word; near-duplicate names refused case-insensitively at birth. → *kept by the database* (the `source` table + `source_name_ci` unique).
- **I-Src3 — Rename-once; read once, machine never re-reads.** A source is created at capture (or picked from your list) from the page's title, and the machine **never re-fetches it** — a dead or edited page can't rewrite it. Only *your deliberate rename* changes it, and a rename touches **one row** so every note pointing at it re-labels instantly (id-referenced, P9). This **re-homes the old I-S2** ("frozen at capture"): the machine still never re-reads; *you* may now rename. → *kept by the database* (the FK) + *the one rename function* (app).
- **I-Src4 — Delete-source sets null; the note survives.** Deleting a source lets its notes live on, losing only the stamp — never the words (like deleting a subtype word). → *kept by the database* (`on delete set null`).
- **I-Src5 — Source travels with the bit, and groups it.** Source lives on the bit, so placing a note on a board carries its "from…" along (Principle 8); and *"everything from this source"* is just `where source_id = X` — it assembles itself. → *kept by the database* (the FK + `bit_source` index) + *computed* (the `board_cards` / `the_ledger` join).

**And these older bookmark-only rules go moot / retire** (part of the same invariants edit, so the doc doesn't drift):
- **I-S3** ("a bookmark's source is itself") and **I-S4** ("a bookmark may carry a preview") — **retired**; there are no bookmarks, and I-S4's preview relax is reverted by this migration.
- **I-R3** ("captured-once titles" — a bookmark's page-title) — **moot** for live rows (no bookmarks); the `captured_title` column persists, unused.
- **I-R2**'s per-type face fallback still lists a `bookmark:` branch — it describes a now-**dead but harmless** branch in `bit_face()` (kept on purpose, finding #4). Note it as dead; no function edit.

---

## 4. The scenes, traced to the record

Walk-throughs in `model-scenarios.md` style, so there are no blank cells.

| scene | what happens to the record |
|---|---|
| **A note captured *with* a source** | you jot a quote from *Deep Work* → one **text bit** (`body` = the quote); you pick/enter the source *"Deep Work"* → a **source row** (if new) and the bit's `source_id` points at it. Born on no board → it's **loose** (the inbox). The card shows *"from Deep Work"*. |
| **A bookmark converts cleanly** | *(the migration itself)* a saved-URL bit → a **text note** whose body is a clickable link (`<a href="…">A Good Article</a>`), carrying a **source** named *"A Good Article"* with that link. Its old bookmark-only fields are cleared. Proven: section 2, lines 1 & 6. |
| **Rename a source → every note re-labels** | you rename *"calnewport.com"* to *"Cal Newport"* → **one row changes**; every note pointing at it now reads *"from Cal Newport"* instantly (id-referenced, no fan-out). The notes' own words are untouched. |
| **Delete a source → notes keep their words, lose the stamp** | you delete *"Deep Work"* from your sources list → its `source_id` on every note is set to blank; **the notes all survive**, they just no longer show a "from…". Proven: section 2, line 4. |
| **A note's source travels onto a board** | you place a sourced note on a board → a `placement` row; the source rides on the **bit**, so the card on the board shows *"from Deep Work"* too (`board_cards` now joins source). One note, same source on every board. |

---

## 5. The kinds-count + type-list sweep — *two distinct edits* (finding #4)

This is the count-sweep that's bitten us three times, so it's spelled out precisely. **There are two separate edits; do not conflate them, and grep-verify both.**

**Edit A — record kinds: eight → nine** (a *new kind* is born). The **vocabulary family grows from three to four**: `tag · category · subtype_word · **source**`. Consequently the **table count goes ten → eleven** (source is a new table, alongside the dormant table and the `reference` derived index). Grep-verify and update every count:
- `lexicon.md` **line 5** ("Eight kinds of thing… three families") · **line 9** (heading "The eight stored things… three families") · **line 24** (the dormant/reference parenthetical — reconcile: source is a *stored kind*, not a derived index) · **line 95** (code-names *tables* list — add `source`).
- `agreements.md` **§7 storage map, line 265** ("the **eight record kinds, three families**… vocabulary — tag word · category · subtype word") → **nine**, add `source`; add a value-line for a bit's `source_id`.
- `SPEC.md` **line 11** & **line 19** ("**eight record kinds** + the dormant ninth + one derived index") → **nine** · the **vocabulary bullet** (~line 24, "tag · category · subtype_word") → add `source` · **line 34** ("owner-only on **all ten tables**") → **eleven**.
- `ROADMAP.md` **line 93** ("the **eight record kinds** in three families… vocabulary tag · category · subtype_word… plus the dormant ninth and one derived index") → **nine**, add `source`.

**Edit B — the bit's *type* list: four → three** (a *value* removed, **not** a kind). `type ∈ text · drawing · image · ~~bookmark~~` → **`text · drawing · image`**. Grep-verify:
- `lexicon.md` **line 43** ("type — text · drawing · image · bookmark *(saved URL)*") → drop bookmark.
- `agreements.md` **line 35** (the substance table's `type` row) → drop bookmark.
- `SPEC.md` **line 21** ("`type` ∈ text·drawing·image·bookmark"; and the trailing bookmark `url`/`captured_title`/preview clause) → drop bookmark.
- `ROADMAP.md` **line 11** ("a **bit** (text · drawing · image · bookmark)") → drop bookmark.

---

## 6. The full proposed-edits checklist — to apply *with you* at sign-off (NOT done yet)

None of these are applied. This is the list we walk through together when you approve.

- **`agreements.md`** —
  - **§2a / §1:** record the pivot — **bookmark retired as a concept** (a URL is a *source*, not a saved page); **source = a first-class vocabulary citizen** (its own table, pick-or-create, rename-once, a sources-list; universal on every bit; one per bit); **"save to revisit" = a deliberate tag**, never an automatic bookmark (consistent with the rejected favorites/star, §2e).
  - Fold the D-100 source paragraph (§2a, lines 53–56) into the new model: source is now a **record**, not two frozen text fields; the "bookmark's source is itself" / "bookmark may carry a preview" lines retire.
  - **§7 storage-map row** for `source` (Edit A above) + the value-line for `bit.source_id`.
  - **A14 re-homed** (see parked, below) — reflect it wherever §2a's "later media" note lives.
- **`lexicon.md`** —
  - **Drop `bookmark`** from the type list (Edit B) and reconcile the *"one collision — RESOLVED"* note (line 87–89): with bookmark gone, that note is now history — move its substance to Retired.
  - **Add `source`** (the record) + **sources-list** (the computed surface, your reading list) + the code-name `source` in the tables list.
  - Draw **the fourth organizing axis**: source ("where from") beside tags ("what about"), boards ("where placed"), dates ("when").
  - Kinds-count sweep, Edit A (lines 5, 9, 24, 95).
- **The kinds-count + type-list sweep** — **§5 above, two distinct edits, grep-verified across lexicon / agreements §7 / SPEC / ROADMAP.**
- **`invariants.md`** — add the **I-Src** set (§3); retire **I-S3 · I-S4**, mark **I-R3** moot, note **I-R2**'s dead bookmark branch (§3).
- **`parked.md`** — **A14 re-homed.** Today it reads *"video = a reference (bookmark to Drive/YouTube)."* With bookmark gone, its mechanism is gone. Replace with: **a video is a *source* on a note, or a rich-text link inside a note — not a saved object; the re-entry (the day a video wants to be a placeable/taggable *bit*) is unchanged.**
- **`model-scenarios.md`** — add the section-4 scenes as a *source* trace (captured-with-source; the bookmark conversion; rename; delete; travel-onto-a-board), in the doc's trace style — doubling as the Stage-1 fixtures. Note **S1** (the retreat scene) currently ports videos as *bookmarks* — reword to *sources / links in notes*.
- **`deliberations.md`** — persist the rationale: **why the pivot** (grow-thoughts-not-hoard-consumption; you keep notes *from* sources, not the resource) · **source clones the vocabulary family** (the simpler, single-valued half of the tag pattern — no join table) · **convert-before-tighten** (the load-bearing ordering) · **the name-fallback** (title-fetch can fail) · **the A14 re-home**.
- **`old/`** — **move `capture-build-plan.md` → `old/`** (superseded by `source-and-full-bit-build-plan.md` — it was bookmark-centric). Never resume from it.
- **The regression-suite surgery** — *see the flag in section 7; this is broader than one file* — **to apply when the migration lands on cloud**, not now.
- **A `D-log` entry** (draft):
  > **D-102 — Source made first-class; bookmark retired (Stage 0 model fix, proven-on-a-copy).** Migration `20260726000001_source_first_class.sql`: a `source` table (vocabulary-shaped: name + optional url, CI-unique, owner RLS D-094) + `bit.source_id` (nullable FK, set-null); D-100's `source_url`/`source_title` migrated into `source` records (name-fallback = coalesce(title, url)) then dropped; every `bookmark` bit converted to a text note (a rich-text link) carrying a source, then the type retired (`bit_type_allowed` 4→3, substance branch dropped, reverting D-100's preview relax); `board_cards`/`the_ledger`/`the_inbox` refreshed. Proven on a throwaway DB — `verification/run-source-native.sh` green (zero bookmarks survive · conversion + name-fallback · name_ci · FK set-null · grouping · bookmark-refused · owner RLS). Record kinds **8→9** (vocabulary→4); bit types **4→3**. Supersedes `capture-build-plan.md` (→ old/). Reverses parts of D-100. A14 re-homed (video = source/link, not saved object). *Cloud not yet applied — owner sign-off gate.* (owner + Claude)

---

## 7. Open questions & flags — please read before signing

1. **The regression-suite surgery is broader than the plan says — please confirm the scope.** The plan names the surgery on `verification/capture-proofs.sql` only. But grep shows the bookmark tests are spread across **three** files, and *all of them insert bookmark rows*, which the migration makes impossible — so **all three break the moment the migration lands on cloud**:
   - `capture-proofs.sql` **§2**: remove **2a** (the D-100 "bookmark carries a preview" *accept* — its relax is reverted) and **2e** (bookmark-refuses-a-body — the branch is gone); **keep** 2b/2c/2d (text/drawing/image still refuse stray facts); **add** a "type='bookmark' is refused" test.
   - `attacks.sql`: the "urlless-bookmark refusal" the plan mentions actually lives **here** (A6, lines 88–92), plus a seed bookmark row (line 36) and the bookmark-face tests **C6 / C6b / C6c** (lines 256–291, testing the now-dead face branch). All insert bookmarks → all break.
   - `scenarios.sql`: a seed bookmark row (line 28) in the S1 replay → breaks.

   **This is a real discrepancy with the plan (finding #5 was scoped to one file; it's three), so I did not guess.** My recommendation: treat the surgery as a **single coordinated regression-suite edit across all three files, applied in the same step the migration is applied to cloud** — remove every bookmark insert/accept, keep the still-valid stray-fact refusals, and add one "bookmark refused" attack. **I did not touch any of these files** (guardrail). *Your call: confirm this broader scope, or tell me you want it handled differently.*

2. **`the_inbox` was recreated as a mechanical necessity — confirm the minimal choice.** Dropping the old `source_url`/`source_title` columns is blocked because `the_inbox` (built with `select b.*`) had frozen those columns into itself. So the migration **must** rebuild `the_inbox`. I rebuilt it **unchanged in meaning** (`select b.*`) — it now carries `source_id` (for Stage 3 to join the source) but does **not** pre-join the source *name/url* the way `board_cards`/`the_ledger` now do. That kept the change minimal and in-scope (the plan named only those two views for the source join). **If you'd rather the inbox also expose the source name now**, it's a one-line addition — say so and I'll fold it in. Otherwise Stage 3 joins it when it builds the inbox cards.

3. **Confirm the two deliberate small losses** (both noted in the migration): the `captured_title` slot is now unused on live rows (harmless leftover, later cleanup); and a bookmark that carried a *preview picture* loses that picture's link on conversion (the file becomes an orphan in storage, tidied later) — a converted note is a **link**, not a picture. Neither loses any of *your* words.

---

### What's proven, and what's ahead

**Proven on paper (this checkpoint):** the source list exists, is locked to you, and refuses duplicate names; every bit can carry one optional source; the old provenance fields moved in cleanly (with a name-fallback when a title never loaded); **every bookmark became a normal linked note with a source, and zero bookmarks survive**; deleting a source keeps the note; "everything from this source" is an exact lookup; and a bookmark can no longer be created — all applied cleanly on top of the full proven history. **Still ahead (Stage 1+):** rich text on notes, the source picker, and the **workspace** (a boardless note that's fully itself — editable text, tags, and source), then intake and the views. We can stop after any stage with a real result banked.
