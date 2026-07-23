-- ============================================================================
-- init — the schema, derived fresh from agreements.md (Stage 1a, D-083)
-- ============================================================================
-- Derived per translation-guidelines-conceptual-to-technical.md (D-081):
--   • every table/column/constraint carries a citation — agreements § / invariant
--     I-x / strategy move (guidelines §4.n) / parked-door note. Nothing invented,
--     nothing lost — checked both directions at step 1g.
--   • the old migration (20260715000001_init.sql) was NOT consulted (rule 6 —
--     fresh derivation); it is diffed at step 4 and retired after.
--   • storage buckets are NOT created here — Stage 2b's job (build plan).
--   • naming authority: lexicon.md — singular table names, the lexicon's words
--     verbatim; new technical names added to the lexicon's code-names section
--     in the same pass (rule 7).
--   • assumes the Supabase runtime (roles `authenticated`/`anon`, the auth
--     schema) — the owner-approved proof environment (Supabase CLI).
--   • there are NO sync/outbox/version tables, deliberately: the outbox is
--     device-local and births-only (§2h, I-D2); edit conflicts are ruled
--     last-arrival-wins with no version column (§2d, I-D5).
--
-- The eight record kinds, three families (agreements §7 storage map):
--   things:      bit · board
--   acts:        tag_application · placement · connector
--   vocabulary:  tag · category · subtype_word
--   (+ the dormant ninth table, §6 — present, unused)
-- Tables are created in FK-dependency order (vocabulary → things → acts);
-- the family grouping above is the conceptual map.
-- ============================================================================


-- ----------------------------------------------------------------------------
-- FUNCTIONS (needed by the generated columns and the one trigger)
-- ----------------------------------------------------------------------------

