# Capture — Build Plan (web clipper · loose bits · the inbox · call-in)

**What this is:** the full plan for the collecting front door. It grew, deliberately, from "add bookmarks" into the coherent thing it actually is: **capture** (page / quote / image, each remembering its source) + **loose bits** (a bit with no board — the principle the app states but never honored) + **the inbox** (the browse surface for loose bits) + **call-in** (placing an existing bit onto a board — defined in the lexicon, never built). Each piece needs the others; together they close the loop: **catch → inbox → triage → arrange.**

**Vision:** collect what you read without friction; every clip keeps a **link home** (a quote is always citable); nothing has to be filed at the moment of catching — arranging happens later, in your strong mode. *Great functionality, discovered as we build.*

**Success feel:** saving a page from anywhere is one action; the inbox shows your loose pile visually; putting a loose bit on a board takes two taps; a quote always shows "from …" and the link works.

## What changed in this revision (a review pass, folded in)

A close review caught things worth fixing **on paper, before any of it touches the cloud**. All of it lands at **Cap-Checkpoint A** (the model on paper), so nothing here is derailed — the plan just got more correct:

- **The database currently forbids a bookmark from carrying a preview image.** I'd guessed it was allowed; I checked the actual rule (`init.sql` lines 219–221) and I was wrong — I'd flagged it to verify, and the flag caught it. Slice 1's migration now relaxes that rule, and the safety-test suite consciously flips one case: a bookmark-with-a-picture goes from *rejected* to *accepted*.
- **A hole in "loose":** a bit whose only board is in the trash would have vanished — not on a board, not in the inbox. Fixed: "loose" now means *no board that actually shows it* (the same rule the boards already use), and the bit itself must be live.
- **Safety on the fetches** we make to grab a page's title/preview (https only, no private addresses, size + time caps).
- **A saved page's title is stored once, not twice** (it uses the existing title field; the "source" fields are for clips only).
- **The save endpoint is shaped so the future iPhone Shortcut can reuse it** — without building the phone path now.
- **My own three second looks:** the **inbox's visual design** needs a real pass (it's a browse surface — the one kind the project says to sweat, *"or returning fails"*); a clip should show its **source's title**, not a bare domain; and **saving the same page twice makes two cards** (a deliberate v1 choice, said out loud so it doesn't read as a bug).
- **Small sweeps:** the "nine views" count becomes **ten** *if the inbox lands as a view*; a light rate-limit named; bookmark previews stored so the card's thumbnail path just works; slice checkpoints renamed **Cap-A…Cap-D** to stop colliding with other plans' letters.

**You don't have to build all five slices to win:** Slices 1–3 (bookmarks + inbox + call-in) already dissolve the daily *"everything lands in Apple Notes, filed later"* friction. We can stop after any slice with a real result banked.

---

## Decisions already made (owner, 2026-07-25)

| # | decision | ruling |
|---|---|---|
| 1 | Bookmark cards | **visual** — preview image + extracted title + link; **title editable** (the existing your-words-override-the-face mechanism; the source link itself stays frozen) |
| 2 | Where captures land | **loose + the inbox** (the bigger vision) — NOT a magic "inbox board." Captures and quick-adds are born loose; the inbox shows them; call-in arranges them |
| 3 | Extension auth | **personal token** — create-only, revocable, pasted once into the extension |
| 4 | Video / big files | stay **bookmarks** (ruled earlier; unchanged) |
| 5 | Search-by-source | **not v1** (it means rebuilding a generated search column — clean later add). Source is *displayed*, not searched |

---

## How it fits the app (the reconciliation — read before building)

