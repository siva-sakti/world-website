-- ============================================================================
-- json-search-proof.sql — HTML-strip search vs. tiptap-JSON search (draft)
-- ============================================================================
-- QUESTION: bit.body is stored today as an HTML string (text column), indexed
-- by bit_search_text() + a generated tsvector column
-- (supabase/migrations/20260721000001_init.sql:66-75, 194-196). If body moved
-- to tiptap/ProseMirror JSON (jsonb), would full-text search get WORSE?
--
-- This file is SELF-CONTAINED — no app schema required. Run it against a
-- THROWAWAY database (see run command at the bottom of this header), never
-- against the app's real db: it creates real (non-temp) helper functions so
-- the generated-column attempt in PART 4 can be checked, and drops them again
-- at the end, but a mid-run failure would leave them behind.
--
-- Recommended run command (native Postgres 17, same pattern as
-- verification/run-*-native.sh):
--   createdb json_search_scratch
--   psql -d json_search_scratch -f json-search-proof.sql
--   dropdb json_search_scratch
--
-- Requires Postgres 12+ for the `.**` recursive-wildcard jsonpath accessor
-- (used below) and 15+ generally per the task's target range; every construct
-- here was hand-verified against a live local Postgres 17.10 before writing
-- this file (see the accompanying report for what was checked and how).
-- ============================================================================

\set ON_ERROR_STOP on
\echo '=== JSON vs HTML search proof ==='

-- ----------------------------------------------------------------------------
-- PART 1 — the fixture: 4 realistic tiptap docs, each stored BOTH ways
-- ----------------------------------------------------------------------------
-- Row 1 (kitchen sink) carries the two marker words the task asks for:
--   'spelunking' — appears ONLY inside a paragraph nested inside a bulletList
--                  listItem (tests recursion into nested structure).
--   'marmoset'   — appears ONLY as a mention/chip's attrs.label (tests
--                  whether a custom inline node's attribute-carried text is
--                  reachable at all — the actual risk this file is probing).
-- The HTML column renders the mention the way tiptap's own Mention extension
-- does: the label as the span's literal inner text (data-id carries the
-- machine id, never the visible word) — so tag-stripping keeps it for free.
-- Row 4 adds a SECOND nesting level (list-inside-list-item) and two more
-- chips, so the extraction is stressed past one level of recursion.
-- ----------------------------------------------------------------------------

create temp table doc_test (
  id    int primary key,
  label text not null,
  html  text not null,
  doc   jsonb not null
);

insert into doc_test (id, label, html, doc) values

(1, 'kitchen sink: heading + para + nested list + chip',
 $html$<h1>Weekend Notes</h1><p>A quick summary of the trip.</p><ul><li><p>Pack the headlamps for spelunking tomorrow</p></li><li><p>Buy snacks for the drive</p></li></ul><p>Ask <span data-type="mention" data-id="user-42">@marmoset</span> about the permit.</p>$html$,
 $doc${
   "type": "doc",
   "content": [
     {"type":"heading","attrs":{"level":1},"content":[{"type":"text","text":"Weekend Notes"}]},
     {"type":"paragraph","content":[{"type":"text","text":"A quick summary of the trip."}]},
     {"type":"bulletList","content":[
       {"type":"listItem","content":[{"type":"paragraph","content":[{"type":"text","text":"Pack the headlamps for spelunking tomorrow"}]}]},
       {"type":"listItem","content":[{"type":"paragraph","content":[{"type":"text","text":"Buy snacks for the drive"}]}]}
     ]},
     {"type":"paragraph","content":[
       {"type":"text","text":"Ask "},
       {"type":"mention","attrs":{"id":"user-42","label":"marmoset"}},
       {"type":"text","text":" about the permit."}
     ]}
   ]
 }$doc$::jsonb),

(2, 'baseline: heading + one paragraph, nothing special',
 $html$<h2>Reading List</h2><p>Finished the second chapter today.</p>$html$,
 $doc${
   "type": "doc",
   "content": [
     {"type":"heading","attrs":{"level":2},"content":[{"type":"text","text":"Reading List"}]},
     {"type":"paragraph","content":[{"type":"text","text":"Finished the second chapter today."}]}
   ]
 }$doc$::jsonb),

(3, 'list-only: flat bullet list, no chip',
 $html$<p>Errands for the week</p><ul><li><p>Return the library books</p></li><li><p>Call the plumber about the leak</p></li><li><p>Water the plants</p></li></ul>$html$,
 $doc${
   "type": "doc",
   "content": [
     {"type":"paragraph","content":[{"type":"text","text":"Errands for the week"}]},
     {"type":"bulletList","content":[
       {"type":"listItem","content":[{"type":"paragraph","content":[{"type":"text","text":"Return the library books"}]}]},
       {"type":"listItem","content":[{"type":"paragraph","content":[{"type":"text","text":"Call the plumber about the leak"}]}]},
       {"type":"listItem","content":[{"type":"paragraph","content":[{"type":"text","text":"Water the plants"}]}]}
     ]}
   ]
 }$doc$::jsonb),

