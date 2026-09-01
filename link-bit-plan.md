# The link bit — plan

**Status:** ✅ BUILT + owner-verified (2026-09-01, D-129). Migration proven (run-link-native.sh,
7 refusals + 6 checks) → owner's cloud paste ✓ → all three app pieces built (capture+intake ·
renders/widenings · board-paste door) → owner feel-tested on a board (thumbnail · title · click).
Post-build field fix, proven: YouTube via its official oEmbed (og tags sit ~700KB deep); 1MB read
cap; bot-walled sites degrade to the URL card by design. Ruling recorded: agreements (D-129) ·
lexicon (link revived, one meaning) · invariants (I-R2/I-R3 lines) · parked A25 (embeds + re-fetch)
· D-log · deliberations. Local + committed; deploy owner-gated.

---

## Part 1 — Conceptual

### The ruling (to be recorded in agreements/lexicon/D-log on close)
**A link can be a bit** — a first-class `link` type beside text/drawing/image/audio/pdf. The thing
pointed at (an album, a video, an article) is *material*, placed and arranged like any bit. This
**partially supersedes D-102**: D-102's source model **stands untouched** (a URL with your words is
still a note-with-source; sources stay first-class); what returns is the *saved-page object* D-102
retired — with its hoarding worry answered structurally: a link bit is always a **deliberate paste**,
never an auto-save, and "save to revisit" remains a tag, not a default. The word **link** (currently
zero live meanings, lexicon) is revived to name it.

