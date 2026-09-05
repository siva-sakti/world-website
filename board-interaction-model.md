# The board's interaction model — diagnosis, and what it should be

**Written 2026-09-03.** A study, not a plan. Nothing here was built. Every factual claim about
the current build carries a `file:line`; every claim about `react-rnd` / `react-draggable` /
`re-resizable` was read out of `node_modules/.pnpm/`, not remembered. What could not be verified
by reading is listed in §0.4 and marked in place.

**Why this exists.** Rotation has failed three times (`rotation-plan.md` v1/v2/v3, then §V4). The
owner's diagnosis is that the failure is a missing *interaction model*, not a missing bug fix.
She is right that the model is missing. She is also right that something is broken — but the
broken thing is smaller and more fixable than `rotation-plan.md` §V4 concluded, and §V4 got the
mechanism backwards. §1.4 and §3 are the load-bearing sections.

---

## 0 · The four things worth knowing before anything else

### 0.1 The "stuck" is NOT the rotated overflow. It is the un-rotated box the overflow left behind.

`rotation-plan.md` §V4 §1 says: *"the rotated content overflows its own box and stays fully
hit-testable… clicks that look like they land on another card land on the tilted card instead
and re-select it."*

The first half is right. The second half is wrong, and the difference matters.

A tilted card has **two** hit regions, and they are a union:

- **the root box** — `.compose-card`, the `<Rnd>` element. `position:absolute` with the card's
  stored `w`/`h` (react-rnd `lib/index.es5.js:64-71` + `:439`), **never rotated**, and
  `pointer-events:auto` (`globals.css:60-62`).
- **the drawn shape** — `.compose-card-inner`, which carries `transform: rotate(...)`
  (`card.tsx:307`). A transformed element is hit-tested against its *transformed* shape, so
  everything you can see, you can click. That half is correct today.

The **wedges** — the parts of the un-rotated root box that the rotated card no longer covers —
are the trap. In a wedge you see empty board (or a neighbouring card), and:

- the click **does not reach the board**: `onBoardPointerDown` bails at `board-surface.tsx:638`
  (`if (e.target !== boardRef.current) return`), so no `clearSelection()`, no pan, no double-tap
  create;
- the click **does not reach the card's own handlers**: `onPointerDown`/`onClick` are on the
  *inner* (`card.tsx:317`, `:324`), which the wedge is not part of — so no select, no deselect,
  no edit;
- the press **does** reach `react-draggable`, whose `mousedown` is a React prop on the root
  (react-draggable `chunk-RXGSR3JC.mjs:517`) and whose `touchstart` is a native listener on the
  root node (`:481`). So a press in a wedge starts a **drag of a card you did not click**.

So near a tilted card the board does not "re-select the tilted card" — it does **nothing at
all**, silently, and arms a drag. That is a worse failure than the one §V4 described, because
there is no feedback to explain it. It is exactly *"I'm kind of stuck."*

There is one tell, and it is a 5-second hand check: **hover a tilted card's corner wedge — the
cursor is `move`, not `grab`.** (react-rnd sets `cursor:move` on the root at `index.es5.js:438`;
`.compose-card-inner` sets `cursor:default` at `globals.css:418`; the board sets `cursor:grab` at
`globals.css:47`.)

### 0.2 There is a cheap, correct fix, and §V4 did not consider it

§V4 §3 lists four ways to make clicks match the picture — (a) hit polygons, (b) grow the root,
(c) rotate the root, (d) own the input layer — and rules only (d) honest. There is a fifth:

> **(e) Stop the root from being a hit target at all. Let only what is *drawn* catch the pointer.**

Move `pointer-events:auto` from `.compose-card` to `.compose-card-inner`, and add
`pointerEvents:'auto'` to the six resize-handle styles in `card.tsx:26-30`. That is it.

Why it works, verified rather than assumed:

- `pointer-events` is an inherited property; `auto` on a descendant of a `none` ancestor
  re-enables hit-testing for that descendant. **The board already depends on exactly this**:
  `.compose-world { pointer-events:none }` (`globals.css:58`) with `.compose-card { auto }`
  (`:61`). The change is one more rung of the same ladder.
- **Dragging survives.** react-draggable's `mousedown` is a React prop on the root
  (`chunk-RXGSR3JC.mjs:517`) — synthetic events bubble through the fiber tree regardless of
  `pointer-events`. Its `touchstart` is a *native* listener on the root node (`:481`); a touch on
  the inner bubbles through the root and fires it. Neither depends on the root being the hit
  *target*.
- **Resizing survives**, given the one added line: re-resizable renders each handle as a `<div>`
  whose inline style is `{position:absolute, userSelect:none, ...defaults, ...handleStyles[dir]}`
  (`re-resizable/lib/resizer.js:52-54`), and `handleStyles` is ours (`card.tsx:20-41`).
