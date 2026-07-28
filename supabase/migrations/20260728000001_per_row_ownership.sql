-- Per-row ownership — de-hardcode the owner uid (D-107).
--
-- D-094 (20260723) locked every table to ONE literal owner uid baked into the RLS
-- predicate: `auth.uid() = '298fbf29-…'`. That protected the single owner, but a
-- hardcoded identity in the security layer is poor practice — and a dead end for
-- ever letting a second person own their own notebook. This replaces the literal
-- with PER-ROW ownership: every owned table gains an `owner_id` (defaulting to the
-- inserting user, read from the JWT), and the rule becomes "you see and write YOUR
-- OWN rows" — auth.uid() = owner_id.
--
-- Existing rows are backfilled to the current owner: that uid appears ONCE more
-- here, as a data value for the backfill, NOT in any security predicate. After this
-- migration no policy references a literal uid. Anon (auth.uid() is null) still sees
-- nothing; the current owner's access is unchanged.
--
-- This is also the exact foundation multi-account needs (parked A20 / the
-- everyone-their-own-notebook door): de-hardcoding and that door are one change.
--
-- Additive + app-transparent: same policy NAMES, new predicate; app inserts are
-- untouched — owner_id fills itself from the default on every insert.
-- Proven on a throwaway copy first: verification/run-ownership-native.sh.

do $$
declare
  -- the current single owner — used ONCE, to backfill rows that predate this column.
  -- After this migration NO policy references a literal uid; ownership is per-row.
  legacy_owner constant uuid := '298fbf29-39c8-4738-96d0-3348f0e59fd0';
  t text;
begin
  foreach t in array array[
    'category', 'tag', 'subtype_word', 'bit', 'board',
    'tag_application', 'placement', 'connector', 'dormant', 'source', 'reference'
  ]
  loop
    -- 1. add nullable, so existing rows survive the ADD
    execute format('alter table public.%I add column owner_id uuid', t);
    -- 2. backfill existing rows to the current owner (their only sensible provenance)
    execute format('update public.%I set owner_id = %L where owner_id is null', t, legacy_owner);
    -- 3. new rows own themselves — the inserting user, read from the JWT
    execute format('alter table public.%I alter column owner_id set default auth.uid()', t);
    -- 4. now that every row has one, enforce it
    execute format('alter table public.%I alter column owner_id set not null', t);
    -- 5. index it — the RLS predicate filters on it on every read
    execute format('create index %I on public.%I (owner_id)', t || '_owner', t);
    -- 6. swap the predicate: the hardcoded uid → per-row ownership (same policy name)
    execute format(
      'alter policy %I on public.%I using (auth.uid() = owner_id) with check (auth.uid() = owner_id)',
      t || '_owner_all', t
    );
  end loop;
end $$;