- **No new record kind.** Page = `bookmark` · quote = `text` · image = `image` — existing types. The eight-kinds ontology is untouched.
- **"Loose" is computed, not stored.** A bit is loose ⇔ it has **no placement that would *render* it** — i.e. no `left_at`-null placement *on a board that isn't trashed* (the exact conjunction `board_cards` already uses), **and the bit itself is live**. No flag, no new column — the placements already tell us. This closes a hole the review caught: a bit whose only board is trashed keeps a `left_at`-null placement (trash logs no departure), so a naive "any active placement" test would file it *nowhere* — invisible on boards and absent from the inbox. Corollary of pure symmetry: **un-placing a bit from its last board returns it to the inbox** automatically — and so does trashing its last board; restoring that board pulls it back out. The inbox is a query (or a tenth view — Cap-Checkpoint-A decision), not a state.
- **This finally honors the model's own principle** — *"the bit is the atom; it needs no board"* — which the app currently violates by forcing every bit onto a board at creation. Creating-loose is the small unlock (the schema has always allowed it; only the app insists).
- **Call-in must reuse the membership row.** `placement` carries `UNIQUE (board_id, target_bit_id)` — the durable membership row survives un-place (travel history). So calling a bit onto a board it once left must **clear `left_at` on the existing row** (never insert a duplicate — it would 23505). This is the exact latent gap flagged in the D-093 review (finding #5, "no re-place path exists"); call-in is where it gets built right. **Landing spot is already ruled** (agreements): *"a called-in bit lands where you dropped it — center if summoned without a pointer."*
- **The face is untouched.** A quote's face = its words; a bookmark's = its (editable) title. **Source is quiet metadata** ("from …"), never the headline. `bit_face()` does not change.
- **A capture is a normal bit** — places, tags, trashes/restores, exports, and (when connections ship) gathers, with zero special-casing.
- **Media reuses the pipeline.** A clipped image runs the same store→thumb path as an uploaded photo. A bookmark's preview lives in the same `storage_path`/`thumb_path`. *(**Verified against the migration:** the `bit_substance_matches_type` bookmark branch today requires `url` **and forbids `storage_path`** (`init.sql` lines 219–221) — so a bookmark preview is **refused by the DB as the schema stands**. Slice 1's migration amends the bookmark branch to require `url` and **permit** `storage_path`; the attack suite consciously flips — "a bookmark with a stored file" moves from must-refuse to must-accept. My earlier "it appears to permit" was a wrong guess, caught by the flag before the schema had to.)*
- **One door.** All new reads/writes in `lib/db` / server actions; page-meta and image fetches are **server-side** (browsers block cross-site fetches).
- **Security — one new surface.** The `/api/capture` endpoint is the only place capture reaches the DB from outside the login wall. It is **token-gated and create-only**, and it is `admin.ts`'s first real caller (the endpoint has no user session, so it writes via the service-role client — which bypasses RLS — hence: minimal, insert-only, never reads). Worst case for a leaked token: junk in your inbox — never data exposure. Token = a long random secret in a Vercel env var, pasted once into the extension; rotate to revoke. A **light rate-limit** (a per-minute counter keyed on the token) blunts a leaked-token flood.
- **The capture endpoint is shaped like the ruled iOS path.** Its payload is deliberately generic — `{kind, url?, title?, body?, source_url?, source_title?, image?}` — so the **parked phone Shortcut (B1)** can post to the *exact same door* later (SPEC §6: Shortcut → bearer token → insert-only). We **shape for** that convergence now (near-free); we do **not** build the phone loop here — it stays parked. **`image` is a URL in v1** (the server fetches it, SSRF-guarded). A phone photo has *no* public URL, so B1's **named extension point** is to send bytes, or exchange the token for a signed upload URL (exactly SPEC §6's "resize before POST, or a signed upload URL") — the door left genuinely open, not built now.
- **Server-side fetches are SSRF-guarded.** `fetchPageMeta` and the og:image / clipped-image fetches all hit a user-supplied URL from the server: https-only · block private/loopback ranges · redirect cap · timeout · size cap · image content-type check for image fetches. Proportionate hygiene, not a fortress (small blast radius on Vercel).
- **Source is read-once** — snapshotted at capture, never re-read (the same storage-test principle as `captured_title`: a dead or edited page must never mutate what you filed).
- **A bookmark's source is itself — so it uses `captured_title` and leaves `source_*` null.** Only **clips** (a quote or image lifted *from* a page) carry `source_url`/`source_title`; a whole-page bookmark stores its title **once**, in the existing `captured_title`, never twice. (The display rule `source_url ?? url` already lands right: a bookmark shows its own `url`.)
- **Connections stay orthogonal** — "where it came from" (source) vs "what I gathered it into" (reference) are different facts; no interaction.

**Net new model:** two optional columns (`source_url`, `source_title`) + one constraint relax (bookmark may carry a preview) + possibly one view. Everything else is app-layer + reuse.

---

## The model change

