# Gather · G1 — the model on paper → ◆ Gather-Checkpoint A

**For you to sign off.** This is the *model on paper* for **gather** — tying one bit to another **from inside your writing**. While you're writing a thought you type `[[`, pick a bit you made (a quote, a doodle, a note), and a little **chip** for it drops into the sentence. Later, standing on that gathered bit, its page shows **"gathered into: [that thought]"** for free — you never have to file anything. This checkpoint is only the **hidden plumbing** (one new thing in the database) plus the words we'd change to describe it. Nothing here has touched the live site or your real data — it was proven on a private throwaway copy of the database and rolled back. When you say yes, we build the visible parts (the `[[` picker, the chip, the "gathered into" list) on top.

**The one-line promise:** you reach for a bit *while writing* and pull it into the sentence — it feels like **writing, not filing** — and the bit you reached for then quietly knows every thought that reached for it.

---

## 1. What this change does — in plain words

**One new thing gets stored: a "reference."** A reference is a single fact — *"this thought reached for that bit."* It has a **direction**: it points **from** the writing **to** the bit you gathered. That's the whole shape — *from · to · when.*

Five things worth knowing, in plain terms:

1. **You never make a reference by hand.** It's **grown from your writing.** When you drop a chip into a sentence and save, the app reads the chips in your text and makes the references match — add a chip, a reference is born; delete the chip and save, the reference quietly disappears, leaving no trace (exactly like removing a tag). **Your writing is the truth; the reference is just a fast index of it** — it exists so "gathered into" is an instant lookup instead of the app re-reading every note you ever wrote.

2. **It's directed, and that's on purpose.** A reference goes one way: from the thought that reached, to the bit it reached for. "What this thought gathers" and "what gathered this bit" are the **same fact read from two ends** — the "gathered into" view is free, never something you maintain.

3. **You can gather any kind of bit, but you gather *from* writing.** The bit you reach for can be a note, a picture, a doodle, or a saved page. But a reference is always *born from a sentence*, so its starting point is always a **text bit**. (That "the start must be text" rule lives in the app, not in the database — see the honest note in section 8.)

4. **When you destroy a bit, its references clean themselves up.** If you empty a bit from the trash, every reference touching it vanishes automatically — both the ones *from* it and the ones *pointing at* it — so "gathered into" never points at a ghost. (Trashing a bit only hides it, like everywhere else; destroying is the permanent one.)

5. **A chip carries a copy of the bit's name, so you can search for it.** The chip shows the gathered bit's **face** (its headline, e.g. "fire doodle"). We store a copy of that name inside your note so the note is **findable by what it references** — type "fire doodle" in find and the thought that gathered it shows up. This is a small, *knowing* trade against one of our rules ("renames are free — nothing stores a bit's spelling"). It's honest and it self-heals — section 7 explains it plainly.

### The exact database change (the SQL)

This is the entire change — one new table:

```sql
-- reference — a directed tie from a thought's writing to any bit, GROWN from the
-- body on save (never hand-authored). Stored so "gathered into" is a fast read.
create table reference (
  id          uuid primary key default gen_random_uuid(),
  from_bit_id uuid not null references bit(id) on delete cascade,  -- the writing (a text bit)
  to_bit_id   uuid not null references bit(id) on delete cascade,  -- the bit reached for (any kind)
  created_at  timestamptz not null default now(),
  constraint reference_not_self check (from_bit_id <> to_bit_id),  -- a bit can't gather itself
  constraint reference_once     unique (from_bit_id, to_bit_id)    -- one tie per pair; mention twice = one row
);
create index reference_from on reference (from_bit_id);   -- forward: what this thought gathers
create index reference_to   on reference (to_bit_id);     -- backward: "gathered into"

-- Locked to you alone (the same owner-only rule as every other table, D-094):
alter table reference enable row level security;
create policy reference_owner_all on reference for all to authenticated
  using (auth.uid() = '<your owner id>')
  with check (auth.uid() = '<your owner id>');
```

The whole migration file is `supabase/migrations/20260725000002_gather_reference.sql`.

---

## 2. The proof (the green result)

I built a throwaway copy of the real database, applied the proven schema and then this change, and ran a suite that checks every claim above. It **passed**. Run it yourself anytime with `bash verification/run-gather-native.sh`.

