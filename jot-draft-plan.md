# Draft protection for the jot box — plan

**Status:** planned → check → build. Owner-authorized 2026-09-02; three design calls ruled by the
owner (below). Re-entry of parked **A12** (crash-guard draft), honoring **I-D3**.
**Standing limits:** no deploy without the owner's word; no schema (device-local only).

---

## The problem, exactly

`/bits`' capture box holds everything in React state and nothing else: the typed words, the source
chip, staged tags, the quote toggle. Navigate away, reload, or let the phone evict the tab and all
four are gone with no trace. `/write` is protected (born-on-first-content + save-guard) and the note
editor is protected (debounce + save-guard); **this box never was** — the one capture door with zero
protection, and the one most likely to be used in a hurry.

## The ruled constraint (I-D3, non-negotiable)

> *"A crash-guard draft may restore into the **editor** only — never replay to the DB."*

So: **no auto-submit, ever.** The draft repopulates the box; the owner presses add. This is why the
feature is device-local storage and not a server-side "unsent note".

## The owner's three rulings (2026-09-02)

1. **On return: it's just there, with an ×.** Words back in the box, ready to continue; a visible
   discard for when you'd moved on.
2. **The whole act returns** — words · source chip · tags · quote toggle. Half-restoring would
   silently drop something the owner had chosen.
3. **It waits indefinitely** — until used or cleared. No expiry.

## What's stored

`{ note, asQuote, sticky, draft, tagWords, tagDraft }` — every field the SUBMIT path reads.

- `sticky` is `{ name, url }` — plain JSON, and the add sends the **name** (not an id), so a source
  deleted meanwhile is simply re-created on add. Nothing to guard.
- **`draft` (the typed source name) IS stored.** `intake.tsx:77` is
  `const sourceName = sticky?.name ?? (draft.trim() || null)` — a source name typed but never
  Entered is submitted. *An earlier draft of this plan claimed the opposite; that was a misreading
  (I read the two lines under it and inferred this one). Dropping `draft` would have silently lost
  the owner's source on every restore — exactly the half-restore ruling 2 forbids.*
- **`tagDraft` IS stored** — same shape, one line down
  (`tags = tagDraft.trim() ? [...tagWords, tagDraft.trim()] : tagWords`).
- Not stored: `focused`, `tagFocused`, `pending`, `err`, `hydrated`, the suggestion lists — all
  transient or refetched.

**The rule this settles:** the stored set is *derived from what add() reads*, not from what looks
committed on screen. Any future field added to the submit path must be added here in the same pass.

## Shape

- New `src/app/bits/jot-draft.ts` — `loadDraft()` / `saveDraft(d)` / `clearDraft()` + the type.
  Own module (like `camera-storage.ts`) so it's unit-testable without the DOM and the intake doesn't
  grow. Every storage access in try/catch — a blocked/full store must degrade to "no drafts", never
  throw (the Safari block-all lesson from the last round).
- **Key:** `jot-draft:v1`.
- **Write: a state-mirroring effect, NOT a debounce.** localStorage is synchronous, so a debounce
  buys nothing and costs a race: a timer armed before a successful add would fire ~400ms *after* the
  reset and resurrect the just-added jot as a draft. The effect runs on every change; an *empty* box
  **removes** the key rather than writing a blank. No unmount flush needed, because nothing is ever
  in flight.
- **Read:** once, in a mount effect (never in render — localStorage in render is a hydration
  mismatch; the house pattern is the effect, per camera-storage/rail/home-surfaces). Restores with
  **functional setState** (`setNote(p => p || d.note)`) so anything typed before the effect lands —
  fast fingers, or StrictMode's double mount — wins over the stored draft. The restore fills an
  empty box; it never overwrites live typing.
- **Clear:** falls out of the mirror. `resetBox()` — used by BOTH a successful add and the clear
  button, so the two can't drift and leave a field behind — empties the state, and the effect turns
  that into a removed key. There is deliberately no `clearDraft()`: one mechanism, nothing to drift.
  **Never on an add failure** — surviving a failed add is half the point.
- **The button says "clear", not ×.** Two × marks already sit on this box meaning narrower things
  (drop the source, drop a tag); a third would be ambiguous. Shown whenever the box has anything in
  it, `disabled` while an add is pending. It covers discard-a-restored-draft and plain never-mind
  without tracking a "was restored" state.
- **Shape validation, not just a JSON guard.** A stored `{"tagWords":"a,b"}` parses fine and then
  crashes the render on `.map` (`intake.tsx:159`). Every field is type-checked; anything unexpected
  reads as no draft.
- **Layout:** the two buttons go in a `<span className="intake-actions">`. `globals.css:1262` had
  `.intake-foot .compose-btn { margin-left: auto }` — with two buttons that pushes each one
  independently and splits them apart; the auto margin moves to the group.

## Edge cases traced

| case | behavior |
|---|---|
| add succeeds | draft cleared with the box reset — nothing lingers |
| add FAILS (offline) | box keeps its content, draft key still matches → survives a reload. The point. |
| storage blocked / full | try/catch → feature silently absent; capture unaffected |
| corrupt/old JSON | parse guarded → treated as no draft |
| two `/bits` tabs open | last write wins; on reload both show the later one. Minor, named, not solved |
| restored source since deleted | add re-creates it by name (pick-or-create) — no breakage |
| typing lands before the restore effect | functional setState — what you typed wins, the draft doesn't clobber it |
| corrupt shape (`tagWords` a string) | shape-validated → no draft, instead of a render crash |
| StrictMode double mount | read never removes the key; functional setState makes the second pass a no-op |

## Known limitation (named, not silently accepted)

Drafts are **per-device and not keyed to a person**. Correct today (one owner) and correct in
spirit (a draft is a device thing). But on a shared browser after accounts, the next person could
see the previous draft. **Named re-entry:** when accounts land, either key the draft by user id or
clear it on sign-out — filed alongside the other before-accounts items, not built now.

## Verify

A unit test on `jot-draft.ts` — `node src/app/bits/jot-draft.test.mjs` (round-trip · empty removes
the key · shape validation incl. the `tagWords`-as-string crash case · `asQuote` alone is empty ·
blocked storage throws nothing) — plus tsc/lint/build, then the owner's feel-test:

1. Type a jot with a source chip and a tag, navigate away, come back — everything there.
2. **Type a source name WITHOUT pressing Enter, reload — the source text is back.** (The case the
   first draft of this plan would have broken.)
3. Press **clear** — box empty, and it stays empty after a reload.
4. Add succeeds — box is clean, nothing returns on reload.
5. Add with the network off — the words survive a reload.
