-- ============================================================================
-- THE SHELF (organize plan O1): groups + pins — how HOME is arranged.
-- Arrangement, not knowledge (the owner's ruling): a group is a shelf section,
-- like x/y is a card's spot on a board — never a rival to tags (meaning) or
-- hub boards (craft). Additive only; nothing existing changes shape.
--   · shelf_group — a named, owner-ordered section of the home shelf
--   · board.group_id — which section a board sits in (one group per board);
--     deleting a group strands nothing (set null → ungrouped)
--   · board.pinned_at / bit.pinned_at — pinned floats to the top of its
--     surface; null = unpinned; the timestamp orders pins (newest first)
--   · home view recreated so b.* picks up the new columns (a view's star is
--     frozen at creation)
-- ============================================================================

create table shelf_group (
  id         uuid primary key default gen_random_uuid(),
  name       text not null,
  position   int  not null,
      -- the owner's own order on the shelf (↑/↓ v1); unique-per-owner is NOT
      -- constrained (a swap passes through equal values mid-flight)
  owner_id   uuid not null default auth.uid(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint shelf_group_name_per_owner unique (owner_id, name)
      -- one section per name on one owner's shelf
);

alter table shelf_group enable row level security;
create policy shelf_group_owner_all on shelf_group
  for all to authenticated
  using (auth.uid() = owner_id) with check (auth.uid() = owner_id);
create index shelf_group_owner on shelf_group (owner_id);
create trigger shelf_group_updated_at before update on shelf_group
  for each row execute function set_updated_at();

alter table board add column group_id uuid references shelf_group(id) on delete set null;
    -- ON DELETE SET NULL: removing a section never touches the boards in it —
    -- they simply fall back to the ungrouped shelf (the same never-lose physics
    -- as un-placing)
alter table board add column pinned_at timestamptz;
alter table bit   add column pinned_at timestamptz;
create index board_group on board (group_id);

-- home: same definition as init (touched_at = the board's own clock or its
-- latest placement's), recreated so the new board columns flow through b.*.
drop view home;
create view home with (security_invoker = true) as
  select b.*,
         greatest(b.updated_at, coalesce(max(p.updated_at), b.updated_at)) as touched_at
  from board b
  left join placement p on p.board_id = b.id
  where b.deleted_at is null
  group by b.id
  order by touched_at desc;
