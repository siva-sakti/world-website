-- Owner-scoped RLS hardening (D-094).
--
-- v1 shipped every table as `for all to authenticated using (true) with check
-- (true)` — ANY authenticated identity had full read+write, so "owner-only" rode
-- entirely on Supabase signups being disabled (config, not the database). With a
-- live deploy and signups open, that left the owner's data reachable by anyone
-- who signed up. This locks every table to the single owner's uid instead: a
-- second account (even a stranger who signs up) can neither read (USING) nor
-- write (WITH CHECK) any row. The owner keeps full access unchanged; logged-out
-- (anon → auth.uid() is null) continues to see nothing.
--
-- Single-user app: the owner uid is resolved from auth.users at hardening time.
-- Additive — the proven init migration is untouched; this only tightens the
-- nine owner_all policies via ALTER POLICY (same names, new predicate).
-- Re-scope when a second identity ever becomes legitimate (the privacy gradient).

do $$
declare
  owner constant uuid := '298fbf29-39c8-4738-96d0-3348f0e59fd0';
  t text;
begin
  foreach t in array array[
    'category', 'tag', 'subtype_word', 'bit', 'board',
    'tag_application', 'placement', 'connector', 'dormant'
  ]
  loop
    execute format(
      'alter policy %I on %I using (auth.uid() = %L) with check (auth.uid() = %L)',
      t || '_owner_all', t, owner, owner
    );
  end loop;
end $$;