```sql
-- 1. two provenance columns (additive; the substance constraint doesn't mention them)
alter table bit add column source_url   text;  -- where this was captured from (null = self-made)
alter table bit add column source_title text;  -- the source page's title, frozen at capture

-- 2. let a bookmark carry a preview image (today its branch forbids storage_path)
alter table bit drop constraint bit_substance_matches_type;
alter table bit add  constraint bit_substance_matches_type check (
  case type
    when 'text'     then body is not null      and strokes is null and url is null
                          and captured_title is null and storage_path is null
    when 'drawing'  then strokes is not null    and body is null and url is null
                          and captured_title is null and storage_path is null
    when 'image'    then storage_path is not null and body is null and strokes is null
                          and url is null and captured_title is null
    when 'bookmark' then url is not null and body is null and strokes is null
                          -- storage_path NOW PERMITTED (preview image); was: `and storage_path is null`
    else true
  end
);
```
- **Why not reuse `url`:** `url` is a bookmark's **target** ("this bit IS a link"); `source_url` is any bit's **provenance** ("this came FROM a link"). Displayed source = `source_url ?? url`.
- **The one constraint change:** the bookmark branch drops `and storage_path is null`, so a bookmark may hold a preview. `bit_media_facts_only_with_file` (the file-metadata guard) is untouched and still governs the preview's own facts. The source columns need no constraint change.
- Export is free (`/export` selects all bit columns). Face + search untouched in v1.
- Additive-plus-one-relax migration on the proven schema · `verification/` extended (the attack suite flips the bookmark-with-file case) · re-proved.

---

## The slices (each ships value; owner checkpoint where feel matters)

