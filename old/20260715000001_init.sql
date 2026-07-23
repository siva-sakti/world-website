-- 0001 init — core schema for the board/bits knowledge tool.
-- See SPEC.md §2 (data model), §3 (security). Never edit this file after it is applied;
-- new change = new migration file (SPEC I/O6).

-- ─── enums ────────────────────────────────────────────────────────────────
create type visibility as enum ('private', 'shared', 'public');
create type bit_type   as enum ('text', 'image', 'doodle', 'audio', 'link', 'pdf');
create type bit_kind   as enum ('learned', 'noticed', 'wondered', 'theorized');

-- ─── updated_at trigger (SPEC §2.3: dates are auto, never set by app code) ──
create or replace function set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- ─── boards ─────────────────────────────────────────────────────────────
create table boards (
  id         uuid primary key default gen_random_uuid(),
  title      text,
  visibility visibility  not null default 'private',
  is_home    boolean     not null default false,
  width      int         not null default 1200,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create trigger boards_updated_at before update on boards
  for each row execute function set_updated_at();
-- at most one home board
create unique index one_home_board on boards (is_home) where is_home;

-- ─── bits (the atomic content unit) ───────────────────────────────────────
create table bits (
  id           uuid primary key default gen_random_uuid(),
  type         bit_type    not null,
  text         text        not null default '',  -- body for text bits; caption otherwise
  storage_path text,                              -- object key (NOT a signed url); see SPEC §9
  thumb_path   text,
  link_url     text,
  image_w      int,
  image_h      int,
  file_name    text,
  mime         text,
  byte_size    bigint,
  kind         bit_kind,                        -- optional, set while tending (D-024)
  visibility   visibility  not null default 'private',
  deleted_at   timestamptz,                     -- soft-delete: non-null = in trash (D-021)
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now(),
  -- strip HTML tags so Tiptap markup never pollutes search
  search_tsv   tsvector generated always as
    (to_tsvector('english', regexp_replace(coalesce(text, ''), '<[^>]*>', ' ', 'g'))) stored
);
create trigger bits_updated_at before update on bits
  for each row execute function set_updated_at();
create index bits_created_at_idx on bits (created_at desc);
create index bits_search_idx     on bits using gin (search_tsv);

-- ─── placements (a bit on a board; a bit may have many, or none) ──────────
-- Position is OPTIONAL (D-019): x/y null = collection mode (grouped, unplaced);
-- x/y set = canvas mode (spatially arranged). w/h/z apply once placed.
create table placements (
  id         uuid primary key default gen_random_uuid(),
  board_id  uuid not null references boards(id) on delete cascade,
  bit_id     uuid not null references bits(id)     on delete cascade,
  x          int,
  y          int,
  w          int  not null default 300,
  h          int  not null default 200,
  z          int  not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check ((x is null) = (y is null))              -- placed means both coordinates
);
create trigger placements_updated_at before update on placements
  for each row execute function set_updated_at();
create index placements_board_idx on placements (board_id);
create index placements_bit_idx    on placements (bit_id);

-- ─── tags (flat; tapped from existing list, never typed) ───────────────────
create table tags (
  id         uuid primary key default gen_random_uuid(),
  name       text not null unique,
  created_at timestamptz not null default now()
);

create table bit_tags (
  bit_id uuid not null references bits(id) on delete cascade,
  tag_id uuid not null references tags(id) on delete cascade,
  primary key (bit_id, tag_id)
);
create index bit_tags_tag_idx on bit_tags (tag_id);

create table board_tags (
  board_id uuid not null references boards(id) on delete cascade,
  tag_id    uuid not null references tags(id)     on delete cascade,
  primary key (board_id, tag_id)
);
create index board_tags_tag_idx on board_tags (tag_id);

-- ─── links (bit → bit; board links come later) ───────────────────────────
create table links (
  id          uuid primary key default gen_random_uuid(),
  from_bit_id uuid not null references bits(id) on delete cascade,
  to_bit_id   uuid not null references bits(id) on delete cascade,
  created_at  timestamptz not null default now(),
  unique (from_bit_id, to_bit_id),
  check (from_bit_id <> to_bit_id)
);
create index links_to_idx on links (to_bit_id);

-- ─── RLS (SPEC §3: the security boundary) ─────────────────────────────────
-- v1: owner (authenticated) can do everything; anon is default-denied because
-- everything is private. The anon read-public policies arrive with the
-- privacy-tiers phase (SPEC §12 step 7), in their own migration.
alter table boards    enable row level security;
alter table bits        enable row level security;
alter table placements  enable row level security;
alter table tags        enable row level security;
alter table bit_tags    enable row level security;
alter table board_tags enable row level security;
alter table links       enable row level security;

create policy owner_all on boards    for all to authenticated using (true) with check (true);
create policy owner_all on bits        for all to authenticated using (true) with check (true);
create policy owner_all on placements  for all to authenticated using (true) with check (true);
create policy owner_all on tags        for all to authenticated using (true) with check (true);
create policy owner_all on bit_tags    for all to authenticated using (true) with check (true);
create policy owner_all on board_tags for all to authenticated using (true) with check (true);
create policy owner_all on links       for all to authenticated using (true) with check (true);