```
=== PHASE 4: apply the proven init, THEN the gather migration ===
init applied clean ✓
gather migration applied clean ✓
=== truth-check: the reference table, its indexes, and its owner policy are really there ===
reference table = true
reference indexes = 2
rls enabled = true
owner policy = 1
=== PHASE 5: gather-proofs.sql — round-trip · constraints · cascade · FK · RLS ===
HOLDS   ✓ 1 reference round-trips off its row · export (direct select *) is free · the reverse pair
          is a distinct directed tie · the DB does NOT enforce "from is text" (app-layer guard, by design)
REFUSED ✓ 2 reference_not_self: a bit cannot gather itself
REFUSED ✓ 3 reference_once: the same target mentioned twice reconciles to ONE row
HOLDS   ✓ 4 destroy a bit → its references vanish BOTH ways (as from and as to); other bits untouched
REFUSED ✓ 5 a reference to a phantom TARGET is FK-rejected (derive-on-save can skip dead ids safely)
REFUSED ✓ 5b a reference from a phantom SOURCE is FK-rejected
HOLDS   ✓ 6 owner (jwt sub = owner uid) reads all reference rows
REFUSED ✓ 6b a stranger uid cannot write a reference (WITH CHECK owner clause)
HOLDS   ✓ 6 a stranger uid reads zero reference rows (owner-scoped wall)

=== GATHER G1 PROOFS PASSED ✓ — reference round-trips (directed), constraints refuse,
    cascade fires both ways, phantom endpoints rejected, owner-scoped RLS holds ===
```

What each line means, in one breath: a reference **stores and reads back**; a bit **can't gather itself**; mentioning the same bit **twice makes one tie**, and the reverse direction is a **separate** tie; **destroying a bit wipes its ties both ways** and touches nothing else; a tie to a **bit that doesn't exist is refused** (this is what lets the app safely ignore chips whose bit was deleted); and the table is **locked to you** — a stranger who signed up reads nothing and can write nothing, you read everything.

Files: the proof is `verification/gather-proofs.sql`, its runner is `verification/run-gather-native.sh`, and the captured output is `verification/gather-proofs.out`.

*(One local-testing detail, so the proof is honest: the real Supabase provides the `auth.uid()` "who is asking" function; a plain local Postgres doesn't. The runner stands one in — a tiny copy that reads a simulated login — exactly the way it already stands in the `anon`/`authenticated` login roles. That's the only stand-in; the table, its rules, and the cascades are pure Postgres, identical to the live runtime.)*

---

## 3. The rules this establishes (proposed for `invariants.md`)

The always-true rules gather adds — written in the project's `I-x` style, as a **proposal** to fold into `invariants.md` when you sign off (not added yet). One set, **I-Ref**:

- **I-Ref1 — A reference is directed.** It goes from a source bit to a target bit; forward ("what this gathers") and backward ("gathered into") are one row read from two ends. → *kept by the database* (two columns, `from` / `to`).
- **I-Ref2 — One tie per ordered pair.** At most one reference for a given (from, to); mentioning the same target twice in a body reconciles to one row (both chips still render). The reverse pair is a distinct tie. → *kept by the database* (`reference_once` unique).
- **I-Ref3 — The source is a text bit.** Only writing originates a reference, so `from` is always a text bit. → *kept by the one write door (app)* — a database CHECK can't see another row's type without a trigger, and the schema allows exactly one trigger (see section 8).
- **I-Ref4 — References are grown from the body, never hand-authored.** The body is the single source of truth; the reference rows are its derived index, reconciled on save. There is no "delete a reference" act. → *design + app*.
- **I-Ref5 — Removal is traceless.** Delete the chip and save; the row falls away, leaving no record it existed — like un-tagging. → *app (the reconcile-on-save)*.
- **I-Ref6 — Destroy cascades both ways.** Destroying a bit removes every reference where it is the source *and* every one where it is the target; other bits are untouched. → *kept by the database* (`on delete cascade` on both columns).
- **I-Ref7 — References are in the export.** A reference is a stored record kind, so it joins `/export` and the completeness check — or "you own everything" silently breaks (I-G1). → *app + the I-G1 test*.
- **I-Ref8 — The chip caches the target's face for search/labels, refreshed lazily.** A chip stores a copy of the target's face so notes are findable by what they reference and list-labels read naturally; the copy self-heals on the note's next save/view — no rename fan-out. This is a **knowing carve to Principle 9** (section 7). → *app (lazy reconcile-on-read)*.

---

## 4. The scenes, traced to the record

Walk-throughs in `model-scenarios.md` style — a reference's whole life, so there are no blank cells. "The thought" is a text bit; "the doodle" is the bit it gathers.

### Grid A — a gathered tie, through every step

