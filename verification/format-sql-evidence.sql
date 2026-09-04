-- FORMAT EVIDENCE, SQL half (storage session; Gate-A F2 fixes iii–v).
-- Self-contained; any Postgres 15+. Fixtures use the APP'S REAL node shapes:
-- bitRef atoms carry {refId, label} attrs (verified against bitref.ts:33-50);
-- headings may carry an id attr; a "toggle" node holds foldable content whose
-- words must stay searchable (spec §13.7.4).
\set QUIET on
\pset footer off

create temp table fx (
  id int primary key, what text,
  html text, doc jsonb
);

-- 1 · a realistic piece: heading(with id) + prose + chip + folded toggle
insert into fx values (1, 'realistic piece',
  '<h2 data-hid="h-1">Weekend notes</h2><p>About <span data-ref="b-9" class="gather-chip">the marmoset quote</span> and more.</p><div data-toggle="open"><p>folded words: spelunking gear list</p></div>',
  '{"type":"doc","content":[
    {"type":"heading","attrs":{"level":2,"hid":"h-1"},"content":[{"type":"text","text":"Weekend notes"}]},
    {"type":"paragraph","content":[{"type":"text","text":"About "},{"type":"bitRef","attrs":{"refId":"b-9","label":"the marmoset quote"}},{"type":"text","text":" and more."}]},
    {"type":"toggle","attrs":{"open":false},"content":[{"type":"paragraph","content":[{"type":"text","text":"folded words: spelunking gear list"}]}]}
  ]}'::jsonb);

-- 2 · the same content, no chip/toggle (baseline)
insert into fx values (2, 'baseline',
  '<h2>Reading list</h2><p>Finished the second chapter.</p>',
  '{"type":"doc","content":[
    {"type":"heading","attrs":{"level":2},"content":[{"type":"text","text":"Reading list"}]},
    {"type":"paragraph","content":[{"type":"text","text":"Finished the second chapter."}]}
  ]}'::jsonb);

\echo '== E1 · SIZE: pg_column_size, same content both ways =='
select id, what, pg_column_size(html) as html_bytes, pg_column_size(doc) as jsonb_bytes,
       round(pg_column_size(doc)::numeric / pg_column_size(html), 2) as ratio
from fx order by id;

\echo ''
\echo '== E2 · EXTRACTION over the real shapes (text nodes + label attr), incl. FOLDED content =='
create function fx_doc_text(d jsonb) returns text language sql immutable as $$
  select string_agg(distinct v.t, ' ')
  from (
    select jsonb_path_query(d, 'strict $.**.text')  #>> '{}' as t
    union all
    select jsonb_path_query(d, 'strict $.**.label') #>> '{}' as t
  ) v where v.t is not null
$$;
select id,
  to_tsvector('english', fx_doc_text(doc)) @@ plainto_tsquery('marmoset')   as finds_chip_label,
  to_tsvector('english', fx_doc_text(doc)) @@ plainto_tsquery('spelunking') as finds_folded_text,
  to_tsvector('english', fx_doc_text(doc)) @@ plainto_tsquery('bitRef')     as false_pos_nodetype,
  to_tsvector('english', fx_doc_text(doc)) @@ plainto_tsquery('h-1')        as false_pos_headingid
from fx where id = 1;

\echo ''
\echo '== E3 · GENERATED COLUMN with the real-shape extractor =='
create temp table gen_try (doc jsonb,
  tsv tsvector generated always as (to_tsvector('english', fx_doc_text(doc))) stored);
insert into gen_try select doc from fx;
select count(*) as rows_with_generated_tsv, bool_and(tsv is not null) as all_populated from gen_try;

\echo ''
\echo '== E4 · THE TSVECTOR CEILING: a long-form document (~1.4MB of text) =='
-- build ~1.4MB of prose-like text inside a jsonb doc
create temp table longdoc as
select jsonb_build_object('type','doc','content', jsonb_build_array(
  jsonb_build_object('type','paragraph','content', jsonb_build_array(
    jsonb_build_object('type','text','text', repeat('lorem ipsum dolor sit amet consectetur adipiscing elit sed do eiusmod tempor incididunt ', 16000))
  )))) as doc;
select pg_column_size(doc) as jsonb_bytes, length(fx_doc_text(doc)) as extracted_chars from longdoc;
\echo '-- attempting to_tsvector over it (does the save error?):'
do $$
declare v tsvector; n int;
begin
  select to_tsvector('english', fx_doc_text(doc)) into v from longdoc;
  select length(v) into n;
  raise notice 'NO ERROR — tsvector built, % lexemes', n;
exception when others then
  raise notice 'ERRORED: %', sqlerrm;
end $$;
\echo '-- and at a truly extreme size (~5.6MB text):'
do $$
declare v tsvector;
begin
  select to_tsvector('english', repeat('unique' || i::text || ' word' || i::text || ' ', 1))
  into v from generate_series(1,1) i;  -- warmup no-op
  select to_tsvector('english',
    (select string_agg('w' || i::text, ' ') from generate_series(1, 700000) i)) into v;
  raise notice 'NO ERROR at ~5.6MB of distinct words — % bytes of tsvector', pg_column_size(v);
exception when others then
  raise notice 'ERRORED: %', sqlerrm;
end $$;

\echo ''
\echo '== E5 · left() guard: capped extraction stays under any ceiling =='
select length(left(fx_doc_text(doc), 500000)) as capped_chars from longdoc;
