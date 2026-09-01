# The flow review's bugs — fix plan (owner-authorized 2026-09-02)

**Status: ✅ ALL BUILT (D-132)** — A `c507e2d` · B `c159853` · C `ff33830` · D `defb408`, plus the
safe batch `75eaa5e`. Antagonist-corrected before building (its three catches are in the commits).
Not deployed — awaiting the owner's word. F5/F8 were already shipped when the antagonist read them.

**Source:** the cross-surface flow review (capture · the four doors · returning · finding · the
board on a phone · note↔bit). Owner: *"absolutely please do plan and fix the bugs."* The phone
tap-swallowing finding is NOT here — it awaits the owner's 2-minute device check.
**Standing limits:** no deploy without the owner's word; no cloud schema changes (none needed).

---

## F1 — The tag chip: the word PULLS, an × removes  *(the scariest finding)*
Today a tag chip is ONE button whose whole surface **removes the tag** — no confirm, no undo
(`board/[id]/tag-bar.tsx:102-104`), and on `/bits` cards tags are inert `<span>`s
(`bits/inbox-tags.tsx:25-27`). Meanwhile "the pull" (tap a tag → everything with it) is wired in
exactly two places app-wide. So the natural gesture destroys or does nothing.
**Fix:** everywhere a chip renders, the **word is a Link → `/search?tag=${id}`** (the shape already
used at `source/[id]/page.tsx:66` and the graph) and a **separate `×` button removes**. Applies to
TagBar (board card · board page · bit page · note page) and InboxTags' static chips.
- The × keeps the existing `remove()` (optimistic + rollback already there).
- On a board the chip lives inside `.tag-bar` with `onPointerDown` stopPropagation — the Link must
  not start a card drag; keep the guard, let the click through.
- Navigating away from a board is safe: the save-guard + unmount flush already cover in-flight work.
- **Owner-flag:** tapping a tag on a board now LEAVES the board for /search. Deliberate (that is the
  pull), consistent everywhere, and reversible by the back button — but it is a behavior change.

## F2 — The note editor's broken retry  *(a real loss path)*
`text-workspace.tsx`: `flush()` nulls `timer.current` at entry; `flushPending()` returns early when
`!timer.current` (`:70-74`). So after a FAILED save both escape hatches (save-guard `:91`, unmount
`:93`) are dead — yet the message says *"keep typing, we'll retry"* (`:56`). Stop typing, close the
tab, the paragraph is gone.
**Fix (the house pattern, already in `bit-controls.tsx` BitTitle):** track the last SUCCESSFULLY
written body in a `saved` ref; `flushPending()` writes whenever `latest.current !== saved.current`
(dirty), not when a timer happens to exist. `flush()` sets `saved` only in its `.then`. Message
becomes true.

## F3 — The board banner's "Your work is still here"
`use-persistence.ts` deletes the pending patch BEFORE the await (capture-at-fire, deliberate), so a
failed write leaves the change in React state only and nothing will ever write it again — while the
banner claims otherwise (`board-surface.tsx:66-73`).
**Fix (small, same family as F2):** on a failed flush, **put the patch back into `pending`** (merged
under any newer entry — newer wins per field) so the next flush or the leave-the-board flushAll
retries it. Then the banner is TRUE. NOT building the full durable outbox (that's approach A5 /
offline B1 — one decision, later).

## F4 — `/search` can't find by tag word · silently caps at 1000 · its tag facet goes wrong
`db/search.ts`: `searchText` omits tag words (`:138`) though the drawer, `/bits` and `/outline` all
include them; `.limit(1000)` = PostgREST's cap while the UI says "everything"; `attachTags` does an
**unchunked** `.in()` over up to 1000 ids (`:73-76`) — past the cap the facet is WRONG, not short.
**Fix:** add tag words to `searchText`; page the bit read with the existing `pagedRows` helper
(stable `.order`); chunk `attachTags`' `.in()` with the existing `chunk` helper. (`lib/db/paged.ts`
exists for exactly this and search never imported it.)

## F5 — The ★ on a bit promises something it cannot do
`components/shelf-controls.tsx:71` — *"mark alive — it greets you on home"* — but home reads
`listNotes` (`kind='note'`), so a starred BIT never appears there; it only floats to the top of
`/bits`.
**Fix now (honest words):** the bit tooltip says what starring a bit actually does. **Owner
question (not mine):** *should* a starred bit greet you on the desk? That's a model call about what
"alive" means — recorded, not decided.

## F6 — `/write` never says "saved" and can't reach what you wrote
`write/quick-write.tsx:167-176` renders only an error or the `[[` hint; the toolbar's own comment
promises an "open" button that isn't in the JSX (`:139-140`), and `organize-phase-plan.md:57`
records "saved · open →" as shipped. It isn't.
**Fix:** surface the workspace's save status, and an **open →** link to `/note/{selfId}` once the
note exists (`selfId` is already computed at `:25/:61`).

## F7 — No image door outside a board  *(the phone-native gap)*
`/bits` offers `+ recording` and `+ PDF` (`loose-file-intake.tsx`) but **no image**; the only image
door is on a board. On a phone that's the most natural capture and the one you can't do.
**Fix:** a `+ image` door in the same component, reusing `importImage` (HEIC handled) + the two
uploads + `createImageBit` with no placement (a LOOSE bit) — the audio/pdf doors' exact shape,
including the caption offer and the orphan-sweep-on-failure added last night.

## F8 — Doc drift (same-session rule)
`parked.md` A24 says archive "is applied to no cloud… Nothing shipped" — archive IS built, migrated
and live (`20260830000002` + `20260902000002`, `/archive`, ArchiveButton). And `/group/[id]`'s
second section is labelled "notes" while it lists all bits.

## Verify
tsc · lint(src) · build · both suites · targeted greps (no chip whose whole surface removes; no
`searchText` without tags; no unchunked `.in()` in search). Commit in two batches (safe · risky),
separately revertable. Owner feel-test before deploy.
