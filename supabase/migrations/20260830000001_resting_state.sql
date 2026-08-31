-- Resting-state single source of truth (Stage 1 — prove-identical refactor).
-- A generated `state` column (live/archived/trashed) on bit + board replaces the
-- ~20 copy-pasted `deleted_at is null` world filters with one gate, and adds
-- `archived_at` for the archive feature (Stage 2). With no archived rows,
-- state='live' ≡ deleted_at is null EXACTLY, so every world surface is unchanged.
-- Plan + proof: resting-state-architecture-plan.md.

-- ---- columns (archived_at first, then the generated state that reads it) ----
alter table bit   add column archived_at timestamptz;
alter table board add column archived_at timestamptz;

alter table bit add column state text generated always as (
  case when deleted_at  is not null then 'trashed'
       when archived_at is not null then 'archived'
       else 'live' end
) stored;
alter table board add column state text generated always as (
  case when deleted_at  is not null then 'trashed'
       when archived_at is not null then 'archived'
       else 'live' end
) stored;

-- ---- the ledger's live floor, now via state ----
drop index bit_ledger;
create index bit_ledger on bit (created_at desc) where state = 'live';

-- ================================================================
-- World views: `deleted_at is null` -> `state = 'live'` (drop+recreate,
-- verbatim otherwise; each keeps security_invoker). trash_listing, bit_travel,
-- tag_counts, subtype_word_counts are NOT world views and are left untouched.
-- ================================================================

drop view the_ledger;
create view the_ledger with (security_invoker = true) as
  select b.*,
         s.name as source_name,
         s.url  as source_url
  from bit b
  left join source s on s.id = b.source_id
  where b.state = 'live'
  order by b.created_at desc;

drop view the_inbox;
create view the_inbox with (security_invoker = true) as
  select b.*
  from bit b
  where b.state = 'live'
    and not exists (
      select 1
      from placement p
      join board bo on bo.id = p.board_id
      where p.target_bit_id = b.id
        and p.left_at is null
        and bo.state = 'live'
    )
  order by b.created_at desc;

drop view board_cards;
create view board_cards with (security_invoker = true) as
  select p.id as placement_id,
         p.board_id,
         case when p.target_bit_id is not null then 'bit' else 'board' end as thing,
         p.target_bit_id,
         p.target_board_id,
         p.x, p.y, p.width, p.height, p.z,
         p.display_size,
         p.arrived_at,
         coalesce(b.face, tb.title) as label,
         b.type,
         b.subtype_word_id,
         b.body, b.strokes, b.url,
         b.storage_path, b.thumb_path,
         b.visibility as target_visibility,
         b.source_id,
         s.name as source_name,
         s.url  as source_url
  from placement p
  left join bit b      on b.id  = p.target_bit_id
  left join board tb   on tb.id = p.target_board_id
  left join source s   on s.id  = b.source_id
  where p.left_at is null
    and (b.id  is null or b.state  = 'live')
    and (tb.id is null or tb.state = 'live');

drop view home;
create view home with (security_invoker = true) as
  select b.*,
         greatest(b.updated_at, coalesce(max(p.updated_at), b.updated_at)) as touched_at
  from board b
  left join placement p on p.board_id = b.id
  where b.state = 'live'
  group by b.id
  order by touched_at desc;

drop view the_pull;
create view the_pull with (security_invoker = true) as
  select ta.tag_id,
         'bit'::text     as thing,
         b.id            as thing_id,
         b.face          as label,
         b.type          as type,
         b.created_at    as born_at,
         ta.created_at   as applied_at
  from tag_application ta
  join bit b on b.id = ta.target_bit_id
  where b.state = 'live'
  union all
  select ta.tag_id,
         'board'::text,
         bo.id,
         bo.title,
         null,
         bo.created_at,
         ta.created_at
  from tag_application ta
  join board bo on bo.id = ta.target_board_id
  where bo.state = 'live';

drop view board_connectors;
create view board_connectors with (security_invoker = true) as
  select c.*
  from connector c
  join placement pf on pf.id = c.from_placement_id
  join placement pt on pt.id = c.to_placement_id
  left join bit bf    on bf.id  = pf.target_bit_id
  left join board bbf on bbf.id = pf.target_board_id
  left join bit bt    on bt.id  = pt.target_bit_id
  left join board bbt on bbt.id = pt.target_board_id
  where (bf.id  is null or bf.state  = 'live')
    and (bbf.id is null or bbf.state = 'live')
    and (bt.id  is null or bt.state  = 'live')
    and (bbt.id is null or bbt.state = 'live');

-- ================================================================
-- Guest door: the 3 publicness helpers + the 2 policies that read deleted_at.
-- (placement_guest_read only calls the helpers + checks left_at — inherits.)
-- ================================================================

create or replace function public.is_public_board(b_id uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from board where id = b_id and visibility = 'public' and state = 'live'
  )
$$;

create or replace function public.is_public_bit(x_id uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from bit where id = x_id and visibility = 'public' and state = 'live'
  )
$$;

create or replace function public.bit_on_public_board(x_id uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from placement p join board b on b.id = p.board_id
    where p.target_bit_id = x_id and p.left_at is null
      and b.visibility = 'public' and b.state = 'live'
  )
$$;

drop policy board_guest_read on board;
create policy board_guest_read on board for select to anon using (
  visibility = 'public' and state = 'live'
);

drop policy bit_guest_read on bit;
create policy bit_guest_read on bit for select to anon using (
  visibility = 'public' and state = 'live' and public.bit_on_public_board(id)
);