- **The rotate handle already survives** — `.compose-rotate-anchor` is `pointer-events:none`
  (`globals.css:442`) with the handle at `auto` (`:454`).
- **Upright cards are unaffected.** For a fixed-size card the inner is `100%×100%` of the root;
  for a flex-sized card the root's height is `auto` and wraps the inner. Same box either way —
  `use-geometry.ts` already asserts this ("The Rnd root and the inner div are the same size —
  verified"). Zero behavioural change at 0°.
- **Bonus: the geometry ledger measures the inner** (`card.tsx:305` → `use-geometry.ts`'s
  `measure`), so after the change the ledger describes the hit shape rather than a sibling of it.

One accepted cost: re-resizable's mid-resize cursor shield (`index.es5.js:282-294`, a
`position:fixed; opacity:0; z-index:9999` div) becomes non-hit-testable, so the resize cursor may
flicker to the underlying element mid-drag. Cosmetic; the resize itself runs on document-level
listeners.

### 0.3 A drag currently also fires a click, and the click grammar acts on it

`card.tsx:324-332` runs the select→edit / select→open grammar on `onClick`, guarded only by
`wasSelected.current` (captured on `pointerdown`, `:318`). There is no drag guard. The comment at
`:328` claims *"react-rnd suppresses click after a drag"* — **`grep -c click` returns 0 in both
`react-rnd/lib/index.es5.js` and `react-draggable/build/cjs/chunk-RXGSR3JC.mjs`.** Neither
library binds, suppresses, or knows about `click`.

The browser fires `click` on the nearest common ancestor of the `mousedown` and `mouseup`
targets. During a card drag the card follows the cursor, so both are inside the card. Therefore:

| gesture | what the code then does |
|---|---|
| drag an already-selected **text** card | `card.tsx:330` → `onEdit()` → the card enters edit mode on drop |
| drag an already-selected **note** doorway | `card.tsx:331` → `onOpen()` → `openSelected` → `router.push('/bit/…')` — **the board navigates away** |
| shift-drag / select-mode drag any card | `card.tsx:327` → `onSelect(true)` → the card **toggles out of** the selection it was dragging with |

This is the other half of "click into it → move it → click out feels wrong": the *move* itself
climbs a rung. See §0.4 — this one is read-derived and owed a hand check.

### 0.4 What I could not verify

- **§0.3's three consequences are derived from DOM semantics, not observed.** What *is* verified
  is that no library touches `click` and that `card.tsx` has no drag guard. The 10-second hand
  check: select a note doorway, drag it a little, let go. If the app navigates to the note's
  page, §0.3 is confirmed as written.
- **The wedge behaviour (§0.1) is derived from CSS hit-testing rules + the handler map**, not
  observed. Confirmable by hover (`move` cursor over apparently-empty board beside a tilted card).
- **Nothing was run.** No dev server, no browser, no screenshot. This is a reading study.
- **Touch/phone specifics** (whether `touch-action:none` + react-rnd's internal thresholds
  swallow taps) — still the open question `board-actions-technical-audit.md` Part 2b names, and
  still unanswered here.
- I did not audit `/write`, `/note`, `/bit/[id]`, or the timeline sub-route; the brief scoped this
  to the board.

---

## 1 · Part 1 — the machine that exists

### 1.1 Every state a card can be in

State lives in four places. Three are board-level and singular; two are per-card.

| # | state | where it lives | scope |
|---|---|---|---|
| S1 | **unselected** | absence from `selectedIds` (`board-surface.tsx:64`) | per card |
| S2 | **selected** | membership in `selectedIds` | per card, many at once |
| S3 | **editing** | `editingId === placementId` (`board-surface.tsx:66`, `:801`) | **exactly one card, board-wide** |
| S4 | **locked** | `card.locked`, a persisted placement fact (`board-surface.tsx:525-537`) | per card |
| S5 | **rotated** | `card.angle ≠ 0`, persisted per placement | per card |
| S6 | **mid-rotate** | `liveAngle !== null` (`card.tsx:128`) — component-local | one card |
| S7 | **mid-drag** | `dragStart.current` / `dragSnap.current` (`board-surface.tsx:67`, `:296`) + react-rnd's own internal `dragging` | one gesture |
| S8 | **mid-resize** | `resizeBefore.current` (`board-surface.tsx:154`) + re-resizable's `isResizing` | one gesture |
| S9 | **being created** | the card is in `cards` but its DB row is in flight (`trackCreate` / `settled`, `use-persistence.ts`) | per card |
| S10 | **offering words** | `wordsQueue[0].bitId === card.bitId` (`board-surface.tsx:77-80`, `:804`) | one card |
| S11 | **departed** | not a board state — the card is gone from `cards` (`remove-acts.ts`) | — |