(4, 'two chips + a list nested two levels deep',
 $html$<h1>Retro</h1><ul><li><p>Follow up with <span data-type="mention" data-id="user-7">@kestrel</span></p><ul><li><p>double-check the deploy window</p></li></ul></li><li><p>thank <span data-type="mention" data-id="user-8">@barnacle</span></p></li></ul>$html$,
 $doc${
   "type": "doc",
   "content": [
     {"type":"heading","attrs":{"level":1},"content":[{"type":"text","text":"Retro"}]},
     {"type":"bulletList","content":[
       {"type":"listItem","content":[
         {"type":"paragraph","content":[
           {"type":"text","text":"Follow up with "},
           {"type":"mention","attrs":{"id":"user-7","label":"kestrel"}}
         ]},
         {"type":"bulletList","content":[
           {"type":"listItem","content":[{"type":"paragraph","content":[{"type":"text","text":"double-check the deploy window"}]}]}
         ]}
       ]},
       {"type":"listItem","content":[{"type":"paragraph","content":[
         {"type":"text","text":"thank "},
         {"type":"mention","attrs":{"id":"user-8","label":"barnacle"}}
       ]}]}
     ]}
   ]
 }$doc$::jsonb);

\echo '--- fixture rows ---'
select id, label from doc_test order by id;

-- ----------------------------------------------------------------------------
-- PART 2 — the EXISTING approach, unchanged
-- ----------------------------------------------------------------------------
-- This is bit_search_text()'s HTML handling, copied verbatim from
-- supabase/migrations/20260721000001_init.sql:71-74 (the strip-tags line is
-- :72). Only the html-specific piece is reproduced here (content/url/
-- captured_title are unrelated to this question).
-- ----------------------------------------------------------------------------

create or replace function html_search_text(p_html text) returns text
language sql immutable
as $$
  select coalesce(regexp_replace(p_html, '<[^>]*>', ' ', 'g'), '')
$$;

