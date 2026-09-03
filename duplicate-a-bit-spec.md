# Duplicate a bit — the spec

**Status: 🟡 SPEC. No code.** Written 2026-09-02 at the owner's instruction: *"define the specs
and edge cases and ask me clarifying questions."*

**The ask:** *"You're on a board, you want that same bit — you just want a copy of it… we have to
think about nuances there, like how is that identified now… I thought we were also saying, well,
it's not the same exact one that's on a board, right, it's a COPY of a bit."*

**Already ruled:** the copy carries **the original's tags** (owner, 2026-09-02).

---

## 1 · Why this is a model question before it is a feature

The database enforces **one placement per bit per board** (`placement_bit_once`). So "put this on
the board twice" is impossible by construction — and that is not a limitation to work around, it
is the model being right: a bit is one thing, and a board either shows it or doesn't.

Therefore **duplicating must mint a NEW BIT.** The owner reached this herself. Everything below
follows from it: a new bit needs to be told what it inherits.

---

## 2 · What a copy inherits — the table

| | Inherit? | Reasoning |
|---|---|---|
| **type** (text/image/…) | ✅ yes | a copy of a photo is a photo |
| **kind** (bit / note) | ✅ yes | copying a note gives a note |
| **body · content · face** | ✅ yes | the substance |
| **url · captured_title** (link bits) | ✅ yes | read-once truth, already immutable |
| **tags** | ✅ **RULED yes** | owner, 2026-09-02 |
| **source** ("from …") | ⚪ **QUESTION 1** | it travels with a bit today; is it part of what the thing IS? |
| **the star** (`pinned_at`) | ❌ recommend no | the star means "alive for me right now" — a fresh copy hasn't earned it |
| **gather references** (`[[` ties) | ❌ recommend no | those point at the ORIGINAL from inside your writing; a copy is not what you referenced |
| **travel history** | ❌ no | the copy has been nowhere; it is new |
| **trash / archive state** | ❌ no | a copy is born live |
| **the stored FILE** (image/pdf/audio) | ⚪ **QUESTION 2 — the big one** | see §3 |

---

## 3 · QUESTION 2: what happens to the file — and why it is dangerous

Duplicating a photo raises a question text bits don't: **do the two bits share one stored file, or
does the copy get its own?**

**Verified hazard:** `destroyBit` (`lib/db/bits.ts:395-414`) deletes the row and then **removes its
`storage_path` and `thumb_path` objects**. So if two bits shared a file, **destroying either one
would silently delete the picture out from under the other.** The surviving card would render blank
and the file would be gone for good.

Three ways, honestly:

| | How | Cost | Risk |
|---|---|---|---|
| **A · Share the file** | the copy points at the same path | instant, no extra storage | **destroy breaks the other bit** unless destroy is taught to check |
| **B · Copy the file** | download + re-upload under the copy's own id | doubles storage per copy; slow for a big PDF | none — every bit owns its own file, as today |
| **C · Share, and make destroy safe** | as A, plus destroy checks whether any other live bit still points at that path and skips the removal | instant, no extra storage; one small query added to destroy | changes a destructive path — needs care, and a proof |

**Claude's recommendation: C.** It keeps duplication instant and free, and the fix is small and
provable. It also closes a hole that would exist under A whether or not we notice it. B is the
safest but makes duplicating a 20MB PDF a slow, storage-doubling act for no gain the owner asked for.

**If the owner prefers to avoid touching destroy at all:** B is the conservative answer and nothing
else in the spec changes.

---

## 4 · Where the copy goes

- **On the same board**, offset from the original the way a paste is — visible immediately,
  obviously a second thing rather than a replacement.
- **Selected after landing**, so the next thing you do acts on the copy.
- **QUESTION 3:** should duplicating be possible from OUTSIDE a board — e.g. from `/bits`, where
  there is no position? Claude's recommendation: **not in v1**; the ask was board-shaped, and a
  loose duplicate has no obvious meaning yet.

---

## 5 · Edge cases

