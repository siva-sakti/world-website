-- ============================================================================
-- STAGE ①a — THE ADD-ONLY MIGRATION (the composition split, first half).
-- Derived from verification/composition-schema-draft.sql (proven: 15/15 + 8/8)
-- per composition-enactment-procedure.md. ADD ONLY:
--   creates composition · composition_file · reference2 (the interim tie name;
--   renamed to `reference` at ①b) · third target slots · board.hide_compositions
--   · view rebuilds (additive) · composition_travel.
-- NOTHING is deleted or dropped: bit.kind stays · the old reference table stays
-- (gather keeps working) · no rows are touched. The live app runs unmodified.
-- ⚠ PRECONDITIONS: …005 and …006 applied first (this file's board_cards rebuild
--   assumes display_size is already gone).
-- ⚠ THE ①a COMMIT MANIFEST — this file moves into supabase/migrations/ together
--   with, and ONLY with (antagonist Q4):
--   1. THE REGEX FIX FIRST, test-first (antagonist finding 1 — the digit-blind
--      guard): exported-tables.test.mjs's two scans use [a-z_]+ and cannot SEE
--      "reference2"; widen both to [a-z0-9_]+ and watch the missing-table
--      assertion fail before…
--   2. EXPORTED_TABLES += composition, composition_file, **reference2** — and
--      the second hard-coded list at scripts/test-port.mjs:208 (F9). At ①b the
--      rename swaps reference2→reference in BOTH lists in that same change.
--   3. mergeSources' reference2 repoint (S4) — harmless early (table empty
--      until stage ③), disastrous late.
--   4. Nothing else: the composition TS types ride with ②a (no dead code).
-- DISCLOSURES (antagonist F6c/d + Q6): board_cards.target_visibility changes
--   meaning for board-target rows (was NULL, now tb.visibility — no runtime
--   consumer today, types.ts only) · this file ships RLS but NO GRANTS —
--   Supabase default privileges cover new tables (the opening precedent:
--   apply-opening-to-cloud.sql shipped none and works); the rehearsal grants
--   out-of-band only because throwaway PG17 lacks Supabase's defaults ·
--   composition_travel ships consumer-less until the travel UI — deliberate.
-- All-or-nothing: one transaction (F6); a mid-run failure leaves NOTHING.
-- ============================================================================
begin;

-- ---- the body-text extractor (S2; proven format-sql-evidence E2–E5) --------
-- Text nodes + the attrs that carry visible words (bitRef.label — the ONE
-- entry today; every future attr-carrying node joins this list or its words
-- silently leave search — the recorded JSON cost, S2). left() guards the
-- tsvector ceiling (E4: real at ~1MB distinct-lexeme text).
create function composition_body_text(d jsonb) returns text
language sql immutable as $$
  select left(coalesce(string_agg(v.t, ' '), ''), 500000)
  from (
    select jsonb_path_query(d, 'strict $.**.text')  #>> '{}' as t
    union all
    select jsonb_path_query(d, 'strict $.**.label') #>> '{}' as t
  ) v where v.t is not null
$$;

