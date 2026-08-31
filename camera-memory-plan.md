# Camera memory (Batch 1) — plan

**Status:** ✅ BUILT + owner-verified (remembering · restore-on-open · fit snap-back). Also fixed a
pre-existing bug found in testing: `fitView` cropped auto-grown text cards because it used their
stale stored height — it now measures the real rendered box via `data-pid` (the findClearSpot
measure). Local + uncommitted; not pushed/deployed. Part of the placement/camera work (Batch 1 of 2;
Batch 2 = "send to board").
**Lane:** code (this window). No database, no migration, no RLS — pure client-side, per-device.

---

## Part 1 — Conceptual (the what & why)

### The problem
A board resets to "fit everything" every time you open it. If you were working in one
corner, you lose your place and have to pan/zoom back. On a spatial tool, that breaks the
sense that a board is a *place* you return to.

### The feature
1. **Each board remembers where you were looking** — restored when you reopen it.
2. **The fit button gains a snap-back** — press it to see everything, press it again to
   return to where you were.

### The settled model (decisions, with the reasoning)
- **Per-device, not synced.** Stored on the device (browser), not on a server. This matches
  how Miro/Figma behave, and it's *correct*: a view is screen-specific — the zoom that fits a
  laptop is wrong on a phone, so syncing the raw view across devices would feel broken.
  (Cross-device would need accounts AND re-fitting per screen — a future call, see below.)
- **Remember *what you were looking at*, not raw pixels.** Store the **world-point at the
  centre of your view + the zoom** (an "anchor"), not the raw camera x/y. On reopen, re-centre
  on that point. This survives a window resize or a phone rotation gracefully (raw pixels would
  leave you off-centre), and it's the natural foundation if we ever add cross-device.
- **Only remembers once you've deliberately moved.** Open-and-leave keeps using the smart
  "fit everything" (which adapts as your cards change). The moment you pan or zoom on purpose,
  *that* becomes the remembered view.
- **Restore on open; fit-all only when there's nothing saved** (first-ever visit of a board,
  or storage cleared). So existing boards show fit-all once, then start remembering — no
  backfill needed.
- **Fit snap-back is session-only.** It lives in memory (not saved to disk), so a refresh
  resets it — after a refresh you'd tap fit once more to re-enable it. (The remembered *view*,
  by contrast, is saved to disk and survives refreshes/restarts.)
- **Never breaks.** Private browsing / storage blocked / corrupt-or-old saved data → silently
  falls back to fit-all.

### How it should feel
- Open a board you've arranged → you land where you left off, at your zoom.
- Pan/zoom around → it quietly remembers (a beat after you stop).
- Lost? Tap **fit** → see everything. Tap **fit again** → snap back to where you were.
- Refresh the page → your remembered view is still there. New device or browser → its own
  memory (starts fresh, which is right — the view is screen-specific).

### Edge cases (all handled)
- **First open of any board** (nothing saved) → fit-all, then it starts remembering. Expected.
- **Saved a view, then a card moved/was deleted** → you may reopen looking slightly off; fit
  is the one-tap rescue.
- **Window resized / phone rotated between save and restore** → the anchor re-centres correctly
  (the whole reason we store a world-point, not raw pixels).
- **Private/incognito, storage disabled, corrupt/old data** → falls back to fit-all, no error.
- **Phone vs laptop / Chrome vs Safari** → separate memory each (per-device by design).

### Future note (parked, not now)
Cross-device view memory would require accounts AND storing the *anchor* (what you were
looking at) rather than raw camera, then re-fitting per screen. The anchor storage we're
building now is deliberately the right foundation for that if we ever choose to add it.
Do not build cross-device sync now.

---

## Part 2 — Technical notes (for the codebase)

### The current camera (what we're extending)
- `src/app/board/[id]/use-camera.ts` owns `cam = {x, y, scale}` (React state + `camRef` for
  imperative reads). `MIN_ZOOM 0.2`, `MAX_ZOOM 3`.
- World↔screen: cards store world coords/sizes (`x,y,w,h`); the world `<div>` is
  `translate(cam.x, cam.y) scale(cam.scale)`. `screenToWorld(cx,cy) = ((cx-rect.left-cam.x)/scale, …)`.
- `fitView(cards)`: frames all cards to the current viewport, scale clamped `[0.2, 1]`.
- `centerOn(card, scale)`: puts one card's centre at the viewport centre at a given zoom.
- **Open effect** in `board-surface.tsx` (~L96–108): `matchMedia("(max-width: 640px)")` →
  phone `centerOn(last-fronted card, 1)`, else desktop `fitView(all cards)`. No cards → origin.
- Camera is **not persisted today** — resets on mount. That's the whole gap.

