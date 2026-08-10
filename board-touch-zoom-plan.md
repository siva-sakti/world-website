# Board touch zoom — pinch + a readable mobile open (plan)

**What this is:** the plan to make the board zoomable on touch (it currently is NOT — owner hit this live on their phone) and to open the board readable on a small screen instead of fit-all-tiny. Planned against the current code, 2026-08-03; **cold-reviewed same day** (findings folded in below). *(Recreated 2026-08-09 in the GitHub working copy after macOS locked the local Documents folder.)*

## The diagnosis (verified in code)
- **Zoom exists only on the mouse wheel.** `use-camera.ts` attaches one native `wheel` listener (non-passive, zoom-toward-cursor). There is **no touch path at all**.
- **The browser's own pinch is disabled on purpose** — `.compose-board { touch-action: none }` (globals.css) so the app owns gestures. Right call for pan/create, but with no app pinch handler, touch zoom is simply absent.
- **Pointer handling today** (`board-surface.tsx`): `onBoardPointerDown` ignores everything but empty board space (`e.target !== boardRef.current`), then either starts the marquee (select-mode) or a pan; `onBoardPointerUp` detects the double-tap that creates a note. **A second finger currently lands in the same handlers** and stomps `pan.current` — two fingers today = a glitchy pan, never a zoom.
- **On open**, `fitView(initialCards)` frames everything — correct on a big screen; on a phone it computes a tiny scale (the "everything is small" the owner reported).

## The design

### 1. Pinch-to-zoom (+ two-finger pan) on the board
- Track **touch pointers by pointerId** in a Map (touch has implicit pointer capture, so moves keep firing on the board once a finger lands on empty space).
- **Second finger down → pinch starts:** record the starting distance `d0`, starting scale, and the world point under the fingers' midpoint. Kill `pan.current`, `lastTap`, and `isPanning` — two fingers are never a tap/pan/create.
- **On move:** new scale = `s0 × d/d0`, clamped to the existing MIN/MAX (0.2–3); reposition so the recorded world point stays under the *current* midpoint — **zoom + two-finger pan in one gesture** (the standard feel).
- **On up/cancel:** drop the pointer; below two fingers the pinch ends. The remaining finger does **not** resume a pan (prevents the end-of-pinch jump); lift and touch again to pan.
- The math mirrors the wheel-zoom's anchor math (same clamp, same world-anchor idea) — one mental model, implemented in `use-camera.ts` as `pinchDown/pinchMove/pinchUp` handlers the board dispatches to, **exactly like the marquee's start/move/end pattern** already in the code.
- **Rect-local coordinates, stated explicitly (review finding 5):** the camera's x/y live in board-rect space (`screenToWorld` and the wheel handler both subtract `rect.left/top`). The pinch midpoint must too — `x: (midClientX − r.left) − w0.x·s` — or content jumps by the header height on the first pinch move.
- **Pinch cancels an in-progress marquee** (review finding 7 — a second finger otherwise stomps the marquee anchor): a tiny `cancel()` on the marquee hook; pinch then works in select-mode too rather than being ignored.
- Add `onPointerCancel` on the board (currently missing) so an interrupted gesture can't strand state — it must also reset `isPanning` (the grabbing cursor) and the marquee (review finding 6); pinch-start clears `isPanning` as well.

### 2. Open readable on a phone
- On mount: small screen — `matchMedia("(max-width: 640px)")`, the *same inclusive* query as the CSS breakpoint (review finding 10) → **center on the highest-`z` card at 100%** (highest z = most recently brought to front — "where you last were"); otherwise `fitView` as today. **⊹ fit remains one tap away** for the overview.
- **z ties (review finding 8):** cards placed from the inbox all get z = 0, so a board filled that way is all-tied — ties resolve to the *last in load order*, a documented arbitrary-but-stable pick (widening the card model with arrival times isn't worth it for v1).
- Implemented as a small `centerOn(card, scale)` in `use-camera.ts` beside `fitView`.

### Known limits (deliberate, documented)
- **Pinch needs both fingers on empty board space.** A finger on a card is captured by the card (react-rnd drag). Fixing that means intercepting card gestures — out of scope; empty space is nearly always reachable.
- **No double-tap-to-zoom:** double-tap already means *create a note* (shipped behavior) — not overloading it.
- If the **Daylight** reports a width under 640px and trips the zoomed-in open, we tune the threshold on the owner's word.
- Handle/hit sizes are world-px (inside the canvas transform) — at the phone's 100% open they read true; zoomed out they shrink (the double-tap radius already compensates via `28 / cam.scale`).

## Verify
`tsc` + lint + build green; the pinch math is the wheel math (same anchor derivation) — reviewed on paper; real-gesture feel is the **owner's phone test** (pinch, two-finger pan, then one-finger pan, double-tap create still works, ⊹ fit).