-- ---- the composition (S1: own table, peer of board — §21.1, K8) ------------
create table composition (
  id          uuid primary key default gen_random_uuid(),
  owner_id    uuid not null default auth.uid(),           -- per-row ownership (D-107 pattern)
  title       text,                                        -- nullable; minted at exit is APP (§7)
  subtitle    text,                                        -- §6b (owner 2026-09-03; the §27 catch)
  body        jsonb not null,                              -- the writing — the lexicon's word (rule 7; Gate B F5). S2: JSON; born-on-first-content = app (§4.1.3)
  word_target int,                                         -- job facts §8 — all optional
  due_on      date,                                        -- a calendar date, not a moment — `_at` stays timestamptz-only (Gate B F6)
  for_whom    text,
  group_id    uuid references shelf_group(id) on delete set null,  -- one folder (§12.3; set-null strands nothing)
  pinned_at   timestamptz,                                 -- star (§12.4)
  visibility  text not null default 'private',             -- BORN PRIVATE (§12.2b.2; model deferred, J6)
  deleted_at  timestamptz,                                 -- trash = freeze (§11.3)
  archived_at timestamptz,                                 -- read-only rest (§11.2)
  locked_at   timestamptz,                                 -- the read-lock, REMEMBERED per piece (§31.3, owner-ruled 2026-09-03); null = writable; house stamp style
  created_at  timestamptz not null default now(),          -- client-suppliable (I-D4)
  updated_at  timestamptz not null default now(),
  state text generated always as (                         -- the resting pattern (D-127; I-T4)
    case when deleted_at  is not null then 'trashed'
         when archived_at is not null then 'archived'
         else 'live' end) stored,
  search_tsv tsvector generated always as (               -- the index MOVES WITH it (§12.1.5, J2; E3 proven)
    to_tsvector('english',
      coalesce(title,'') || ' ' || coalesce(subtitle,'') || ' ' ||   -- subtitle indexed per D-088 (index ALL words; titling never hides)
      composition_body_text(body))) stored,
  constraint composition_visibility_allowed check (visibility in ('public','private')),
  constraint composition_archived_not_alive check (archived_at is null or pinned_at is null),      -- house 20260902000002
  constraint composition_trashed_archived_exclusive check (deleted_at is null or archived_at is null) -- house 20260903000003
  -- NO source_id (§3.4b, owner-ruled) · NO lock column (Q3: §20.3 ⚪, add-later free)
  -- NO kind/form column: fixed-kind (I-K1 / D-121 / register B4 / §3.4) is STRUCTURAL here — a separate table cannot convert
);
create index composition_owner  on composition (owner_id);
create index composition_group  on composition (group_id);
create index composition_list   on composition (created_at desc) where state = 'live';
create index composition_search on composition using gin (search_tsv);
alter table composition enable row level security;
create policy composition_owner_all on composition
  for all to authenticated using (auth.uid() = owner_id) with check (auth.uid() = owner_id);
-- FUTURE guest SELECT (privacy session; the AND law, mirrors bit_guest_read):
--   visibility='public' and state='live' and placed-live-on-a-public-live-board
create trigger composition_updated_at before update on composition
  for each row execute function set_updated_at();