Board-level modes that change what every card does:

| # | mode | where | exit |
|---|---|---|---|
| M1 | **select mode** | `selectMode` (`board-surface.tsx:65`); a tap toggles instead of selects (`card.tsx:319`, `:325`); empty-space drag draws a marquee instead of panning (`board-surface.tsx:649`) | the ⛶ toolbar toggle only (`board-toolbar.tsx:85-91`) — **no Escape** |
| M2 | **pen mode** | `drawMode` (`board-surface.tsx:70`, `:879`); a full-surface canvas at `z-index:9000` (`globals.css:986-995`); the keyboard is switched off (`board-surface.tsx:622`, guard ④) | the overlay's own "cancel"/"done" buttons (`draw-overlay.tsx:213-218`) — **no Escape** |
| M3 | **a confirm dialog** | `.confirm-scrim`; owns all keys (`use-board-keys.ts:36`, guard ②) | its own buttons |
| M4 | **a words offer** | `WordsOffer` at `z-index:9500` with `autoFocus` (`words-offer.tsx:28`); its input triggers guard ① so **every board key is dead while it is up** | save / skip / Enter / Escape *inside the input* |

**Which combine.** S3 ⊂ S2 by intent (an editing card should be selected). S4 + S5 combine and
mutually suppress affordances. S3 suppresses S5's *appearance* — `tilt = rotated && !editing`
(`card.tsx:144`), the owner's ruling that editing straightens. S3 and S7/S8 are mutually
exclusive by construction: `disableDragging={editing || locked}` (`card.tsx:236`) and
`enableResizing={selected && !editing && !card.locked ? … : false}` (`:237-239`).

**The nine writers of `editingId`, and whether each holds the invariant `editingId ∈ selectedIds`:**

| # | writer | holds? |
|---|---|---|
| 1 | `board-surface.tsx:66` — `useState(null)` | ✓ vacuously |
| 2 | `board-surface.tsx:267` — `select()` clears when selection moves off | ✓ |
| 3 | `board-surface.tsx:625` — Escape (`setEditingIdNull`) | ✓ (clears editing, keeps selection) |
| 4 | `board-surface.tsx:639` — empty-space `pointerdown` | ✓ |
| 5 | `board-surface.tsx:808` — `onEdit`, paired with `selectOne` at `:807` | ✓ |
| 6 | `use-create-doors.ts:124` — a new text card, paired with `selectOne` at `:123` | ✓ |
| 7 | `use-create-doors.ts:132` — a failed create clears its ghost edit | ✓ |
| 8 | `use-create-doors.ts:492` — call-in reconcile renames the id (with `:488` renaming it in `selectedIds`) | ✓ |
| 9 | `remove-acts.ts:288` (+ `:367`, `:392`) — a remove clears both | ✓ |

Every *writer* of `editingId` holds it. **The invariant is broken by three writers of
`selectedIds` that never look at `editingId`:**

- `board-surface.tsx:619` — `jumpToCard` → `selectOne` (the drawer's "already here" row,
  `drawer.tsx:197`);
- `board-surface.tsx:598` — `duplicateSelected` → `selectOne` (the selected-bar button, which
  lives *outside* `.compose-board` at `board-surface.tsx:747`, so no board `pointerdown` fires);
- `use-create-doors.ts:475` — `bringIn` → `selectOne` (the drawer's call-in, `drawer.tsx:206`).

Each strands `editingId` on a card that is no longer selected. The consequence is the exact one
the code's own comments warn about twice (`board-surface.tsx:264-266`,
`use-create-doors.ts:490-491`): `use-board-keys.ts:37` sees a truthy `editingId` and returns
after Escape, so **Delete, the arrows, ⌘A and ⌘Z all go dead with nothing on screen to explain
it.** The invariant exists in comments and at nine sites; it is enforced at zero.

### 1.2 Every input, in every state

`○` works · `△` works but is wrong or surprising · `✗` does nothing · `—` unreachable

