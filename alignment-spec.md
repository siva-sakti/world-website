# Alignment — the spec (everything that helps things line up)

**Status: 🟡 SPEC, not a build order.** Written 2026-09-02, before any code, at the owner's
instruction: *"what are all the things that feature needs to have… actually defining this and
figuring out what you don't know, what you need to ask me about, what you need to think about,
and then only building."*

**The owner also widened it:** *"does this also touch the fact that someone can turn on the grid
lines on the background of a board so they can align to things, snap to things — to me
rearranging is also part of this feature set."* Yes to both. This document covers the family.

---

## 1 · The five pieces

| # | Piece | What it does | Who drives it | State |
|---|---|---|---|---|
| 1 | **tidy up** | rearranges a selection into a uniform grid | a button | ✅ **built** (owner ruled: stays as-is, not extended) |
| 2 | **alignment guides** | magenta lines while you drag ONE card; it lands aligned on release | your hand | maths ✅ built + tested, **unwired** |
| 3 | **align / distribute** | make several cards' edges or centres match | a button | ❌ not built |
| 4 | **background grid** | a visible lattice on the board you can place against | a toggle | ❌ **not specified — the new piece** |
| 5 | *ruler guides* | lines you drag out and place yourself, permanent | your hand | ❌ not raised — named only so the family is complete. **Not proposed.** |

**They are genuinely different jobs**, which is why they can coexist without overlapping:
1 and 3 move cards *for* you · 2 helps *your own hand* · 4 gives you something to aim at.

---

## 2 · THE TENSION THAT HAS TO BE RESOLVED FIRST

The guides' design (`geometry-registry-plan.md` §4b) was ruled **from the owner's own reference
screenshots**, and the ruling was:

> **"snapping is a whisper, never a grid"** — small threshold, easy to drift past, edges and
> centres only. Her practice: *"alignment is available but the composition stays LOOSE — varied
> scales, deliberate slight overlaps, some rotation, generous white ground."*

**A visible background grid pulls the other way.** A lattice invites you to sit on it; that is
what a lattice is for. It is not a contradiction — a grid can be opt-in and off by default —
but the two features have opposite instincts, and building both without saying so would quietly
undo a ruling made from the owner's own references.

**This is the first question in §6, and it is genuinely open.**

---

## 3 · Precedence — what wins when two things could claim the same drop

This is the real design work, and one obvious answer is wrong.

**The wrong answer: "nearest wins."** A grid line is *everywhere* — at 20px spacing, something
is always within 6px. Nearest-wins would let the grid swallow card-to-card alignment entirely
and you would never see a card guide again.

**The rule: cards beat the grid, per axis, independently.**
- Horizontally: if any card alignment is in range, take it. Otherwise, if the grid is on, take
  the grid. Otherwise leave it where the hand put it.
- Vertically: the same, decided separately.

So you can be card-aligned left while grid-aligned top. That falls out of the axes already being
independent in `snapTo`, and it is what a hand expects.

**Corollary:** a visible grid never *replaces* the card guides; it fills in where they are silent.

---

## 4 · The rules, stated flatly

- **Only a hand-drag snaps.** Never: arrow-key nudges · tidy · the align buttons · dropping a
  file · calling a bit in from the drawer · undo/redo. Those all place things deliberately, and
  a snap would fight the intent.
- **Alt/Option refuses the snap** for that gesture (⌘ is additive-select — collision ruled, D6).
- **Guides live in the canvas**, so they pan and zoom with the board rather than floating over
  the screen.
- **Guides appear only during the gesture** and vanish on release.
- **Locked cards are targets, not draggers** — you can align against something you can't move.
- **Threshold is SCREEN pixels ÷ zoom**, so the feel is identical at every zoom (a world-space
  threshold would be 1.2px at 0.2× and 18px at 3×).
- **Visible grid = snapping grid.** A visible grid that does not snap is decoration; an invisible
  grid that snaps is spooky. One toggle, both behaviours.
- **Align buttons ignore the grid.** Making cards match *each other* is the whole point; landing
  on a grid line is coincidence, not a goal.
