# Layout foundation — fit to any screen (plan)

**What this is:** the plan to fix the *base layout logic* so the app is dynamic to any screen size, resize, and zoom — desktop, the Daylight tablet, and phone. It fixes **structure, not style**: the owner is redesigning the look of the elements, so this lays a solid foundation to restyle on top of, and deliberately leaves visual design alone. Owner + Claude, 2026-08-03. **📜 HISTORICAL — the responsive-foundation work here shipped; do not build from this; the current model is `model.md`.**

**Why now:** a full diagnosis found the app has **no responsive layer at all** (zero `@media` queries, zero breakpoints) and two canvas surfaces sized by a hardcoded magic number — which is why the board's bottom "remove/trash/tag" bar gets cut off. Better base logic is worth setting now, while the visual redesign is still being ideated.

---

## The diagnosis (what's actually wrong)

- **No responsiveness.** 0 media queries / breakpoints in the codebase — one layout, tuned for one screen.
- **Magic-number surfaces (×2).** The **board** is `height: calc(100dvh − 130px)` and the **graph** is `calc(100dvh − 150px)` — each *guesses* the chrome height above it. The real chrome is ~158px and **varies** (the board-tags bar grows, the toolbar can wrap, browser chrome differs), so the surface hangs below the fold and its bottom-pinned bar is clipped.
- **The top toolbar can't wrap** (`.compose-toolbar` is a non-wrapping flex row) → the right end clips on narrow screens.
- **The notes panel is a fixed `260px`** → most of a phone screen; doesn't adapt.
- **What's already fine:** the reading pages (`mx-auto max-w-* px-6 py-*`) flow, center, and scroll — reasonably responsive; the floating popups (`[[` picker, peek) are already screen-edge-aware; the intake modal uses `min(420px, 100%−32px)`. So the problem is concentrated in the **two canvas surfaces + the toolbar**, not everywhere.

---

## The strategy — three principles

1. **Fit to screen, never subtract a guess.** A full-screen surface fills the **dynamic viewport** and lets flexbox compute the leftover space — no hardcoded chrome height ever.
2. **Float the canvas chrome over the canvas.** The board's toolbar + per-note bar are **overlays pinned to the surface edges**, not rows stacked above it. The canvas gets the whole screen, the chrome is always in view, and there's no chrome height to subtract (Figma / Miro / Maps pattern).
3. **Tier by device, don't cram.** A spatial canvas is a **desktop + Daylight-tablet** experience; the **phone** is capture + read + view. Don't force full board-editing onto a phone — make reading/capture great there and the board *viewable*.

---

## Mobile strategy (the owner asked; this is the recommendation)

**Two device classes:**
- **Phone (< ~640px):** reading, capture, and note-viewing are first-class (lists already flow). The board is **pannable + viewable** with collapsed **floating icon controls** + a **summon-able notes drawer** (not a fixed side column). Heavy arranging is de-emphasized — that's the Daylight/desktop's job.
- **Tablet (Daylight) + desktop (≥ ~640px):** the **full board**, with **touch-comfortable** controls on the tablet (the Daylight is a primary compose device — 60Hz touch + stylus — so it's first-class, not an afterthought).

**Technical must-haves (baked into the foundation):**
- `100dvh`, never `100vh` (mobile address-bar safe).
- Tap targets **≥ 44px** on touch.
- `touch-action: none` on the canvas (already present) so the browser doesn't hijack pan/zoom.
- `env(safe-area-inset-*)` padding on floating chrome (notch / home-bar safe).
- No hover-only affordances (touch has no hover); every hover cue has a tap path.

---

## The plan (structure only — verify each, then the owner feel-tests on real devices)

1. **Fit-to-screen shell for the board + graph.** Make each page a flex **column filling `100dvh`**; header/tags take their natural height; the **surface gets `flex: 1`** and fills the rest. Deletes both magic numbers (`−130px`, `−150px`) and the `min-height: 380px` floor. Nothing can hang below the fold at any size.
2. **Float the board chrome.** Toolbar → pinned top overlay; the per-note remove/trash/tag bar → pinned bottom overlay; both **wrap / stay compact** so they never clip. (This is also *why* the surface can be pure `100dvh` — no chrome above it to subtract.)
3. **Adaptive notes panel.** Replace the fixed `260px` with a width that adapts — a side column on wide screens, a **drawer/sheet** on phones.
4. **Responsive baseline.** Introduce a minimal breakpoint set (one phone, one tablet) — *only where structure changes* (chrome compaction, panel mode, padding, tap-target sizing), not styling.
5. **Touch + viewport correctness.** `dvh` throughout the shell; `env(safe-area-inset)` on floating chrome; ≥44px touch targets; confirm `touch-action`.

**Explicitly out of scope (the owner's redesign):** colors, typography, spacing rhythm, the *look* of buttons/bars/cards, iconography, final placement polish. This plan gives a foundation that any of those can sit on.

---

## Verification
- `pnpm build` + typecheck green after each step.
- A throwaway **static layout harness** (the shell + mock chrome + a fake canvas, no login needed) opened at **phone / tablet / desktop** widths, screenshotted — proves the fit-to-screen + overlay logic holds across sizes before it touches the real app.
- Owner feel-tests the live app on the **Daylight + phone + a resized desktop window** (the layout truth only the devices can tell).
