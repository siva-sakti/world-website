# Accounts — a bare-bones stub (PENDING, not designed)

**Status:** deliberately pending. The owner asked for this doc (2026-08-31) so the accounts line
has a home; the *thinking* happens in the product-concept workstream's **privacy/publishing
session** (docs/product-concept-queue.md ④ — the great unblocker) and the convergent-surfaces /
social thread. **Nothing here is decided or scheduled. Build nothing from this doc.**

## What "accounts" would mean here (the raw shape)
Other people signing up — which is the door to: sharing/social ("shared" visibility, B6) ·
publishing pieces · paid plans (positioning.md §8 — storage costs make the free-dump promise a
freemium promise) · multi-device identity.

## What already exists (the runway is longer than it looks)
- **Real auth already** — Supabase Auth, currently a single owner; RLS is the boundary.
- **Per-row ownership is already in the schema** (`owner_id` on every table + owner-scoped RLS,
  migration `20260728000001`) — the DB is *structurally* multi-user already; accounts is mostly a
  signup door + product decisions, not a data-model rebuild.
- **A guest door exists** (anon read of public content, `20260728000002`) — the read-only half of
  sharing is plumbed, unshipped as product.

## ⚠ THE ONE REAL BLOCKER FOUND (2026-09-02, storage-policy capture)
**Files are not owner-scoped.** Table rows are (per-row `owner_id` + RLS, `20260728000001`), but
the single storage policy — `owner_all_objects`, now captured in `20260902000003` — scopes by
BUCKET only: **every authenticated user can read, overwrite and delete every other user's files.**
Sound today (one account; `anon` has no storage policy at all, and the private bucket is
non-public), and a genuine hole the moment a second account exists. Two things follow:
- **The fix at accounts:** an owner-scoped policy, standardly by path prefix
  (`(storage.foldername(name))[1] = auth.uid()::text`).
- **The cheap-now/expensive-later part:** that implies a **path-convention change** — today's keys
  are `images|thumbs|audio|pdfs/{bitId}.ext`, and owner-scoping wants `{owner_id}/…`. Changing the
  convention is trivial while there are few files and means moving every object later. **Worth an
  owner call before the file count grows**, independent of when accounts actually ship.
- Probe: `verification/storage-boundary-check.sql` (read-only; its ST-4 is the tripwire that must
  be rewritten the day accounts land).

## The known dependencies (why this waits)
1. **The privacy/publishing ruling** (other window ④): default visibility · the publishable unit ·
   key-link vs open web · what kind of social. Accounts before this ruling would harden guesses.
2. **Pricing/storage** (positioning §8): free tier + paid plans — a business call, not a build call.
3. **Per-device vs account-synced state** — the one *technical* line already prepared: board camera
   memory is stored as an **anchor** (what you were looking at, not raw pixels — camera-memory-plan)
   precisely so it *could* sync per-account later, re-fit per screen. Same question will apply to
   layout prefs (cards/list, rail collapse). Per-device stays correct until accounts exist.

## When it re-enters
After the privacy/publishing session rules the sharing model — accounts is its implementation
door, not its own thread. Then: a real plan doc, the full loop, and this stub is superseded.