### The anatomy — a link bit is an image bit whose image is a webpage
- **Substance:** the `url` (required, immutable — it IS the substance, like an image's pixels) +
  what one read-once fetch found: `captured_title` + a stored copy of the page's card image
  (`thumb_path`) + the site's name. Read ONCE at save (the ruled read-once principle) — a dead or
  changed page never rewrites the card.
- **Caption:** `content`, optional, like a photo's — offered right after the drop (WordsOffer).
- **Face** (headline): your caption → else the fetched title → else the URL. (The schema's dormant
  bookmark face-rule, revived for `link`.) Search stays wider than the face — it already indexes
  content + body + **url + captured_title** (D-088; confirmed live in the current `search_tsv`).
- **No body** — like every non-text bit. Longer thoughts = a note that **gathers** the link bit, or
  a note carrying the URL as a **source**. The division: *the thing itself* (link bit) vs *my
  thought about it* (note + source).
- Tags · boards · pull · trash/restore/destroy · gather — standard; it's a bit.

### The capture rule — "what you give is what it becomes" (owner-blessed)
- **A bare URL alone → a link bit.**
- **Words + a URL → a note carrying it as a source** (unchanged D-102 path).
- No mode picker; intent is read from what's pasted.

### The scenarios — including the missing-metadata ones (the owner's emphasis)
| scene | what happens |
|---|---|
| Spotify album pasted | card with the **album art** + title; caption optional |
| YouTube video pasted | card with the **video thumbnail** + title |
| article pasted | headline + header image |
| page with **no card image** | a quiet **title card** — title + site name on the plain ground; still a nice object |
| page with **no title either** (or fetch blocked: paywall, bot-wall, timeout, 404) | a **URL card** — the site's name large, the path faint. **Capture NEVER fails** — the fetch failing only means a plainer card |
| image too big / not really an image | skipped → title card (size-capped, content-type-checked) |
| `http://`-only or unfetchable host | saved as given, URL card (the fetcher is https-only + SSRF-guarded — that guard stays) |
| same URL pasted twice | **two link bits — duplicates allowed**, like two copies of a photo (no dedupe; bits are material, not a registry) |
| the pre-D-102 bookmarks (now notes) | **stay notes** — no back-migration; history is settled |
| wrong URL pasted | trash it, paste again (URL not editable in place, v1) |
| caption added later | face switches to your words; title still searchable |
| destroy | removes the stored card image (destroy already cleans `thumb_path` with no `storage_path` — verified `bits.ts:348`) |

### Display (v1 — owner-blessed): the card, not the embed
Board card = the image (cover-fit) with a quiet title strip + site name; caption/source in the
below-panel like other media (Phase-2b pattern). No inline players in v1 (iframes/tracking/weight);
a play-in-place embed is a later, separate call — parked with a named re-entry ("the card leaves the
owner wanting play").

---

## Part 2 — Technical (grounded in the code)

### Migration `20260901000001_link_type.sql` — SMALL (audio/pdf pattern)
- `bit_type_allowed`: + `'link'`.
- Substance branch: `when 'link' then url is not null and body is null and strokes is null and
  storage_path is null` (thumb_path optional — the stored card image; `captured_title` nullable).
  The dormant `url`/`captured_title` columns revive; every other branch already forces them null.
- `bit_face`: the function still carries `when 'bookmark' then coalesce(captured_title, url)`
  (init.sql:53) — replace with `when 'link' …` (same rule, live name; recreate the function; views
  reading face need no change if the function signature is unchanged — verify which views call it).
- **NO search change** — `search_tsv` already indexes url + captured_title (audio migration:76-78).
- **Check init.sql's media-facts constraint (~:230)** — if it ties `thumb_path`/dims to
  `storage_path`, the link branch needs it relaxed (thumb-without-file). Resolve at build, prove on
  the throwaway.
- Prove on throwaway PG17 (`verification/run-link-native.sh` + `link-attacks.sql`): a link with a
  stray body/strokes/storage REFUSED · a url-less link REFUSED · face = content → title → url ·
  search finds by url + title · full suite green. Owner cloud paste (`apply-link-to-cloud.sql`,
  transaction-wrapped, single-line statements) BEFORE deploy.

### The fetch (extend `src/lib/page-meta.ts` — the guards stay)
- `PageMeta` gains `image: string | null` (og:image, both attribute orders — same regex pattern as
  og:title) + `siteName: string | null` (og:site_name, else the hostname).
- New `fetchImageBlob(url)` (same file or `link-preview.ts`): SSRF-guard the **image** URL with the
  same `safeUrl`/private-host re-check after redirect · content-type must be `image/*` · streamed
  size cap (~4MB) · timeout. Returns bytes + mime, or null — never throws to the caller.

### Create (server-side, one door for every surface)
- `createLinkBit` in `src/lib/db/bits.ts`: insert `{type:'link', url, captured_title, thumb_path?,
  mime?, byte_size?}` (media dims null — the card uses cover-fit, no dims needed server-side).
- Server action `captureLink(rawUrl)` in `src/app/bits/actions.ts`: normalize → `fetchPageMeta` →
  `fetchImageBlob(meta.image)` → `uploadObject` to the private bucket (`link/{bitId}/card.jpg…`) →
  `createLinkBit` → revalidate `/bits`. Any fetch failure degrades (null title/thumb), never blocks.
- **Intake** (`addToInbox`, actions.ts:36): the `looksLikeUrl` branch flips from note-with-link to
  `captureLink`. Words+URL path (source intake) UNCHANGED. The sticky source is NOT auto-applied to
  a link bit (its provenance is itself; a source can be added by hand like any bit).
- **Board paste** (use-create-doors): the paste handler URL-detects (`looksLikeUrl`) → `captureLink`
  → then places via the existing `bringIn`/`callInBit` at a `findClearSpot` — reusing call-in
  mechanics, no new optimistic path. (If wiring fights, v1 ships intake-only and this becomes the
  named follow-up — flag, don't force.)

### Render (each `bit.type` site)
- `card.tsx`: `link` → thumb `<img>` cover-fit + a title strip (face) + site name; no thumb → the
  title/URL card. Sizes like an image (corner-scale, default ~260×195). Caption/source below-panel.
- `note-card.tsx`/`note-row.tsx`: widen the thumb gate (`image || pdf` → `|| link`); face already
  shows the title. `signThumbs` already signs anything with a `thumb_path` (pdf work) — no change.
- Bit page: big preview + face + **open ↗** (the real URL, `rel="noopener noreferrer"`) + caption
  (BitTitle) + source + tags + folder — the standard layout.
- Type widenings: `BitType` (types.ts) · `CardVM.type` · WordsOffer kind (`link`) · `/bits` type
  filter chips (+ "links") · drawer type filter · BIT_FALLBACK (`link: "a link"`).

### Model-safety gates
1. Invariants: substance CHECK extended, not weakened (every other type still forces url null);
   read-once (I-Src2's principle) applies to title+image; no new always-true rule beyond the branch.
2. All states traced (the scenario table): create · caption-edit · place/unplace · trash · restore ·
   destroy (thumb cleaned) — no blank cells.
3. Lowest layer: substance rules in the DB CHECK; fetch hygiene in the one fetcher; create through
   one db-module fn.
4. Derive: face/search computed from stored truth; site name derived from url (not stored — display
   derives hostname; only title + image are read-once artifacts worth storing).
5. Prove the flow end-to-end: paste Spotify/YouTube/article/junk on the throwaway + local app →
   cards render (rich · title-only · URL-only) → findable → trash/restore/destroy clean.

## CORRECTIONS FROM THE INDEPENDENT CHECK — fold ALL in

1. **The media-facts constraint is a mandatory THIRD DDL change** (`bit_media_facts_only_with_file`,
   init.sql:228-233 — thumb/mime/etc. require `storage_path`; the link row violates it). **Relax
   narrowly:** exempt **`thumb_path` only, for `type='link'`** — mime/byte_size/dims/file_name stay
   null on a link bit (media facts keep meaning "describes the file at storage_path"; nothing reads a
   thumb's mime). `createLinkBit` inserts `{type, url, captured_title, thumb_path}` only.
2. **`bit_face`: `CREATE OR REPLACE` ONLY** — never DROP (the face generated column + every
   `select b.*` view would cascade), and **keep the parameter names identical** (Postgres refuses a
   rename). Confirmed: the function's only caller is the face column; views read the column; zero
   bookmark rows exist, and all live types force url/captured_title null, so stored faces can't
   drift. Search genuinely needs no touch.
3. **`fetchPageMeta` must return the FINAL url** (it computes `res.url` at :89 and throws it away) —
   og:image is often **relative**; resolve `new URL(raw, finalUrl)`. Also: entity-decode the image
   content (like the title path) · **reject `data:` URIs** · an `http:` og:image on an https page →
   safeUrl rejects → title card (fine, traced) · first og:image wins · re-check the image response's
   final host after redirect · svg passes `image/*` — allow (harmless in an `<img>`).
4. **Widening: two silent-drop sites + one missed file.** `bringIn`'s type gate
   (use-create-doors.ts:402) and the board loader's gate (board/[id]/page.tsx:38) both silently drop
   unknown types — unwidened, a pasted link "succeeds" and *nothing appears* (the audio/pdf lesson).
   And **`outline-view.tsx:17-26` was missed** — its type→Cat cast/labels lack audio/pdf already (a
   pre-existing hole): add `link` AND fix audio/pdf there. Full set: types.ts BitType · board loader
   (gate/sign/dims) · CardVM + card.tsx render (+is-image class gate) · bringIn (gate/sign/dims +
   follow with setWordsFor kind 'link') · words-offer kind + placeholder · drawer (TypeFilter, label,
   sign gate, options, thumb) · notes-browser Kind + chip ("links") · note-card/note-row thumb gates +
   labels · bit/[id] (sign + render + open ↗) · labels.ts BIT_FALLBACK · outline-view.
5. **Intake edges settled:** sticky source → **the link bit TAKES it** (owner-ruled via question:
   the chip you set is always honored; a source on a link bit is model-legal, I-Src1 optional) ·
   `asQuote` + bare URL → **ignored** for a link bit (quote shapes notes; recorded, no UI change) ·
   **abort must not orphan the thumb**: if a post-create step fails, `captureLink` removes its own
   uploaded object (removeObjects) before/with abortBitCreate.
6. **Storage path = `thumbs/{bitId}.jpg`** — the established convention (image + pdf thumbs live
   there; signThumbs/destroy are path-agnostic), NOT a novel `link/` prefix (the storage policy was
   dashboard-applied and repo-unverifiable — stay on the proven prefix). Server-side upload uses the
   user-scoped server client (authenticated role — same policy as today's client uploads);
   `owner_id default auth.uid()` covers the row. `uploadObject` is upsert:false → a retry uses a
   fresh bitId. **SPEC note in the docs pass:** server-side upload deviates from §4's
   "uploads go client→Storage" — the rule's reason (the inbound body cap) doesn't apply here since
   the bytes originate server-side; say so or it's drift.
7. **Board paste UX:** captureLink can take ~10s (page fetch + image fetch + upload) with no card
   showing — ship a "capturing…" indicator on the board (like the HEIC converting notice); if the
   wiring fights, the honest v1 is intake-only (named fallback).
8. **Docs pass additions:** supersede the two now-false invariants.md lines from the D-102
   retire-block ("I-R3 moot — captured_title persists, unused" · "I-R2 bookmark branch
   dead-but-harmless — no function edit") — this feature edits exactly that function.

9. **(from the proof run)** The DB's `search_tsv` carries the url as HOST tokens (Postgres
   tokenization: `barewall.example.net` is one token) — fine, but word-level URL search is the
   **client search's** job: **`searchItems.searchText` (src/lib/db/search.ts:126) must gain
   `url` + `captured_title`** (split on non-word chars so "barewall" alone matches), and the /bits
   in-memory search hay (notes-browser) already includes face (= title) — add url there too.

Confirmed sound by the check: duplicates allowed (no unique url index) · old bookmark-notes stay ·
"not auto-applied" was compatible but is now superseded by the owner's ruling above · signThumbs
lights /bits for free · a link's face can never be empty (url NOT NULL) · addToInbox's tag loop is
type-agnostic · /write quick-write untouched (no URL detection there).

### Build order (small pieces)
1. Migration + throwaway proof (attacks + face/search probes). Show raw output.
2. **Owner cloud paste** → verify → only then the app changes deploy.
3. Fetch extension + `captureLink` + intake flip; loose cards render. Owner feel-test on /bits.
4. Board paste door + board card render. Owner feel-test on a board.
5. Docs recorded same-session (agreements ruling · lexicon revival · D-log · deliberations ·
   parked: the embed re-entry; A14 untouched — stored video files remain parked).