-- ----------------------------------------------------------------------------
-- PART 3 — three candidate JSON-extraction approaches
-- ----------------------------------------------------------------------------
-- (a) NAIVE — jsonb_path_query_array with the recursive wildcard, grabbing
--     every value under a key literally named "text" at any depth. This is
--     the idiom most people reach for first.
--     KNOWN QUIRK (verified below in PART 5): Postgres's `.**` recursive
--     wildcard visits a matching node at more than one level of its own
--     recursion, so each string comes back DUPLICATED in the array. Harmless
--     for a tsvector (to_tsvector just sees the same lexeme at two extra
--     positions) but worth knowing; DISTINCT removes it.
--     WHAT IT MISSES: attrs are never visited by ".text" — a custom inline
--     node (mention/chip) whose visible word lives in attrs.label is
--     invisible to this approach. This is the risk under test.
--
-- (b) TYPE-AWARE — union of "$.**.text" (prose) and "$.**.label" (the one
--     attrs key our fixture's custom node uses for its visible word). This
--     is what someone would write ONCE they know their own node vocabulary.
--     It is the best of the three for THIS fixture, but it is only correct
--     because the schema's custom node happens to name its visible attribute
--     "label" — a different custom node (e.g. an image with "alt", a link
--     bit with "title") needs its own key added by hand. HTML never needs
--     this: whatever a node's renderHTML() puts between the tags is already
--     visible text, generically, with no per-node-type list to maintain.
--
-- (c) CATCH-EVERYTHING — a jsonpath filter for "any string value anywhere",
--     with no notion of which keys are content vs. structure. It DOES catch
--     attrs.label without knowing its name in advance, but it also indexes
--     every "type" discriminator ("doc", "paragraph", "mention", …) and every
--     id-like attrs value ("user-42") as searchable words — index noise, and
--     a plausible source of false-positive matches (searching a person's
--     literal name "Mention" or a stray id fragment). Shown for completeness;
--     not recommended.
--
-- A fourth shape — a hand-rolled `with recursive` walk of the jsonb tree
-- instead of a jsonpath expression — is included in PART 3D purely to answer
-- "is a recursive CTE viable inside a generated column at all" (task's other
-- named candidate). It has the same catch-everything behavior/tradeoff as (c).
-- ----------------------------------------------------------------------------

-- (a) naive: text-only, deduped
create or replace function jsonb_text_only(doc jsonb) returns text
language sql immutable
as $$
  select coalesce(string_agg(distinct t, ' '), '')
  from jsonb_array_elements_text(jsonb_path_query_array(doc, '$.**.text')) as t
$$;

-- (b) type-aware: text + label
create or replace function jsonb_text_and_labels(doc jsonb) returns text
language sql immutable
as $$
  select coalesce(string_agg(distinct t, ' '), '')
  from (
    select t from jsonb_array_elements_text(jsonb_path_query_array(doc, '$.**.text')) as t
    union
    select t from jsonb_array_elements_text(jsonb_path_query_array(doc, '$.**.label')) as t
  ) s
$$;

-- (c) catch-everything: any string, any key, any depth
create or replace function jsonb_all_strings(doc jsonb) returns text
language sql immutable
as $$
  select coalesce(string_agg(distinct t, ' '), '')
  from jsonb_array_elements_text(
    jsonb_path_query_array(doc, '$.** ? (@.type() == "string")')
  ) as t
$$;

-- (d) recursive CTE, same catch-everything semantics as (c) — the other
-- named candidate, to compare against the jsonpath-based approaches.
create or replace function jsonb_all_strings_cte(doc jsonb) returns text
language sql immutable
as $$
  with recursive walk(node) as (
    select doc
    union all
    select elem
    from walk,
    lateral (
      select value as elem from jsonb_each(walk.node) where jsonb_typeof(walk.node) = 'object'
      union all
      select value as elem from jsonb_array_elements(walk.node) where jsonb_typeof(walk.node) = 'array'
    ) sub
  )
  select coalesce(string_agg(distinct node #>> '{}', ' '), '')
  from walk
  where jsonb_typeof(node) = 'string'
$$;

-- ----------------------------------------------------------------------------
-- PART 4 — can any of these back a GENERATED ALWAYS AS (...) STORED column?
-- ----------------------------------------------------------------------------
-- Each attempt is isolated in its own DO block so one failure doesn't abort
-- the rest of the file (mirrors the try/report style already used in
-- verification/opening-proofs.sql). Uses a temp table per attempt so nothing
-- outlives this session even on success.
-- ----------------------------------------------------------------------------

\echo '--- PART 4: generated-column feasibility ---'

do $$
begin
  execute 'create temp table gen_html (id int, html text,
             search_tsv tsvector generated always as
               (to_tsvector(''english'', html_search_text(html))) stored)';
  raise notice 'GENERATED COLUMN (html_search_text):        PASS';
  drop table gen_html;
exception when others then
  raise notice 'GENERATED COLUMN (html_search_text):        FAIL — %', sqlerrm;
end $$;

do $$
begin
  execute 'create temp table gen_json_a (id int, doc jsonb,
             search_tsv tsvector generated always as
               (to_tsvector(''english'', jsonb_text_only(doc))) stored)';
  raise notice 'GENERATED COLUMN (jsonb_text_only):          PASS';
  drop table gen_json_a;
exception when others then
  raise notice 'GENERATED COLUMN (jsonb_text_only):          FAIL — %', sqlerrm;
end $$;

do $$
begin
  execute 'create temp table gen_json_b (id int, doc jsonb,
             search_tsv tsvector generated always as
               (to_tsvector(''english'', jsonb_text_and_labels(doc))) stored)';
  raise notice 'GENERATED COLUMN (jsonb_text_and_labels):    PASS';
  drop table gen_json_b;
exception when others then
  raise notice 'GENERATED COLUMN (jsonb_text_and_labels):    FAIL — %', sqlerrm;
end $$;

do $$
begin
  execute 'create temp table gen_json_c (id int, doc jsonb,
             search_tsv tsvector generated always as
               (to_tsvector(''english'', jsonb_all_strings(doc))) stored)';
  raise notice 'GENERATED COLUMN (jsonb_all_strings):        PASS';
  drop table gen_json_c;
exception when others then
  raise notice 'GENERATED COLUMN (jsonb_all_strings):        FAIL — %', sqlerrm;
end $$;

do $$
begin
  execute 'create temp table gen_json_d (id int, doc jsonb,
             search_tsv tsvector generated always as
               (to_tsvector(''english'', jsonb_all_strings_cte(doc))) stored)';
  raise notice 'GENERATED COLUMN (jsonb_all_strings_cte):    PASS';
  drop table gen_json_d;
exception when others then
  raise notice 'GENERATED COLUMN (jsonb_all_strings_cte):    FAIL — %', sqlerrm;
end $$;

-- ----------------------------------------------------------------------------
-- PART 5 — the raw extraction, side by side, so the duplication quirk and
-- the attrs.label gap are visible before any tsvector/search is involved
-- ----------------------------------------------------------------------------

