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