| input | neutral board | card unselected | card selected | card editing | select mode | pen mode |
|---|---|---|---|---|---|---|
| click a card | — | ○ select + z-to-front (`card.tsx:322`, `board-surface.tsx:268`) | ○ text→edit, note→open, media→nothing (`card.tsx:330-331`) | ○ stays editing | △ **toggles**, no z-front for the second (`card.tsx:327`) | — overlay eats it |
| click empty board | ○ clear + arm tap (`board-surface.tsx:654`, `:694`) | ○ clears | ○ clears | ○ clears both (`:639`, `:654`) | △ *does not clear on down*; clears on a no-move `up` (`use-marquee-select.ts:84`) | — |
| **click a tilted card's wedge** | — | **✗ silent, arms a drag (§0.1)** | **✗** | **✗** | **✗** | — |
| double-click empty board | ○ new text card in edit (`board-surface.tsx:690-695`) | — | — | — | ✗ (marquee owns the down) | — |
| double-click a card | — | △ = two clicks: select, then edit/open | △ | — | △ toggles twice = no-op | — |
| drag a card | — | ○ select-then-move (`card.tsx:322`) | ○ move; **△ fires the click grammar on drop (§0.3)** | ✗ `disableDragging` (`:236`) | △ moves **and** toggles selection off | — |
| drag empty space | ○ pan (`board-surface.tsx:653`) | ○ pan | ○ pan (selection survives — `clearSelection` ran on the down) | ○ pan | ○ marquee (`:650`) | ✗ draws |
| ⌘/ctrl/shift-click a card | — | ○ add | ○ remove | ○ add/remove | ○ same as plain | — |
| drag a resize dot | — | — (no dots) | ○ resize; the grab zone is 26px around an 11px dot, 34px/22px on touch (`card.tsx:20-48`) | — | ○ | — |
| drag the rotate handle | — | — (hidden) | ○ relative turn, Shift → 15° (`card.tsx:161-184`, `geometry.ts:150-158`) | — (hidden) | ○ | — |
| double-click the rotate handle | — | — | ○ straighten, one undo act (`card.tsx:296-298`) | — | ○ | — |
| marquee | — | — | — | — | ○ but **axis-aligned only** (`use-marquee-select.ts:71`) | — |
| Escape | ✗ | ✗ | ○ clear (`use-board-keys.ts:52`) | ○ exit edit, keep selection (`:38`) | △ clears selection, **stays in select mode** | ✗ (guard ④, `:41`) |
| Delete / Backspace | ✗ (`:53`) | ✗ | ○ remove from board (`:54`) | ✗ swallowed by guard ③ | ○ bulk | ✗ |
| arrows | ✗ | ✗ | ○ nudge 1px, Shift 10px, locked skipped (`board-surface.tsx:450-458`) | ✗ guard ③ | ○ | ✗ |
| ⌘A / ⌘± / ⌘0 / ⌘Z | ○ | ○ | ○ | ✗ guard ③ (except tiptap's own ⌘Z) | ○ | ✗ (⌘Z → pen's stroke undo) |
| scroll / wheel | ○ zoom at cursor (`use-camera.ts:105-118`) | ○ | ○ | ○ | ○ | ○ |
| pinch | ○ zoom+pan (`use-camera.ts:203-241`) | ○ | ○ | ○ | ○ cancels the marquee (`board-surface.tsx:643`) | — |
| paste | ○ image/audio/pdf → cards; bare URL → link bit; text → text bit (`use-create-doors.ts:381-407`) | ○ | ○ | ✗ deliberately — the editor owns it (`:384`) | ○ | ○ |
| drop files | ○ at the drop point (`use-create-doors.ts:341-347`) | ○ | ○ | ○ | ○ | ○ |
| tap (touch) | ○ | ○ | ○ | ○ | ○ | — |

**Ambiguous, contradictory or unreachable combinations found:**

1. **The wedge (§0.1)** — the only truly silent input in the whole table.
2. **Drop = click (§0.3)** — the same physical gesture means two things at once.
3. **A drag in select mode toggles the card it dragged** — `card.tsx:325` treats `selectMode` as
   `additive`, and the drop's click then toggles. Contradicts the mode's purpose.
4. **Escape does not leave select mode or pen mode.** M1's only exit is a toolbar button that is
   off-screen on a narrow phone (`.compose-toolbar` wraps, `globals.css:919`); M2's only exit is
   its own chrome.
5. **The keyboard is dead whenever `editingId` is set, even with nothing focused.** Click a
   toolbar button while editing and the edit does not end (nothing at `board-toolbar.tsx` touches
   `editingId`), so Delete/arrows stay dead until you click a card or the board.
6. **An audio card cannot be selected by its face.** `card.tsx:385` stops `pointerdown` on the
   `<audio>` element so the scrubber works, which also prevents the inner's `onPointerDown` —
   the only selectable area is the ~7px padding ring (`globals.css:417`) and the meta panel.
7. **`onEdit` is not gated on `locked`** (`card.tsx:330`). The lock is a *position* lock only —
   a locked text card still opens for writing. Correct per its tooltip
   (`selected-bar.tsx:73`), but it is not what "locked" reads as.
8. **`select()` bumps `z` on every click** (`board-surface.tsx:268`), including re-clicking the
   already-selected card. Harmless, but it means every click is a DB write.