- **A snapped drop records as one ordinary move** — undo reverses it like any other.

---

## 5 · The cases

| Situation | What happens |
|---|---|
| drag a card, nothing near | no guide, no snap, lands where you put it |
| drag near one card's left edge | vertical magenta line; lands edge-matched on release |
| drag near one card horizontally AND another vertically | both lines; snaps in both, to different neighbours |
| drag with Alt held | no guide, no snap |
| drag a group | the card under your hand finds the alignment; the whole selection moves by that delta |
| drag near a LOCKED card | snaps to it (it is a target) |
| drag a captioned image | aligns the **picture's** box, not the caption below it — flagged for the feel-tune |
| grid on, no card in range | grid claims the axis |
| grid on, a card in range | **the card wins**; grid silent on that axis |
| zoomed far out, grid on | grid hides (see §7) — snapping to a 4-screen-px lattice is meaningless |
| nudge with arrows | never snaps, grid or not |
| tidy / align buttons | never snap; they place deliberately |

---

## 6 · WHAT I NEED FROM THE OWNER (nothing here is Claude's to decide)

1. **Do you actually want the background grid — or were you naming what other tools have?**
   §2 is the reason this is a real question, not a formality. Both can exist; but if the grid is
   built, it should be because you want a lattice to compose against, not because InDesign has one.
2. **If yes: what is it FOR?** Two different features wear the same clothes —
   (a) *visual rhythm* — a faint ground that makes the composition feel ordered; you may not even
   snap to it. (b) *precision placement* — you want things ON the lines.
   The answer changes the spacing, the contrast, and whether it snaps at all.
3. **Spacing.** A feel-tune, best judged on a real board rather than chosen in advance.
4. **Per board, or one setting for the whole app?** A grid on your moodboard but not on your
   reading list is plausible; so is one preference everywhere.
5. **What do we CALL this family?** `lexicon.md` is the naming authority and Claude should not
   mint a product word. "Guides"? "Alignment"? Something of yours.
6. **The magenta, and how strong the pull is.** Already scheduled as stage 4's gate — needs your
   eyes on a live board, not a value picked in advance.

---

## 7 · What Claude settles by investigation (not owner questions)

- **How the grid renders.** A repeating CSS gradient on the world layer costs nothing and scales
  with the zoom transform for free. To confirm before relying on it.
- **The zoom threshold at which the grid hides**, and whether it should coarsen (double the
  spacing) instead of hiding. Measurable, not a matter of taste.
- **Whether guides can render imperatively** without causing React re-renders per drag frame — a
  single-card drag causes ZERO re-renders today and must stay that way.
- **Where the align buttons live.** The selected-card bar only appears for a SINGLE selection;
  align needs two or more, so it belongs on the multi-select toolbar. To verify.

---

## 8 · The honest limits, stated before building

- **The card will not stick to a line while you drag.** The guide shows live; the card settles on
  release. react-rnd ignores position changes mid-drag — traced through its source. Magnetic pull
  needs the ruled input-engine work, and this is not it.
- **No spacing/distribution *guides*** (the "equal gaps" hints some tools show). The align family
  gets a *distribute button*; live equal-gap guides are a bigger job and are not proposed.
- **No rotation.** Ruled out of v1 long ago; the references show it in use, recorded as evidence
  for the aesthetics phase, not re-opened here.

---

## 9 · Proposed order (each gated and committed alone)

1. **Guides — draw only.** Lines appear during a drag, nothing moves yet. Cheapest proof the
   maths is wired to reality, and it lets the owner judge the *feel* before cards start relocating.
2. **Guides — snap on release**, single card, Alt to refuse.
3. **Guides — group drags.**
4. **Align / distribute buttons** — the owner's PowerPoint ask; simpler than the guides, and
   likely more daily use.
5. **The background grid** — *only if §6.1 says yes*, and after the guides, so the precedence rule
   in §3 can be judged against something real.
6. *(Optional, owner offered earlier)* the live W×H readout during a resize.
