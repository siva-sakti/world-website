-- Proof for 20260906000001_born_private.sql (run against the full stack).
-- Seed the founding world: bits under the OLD default (public) + one already-private.
\set owner '298fbf29-39c8-4738-96d0-3348f0e59fd0'
insert into bit (id, owner_id, type, body) values (gen_random_uuid(), :'owner', 'text', '<p>a</p>');
insert into bit (id, owner_id, type, body) values (gen_random_uuid(), :'owner', 'text', '<p>b</p>');
insert into bit (id, owner_id, type, body, visibility) values (gen_random_uuid(), :'owner', 'text', '<p>c</p>', 'private');
select 'BEFORE' as world, visibility, count(*) from bit group by visibility order by visibility;
\i supabase/migrations/20260906000001_born_private.sql
select 'AFTER' as world, visibility, count(*) from bit group by visibility order by visibility;
-- attack 1: a new bit is now born private
insert into bit (id, owner_id, type, body) values (gen_random_uuid(), :'owner', 'text', '<p>new</p>');
select 'NEWBORN' as probe, visibility from bit where face = 'new' or body like '%new%';
-- attack 2: nothing public survives
select 'PUBLIC LEFT' as probe, count(*) from bit where visibility = 'public';
-- attack 3: the CHECK still refuses garbage
insert into bit (id, owner_id, type, body, visibility) values (gen_random_uuid(), :'owner', 'text', '<p>x</p>', 'sorta');
