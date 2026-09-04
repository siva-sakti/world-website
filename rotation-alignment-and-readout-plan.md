# Rotation: align a tilted card, and show the angle while you turn it

**Two owner-reported bugs, 2026-09-03.** Both are small on the surface; the second
**overturns a prior ruling** and is the interesting one.

---

## Bug 1 — the angle is invisible while you turn a card

*"I'd like for it to say the degrees when you click on it… have it be like active, showing
you the rotation."*

**Straightforward.** The rotate gesture already computes the live angle; nothing shows it.
Add a small readout beside the handle — `−12°` — visible only during the gesture.

**One constraint that decides the implementation:** a rotate must not re-render the board
on every frame, for the same reason the snap guides don't (a single-card gesture causes zero
re-renders today, and a decoration must not change that). So the readout is a **permanently
mounted element whose text is mutated directly**, exactly like `vGuideRef` / `hGuideRef` in
`use-card-drag.ts` — not React state.

Rounded to whole degrees. Shown on the straighten-to-0 snap too, so "back to upright" is
legible rather than felt.

---

## Bug 2 — a rotated card can't be aligned. **The owner wants it to be.**

*"Once a bit is rotated, if you try to bring it into alignment you're not able to. To me
that's a bug. That's something that needs to happen."*

### What the code does today, and why

A tilted card is **excluded from alignment in four places**:
`use-alignment-acts.ts:86` and `board-surface.tsx:444` (the button's count), and
`use-card-drag.ts:83, 149` (it neither snaps nor offers itself as a snap target).

The stated reason (`rotation-plan.md` §5, previously owner-ruled): *"its stored rectangle is
no longer what the eye sees, so aligning its edges would line up something invisible."*

**That reasoning is correct. The conclusion drawn from it is not.** The right response to
"the stored rectangle isn't what you see" is **to align by what you DO see** — not to refuse.

### The fix: align by the card's visual box

The tilt is a CSS transform on the card's **inner** content, so `w`/`h` and every measurement
stay in **unrotated space** (`card-vm.ts:48`). That is exactly the input this needs.

For a `w × h` card tilted by θ about its centre, the upright box that contains it is:

```
W = |w·cos θ| + |h·sin θ|
H = |w·sin θ| + |h·cos θ|
```

…centred on the same centre. So the visual left edge is `centreX − W/2`, and to put that edge
at `target`:

```
centreX = x + w/2          (the stored x is the unrotated top-left)
x       = target + W/2 − w/2
```

The same for right/top/bottom/centre, and distribute spaces the **visual** boxes so the gaps
you see are the gaps that are equal.

**Why this is the honest fix:** at θ = 0, `W = w` and `H = h` — the formula collapses to
exactly today's behaviour for every upright card. Nothing changes for the common case, which
is what makes it safe.

### What it touches
- **`geometry.ts`** — one new pure function, `visualBox(card)`. This is where the maths lives
  and where it can be tested. *(No React, no database — the layer that is already 90%
  confidence in the code map.)*
- **`board-arrange.ts`** — `alignPatches` / `distributePatches` compute against `visualBox`,
  then convert back to a stored `x`/`y`.
- **Delete the four `!c.angle` filters.** Locked still opts out; rotated no longer does.

### The questions this raises — worth deciding, not discovering
1. **Snapping while you drag a tilted card** — same maths, but the guide *lines* would need to
   draw at the visual edges too. **Recommend: do alignment first, snap second**, as its own
   step. The owner asked for alignment; snapping is a bigger surface.
2. **Tidy** (the grid) already includes rotated cards and should keep doing so — it places
   cards in slots rather than aligning edges, and a tilted card sits in a slot fine.
3. ⚪ **What should "align left" mean for a tilted card — its leftmost CORNER, or the edge it
   would have upright?** The corner (the visual box) is what the eye reads and what this plan
   implements. Worth one look at the result before it is called right.

### Proof
`visualBox` is pure maths in the tested layer, so this gets real tests:
- θ = 0 returns the card's own box exactly *(the safety property above)*
- θ = 90° swaps width and height
- θ = 45° on a square grows the box by √2, centre unmoved
- aligning three cards, one tilted, leaves three **visual** left edges equal
- a full turn (θ = 360) behaves as θ = 0

**Then the owner looks at it** — the maths can be proven, "does it look aligned" cannot.

---

## Order and size
| | | |
|---|---|---|
| 1 | **The angle readout** | small · no model change · nothing to decide |
| 2 | **`visualBox` + its tests** | small · pure maths, provable |
| 3 | **Alignment uses it; drop the four filters** | small · owner looks at the result |
| 4 | Snapping uses it *(separate)* | medium · own step, own decision |

**Supersedes `rotation-plan.md` §5's "a rotated card opts out of alignment"** — owner-ruled
2026-09-03. The *observation* behind §5 stands and is now the reason for the fix rather than
the reason for the refusal.