### Slice 1 — Model on paper → ◆ Cap-Checkpoint A *(nothing touches the cloud until sign-off)*
- The migration above — **two source columns + the bookmark/`storage_path` constraint relax** (+ decide: inbox as a **view** `the_inbox` matching the house views style — **`security_invoker` on, like every house view, so owner RLS applies and the posture can't drift** — or a lib query; lean **view**, it's a computed surface and that's what views are here).
- **Invariants (I-S/I-N set):** source optional · frozen at capture, never re-read · any bit may carry it · a **bookmark** leaves `source_*` null (its source is itself; uses `captured_title`) · a bookmark may now carry a preview file · `url` stays the bookmark target · **loose = computed** = no placement that would *render* (active + board live) with the bit itself live · call-in reuses the membership row (never duplicates) · a called-in bit lands where dropped / center default (already ruled).
- **Scenes traced (every cell — create · edit · place/call-in · un-place · trash · restore · destroy):** save a page → it's loose → inbox shows it → call it onto a board → it lands center → un-place it → back in the inbox · **trash the only board a bit sits on → the bit returns to the inbox** (the hole the review caught) → restore the board → it leaves the inbox again · clip a quote (source shown, link works) · trash a loose bit (leaves inbox; restorable) · re-call a bit onto a board it once left (row reused, travel intact).
- **Records same session:** agreements (loose/inbox/call-in/source rulings) · lexicon (**inbox** · **loose** · **clip** · **source**; *call in* exists) · invariants · model-scenarios · parked (**A6 "loose-bits drawer" fires — absorbed by the inbox**; quick-add lands) · ROADMAP reconcile (Phase-5 capture arriving by owner's want; the phone/offline loop stays parked) · **if the inbox lands as a view: the "nine views" count → "ten" everywhere it's load-bearing prose — SPEC §2 line 26 (count **and** its named list, add `the_inbox`) + ROADMAP §4 line 93 (standing count-sweep lesson); if it lands as a lib query the count stands**.
- **Proofs:** source round-trip · **constraint: a bookmark-with-file is now accepted, and the other three kinds still reject a stray `storage_path`/`url`** · export includes source · the inbox view returns exactly the loose (includes the trashed-board bit; excludes the trashed bit).

### Slice 2 — Bookmarks + the inbox → ◆ Cap-Checkpoint B
- `fetchPageMeta(url)` server action: `<title>` + `og:image` + favicon. Fail-safe: fetch fails → bookmark still saves, URL as face. **SSRF-guarded** (see reconciliation): https-only · block private/loopback ranges · redirect cap · timeout · size cap.
- **Preview storage:** fetch the og:image bytes **server-side** (same SSRF guards + **image content-type check**), cap (~4 MB), store via the standard two-path shape — **write both `storage_path` and `thumb_path`** so the card's existing thumbnail path renders with no special-casing. *(Pragmatic v1: store as-is — og:images are pre-sized; revisit downscale only if weight shows. One code path for in-app and extension.)*
- `createBookmarkBit` (loose by default — **the first boardless create**; on a board only when made from a board's "+ link"). Sets `captured_title` from the page; leaves `source_*` null.
- **"+ link"** on the board toolbar (lands on that board, like + note) **and** on the inbox (lands loose).
- **The inbox page** (`/inbox`): your loose bits, newest first, **visual**. ⚠ **This is a *browse surface* — the one kind the design stance says must be *deliberately designed* ("or returning fails").** It earns its own design pass — a real mockup, not a bare list: image-forward density, how a wall of mixed loose bits (previews / thumbnails / first words) actually reads, the triage moves. *(Treat this as the slice's real risk, not the plumbing.)* Per bit: open · tag · **place on a board…** (arrives Slice 3; disabled affordance till then) · trash. **Quick-add bar at top: jot a note / paste a link → born loose.** Nav gains **inbox** everywhere.
- **Bookmark card** on boards (`CardVM` + `card.tsx` gain `bookmark`): preview (or favicon+domain) + title + **open ↗** (tap still selects; open is its own control). Title editable like any caption (ContentLine). Bit page shows source line.
- **Accept-when:** paste a URL → a visual bookmark in ≤2 steps, title editable, open↗ works, broken links still save; a quick-add note appears in the inbox; the inbox reads as *your loose pile*, visually — and has been through a real design pass, not shipped as a bare list.

### Slice 3 — Call-in (the keystone) → ◆ Cap-Checkpoint C
- `callInBit(supabase, {bitId, boardId, x?, y?})` — **update the existing membership row** (`left_at = null`, new position) **else insert**; center-of-view default (the ruled landing).
- From the **inbox**: "place on…" → board picker → lands center → tap through to arrange. From **find** and the **bit page**: same affordance (cheap once the picker exists).
- This also closes the D-093 latent finding #5 (the missing re-place path) — record that.
- **Accept-when:** inbox → two taps → the bit sits on the chosen board at center, travel history intact; calling a bit back to a board it once left works (no duplicate-row error); un-place returns it to the inbox.

### Slice 4 — Clips: quote + image
- **Quote** → `text` bit, body = selection as a blockquote, `source_*` set → text card + a **"from *[source_title]* ↗"** line — the article's title, linking to `source_url`; a bare domain only as fallback when there's no title (attribution wants the title, not just the host). Card + bit page.
- **Image** → server-side fetch (SSRF-guarded, as Slice 2) → media pipeline → `image` bit + `source_*` → image card + the same source line.
- Built as creation + rendering (API-testable); the *gesture* arrives with the extension.
- **Accept-when:** a quote shows words + a working "from *title*"; a clipped image shows picture + "from"; both loose → inbox → call-in like anything else.

### Slice 5 — The browser "save to world" button → ◆ Cap-Checkpoint D
- Manifest-v3 extension (its own small folder in the repo; **loaded unpacked**, personal): popup + context menus — save **page** / save **selection as quote** / save **image**. Options page holds the pasted token.
- `/api/capture`: validates the token (constant-time compare against the env secret), **insert-only** via the admin client, creates the right bit kind loose, returns ok. Payload is **generic and Shortcut-shaped** (`{kind, url?, title?, body?, source_url?, source_title?, image?}`) so the parked iOS Shortcut (B1) can reuse the *exact* endpoint later. **Rate-limit:** a light per-minute counter keyed on the token.
- **Accept-when:** on any page: one action → the page/quote/image is in the inbox with source intact; a wrong token is rejected; the endpoint cannot read anything.

---

## Model-safety gates (run at Slice 1, re-checked each slice)
1. Invariants named (I-S source · I-N loose/call-in). 2. Trace source + looseness through create · edit · place/call-in · un-place · trash · restore · destroy — no blank cells. 3. Lowest layer: columns + the placement UNIQUE already enforce; call-in logic lives in ONE db-module fn. 4. One source of truth: source frozen; looseness computed from placements (never a flag). 5. End-to-end proofs: test-port additions (source round-trip · boardless create → inbox → call-in → un-place → inbox) + verification/ + RLS lock re-run.

## Honest sizing
Five slices, each modest; together the biggest coherent feature since the port (it deliberately swallows three parked/latent items: A6 loose-bits, the re-place path, quick-add). **Slices 1–3 (bookmarks + inbox + call-in) already dissolve the daily pain** — the "everything lands in Apple Notes, filed later" friction — so we can pause after any slice with a real result banked; the *gesture* (Slices 4–5) is last because everything it needs exists by then.

## Chosen for v1 (conscious defaults, not omissions)
- **No dedup on re-save** — saving the same page twice makes two bookmark cards (a clip is a clip; trash a dupe). Silent dedup can feel broken; we keep it honest and simple.
- **No quick-tags at capture** — triage-later (tag in the inbox) covers it; capture stays one action (D-022 stance).
- **Source is displayed, not searched** (owner decision 5).

## Deferred, on the record
Search-by-source · full-page archiving · board-side "summon" picker (call-in from a board's toolbar — cheap later; inbox-side first) · phone/offline capture loop (parked B1, separate) · store-published extension · inbox count badge.