\echo '--- PART 5: raw extracted text per row per approach ---'
select
  id,
  label,
  html_search_text(html)        as html_stripped,
  jsonb_text_only(doc)          as json_naive_text_only,
  jsonb_text_and_labels(doc)    as json_type_aware,
  jsonb_all_strings(doc)        as json_catch_everything
from doc_test
order by id;

-- ----------------------------------------------------------------------------
-- PART 6 — identical searches against both, side by side
-- ----------------------------------------------------------------------------
-- 'spelunking' — only inside a nested list item. Expect ALL approaches to
--   find it (recursion into content arrays isn't the risk; attrs are).
-- 'marmoset'   — only inside a chip's attrs.label. Expect HTML to find it
--   (it's plain inner text once tags are stripped), expect the NAIVE JSON
--   approach to MISS it (it only ever looks at keys named "text"), and
--   expect the type-aware and catch-everything approaches to find it.
-- ----------------------------------------------------------------------------

\echo '--- PART 6: search for the nested-list-only word (spelunking) ---'
select
  id, label,
  to_tsvector('english', html_search_text(html))
    @@ plainto_tsquery('english', 'spelunking')  as html_hit,
  to_tsvector('english', jsonb_text_only(doc))
    @@ plainto_tsquery('english', 'spelunking')  as json_naive_hit,
  to_tsvector('english', jsonb_text_and_labels(doc))
    @@ plainto_tsquery('english', 'spelunking')  as json_type_aware_hit,
  to_tsvector('english', jsonb_all_strings(doc))
    @@ plainto_tsquery('english', 'spelunking')  as json_catch_all_hit
from doc_test
order by id;

\echo '--- PART 6: search for the chip-label-only word (marmoset) ---'
select
  id, label,
  to_tsvector('english', html_search_text(html))
    @@ plainto_tsquery('english', 'marmoset')  as html_hit,
  to_tsvector('english', jsonb_text_only(doc))
    @@ plainto_tsquery('english', 'marmoset')  as json_naive_hit,
  to_tsvector('english', jsonb_text_and_labels(doc))
    @@ plainto_tsquery('english', 'marmoset')  as json_type_aware_hit,
  to_tsvector('english', jsonb_all_strings(doc))
    @@ plainto_tsquery('english', 'marmoset')  as json_catch_all_hit
from doc_test
order by id;

\echo '--- PART 6: same two searches against row 4 (kestrel / barnacle / deploy) ---'
select
  id, label,
  to_tsvector('english', html_search_text(html))
    @@ plainto_tsquery('english', 'kestrel')      as html_kestrel,
  to_tsvector('english', jsonb_text_only(doc))
    @@ plainto_tsquery('english', 'kestrel')      as json_naive_kestrel,
  to_tsvector('english', jsonb_text_and_labels(doc))
    @@ plainto_tsquery('english', 'kestrel')      as json_type_aware_kestrel,
  to_tsvector('english', html_search_text(html))
    @@ plainto_tsquery('english', 'deploy')       as html_deploy,
  to_tsvector('english', jsonb_text_only(doc))
    @@ plainto_tsquery('english', 'deploy')       as json_naive_deploy
from doc_test
where id = 4;

-- ----------------------------------------------------------------------------
-- PART 7 — index-noise check: does the catch-everything JSON approach index
-- words that were never actually written by the owner?
-- ----------------------------------------------------------------------------
-- A search for "mention" (the tiptap node TYPE name, not anything the owner
-- typed) should NOT match under HTML or a real editor's normal output; if it
-- matches under a JSON approach, that approach is indexing its own schema.
-- ----------------------------------------------------------------------------

\echo '--- PART 7: false-positive check — searching the literal word "mention" ---'
select
  id, label,
  to_tsvector('english', html_search_text(html))
    @@ plainto_tsquery('english', 'mention')  as html_hit,
  to_tsvector('english', jsonb_text_and_labels(doc))
    @@ plainto_tsquery('english', 'mention')  as json_type_aware_hit,
  to_tsvector('english', jsonb_all_strings(doc))
    @@ plainto_tsquery('english', 'mention')  as json_catch_all_hit
from doc_test
where id in (1, 4);

-- ----------------------------------------------------------------------------
-- cleanup — the helper functions are real (non-temp), the fixture table is
-- temp and vanishes with the session on its own.
-- ----------------------------------------------------------------------------

drop function if exists html_search_text(text);
drop function if exists jsonb_text_only(jsonb);
drop function if exists jsonb_text_and_labels(jsonb);
drop function if exists jsonb_all_strings(jsonb);
drop function if exists jsonb_all_strings_cte(jsonb);

\echo '=== done ==='