### 1.3 The exit paths — is any state a trap?

| from | how you get back to "nothing selected, board neutral" | trap? |
|---|---|---|
| selected | Escape · click empty board · click another card then Escape | no |
| editing | Escape (→ selected), Escape again (→ neutral) · click empty board (both at once) | no |
| editing, selection elsewhere (§1.1) | Escape clears `editingId`; the selection is where it was | **soft trap** — recoverable, but nothing on screen says the keyboard is being held |
| rotated | straighten button (`selected-bar.tsx:80-88`) · double-click the handle · undo | no |
| locked | the unlock button | no |
| select mode | the ⛶ toggle only | **soft trap** on a narrow screen |
| pen mode | cancel / done | no |
| a words offer | save / skip / Enter / Escape — but **only while its input has focus**; it never dismisses on a click elsewhere and never times out | **soft trap** — persistent chrome + a dead board keyboard |
| **standing beside a tilted card** | Escape · the straighten button — **but not by clicking** | **the hard trap.** Every pointer route out is blocked in the wedges; only the keyboard escapes |

The last row is the owner's report, exactly. Note that both of her available exits are things she
would have to be told about.

### 1.4 Where the hit area diverges from what is drawn

Ranked by how much damage each does.

| # | divergence | mechanism | drawn? |
|---|---|---|---|
| **H1** | **A rotated card's four wedges** — the parts of the un-rotated root box the tilt vacated | `globals.css:60-62` (`auto` on the un-rotated root) + `card.tsx:307` (the rotation on the inner) | **invisible.** The card grabs board it does not paint |
| **H2** | **Resize grab collars** — 26px zones around 11px dots (34/22 on touch), extending ~13px (17px) *outside* the card at each active handle and ~12px (16px) *inside* it | `card.tsx:20-41`, `:47-48`; re-resizable merges them over its own defaults (`resizer.js:52`) | **invisible.** Deliberate (a soak finding — an 11px dot was an 11px target), but it means near a corner "click the card" silently becomes "start a resize", and clicks up to 13px onto a neighbour are eaten |
| **H3** | **The media caption panel** — full card width, `top: calc(100% + 8px)`, rendered *below* the card and outside the root box | `globals.css:609-619`, `card.tsx:438-471` | drawn (background + border), so honest to look at — but it is **outside the geometry ledger** (absolutely positioned children do not enter `offsetHeight`/`borderBoxSize`, `use-geometry.ts`), so marquee, tidy, fit, snap and clear-spot all believe the card ends at its bottom edge. It also **appears and disappears with selection** (`card.tsx:443`), so the card's footprint changes when you pick it up |
| **H4** | **The rotate handle** — a 22px circle 26px above the card's top edge, orbiting with the tilt | `globals.css:447-460`, `card.tsx:276-303` | drawn. Correct — but at 150° it sits below the card, so there is a live 22px target where the eye expects board |
| **H5** | **The note doorway's whole face is a navigation door** at the second click | `card.tsx:331` → `board-surface.tsx:810` → `openSelected` → `router.push` | drawn as a card, not as a link. Combined with §0.3 this is the worst instance: a drag can navigate away |
| **H6** | **The words offer** — an opaque bar across the bottom-centre at `z-index:9500` that also holds the keyboard (guard ①) | `globals.css:1201-1215`, `words-offer.tsx:28` | drawn |
| **H7** | **The drawer, the toolbar, the selected bar** — screen-space chrome over the world | `globals.css:145-176` (z 5), `:908-926` (z 8, `pointer-events:none` container with `auto` children — gaps *do* pan through), `:1007-1021` (z 6) | drawn. The toolbar's fall-through is the pattern the rest should follow |
| **H8** | **The `<audio>` element's pointer shield** (§1.2 #6) | `card.tsx:385` | drawn, but the shield is invisible in effect |

**H1 is the only invisible divergence that grabs board the card does not paint. Everything else
is either drawn or a deliberate, small collar.** That is the whole diagnosis: one class of bug,
one place, one fix.

---

## 2 · Part 2 — what it should be

### 2.1 The model: one ladder, three rungs, per card

The board has no interaction model written down anywhere. `use-board-keys.ts`'s ①..⑤ comment is
the closest thing, and it describes only the keyboard. Here is the whole thing in one shape.

> **A card is on a ladder. You climb it one rung per click, and you come down one rung per
> Escape — or all the way down by touching the board.**

| rung | name | what it means | affordances |
|---|---|---|---|
| **0** | **on the board** | the card is a picture | nothing |
| **1** | **picked up** | the card is a *thing you are handling* | the ring, the resize dots, the rotate handle, the selected bar, tags, arrows, Delete |
| **2** | **inside** | you are in the card's content | text: the editor + its toolbar; note: its page. Media has no rung 2 |