-- The face: what a bit shows and is searched by — computed, never stored as
-- truth of its own (§2b, I-R2; stored-generated = layer E, rebuildable by
-- physics — strategy §4.4). ONE definition, called by both generated columns
-- (derive-don't-duplicate, model-safety gate 4).
--   your content if you spoke (empty string = cleared = fall back, §2b)
--   else per type — text: the body's plain words (markup stripped) ·
--   bookmark: the captured title, else the URL itself (§2b) ·
--   drawing/image: nothing — the bit shows as its visual self (§2b).
-- DOOR: when pdf/audio land (B7), their metadata-title branch is added here
-- (create or replace — zero rework).
create function bit_face(
  p_type text, p_content text, p_body text, p_url text, p_captured_title text
) returns text
language sql immutable
as $$
  select coalesce(
    nullif(btrim(p_content), ''),
    case p_type
      when 'text'     then nullif(btrim(regexp_replace(coalesce(p_body, ''), '<[^>]*>', ' ', 'g')), '')
      when 'bookmark' then coalesce(nullif(btrim(p_captured_title), ''), p_url)
      else null
    end
  )
$$;

-- The search index's text — ALL of a bit's words, NOT just its face. Separated
-- from bit_face (D-088, the D-087 follow-on fix): once a text bit can carry both a
-- title (content) and a body, indexing only the face would drop the body from
-- search — the moment you title a note, its contents would vanish from find (and
-- captioning a bookmark would hide its captured page-title). So search indexes
-- every text column; the face stays the display headline (§2b face-vs-search
-- split). Type-agnostic — absent columns are empty (a drawing: just content, if any).
create function bit_search_text(
  p_content text, p_body text, p_url text, p_captured_title text
) returns text
language sql immutable
as $$
  select coalesce(p_content, '') || ' '
      || coalesce(regexp_replace(p_body, '<[^>]*>', ' ', 'g'), '') || ' '
      || coalesce(p_captured_title, '') || ' '
      || coalesce(p_url, '')
$$;

-- The ONE trigger (strategy §4.7): updated_at stamping — nothing else is ever
-- done by trigger. All other behavior is visible physics: constraints and views.
create function set_updated_at() returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end
$$;


-- ----------------------------------------------------------------------------
-- VOCABULARY — the owner's organizing words (§7 family map). Every word is its
-- own row, referenced by id, so renames touch one row — free by construction
-- (principle 9, I-R4). Three small tables of IDENTICAL SHAPE, never merged
-- (strategy §4.2): the FKs make wrong references impossible — you cannot tag
-- with a subtype word, cannot nest categories (I-R5 by physics).
-- Vocabulary dies without a trash stage (principle 10 carve) — no deleted_at.
-- ----------------------------------------------------------------------------

create table category (
  id         uuid primary key default gen_random_uuid(),  -- referenced by id (P9)
  name       text not null,                               -- typed once, it exists (§3b)
  created_at timestamptz not null default now(),          -- one clock (P4)
  updated_at timestamptz not null default now()           -- renames are edits (P4)
);
-- near-duplicates prevented at birth, case-insensitive — §3e's rule, applied to
-- the whole vocabulary family (identical shape, §4.2; extension to categories is
-- a logged technical call, deliberations D-083, owner veto open)
create unique index category_name_ci on category (lower(name));

create table tag (
  id          uuid primary key default gen_random_uuid(), -- renames free (P9)
  word        text not null,                              -- the word, stored once (§3a)
  category_id uuid references category(id) on delete set null,
      -- zero or ONE category per tag (§3b — one home; multi-home parked A8);
      -- dissolving a category → its words survive, ungrouped — by physics (§3e)
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);
-- Astrology/astrology can't both exist (§3e); the same constraint is the half
-- of I-D6 the database keeps (flush name-collisions attach — the attach itself
-- is the db-module's job)
create unique index tag_word_ci on tag (lower(word));
create index tag_category on tag (category_id);           -- FK support (dissolve = SET NULL sweep)

create table subtype_word (
  id         uuid primary key default gen_random_uuid(),
  word       text not null,                               -- the owner-editable list (§5c)
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
-- "exactly like tag words" is literal (§5c): near-duplicates prevented at birth
create unique index subtype_word_ci on subtype_word (lower(word));


-- ----------------------------------------------------------------------------
-- THINGS — what exists (§7 family map). A bit needs no title, no board, no tag
-- to exist (§2, principle 5): every meaning column below is nullable.
-- ----------------------------------------------------------------------------

create table bit (
  id              uuid primary key default gen_random_uuid(),
      -- the permanent ID — the spine everything points at (§2a plumbing)
  type            text not null,
      -- the half the machine can tell on its own (§2a)
  subtype_word_id uuid references subtype_word(id) on delete set null,
      -- the half only the owner gives — optional, editable later (§2a);
      -- deleting the word: bits survive, they just lose it (§5c) — by physics,
      -- reaching frozen bits too (I-T3)
  content         text,
      -- ONLY words the owner authored; the machine has NO write path to it
      -- (§2b, I-R1 — kept by the single db-module write fn, per the invariant's
      -- level). Deliberately NOT constrained here: v1's text-bit lock and A10's
      -- future unlock must both be zero-DDL (§2f evidence gate, parked A10)
  body            text,
      -- a text bit's typed words, rich text — "the thing itself" (§2a; §2b
      -- calls it "the body")
  strokes         jsonb,
      -- a drawing's vectors, one opaque package — crisp forever, recognition-
      -- ready someday (§2a; strategy §4.6: not values any question needs)
  url             text,
      -- a bookmark is a saved URL (§2a)
  captured_title  text,
      -- the page's title read ONCE at save — machine truth, immutable after
      -- (§2b, I-R3 — immutability kept by the db-module, per the invariant);
      -- nullable: the fetch may fail (auth-walled pages — model-scenarios S1);
      -- the face then falls back to the URL (§2b)
  storage_path    text,
      -- the media file's address in the file store — a path, never a URL
      -- (§7 layer B; SPEC §9: signed URLs are generated at read, never stored)
  thumb_path      text,
      -- layer-E artifact address — the thumbnail is regenerable cache (§7 E)
  media_width     int,
  media_height    int,
  file_name       text,
  mime            text,
  byte_size       bigint,
      -- media facts (§2a plumbing)
  visibility      text not null default 'public',
      -- a bit is a low-stakes atom that leans PUBLIC; one-tap to private,
      -- changeable anytime (§2a, I-P1)
  deleted_at      timestamptz,
      -- trash is a freeze, not an erase (§2g); state lives in timestamps, never
      -- a flag beside a date (strategy §4.3); this frozen row IS the tombstone
      -- the I-D1 check reads (§2h — no new stored state needed)
  created_at      timestamptz not null default now(),
      -- DOOR: client-suppliable at insert — born-at = the act's moment, never
      -- the sync's (I-D4, parked door 3; the default fires only when absent)
  updated_at      timestamptz not null default now(),
      -- last touched (P4); edit conflicts: last arrival wins, whole-record,
      -- no version column by explicit ruling (§2d, I-D5)
  face            text generated always as
                    (bit_face(type, content, body, url, captured_title)) stored,
      -- computed by the database itself — self-maintaining, drift structurally
      -- dead (§2b, I-R2; strategy §4.4; layer E)
  search_tsv      tsvector generated always as
                    (to_tsvector('english',
                      bit_search_text(content, body, url, captured_title))) stored,
      -- the search index over ALL the bit's words — title (content) + body +
      -- captured title + URL — NOT just the face, so titling a note never hides
      -- its body from find (§7 ledger row 1; §2b face-vs-search split, D-088; layer E)

  constraint bit_type_allowed check (type in ('text', 'drawing', 'image', 'bookmark')),
      -- the v1 set (§2a; bookmark ruled D-074). DOOR: pdf · audio (B7) — and
      -- video if A14 fires — join by extending this list AND adding their
      -- substance branch below + face branch above, one small migration; never
      -- a hard-closed enum (parked door 2)
  constraint bit_visibility_allowed check (visibility in ('public', 'private')),
      -- DOOR: 'shared' joins later (B6, parked door 1) — extend, don't rework
  constraint bit_substance_matches_type check (
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
      when 'bookmark' then url is not null
                        and body is null and strokes is null
                        and storage_path is null
      else true  -- unknown types are gated by bit_type_allowed, not here
    end
  ),
      -- a row can never be an incoherent hybrid: exactly its type's substance,
      -- nothing of another's (§2a's type table made physics; makes the face
      -- computation total per type)
  constraint bit_media_facts_only_with_file check (
    storage_path is not null
    or (thumb_path is null and media_width is null and media_height is null
        and file_name is null and mime is null and byte_size is null)
  )
      -- no file → no media facts (§2a plumbing coheres with §7 layer B)
);
create index bit_ledger on bit (created_at desc) where deleted_at is null;
      -- the ledger: find's empty query — every live bit, newest first — the
      -- zero-design reachability floor (§7, I-T1)
create index bit_search on bit using gin (search_tsv);
      -- text search (find, §7)
create index bit_subtype_word on bit (subtype_word_id);
      -- FK support (subtype-word delete sweeps SET NULL)

create table board (
  id         uuid primary key default gen_random_uuid(),
  title      text,
      -- untitled boards are legal (§5); this is the typed searchable shadow —
      -- a handwritten title is the owner's hand on top (a drawing on the
      -- board), never a second column (§5)
  visibility text not null default 'private',
      -- a board is a whole assembly: PRIVATE by default, public only by a
      -- deliberate act — a locked room can't leak (§2a, I-P1)
  deleted_at timestamptz,
      -- deleting a board is a freeze too (§2g Cluster 2)
  created_at timestamptz not null default now(),          -- client-suppliable (I-D4)
  updated_at timestamptz not null default now(),
  search_tsv tsvector generated always as
               (to_tsvector('english', coalesce(title, ''))) stored,
      -- boards are searchable by title (§5); layer E
  constraint board_visibility_allowed check (visibility in ('public', 'private'))
      -- DOOR: 'shared' joins later (B6, parked door 1)
);
create index board_search on board using gin (search_tsv);