### Anchor ↔ camera math (the core)
Let `r = board rect`. The viewport-centre world-point:
- **camera → anchor:** `cx = (r.width/2  - cam.x) / cam.scale`, `cy = (r.height/2 - cam.y) / cam.scale`, `scale = cam.scale`.
- **anchor → camera:** `scale = clamp(anchor.scale, 0.2, 3)`, `x = r.width/2  - anchor.cx*scale`, `y = r.height/2 - anchor.cy*scale`.
(Anchor→camera is exactly `centerOn`'s math applied to a world-point instead of a card.)

### Storage
- New tiny module `src/app/board/[id]/camera-storage.ts` (keeps `use-camera.ts` under the
  ~150-line ceiling and makes the logic unit-testable without the DOM):
  - `loadAnchor(boardId): Anchor | null` — `localStorage.getItem`, `JSON.parse`, validate
    (`cx,cy,scale` all finite; clamp `scale`), else `null`. **Whole body in try/catch**
    (private mode throws on access).
  - `saveAnchor(boardId, anchor)` — `JSON.stringify` + `setItem`, in try/catch (quota/blocked).
  - Pure helpers `cameraToAnchor(cam, rect)` / `anchorToCamera(anchor, rect)` for the math above.
  - `type Anchor = { cx: number; cy: number; scale: number }`.
- **Key:** `` `board-camera:v1:${boardId}` `` — the `v1` guards against misreading a future
  format change.

### Save trigger (only user-initiated, debounced)
- `useCamera(boardRef, boardId)` gains persistence.
- A debounced saver: `scheduleSave()` sets a ~400ms timer (held in a ref, cleared on each new
  change); on fire, `saveAnchor(boardId, cameraToAnchor(camRef.current, rect))`.
- Call `scheduleSave()` **only from user gestures**: the wheel handler + `pinchMove` (inside
  `use-camera.ts`), and the empty-space **pan** handler (in `board-surface.tsx`) — so expose
  `scheduleSave` from the hook for the pan handler to call.
- **Do NOT** call it from `fitView` / `centerOn` / the restore path — programmatic moves must
  not overwrite the smart default until the user deliberately moves. (This is the "only
  remembers once you've moved" decision.)
- **Flush on unmount / board close** so a quick navigate-away still captures the last view
  (clear the timer and save immediately if one is pending).

### Restore on open
- Add `restoreView(): boolean` to `useCamera`: `const a = loadAnchor(boardId); if (!a) return false;
  setCam(anchorToCamera(a, rect)); return true;`.
- In `board-surface.tsx` open effect: **try `restoreView()` first**; only if it returns `false`
  fall back to the existing phone `centerOn` / desktop `fitView` branch. (First visit + no-data
  keep today's smart behaviour untouched.)

### Fit button snap-back (session-only, in-memory)
- In `useCamera`: `preFitAnchor` ref + `justFitted` ref (both in-memory; reset on remount).
- New `fitOrToggleBack(cards)`:
  - if `justFitted` and `preFitAnchor` set → `setCam(anchorToCamera(preFitAnchor, rect))`,
    `justFitted = false` (snap back).
  - else → `preFitAnchor = cameraToAnchor(camRef.current, rect)`, `fitView(cards)`,
    `justFitted = true`.
- **Any user gesture** (wheel / pinchMove / pan) sets `justFitted = false`, so the next fit
  press is a fresh fit, not a snap-back.
- Wire the toolbar's fit button to `fitOrToggleBack` instead of `fitView`.
- `board-toolbar.tsx` fit button `title`: add "— press again to go back".

### Files touched
- `use-camera.ts` — persistence wiring, `scheduleSave`, `restoreView`, `fitOrToggleBack`,
  `justFitted`/`preFitAnchor`, gesture hooks clear `justFitted` + schedule save. Takes `boardId`.
- `camera-storage.ts` — **new**: load/save/validate + anchor↔camera pure helpers.
- `board-surface.tsx` — pass `boardId` to `useCamera`; open effect tries `restoreView()` first;
  pan handler calls `scheduleSave()`; fit button → `fitOrToggleBack`; flush-save on unmount.
- `board-toolbar.tsx` — fit button tooltip only.

### Model-safety gates
**N/A — this touches no stored data.** The camera lives in the browser's localStorage, not the
database: no schema, no constraint, no RLS, no migration, no invariant on the data model. (Gates
are for DB-touching features; confirmed this isn't one.)

### Verification
- **Unit test** `camera-storage.ts` (pure, no DOM): `cameraToAnchor`↔`anchorToCamera` round-trip
  at a few zooms/rects; `loadAnchor` rejects corrupt JSON, non-finite values, out-of-range scale
  (clamps); `saveAnchor`/`loadAnchor` round-trip through a localStorage stub.
- `npx tsc --noEmit` + `pnpm build` green.
- **Owner live feel-test** (I can't see the screen): pan/zoom → refresh → restored; fit →
  fit-again → snaps back; refresh after fit → snap-back reset (expected); brand-new board's
  first open → fit-all; a board never touched → still fit-all each open.

### Build order (small pieces)
1. `camera-storage.ts` + its unit test (prove the math + validation first).
2. Persistence in `use-camera.ts` (save on gesture, `restoreView`), wire `board-surface` open
   effect + pan save + unmount flush. Owner feel-tests remembering.
3. `fitOrToggleBack` + tooltip. Owner feel-tests snap-back.