- **Up:** one click enters rung 1. A second click on a card *already* at rung 1 enters rung 2 —
  **if that card has a rung 2**. Media/drawing/pdf/link cards must do *nothing* on the second
  click (they already do — `card.tsx:330-331` only branches on `isText` and `isNote`).
- **Down:** Escape steps down exactly one rung. A click on the board goes to 0 in one step. A
  click on another card moves the ladder — that card to rung 1, the previous card to rung 0.
- **Sideways:** the marquee and ⌘/shift-click put *many* cards on rung 1 at once. Nothing can be
  on rung 2 with more than one card selected — that is the invariant already implied by
  `editingId` being a single string.

That is what the code already almost does. It is not a new design; it is the design the code was
reaching for, stated so that the next feature can be checked against it.

**Four invariants make it true.** Each is currently violated in exactly one place:

| | invariant | violated by | fix |
|---|---|---|---|
| **I1** | **Rung 2 implies rung 1.** `editingId ∈ selectedIds`, always. | three `selectedIds` writers that ignore `editingId` (§1.1) | route every selection change through one `select`/`clear` pair |
| **I2** | **A gesture is a click or a drag, never both.** If the pointer moved, the release is a drop and the click grammar does not run. | `card.tsx:324` (§0.3) | a `moved` ref set in `<Rnd onDrag>`, checked in `onClick` |
| **I3** | **What is drawn is what is hit.** No element is a pointer target outside what it paints. | `.compose-card` (§0.1, H1) | move `pointer-events:auto` to the inner |
| **I4** | **Every rung has a pointer way down, and it is always reachable.** | I3's breach — the board is unreachable in the wedges | falls out of I3 |

I1–I4 are the whole model's enforcement surface. All four are inside our own code. **None of them
needs the input engine.**

### 2.2 The owner's view/edit board mode — my answer is no, and here is the honest version of yes

**What she is actually asking for.** Two different wants are riding in one sentence:

- **W1 — "let me read this board without breaking it."** Real, and not solved by anything here.
- **W2 — "make the board stop swallowing my clicks."** That is H1, and it is a five-line bug.

**A board mode does not solve W2.** In a "view only" board the `<Rnd>` root still exists, still
carries `pointer-events:auto`, and the board's `pointerdown` still bails at
`board-surface.tsx:638`. The wedges would still be dead. You would be stuck in *view* mode
instead of stuck in *arrange* mode. The only version of a board mode that fixes W2 is one that
stops rendering `<Rnd>` entirely — which is a bigger, riskier change than fixing the CSS.

**A board mode would cost more than it looks.** *(This is the part where I am arguing against her
proposal, so it should be specific.)*

- A new piece of world state, with three questions attached that the archive round already proved
  expensive: is it per board or per device? does it persist? does duplicating a board carry it?
- A control to find, on a toolbar that already wraps on a phone (`globals.css:919`) and already
  carries 20 buttons.