-- ----------------------------------------------------------------------------
-- ACTS — what the owner did; each act is its own timestamped row, and undo is
-- removing the act's record, no residue (§5 "the acts framing").
-- The target pair (strategy §4.1): "points at a bit OR a board" is ONE shape
-- used identically twice — two slots + a CHECK that exactly one is filled.
-- These FKs are also I-R5's physics: vocabulary is untaggable and unplaceable
-- because no target slot can point at it.
-- ----------------------------------------------------------------------------

create table tag_application (
  id              uuid primary key default gen_random_uuid(),
  tag_id          uuid not null references tag(id) on delete cascade,
      -- deleting a word (confirmed, with counts — §3e, I-T2) takes its
      -- applications; the things survive, they just lose the word (§3e).
      -- CASCADE reaches frozen carriers by physics (I-T3)
  target_bit_id   uuid references bit(id) on delete cascade,
      -- bit-destroy takes its tag applications (§2g, I-L10)
  target_board_id uuid references board(id) on delete cascade,
      -- board-destroy takes its tag applications (§2g, I-L6)
  created_at      timestamptz not null default now(),
      -- the act's time — "this word, on this thing, at this time" (§3a);
      -- client-suppliable: an offline capture's tags are born at act-time
      -- (I-D4, parked door 3)
  updated_at      timestamptz not null default now(),
      -- merge A→B repoints rows (§3e) — an edit, stamped (P4)
  constraint tag_application_exactly_one_target
    check (num_nonnulls(target_bit_id, target_board_id) = 1)
      -- anything is taggable — bits and boards, exactly one per act (§3a; §4.1)
);
-- one application per (word, thing): merge dedupes BY CONSTRUCTION (I-R7) —
-- the same-word-twice write is refused, so merge can only ever converge
create unique index tag_application_bit_once
  on tag_application (tag_id, target_bit_id) where target_bit_id is not null;
