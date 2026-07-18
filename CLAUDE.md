# CLAUDE.md

**Operating manual + hub. Read this FIRST, every session.** It defines the working routine, where everything lives, and the norms. (This complements the owner's global `~/.claude/CLAUDE.md`.)

## When you start a session — do this, in order

1. **Read this file.**
2. **Read `ROADMAP.md`** — the canonical phase sequence + steps: **this is what to build next, in what order.** Then **`PROGRESS.md`** — the Status block (where we are *right now*), the decisions log (D-xxx), and **"Needs owner"** for anything blocked on the human.
3. **Scope the next step** by reading the relevant parts of these, in order:
   - **`draft-highlevel.md`** (The Plan) — the roadmap section + the model/constraints for this step.
   - **`SPEC.md`** — the detailed rules for the specific surface/feature (schema, RLS, behavior).
   - **`draft-map.md`** — the *status* and *open questions* for the surfaces/flows/elements this step touches.
4. **Write a specific plan for the step into `PROGRESS.md`.** If it's 3+ steps or touches any open question, **pause and confirm the plan with the owner before building.**
5. **Build** in small pieces.
6. **Verify** each piece — `pnpm build` + typecheck + run what you can. The owner tests what only their devices can (phone / offline / Shortcut / Daylight).
7. **Record** — add decisions to the log (with rationale + supersessions), flip statuses in `draft-map.md`, update "work done" and "needs owner" in `PROGRESS.md`.
8. **Sync** — if a decision changed the *model*, update The Plan and `SPEC.md` too. **Docs must never drift** — an external review already caught us on exactly that once.

## Where to find what

| Doc | Its one job |
|---|---|
| **`CLAUDE.md`** (this) | Operating manual + hub; the routine above |
| **`draft-philosophy.md`** | The *why* / the goal — check decisions serve it |
| **`draft-highlevel.md`** (The Plan) | Objective, constraints, model, roadmap, open questions |
| **`SPEC.md`** | The detailed *what* — schema, RLS, per-surface rules |
| **`draft-map.md`** | Status of every surface/flow/element + open questions |
| **`PROGRESS.md`** | Build queue · decisions log · needs-owner · work done |
| **`ROADMAP.md`** | **The canonical phase sequence** (reconciles the older build-queues; use for "what's next / big picture") |

*(Philosophy/high-level/map are still `draft-` named until we do a final rename; they are the live source of truth now.)*

## What this is (one line)

A private, single-user spatial notebook: capture the flood of what you consume and think as **fragments**, return to them, and grow them by arranging them on **boards**. Built **capture-first**. The *fragment* is the atom (it needs no board). Full why → `draft-philosophy.md`.

## Stack

Next.js (App Router, TS strict) + Supabase (Postgres/Storage/Auth) + Tailwind (layout only) + pre-approved libs: `dnd-kit`, `react-rnd`, `tiptap`, `pdf.js`, `zod`, `perfect-freehand` (pen candidate). New deps need approval. **Cloud** Supabase + Vercel for real capture (a phone can't reach localhost).

## How I work (norms)

- **Plan before code**; small, single-purpose files (~150-line ceiling). One `lib/db` module, one `lib/storage` module — never call Supabase from a component.
- **No debt**: verify before claiming; nothing half-built or hacked in; no dead code/TODOs.
- **Security is the boundary** (RLS), not the query layer. Service-role key server-only.
- **Bypass permissions is on** — act on reversible work; **never** do irreversible/owner things unsupervised (deploy, cloud accounts, publishing, destructive data ops, new deps).
- **When genuinely unsure** (esp. creative/aesthetic/naming): consult a **Fable** subagent, decide, record it, continue. Technical uncertainty → resolve by verification, not guessing.
- **Record every non-trivial decision** in `PROGRESS.md`. **Stop-and-flag** any fork you can't safely default.

## Design stance

Quiet, white, fast — make **no aesthetic decisions for the owner**, *except the browse/feed surface*, whose presentation (image-forward, density, rhythm) must be deliberately designed or "returning" fails. Considered-quiet, never careless-ugly. One typeface. Expression otherwise comes from the owner's own content and doodles.

## What not to do

- No features outside the plan/spec. No AI, analytics, collaboration, public product, or a full drawing app.
- Don't refactor what you weren't asked to. No commented-out code, no TODOs.
- Handle empty + error states everywhere. Every list can be empty; every upload can fail.

## Open naming decision

Docs use **fragment / board** (owner's words); code uses **bit / canvas**. Rename pending the owner's call — until then, `fragment == bit`, `board == canvas`.