- A second meaning of "frozen" sitting beside the existing per-card lock, which is a **position**
  lock and not a read lock (§1.2 #7). Two overlapping ideas of the same word is how the
  bookmark/link drift happened.
- And the one the brief names: every act would need a mode check. Today there are ~14 act sites.

**The cheaper mechanism that gets W1 anyway.** The codebase already enforces "you cannot rearrange
this" at eight places, all keyed on one field — `card.locked`:

`card.tsx:236` (drag) · `card.tsx:238` (resize) · `card.tsx:276` (the rotate handle) ·
`selected-bar.tsx:80` (straighten) · `board-surface.tsx:389` (group drag) · `:453` (nudge) ·
`:473` (tidy) · `:502` (align/distribute).

So the honest version of "view only" is: **derive `locked` onto every card from one board-level
flag.** One line where the cards are assembled — `boardIsResting ? cards.map(c => ({...c, locked:true})) : cards`
— and all eight checks fire for free. Derive-don't-duplicate, no new checks, no new concept for
the owner to learn (she already has "some cards opt out"; this is "all of them, for now"). It
needs three guards, not fourteen: hide the per-card lock button while the flag is on, refuse
`toggleLock`'s write, and add the missing `!card.locked` to `card.tsx:330` so it stops text
editing too.

**Recommendation:** do not build it yet. Ship I2 and I3 first — they are hours, not days — and
find out whether W1 survives. If it does, build the derived-lock version above, not a mode with
its own act-checking layer. If she wants it anyway before the fixes, the derived-lock version is
still the right shape and I would build that one.

### 2.3 The named flow, walked

> *"Someone is viewing the bit as opposed to clicking into it and then for example rotating it or
> even editing it or moving it around and then clicking out and then clicking onto something
> else."*

| step | today | in the model |
|---|---|---|
| **view a bit** | rung 0. Works. | unchanged |
| **click into it** | one click → rung 1: ring, dots, rotate handle, bar (`card.tsx:276`, `:237`). Works. | unchanged. The *whole* answer to "what changed?" is: the card grew handles |
| **rotate it** | grab the handle, turn, release; one undo act (`use-arrange-acts.ts:183`). The gesture works — v3 fixed it. **But the card's clickable rectangle does not turn with it.** | **I3.** The tilted card is hit where it is drawn. Nothing else about rotation changes |
| **edit it** | second click → rung 2; the content straightens (`card.tsx:144`); tiptap focuses at the end (`text-bit.tsx:193`) | unchanged, plus **I2** (a second *drag* must not enter) |
| **move it** | drag it. On drop the click grammar fires: a selected text card enters edit; **a selected note navigates away** (§0.3) | **I2.** A drop is a drop |
| **click out** | click the board → clears both (`board-surface.tsx:639`, `:654`) — **unless the click lands in a wedge, a resize collar, or the caption panel** | **I3** (+ H2/H3 in the cheap tier). The board is always reachable where it looks reachable |
| **click something else** | the neighbour selects and the old card drops to 0 (`:267`, `:274`) — **unless the neighbour is under a wedge**, in which case nothing happens and a drag would move the wrong card | **I3** |

Every failure in that flow is I2 or I3. Neither needs a mode, a new control, or the input engine.

### 2.4 Rotation's place — ship it, uncapped, after I3

`rotation-plan.md` §V4 §4 lists four properties a functional rotation needs and grades today's
build 1/4. With I3:

| property | today | after I3 |
|---|---|---|
| 1 · what you see is what you click | ✗ | **○** — the hit shape *is* the drawn shape, at every angle |
| 2 · you can always get out | ○ | ○ |
| 3 · the control is findable at any angle | ✗ | **○, with a caveat** — see below |
| 4 · neighbours stay reachable | ✗ | **○** |

**On property 3.** §V4 calls the orbiting handle unfindable at 150°. I read that complaint as a
*symptom of the same mismatch*: at a big tilt the card **looks** rotated but **behaves** as an
upright rectangle, so the handle appears displaced relative to the thing you can actually touch.
Once the drawn card is the card, the handle is on the card's own top edge — which at 150° is
visibly at the bottom, and reads as attached, because the stem draws it attached
(`globals.css:461-472`). The straighten button (`selected-bar.tsx:80-88`) is the guaranteed
second route regardless.

**So: no angle cap.** §V4's fork — (A) cap at ±20°, (B) park until the input engine, (C) ship
as-is — was drawn under the assumption that only owning the input layer could make property 1
true. That assumption was wrong (§0.2), so the fork dissolves: **rotation becomes honest to ship
the moment I3 lands, and there is no reason to cap what the owner explicitly asked to be
uncapped** (*"everything should be able to be rotated… a whole little rotation thing"*,
`build-queue.md:268`).

Hold ±20° in reserve as a one-line clamp in `card.tsx:169` if the owner's hands say the handle is
still hard to find at big angles. That is a 30-second hand test, not a design decision.

**What rotation still owes after I3, honestly:**

- **marquee** hit-tests the axis-aligned stored box (`use-marquee-select.ts:71`) — a band that
  visually crosses a steeply tilted card may miss it. Pre-existing in kind (text cards' stored
  `h` is stale by design). Real but small; §3 (b).
- **snap guides and align/distribute** already exclude rotated cards, owner-ruled
  (`board-surface.tsx:311`, `:373`, `:502`; `build-queue.md:277`).
- **the resize dots stay upright**, ruled and accepted (`globals.css:425-433`); re-resizable
  computes in unrotated screen space.
- **centre-alignment survives rotation and edge-alignment does not** — noted at
  `build-queue.md:281`, still not designed. Fine.

---

## 3 · Part 3 — ranked recommendations

### (a) Now, cheaply — this is what makes the flow coherent

| # | change | file:line | cost | what it buys |
|---|---|---|---|---|
| **A1** | **I3 — only what is drawn catches the pointer.** Move `pointer-events:auto` from `.compose-card` to `.compose-card-inner`; add `pointerEvents:'auto'` to the `dot` base in `handleStyles`. | `globals.css:60-62`, `card.tsx:26-30` | **~6 lines** | Kills H1 outright. The wedges vanish; neighbours become reachable; the board becomes clickable; rotation stops being a trap. Zero change at 0°. Proof: hover a tilted corner — the cursor stops being `move`; click there — the selection clears. |
| **A2** | **I2 — a drag is not a click.** A `moved` ref, set in `<Rnd onDrag>`, cleared in `onDragStart`, checked at the top of `onClick`. Delete the false comment while you are there. | `card.tsx:252-253`, `:324-332`, `:328` | **~5 lines** | Stops a drag from entering edit mode, from navigating away on a note doorway, and from toggling a card out of a shift-selection. Ends the "click out feels wrong" half of the report. |
| **A3** | **I1 — one door for selection.** Make `jumpToCard`, `duplicateSelected` and `bringIn` go through a helper that clears `editingId` when the target changes (or fold that clear into `selectOne` itself). | `board-surface.tsx:68`, `:598`, `:619`; `use-create-doors.ts:475` | **~10 lines** | Removes the stranded-edit deadlock the code already warns about twice and still ships. |
| **A4** | **The resting caption stamp stops owning board.** `pointer-events:none` on `.compose-media-meta` when the card is *not* selected (the editable version stays live). | `globals.css:609`, `card.tsx:443` | **~3 lines** | Removes H3's silent strip under captioned media. Lower confidence this bothers her — do it with A1, do not lead with it. |
| **A5** | **An audio card selectable by its face.** Select before stopping propagation on the player. | `card.tsx:385` | **2 lines** | Removes the 7px-ring-only bug (§1.2 #6). |
| **A6** | **Write §2.1 into `use-board-keys.ts`'s comment block, or beside it.** The ①..⑤ comment is the best statement of intent in the repo and it covers only the keyboard. | — | prose | The next feature gets checked against a stated model instead of against three failed plans. |

A1+A2+A3 together are the answer to "what are the steps that people need to be able to take."
They are half a day and they are all in our code.

### (b) Needs a real feature

| # | change | cost | gate |
|---|---|---|---|
| **B1** | **"Rest this board" — the derived-lock version of view-only (§2.2).** One board-level flag deriving `locked:true` onto every CardVM in one place; hide/refuse the per-card lock button while on; add `!card.locked` to the second-click edit door. | ~1 day + a migration | **Build only if the want survives A1–A3.** If she asks for it before, build this shape, not a mode |
| **B2** | **Rotation-aware marquee.** The ledger carries `angle`; the marquee tests the rotated rectangle. | ~1 day | Only if it is felt |
| **B3** | **A visible statement of "you are inside this card."** Today rung 2's exit exists (Escape) and is stated nowhere. The selected bar is the natural home. **The words are the owner's to write.** | small | Do it with A6 |
| **B4** | **Escape leaves select mode and pen mode.** Both currently have exactly one exit and it is a button. Two lines each, but it changes two modes' contracts, so it is a decision, not a fix. | small | Owner's call |

### (c) Genuinely waits for the input engine (D-135, layer 1)

| # | why it waits |
|---|---|
| **C1** | **Magnetic snap during a drag.** Already named in the code: react-rnd ignores position changes mid-drag (`board-surface.tsx:280-283`). The guides can only land the card at drop today. |
| **C2** | **A real tap-vs-drag threshold on touch.** react-rnd's internal thresholds are a black box, and the phone tap-swallowing suspicion lives exactly there (`board-actions-technical-audit.md` Part 2b, stage 2). A2 is a *guard on the result*; a threshold is a *recogniser*, and we do not own the recogniser. |
| **C3** | **Live-tracked drag positions** (arrows/links). F2 in the audit: the dragged card is deliberately uncontrolled mid-drag. |
| **C4** | **Rotating a multi-selection about a shared centre**, and grabbing a rotated card's *edges* to resize. Both need hit polygons we own. |
| **C5** | **Resize handles that agree with the tilt.** re-resizable computes in unrotated screen space — ruled and accepted, and only ownership changes it. |

Nothing in (a) or (b) is blocked by (c), and (c)'s sequence is unchanged
(`board-actions-technical-audit.md` Part 5: undo → geometry registry → own the input → the note
panel → links). **A1 does not pre-empt owning the input layer; it makes the board honest until
that lands.**

---

## 4 · The process note

Three plans in a row modelled the tilt and never modelled the *reach*. §V4 named that correctly
and then made the same shape of mistake one level up: it reasoned about the hit-testing
consequence from the plan's own description of the DOM instead of from the DOM, concluded the
problem was structural, and parked a feature the owner had explicitly ruled in. The actual
mechanism was two CSS declarations apart from the one the plan named, and the fix is smaller than
any of the three plans.

The check that would have caught it, and that this study is the belated form of: **for any
feature that changes how a card is drawn, write down the card's hit region and its drawn region
as two separate shapes, and require them to be the same shape.** That is I3, and it is worth
adding to `invariants.md` as a UI-level always-true rule the day A1 ships.