create unique index tag_application_board_once
  on tag_application (tag_id, target_board_id) where target_board_id is not null;
-- (pull-by-tag reads use the two indexes above via their tag_id prefix)
create index tag_application_bit on tag_application (target_bit_id);
      -- a thing's chips on its page (§5) + FK support
create index tag_application_board on tag_application (target_board_id);

create table placement (
  id              uuid primary key default gen_random_uuid(),
  board_id        uuid not null references board(id) on delete cascade,
      -- the board it is ON; board-destroy removes the placements on it (I-L6)
  target_bit_id   uuid references bit(id) on delete cascade,
      -- bit-destroy takes its placements — the ONLY erase of this row (§2c
      -- "never erased", §2g, I-L10, I-L2 — ordinary acts stamp left_at instead,
      -- kept by the db-module)
  target_board_id uuid references board(id) on delete cascade,
      -- a board-card: reference, not containment (§5); destroying a board also
      -- removes its board-cards elsewhere (I-L6)
  x               double precision,
  y               double precision,
      -- optional: absent = pile/collection mode (§2c); "no positionless cards
      -- on an arranged board" (§5) is kept by the db-module at call-in
  width           double precision,
  height          double precision,
      -- per-board size — poster on one board, stamp on another (§2c)
  z               int,
      -- stacking order (arrangement plumbing, §6a's "arrangement" family)
  display_size    text not null default 'full',
      -- full (the thing itself) or small (a compact card) — §5b
  arrived_at      timestamptz not null default now(),
      -- FIRST arrival — also this row's birth stamp (one clock, P4: they could
      -- never differ, so a separate created_at would be a duplicate fact —
      -- gate 4). Kept on re-place (§2c) — the KEEP is db-module discipline,
      -- not physics: no constraint stops an overwrite (guarded by the 1d
      -- re-place regression check: row identity + original arrived_at must
      -- survive an un-place → re-place cycle). Client-suppliable: a capture
      -- born on its starting board offline arrives at act-time (§2, I-D4)
  left_at         timestamptz,
      -- empty = here now (strategy §4.3 — a flag and its timestamp can never
      -- disagree if they are the same column). Un-place stamps it; re-place
      -- clears it (the last departure overwritten — §2c); TRASH NEVER touches
      -- it — a freeze records no departure (§2g)
  updated_at      timestamptz not null default now(),
  constraint placement_exactly_one_target
    check (num_nonnulls(target_bit_id, target_board_id) = 1),   -- §4.1
  constraint placement_not_on_itself
    check (target_board_id is distinct from board_id),
      -- a board-card is a board placed on ANOTHER board (§5)
  constraint placement_position_whole
    check ((x is null) = (y is null)),
      -- a position is a whole point or absent — never half a coordinate (§2c)
  constraint placement_display_size_allowed
    check (display_size in ('full', 'small')),                  -- §5b
  constraint placement_superkey unique (id, board_id)
      -- superkey enabling the composite FK on connector — the database itself
      -- guarantees an arrow's cards share its board (I-L9)
);
-- ONE durable membership row per (target, board) — re-place must reuse it, the
-- database refuses a second row (§2c, I-L1).
-- ⚠ DELIBERATE FORECLOSURE: this UNIQUE forecloses the visit-by-visit travel
-- timeline until it is replaced by one-row-per-visit (parked A7, door note 5 —
-- said here so the door's cost stays visible).
create unique index placement_bit_once
  on placement (board_id, target_bit_id) where target_bit_id is not null;
create unique index placement_board_once
  on placement (board_id, target_board_id) where target_board_id is not null;
create index placement_board on placement (board_id);
      -- board load: a board is one row + its placements, assembled at load (§7)
create index placement_target_bit on placement (target_bit_id);
      -- a bit's travel (§2c, I-T6) + FK support
create index placement_target_board on placement (target_board_id);
      -- board-cards of a board (render-absent check, §2g) + FK support

create table connector (
  id                uuid primary key default gen_random_uuid(),
  board_id          uuid not null references board(id) on delete cascade,
      -- part of ONE board's arrangement, like position and size (§6a)
  from_placement_id uuid not null,
  to_placement_id   uuid not null,
      -- endpoints anchor to PLACEMENTS, never bits — the choice that keeps the
      -- model clean: per-board by construction, no bit↔bit fact ever stored
      -- (§6a; §6's ontology untouched). A board-card endpoint is legal —
      -- forbidding it would cost a special-case (§6a)
  arrowhead         boolean not null default true,
      -- optional arrowhead — a display value (§6a; default = arrow, the
      -- owner's own word for them — logged boundary call, veto open)
  created_at        timestamptz not null default now(),
      -- "connector { board · from-placement · to-placement · when }" (§6a)
  updated_at        timestamptz not null default now(),   -- arrowhead is editable (P4)
  constraint connector_two_cards
    check (from_placement_id <> to_placement_id),
      -- an arrow joins TWO cards (§6a)
  constraint connector_from_on_its_board
    foreign key (from_placement_id, board_id)
    references placement (id, board_id) on delete cascade,
  constraint connector_to_on_its_board
    foreign key (to_placement_id, board_id)
    references placement (id, board_id) on delete cascade
      -- the composite FKs make a cross-board arrow UNREPRESENTABLE (I-L9, at
      -- the level the invariant prescribes). Placement rows die only at
      -- destroy, so these cascades are the destroy path (I-L5's constraint
      -- half; I-L4). Un-place kills connectors in the db-module with the
      -- proportional confirm (I-L5's app half, principle 12); trash only
      -- HIDES them — see the board_connectors view (I-L5b)
);
create index connector_board on connector (board_id);
create index connector_from on connector (from_placement_id);
create index connector_to on connector (to_placement_id);
      -- FK support for the destroy cascades


-- ----------------------------------------------------------------------------
-- DORMANT — the ninth table (§6): the deferred pairwise tie between two bits.
-- Present, empty, unused; deliberately NAMELESS in the product (its old name
-- is retired — lexicon). Ships in this migration and is never dropped as
-- "unused" (§6, parked A2 + door note 4). Shape per §6's re-entry design:
-- two IDs + when — symmetric, no direction, no labels. Everything further
-- waits for its build day (the re-entry moment IS the build order, §6).
-- ----------------------------------------------------------------------------

create table dormant (
  id         uuid primary key default gen_random_uuid(),
  bit_a      uuid not null references bit(id) on delete cascade,  -- bit-destroy total (I-L10)
  bit_b      uuid not null references bit(id) on delete cascade,
  created_at timestamptz not null default now()
);
create index dormant_bit_a on dormant (bit_a);  -- FK support (empty in v1)
create index dormant_bit_b on dormant (bit_b);


-- ----------------------------------------------------------------------------
-- RLS — security is the boundary, never the query layer (CLAUDE.md norm).
-- SPEC §3 is ruled WRONG (its OR-rule is the leak §2a closed) and was not
-- consulted; this section derives from §2a alone.
-- v1: owner-only on EVERY table, and NO anon policies at all — nothing is
-- visible to another human until the sharing phase ships (§2a v1 safety).
-- The single authenticated user IS the owner (§7 layer D: one owner login).
-- GRADIENT-READY (strategy §4.8): the future guest policies are drafted in
-- comments beside their tables — sharing lands as pure addition, zero rewrites.
-- ----------------------------------------------------------------------------

alter table category enable row level security;
create policy category_owner_all on category
  for all to authenticated using (true) with check (true);

alter table tag enable row level security;
create policy tag_owner_all on tag
  for all to authenticated using (true) with check (true);
-- FUTURE guest SELECT (sharing phase): tag words readable only where some
-- application of them is guest-visible — drafted properly when A4 (guest-pull
-- scope) is decided; a tag opens nothing (§4)

alter table subtype_word enable row level security;
create policy subtype_word_owner_all on subtype_word
  for all to authenticated using (true) with check (true);

alter table bit enable row level security;
create policy bit_owner_all on bit
  for all to authenticated using (true) with check (true);
-- FUTURE guest SELECT (sharing phase, §2a — composition is reachability AND
-- visibility, NEVER an OR; a private card renders absent by row absence, I-P5):
--   create policy bit_guest_read on bit for select to anon using (
--     visibility = 'public'                       -- the bit itself is public (I-P2)
--     and deleted_at is null                      -- trash is outside the world (§4)
--     and exists (select 1 from placement p
--                 join board b on b.id = p.board_id
--                 where p.target_bit_id = bit.id
--                   and p.left_at is null
--                   and b.visibility = 'public'
--                   and b.deleted_at is null)     -- reachable surface (I-P3);
--                                                 -- merely-public is never
--                                                 -- enough — no public feed (I-P4)
--   );

alter table board enable row level security;
create policy board_owner_all on board
  for all to authenticated using (true) with check (true);
-- FUTURE guest SELECT (sharing phase):
--   create policy board_guest_read on board for select to anon using (
--     visibility = 'public' and deleted_at is null   -- deliberate act only (§2a)
--   );

alter table tag_application enable row level security;
create policy tag_application_owner_all on tag_application
  for all to authenticated using (true) with check (true);
-- FUTURE guest SELECT: applications visible only on guest-visible targets
-- (AND-composition, §2a); drafted with A4 at the sharing phase

alter table placement enable row level security;
create policy placement_owner_all on placement
  for all to authenticated using (true) with check (true);
-- FUTURE guest SELECT: placements on public boards whose target is public
-- (both conjuncts, §2a; a private card renders absent, I-P5)

alter table connector enable row level security;
create policy connector_owner_all on connector
  for all to authenticated using (true) with check (true);
-- FUTURE guest SELECT: connectors whose board is public and both endpoint
-- targets are public (an arrow to a withheld card must render absent, I-P5)

alter table dormant enable row level security;
create policy dormant_owner_all on dormant
  for all to authenticated using (true) with check (true);
      -- uniform pattern (§4.2); v1 app has no write path to it (§6)


-- ----------------------------------------------------------------------------
-- VIEWS — "surfaces are named views" (strategy §4.5): each computed surface is
-- one saved question, written once, tested by the scenario replays, called by
-- every screen. Retrieval is computed, stored nowhere (principle 3, I-G2).
-- security_invoker: the caller's RLS applies (gradient-ready, §4.8).
-- The `thing` column in these views is 'bit' | 'board' — the things family.
-- find itself is not a view: it is these building blocks + the owner's filters,
-- composed by the app (§7); its EMPTY query is the_ledger below.
-- ----------------------------------------------------------------------------

-- The ledger: every live bit, newest first — the zero-design reachability
-- floor; reachable by date alone, no precondition (§7, I-T1).
-- Ordering = born-first (boundary call, owner veto open at Checkpoint A/B:
-- editing an old bit does not move it here).
create view the_ledger with (security_invoker = true) as
  select *
  from bit
  where deleted_at is null
  order by created_at desc;

-- The pull: tap a tag → EVERYTHING carrying it — bits and boards, complete
-- over the world, computed from applications, nothing to rebuild on restore
-- (§4, I-T5; trashed things drop out — I-L8).
create view the_pull with (security_invoker = true) as
  select ta.tag_id,
         'bit'::text     as thing,
         b.id            as thing_id,
         b.face          as label,     -- shown by its face's first words (§2f)
         b.type          as type,
         b.created_at    as born_at,
         ta.created_at   as applied_at
  from tag_application ta
  join bit b on b.id = ta.target_bit_id
  where b.deleted_at is null
  union all
  select ta.tag_id,
         'board'::text,
         bo.id,
         bo.title,                     -- a board appears as its own kind (§5)
         null,
         bo.created_at,
         ta.created_at
  from tag_application ta
  join board bo on bo.id = ta.target_board_id
  where bo.deleted_at is null;

-- Home: your boards, most-recently-touched first (§5a). "Touched" = the board
-- row or any placement on it changed (boundary call, veto open: tagging a
-- board does not bump it here). Computed — no second clock (I-G3).
create view home with (security_invoker = true) as
  select b.*,
         greatest(b.updated_at, coalesce(max(p.updated_at), b.updated_at)) as touched_at
  from board b
  left join placement p on p.board_id = b.id
  where b.deleted_at is null
  group by b.id
  order by touched_at desc;

-- The trash listing: the frozen things' ONE surface (§4 domains, I-T1, I-T4).
create view trash_listing with (security_invoker = true) as
  select 'bit'::text  as thing, id as thing_id, face  as label, deleted_at
  from bit   where deleted_at is not null
  union all
  select 'board'::text, id, title, deleted_at
  from board where deleted_at is not null
  order by deleted_at desc;

-- A bit's travel: has been on — board · arrived · left, read straight off the
-- placement rows (§5, I-T6). HISTORY domain: indifferent to current state —
-- a board now in trash still appears here (§4, I-T4). Destroyed boards'
-- legs are gone with their rows, knowingly (§2c).
create view bit_travel with (security_invoker = true) as
  select p.target_bit_id as bit_id,
         p.board_id,
         b.title         as board_title,
         p.arrived_at,
         p.left_at
  from placement p
  join board b on b.id = p.board_id
  where p.target_bit_id is not null
  order by p.arrived_at;

-- What's on a board: the world's render rule — a card renders iff its placement
-- is present AND its target is not trashed (I-L3); trashed targets' cards are
-- hidden, not destroyed (§2g); a board-card of a trashed board renders absent
-- (§2g Cluster 2).
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
         b.visibility as target_visibility
  from placement p
  left join bit b    on b.id  = p.target_bit_id
  left join board tb on tb.id = p.target_board_id
  where p.left_at is null
    and (b.id  is null or b.deleted_at  is null)
    and (tb.id is null or tb.deleted_at is null);

-- A board's connectors, as rendered: a connector renders iff NEITHER endpoint's
-- target is trashed (I-L5b) — trash hides arrows (restore revives them, §2g);
-- destroy cascades them away (the terminal event — no zombie rows).
create view board_connectors with (security_invoker = true) as
  select c.*
  from connector c
  join placement pf on pf.id = c.from_placement_id
  join placement pt on pt.id = c.to_placement_id
  left join bit bf    on bf.id  = pf.target_bit_id
  left join board bbf on bbf.id = pf.target_board_id
  left join bit bt    on bt.id  = pt.target_bit_id
  left join board bbt on bbt.id = pt.target_board_id
  where (bf.id  is null or bf.deleted_at  is null)
    and (bbf.id is null or bbf.deleted_at is null)
    and (bt.id  is null or bt.deleted_at  is null)
    and (bbt.id is null or bbt.deleted_at is null);

-- The tag manager's rows — every word listed, count-0 included (§3e, I-T1),
-- with the world/trash split the destructive confirms must state (I-T2:
-- "3 things + 2 in trash carry this word") and last use for recency pickers.
create view tag_counts with (security_invoker = true) as
  select t.id          as tag_id,
         t.word,
         t.category_id,
         count(ta.id) filter (where coalesce(b.deleted_at, bo.deleted_at) is null)     as world_count,
         count(ta.id) filter (where coalesce(b.deleted_at, bo.deleted_at) is not null) as trash_count,
         max(ta.created_at) as last_used_at
  from tag t
  left join tag_application ta on ta.tag_id = t.id
  left join bit b    on b.id  = ta.target_bit_id
  left join board bo on bo.id = ta.target_board_id
  group by t.id;

-- Subtype words, "exactly like tag words" (§5c): removal is confirmed with its
-- count, frozen carriers included (I-T2).
create view subtype_word_counts with (security_invoker = true) as
  select sw.id  as subtype_word_id,
         sw.word,
         count(b.id) filter (where b.deleted_at is null)     as world_count,
         count(b.id) filter (where b.deleted_at is not null) as trash_count
  from subtype_word sw
  left join bit b on b.subtype_word_id = sw.id
  group by sw.id;


-- ----------------------------------------------------------------------------
-- TRIGGERS — the one behavior (strategy §4.7): stamp updated_at on update.
-- No trigger on dormant (never written in v1, §6).
-- ----------------------------------------------------------------------------

create trigger category_updated_at        before update on category        for each row execute function set_updated_at();
create trigger tag_updated_at             before update on tag             for each row execute function set_updated_at();
create trigger subtype_word_updated_at    before update on subtype_word    for each row execute function set_updated_at();
create trigger bit_updated_at             before update on bit             for each row execute function set_updated_at();
create trigger board_updated_at           before update on board           for each row execute function set_updated_at();
create trigger tag_application_updated_at before update on tag_application for each row execute function set_updated_at();
create trigger placement_updated_at       before update on placement       for each row execute function set_updated_at();
create trigger connector_updated_at       before update on connector       for each row execute function set_updated_at();


-- ----------------------------------------------------------------------------
-- SEEDS — the ruled starting vocabulary. Idempotent (the CI uniques catch
-- every re-run and case variant).
-- ----------------------------------------------------------------------------

-- the four thought-words are ordinary seeded tags, available if ever wanted (§3b)
insert into tag (word)
  values ('learned'), ('noticed'), ('wondered'), ('theorized')
  on conflict do nothing;

-- the preset subtype chips — the owner's list from day one, editable (§2a, §5c)
insert into subtype_word (word)
  values ('cartoon'), ('doodle'), ('script'), ('notes'), ('diagram')
  on conflict do nothing;