| step | what happens to the record |
|---|---|
| **gather a bit** | inside the thought's writing you type `[[`, pick the doodle → a chip drops into the sentence. On **save**, the app reads the chips and makes the references match → **one `reference` row**: `from` = the thought, `to` = the doodle, `when` = now. |
| **remove the chip** | you delete the chip from the sentence and save → the reconcile sees the chip is gone → **the row falls away, traceless.** No "delete a reference" button ever existed; you edit your writing, the index follows. |
| **rename the target** | you rename the doodle (write your own words on it) → **nothing rewrites anywhere.** The doodle's own page and any card show the new name **live** (always current). A thought that references it and that you *haven't opened* still shows the doodle's **old** name in its list-label until you next open or save it — then it **self-heals**. (The cache, no fan-out — section 7.) The `reference` row itself is unchanged; it only ever held ids, never names. |
| **trash the target** | you trash the doodle → its "gathered into" and its chips **hide** (trash is outside the world), but **the `reference` row stays** — trash is a freeze, not an erase. The chip in your thought will show a muted "(removed)" until you edit. |
| **restore the target** | you un-trash the doodle → everything comes back exactly; the row was never gone, so "gathered into" is whole again with nothing to rebuild. |
| **destroy the target** | you empty the trash → the doodle's row is gone, and **every reference pointing at it cascades away** (proven, section 2 §4). The dead id may sit in your thought's HTML until you next edit it; the chip renders "(removed)", and the next save drops the dead id (which the database would reject anyway — proven §5). |
| **trash / restore the source thought** | trashing the thought hides it from the world (so it stops appearing under the doodle's "gathered into", which only lists live sources); the `reference` row is kept, and restoring the thought brings it back. |

### Grid B — a mixed-sentence thought through the pull (so the lazy-label window is *seen*, not felt later)

You write a real sentence with a gathered bit inside it:

> *"For the retreat, remember — see `[[fire doodle]]` for the order of the ceremony."*

| where you look | what you see, and why |
|---|---|
| **the thought's own page / a board card** | the chip resolves the doodle's face **live** → reads *"see **fire doodle** for the order."* Always current, because rich surfaces look the id up fresh. |
| **the doodle's page** ("gathered into") | lists this thought as a source, showing the thought's face, click to jump back. Free — computed from the `reference` row's other end. |
| **find / the `[[` picker (list-labels)** | these read the **stored copy** of the name inside the note. So the thought is **findable by typing "fire doodle"** — the payoff. |
| **the lazy-lag window (the honest part)** | if you later rename "fire doodle" to "ceremony sketch" and then look at a thought that references it *without opening it*, its **list-label** still says "fire doodle" and it's briefly not findable by "ceremony sketch" — **until you next open or save that thought**, which heals it. Usually current; always self-heals on touch; may lag on untouched notes. (This is the eventual-consistency you already accepted, section 7.) |

### Grid C — two devices (free coherence)

| step | what happens |
|---|---|
| **edit the same thought on phone and laptop** | the body is resolved **last-arrival-wins**, whole-record (the existing §2d rule) — one body wins. |
| **the references** | because references are **grown from the winning body** on save, they can never disagree with it — the losing edit's chips simply aren't in the body that won, so they aren't in the index. **Free coherence, nothing special to reconcile** (§2d). |

Grid A's destroy/cascade cells and the FK cells are proven by `verification/gather-proofs.sql` (sections 4 and 5); the round-trip and directedness by section 1; the owner-only wall by section 6. The rename/lazy-label and two-device cells are **design consequences** (they live in app behavior, built at G2/G3) — traced here so the model is whole on paper.

---

## 5. The §6 change — drafted for your approval

Today `agreements.md` §6 says (2026-07-20): *"v1 stores **no record whose two endpoints are both bits**"* and *"the empty [dormant] table stays in the schema, dormant and nameless."* Gather changes the first half and **keeps the second**. Here are the actual sentences proposed to add to §6 — **your call to approve:**

> **§6 amendment — gather (2026-07-25).**
>
> 1. **A stored bit→bit fact now exists — but a *directed, grown* one.** Gather adds a `reference`: a **directed** tie from a text bit's writing to any bit, **grown from the body on save** (never hand-authored). It is a *materialized index* of ties the writing already expresses — the body stays the single source of truth — so "gathered into" and the future graph are fast reads. This is a different animal from the pair-tie §6 waived, which was **symmetric and hand-drawn** ("these two relate," no direction, no writing).
> 2. **The dormant table stays parked — for the *symmetric* A2 case only.** `reference` does **not** cover A2. The dormant table was built for the direction-less, writing-less pair-tie (two bits that relate with no sentence to hang the tie on, e.g. two doodles). That case still has no home, so the dormant table keeps sleeping under its A2 re-entry condition, unchanged.
> 3. **Relatedness is now three ways, not two.** Two bits relate through a **shared middle** (a tag or a board — §6's "introduction"), *and now* through a **thread you tie on purpose** inside a sentence (a reference). The **connector** (§6a) stays a distinct third thing — pure board arrangement, still storing no bit↔bit fact.

**Standing, stated honestly:** this is **owner-authority-ahead-of-evidence** — the *same kind of ruling as D-087* (the optional text-bit title, which you ruled in by want, not by an evidence gate firing). §6's own re-entry condition ("the first real miss") has **not** fired; gather is want-driven ("I do want this for sure"). We record it as your ruling, **not** dressed up as the evidence gate. That's the legitimate path (latest ruling wins), and the record says so plainly.

---

## 6. The philosophy line — yours to write

The current philosophy has a line that's now outgrown (paraphrased): *"a direct thread from one thought to another may come someday — I haven't missed it yet."* Once gather ships, that's no longer true.

I am **deliberately not writing its replacement** — the philosophy is in your voice. The **spirit** of what should go there:

> *thoughts connect three ways: shared words, shared places, and threads I tie on purpose.*

At sign-off, you write the actual line. (Flagged as owner's-voice work, per the resumption notes.)

---

## 7. The Principle 9 carve — a knowing trade, named out loud

Principle 9 says: *"renames are free — nothing stores a bit's spelling."* Gather introduces a **named exception**, and we should record it as a **trade**, not smooth it into "no-drift":

- **The trade:** a chip stores a **copy** of the gathered bit's face (its name) inside the referencing note. We do this for one concrete payoff — **you can find a note by what it references** (type "fire doodle," the thought that gathered it appears). Postgres search can only find a note by words *in that note*, so those words genuinely have to be copied in. That's the price, and it's worth it for the Obsidian-like *search-by-referenced-words* feel.
- **Why it isn't a maintenance nightmare:** the copy **self-heals lazily** — a note re-copies the current name whenever you next **open or save** it. **Renaming a bit rewrites nothing elsewhere** (no fan-out over your notes). The cost: a note you neither open nor edit can show a **renamed target's old name** in its list-label, and be briefly unfindable by the new name, **until you next touch it**. Rich surfaces (the bit's page, cards) always resolve the name **live**, so what you're actually looking at is current.
- **What we explicitly rejected:** *actively rewriting every referencing note on rename* (fan-out). It would mutate notes you never touched, lie about when they were last edited, and is exactly the "maintain a surface by hand" that our compute-don't-maintain rule forbids. Parked (see section 9) unless the lazy staleness ever genuinely annoys you.

Proposed for both `agreements.md` (as a §-carve, the way P10 and §2c were carved in the soundness pass) and `invariants.md` (I-Ref8), worded as a trade.

---

## 8. Honest scoping — what G1 does *not* cover

Two things in section 1 are **app-code concerns**, and there is **no app code at G1** — this checkpoint proves the **database-level facts only**. Flagging both so nothing looks more done than it is:

- **"The start must be a text bit" is guarded in the app, not the database.** A database CHECK can't see another row's type without a trigger, and the schema deliberately allows **exactly one trigger** (the `updated_at` stamp) and nothing else — a "database with no secrets." So this rule lives in the one write door when we build it (G2), with a proof that attacks it. G1 actually **proves the database does *not* enforce it** (proof section 1) — so the boundary is visible and honest, not hidden.
- **The export must learn the new table.** The `/export` route has a hardcoded list of tables; a new kind must be added to it or your backup silently omits it (I-Ref7 / I-G1). That's a **one-line app edit** (add `"reference"` to the `TABLES` array in `src/app/api/export/route.ts`) that lands with G2 when we touch app code — it is on the checklist below, not done now. G1 proves the *database* fact that a plain `select *` reads the reference row (so export will carry it once the line is added).

---

## 9. Proposed edits to the canonical docs — to apply *with you* at sign-off (NOT done yet)

None of these are applied. This is the checklist we walk through together when you approve, so the seed-of-truth docs stay in step.

- **`agreements.md`** —
  - **§6:** add the **amendment** drafted in section 5 (the directed `reference` exists; the dormant table stays parked for A2; relatedness is three-way), recorded as owner-authority-ahead-of-evidence (D-087 precedent).
  - **§7 storage map (line 251, layer A):** add a row for `reference` — the **first *derived index***: stored in layer A but layer-E-natured (rebuildable from bodies), exported for completeness.
  - **The Principle 9 carve** (section 7), worded as a trade.
- **`lexicon.md`** —
  - The **verb** `gather` · the **record** `reference` (a derived index) · the **surface** "gathered into"; **retire** "backlink" and "pull in" (the latter collides with *the pull*).
  - Draw the **three-way line**: *arrow* = arrangement on a board (connector) · *reference* = gathered-into · *tag / board* = shared middles.
  - Code-names (line 88): add `reference` to the tables list; note the chip's cached-face field.
- **The kinds-count + family sweep** (the "six → eight" species count, **now due a third time**). `reference` fits **no existing family** — it's the **first derived index**. Phrase every count to name the new *nature*, not just bump a number: **"eight record kinds in three families + the dormant ninth + one derived index (`reference`)."** Grep-verified spots:
  - `lexicon.md` **lines 5, 9** ("eight kinds … the whole database") · **line 24** (the dormant-ninth parenthetical).
  - `agreements.md` **line 251** (the storage-map row above).
  - `SPEC.md` **lines 11, 19** ("eight record kinds + the dormant ninth" → add the derived index) and **line 32** ("owner-only on all **nine** tables" → **ten**).
  - `ROADMAP.md` **line 93** ("the eight record kinds … plus the dormant ninth" → add the derived index). ⚠ *Interaction to flag:* the capture checkpoint already proposes bumping **views** nine → ten at SPEC line 26 and ROADMAP line 93 (`the_inbox`); gather bumps the **tables/record-kinds** count at the same two docs. Apply both — one is views, one is kinds; they don't conflict, but they touch neighboring text.
- **`invariants.md`** — add the **I-Ref** set from section 3 (a new cluster, e.g. "Cluster 7 — gather: references"), including **I-Ref8** (the P9 carve).
- **`parked.md`** —
  - **A2 (the pairwise link / dormant table):** mark **unchanged — gather does NOT absorb it** (contrast capture, which absorbed A6). The dormant table still waits for the *symmetric, writing-less* miss; its re-entry condition stands.
  - New **doors named now so they don't surprise later** (A6-style build-notes): **board-gathering** (if gathering *into a board* ever fires, `to_bit_id` becomes the house exactly-one-target pair `to_bit_id`/`to_board_id` + a CHECK — a small migration then) · **active rename-propagation** (the fan-out we rejected in section 7 — parked unless the lazy staleness annoys) · **"(removed)" reveals a trashed bit exists** — fine owner-only, revisit at the sharing phase · **storage format for word-forward writing** (Markdown vs HTML) — decide *with* document mode (A1/E); gather is built format-agnostic so it carries over either way.
- **`model-scenarios.md`** — add the grids in section 4 as a gather scene (the tie's life; the mixed-sentence thought through the pull; two-device), in the doc's trace style. These double as G2/G3 test fixtures.
- **`src/app/api/export/route.ts`** — the **one-line edit**: add `"reference"` to the `TABLES` array (I-Ref7 / I-G1 export completeness). *App code — lands with G2, not now (section 8).*
- **`deliberations.md`** — persist the design-rationale essence (still open from the resumption notes' doc-census rule): **make-then-render** order · **body-as-truth, rows-derived-on-save** · the **directed-vs-symmetric split** (why `reference` is its own table and `dormant` sleeps) · the **text→text cycles-are-safe** reasoning (safe *only* while chips render faces, never live content — load-bearing against any future "show gathered content inline" proposal) · the **document-mode adjacency** note (inline gather is §6b's call-in minus ordering/split-merge; watch, don't build — document mode is its own Plan E) · the **two-device free-coherence** note · and the **Principle 9 carve**.

---

### What's proven, and what's still ahead

**Proven on paper (this checkpoint):** a reference stores, reads back, and exports; it is directed (the reverse pair is a distinct tie); a bit can't gather itself; the same pair twice is one row; destroying a bit wipes its references **both ways** and nothing else; a tie to a non-existent bit is refused (so the app can safely skip dead ids); the table is locked to you (a stranger reads zero, writes nothing); and the whole thing applies cleanly on top of the proven schema. **Still ahead (later stages, later checkpoints):** the `[[` picker and the chip in the editor (G2 — Gather-Checkpoint B), and the "gathered into" list with live chip rendering and the lazy self-heal (G3 — Gather-Checkpoint C). The **graph picture** stays parked and is picked up separately (its findings preserved in the plan). We can stop after any stage with a real result banked.
