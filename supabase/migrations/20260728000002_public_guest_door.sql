-- The public (guest) door — read-only anon access to PUBLIC content (D-108).
--
-- Opens the sharing-phase door that init.sql framed as commented-out policies. A
-- logged-out visitor (anon) may SELECT — NEVER write — a note only when it is
-- public AND live AND sits (live) on a public, live board: reachability AND
-- visibility, never an OR (I-P5). Merely-public-but-unplaced never shows — no
-- public feed (I-P4). A private card is absent by ROW-ABSENCE, so a public board
-- renders its public cards only, never a hole that leaks a private one.
--
-- Exposed to anon: board · bit · placement (the minimum to render a public board).
-- NOT exposed: reference (the private gather/twin thread), tag, tag_application,
-- source — provenance and connections stay private in v1.
--
-- Recursion-safe: a bit's public visibility depends on its placements + their
-- boards, so the guest policies need cross-table checks. Naive RLS there recurses
-- (bit→placement→bit…). These SECURITY DEFINER helpers bypass RLS for the boolean
-- publicness check only — they reveal true/false about publicness, never content.
-- Proven leak-proof on a throwaway copy: verification/run-public-door-native.sh.

-- ---- recursion-safe publicness helpers (definer: bypass RLS, return only booleans) ----
create or replace function public.is_public_board(b_id uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from board where id = b_id and visibility = 'public' and deleted_at is null
  )
$$;

create or replace function public.is_public_bit(x_id uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from bit where id = x_id and visibility = 'public' and deleted_at is null
  )
$$;

-- a bit is publicly VISIBLE iff it is public+live AND sits (live) on a public+live board
create or replace function public.bit_on_public_board(x_id uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from placement p join board b on b.id = p.board_id
    where p.target_bit_id = x_id and p.left_at is null
      and b.visibility = 'public' and b.deleted_at is null
  )
$$;

-- ---- the guest read policies (anon, SELECT only; additive — the owner's
-- ---- `_owner_all` policies are `to authenticated` and untouched) ----
create policy board_guest_read on board for select to anon using (
  visibility = 'public' and deleted_at is null
);

create policy bit_guest_read on bit for select to anon using (
  visibility = 'public' and deleted_at is null and public.bit_on_public_board(id)
);

create policy placement_guest_read on placement for select to anon using (
  left_at is null
  and public.is_public_board(board_id)
  and (
    (target_bit_id   is not null and public.is_public_bit(target_bit_id))
    or (target_board_id is not null and public.is_public_board(target_board_id))
  )
);

-- ---- grants: anon may READ (only) these three tables; RLS above filters to public.
grant select on public.board, public.bit, public.placement to anon;
grant execute on function
  public.is_public_board(uuid),
  public.is_public_bit(uuid),
  public.bit_on_public_board(uuid) to anon;
