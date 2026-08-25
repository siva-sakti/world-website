-- ============================================================================
-- THE KIND MARKER + FOLDER STARS (V2, D-118's terminology made real):
--   · bit.kind — 'bit' (a fragment) or 'note' (a written PIECE, first-class
--     beside boards; the founding gradient raw→fragments→pieces). The DOOR
--     defines the kind (✎ write births notes); a quiet toggle on the thing's
--     page promotes/demotes — so the owner's pre-marker writings can grow up.
--   · shelf_group.pinned_at — folders can be ALIVE too (starred folders bump
--     to the front of the desk; same hand-placed mechanism as boards/bits).
-- Additive only.
-- ============================================================================
alter table bit add column kind text not null default 'bit'
  constraint bit_kind_allowed check (kind in ('bit', 'note'));
      -- DOOR: further kinds would be a ruling, not a migration convenience
create index bit_kind on bit (kind) where kind = 'note';
      -- the notes room lists notes; partial index keeps it cheap

alter table shelf_group add column pinned_at timestamptz;
      -- null = unstarred; the timestamp orders starred folders (newest first)