-- ---- composition-owned files (S3: the registry; §24.3) ---------------------
create table composition_file (
  id             uuid primary key default gen_random_uuid(),
  owner_id       uuid not null default auth.uid(),
  composition_id uuid not null references composition(id) on delete cascade,
      -- destroy → rows go; the storage DELETE of listed paths is the app's
      -- sweep step (§27.1.3: trash keeps files, destroy deletes them)
  storage_path   text not null,
  thumb_path     text,
  created_at     timestamptz not null default now(),
  constraint composition_file_once unique (composition_id, storage_path)
      -- rows are ADDED on save; removed ONLY by the deferred orphan sweep (row +
      -- bytes together) or the destroy cascade + app sweep — NEVER eagerly on
      -- save (§24.3: undo must restore; Gate B F4). 1:1 ownership — a block
      -- copied to another composition COPIES the file (I-G6's file law, S3)
);
create index composition_file_owner on composition_file (owner_id);
create index composition_file_comp  on composition_file (composition_id);
alter table composition_file enable row level security;
create policy composition_file_owner_all on composition_file
  for all to authenticated using (auth.uid() = owner_id) with check (auth.uid() = owner_id);

-- ---- the tie, end-state (S4; replaces today's reference shape at Part IV) --
-- ⭐ from = composition ONLY: flatness (§3.4) becomes PHYSICS — I-Ref3
-- upgraded from app-guard to FK. A bit structurally cannot gather.
create table reference2 (   -- ⚠ draft name; enactment renames/rebuilds today's `reference` (S4)
  id                  uuid primary key default gen_random_uuid(),
  owner_id            uuid not null default auth.uid(),
  from_composition_id uuid not null references composition(id) on delete cascade,
  to_bit_id           uuid references bit(id)         on delete cascade,
  to_board_id         uuid references board(id)       on delete cascade,
      -- ✅ GATE RESOLVED (owner, 2026-09-03): "compositions can reference
      -- boards" — as a DOORWAY only (§3.4 amended; register C2/F3 superseded).
      -- Ships ungated.
  to_composition_id   uuid references composition(id) on delete cascade,
  to_source_id        uuid references source(id)      on delete cascade,
      -- cascade = the degrade rule (§9.8/§11.4: row gone, chip → plain text).
      -- ⚠ mergeSources MUST repoint to_source_id before deleting the absorbed
      -- source (S4; sources.ts:220 today would silently eat the tie).
  created_at          timestamptz not null default now(),
      -- no updated_at: a tie is born or gone, never edited (I-Ref series)
  constraint reference2_exactly_one_target
    check (num_nonnulls(to_bit_id, to_board_id, to_composition_id, to_source_id) = 1),
  constraint reference2_not_self
    check (to_composition_id is distinct from from_composition_id)  -- §9.2.4
);
-- one tie per ordered pair, per target kind (I-Ref2). Precedent: init's
-- tag_application_*_once / placement_*_once partial uniques (NOT opening's —
-- its uniques are plain constraints for upsert inference; Gate B F8). These
-- indexes back plain reads, never PostgREST on_conflict — the reconciler
-- SELECTs then inserts/deletes (references.ts), so partial is safe HERE.
create unique index reference2_bit_once  on reference2 (from_composition_id, to_bit_id)         where to_bit_id is not null;
create unique index reference2_board_once on reference2 (from_composition_id, to_board_id)       where to_board_id is not null;
create unique index reference2_comp_once on reference2 (from_composition_id, to_composition_id) where to_composition_id is not null;
create unique index reference2_src_once  on reference2 (from_composition_id, to_source_id)      where to_source_id is not null;
create index reference2_owner    on reference2 (owner_id);
create index reference2_to_bit   on reference2 (to_bit_id);        -- "pulled into" reads (§12.1b)
create index reference2_to_comp  on reference2 (to_composition_id);
create index reference2_to_board on reference2 (to_board_id);
create index reference2_to_src   on reference2 (to_source_id);
alter table reference2 enable row level security;
create policy reference2_owner_all on reference2
  for all to authenticated using (auth.uid() = owner_id) with check (auth.uid() = owner_id);

-- ---- pointer tables grow the third slot (S5; §21.3 — the house pattern) ----
alter table tag_application add column target_composition_id uuid references composition(id) on delete cascade;
alter table tag_application drop constraint tag_application_exactly_one_target;
alter table tag_application add  constraint tag_application_exactly_one_target
  check (num_nonnulls(target_bit_id, target_board_id, target_composition_id) = 1);
create unique index tag_application_comp_once
  on tag_application (tag_id, target_composition_id) where target_composition_id is not null;   -- I-R7
create index tag_application_comp on tag_application (target_composition_id);

alter table placement add column target_composition_id uuid references composition(id) on delete cascade;
alter table placement drop constraint placement_exactly_one_target;
alter table placement add  constraint placement_exactly_one_target
  check (num_nonnulls(target_bit_id, target_board_id, target_composition_id) = 1);
create unique index placement_comp_once
  on placement (board_id, target_composition_id) where target_composition_id is not null;        -- I-L1
create index placement_target_comp on placement (target_composition_id);

alter table opening add column composition_id uuid references composition(id) on delete cascade;
alter table opening drop constraint opening_exactly_one_target;
alter table opening add  constraint opening_exactly_one_target
  check (num_nonnulls(board_id, bit_id, composition_id) = 1);
alter table opening add constraint opening_one_per_comp unique (owner_id, composition_id);
    -- PLAIN constraint, NOT a partial index — Gate B F1: opening.sql:22-27 documents
    -- that PostgREST's on_conflict cannot infer a partial index (42P10 forever);
    -- NULLS DISTINCT lets the other kinds' rows coexist, per the same header.
create index opening_comp on opening (composition_id);

-- ---- the board remembers its hide-compositions toggle (S8; §10.3.4 ruled) --
alter table board add column hide_compositions boolean not null default false;

-- ---- surfaces (S5) ---------------------------------------------------------
create or replace view board_cards with (security_invoker = true) as
  select p.id as placement_id, p.board_id,
         case when p.target_bit_id is not null then 'bit'
              when p.target_board_id is not null then 'board'
              else 'composition' end as thing,
         p.target_bit_id, p.target_board_id,
         p.x, p.y, p.width, p.height, p.z, p.arrived_at,
         -- (display_size dropped 20260903000006 — the draft tracks the directory at run time, Gate-A F6)
         coalesce(b.face, tb.title, c.title) as label,
         b.type, b.subtype_word_id, b.body, b.strokes, b.url,
         b.storage_path, b.thumb_path,
         coalesce(b.visibility, tb.visibility, c.visibility) as target_visibility,   -- every leg exposes its target's visibility (I-P2: bit-privacy always wins per target; Gate B F7)
         b.source_id, s.name as source_name, s.url as source_url,
         p.locked_at, p.angle,
         p.target_composition_id,
         c.subtitle as comp_subtitle,
         left(composition_body_text(c.body), 280) as comp_preview   -- §10.1.2: title+subtitle, opening lines standing in
  from placement p
  left join bit b         on b.id  = p.target_bit_id
  left join board tb      on tb.id = p.target_board_id
  left join composition c on c.id  = p.target_composition_id
  left join source s      on s.id  = b.source_id
  where p.left_at is null
    and (b.id  is null or b.state  = 'live')
    and (tb.id is null or tb.state = 'live')
    and (c.id  is null or c.state  = 'live');    -- trashed card VANISHES, returns on restore (§11.3)

create or replace view the_pull with (security_invoker = true) as
  select ta.tag_id, 'bit'::text as thing, b.id as thing_id, b.face as label,
         b.type as type, b.created_at as born_at, ta.created_at as applied_at
  from tag_application ta join bit b on b.id = ta.target_bit_id where b.state = 'live'
  union all
  select ta.tag_id, 'board', bo.id, bo.title, null, bo.created_at, ta.created_at
  from tag_application ta join board bo on bo.id = ta.target_board_id where bo.state = 'live'
  union all
  select ta.tag_id, 'composition', c.id, c.title, null, c.created_at, ta.created_at
  from tag_application ta join composition c on c.id = ta.target_composition_id where c.state = 'live';

create or replace view trash_listing with (security_invoker = true) as
  select 'bit'::text as thing, id as thing_id, face as label, deleted_at
  from bit where deleted_at is not null
  union all
  select 'board', id, title, deleted_at from board where deleted_at is not null
  union all
  select 'composition', id, title, deleted_at from composition where deleted_at is not null
  order by deleted_at desc;

create or replace view archive_listing with (security_invoker = true) as
  select 'bit'::text as thing, id as thing_id, face as label, archived_at
  from bit where state = 'archived'
  union all
  select 'board', id, title, archived_at from board where state = 'archived'
  union all
  select 'composition', id, title, archived_at from composition where state = 'archived'
  order by archived_at desc;

create view composition_travel with (security_invoker = true) as
  select p.target_composition_id as composition_id, p.board_id, b.title as board_title,
         p.arrived_at, p.left_at
  from placement p join board b on b.id = p.board_id
  where p.target_composition_id is not null
  order by p.arrived_at;     -- §30b: one record, two views — bit_travel's sibling, zero new storage

-- ---- APPENDIX (commented): the hover layer, build step ⑥ (S8; §26.5) -------
-- create table composition_hover (
--   id uuid primary key default gen_random_uuid(),
--   owner_id uuid not null default auth.uid(),
--   composition_id uuid not null references composition(id) on delete cascade,
--   bit_id uuid not null references bit(id) on delete cascade,   -- bits only (owner-ruled)
--   x float8 not null, y float8 not null, w float8, h float8,
--   collapsed_at timestamptz,
--   created_at timestamptz not null default now(),
--   constraint composition_hover_once unique (composition_id, bit_id)
-- );  -- + owner RLS · trashed-pin hidden by liveness filter, restored free (§26.3)

commit;
