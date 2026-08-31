-- ============================================================================
-- ARCHIVE (N5) — a distinct RESTING state. Owner-ruled 2026-08-28.
--
-- "I'm done with this, but I'm not throwing it away." Trash was already hidden
-- and restorable, so the real question was whether putting-away deserves its own
-- state at all. The owner ruled it does: archived things leave the rooms you
-- work in, stay findable in find, and are visibly NOT deleted.
--
-- THREE STATES, and a thing is in exactly one:
--   live      · archived_at null, deleted_at null — in your rooms
--   archived  · archived_at set                   — put away, still findable
--   trashed   · deleted_at set                    — hidden everywhere, restorable
--
-- TRASH OUTRANKS ARCHIVE. A trashed thing is hidden whatever else is true, and
-- restoring it returns it to where it was — archived stays archived. You undo
-- the trashing, not the putting-away.
--
-- ARCHIVE IS NOT TRASH-LITE. Trash means "gone unless I rescue it"; archive
-- means "kept, out of the way." That is why find still reaches it: the ledger's
-- reachability floor (I-T1) covers every LIVE row, and an archived row is live.
--
-- Additive only. Boards are deliberately NOT archivable in this round — the
-- owner ruled the concept for notes; extending it is a ruling, not a migration.
-- ============================================================================

alter table bit add column archived_at timestamptz;
      -- null = not archived; the timestamp says WHEN you put it away, which is
      -- what orders the archive (most recently put away first)

alter table bit add constraint bit_archived_not_alive
  check (archived_at is null or pinned_at is null);
      -- INVARIANT: a thing cannot be both "alive right now" (starred onto the
      -- desk) and put away. They are opposite claims about the same thing.
      -- Enforced HERE rather than in app logic (the lowest-layer rule): the one
      -- write door clears the star as it archives, in a single statement, and
      -- this constraint is what makes that non-negotiable.

create index bit_archived on bit (archived_at) where archived_at is not null;
      -- the archive view reads only these rows; a partial index keeps it cheap
      -- and costs nothing on the overwhelmingly common archived_at-null path
