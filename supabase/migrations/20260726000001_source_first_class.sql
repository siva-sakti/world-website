-- ============================================================================
-- source — first-class provenance (Source & the full bit, Stage 0 · model fix)
-- ============================================================================
-- The model correction that opens the "Source & the full bit" plan
-- (source-and-full-bit-build-plan.md §4). It does three linked things:
--   • makes SOURCE a first-class vocabulary citizen — its own table, shaped
--     exactly like subtype_word/tag (id · name · timestamps · a lower() unique
--     index · owner RLS), plus an optional url; universal on every bit via a
--     nullable bit.source_id FK (one source per bit — §2 decision 2).
--   • migrates D-100's flat source_url/source_title columns INTO source records,
--     then drops the columns (this REVERSES 20260725000001's provenance columns).
--   • RETIRES the bookmark bit type — a URL is a source, not a saved page
--     (§2 decision 1). Every bookmark bit is CONVERTED to a text bit (a rich-text
--     link) carrying a source, then 'bookmark' is removed from the type CHECK and
--     its substance branch dropped (this REVERTS 20260725000001's bookmark-preview
--     relax — moot once no bookmark rows exist).
--
-- ORDERING IS LOAD-BEARING (plan §4, review finding #2 — convert-before-tighten):
--   1 source table → 2 bit.source_id → 3 migrate D-100 fields → 4 CONVERT every
--   bookmark → 5 retire bookmark (only after ZERO bookmark rows) → 6 drop columns
--   + refresh views. Tightening the type CHECK before the last bookmark row is
--   converted would abort the whole migration.
--
-- Additive-then-destructive on init + 20260723000001 + 20260725000001 +
-- 20260725000002. Proven on a throwaway DB before it touches cloud
-- (verification/source-proofs.sql + run-source-native.sh). LOCAL PROOF ONLY.
-- ============================================================================


-- ----------------------------------------------------------------------------
-- 1. THE SOURCE TABLE — clones subtype_word (§3b/§5c vocabulary shape), owner-
--    scoped (D-094). A source = a NAME (a book, a site, an author) + an OPTIONAL
--    url (a web page has both; a book has a name, no link). Single-valued on the
--    bit, so — unlike tags — no join table (plan §3).
-- ----------------------------------------------------------------------------
create table source (
  id         uuid primary key default gen_random_uuid(),  -- referenced by id (P9)
  name       text not null,                               -- the display name; typed once, it exists (§3b)
  url        text,                                         -- optional clickable link; null for a name-only source (a book)
  created_at timestamptz not null default now(),          -- one clock (P4)
  updated_at timestamptz not null default now()           -- renames are edits (P4)
);
-- near-duplicates refused at birth, case-insensitive — the whole vocabulary
-- family's rule (§3e), applied to source (identical shape to subtype_word_ci).
create unique index source_name_ci on source (lower(name));

-- RLS — owner-scoped from birth, the D-094 clause VERBATIM
-- (20260723000001_owner_scoped_rls.sql / 20260725000002_gather_reference.sql).
-- A second identity (even a stranger who signs up) can neither read (USING) nor
-- write (WITH CHECK) a row; logged-out (auth.uid() is null) sees nothing.
alter table source enable row level security;
create policy source_owner_all on source for all to authenticated
  using (auth.uid() = '298fbf29-39c8-4738-96d0-3348f0e59fd0')
  with check (auth.uid() = '298fbf29-39c8-4738-96d0-3348f0e59fd0');

-- the ONE trigger (strategy §4.7): updated_at stamping on rename — like every
-- other editable table.
create trigger source_updated_at before update on source
  for each row execute function set_updated_at();


-- ----------------------------------------------------------------------------
-- 2. bit.source_id — clones bit.subtype_word_id EXACTLY (nullable FK, set null
--    on delete): deleting a source lets its bits survive, they just lose the
--    stamp (I-Src: one source per bit, optional, id-referenced — rename-once).
-- ----------------------------------------------------------------------------
alter table bit add column source_id uuid references source(id) on delete set null;
create index bit_source on bit (source_id);   -- grouping "everything from this source" + FK support


-- ----------------------------------------------------------------------------
-- 3. MIGRATE the D-100 provenance fields → source records.
--    NAME FALLBACK (review finding #3): source.name is NOT NULL, but a clip
--    whose title-fetch failed carries source_url and a NULL source_title — so
--    name = coalesce(source_title, source_url). One source per distinct name
--    (case-insensitive), then point each provenance-bearing bit's source_id.
--    (A whole-page bookmark leaves source_* blank — I-S3 — so it is untouched
--    here; bookmarks get their source in step 4.)
-- ----------------------------------------------------------------------------
-- 3a. one source row per distinct provenance name (case-insensitive; min() picks
--     a stable representative for the rare same-name-different-url collision).
insert into source (name, url)
select min(coalesce(source_title, source_url)) as name,
       min(source_url)                          as url
from bit
where source_url is not null or source_title is not null
group by lower(coalesce(source_title, source_url));

-- 3b. point each provenance-bearing bit at its source (matched by lower(name)).
update bit b
set source_id = s.id
from source s
where (b.source_url is not null or b.source_title is not null)
  and lower(s.name) = lower(coalesce(b.source_title, b.source_url));


-- ----------------------------------------------------------------------------
-- 4. CONVERT every bookmark bit → a note-with-source, BEFORE step 5.
--    A text bit requires body NOT NULL (review finding #1), so SYNTHESIZE a
--    body — a rich-text link — and give the bookmark a source (name = the
--    captured title, else the url; finding #3 fallback again). Null out every
--    bookmark-only column (url · captured_title · storage_path · thumb_path ·
--    media facts) so the row satisfies the 'text' substance branch AND
--    bit_media_facts_only_with_file. (In practice this is the one test
--    bookmark; it converts cleanly.)
-- ----------------------------------------------------------------------------
-- 4a. one source per distinct bookmark provenance name. on conflict do nothing:
--     a bookmark whose name already exists as a step-3 source SHARES that one
--     source (dedup by name — a source is one named thing).
insert into source (name, url)
select min(coalesce(captured_title, url)) as name,
       min(url)                            as url
from bit
where type = 'bookmark'
group by lower(coalesce(captured_title, url))
on conflict (lower(name)) do nothing;

-- 4b. convert. NOTE: the body's RHS reads b.url — in a single UPDATE every SET
--     expression sees the OLD row, so synthesizing body from url while nulling
--     url in the same statement is correct.
update bit b
set body           = '<p><a href="' || b.url || '">' || coalesce(b.captured_title, b.url) || '</a></p>',
    source_id      = s.id,
    type           = 'text',
    url            = null,
    captured_title = null,
    storage_path   = null,
    thumb_path     = null,
    media_width    = null,
    media_height   = null,
    file_name      = null,
    mime           = null,
    byte_size      = null
from source s
where b.type = 'bookmark'
  and lower(s.name) = lower(coalesce(b.captured_title, b.url));


-- ----------------------------------------------------------------------------
-- 5. RETIRE bookmark — only now that ZERO bookmark rows remain. A defensive
--    assertion first (finding #2): if any bookmark survived, abort here with a
--    clear message rather than let the CHECK below abort obscurely.
-- ----------------------------------------------------------------------------
do $$
declare n int;
begin
  select count(*) into n from bit where type = 'bookmark';
  if n <> 0 then
    raise exception 'source migration: % bookmark row(s) still present — conversion incomplete, refusing to retire the type', n;
  end if;
end $$;

-- 5a. remove 'bookmark' from the allowed type set (§2a v1 set → text·drawing·image).
alter table bit drop constraint bit_type_allowed;
alter table bit add  constraint bit_type_allowed check (type in ('text', 'drawing', 'image'));

-- 5b. drop the bookmark branch from the substance rule. text/drawing/image are
--     copied VERBATIM from init.sql (lines 209-218); the bookmark branch is
--     simply gone (this reverts 20260725000001's bookmark-preview relax — moot).
alter table bit drop constraint bit_substance_matches_type;
alter table bit add  constraint bit_substance_matches_type check (
    case type
      when 'text'     then body is not null
                        and strokes is null and url is null
                        and captured_title is null and storage_path is null
      when 'drawing'  then strokes is not null
                        and body is null and url is null
                        and captured_title is null and storage_path is null
      when 'image'    then storage_path is not null
                        and body is null and strokes is null
                        and url is null and captured_title is null
      else true  -- unknown types are gated by bit_type_allowed, not here
    end
  );
-- The now-dead `when 'bookmark'` branches in bit_face()/bit_search_text() are
-- LEFT AS-IS (finding #4): dead, not wrong — they can never match (no bookmark
-- rows, no bookmark type), so no generated-column edit is needed.


-- ----------------------------------------------------------------------------
-- 6. DROP the old D-100 columns + REFRESH the views.
--    the_inbox (20260725000001) was created `select b.*` AFTER source_url/title
--    existed, so its frozen column list DEPENDS on them — the column drop would
--    fail. So drop the three views first, drop the columns, then recreate:
--      • board_cards + the_ledger — recreated WITH a LEFT JOIN source, so "from
--        [name] ↗" shows on cards and lists (the plan's Slice-4 view refresh).
--      • the_inbox — recreated `select b.*` unchanged in meaning; it now carries
--        source_id (not the dropped columns) for Stage 3 to join.
--    captured_title is now unused on live rows (harmless; later cleanup).
-- ----------------------------------------------------------------------------
drop view board_cards;
drop view the_ledger;
drop view the_inbox;

alter table bit drop column source_url;
alter table bit drop column source_title;

-- board_cards — the world's render rule (init ~590), now exposing the source.
create view board_cards with (security_invoker = true) as
  select p.id as placement_id,
         p.board_id,
         case when p.target_bit_id is not null then 'bit' else 'board' end as thing,
         p.target_bit_id,
         p.target_board_id,
         p.x, p.y, p.width, p.height, p.z,
         p.display_size,
         p.arrived_at,
         coalesce(b.face, tb.title) as label,   -- the abridged form (§2f)
         b.type,
         b.subtype_word_id,
         b.body, b.strokes, b.url,
         b.storage_path, b.thumb_path,
         b.visibility as target_visibility,
         b.source_id,
         s.name as source_name,                 -- "from [name] ↗" travels with the bit (P8)
         s.url  as source_url
  from placement p
  left join bit b      on b.id  = p.target_bit_id
  left join board tb   on tb.id = p.target_board_id
  left join source s   on s.id  = b.source_id
  where p.left_at is null
    and (b.id  is null or b.deleted_at  is null)
    and (tb.id is null or tb.deleted_at is null);

-- the_ledger — every live bit, newest first (init ~518), now exposing the source.
create view the_ledger with (security_invoker = true) as
  select b.*,
         s.name as source_name,
         s.url  as source_url
  from bit b
  left join source s on s.id = b.source_id
  where b.deleted_at is null
  order by b.created_at desc;

-- the_inbox — the loose pile (20260725000001), recreated so the column drop is
-- legal; meaning unchanged (a bit is loose ⇔ live and no live board shows it).
create view the_inbox with (security_invoker = true) as
  select b.*
  from bit b
  where b.deleted_at is null
    and not exists (
      select 1
      from placement p
      join board bo on bo.id = p.board_id
      where p.target_bit_id = b.id
        and p.left_at is null
        and bo.deleted_at is null
    )
  order by b.created_at desc;