| # | Case | Decision |
|---|---|---|
| 1 | Duplicate a **note** | Allowed — a note is a bit; the copy is a note. |
| 2 | Duplicate a **locked** card | Allowed. The copy is NOT locked — the lock is about that card's position on that board. |
| 3 | Duplicate a card whose bit is **trashed elsewhere mid-act** | The insert fails; nothing lands; the banner says so. Same carve every board act uses. |
| 4 | Duplicate **many at once** (a multi-selection) | ⚪ **QUESTION 4** — v1 single card only, or the selection? Recommendation: **single**, so the act stays obvious; bulk can follow. |
| 5 | The copy's **file paths** | Under A/C the copy's `storage_path` contains the ORIGINAL's id. Harmless — paths are opaque — but worth knowing before someone reads one and is confused. |
| 6 | **Undo** | Must record: it is a deliberate board act. The reverse un-places AND trashes the new bit, because leaving a duplicate bit loose after undoing its creation is litter. |
| 7 | **Duplicating a duplicate** | Fine — it copies whatever that bit now is, not a chain back to an ancestor. |
| 8 | **A copy of an empty card** | Allowed; empty cards persist by ruling (D-138). |
| 9 | The **word** for it | ⚪ **QUESTION 5** — "duplicate" matches the board's existing ⧉ duplicate-board act. "copy" is plainer but collides with copy/paste. Claude leans **duplicate**, for consistency. |

---

## 6 · The questions — RULED (owner, 2026-09-02)

**Q2 · The file — RULED: THE COPY GETS ITS OWN. (Option B, not C.)**
*"I think copy is exactly this, a copy… with somehow a different bit id, right?"*

**The owner's argument beat Claude's, and the reason is worth keeping.** Claude recommended
sharing the file with a guard added to destroy, on the grounds that it is instant and costs no
storage — a TECHNICAL argument. The owner's is a MODEL argument: if two bits point at one file
they are not two things. There is an invisible thread between them, and deleting one blanks the
other. We mint a separate bit precisely BECAUSE a bit is one thing; sharing the file quietly
re-attaches what we just separated. Sharing gives you something that looks like a copy and is not.

So: **new bit id, new file, no shared state.** Trash one and the other is untouched.
**Bonus: the destroy path is never touched** — the most dangerous code in the app stays as it is,
and §3's whole hazard disappears rather than being managed.
*Cost, accepted eyes-open:* storage doubles per copy, and a large PDF takes a moment to copy.

**Q3 · Outside a board — RULED: YES.** *"I think you should be able to duplicate outside a board
too."* So `/bits` and a bit's own page get it. A duplicate made off a board is **loose** — it has
no position because there is no board to have one on, which is exactly what loose means.

**Q4 · One or many — RULED: ONE.** *"Duplicate this bit."* Singular. ("A whole selection" was
Claude's jargon for the board's multi-select; the question was whether the act copies every
selected card. It copies the one you are on. Bulk can follow if it is ever wanted.)

**Q5 · The word — RULED: "duplicate this bit".** And note it is *bit*, not *card*, on purpose:
duplicating makes a **new bit**, not a second card of the same one. The word says what happens.

**Q1 · The source — still open**, and the smallest of them. Does the copy carry its "from …"?
*Claude leans yes* — the source travels with a bit, like its tags. Safe to default to yes.

## 7 · What follows from the rulings

- **The copy's file is its own**, at its own `images/<newBitId>.jpg` — so the derived-path
  convention holds, the orphan sweep keeps working, and §5 case 5 (a path containing someone
  else's id) disappears.
- **Copying is server-side**: read the original object, write it under the new bit's path. For
  image and pdf that is two objects (full + thumb); audio is one; text and drawing have none.
- **A failed file copy must not leave a half-bit.** If the bytes cannot be copied, the new bit is
  not created — the same all-or-nothing shape the intake doors already use.
- **Off-board duplication lands loose**, so `/bits` shows it immediately.
- **On-board duplication** lands beside the original, selected, and records one undo entry whose
  reverse un-places AND trashes the copy.
