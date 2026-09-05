# The card split — detailed plan (item 2b)

> **Stage marker:** the foundations stage · item **2b** of `build-queue.md` §4e-2 · item-loop
> stage: **plan, for the owner's review — NOTHING BUILT.** Ruling: D-148 (two-agent convergence;
> owner chose the staged path). Gate it satisfies: **L4 rendering, before modes.**
> Verdicts behind it: `whats-built-at-this-stage.md` §5b · both agent reports (2026-09-05 session).

**The goal in one line:** the card's *shell* (drag · resize · rotate · select — confirmed right)
stays exactly as it is; the *insides* stop being a 594-line branch pile and become **one small
per-type table + one small content file per type**, so a new bit type is a row + a file, a
forgotten renderer is a compile error, and interactive content can't fight the drag layer.

**The owner's constraint, standing:** small proven steps, no big errors — each step lands with
its own tests, is revertible alone, and the next doesn't start until the last is green.

---

## Step ① — the net first: click-grammar tests *(nothing moves yet)*

The riskiest code in the split is the select/edit/open grammar (card.tsx:330–352). It has no
tests. **Investigated 2026-09-05: extraction is clean** — the decisions are a small pure function
of `(wasSelected, dragged, additive, isText, isNote, editing)`; the side effects (onSelect /
onEdit / onOpen) stay with the caller.

- **Change:** lift the decisions into `click-grammar.ts` (pure, like `act-rules.ts`); card.tsx
  calls it. Behavior identical.
- **Tests first:** characterization tests of TODAY'S behavior — every cell of the grammar
  (drag-ended click is inert · additive toggles · second click on text edits · second click on a
  note doorway opens · shift-drag never deselects — the two shipped bugs become fixtures).
- **Proof:** tests green against the extraction; revert the extraction wiring → the suite still
  pins the behavior (the net exists independent of the split).

## Step ② — the "don't drag me" marker *(~an hour, standalone value)*

- **Change:** the shell's `cancel` selector (card.tsx:256, already used for the rotate handle —
  react-rnd README §cancel, verified) becomes `".compose-rotate-handle, .nodrag"`; interactive
  children carry `className="nodrag"`.
- **Each existing stopPropagation site read individually before touching** (audio scrubber :405 ·
  LinkOut :507 · SourceLine :529 · ContentLine :583 · toolbar in text-bit) — some suppress
  *click-select* as well as drag; those keep that half. No blind sweep.
- **Tests:** a boundary test — interactive elements inside cards must carry `.nodrag` (grep-level,
  like `boundaries.test.mjs`); grammar tests from ① stay green.

## Step ③ — the per-type capability table *(~20 lines of truth)*

- **Change:** `card-kinds.ts`: `Record<CardType | "note", { resize: "reflow" | "scale";
  flexHeight: boolean; aspectLock: boolean; chrome: "title-above" | "caption-below";
  enter: "write" | "focus-caption" | "open" }>` — the four consequences currently packed into the
  `isFlexSized` binary, unpacked into declared fields (tldraw's flag pattern at our scale).
  card.tsx's inline ternaries read the table; `isFlexSized` dies or derives.
- **Why before the new types:** a table bit wants both-axis resize *without* aspect lock —
  neither of today's two presets; the first type outside the binary otherwise becomes nested
  conditionals.
- **Tests:** `Record<CardType, …>` makes completeness a COMPILE error; grammar tests read
  `enter` from the table and stay green.

## Step ④ — the union + one content file per type *(the split itself, type by type)*

- **Change:** `CardVM` becomes a discriminated union on `type` over a common geometry base
  (x/y/w/h/z/angle/locked/id stay in the base). Each inline content ladder moves to its own file
  (`content/image-content.tsx`, audio, pdf, link, note-doorway; text and drawing already live in
  `text-bit.tsx` / `doodle-bit.tsx`). Dispatch: `Record<CardType, Component>` + an exhaustive
  switch — **a forgotten renderer refuses to compile; the runtime fallback SAYS "unknown type",
  never an empty box.** The duplicated title/caption+source chrome renders once, placed by
  `chrome` from the table.
- **⚠ Measured, not assumed: 18 files consume CardVM** (grep 2026-09-05; the agent said ~10).
  Sub-step: a per-consumer field audit BEFORE the union lands — expected: nearly all touch only
  base fields (drag, geometry, arrange, queue); any consumer reading per-type fields gets the
  narrowed member. The audit's table goes in this file when run.
- **One type at a time, committed separately:** image → pdf → link → audio → note-doorway. Each
  commit: build + tests + the board looks identical (owner spot-check at the end, not per type).

## Step ⑤ — chrome outside the clip plane *(DEFERRED to the frame build)*

The R5 catch (an overhung card's handles must not clip with it) needs the shell to render
selection chrome in a sibling layer. Designed here, built with the frame — nothing needs it
until a bounded board exists. → `frame-spec.md` layer map row 5.

## Step ⑥ — perf *(MOVED to the modes build, D-149 — optimization doesn't ride inside a foundations item)*

Stable handlers instead of ~17 inline closures per card → `memo` on the shell → pan stops
re-rendering N cards. The idle-tiptap question (an at-rest text card mounts a full editor)
belongs to the MODES plan (its "writing machinery idle in arrange" goal), not here — noted so
it isn't lost.

---

## Order and gate

① → ② → ③ → ④ complete **before the modes build starts** (both agents' hard constraint: modes
edits the same grammar). ⑤ waits for the frame. ⑥ moved whole into modes (D-149).

## Open questions

- **To the owner — none blocking.** Two will arrive with later items, flagged now: what `enter`
  means for a checklist and a table card (modes-spec §4 table, at their build); what `chrome` a
  table card carries (at its build).
- **To investigate at step start** (mine, method named): ①'s extraction verified clean · ②'s
  per-site reads · ④'s 18-consumer field audit.
